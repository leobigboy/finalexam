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
// server/src/index.ts
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const schema_1 = require("./schema"); // Import schema đã định nghĩa
const resolvers_1 = require("./resolvers"); // Import resolvers đã triển khai
const auth_1 = require("./auth"); // Import hàm xác thực và kiểu trả về
require("dotenv/config"); // Load biến môi trường từ .env
const path_1 = __importDefault(require("path")); // Import path để xử lý đường dẫn file tĩnh
// --- Khởi tạo Prisma Client ---
const prisma = new client_1.PrismaClient();
function startApolloServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        // Tạo HTTP server để tích hợp với Express và Apollo Server
        const httpServer = http_1.default.createServer(app);
        // --- Khởi tạo Apollo Server ---
        const server = new server_1.ApolloServer({
            typeDefs: schema_1.typeDefs, // Schema GraphQL
            resolvers: // Schema GraphQL
            resolvers_1.resolvers, // Logic xử lý query/mutation
            plugins: [
                // Plugin để đóng HTTP server một cách gọn gàng khi Apollo Server dừng
                (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer })
            ],
            // Bật introspection để dùng GraphQL Playground/Sandbox trong môi trường development
            // Tắt introspection trong môi trường production để tăng bảo mật
            introspection: process.env.NODE_ENV !== 'production',
        });
        // Khởi động Apollo Server
        yield server.start();
        // --- Cấu hình Express Middleware ---
        // CORS: Cho phép truy cập từ các origin khác (quan trọng khi frontend chạy trên port khác)
        // Cấu hình chặt chẽ hơn trong production (chỉ cho phép origin của frontend)
        app.use((0, cors_1.default)());
        // Middleware để parse JSON request body
        app.use(express_1.default.json());
        // Serve thư mục public/images như là file tĩnh tại route /images
        // Điều này cho phép truy cập ảnh bằng URL ví dụ: http://<server>/images/placeholder.jpg
        const publicImagesPath = path_1.default.join(__dirname, '../public/images'); // Đường dẫn tuyệt đối đến thư mục ảnh
        app.use('/images', express_1.default.static(publicImagesPath));
        console.log(`Serving static files from: ${publicImagesPath}`);
        // Apollo Server Middleware: Gắn Apollo Server vào endpoint /graphql của Express
        app.use('/graphql', 
        // Đảm bảo CORS được áp dụng cho endpoint GraphQL
        (0, cors_1.default)(), 
        // Middleware của Apollo tích hợp với Express
        (0, express4_1.expressMiddleware)(server, {
            // Hàm context được gọi cho mỗi request GraphQL
            context: (_a) => __awaiter(this, [_a], void 0, function* ({ req }) {
                // Lấy token từ header 'Authorization' (ví dụ: "Bearer <token>")
                const token = req.headers.authorization || '';
                // Gọi hàm xác thực token và lấy thông tin user (nếu token hợp lệ)
                const user = yield (0, auth_1.getUserFromToken)(token, prisma);
                // Trả về context object chứa prisma client và thông tin user (hoặc null)
                // Context này sẽ được truyền vào tất cả các resolver
                return { prisma, currentUser: user };
            }),
        }));
        // --- Khởi động HTTP Server ---
        const PORT = process.env.PORT || 4000;
        yield new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
        console.log(`🚀 Server ready at http://localhost:${PORT}`);
        console.log(` GQL endpoint ready at http://localhost:${PORT}/graphql`);
        // Nhắc nhở về port forwarding trong Codespaces
        console.log(`🎉 Check PORTS tab in Codespaces for the public URL!`);
    });
}
// Gọi hàm để bắt đầu server và bắt lỗi nếu có
startApolloServer().catch(error => {
    console.error("💥 Failed to start server:", error);
    prisma.$disconnect(); // Đảm bảo đóng kết nối Prisma nếu server lỗi
    process.exit(1);
});
// Xử lý việc đóng kết nối Prisma khi ứng dụng thoát
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    process.exit(0);
}));
