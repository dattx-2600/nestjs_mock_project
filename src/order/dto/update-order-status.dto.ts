import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Định nghĩa danh sách các trạng thái hợp lệ của đơn hàng
const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REJECTED'
] as const;

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'REJECTED',
    description: 'Trạng thái cập nhật của đơn hàng',
    enum: ORDER_STATUSES, // Vẽ sẵn menu dropdown trên Swagger
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsString()
  @IsIn(ORDER_STATUSES, {
    message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${ORDER_STATUSES.join(', ')}`
  })
  status: string;

  @ApiPropertyOptional({
    example: 'Sản phẩm tạm thời hết hàng',
    description: 'Lý do từ chối đơn hàng (Nên có nếu status là REJECTED)',
  })
  @IsOptional()
  @IsString({ message: 'Lý do hủy phải là chuỗi văn bản' })
  cancel_reason?: string;
}