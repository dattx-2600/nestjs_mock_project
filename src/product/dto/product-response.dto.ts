import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class ProductResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  description: string;

  @Expose()
  stock: number;

  @Expose({ name: 'is_featured' })
  isFeatured: boolean;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.attachments || obj.attachments.length === 0) return null;
    return `http://localhost:3000/attachment/${obj.attachments[0].id}`;
  })
  image_url: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.attachments || obj.attachments.length === 0) return [];
    return obj.attachments.map(
      (att: any) => `http://localhost:3000/attachment/${att.id}`
    );
  })
  image_urls: string[];

  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    return {
      id: value.id,
      name: value.name,
    };
  })
  category: any;

  constructor(partial: Partial<any>) {
    Object.assign(this, partial);
  }
}