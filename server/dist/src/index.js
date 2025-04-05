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
const schema_1 = require("./schema");
const resolvers_1 = require("./resolvers");
const auth_1 = require("./auth");
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
function startApolloServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const httpServer = http_1.default.createServer(app);
        const server = new server_1.ApolloServer({
            typeDefs: schema_1.typeDefs,
            resolvers: resolvers_1.resolvers,
            plugins: [(0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer })],
            introspection: process.env.NODE_ENV !== 'production',
        });
        yield server.start();
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        const publicImagesPath = path_1.default.join(__dirname, '../public/images');
        app.use('/images', express_1.default.static(publicImagesPath));
        console.log(`Serving static files from: ${publicImagesPath}`);
        app.use('/graphql', (0, cors_1.default)(), 
        // --- SỬA LỖI: Thêm 'as any' để bỏ qua kiểm tra kiểu ---
        (0, express4_1.expressMiddleware)(server, {
            context: (_a) => __awaiter(this, [_a], void 0, function* ({ req }) {
                const token = req.headers.authorization || '';
                const user = yield (0, auth_1.getUserFromToken)(token, prisma);
                return { prisma, currentUser: user };
            }),
        }) // <<< BỎ COMMENT HOẶC THÊM DÒNG NÀY
        // --- Kết thúc sửa lỗi ---
        );
        const PORT = process.env.PORT || 4000;
        yield new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
        console.log(`🚀 Server ready at http://localhost:${PORT}`);
        console.log(` GQL endpoint ready at http://localhost:${PORT}/graphql`);
        console.log(`🎉 Check PORTS tab in Codespaces for the public URL!`);
    });
}
startApolloServer().catch(error => {
    console.error("💥 Failed to start server:", error);
    prisma.$disconnect();
    process.exit(1);
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () { yield prisma.$disconnect(); process.exit(0); }));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () { yield prisma.$disconnect(); process.exit(0); }));
