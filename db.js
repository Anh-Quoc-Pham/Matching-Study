// File: db.js (ĐÃ CẬP NHẬT CHO DEPLOY)
const { Pool } = require('pg');

// 1. Lấy chuỗi kết nối từ Biến Môi trường (Render sẽ cung cấp)
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // 2. THÊM CÀI ĐẶT SSL (BẮT BUỘC cho Supabase/Render)
  ssl: {
    rejectUnauthorized: false
  }
});

// Xuất ra để file index.js có thể dùng
module.exports = {
  query: (text, params) => pool.query(text, params),
};