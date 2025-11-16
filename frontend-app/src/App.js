// File: frontend-app/src/App.js

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import tất cả các trang của bạn
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';     // Đã mở khóa
import OnboardingPage from './OnboardingPage'; // Đã mở khóa
import HomePage from './HomePage';           // Đã mở khóa

// Hàm trợ giúp để kiểm tra xem người dùng đã đăng nhập chưa
const isLoggedIn = () => {
  return localStorage.getItem('authToken') ? true : false;
};

// Hàm này sẽ bảo vệ các trang (ví dụ: /home, /onboarding)
// Nếu chưa đăng nhập, nó sẽ đá về /login
const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    return <Navigate to="/login" />;
  }
  // Nếu đã đăng nhập, cho phép truy cập
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route: Trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route: Trang đăng ký */}
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Route: Trang Onboarding (Phải đăng nhập mới vào được) */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } 
        />

        {/* Route: Trang chủ (Phải đăng nhập mới vào được) */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />

        {/* Route mặc định: 
            - Nếu vào trang / (trang gốc) VÀ đã đăng nhập -> chuyển đến /home 
            - Nếu vào trang / (trang gốc) VÀ CHƯA đăng nhập -> chuyển đến /login
        */}
        <Route 
          path="/" 
          element={isLoggedIn() ? <Navigate to="/home" /> : <Navigate to="/login" />} 
        />
        
        {/* Route dự phòng: Nếu gõ một đường dẫn không tồn tại, đá về trang chủ */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;