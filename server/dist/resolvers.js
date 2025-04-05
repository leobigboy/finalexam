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
exports.resolvers = void 0;
// server/src/resolvers.ts
const graphql_1 = require("graphql");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client"); // Import Prisma và Role enum
// import { Resolvers } from './generated/graphql-types'; // Bỏ comment nếu dùng graphql-codegen
require("dotenv/config"); // Đảm bảo biến môi trường được load
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1);
}
// --- Helper function tạo thông tin phân trang ---
const createPageInfo = (totalItems, skip, take) => {
    // Đảm bảo take > 0 để tránh lỗi chia cho 0
    const safeTake = Math.max(1, take);
    const currentPage = Math.floor(skip / safeTake) + 1;
    const totalPages = Math.ceil(totalItems / safeTake);
    const itemCountOnPage = Math.min(safeTake, Math.max(0, totalItems - skip)); // Số item thực tế trên trang
    return {
        totalItems,
        itemCount: itemCountOnPage,
        itemsPerPage: safeTake,
        totalPages,
        currentPage,
        hasNextPage: skip + safeTake < totalItems,
        hasPreviousPage: skip > 0,
    };
};
// --- Define Resolvers ---
// Sử dụng any nếu không dùng code-gen, hoặc Resolvers<MyContext> nếu có
exports.resolvers = {
    // Scalar resolver cho DateTime (nếu không dùng thư viện khác)
    DateTime: {
        parseValue(value) { return new Date(value); }, // value from the client
        serialize(value) { return value.toISOString(); }, // value sent to the client
        parseLiteral(ast) {
            if (ast.kind === 'StringValue' || ast.kind === 'IntValue') {
                return new Date(ast.value); // ast value is always in string format
            }
            return null;
        },
    },
    Query: {
        hello: () => 'Hello from Thien Huong Service API!',
        services: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { skip = 0, take = 10, sortBy, filterByPrice, searchQuery } = args;
            const { prisma } = context;
            // --- Build WHERE clause ---
            const where = {};
            // Lọc giá
            if (filterByPrice) {
                where.price = {};
                if (typeof filterByPrice.min === 'number') {
                    where.price.gte = filterByPrice.min;
                }
                if (typeof filterByPrice.max === 'number') {
                    where.price.lte = filterByPrice.max;
                }
                // Nếu chỉ có min hoặc max mà giá trị còn lại không hợp lệ -> bỏ qua lọc giá đó
                if (Object.keys(where.price).length === 0) {
                    delete where.price;
                }
            }
            // Tìm kiếm
            if (searchQuery && searchQuery.trim()) {
                const trimmedQuery = searchQuery.trim();
                where.OR = [
                    { name: { contains: trimmedQuery, mode: 'insensitive' } },
                    { description: { contains: trimmedQuery, mode: 'insensitive' } },
                ];
            }
            // --- Build ORDER BY clause ---
            const orderBy = {};
            // Chỉ chấp nhận các trường được phép sort trong enum ServiceSortField
            const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
            if (sortBy && allowedSortFields.includes(sortBy.field)) {
                orderBy[sortBy.field] = sortBy.order;
            }
            else {
                orderBy.createdAt = 'desc'; // Sắp xếp mặc định
            }
            // --- Fetch data and total count ---
            try {
                const [items, totalItems] = yield prisma.$transaction([
                    prisma.service.findMany({
                        where,
                        orderBy,
                        skip: Math.max(0, skip), // Đảm bảo skip không âm
                        take: Math.max(1, take), // Đảm bảo take ít nhất là 1
                        include: { images: true }, // Luôn kèm ảnh
                    }),
                    prisma.service.count({ where }), // Đếm tổng số item thỏa mãn điều kiện lọc/tìm kiếm
                ]);
                // --- Create PageInfo ---
                const pageInfo = createPageInfo(totalItems, skip, take);
                return { items, pageInfo };
            }
            catch (error) {
                console.error("Error fetching services:", error);
                throw new graphql_1.GraphQLError('Failed to fetch services', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }),
        service: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { prisma } = context;
            try {
                const service = yield prisma.service.findUnique({
                    where: { id: args.id },
                    include: { images: true }, // Kèm ảnh
                });
                if (!service) {
                    throw new graphql_1.GraphQLError('Service not found', {
                        extensions: { code: 'NOT_FOUND' },
                    });
                }
                return service;
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error; // Re-throw nếu đã là GraphQLError
                console.error("Error fetching service detail:", error);
                throw new graphql_1.GraphQLError('Failed to fetch service detail', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }),
        me: (_parent, _args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            if (!currentUser) {
                throw new graphql_1.GraphQLError('Not authenticated', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }
            // Lấy thông tin chi tiết user từ DB dựa trên ID trong context
            try {
                const user = yield prisma.user.findUnique({
                    where: { id: currentUser.id },
                    // Không trả về passwordHash!
                    select: { id: true, username: true, role: true, createdAt: true }
                });
                if (!user) {
                    // Trường hợp hiếm gặp: user bị xóa sau khi token được tạo
                    throw new graphql_1.GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
                }
                return user;
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Error fetching current user:", error);
                throw new graphql_1.GraphQLError('Failed to fetch user information', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }),
    },
    Mutation: {
        login: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { prisma } = context;
            try {
                const user = yield prisma.user.findUnique({
                    where: { username: args.username },
                });
                if (!user) {
                    throw new graphql_1.GraphQLError('Invalid username or password', {
                        extensions: { code: 'BAD_USER_INPUT', argumentName: 'username' },
                    });
                }
                const valid = yield bcryptjs_1.default.compare(args.password, user.passwordHash);
                if (!valid) {
                    throw new graphql_1.GraphQLError('Invalid username or password', {
                        extensions: { code: 'BAD_USER_INPUT', argumentName: 'password' },
                    });
                }
                const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, // Payload chứa id và role
                JWT_SECRET, { expiresIn: '1d' } // Token hết hạn sau 1 ngày
                );
                // Không trả về passwordHash
                const userToReturn = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    createdAt: user.createdAt
                };
                return {
                    token,
                    user: userToReturn,
                };
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Login error:", error);
                throw new graphql_1.GraphQLError('Login failed', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }),
        // --- Manager & Admin Mutations ---
        updateService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            // 1. Kiểm tra đăng nhập
            if (!currentUser) {
                throw new graphql_1.GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
            }
            // 2. Kiểm tra quyền hạn (Manager hoặc Admin)
            if (currentUser.role !== client_1.Role.ADMIN && currentUser.role !== client_1.Role.MANAGER) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            // 3. Validate input cơ bản
            const { name, description } = args.data;
            if (!(name === null || name === void 0 ? void 0 : name.trim()) && !(description === null || description === void 0 ? void 0 : description.trim())) {
                throw new graphql_1.GraphQLError('At least name or description must be provided for update', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }
            const updateData = {};
            if (name === null || name === void 0 ? void 0 : name.trim())
                updateData.name = name.trim();
            if (description === null || description === void 0 ? void 0 : description.trim())
                updateData.description = description.trim();
            // 4. Thực hiện update
            try {
                // Kiểm tra service có tồn tại không trước khi update
                const existingService = yield prisma.service.findUnique({ where: { id: args.id } });
                if (!existingService) {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                return yield prisma.service.update({
                    where: { id: args.id },
                    data: updateData,
                    include: { images: true }, // Trả về kèm ảnh sau khi update
                });
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Error updating service:", error);
                // Lỗi P2025 của Prisma cũng có nghĩa là record không tồn tại
                if (error.code === 'P2025') {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                throw new graphql_1.GraphQLError('Failed to update service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        // --- Admin Only Mutations ---
        createService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            // 1. Kiểm tra đăng nhập và quyền Admin
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            // 2. Validate input
            const { name, description, price } = args.data;
            if (!(name === null || name === void 0 ? void 0 : name.trim()) || !(description === null || description === void 0 ? void 0 : description.trim()) || typeof price !== 'number' || price <= 0) {
                throw new graphql_1.GraphQLError('Invalid input data: name, description are required, price must be a positive number.', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }
            // 3. Thực hiện tạo mới
            try {
                return yield prisma.service.create({
                    data: {
                        name: name.trim(),
                        description: description.trim(),
                        price: price
                        // Ảnh sẽ được thêm sau bằng mutation addImageToService
                    },
                    include: { images: true } // Trả về kèm mảng ảnh rỗng ban đầu
                });
            }
            catch (error) {
                console.error("Error creating service:", error);
                throw new graphql_1.GraphQLError('Failed to create service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        deleteService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            // 1. Kiểm tra đăng nhập và quyền Admin
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            // 2. Thực hiện xóa
            try {
                // Prisma với onDelete: Cascade sẽ tự động xóa các ảnh liên quan
                const deletedService = yield prisma.service.delete({
                    where: { id: args.id },
                    include: { images: true } // Trả về cả ảnh đã bị xóa kèm theo
                });
                return deletedService; // Trả về thông tin service vừa xóa
            }
            catch (error) {
                console.error("Error deleting service:", error);
                // Lỗi P2025: Record to delete does not exist.
                if (error.code === 'P2025') {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                throw new graphql_1.GraphQLError('Failed to delete service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        addImageToService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            // 1. Kiểm tra đăng nhập và quyền Admin
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            // 2. Validate input
            const { serviceId, imageUrl } = args.data;
            if (!serviceId || !(imageUrl === null || imageUrl === void 0 ? void 0 : imageUrl.trim())) {
                throw new graphql_1.GraphQLError('Invalid input data: serviceId and imageUrl are required.', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }
            // Optional: Validate imageUrl format (basic check)
            try {
                new URL(imageUrl); // Thử tạo URL để xem có hợp lệ không (cho URL tuyệt đối)
                // Hoặc kiểm tra nếu là path tương đối: if (!imageUrl.startsWith('/')) throw new Error();
            }
            catch (_) {
                // Nếu bắt đầu bằng / thì coi như path hợp lệ tạm thời
                if (!imageUrl.startsWith('/')) {
                    throw new graphql_1.GraphQLError('Invalid imageUrl format.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
            }
            // 3. Thực hiện thêm ảnh
            try {
                // Kiểm tra service có tồn tại không
                const serviceExists = yield prisma.service.findUnique({ where: { id: serviceId } });
                if (!serviceExists) {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                // Tạo bản ghi Image mới liên kết với Service
                return yield prisma.image.create({
                    data: {
                        url: imageUrl.trim(),
                        serviceId: serviceId,
                    }
                });
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Error adding image to service:", error);
                throw new graphql_1.GraphQLError('Failed to add image', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        removeImage: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            // 1. Kiểm tra đăng nhập và quyền Admin
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            // 2. Validate input
            if (!args.id) {
                throw new graphql_1.GraphQLError('Image ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            // 3. Thực hiện xóa ảnh
            try {
                // Trả về ảnh vừa bị xóa
                const deletedImage = yield prisma.image.delete({ where: { id: args.id } });
                return deletedImage;
            }
            catch (error) {
                console.error("Error removing image:", error);
                // Lỗi P2025: Record to delete does not exist.
                if (error.code === 'P2025') {
                    throw new graphql_1.GraphQLError('Image not found', { extensions: { code: 'NOT_FOUND' } });
                }
                throw new graphql_1.GraphQLError('Failed to remove image', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
    },
    // --- Field Resolvers (nếu cần resolve lồng nhau phức tạp) ---
    // Ví dụ: Đảm bảo rằng Service.images luôn được trả về (mặc dù include đã làm việc này)
    Service: {
        images: (parent, _args, context) => __awaiter(void 0, void 0, void 0, function* () {
            // Parent chính là đối tượng Service đang được xử lý
            return context.prisma.image.findMany({ where: { serviceId: parent.id } });
        })
        // Nếu có các trường tính toán khác thì thêm ở đây
    },
};
