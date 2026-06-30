import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { AdminOrderController } from './admin-order.controller';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';
import { OrderItem } from '../order_item/entities/order_item.entity';
import { Product } from '../product/entities/product.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product]),
    CacheModule.register(),
  ],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService],
})
export class OrderModule {}