// server/src/index.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express, { Request, Response, NextFunction } from 'express'; // Đảm bảo import đủ kiểu
import http from 'http';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { getUserFromToken, UserAuthInfo } from './auth'; // Vẫn import nhưng tạm thời không dùng trong context
import 'dotenv/config';
import path from 'path';

// Định nghĩa kiểu cho Context
export interface MyContext {
  prisma: PrismaClient;
  currentUser: UserAuthInfo | null;
}

// Khởi tạo Prisma Client
const prisma = new PrismaClient();

async function startApolloServer() {
  // Tạo Express app và HTTP server
  const app = express();
  const httpServer = http.createServer(app);

  // Khởi tạo Apollo Server
  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    // Tắt introspection trong production
    introspection: process.env.NODE_ENV !== 'production',
  });

  // Khởi động Apollo Server
  await server.start();

  // --- Cấu hình Express Middleware ---

  // 1. CORS toàn cục
  app.use(cors<cors.CorsRequest>());

  // 2. Middleware parse JSON body (QUAN TRỌNG: Phải trước Apollo Middleware)
  app.use(express.json());

  // 3. Middleware serve file tĩnh từ thư mục public/images tại route /images
  const publicImagesPath = path.join(__dirname, '../public/images');
  app.use('/images', express.static(publicImagesPath));
  console.log(`Serving static files from: ${publicImagesPath}`);

  // 4. Middleware của Apollo Server cho endpoint /graphql
  app.use(
    '/graphql',
    // cors<cors.CorsRequest>(), // Không cần CORS ở đây nữa vì đã có ở trên
    expressMiddleware<MyContext>(server, {
      // --- CONTEXT ĐÃ ĐƯỢC ĐƠN GIẢN HÓA ---
      context: async ({ req }): Promise<MyContext> => {
          // Tạm thời không xử lý token/user để debug lỗi "req.body"
          // const token = req.headers.authorization || '';
          // const user = await getUserFromToken(token, prisma);
          // console.log('Simplified context executing'); // Bỏ comment nếu cần log
          return { prisma, currentUser: null }; // Luôn trả về context tối thiểu
      },
      // --- KẾT THÚC ĐƠN GIẢN HÓA ---
    }) as any // <<< Giữ lại 'as any' để bỏ qua lỗi type TS2769 nếu nó vẫn xuất hiện
  );

  // --- Khởi động HTTP Server ---
  const PORT = process.env.PORT || 4000;
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(` GQL endpoint ready at http://localhost:${PORT}/graphql`);
  console.log(`🎉 Check PORTS tab in Codespaces for the public URL!`);
}

// Chạy server và xử lý lỗi
startApolloServer().catch(error => {
  console.error("💥 Failed to start server:", error);
  prisma.$disconnect();
  process.exit(1);
});

// Đảm bảo đóng kết nối Prisma khi thoát ứng dụng
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client disconnected on SIGINT');
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client disconnected on SIGTERM');
  process.exit(0);
});