import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order_item/entities/order_item.entity';
import { Product } from '../product/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // User create order
  async create(userId: number, dto: CreateOrderDto) {
    const cartKey = `cart:${userId}`;
    const cart: Record<string, number> = await this.cacheManager.get(cartKey) || {};

    console.log("cart",cartKey, cart);

    if (!cart || Object.keys(cart).length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: any[] = [];

      for (const [productIdStr, quantity] of Object.entries(cart)) {
        const productId = parseInt(productIdStr, 10);

        const product = await queryRunner.manager.findOne(Product, {
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product || product.stock < quantity) {
          throw new BadRequestException(`Sản phẩm ${product?.name || productId} không đủ số lượng`);
        }

        // Trừ stock
        product.stock -= quantity;
        await queryRunner.manager.save(product);

        totalAmount += product.price * quantity;

        orderItems.push(queryRunner.manager.create(OrderItem, {
          productId: product.id,
          quantity: quantity,
          priceAtPurchase: product.price,
        }));
      }

      // Tạo Order
      const newOrder = queryRunner.manager.create(Order, {
        userId: userId,
        shippingAddress: dto.shipping_address,
        totalAmount: totalAmount,
        status: 'PENDING',
      });
      const savedOrder = await queryRunner.manager.save(newOrder);

      for (const item of orderItems) {
        item.orderId = savedOrder.id;
      }
      await queryRunner.manager.save(orderItems);
      await queryRunner.commitTransaction();
      // Xóa Giỏ hàng
      await this.cacheManager.del(cartKey);
      this.eventEmitter.emit('order.created', savedOrder);

      return {
        id: savedOrder.id,
        total_amount: savedOrder.totalAmount,
        status: savedOrder.status,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // User cancel order
  async cancelByUser(orderId: number, userId: number, dto: CancelOrderDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { orderItems: true }
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.userId !== userId) throw new ForbiddenException('Không có quyền hủy đơn hàng này');
    if (order.status !== 'PENDING') throw new BadRequestException('Chỉ có thể hủy đơn hàng đang chờ xác nhận');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hoàn lại Stock
      for (const item of order.orderItems) {
        await queryRunner.manager.increment(Product, { id: item.productId }, 'stock', item.quantity);
      }
      order.status = 'CANCELLED';
      order.cancelReason = dto.cancel_reason || 'Người dùng hủy';
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      return { id: order.id, status: order.status, cancel_reason: order.cancelReason };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Admin update status order
  async updateStatusByAdmin(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { orderItems: true }
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (dto.status === 'REJECTED' && order.status === 'PENDING') {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        for (const item of order.orderItems) {
          await queryRunner.manager.increment(Product, { id: item.productId }, 'stock', item.quantity);
        }
        order.status = dto.status;
        order.cancelReason = dto.cancel_reason || '';
        await queryRunner.manager.save(order);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } else {
      order.status = dto.status;
      if (dto.cancel_reason) order.cancelReason = dto.cancel_reason;
      await this.orderRepository.save(order);
    }

    this.eventEmitter.emit('order.status_updated', order);

    return { id: order.id, status: order.status, cancel_reason: order.cancelReason };
  }

  // User get all orders
  async findAllByUser(userId: number, options: IPaginationOptions) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    return paginate<Order>(queryBuilder, options);
  }

  // User get order detail
  async findOne(id: number) {
    const order = await this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .where('order.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  async findAllForAdmin(options: { status?: string; page: number; limit: number }) {
    const whereCondition = options.status ? { status: options.status } : {};
    const [items, total] = await this.orderRepository.findAndCount({
      where: whereCondition,
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      order: { createdAt: 'DESC' },
    });
    return { items, meta: { total, page: options.page, limit: options.limit } };
  }
}