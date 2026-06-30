import { Injectable, Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
  ) {}

  private getCartKey(userId: number) {
    return `cart:${userId}`;
  }

  private getProductCacheKey(productId: number) {
    return `product:${productId}`;
  }

  async addOrUpdate(userId: number, dto: UpdateCartDto) {
    const key = this.getCartKey(userId);
    let cart: Record<string, number> = await this.cacheManager.get(key) || {};

    // Cập nhật quantity cho product
    cart[dto.productId] = dto.quantity;
    await this.cacheManager.set(key, cart);

    return { id: Date.now(), product_id: dto.productId, quantity: dto.quantity };
  }

  async remove(userId: number, productId: number) {
    const key = this.getCartKey(userId);
    let cart: Record<string, number> = await this.cacheManager.get(key) || {};

    if (cart && cart[productId]) {
      delete cart[productId];
      await this.cacheManager.set(key, cart, 0);
    }
  }

  async getCart(userId: number) {
    const cart: Record<string, number> = await this.cacheManager.get(this.getCartKey(userId)) || {};
    if (!cart) return [];

    const result: any[] = [];
    for (const [productIdStr, quantity] of Object.entries(cart)) {
      const productId = parseInt(productIdStr, 10);
      const productCacheKey = this.getProductCacheKey(productId);

      // Kiểm tra data product trong Redis
      let productData = await this.cacheManager.get(productCacheKey);

      if (!productData) {
        // Query DB nếu chưa có trong Redis
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (product) {
          productData = product;
          // Lưu ngược lại vào Redis
          await this.cacheManager.set(productCacheKey, productData, 3600);
        }
      }

      if (productData) {
        result.push({
          product_id: productId,
          quantity: quantity,
          product: productData,
        });
      }
    }

    return result;
  }
}