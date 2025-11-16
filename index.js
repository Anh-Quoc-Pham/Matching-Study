// File: index.js (ĐÃ CẬP NHẬT CHO DEPLOY)

const express = require('express');
const cors = require('cors');
const db = require('./db.js'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// --- CẬP NHẬT 1: SỬA CORS ---
// Lấy URL của frontend từ Biến Môi trường
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
};
app.use(cors(corsOptions));
// -----------------------------

app.use(express.json()); 

// --- CẬP NHẬT 2: SỬA JWT_SECRET ---
// Lấy JWT Secret từ Biến Môi trường
const JWT_SECRET = process.env.JWT_SECRET || '28092006'; 
// ---------------------------------

// --- Middleware (Giữ nguyên) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) {
    return res.status(401).json({ message: 'Chưa xác thực (token rỗng)' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ' });
    }
    req.userId = decoded.userId; 
    next(); 
  });
};

// --- Module 1: API Đăng ký (Giữ nguyên) ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });
    }
    const existingUser = await db.query('SELECT 1 FROM Users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUserRes = await db.query(
      'INSERT INTO Users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, full_name',
      [fullName, email, passwordHash]
    );
    const newUser = newUserRes.rows[0];
    const token = jwt.sign({ userId: newUser.user_id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({
      token: token,
      user: { userId: newUser.user_id, fullName: newUser.full_name },
      hasProfile: false,
    });
  } catch (error) {
    console.error('Lỗi /register:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// --- Module 1: API Đăng nhập (Giữ nguyên) ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRes = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const profileRes = await db.query('SELECT 1 FROM UserProfiles WHERE user_id = $1 AND is_onboarding_complete = TRUE', [user.user_id]);
    const hasProfile = profileRes.rows.length > 0;
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({
      token: token,
      user: { userId: user.user_id, fullName: user.full_name },
      hasProfile: hasProfile,
    });
  } catch (error) {
    console.error('Lỗi /login:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// --- Module 2: API Tạo Hồ sơ (Onboarding) (Giữ nguyên) ---
app.post('/api/profiles', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; 
    const existingProfile = await db.query('SELECT 1 FROM UserProfiles WHERE user_id = $1', [userId]);
    if (existingProfile.rows.length > 0) {
      return res.status(409).json({ message: 'Hồ sơ đã tồn tại.' });
    }
    const {
      userRole, objective, primaryGoal, fieldOfStudyPrimary, fieldOfStudySecondary,
      skills, toolsProficiency, interestKeywords, timezone, availabilitySlots,
      commitmentHours, primaryLanguage, timeManagementStyle, communicationPref, teamSizePref
    } = req.body;
    if (!userRole || !objective || !primaryGoal || !fieldOfStudyPrimary) {
        return res.status(400).json({ message: 'Vui lòng điền các trường bắt buộc.' });
    }
    const newProfileRes = await db.query(
      `INSERT INTO UserProfiles (
        user_id, user_role, objective, primary_goal, timezone, commitment_hours,
        time_management_style, communication_pref, team_size_pref, primary_language,
        field_of_study_primary, field_of_study_secondary, availability_slots, 
        tools_proficiency, interest_keywords,
        skill_programming, skill_statistics, skill_academic_writing, skill_data_visualization,
        is_onboarding_complete
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, TRUE
      ) RETURNING *`,
      [
        userId, userRole, objective, primaryGoal, timezone, commitmentHours,
        timeManagementStyle, communicationPref, teamSizePref, primaryLanguage,
        fieldOfStudyPrimary, fieldOfStudySecondary, availabilitySlots,
        toolsProficiency, interestKeywords,
        skills.programming, skills.statistics, skills.academicWriting, skills.dataVisualization
      ]
    );
    res.status(201).json(newProfileRes.rows[0]);
  } catch (error) {
    console.error('Lỗi POST /api/profiles:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo hồ sơ' });
  }
});


// --- API Lấy Hồ sơ Của Tôi (GET /api/profiles/me) (Giữ nguyên) ---
app.get('/api/profiles/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; 
    const profileRes = await db.query(
      `SELECT 
         u.user_id, u.full_name, 
         p.* FROM UserProfiles p
       JOIN Users u ON p.user_id = u.user_id
       WHERE u.user_id = $1`,
      [userId] 
    );
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ của bạn. Bạn đã hoàn thành onboarding chưa?' });
    }
    const profileData = profileRes.rows[0];
    const formattedProfile = {
        user_id: profileData.user_id,
        full_name: profileData.full_name,
        user_role: profileData.user_role,
        objective: profileData.objective,
        primaryGoal: profileData.primary_goal,
        timezone: profileData.timezone,
        commitmentHours: profileData.commitment_hours,
        timeManagementStyle: profileData.time_management_style,
        communicationPref: profileData.communication_pref,
        teamSizePref: profileData.team_size_pref,
        primaryLanguage: profileData.primary_language,
        fieldOfStudyPrimary: profileData.field_of_study_primary,
        fieldOfStudySecondary: profileData.field_of_study_secondary, 
        availabilitySlots: profileData.availability_slots, 
        toolsProficiency: profileData.tools_proficiency, 
        interestKeywords: profileData.interest_keywords, 
        skills: {
            programming: profileData.skill_programming,
            statistics: profileData.skill_statistics,
            academicWriting: profileData.skill_academic_writing,
            dataVisualization: profileData.skill_data_visualization,
        }
    };
    res.status(200).json(formattedProfile);
  } catch (error) {
    console.error('Lỗi GET /api/profiles/me:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi truy vấn hồ sơ' });
  }
});

// --- API Cập nhật Hồ sơ (PUT /api/profiles) (Giữ nguyên) ---
app.put('/api/profiles', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; 
    const {
      userRole, objective, primaryGoal, fieldOfStudyPrimary, fieldOfStudySecondary,
      skills, toolsProficiency, interestKeywords, timezone, availabilitySlots,
      commitmentHours, primaryLanguage, timeManagementStyle, communicationPref, teamSizePref
    } = req.body;
    if (!userRole || !objective || !primaryGoal || !fieldOfStudyPrimary) {
        return res.status(400).json({ message: 'Vui lòng điền các trường bắt buộc.' });
    }
    const updatedProfileRes = await db.query(
      `UPDATE UserProfiles SET 
        user_role = $2, objective = $3, primary_goal = $4, timezone = $5, commitment_hours = $6,
        time_management_style = $7, communication_pref = $8, team_size_pref = $9, primary_language = $10,
        field_of_study_primary = $11, field_of_study_secondary = $12, availability_slots = $13, 
        tools_proficiency = $14, interest_keywords = $15,
        skill_programming = $16, skill_statistics = $17, skill_academic_writing = $18, skill_data_visualization = $19
      WHERE user_id = $1
      RETURNING *`, 
      [
        userId, userRole, objective, primaryGoal, timezone, commitmentHours,
        timeManagementStyle, communicationPref, teamSizePref, primaryLanguage,
        fieldOfStudyPrimary, fieldOfStudySecondary, availabilitySlots,
        toolsProficiency, interestKeywords,
        skills.programming, skills.statistics, skills.academicWriting, skills.dataVisualization
      ]
    );
    if (updatedProfileRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ để cập nhật.' });
    }
    res.status(200).json(updatedProfileRes.rows[0]); 
  } catch (error) {
    console.error('Lỗi PUT /api/profiles:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật hồ sơ' });
  }
});

// --- API Lấy Chi tiết Hồ sơ (Cho Modal) (Giữ nguyên) ---
app.get('/api/profiles/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params; 
    if (isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'UserID không hợp lệ.' });
    }
    const profileRes = await db.query(
      `SELECT 
         u.user_id, u.full_name, 
         p.* FROM UserProfiles p
       JOIN Users u ON p.user_id = u.user_id
       WHERE u.user_id = $1`,
      [userId]
    );
    if (profileRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ người dùng.' });
    }
    const profileData = profileRes.rows[0];
    const formattedProfile = {
        user_id: profileData.user_id,
        full_name: profileData.full_name,
        user_role: profileData.user_role,
        objective: profileData.objective,
        primaryGoal: profileData.primary_goal,
        timezone: profileData.timezone,
        commitmentHours: profileData.commitment_hours,
        timeManagementStyle: profileData.time_management_style,
        communicationPref: profileData.communication_pref,
        teamSizePref: profileData.team_size_pref,
        primaryLanguage: profileData.primary_language,
        fieldOfStudyPrimary: profileData.field_of_study_primary,
        fieldOfStudySecondary: profileData.field_of_study_secondary,
        availabilitySlots: profileData.availability_slots,
        toolsProficiency: profileData.tools_proficiency,
        interestKeywords: profileData.interest_keywords,
        skills: {
            programming: profileData.skill_programming,
            statistics: profileData.skill_statistics,
            academicWriting: profileData.skill_academic_writing,
            dataVisualization: profileData.skill_data_visualization,
        }
    };
    res.status(200).json(formattedProfile);
  } catch (error) {
    console.error('Lỗi GET /api/profiles/:userId:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi truy vấn hồ sơ' });
  }
});

// --- Module 3: API Lấy Dữ liệu Trang chủ (Giữ nguyên) ---
app.get('/api/home/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; 
    const incomingRes = await db.query(
      `SELECT mr.*, u.full_name AS sender_name, up.user_role AS sender_role
       FROM MatchingRequests mr
       JOIN Users u ON mr.sender_id = u.user_id
       JOIN UserProfiles up ON mr.sender_id = up.user_id
       WHERE mr.receiver_id = $1 AND mr.status = 'pending'`,
      [userId]
    );
    const outgoingRes = await db.query(
      `SELECT mr.*, u.full_name AS receiver_name, up.user_role AS receiver_role
       FROM MatchingRequests mr
       JOIN Users u ON mr.receiver_id = u.user_id
       JOIN UserProfiles up ON mr.receiver_id = up.user_id
       WHERE mr.sender_id = $1 AND mr.status = 'pending'`,
      [userId]
    );
    const connectionsRes = await db.query(
      `SELECT 
         c.connection_id, c.status,
         CASE
           WHEN c.user_a_id = $1 THEN c.user_b_id
           ELSE c.user_a_id
         END AS other_user_id,
         u.full_name AS other_user_name,
         up.user_role AS other_user_role
       FROM Connections c
       JOIN Users u ON u.user_id = (CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END)
       JOIN UserProfiles up ON up.user_id = u.user_id
       WHERE (c.user_a_id = $1 OR c.user_b_id = $1) AND c.status = 'active'`,
      [userId]
    );
    res.status(200).json({
      onGoing: {
        incomingRequests: incomingRes.rows,
        outgoingRequests: outgoingRes.rows,
      },
      matched: {
        connections_1v1: connectionsRes.rows,
      },
    });

  } catch (error) {
    console.error('Lỗi GET /api/home/summary:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu trang chủ' });
  }
});


// --- HÀM TRỢ GIÚP (Giữ nguyên) ---
const getSkillValue = (skillString) => {
  if (!skillString) return 0;
  return parseInt(skillString.split('_')[0]) || 0;
};
const jaccardSimilarity = (arrA, arrB) => {
  if (!arrA || !arrB || arrA.length === 0 || arrB.length === 0) {
    return 0;
  }
  const setA = new Set(arrA);
  const setB = new Set(arrB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) {
    return 0;
  }
  return intersection.size / union.size;
};


// --- Module 4: API Lấy Gợi ý (Giữ nguyên) ---
app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    const seekerId = req.userId;
    const { mode } = req.query; 

    // 1. Lấy HỒ SƠ CỦA NGƯỜI TÌM KIẾM (Seeker)
    const seekerProfileRes = await db.query(
      `SELECT field_of_study_primary, objective, 
              skill_programming, skill_statistics, 
              skill_academic_writing, skill_data_visualization,
              tools_proficiency, interest_keywords 
       FROM UserProfiles WHERE user_id = $1`,
      [seekerId]
    );
    
    if (seekerProfileRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ người tìm kiếm. Vui lòng hoàn thành hồ sơ.' });
    }
    
    const seekerProfile = seekerProfileRes.rows[0];
    const seekerPrimaryField = seekerProfile.field_of_study_primary;
    const seekerKeywords = seekerProfile.interest_keywords || [];

    // 2. LỌC CỨNG (SQL WHERE)
    let query = '';
    let queryParams = []; 

    if (mode === 'mentorship') {
      queryParams = [seekerId, seekerPrimaryField];
      query = `
        SELECT 
          p.user_id, u.full_name, p.user_role, 
          p.field_of_study_primary, p.tools_proficiency, p.interest_keywords,
          p.skill_programming, p.skill_statistics, p.skill_academic_writing, p.skill_data_visualization
        FROM UserProfiles p
        JOIN Users u ON p.user_id = u.user_id
        WHERE 
          p.objective = 'Tìm Học trò (Mentee)' AND 
          p.user_role IN ('Giáo sư/Giảng viên', 'Nghiên cứu sinh PhD', 'Chuyên gia Ngành') AND
          p.user_id != $1 AND
          (p.field_of_study_primary = $2 OR $2 = ANY(p.field_of_study_secondary))
        LIMIT 100;
      `;
    } 
    else if (mode.startsWith('collaborator')) {
      queryParams = [seekerId, seekerPrimaryField, seekerKeywords];
      query = `
        SELECT 
          p.user_id, u.full_name, p.user_role, 
          p.field_of_study_primary, p.tools_proficiency, p.interest_keywords,
          p.skill_programming, p.skill_statistics, p.skill_academic_writing, p.skill_data_visualization
        FROM UserProfiles p
        JOIN Users u ON p.user_id = u.user_id
        WHERE 
          p.objective = 'Tìm Cộng tác viên' AND 
          p.user_id != $1 AND
          (p.field_of_study_primary = $2 OR $2 = ANY(p.field_of_study_secondary)) AND
          (p.interest_keywords && $3) 
        LIMIT 100;
      `;
    }
    else {
      return res.status(400).json({ message: 'Chế độ tìm kiếm không hợp lệ' });
    }

    const candidatesRes = await db.query(query, queryParams);
    let candidates = candidatesRes.rows;

    // 3. LỌC CHUNG (Loại bỏ người đã tương tác)
    const existingRequests = await db.query(
      `SELECT receiver_id FROM MatchingRequests WHERE sender_id = $1
       UNION
       SELECT user_a_id FROM Connections WHERE user_b_id = $1
       UNION
       SELECT user_b_id FROM Connections WHERE user_a_id = $1`,
      [seekerId]
    );
    const existingIds = new Set(existingRequests.rows.map(r => r.receiver_id || r.user_a_id || r.user_b_id));
    
    candidates = candidates.filter(c => !existingIds.has(c.user_id));

    // 4. LỌC NÂNG CAO (Sắp xếp / Scoring)
    
    const s_prog = getSkillValue(seekerProfile.skill_programming);
    const s_stat = getSkillValue(seekerProfile.skill_statistics);
    const s_write = getSkillValue(seekerProfile.skill_academic_writing);
    const s_vis = getSkillValue(seekerProfile.skill_data_visualization);
    const seekerTools = seekerProfile.tools_proficiency || [];

    if (mode === 'collaborator_similar') {
      candidates.forEach(c => {
        const c_prog = getSkillValue(c.skill_programming);
        const c_stat = getSkillValue(c.skill_statistics);
        const c_write = getSkillValue(c.skill_academic_writing);
        const c_vis = getSkillValue(c.skill_data_visualization);
        
        const skillDistance = Math.abs(s_prog - c_prog) + Math.abs(s_stat - c_stat) +
                              Math.abs(s_write - c_write) + Math.abs(s_vis - c_vis);
        const jaccardTools = jaccardSimilarity(seekerTools, c.tools_proficiency || []);
        const jaccardKeywords = jaccardSimilarity(seekerKeywords, c.interest_keywords || []);

        c.totalDistance = (skillDistance / 12) * 0.5 +       // 50%
                          (1 - jaccardTools) * 0.3 +        // 30%
                          (1 - jaccardKeywords) * 0.2;    // 20%
      });
      candidates.sort((a, b) => a.totalDistance - b.totalDistance);
    } 
    else if (mode === 'collaborator_complementary') {
      const gap_prog = 3 - s_prog;
      const gap_stat = 3 - s_stat;
      const gap_write = 3 - s_write;
      const gap_vis = 3 - s_vis;
      // Max Gap-Fill Score = (3*3 + 3*3 + 3*3 + 3*3) = 36

      candidates.forEach(c => {
        const c_prog = getSkillValue(c.skill_programming);
        const c_stat = getSkillValue(c.skill_statistics);
        const c_write = getSkillValue(c.skill_academic_writing);
        const c_vis = getSkillValue(c.skill_data_visualization);
        
        const skillGapFillScore = (gap_prog * c_prog) +
                                (gap_stat * c_stat) +
                                (gap_write * c_write) +
                                (gap_vis * c_vis);
        const jaccardToolsDistance = 1 - jaccardSimilarity(seekerTools, c.tools_proficiency || []);
        const jaccardKeywords = jaccardSimilarity(seekerKeywords, c.interest_keywords || []);
        
        c.totalScore = (skillGapFillScore / 36) * 0.5 + // 50%
                       (jaccardToolsDistance * 0.3) +   // 30%
                       (jaccardKeywords * 0.2);         // 20%
      });
      candidates.sort((a, b) => b.totalScore - a.totalScore);
    }
    
    // 5. Trả về 10 kết quả hàng đầu
    res.status(200).json(candidates.slice(0, 10)); 

  } catch (error) {
    console.error('Lỗi GET /api/recommendations:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy gợi ý' });
  }
});


// --- Module 4: API Gửi Lời mời (Request) (Giữ nguyên) ---
app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId, requestType } = req.body;
    if (!receiverId || !requestType) {
      return res.status(400).json({ message: 'Thiếu receiverId hoặc requestType' });
    }
    const existing = await db.query(
        'SELECT 1 FROM MatchingRequests WHERE sender_id = $1 AND receiver_id = $2 AND status = $3',
        [senderId, receiverId, 'pending']
    );
    if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'Bạn đã gửi lời mời đến người này rồi.' });
    }
    await db.query(
      'INSERT INTO MatchingRequests (sender_id, receiver_id, request_type, status) VALUES ($1, $2, $3, $4)',
      [senderId, receiverId, requestType, 'pending']
    );
    res.status(201).json({ message: 'Đã gửi lời mời thành công!' });
  } catch (error) {
    console.error('Lỗi POST /api/requests:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi gửi lời mời' });
  }
});

// --- Module 4: API Chấp nhận Lời mời (Giữ nguyên) ---
app.post('/api/requests/:requestId/accept', authenticateToken, async (req, res) => {
  try {
    const receiverId = req.userId; 
    const { requestId } = req.params; 
    await db.query('BEGIN'); 
    const deleteRes = await db.query(
      `DELETE FROM MatchingRequests 
       WHERE request_id = $1 AND receiver_id = $2 AND status = 'pending'
       RETURNING sender_id`, 
      [requestId, receiverId]
    );
    if (deleteRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy lời mời' });
    }
    const senderId = deleteRes.rows[0].sender_id;
    await db.query(
      'INSERT INTO Connections (user_a_id, user_b_id, status) VALUES ($1, $2, $3)',
      [senderId, receiverId, 'active']
    );
    await db.query('COMMIT'); 
    res.status(201).json({ message: 'Kết nối thành công!' });
  } catch (error) {
    await db.query('ROLLBACK'); 
    console.error('Lỗi /accept request:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi chấp nhận' });
  }
});

// --- Module 4: API Từ chối Lời mời (Giữ nguyên) ---
app.post('/api/requests/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    const receiverId = req.userId;
    const { requestId } = req.params;
    const deleteRes = await db.query(
      'DELETE FROM MatchingRequests WHERE request_id = $1 AND receiver_id = $2',
      [requestId, receiverId]
    );
    if (deleteRes.rowCount === 0) {
        return res.status(404).json({ message: 'Không tìm thấy lời mời' });
    }
    res.status(200).json({ message: 'Đã từ chối lời mời.' });
  } catch (error) {
    console.error('Lỗi /reject request:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi từ chối' });
  }
});

// --- API HỦY LỜI MỜI (CHO NGƯỜI GỬI) (Giữ nguyên) ---
app.delete('/api/requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const senderId = req.userId; 
    const { requestId } = req.params;

    const deleteRes = await db.query(
      'DELETE FROM MatchingRequests WHERE request_id = $1 AND sender_id = $2',
      [requestId, senderId] 
    );
    
    if (deleteRes.rowCount === 0) {
        return res.status(404).json({ message: 'Không tìm thấy lời mời hoặc bạn không có quyền hủy.' });
    }

    res.status(200).json({ message: 'Đã hủy lời mời.' });
  } catch (error) {
    console.error('Lỗi DELETE /api/requests/:requestId:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi hủy lời mời' });
  }
});

// Khởi động server
const PORT = 5000; 
app.listen(PORT, () => {
  console.log(`🚀 Backend API đang chạy tại http://localhost:${PORT}`);
});