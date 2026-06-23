import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {OrderItem} from '../../order_item/entities/order_item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'user_id'})
  userId: number;

  @Column()
  status: string; //Enum: PENDING, CONFIRMED, REJECTED, CANCELED

  @Column({type: 'decimal', name: 'total_amount'})
  totalAmount: number;

  @Column({name: 'shipping_address'})
  shippingAddress: string;

  @Column({name: 'cancel_reason'})
  cancelReason: string;

  @CreateDateColumn({name: 'created_at'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at'})
  updatedAt: Date;

  @ManyToOne(type => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(type => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];
}
