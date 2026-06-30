import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { OrderItem } from '../order_item/entities/order_item.entity';
import { Category } from '../category/entities/category.entity';
import { Attachment } from '../attachment/entities/attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, OrderItem, Category, Attachment])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
