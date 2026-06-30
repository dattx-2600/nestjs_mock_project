import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('attachment')
@Index('IDX_ATTACHMENT_ENTITY', ['entityType', 'entityId'])
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entity_type' })
  entityType: string; //'USER', 'PRODUCT'

  @Column({ name: 'entity_id' })
  entityId: number;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'content_type' })
  contentType: string;

  @Column({ name: 'file_size' })
  filesize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Product, (product) => product.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entity_id' })
  product: Product;
}
