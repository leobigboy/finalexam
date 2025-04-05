// client/src/graphql/mutations/service.mutations.ts
import { gql } from '@apollo/client';

export const UPDATE_SERVICE_MUTATION = gql`
  mutation UpdateService($id: ID!, $data: UpdateServiceInput!) {
    updateService(id: $id, data: $data) {
      id
      name
      description
      price # Trả về cả giá nếu cần cập nhật cache
      images { id url }
    }
  }
`;

export const DELETE_SERVICE_MUTATION = gql`
  mutation DeleteService($id: ID!) {
    deleteService(id: $id) {
      id # Trả về id của service đã xóa để cập nhật cache
    }
  }
`;

 export const ADD_IMAGE_MUTATION = gql`
   mutation AddImageToService($data: AddImageInput!) {
     addImageToService(data: $data) {
       id
       url
       # Có thể cần lấy lại cả service để cập nhật cache ảnh của nó
       # service { id images { id url } }
     }
   }
 `;

 export const REMOVE_IMAGE_MUTATION = gql`
   mutation RemoveImage($id: ID!) {
     removeImage(id: $id) {
       id # ID của ảnh đã xóa
       # Có thể cần serviceId để biết service nào cần cập nhật cache
       # serviceId
     }
   }
 `;

 // Thêm CREATE_SERVICE_MUTATION nếu cần (Admin)
 export const CREATE_SERVICE_MUTATION = gql`
   mutation CreateService($data: CreateServiceInput!) {
      createService(data: $data) {
          id
          name
          description
          price
          images { id url }
          createdAt
      }
   }
 `;
 