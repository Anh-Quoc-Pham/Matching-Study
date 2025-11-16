// File: frontend-app/src/OnboardingPage.js (NÂNG CẤP HỖ TRỢ CHẾ ĐỘ "EDIT")

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom'; // <-- 1. Import useLocation
import AvailabilitySelector from './AvailabilitySelector'; 
import MultiSelectTags from './MultiSelectTags'; 

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// (Danh sách gợi ý giữ nguyên)
const fieldOptions = [
  'Học Máy', 'Khoa học Máy tính', 'Kinh tế học', 'Phát triển Web', 
  'Quản trị Kinh doanh', 'Sinh học Phân tử', 'Xã hội học'
];
const toolOptionsList = [
  'Android', 'C#', 'C++', 'Docker', 'Excel', 'Flutter', 'Git', 'GraphPad', 
  'HTML/CSS', 'Java', 'JavaScript', 'Kotlin', 'Kubernetes', 'LaTeX', 'MySQL', 
  'NS3', 'NodeJS', 'PowerPoint', 'PyTorch', 'Python', 'R', 'React', 'SPSS', 
  'SQL', 'Stata', 'Swift', 'Tableau', 'TensorFlow', 'Unity', 'Wireshark'
];
const keywordOptionsList = [
  'AI', 'AI for Health', 'AWS', 'Accounting', 'Analysis', 'Android', 'Biomedical', 
  'Biotech', 'Bài tập', 'Bài tập lớn', 'CRISPR', 'Cancer', 'Case Study', 
  'Chính sách công', 'Chứng khoán', 'Cloud', 'Communications', 'Computer Vision', 
  'Corporate Finance', 'Criminology', 'Cybersecurity', 'DSA', 'Data', 'Data Analysis', 
  'Data Science', 'Database', 'Deep Learning', 'DevOps', 'Development Economics', 
  'Digital Marketing', 'Econometrics', 'Economics', 'Education', 'Finance', 'Frontend', 
  'Fullstack', 'Game Theory', 'GameDev', 'Generative AI', 'Genetics', 'HR', 
  'Homework', 'International Trade', 'Investment', 'IoT', 'Khảo sát', 'Kinh tế', 
  'Kế toán', 'LLM', 'Lab', 'Logistics', 'Lý thuyết trò chơi', 'Machine Learning', 
  'Marketing', 'Media', 'Medical Imaging', 'Microeconomics', 'Mobile', 'NLP', 
  'Networking', 'Pentest', 'Phân tích', 'Phỏng vấn', 'Poverty', 'Project', 
  'Public Health', 'Public Policy', 'ReactJS', 'Recruitment', 'SEO', 'SQL', 
  'Security', 'Supply Chain', 'Survey', 'Tax', 'Thuế', 'Tuyển dụng', 'Tài chính', 
  'Tài chính doanh nghiệp', 'Unity', 'Văn hóa', 'Web', 'iOS', 'Đầu tư'
];

// --- 2. STATE BAN ĐẦU (rỗng) ---
// Chúng ta sẽ điền dữ liệu này sau, dựa trên chế độ (mode)
const initialProfileData = {
  userRole: 'Sinh viên Đại học',
  objective: 'Tìm Cố vấn (Mentor)',
  primaryGoal: 'Học kỹ năng mới',
  fieldOfStudyPrimary: 'Khoa học Máy tính',
  fieldOfStudySecondary: '', 
  skills: {
    programming: '1_Mới bắt đầu',
    statistics: '0_Không biết',
    academicWriting: '0_Không biết',
    dataVisualization: '0_Không biết',
  },
  toolsProficiency: [], 
  interestKeywords: [], 
  timezone: 'GMT+7',
  availabilitySlots: '', 
  commitmentHours: '1-5 giờ',
  primaryLanguage: 'Tiếng Việt',
  timeManagementStyle: 'Proactive (Làm sớm)',
  communicationPref: 'Async (Chat/Email)',
  teamSizePref: '1-với-1',
};


function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation(); // <-- 3. Lấy vị trí (để đọc URL)

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  
  // --- 4. STATE ĐỘNG ---
  const [profileData, setProfileData] = useState(initialProfileData);
  const [mode, setMode] = useState('create'); // Mặc định là 'create'
  const [isLoading, setIsLoading] = useState(true); // State tải dữ liệu

  // --- 5. LOGIC PHÁT HIỆN CHẾ ĐỘ (MODE) ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editMode = params.get('mode') === 'edit';
    
    if (editMode) {
      setMode('edit');
      // Tải dữ liệu hồ sơ hiện có
      const fetchMyProfile = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) { navigate('/login'); return; }
        
        try {
          setIsLoading(true);
          const response = await axios.get(`${API_URL}/profiles/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const profile = response.data;

          // Điền dữ liệu cũ vào form
          setProfileData({
            userRole: profile.user_role || 'Sinh viên Đại học',
            objective: profile.objective || 'Tìm Cố vấn (Mentor)',
            primaryGoal: profile.primaryGoal || 'Học kỹ năng mới',
            fieldOfStudyPrimary: profile.fieldOfStudyPrimary || '',
            // Chuyển mảng lĩnh vực phụ về chuỗi
            fieldOfStudySecondary: (profile.fieldOfStudySecondary || []).join(', '),
            skills: profile.skills || initialProfileData.skills,
            // Dữ liệu mảng gán trực tiếp
            toolsProficiency: profile.toolsProficiency || [], 
            interestKeywords: profile.interestKeywords || [],
            timezone: profile.timezone || 'GMT+7',
            // Chuyển mảng giờ rảnh về chuỗi
            availabilitySlots: (profile.availabilitySlots || []).join(','),
            commitmentHours: profile.commitmentHours || '1-5 giờ',
            primaryLanguage: profile.primaryLanguage || 'Tiếng Việt',
            timeManagementStyle: profile.timeManagementStyle || 'Proactive (Làm sớm)',
            communicationPref: profile.communicationPref || 'Async (Chat/Email)',
            teamSizePref: profile.teamSizePref || '1-với-1',
          });
        } catch (err) {
          console.error("Lỗi tải hồ sơ để sửa:", err);
          setError("Không thể tải hồ sơ của bạn. Vui lòng thử lại.");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchMyProfile();

    } else {
      setMode('create');
      setProfileData(initialProfileData); // Dùng state rỗng
      setIsLoading(false); // Sẵn sàng để tạo mới
    }
  }, [location, navigate]); // Chạy lại khi URL thay đổi


  // (Tất cả các hàm Handler giữ nguyên)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  const handleAvailabilityChange = (newSlotsString) => {
    setProfileData(prev => ({ ...prev, availabilitySlots: newSlotsString }));
  };
  const handleSkillChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      skills: { ...prev.skills, [name]: value },
    }));
  };
  const handleToolsChange = (newToolsArray) => {
    setProfileData(prev => ({ ...prev, toolsProficiency: newToolsArray }));
  };
  const handleKeywordsChange = (newKeywordsArray) => {
    setProfileData(prev => ({ ...prev, interestKeywords: newKeywordsArray }));
  };
  
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // --- 6. LOGIC SUBMIT (TỔNG) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }

    try {
      // Chuẩn bị dữ liệu (giống nhau cho cả 2 chế độ)
      const dataToSend = {
        ...profileData,
        fieldOfStudySecondary: profileData.fieldOfStudySecondary.split(',').map(s => s.trim()).filter(Boolean),
        toolsProficiency: profileData.toolsProficiency, // Đã là mảng
        interestKeywords: profileData.interestKeywords, // Đã là mảng
        availabilitySlots: profileData.availabilitySlots.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (mode === 'edit') {
        // --- CHẾ ĐỘ EDIT ---
        console.log('Đang cập nhật (PUT) dữ liệu:', dataToSend);
        await axios.put(
          `${API_URL}/profiles`, // Dùng API PUT
          dataToSend, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        alert('Cập nhật hồ sơ thành công!');
        navigate('/home'); // Quay về trang chủ
        
      } else {
        // --- CHẾ ĐỘ CREATE ---
        console.log('Đang tạo mới (POST) dữ liệu:', dataToSend);
        await axios.post(
          `${API_URL}/profiles`, // Dùng API POST
          dataToSend, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        alert('Tạo hồ sơ thành công! Chuyển đến Trang chủ.');
        navigate('/home'); 
      }

    } catch (err) {
      console.error('Lỗi khi submit hồ sơ:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(`Lỗi: ${err.response.data.message}`);
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    }
  };

  // (Styles giữ nguyên)
  const formStyle = { 
    padding: '20px', 
    maxWidth: '600px', 
    margin: 'auto', 
    border: '1px solid #ccc', 
    borderRadius: '8px', 
    marginTop: '30px',
    backgroundColor: 'white',                          // <- thêm nền trắng
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)'          // <- thêm bóng
  };
  const inputGroupStyle = { marginBottom: '15px' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
  const inputStyle = { width: '95%', padding: '8px', fontSize: '1rem' };
  const selectStyle = { width: '100%', padding: '8px', fontSize: '1rem' };
  const buttonGroupStyle = { display: 'flex', justifyContent: 'space-between', marginTop: '20px' };

  // --- 7. THÊM TRẠNG THÁI LOADING ---
  if (isLoading) {
    return (
      <div style={formStyle}>
        <h2>Đang tải dữ liệu hồ sơ...</h2>
      </div>
    );
  }
  
  // --- 8. RENDER (thêm tiêu đề động) ---
  return (
    <div style={formStyle}>
      {/* Tiêu đề động */}
      <h2>
        {mode === 'edit' ? 'Cập nhật Hồ Sơ Của Bạn' : 'Tạo Hồ Sơ Của Bạn'} (Bước {currentStep}/5)
      </h2>
      
      <form onSubmit={handleSubmit}>
        
        <datalist id="field-options">
          {fieldOptions.map(option => (
            <option key={option} value={option} />
          ))}
        </datalist>

        {currentStep === 1 && (
          <div>
            {/* ...Nội dung Bước 1... */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Bạn là ai?</label>
              <select name="userRole" value={profileData.userRole} onChange={handleChange} style={selectStyle}>
                <option>Sinh viên Đại học</option>
                <option>Học viên Cao học</option>
                <option>Nghiên cứu sinh PhD</option>
                <option>Giáo sư/Giảng viên</option>
                <option>Chuyên gia Ngành</option>
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Mục tiêu của bạn?</label>
              <select name="objective" value={profileData.objective} onChange={handleChange} style={selectStyle}>
                <option>Tìm Cố vấn (Mentor)</option>
                <option>Tìm Học trò (Mentee)</option>
                <option>Tìm Cộng tác viên</option>
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Mục tiêu chính?</label>
              <select name="primaryGoal" value={profileData.primaryGoal} onChange={handleChange} style={selectStyle}>
                <option>Học kỹ năng mới</option>
                <option>Xây dựng dự án</option>
                <option>Đăng báo</option>
                <option>Hoàn thành bài tập</option>
                <option>Lấy điểm</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            {/* ...Nội dung Bước 2... */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Lĩnh vực chính (Bắt buộc)</label>
              <input 
                type="text" 
                name="fieldOfStudyPrimary" 
                value={profileData.fieldOfStudyPrimary} 
                onChange={handleChange} 
                style={inputStyle}
                list="field-options" 
                placeholder="Nhập hoặc chọn lĩnh vực..."
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Lĩnh vực phụ (ngăn cách bằng dấu phẩy ,)</label>
              <input 
                type="text" 
                name="fieldOfStudySecondary" 
                value={profileData.fieldOfStudySecondary} 
                onChange={handleChange} 
                style={inputStyle} 
                list="field-options" 
                placeholder="Nhập thêm (vd: Tài chính) hoặc chọn..."
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Kỹ năng Lập trình</label>
              <select name="programming" value={profileData.skills.programming} onChange={handleSkillChange} style={selectStyle}>
                <option value="0_Không biết">0 - Không biết</option>
                <option value="1_Mới bắt đầu">1 - Mới bắt đầu</option>
                <option value="2_Trung cấp">2 - Trung cấp</option>
                <option value="3_Chuyên gia">3 - Chuyên gia</option>
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Kỹ năng Thống kê</label>
              <select name="statistics" value={profileData.skills.statistics} onChange={handleSkillChange} style={selectStyle}>
                <option value="0_Không biết">0 - Không biết</option>
                <option value="1_Mới bắt đầu">1 - Mới bắt đầu</option>
                <option value="2_Trung cấp">2 - Trung cấp</option>
                <option value="3_Chuyên gia">3 - Chuyên gia</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            {/* ...Nội dung Bước 3... */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Công cụ (chọn nhiều)</label>
              <MultiSelectTags
                placeholder="Chọn hoặc nhập công cụ..."
                options={toolOptionsList} 
                value={profileData.toolsProficiency} 
                onChange={handleToolsChange} 
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Từ khóa quan tâm (chọn nhiều)</label>
              <MultiSelectTags
                placeholder="Chọn hoặc nhập từ khóa..."
                options={keywordOptionsList} 
                value={profileData.interestKeywords} 
                onChange={handleKeywordsChange} 
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            {/* ...Nội dung Bước 4... */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Múi giờ (Timezone)</label>
              <select name="timezone" value={profileData.timezone} onChange={handleChange} style={selectStyle}>
                <option>GMT+7</option>
                <option>GMT+8</option>
                <option>GMT-4</option>
                <option>GMT-5</option>
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Khung giờ rảnh (Click để chọn)</label>
              <AvailabilitySelector 
                value={profileData.availabilitySlots}
                onChange={handleAvailabilityChange}
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Số giờ cam kết (mỗi tuần)</label>
              <select name="commitmentHours" value={profileData.commitmentHours} onChange={handleChange} style={selectStyle}>
                <option>1-5 giờ</option>
                <option>6-10 giờ</option>
                <option>11-15 giờ</option>
                <option>16+ giờ</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            {/* ...Nội dung Bước 5... */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Phong cách Quản lý Thời gian</label>
              <select name="timeManagementStyle" value={profileData.timeManagementStyle} onChange={handleChange} style={selectStyle}>
                <option>Proactive (Làm sớm)</option>
                <option>DeadlineDriven (Nước đến chân mới nhảy)</option>
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Hình thức Giao tiếp</label>
              <select name="communicationPref" value={profileData.communicationPref} onChange={handleChange} style={selectStyle}>
                <option>Async (Chat/Email)</option>
                <option>Sync (Gọi video)</option>
                <option>Hybrid (Kết hợp)</option>
                <option>In-Person (Trực tiếp)</option>
              </select>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Kích thước Nhóm</label>
              <select name="teamSizePref" value={profileData.teamSizePref} onChange={handleChange} style={selectStyle}>
                <option>1-với-1</option>
                <option>Nhóm nhỏ (3-5)</option>
              </select>
            </div>
          </div>
        )}

        {/* Nút điều hướng */}
        <div style={buttonGroupStyle}>
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Quay lại
            </button>
          )}
          {currentStep < 5 && (
            <button type="button" onClick={nextStep} style={{ padding: '10px 20px', cursor: 'pointer', marginLeft: 'auto' }}>
              Tiếp
            </button>
          )}
          
          {/* Nút Submit (hiển thị text động) */}
          {currentStep === 5 && (
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', background: 'green', color: 'white', marginLeft: 'auto' }}>
              {mode === 'edit' ? 'Cập nhật' : 'Hoàn thành'}
            </button>
          )}
        </div>
        
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
      </form>
    </div>
  );
}

export default OnboardingPage;