// server/src/auth.ts
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1);
}

interface JwtPayload {
  userId: string;
  role: Role;
  iat: number;
  exp: number;
}

export type UserAuthInfo = { id: string; role: Role } | null; // Export kiểu này

export const getUserFromToken = async (token: string, prisma: PrismaClient): Promise<UserAuthInfo> => {
  if (!token) {
    return null;
  }

  const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : null;
  if (!tokenValue) {
      return null;
  }

  try {
    const decoded = jwt.verify(tokenValue, JWT_SECRET) as JwtPayload;

    const userExists = await prisma.user.findUnique({
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

  } catch (error) {
    // console.error('Token verification failed:', error); // Bỏ comment nếu cần debug
    return null;
  }
};