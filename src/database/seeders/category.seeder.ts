import { DataSource } from 'typeorm';
import { Category } from '../../category/entities/category.entity';

export async function categorySeeder(dataSource: DataSource) {
  console.log('--- Đang chạy Category Seeder ---');
  const repository = dataSource.getRepository(Category);

  const categoriesData = [
    { name: 'Điện thoại', description: 'Các dòng smartphone mới nhất' },
    { name: 'Laptop', description: 'Máy tính xách tay phục vụ công việc và gaming' },
    { name: 'Phụ kiện', description: 'Tai nghe, chuột, sạc dự phòng, cáp kết nối' },
    { name: 'Thời trang', description: 'Quần áo, giày dép, phụ kiện thời trang' },
  ];

  for (const data of categoriesData) {
    const exists = await repository.findOneBy({ name: data.name });
    if (!exists) {
      await repository.save(repository.create(data));
      console.log(`Đã tạo danh mục: ${data.name}`);
    } else {
      console.log(`Bỏ qua danh mục: ${data.name}`);
    }
  }
}