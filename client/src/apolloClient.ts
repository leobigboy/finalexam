// client/src/apolloClient.ts
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// --- QUAN TRỌNG: Lấy URL GraphQL từ biến môi trường ---
// Bạn cần tạo file .env.development trong thư mục client/
// và thêm dòng: VITE_GRAPHQL_URI=https://<tên-codespace>-4000.app.github.dev/graphql
// (Thay thế bằng URL được forward từ tab PORTS của server backend)
const graphqlUri = import.meta.env.VITE_GRAPHQL_URI;

// Kiểm tra xem biến môi trường đã được định nghĩa chưa
if (!graphqlUri) {
    console.error("VITE_GRAPHQL_URI is not defined in your environment variables (.env.development)");

  // Có thể dừng ứng dụng hoặc cung cấp URL mặc định ở đây nếu muốn
  // alert('Lỗi cấu hình Apollo Client: VITE_GRAPHQL_URI chưa được đặt.');
}

// 1. Tạo HTTP link để kết nối đến server GraphQL
const httpLink = createHttpLink({
  uri: graphqlUri, // Sử dụng URL từ biến môi trường
});

// 2. Tạo Auth link (middleware) để thêm token vào header mỗi request
const authLink = setContext((_, { headers }) => {
  // Lấy token từ localStorage (được lưu sau khi đăng nhập thành công)
  const token = localStorage.getItem('token'); // Giả sử bạn lưu token với key là 'token'

  // Trả về đối tượng headers mới (hoặc headers cũ nếu không có token)
  return {
    headers: {
      ...headers, // Giữ lại các header cũ (nếu có)
      // Thêm header Authorization nếu có token
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// 3. Kết hợp các link (authLink chạy trước httpLink)
// Request -> authLink (thêm header) -> httpLink (gửi request đến server)
const link = ApolloLink.from([authLink, httpLink]);

// 4. Khởi tạo Apollo Client
export const client = new ApolloClient({
  link: link,                       // Sử dụng link đã kết hợp
  cache: new InMemoryCache(),       // Sử dụng bộ nhớ cache trong bộ nhớ (có thể cấu hình chi tiết hơn sau)
  connectToDevTools: process.env.NODE_ENV !== 'production', // Bật Apollo DevTools trong môi trường development
});

console.log(`Apollo Client initialized for URI: ${graphqlUri}`); // Log để kiểm tra URI