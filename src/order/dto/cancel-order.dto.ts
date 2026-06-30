import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    example: 'Đổi ý không mua nữa',
    description: 'Lý do người dùng muốn hủy đơn hàng (Không bắt buộc)',
    minLength: 5,
    maxLength: 255,
  })
  @IsOptional() // Cho phép trường này trống hoặc không truyền lên
  @IsString({ message: 'Lý do hủy đơn hàng phải là chuỗi văn bản' })
  @Length(5, 255, { message: 'Lý do hủy phải từ 5 đến 255 ký tự' })
  cancel_reason?: string;
}