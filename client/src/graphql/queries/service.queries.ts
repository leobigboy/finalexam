// client/src/graphql/queries/service.queries.ts
import { gql } from '@apollo/client';

// Fragment để tái sử dụng các trường của Service
const SERVICE_FIELDS_FRAGMENT = gql`
  fragment ServiceFields on Service {
      id
      name
      description
      price
      images { id url }
      createdAt
      updatedAt
  }
`;

// Fragment cho thông tin phân trang
const PAGE_INFO_FRAGMENT = gql`
    fragment PageInfoFields on PageInfo {
      totalItems
      itemCount
      itemsPerPage
      totalPages
      currentPage
      hasNextPage
      hasPreviousPage
    }
`;


export const GET_SERVICES_QUERY = gql`
  # Sử dụng các fragment đã định nghĩa
  ${SERVICE_FIELDS_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}

  query GetServices(
    $skip: Int
    $take: Int
    $sortBy: ServiceSortInput
    $filterByPrice: PriceFilterInput
    $searchQuery: String
  ) {
    services(
      skip: $skip
      take: $take
      sortBy: $sortBy
      filterByPrice: $filterByPrice
      searchQuery: $searchQuery
    ) {
      items {
        ...ServiceFields # Lấy tất cả các trường từ fragment
      }
      pageInfo {
        ...PageInfoFields # Lấy các trường pageInfo từ fragment
      }
    }
  }
`;

export const GET_SERVICE_DETAIL_QUERY = gql`
  ${SERVICE_FIELDS_FRAGMENT} # Sử dụng lại fragment

  query GetServiceDetail($id: ID!) {
    service(id: $id) {
      ...ServiceFields
    }
  }
`;