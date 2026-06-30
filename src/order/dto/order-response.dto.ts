export class OrderItemResponseDto {
  id: number;
  productId: number;
  quantity: number;
  priceAtPurchase: number;

  constructor(item: any) {
    this.id = item.id;
    this.productId = item.productId;
    this.quantity = item.quantity;
    this.priceAtPurchase = item.priceAtPurchase;
    // Nếu bạn có join bảng Product thì map thêm ở đây
    // this.productName = item.product?.name;
  }
}

export class OrderResponseDto {
  id: number;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  cancelReason?: string;
  createdAt: Date;
  orderItems: OrderItemResponseDto[];

  constructor(order: any) {
    this.id = order.id;
    this.status = order.status;
    this.totalAmount = order.totalAmount;
    this.shippingAddress = order.shippingAddress;
    this.cancelReason = order.cancelReason;
    this.createdAt = order.createdAt;

    if (order.orderItems) {
      this.orderItems = order.orderItems.map((item) => new OrderItemResponseDto(item));
    } else {
      this.orderItems = [];
    }
  }
}