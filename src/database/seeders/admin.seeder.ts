import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function adminSeeder(dataSource: DataSource) {
  console.log('--- Đang chạy Admin Seeder ---');
  const repository = dataSource.getRepository(User);
  const adminEmail = 'admin@gmail.com';

  const exists = await repository.findOneBy({ email: adminEmail });
  if (!exists) {
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    const adminUser = repository.create({
      email: adminEmail,
      password: hashedPassword,
      fullName: 'System Admin',
      role: 'ADMIN',
    });

    await repository.save(adminUser);
    console.log(`Đã tạo Admin: ${adminEmail}`);
  } else {
    console.log(`Bỏ qua Admin: ${adminEmail}`);
  }
}
