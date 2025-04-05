"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/prisma/seed.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Start seeding ...`);
        // --- Tạo Users (Admin, Manager, Customer) ---
        const hashedPasswordAdmin = yield bcryptjs_1.default.hash('admin123', 10);
        yield prisma.user.upsert({ where: { username: 'admin' }, update: {}, create: { username: 'admin', passwordHash: hashedPasswordAdmin, role: client_1.Role.ADMIN } });
        const hashedPasswordManager = yield bcryptjs_1.default.hash('manager123', 10);
        yield prisma.user.upsert({ where: { username: 'manager' }, update: {}, create: { username: 'manager', passwordHash: hashedPasswordManager, role: client_1.Role.MANAGER } });
        const hashedPasswordCustomer = yield bcryptjs_1.default.hash('customer123', 10);
        yield prisma.user.upsert({ where: { username: 'customer' }, update: {}, create: { username: 'customer', passwordHash: hashedPasswordCustomer, role: client_1.Role.CUSTOMER } });
        console.log('Users seeded.');
        // --- Tạo Services và Images (dữ liệu mẫu đầy đủ) ---
        const servicesData = [
            {
                name: 'Buffet bữa sáng',
                price: 100000, // Giá đã chuyển thành số
                description: 'Bắt đầu từ 5:30 đến 9:30',
                // Giả định có ảnh placeholder và ảnh riêng cho buffet
                images: ['/images/placeholder.jpg', '/images/buffet1.jpg']
            },
            {
                name: 'Buffet bữa trưa',
                price: 299000,
                description: 'Bắt đầu từ 11:00 đến 13:00',
                images: ['/images/placeholder.jpg'] // Chỉ dùng placeholder
            },
            {
                name: 'Buffet bữa tối',
                price: 349000,
                description: 'Bắt đầu từ 17:30 đến 21:00',
                images: ['/images/placeholder.jpg', '/images/buffet2.jpg']
            },
            {
                name: 'Ăn sáng tại phòng',
                price: 79000,
                description: 'Giá tính cho 1 người, chưa bao gồm tiền tip',
                images: ['/images/placeholder.jpg']
            },
            {
                name: 'Ăn trưa tại phòng',
                price: 149000,
                description: 'Giá tính cho 1 người, chưa bao gồm tiền tip',
                images: ['/images/placeholder.jpg']
            },
            {
                name: 'Ăn tối tại phòng',
                price: 249000,
                description: 'Giá tính cho 1 người, chưa bao gồm tiền tip',
                images: ['/images/placeholder.jpg']
            },
            {
                name: 'Massage tại phòng',
                price: 400000,
                description: 'Giá cho 1 nhân viên phục vụ, chưa bao gồm tiền tip',
                images: ['/images/placeholder.jpg', '/images/massage.jpg'] // Giả định có ảnh massage
            },
            {
                name: 'Giặt ủi',
                price: 50000,
                description: 'Giá cho 1 kg quần áo',
                images: ['/images/placeholder.jpg']
            },
            {
                name: 'Két sắt giữ đồ',
                price: 50000,
                description: 'Giá cho 1 ngày',
                images: ['/images/placeholder.jpg']
            },
            {
                name: 'Đưa đón từ sân bay',
                price: 100000,
                description: 'Cho 1 khách',
                images: ['/images/placeholder.jpg', '/images/airport.jpg'] // Giả định có ảnh đưa đón
            },
        ];
        for (const serviceData of servicesData) {
            const service = yield prisma.service.create({
                data: {
                    name: serviceData.name, price: serviceData.price, description: serviceData.description,
                    images: { create: serviceData.images.map(url => ({ url })) },
                },
            });
            console.log(`Created service: ${service.name}`);
        }
        console.log(`Seeding finished.`);
    });
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => __awaiter(void 0, void 0, void 0, function* () { yield prisma.$disconnect(); }));
