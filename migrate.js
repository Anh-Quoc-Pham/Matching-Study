// File: migrate.js
const fs = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// --- CẤU HÌNH DATABASE CỦA BẠN ---
// !!! DÁN CHUỖI CỦA BẠN VÀO ĐÂY (thay thế [YOUR_PASSWORD] bằng mật khẩu CSDL của bạn)
const connectionString = 'postgresql://postgres:0Zu09fzrijLmhLn6@db.bwcjskmgofmxzwebiahc.supabase.co:5432/postgres';

// -----------------------------------

const pool = new Pool({
  connectionString: connectionString,
});

// (Toàn bộ code còn lại của file migrate.js giữ nguyên y hệt)
// ...
// ... (hàm cleanArray, hàm migrate)
// ...

// Hàm dọn dẹp dữ liệu
function cleanArray(arrayData) {
  if (Array.isArray(arrayData)) {
    return arrayData;
  }
  if (typeof arrayData === 'string') {
    try {
      const parsed = JSON.parse(arrayData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return []; 
    }
  }
  return null; 
}

// Hàm chính để di chuyển dữ liệu
async function migrate() {
  console.log('Bắt đầu đọc data.json...');
  // Đảm bảo file 'data.json' nằm cùng thư mục với file 'migrate.js'
  const jsonData = fs.readFileSync('data.json', 'utf8'); 
  const users = JSON.parse(jsonData);
  console.log(`Tìm thấy ${users.length} người dùng.`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt); // Mật khẩu mặc định
      const email = `user${user.UserID}@example.com`;
      const fullName = `${user.UserRole} ${user.UserID}`;

      // Bước 1: INSERT vào Users
      const userRes = await client.query(
        `INSERT INTO Users (full_name, email, password_hash) 
         VALUES ($1, $2, $3)
         RETURNING user_id`,
        [fullName, email, passwordHash]
      );
      
      const newUserId = userRes.rows[0].user_id;

      // Bước 2: INSERT vào UserProfiles
      const tools = cleanArray(user.ToolsProficiency);
      const keywords = cleanArray(user.InterestKeywords);
      const availability = cleanArray(user.AvailabilitySlots);
      let secondaryFields = cleanArray(user.FieldOfStudy_Secondary);
      if (secondaryFields && secondaryFields.length === 0) {
        secondaryFields = null; 
      }

      await client.query(
        `INSERT INTO UserProfiles (
          user_id, user_role, objective, primary_goal, timezone, commitment_hours,
          time_management_style, communication_pref, team_size_pref, primary_language,
          field_of_study_primary, field_of_study_secondary, availability_slots, 
          tools_proficiency, interest_keywords,
          skill_programming, skill_statistics, skill_academic_writing, skill_data_visualization,
          is_onboarding_complete
         ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, TRUE
         )`,
        [
          newUserId, user.UserRole, user.Objective, user.PrimaryGoal, user.Timezone, user.CommitmentHours,
          user.TimeManagementStyle, user.CommunicationPref, user.TeamSizePref, user.PrimaryLanguage,
          user.FieldOfStudy_Primary, secondaryFields, availability,
          tools, keywords,
          user.Skill_Programming, user.Skill_Statistics, user.Skill_AcademicWriting, user.Skill_DataVisualization
        ]
      );
      
      if (parseInt(user.UserID) % 100 === 0) {
         console.log(`Đã di chuyển ${user.UserID} / ${users.length} người dùng...`);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ HOÀN TẤT DI CHUYỂN DỮ LIỆU! Tất cả người dùng đã ở trong CSDL Supabase.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi di chuyển dữ liệu:', error);
    console.log('Đã rollback (hủy bỏ) mọi thay đổi.');
  } finally {
    client.release(); 
    await pool.end(); 
  }
}

migrate().catch(console.error);