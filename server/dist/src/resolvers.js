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
const client_1 = require("@prisma/client");
// Dòng import Resolvers đã bị xóa/comment out
require("dotenv/config");
const graphql_2 = require("graphql"); // Import Kind
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1);
}
const createPageInfo = (totalItems, skip, take) => {
    const safeTake = Math.max(1, take);
    const currentPage = Math.floor(skip / safeTake) + 1;
    const totalPages = Math.ceil(totalItems / safeTake);
    const itemCountOnPage = Math.min(safeTake, Math.max(0, totalItems - skip));
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
exports.resolvers = {
    DateTime: new graphql_2.GraphQLScalarType({
        name: 'DateTime',
        description: 'DateTime custom scalar type',
        parseValue(value) { return new Date(value); },
        serialize(value) {
            if (value instanceof Date) {
                return value.toISOString();
            }
            return null;
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_2.Kind.STRING || ast.kind === graphql_2.Kind.INT) { // Sửa: dùng Kind.STRING, Kind.INT
                return new Date(ast.value);
            }
            return null;
        },
    }),
    Query: {
        hello: () => 'Hello from Thien Huong Service API!',
        services: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { skip = 0, take = 10, sortBy, filterByPrice, searchQuery } = args;
            const { prisma } = context;
            const where = {};
            if (filterByPrice) {
                where.price = {};
                if (typeof filterByPrice.min === 'number') {
                    where.price.gte = filterByPrice.min;
                }
                if (typeof filterByPrice.max === 'number') {
                    where.price.lte = filterByPrice.max;
                }
                if (Object.keys(where.price).length === 0) {
                    delete where.price;
                }
            }
            if (searchQuery && searchQuery.trim()) {
                const trimmedQuery = searchQuery.trim();
                where.OR = [
                    // Đã xóa mode: 'insensitive'
                    { name: { contains: trimmedQuery } },
                    { description: { contains: trimmedQuery } },
                ];
            }
            const orderBy = {};
            // --- SỬA LỖI: Định nghĩa allowedSortFields ở đây ---
            const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
            // --- Kết thúc sửa lỗi ---
            if (sortBy && allowedSortFields.includes(sortBy.field)) {
                // Đã thêm 'as keyof...'
                orderBy[sortBy.field] = sortBy.order;
            }
            else {
                orderBy.createdAt = 'desc';
            }
            try {
                const [items, totalItems] = yield prisma.$transaction([
                    prisma.service.findMany({
                        where,
                        orderBy,
                        skip: Math.max(0, skip),
                        take: Math.max(1, take),
                        include: { images: true },
                    }),
                    prisma.service.count({ where }),
                ]);
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
                    include: { images: true },
                });
                if (!service) {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                return service;
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Error fetching service detail:", error);
                throw new graphql_1.GraphQLError('Failed to fetch service detail', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        me: (_parent, _args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            if (!currentUser) {
                throw new graphql_1.GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
            }
            try {
                const user = yield prisma.user.findUnique({
                    where: { id: currentUser.id },
                    select: { id: true, username: true, role: true, createdAt: true }
                });
                if (!user) {
                    throw new graphql_1.GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
                }
                return user;
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Error fetching current user:", error);
                throw new graphql_1.GraphQLError('Failed to fetch user information', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
    },
    Mutation: {
        login: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { prisma } = context;
            try {
                const user = yield prisma.user.findUnique({ where: { username: args.username } });
                if (!user) {
                    throw new graphql_1.GraphQLError('Invalid username or password', { extensions: { code: 'BAD_USER_INPUT', argumentName: 'username' } });
                }
                const valid = yield bcryptjs_1.default.compare(args.password, user.passwordHash);
                if (!valid) {
                    throw new graphql_1.GraphQLError('Invalid username or password', { extensions: { code: 'BAD_USER_INPUT', argumentName: 'password' } });
                }
                const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
                const userToReturn = { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt };
                return { token, user: userToReturn };
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Login error:", error);
                throw new graphql_1.GraphQLError('Login failed', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        updateService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            if (!currentUser) {
                throw new graphql_1.GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
            }
            if (currentUser.role !== client_1.Role.ADMIN && currentUser.role !== client_1.Role.MANAGER) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            const { name, description } = args.data;
            if (!(name === null || name === void 0 ? void 0 : name.trim()) && !(description === null || description === void 0 ? void 0 : description.trim())) {
                throw new graphql_1.GraphQLError('At least name or description must be provided for update', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const updateData = {};
            if (name === null || name === void 0 ? void 0 : name.trim())
                updateData.name = name.trim();
            if (description === null || description === void 0 ? void 0 : description.trim())
                updateData.description = description.trim();
            try {
                const existingService = yield prisma.service.findUnique({ where: { id: args.id } });
                if (!existingService) {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                return yield prisma.service.update({ where: { id: args.id }, data: updateData, include: { images: true } });
            }
            catch (error) {
                if (error instanceof graphql_1.GraphQLError)
                    throw error;
                console.error("Error updating service:", error);
                if (error.code === 'P2025') {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                throw new graphql_1.GraphQLError('Failed to update service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        createService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            const { name, description, price } = args.data;
            if (!(name === null || name === void 0 ? void 0 : name.trim()) || !(description === null || description === void 0 ? void 0 : description.trim()) || typeof price !== 'number' || price <= 0) {
                throw new graphql_1.GraphQLError('Invalid input data: name, description are required, price must be a positive number.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            try {
                return yield prisma.service.create({ data: { name: name.trim(), description: description.trim(), price: price }, include: { images: true } });
            }
            catch (error) {
                console.error("Error creating service:", error);
                throw new graphql_1.GraphQLError('Failed to create service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        deleteService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            try {
                const deletedService = yield prisma.service.delete({ where: { id: args.id }, include: { images: true } });
                return deletedService;
            }
            catch (error) {
                console.error("Error deleting service:", error);
                if (error.code === 'P2025') {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                throw new graphql_1.GraphQLError('Failed to delete service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
        addImageToService: (_parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { currentUser, prisma } = context;
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            const { serviceId, imageUrl } = args.data;
            if (!serviceId || !(imageUrl === null || imageUrl === void 0 ? void 0 : imageUrl.trim())) {
                throw new graphql_1.GraphQLError('Invalid input data: serviceId and imageUrl are required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            try {
                new URL(imageUrl);
            }
            catch (_) {
                if (!imageUrl.startsWith('/')) {
                    throw new graphql_1.GraphQLError('Invalid imageUrl format.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
            }
            try {
                const serviceExists = yield prisma.service.findUnique({ where: { id: serviceId } });
                if (!serviceExists) {
                    throw new graphql_1.GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
                }
                return yield prisma.image.create({ data: { url: imageUrl.trim(), serviceId: serviceId } });
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
            if (!currentUser || currentUser.role !== client_1.Role.ADMIN) {
                throw new graphql_1.GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
            }
            if (!args.id) {
                throw new graphql_1.GraphQLError('Image ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            try {
                const deletedImage = yield prisma.image.delete({ where: { id: args.id } });
                return deletedImage;
            }
            catch (error) {
                console.error("Error removing image:", error);
                if (error.code === 'P2025') {
                    throw new graphql_1.GraphQLError('Image not found', { extensions: { code: 'NOT_FOUND' } });
                }
                throw new graphql_1.GraphQLError('Failed to remove image', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        }),
    },
    Service: {
        images: (parent, _args, context) => __awaiter(void 0, void 0, void 0, function* () {
            return context.prisma.image.findMany({ where: { serviceId: parent.id } });
        })
    },
};
