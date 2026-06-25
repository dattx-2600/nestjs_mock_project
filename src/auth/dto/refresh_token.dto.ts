import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class Refresh_tokenDto {
  @ApiProperty({
    example:
      '1b865fcd4d5a9dbcf633beca00b478fd9bc43439ee84cdcd95fd3eaeffbdf71f28445934f5d50588',
  })
  @IsNotEmpty()
  refresh_token: string;
}