import { AppDataSource } from '../../../data-source';
import { categorySeeder } from './category.seeder';
import { adminSeeder } from './admin.seeder';

async function runSeeder() {
  try {
    // 1. Khởi tạo kết nối DB
    await AppDataSource.initialize();
    console.log('✅ Đã kết nối Database!');

    // 2. Gọi seeder
    await categorySeeder(AppDataSource);
    await adminSeeder(AppDataSource);

    console.log('TOÀN BỘ QUÁ TRÌNH SEEDING THÀNH CÔNG!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi trong quá trình Seeding:', error);
    process.exit(1);
  }
}

runSeeder();
