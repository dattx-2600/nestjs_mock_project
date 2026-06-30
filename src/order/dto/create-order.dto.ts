import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: '123 P. X, Q. Y',
    description: 'Địa chỉ nhận hàng chi tiết của người mua',
    minLength: 10,
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  @IsString({ message: 'Địa chỉ giao hàng phải là chuỗi văn bản' })
  @Length(10, 500, { message: 'Địa chỉ giao hàng phải có độ dài từ 10 đến 500 ký tự' })
  shipping_address: string;
}