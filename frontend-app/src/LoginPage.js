// File: frontend-app/src/LoginPage.js (Phiên bản cập nhật)

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // 1. Import useNavigate và Link

// API Backend của chúng ta
const API_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/auth` : 'http://localhost:5000/api/auth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // 2. Khởi tạo hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: email,
        password: password,
      });

      const { token, hasProfile } = response.data;
      localStorage.setItem('authToken', token);
      console.log('Đăng nhập thành công! Token:', token);

      // 3. THAY ĐỔI LỚN NẰM Ở ĐÂY
      if (hasProfile) {
        // Thay vì alert, chúng ta chuyển trang
        navigate('/home'); 
      } else {
        // Thay vì alert, chúng ta chuyển trang
        navigate('/onboarding');
      }

    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  return (
    <div style={{ 
      padding: '50px', 
      maxWidth: '400px', 
      margin: 'auto', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      marginTop: '50px',
      backgroundColor: 'white',              // <- thêm
      boxShadow: '0 6px 18px rgba(0,0,0,0.12)' // <- thêm
    }}>
      <h2>Trang Đăng nhập (Module 1)</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user1001@example.com"
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password123"
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Đăng nhập
        </button>
      </form>
      
      {/* 4. Thêm Link để chuyển qua trang Đăng ký */}
      <p style={{ marginTop: '20px' }}>
        Chưa có tài khoản? 
        <Link to="/register" style={{ marginLeft: '5px' }}>
          Đăng ký ngay
        </Link>
      </p>

      <p style={{ fontSize: '0.8em', color: '#555', marginTop: '20px' }}>
        Gợi ý: Dùng `user1001@example.com` và mật khẩu `password123`.
      </p>
    </div>
  );
}

export default LoginPage;