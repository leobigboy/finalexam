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
require("dotenv/config");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1);
}
const getUserFromToken = (token, prisma) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        return null;
    }
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : null;
    if (!tokenValue) {
        return null;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(tokenValue, JWT_SECRET);
        const userExists = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true }
        });
        if (!userExists) {
            console.warn(`Token valid but user ${decoded.userId} not found in DB.`);
            return null;
        }
        if (userExists.role !== decoded.role) {
            console.warn(`Token role mismatch for user ${decoded.userId}. Token: ${decoded.role}, DB: ${userExists.role}`);
            return null;
        }
        return { id: userExists.id, role: userExists.role };
    }
    catch (error) {
        // console.error('Token verification failed:', error); // Bỏ comment nếu cần debug
        return null;
    }
});
exports.getUserFromToken = getUserFromToken;
