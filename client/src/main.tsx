// client/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ApolloProvider } from '@apollo/client';
import { client } from './apolloClient'; // Import client đã cấu hình
import { BrowserRouter } from 'react-router-dom';
import './index.css'; // Hoặc file style toàn cục của bạn
// Import CSS cho react-slick (QUAN TRỌNG cho carousel)
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
);