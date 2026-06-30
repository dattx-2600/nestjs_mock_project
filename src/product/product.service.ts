import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { I18nService } from 'nestjs-i18n';
import { paginate, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { ProductQueryDto } from './dto/product-query.dto';
import { Attachment } from '../attachment/entities/attachment.entity';
import { join } from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly i18n: I18nService,
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto, files: any[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newProduct = queryRunner.manager.create(Product, createProductDto);
      const savedProduct = await queryRunner.manager.save(newProduct);

      if (files && files.length > 0) {
        const attachmentEntities = files.map((file) => {
          // Truyền class Entity (Attachment) vào hàm create
          return queryRunner.manager.create(Attachment, {
            entityType: 'PRODUCT',
            entityId: savedProduct.id,
            fileName: file.filename,
            filePath: file.path,
            contentType: file.mimetype,
            filesize: file.size,
            product: { id: savedProduct.id },
          });
        });
        await queryRunner.manager.save(attachmentEntities);
      }

      await queryRunner.commitTransaction();

      return await this.findOne(savedProduct.id);

    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(queryDto: ProductQueryDto, options: IPaginationOptions) {
    const { keyword, categoryId } = queryDto;
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect(
        'product.attachments',
        'attachments',
        "attachments.entityType = 'PRODUCT'"
      )
      .orderBy('product.createdAt', 'DESC');

    if (keyword) {
      queryBuilder.andWhere(
        '(product.name LIKE :keyword OR product.description LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    return paginate<Product>(queryBuilder, options);
  }

  async findOne(id: number) {
    const product = await this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect(
        'product.attachments',
        'attachments',
        "attachments.entityType = 'PRODUCT'"
      )
      .where('product.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException(
        this.i18n.t('product.error.not_found', { args: { id } }),
      );
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, files: any[]) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let oldPhysicalFilePaths: string[] = [];

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id },
        relations: { attachments: true },
      });

      if (!product) {
        throw new NotFoundException(this.i18n.t('product.error.not_found', { args: { id } }));
      }

      if (Object.keys(updateProductDto).length > 0) {
        await queryRunner.manager.update(Product, id, updateProductDto);
      }

      if (files && files.length > 0) {
        if (product.attachments && product.attachments.length > 0) {
          oldPhysicalFilePaths = product.attachments.map((oldAtt) =>
            join(process.cwd(), oldAtt.filePath)
          );

          await queryRunner.manager.delete(Attachment, {
            entityType: 'PRODUCT',
            entityId: id,
          });
        }

        const newAttachmentEntities = files.map((file) => {
          return queryRunner.manager.create(Attachment, {
            entityType: 'PRODUCT',
            entityId: id,
            fileName: file.filename,
            filePath: file.path,
            contentType: file.mimetype,
            filesize: file.size,
            product: { id: id },
          });
        });
        await queryRunner.manager.save(newAttachmentEntities);
      }

      await queryRunner.commitTransaction();

      if (oldPhysicalFilePaths.length > 0) {
        for (const filePath of oldPhysicalFilePaths) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      return await this.findOne(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);

    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    try {
      await this.productRepository.softRemove(product);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }

    return {
      message: this.i18n.t('product.success.deleted', { args: { id } }),
    };
  }
}