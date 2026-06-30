import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({
    message: i18nValidationMessage('product.validation.category_id_not_empty'),
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: 'Product 01' })
  @IsNotEmpty({
    message: i18nValidationMessage('product.validation.name_not_empty'),
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Product 01 description' })
  @IsNotEmpty({
    message: i18nValidationMessage('product.validation.description_not_empty'),
  })
  @IsString()
  description: string;

  @ApiProperty({ example: 100000 })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0, { message: i18nValidationMessage('product.validation.price_min') })
  price: number;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0, { message: i18nValidationMessage('product.validation.stock_min') })
  stock: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Tải lên tối đa 10 hình ảnh',
  })
  @IsOptional()
  images?: any[];
}
