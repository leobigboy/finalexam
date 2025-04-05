// server/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
// Đảm bảo các import này đúng

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Tạo Users (Admin, Manager, Customer) ---
  try {
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: { username: 'admin', passwordHash: hashedPasswordAdmin, role: Role.ADMIN }
    });

    const hashedPasswordManager = await bcrypt.hash('manager123', 10);
    await prisma.user.upsert({
        where: { username: 'manager' },
        update: {},
        create: { username: 'manager', passwordHash: hashedPasswordManager, role: Role.MANAGER }
    });

    const hashedPasswordCustomer = await bcrypt.hash('customer123', 10);
    await prisma.user.upsert({
        where: { username: 'customer' },
        update: {},
        create: { username: 'customer', passwordHash: hashedPasswordCustomer, role: Role.CUSTOMER }
    });
    console.log('Users seeded successfully.');
  } catch (error) {
      console.error("Error seeding users:", error);
      throw error; // Ném lỗi để dừng quá trình seed nếu tạo user thất bại
  }


  // --- Tạo Services và Images (dữ liệu mẫu đầy đủ) ---
  const servicesData = [
    { name: 'Buffet bữa sáng', price: 100000, description: 'Bắt đầu từ 5:30 đến 9:30', images: ['/images/placeholder.jpg', '/images/buffet1.jpg'] },
    { name: 'Buffet bữa trưa', price: 299000, description: 'Bắt đầu từ 11:00 đến 13:00', images: ['/images/placeholder.jpg'] },
    { name: 'Buffet bữa tối', price: 349000, description: 'Bắt đầu từ 17:30 đến 21:00', images: ['/images/placeholder.jpg', '/images/buffet2.jpg'] },
    { name: 'Ăn sáng tại phòng', price: 79000, description: 'Giá tính cho 1 người, chưa bao gồm tiền tip', images: ['/images/placeholder.jpg'] },
    { name: 'Ăn trưa tại phòng', price: 149000, description: 'Giá tính cho 1 người, chưa bao gồm tiền tip', images: ['/images/placeholder.jpg'] },
    { name: 'Ăn tối tại phòng', price: 249000, description: 'Giá tính cho 1 người, chưa bao gồm tiền tip', images: ['/images/placeholder.jpg'] },
    { name: 'Massage tại phòng', price: 400000, description: 'Giá cho 1 nhân viên phục vụ, chưa bao gồm tiền tip', images: ['/images/placeholder.jpg', '/images/massage.jpg'] },
    { name: 'Giặt ủi', price: 50000, description: 'Giá cho 1 kg quần áo', images: ['/images/placeholder.jpg'] },
    { name: 'Két sắt giữ đồ', price: 50000, description: 'Giá cho 1 ngày', images: ['/images/placeholder.jpg'] },
    { name: 'Đưa đón từ sân bay', price: 100000, description: 'Cho 1 khách', images: ['/images/placeholder.jpg', '/images/airport.jpg'] },
  ];

  console.log(`Seeding ${servicesData.length} services...`);
  for (const serviceData of servicesData) {
      try {
        const service = await prisma.service.create({
          data: {
            name: serviceData.name,
            price: serviceData.price,
            description: serviceData.description,
            images: {
              create: serviceData.images.map(url => ({ url })),
            },
          },
        });
        console.log(` -> Created service: ${service.name} (ID: ${service.id})`);
      } catch(error) {
           console.error(`Error creating service "${serviceData.name}":`, error);
           // Quyết định xem có nên dừng lại nếu một service lỗi không
           // throw error;
      }
  }

  console.log(`Seeding finished.`);
}

// Chạy hàm main và xử lý lỗi / đóng kết nối
main()
  .catch((e) => {
    console.error("Unhandled error during seeding:", e);
    // Dòng này gây lỗi nếu @types/node chưa được nhận diện
    process.exit(1); // Thoát với mã lỗi
  })
  .finally(async () => {
    console.log('Disconnecting Prisma Client...');
    await prisma.$disconnect(); // Đảm bảo đóng kết nối Prisma
  });