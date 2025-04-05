// client/src/pages/LoginPage.tsx
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { LOGIN_MUTATION } from '../graphql/mutations/auth.mutations'; // Import mutation

// Định nghĩa kiểu dữ liệu cho form
interface LoginFormInputs {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/services'; // Lấy trang trước đó hoặc mặc định là /services

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const [loginUser, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      // Xử lý khi mutation thành công
      console.log('Login successful:', data);
      // Lưu token và role vào localStorage
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('userRole', data.login.user.role); // Lưu role

      // Chuyển hướng đến trang được yêu cầu trước đó hoặc trang /services
      navigate(from, { replace: true });
    },
    onError: (err) => {
      // Xử lý khi có lỗi GraphQL hoặc network
      // Lỗi đã được hiển thị qua biến 'error' của useMutation
      console.error('Login error:', err);
    },
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = (formData) => {
    loginUser({ variables: formData }); // Gọi mutation với dữ liệu từ form
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Đăng nhập
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Tên đăng nhập"
            autoComplete="username"
            autoFocus
            {...register('username', { required: 'Tên đăng nhập là bắt buộc' })}
            error={!!errors.username}
            helperText={errors.username?.message}
            disabled={loading} // Vô hiệu hóa khi đang loading
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Mật khẩu"
            type="password"
            id="password"
            autoComplete="current-password"
            {...register('password', { required: 'Mật khẩu là bắt buộc' })}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={loading} // Vô hiệu hóa khi đang loading
          />

          {/* Hiển thị lỗi từ server */}
          {error && (
             // Kiểm tra lỗi cụ thể từ GraphQL nếu có
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
               {error.graphQLErrors.map(({ message }, i) => (
                    <span key={i}>{message}</span>
                ))}
                {/* Hiển thị lỗi mạng nếu có */}
                {error.networkError && <span>Lỗi kết nối mạng. Vui lòng thử lại.</span>}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading} // Vô hiệu hóa nút khi đang loading
          >
            {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

// Cần thay thế LoginPagePlaceholder bằng LoginPage thật trong App.tsx
// export default LoginPagePlaceholder; // Xóa dòng này nếu bạn dùng placeholder
export default LoginPage; // Export component thật