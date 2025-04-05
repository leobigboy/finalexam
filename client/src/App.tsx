// client/src/App.tsx
import React from 'react'; // Import React nếu chưa có
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
// Import component LoginPage thật
import LoginPage from './pages/LoginPage';
// Giữ lại các placeholder cho các trang chưa tạo
// import ServiceListPage from './pages/ServiceListPage';
// import ServiceDetailPage from './pages/ServiceDetailPage';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Button } from '@mui/material';


// --- Các trang mẫu (Placeholder) ---
// Bạn sẽ cần tạo các file này sau
const PlaceholderPage = ({ title }: { title: string }) => (
  <div>
    <h1>{title}</h1>
    <p>Nội dung trang {title} sẽ được thêm vào đây.</p>
    {/* Thêm Link để quay lại nếu cần */}
  </div>
);
// const LoginPagePlaceholder = () => <PlaceholderPage title="Login" />; // Không cần nữa
const ServiceListPagePlaceholder = () => <PlaceholderPage title="Danh sách Dịch vụ" />;
const ServiceDetailPagePlaceholder = () => <PlaceholderPage title="Chi tiết Dịch vụ" />;
// --- Kết thúc Placeholder ---


const getUserAuth = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    return { token, role };
};

const MainLayout = () => {
    const navigate = useNavigate();
    const { role, token } = getUserAuth(); // Lấy cả token để kiểm tra

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login'); // Chuyển về trang login sau khi logout
    };

    // Chỉ render layout này nếu có token (đã được kiểm tra bởi ProtectedRoute)
    // Không cần kiểm tra token ở đây nữa
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Khách sạn Thiên Hương - Dịch vụ
                    </Typography>
                    {/* Hiển thị Role và Logout */}
                    <Typography sx={{ mr: 2 }}>Role: {role || 'N/A'}</Typography>
                    <Button color="inherit" onClick={handleLogout}>Đăng xuất</Button>
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                {/* Render nội dung của trang con (ServiceList, ServiceDetail...) */}
                <Outlet />
            </Box>
            {/* Optional: Thêm Footer ở đây */}
        </Box>
    );
};

// Component bảo vệ các route yêu cầu đăng nhập
const ProtectedRoute = () => {
    const { token } = getUserAuth();
    const location = useLocation(); // Lấy vị trí hiện tại để lưu lại khi redirect

    if (!token) {
        // Nếu chưa đăng nhập, chuyển hướng về trang login
        // state={{ from: location }} giúp trang login biết được cần quay lại đâu sau khi đăng nhập thành công
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Nếu đã đăng nhập, render MainLayout (bao gồm Navbar và vị trí cho Outlet)
    return <MainLayout />;
};

// Tạo theme Material UI (có thể tùy chỉnh)
const theme = createTheme({
    // Các tùy chỉnh theme khác nếu muốn
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Chuẩn hóa CSS */}
      <Routes>
         {/* Route cho trang Login, không sử dụng MainLayout */}
        <Route path="/login" element={<LoginPage />} /> {/* <<< ĐÃ SỬA */}

        {/* Các routes nằm bên trong ProtectedRoute yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
             {/* Sử dụng placeholder cho các trang chưa tạo */}
             <Route path="/services" element={<ServiceListPagePlaceholder />} />
             <Route path="/services/:id" element={<ServiceDetailPagePlaceholder />} />
             {/* Thêm các route được bảo vệ khác tại đây nếu cần */}
        </Route>

         {/* Redirect mặc định */}
         {/* Nếu truy cập đường dẫn không khớp, kiểm tra đã đăng nhập chưa */}
         {/* Nếu rồi -> /services, nếu chưa -> /login */}
         <Route path="*" element={<Navigate to={getUserAuth().token ? "/services" : "/login"} replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;