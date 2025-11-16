// File: frontend-app/src/RegisterPage.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import hook để chuyển trang

// API Backend của chúng ta
const API_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/auth` : 'http://localhost:5000/api/auth';

function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Khởi tạo hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Gọi POST /api/auth/register (Module 1)
      const response = await axios.post(`${API_URL}/register`, {
        fullName: fullName,
        email: email,
        password: password,
      });

      // 4. Nhận phản hồi 201 từ server
      const { token, hasProfile } = response.data;

      // 4a. Lưu token
      localStorage.setItem('authToken', token);
      console.log('Đăng ký thành công! Token:', token);

      // 4b & 4c. KIỂM TRA HỒ SƠ VÀ CHUYỂN HƯỚNG
      // Theo đặc tả, hasProfile sau khi đăng ký LUÔN LUÔN là false
      if (hasProfile === false) {
        alert('Đăng ký thành công! Bạn cần tạo hồ sơ.');
        navigate('/onboarding'); // Chuyển hướng đến trang Onboarding
      } else {
        // Trường hợp này không nên xảy ra, nhưng để dự phòng
        navigate('/home'); 
      }

    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('Email này đã tồn tại. Vui lòng chọn email khác.');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      }
      console.error('Lỗi đăng ký:', err);
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
      backgroundColor: 'white',          // <- đảm bảo nền trắng, không trong suốt
      boxShadow: '0 6px 18px rgba(0,0,0,0.12)' // <- nhẹ bóng để nổi trên GIF nền
    }}>
      <h2>Trang Đăng Ký</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Họ và Tên</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={6} // Đặt 1 quy tắc mật khẩu đơn giản
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Đăng Ký
        </button>
      </form>
      <button onClick={() => navigate('/login')} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>
        Đã có tài khoản? Đăng nhập
      </button>
    </div>
  );
}

export default RegisterPage;