// server/src/schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
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
  }

  type Service {
    id: ID!
    name: String!
    description: String!
    price: Float!
    images: [Image!]!
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
    hello: String
    services(
      skip: Int
      take: Int
      sortBy: ServiceSortInput
      filterByPrice: PriceFilterInput
      searchQuery: String
    ): ServiceConnection!
    service(id: ID!): Service
    me: User
  }

  # --- Mutation ---
  type AuthPayload {
    token: String!
    user: User!
  }

  input UpdateServiceInput {
      name: String
      description: String
  }

   input CreateServiceInput {
      name: String!
      description: String!
      price: Float!
   }

   input AddImageInput {
       serviceId: ID!
       imageUrl: String!
   }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    updateService(id: ID!, data: UpdateServiceInput!): Service
    createService(data: CreateServiceInput!): Service
    deleteService(id: ID!): Service
    addImageToService(data: AddImageInput!): Image
    removeImage(id: ID!): Image
  }
`;