"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
// server/src/schema.ts
const graphql_tag_1 = require("graphql-tag"); // Sử dụng graphql-tag thay vì @apollo/server
exports.typeDefs = (0, graphql_tag_1.gql) `
  scalar DateTime

  enum Role {
    CUSTOMER
    MANAGER
    ADMIN
  }

  enum SortOrder {
    asc
    desc
  }

  type User {
    id: ID!
    username: String!
    role: Role!
    createdAt: DateTime!
  }

  type Image {
    id: ID!
    url: String!
    createdAt: DateTime!
    # Không cần serviceId ở đây vì GraphQL sẽ resolve qua Service.images
  }

  type Service {
    id: ID!
    name: String!
    description: String!
    price: Float!
    images: [Image!]! # Trả về danh sách các Image liên quan
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Input Types
  input ServiceSortInput {
    field: ServiceSortField!
    order: SortOrder!
  }

  enum ServiceSortField {
    name
    price
    createdAt
    updatedAt
  }

  input PriceFilterInput {
    min: Float
    max: Float
  }

  # Pagination Types
  type PageInfo {
    totalItems: Int!
    itemCount: Int!
    itemsPerPage: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type ServiceConnection {
    items: [Service!]!
    pageInfo: PageInfo!
  }

  # --- Query ---
  type Query {
    hello: String # Test query
    # Query lấy danh sách dịch vụ với các tùy chọn phân trang, lọc, sắp xếp, tìm kiếm
    services(
      skip: Int          # Số item bỏ qua (cho phân trang)
      take: Int          # Số item lấy trên mỗi trang
      sortBy: ServiceSortInput
      filterByPrice: PriceFilterInput
      searchQuery: String # Từ khóa tìm kiếm
    ): ServiceConnection!

    # Query lấy chi tiết một dịch vụ theo ID
    service(id: ID!): Service

    # Query lấy thông tin user đang đăng nhập
    me: User
  }

  # --- Mutation ---

  # Payload trả về sau khi login thành công
  type AuthPayload {
    token: String!
    user: User!
  }

  # Input để cập nhật dịch vụ (Manager & Admin)
  input UpdateServiceInput {
      name: String
      description: String
      # Không cho Manager sửa giá, chỉ Admin (sẽ kiểm tra trong resolver)
      # price: Float
  }

   # Input để tạo dịch vụ mới (Admin only)
   input CreateServiceInput {
      name: String!
      description: String!
      price: Float!
      # Việc thêm ảnh sẽ thực hiện qua mutation riêng
   }

   # Input để thêm ảnh vào dịch vụ (Admin only)
   input AddImageInput {
       serviceId: ID!
       imageUrl: String! # Bắt đầu bằng URL, upload file phức tạp hơn
   }

  type Mutation {
    # Đăng nhập
    login(username: String!, password: String!): AuthPayload!

    # Manager & Admin: Cập nhật tên, mô tả dịch vụ
    updateService(id: ID!, data: UpdateServiceInput!): Service

    # Admin only: Tạo dịch vụ mới
    createService(data: CreateServiceInput!): Service
    # Admin only: Xóa dịch vụ
    deleteService(id: ID!): Service
    # Admin only: Thêm ảnh vào dịch vụ
    addImageToService(data: AddImageInput!): Image
    # Admin only: Xóa ảnh khỏi dịch vụ bằng ID của ảnh
    removeImage(id: ID!): Image
  }
`;
