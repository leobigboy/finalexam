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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/prisma/seed.ts
var client_1 = require("@prisma/client");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPasswordAdmin, hashedPasswordManager, hashedPasswordCustomer, servicesData, _i, servicesData_1, serviceData, service;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Start seeding ...");
                    return [4 /*yield*/, bcryptjs_1.default.hash('admin123', 10)];
                case 1:
                    hashedPasswordAdmin = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({ where: { username: 'admin' }, update: {}, create: { username: 'admin', passwordHash: hashedPasswordAdmin, role: client_1.Role.ADMIN } })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash('manager123', 10)];
                case 3:
                    hashedPasswordManager = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({ where: { username: 'manager' }, update: {}, create: { username: 'manager', passwordHash: hashedPasswordManager, role: client_1.Role.MANAGER } })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash('customer123', 10)];
                case 5:
                    hashedPasswordCustomer = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({ where: { username: 'customer' }, update: {}, create: { username: 'customer', passwordHash: hashedPasswordCustomer, role: client_1.Role.CUSTOMER } })];
                case 6:
                    _a.sent();
                    console.log('Users seeded.');
                    servicesData = [
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
                    _i = 0, servicesData_1 = servicesData;
                    _a.label = 7;
                case 7:
                    if (!(_i < servicesData_1.length)) return [3 /*break*/, 10];
                    serviceData = servicesData_1[_i];
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                name: serviceData.name, price: serviceData.price, description: serviceData.description,
                                images: { create: serviceData.images.map(function (url) { return ({ url: url }); }) },
                            },
                        })];
                case 8:
                    service = _a.sent();
                    console.log("Created service: ".concat(service.name));
                    _a.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log("Seeding finished.");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) { console.error(e); process.exit(1); }).finally(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, prisma.$disconnect()];
        case 1:
            _a.sent();
            return [2 /*return*/];
    }
}); }); });
