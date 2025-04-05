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
exports.getUserFromToken = void 0;
// server/src/auth.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config"); // Đảm bảo biến môi trường được load
// Lấy JWT_SECRET từ biến môi trường, có giá trị mặc định dự phòng
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1); // Thoát nếu thiếu khóa bí mật
}
const getUserFromToken = (token, prisma) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        return null;
    }
    // Token thường có dạng "Bearer <token>", cần tách lấy phần token
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : null;
    if (!tokenValue) {
        return null; // Không có token hoặc định dạng sai
    }
    try {
        // Xác thực token bằng khóa bí mật
        const decoded = jsonwebtoken_1.default.verify(tokenValue, JWT_SECRET);
        // (Tùy chọn nhưng nên có) Kiểm tra xem user có còn tồn tại trong DB không
        // Điều này tránh trường hợp token vẫn hợp lệ nhưng user đã bị xóa
        const userExists = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true } // Chỉ lấy id và role cho nhẹ
        });
        if (!userExists) {
            console.warn(`Token valid but user ${decoded.userId} not found in DB.`);
            return null; // User không tồn tại
        }
        // Kiểm tra xem role trong token có khớp với role trong DB không (tăng cường bảo mật)
        if (userExists.role !== decoded.role) {
            console.warn(`Token role mismatch for user ${decoded.userId}. Token: ${decoded.role}, DB: ${userExists.role}`);
            return null; // Có sự không khớp, có thể token cũ hoặc bị giả mạo
        }
        // Trả về id và role từ thông tin đã xác thực và kiểm tra trong DB
        return { id: userExists.id, role: userExists.role };
    }
    catch (error) {
        // Lỗi xảy ra nếu token hết hạn hoặc không hợp lệ
        // console.error('Token verification failed:', error); // Log lỗi nếu cần debug
        return null;
    }
});
exports.getUserFromToken = getUserFromToken;
