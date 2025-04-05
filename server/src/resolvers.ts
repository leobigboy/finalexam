// server/src/resolvers.ts
import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma, Role } from '@prisma/client';
import { MyContext } from './index';
// Dòng import Resolvers đã bị xóa/comment out
import 'dotenv/config';
import { GraphQLScalarType, Kind } from 'graphql'; // Import Kind

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1);
}

const createPageInfo = (totalItems: number, skip: number, take: number) => {
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

export const resolvers: any = { // Sử dụng any ở đây
  DateTime: new GraphQLScalarType({ // Cấu hình DateTime scalar
      name: 'DateTime',
      description: 'DateTime custom scalar type',
      parseValue(value: any) { return new Date(value); },
      serialize(value: any) {
          if (value instanceof Date) {
              return value.toISOString();
          }
          return null;
       },
      parseLiteral(ast: any) {
          if (ast.kind === Kind.STRING || ast.kind === Kind.INT) { // Sửa: dùng Kind.STRING, Kind.INT
              return new Date(ast.value);
          }
          return null;
      },
  }),

  Query: {
    hello: () => 'Hello from Thien Huong Service API!',

    services: async (
        _parent: any,
        args: {
            skip?: number;
            take?: number;
            sortBy?: { field: string; order: 'asc' | 'desc' };
            filterByPrice?: { min?: number; max?: number };
            searchQuery?: string
        },
        context: MyContext
        ) => {
        const { skip = 0, take = 10, sortBy, filterByPrice, searchQuery } = args;
        const { prisma } = context;

        const where: Prisma.ServiceWhereInput = {};
        if (filterByPrice) {
            where.price = {};
            if (typeof filterByPrice.min === 'number') { where.price.gte = filterByPrice.min; }
            if (typeof filterByPrice.max === 'number') { where.price.lte = filterByPrice.max; }
             if (Object.keys(where.price).length === 0) { delete where.price; }
        }
        if (searchQuery && searchQuery.trim()) {
            const trimmedQuery = searchQuery.trim();
            where.OR = [
                // Đã xóa mode: 'insensitive'
                { name: { contains: trimmedQuery } },
                { description: { contains: trimmedQuery } },
            ];
        }

        const orderBy: Prisma.ServiceOrderByWithRelationInput = {};
        // --- SỬA LỖI: Định nghĩa allowedSortFields ở đây ---
        const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
        // --- Kết thúc sửa lỗi ---
        if (sortBy && allowedSortFields.includes(sortBy.field)) {
             // Đã thêm 'as keyof...'
            orderBy[sortBy.field as keyof Prisma.ServiceOrderByWithRelationInput] = sortBy.order;
        } else {
            orderBy.createdAt = 'desc';
        }

        try {
            const [items, totalItems] = await prisma.$transaction([
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
        } catch (error) {
            console.error("Error fetching services:", error);
            throw new GraphQLError('Failed to fetch services', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    },

    service: async (_parent: any, args: { id: string }, context: MyContext) => {
        const { prisma } = context;
        try {
            const service = await prisma.service.findUnique({
                where: { id: args.id },
                include: { images: true },
            });
            if (!service) {
                 throw new GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } });
            }
            return service;
        } catch (error: any) {
             if (error instanceof GraphQLError) throw error;
             console.error("Error fetching service detail:", error);
             throw new GraphQLError('Failed to fetch service detail', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },

    me: async (_parent: any, _args: any, context: MyContext) => {
        const { currentUser, prisma } = context;
        if (!currentUser) {
            throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
        }
        try {
            const user = await prisma.user.findUnique({
                 where: { id: currentUser.id },
                 select: { id: true, username: true, role: true, createdAt: true }
            });
            if (!user) {
                 throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
            }
            return user;
        } catch (error: any) {
             if (error instanceof GraphQLError) throw error;
             console.error("Error fetching current user:", error);
             throw new GraphQLError('Failed to fetch user information', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },
  },

  Mutation: {
    login: async (_parent: any, args: { username: string; password: string }, context: MyContext) => {
        const { prisma } = context;
        try {
            const user = await prisma.user.findUnique({ where: { username: args.username } });
            if (!user) { throw new GraphQLError('Invalid username or password', { extensions: { code: 'BAD_USER_INPUT', argumentName: 'username' } }); }
            const valid = await bcrypt.compare(args.password, user.passwordHash);
            if (!valid) { throw new GraphQLError('Invalid username or password', { extensions: { code: 'BAD_USER_INPUT', argumentName: 'password' } }); }
            const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            const userToReturn = { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt };
            return { token, user: userToReturn };
        } catch (error: any) {
             if (error instanceof GraphQLError) throw error;
             console.error("Login error:", error);
             throw new GraphQLError('Login failed', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },

    updateService: async (_parent: any, args: { id: string; data: { name?: string; description?: string } }, context: MyContext) => {
        const { currentUser, prisma } = context;
        if (!currentUser) { throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } }); }
        if (currentUser.role !== Role.ADMIN && currentUser.role !== Role.MANAGER) { throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } }); }
        const { name, description } = args.data;
        if (!name?.trim() && !description?.trim()) { throw new GraphQLError('At least name or description must be provided for update', { extensions: { code: 'BAD_USER_INPUT' } }); }
        const updateData: { name?: string; description?: string } = {};
        if (name?.trim()) updateData.name = name.trim();
        if (description?.trim()) updateData.description = description.trim();
        try {
             const existingService = await prisma.service.findUnique({ where: { id: args.id } });
             if (!existingService) { throw new GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } }); }
             return await prisma.service.update({ where: { id: args.id }, data: updateData, include: { images: true } });
        } catch (error: any) {
             if (error instanceof GraphQLError) throw error;
             console.error("Error updating service:", error);
             if (error.code === 'P2025') { throw new GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } }); }
             throw new GraphQLError('Failed to update service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },

    createService: async (_parent: any, args: { data: { name: string; description: string; price: number } }, context: MyContext) => {
        const { currentUser, prisma } = context;
        if (!currentUser || currentUser.role !== Role.ADMIN) { throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } }); }
        const { name, description, price } = args.data;
        if (!name?.trim() || !description?.trim() || typeof price !== 'number' || price <= 0) { throw new GraphQLError('Invalid input data: name, description are required, price must be a positive number.', { extensions: { code: 'BAD_USER_INPUT' } }); }
        try {
            return await prisma.service.create({ data: { name: name.trim(), description: description.trim(), price: price }, include: { images: true } });
        } catch (error) {
             console.error("Error creating service:", error);
             throw new GraphQLError('Failed to create service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },

    deleteService: async (_parent: any, args: { id: string }, context: MyContext) => {
        const { currentUser, prisma } = context;
        if (!currentUser || currentUser.role !== Role.ADMIN) { throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } }); }
        try {
            const deletedService = await prisma.service.delete({ where: { id: args.id }, include: { images: true } });
            return deletedService;
        } catch (error: any) {
             console.error("Error deleting service:", error);
             if (error.code === 'P2025') { throw new GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } }); }
             throw new GraphQLError('Failed to delete service', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },

    addImageToService: async (_parent: any, args: { data: { serviceId: string; imageUrl: string } }, context: MyContext) => {
        const { currentUser, prisma } = context;
        if (!currentUser || currentUser.role !== Role.ADMIN) { throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } }); }
        const { serviceId, imageUrl } = args.data;
        if (!serviceId || !imageUrl?.trim()) { throw new GraphQLError('Invalid input data: serviceId and imageUrl are required.', { extensions: { code: 'BAD_USER_INPUT' } }); }
        try {
            new URL(imageUrl);
         } catch (_) {
            if (!imageUrl.startsWith('/')) { throw new GraphQLError('Invalid imageUrl format.', { extensions: { code: 'BAD_USER_INPUT' } }); }
         }
        try {
             const serviceExists = await prisma.service.findUnique({ where: { id: serviceId } });
             if (!serviceExists) { throw new GraphQLError('Service not found', { extensions: { code: 'NOT_FOUND' } }); }
             return await prisma.image.create({ data: { url: imageUrl.trim(), serviceId: serviceId } });
        } catch (error: any) {
             if (error instanceof GraphQLError) throw error;
             console.error("Error adding image to service:", error);
             throw new GraphQLError('Failed to add image', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },

    removeImage: async (_parent: any, args: { id: string }, context: MyContext) => {
         const { currentUser, prisma } = context;
         if (!currentUser || currentUser.role !== Role.ADMIN) { throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } }); }
         if (!args.id) { throw new GraphQLError('Image ID is required.', { extensions: { code: 'BAD_USER_INPUT' } }); }
         try {
            const deletedImage = await prisma.image.delete({ where: { id: args.id } });
            return deletedImage;
         } catch (error: any) {
             console.error("Error removing image:", error);
             if (error.code === 'P2025') { throw new GraphQLError('Image not found', { extensions: { code: 'NOT_FOUND' } }); }
             throw new GraphQLError('Failed to remove image', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
         }
    },
  },

  Service: {
     images: async (parent: { id: string }, _args: any, context: MyContext) => {
         return context.prisma.image.findMany({ where: { serviceId: parent.id } });
     }
  },
};