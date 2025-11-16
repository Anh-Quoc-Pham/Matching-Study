// File: frontend-app/src/HomePage.js (ĐÃ CẬP NHẬT API_URL CHO DEPLOY)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// --- === LOGIC AVATAR (GIỮ NGUYÊN) === ---
import avatar1 from './avatars/1.jpg';
import avatar2 from './avatars/2.jpg';
import avatar3 from './avatars/3.jpg';
import avatar4 from './avatars/4.jpg';
import avatar5 from './avatars/5.jpg';
import logo from './avatars/logo.png'; 

const AVATAR_LIST = [avatar1, avatar2, avatar3, avatar4, avatar5];

const getStableRandomAvatar = (userId) => {
  const id = parseInt(userId) || 0; 
  const index = id % AVATAR_LIST.length; 
  return AVATAR_LIST[index]; 
};
// --- === KẾT THÚC LOGIC AVATAR === ---


// --- === CẬP NHẬT 3: SỬA API_URL === ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// -------------------------------------


// Hàm trợ giúp format Kỹ năng (giữ nguyên)
const formatSkill = (skillString) => {
  if (!skillString || skillString === '0_Không biết') return 'N/A'; 
  const parts = skillString.split('_'); 
  return parts.length > 1 ? parts[1] : skillString; 
};

function HomePage() {
  const navigate = useNavigate();
  const prevOutgoingRequests = useRef([]);
  
  const [myProfile, setMyProfile] = useState(null);
  const [myProfileLoading, setMyProfileLoading] = useState(true);

  const [summaryData, setSummaryData] = useState({
    onGoing: { incomingRequests: [], outgoingRequests: [] },
    matched: { connections_1v1: [] },
  });
  
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');
  
  const [activeTab, setActiveTab] = useState('new');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 
  const [myProfileError, setMyProfileError] = useState(''); 

  const [selectedProfile, setSelectedProfile] = useState(null); 
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [isBellOpen, setIsBellOpen] = useState(false);
  
  // (Các hàm thông báo giữ nguyên)
  useEffect(() => {
    const savedNotifications = localStorage.getItem('appNotifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appNotifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (message, type) => {
    const newNotif = { 
      id: Date.now(), message, type, read: false, 
      timestamp: new Date().toLocaleTimeString() 
    };
    setNotifications(prev => [newNotif, ...prev]);
  };
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const handleBellClick = () => {
    if (!isBellOpen && unreadCount > 0) {
      markAllAsRead(); 
    }
    setIsBellOpen(prev => !prev);
  };
  
  // (fetchSummary giữ nguyên)
  const fetchSummary = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/home/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const prevOutgoing = prevOutgoingRequests.current;
      const currentOutgoing = response.data.onGoing.outgoingRequests;
      if (prevOutgoing.length > currentOutgoing.length) {
        const currentIds = new Set(currentOutgoing.map(req => req.request_id));
        prevOutgoing.forEach(prevReq => {
          if (!currentIds.has(prevReq.request_id)) {
            const wasAccepted = response.data.matched.connections_1v1.some(conn => 
              conn.other_user_id === prevReq.receiver_id
            );
            if (!wasAccepted) {
              addNotification(`Người ${prevReq.receiver_name} đã từ chối lời mời của bạn.`, 'error');
            } else {
               addNotification(`Người ${prevReq.receiver_name} đã CHẤP NHẬN lời mời của bạn!`, 'success');
            }
          }
        });
      }
      prevOutgoingRequests.current = currentOutgoing;
      
      setSummaryData(response.data);
      setError(''); 

    } catch (err) {
      console.error("Lỗi tải summary:", err);
      setError('Không thể tải dữ liệu các tab.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // (fetchMyProfile giữ nguyên)
  const fetchMyProfile = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setMyProfileLoading(true);
      const response = await axios.get(`${API_URL}/profiles/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMyProfile(response.data);
      setMyProfileError(''); 
    } catch (err) {
      console.error("Lỗi khi tải hồ sơ của tôi:", err);
      if (err.response && err.response.status === 404) {
          setMyProfileError('Không tìm thấy hồ sơ. Vui lòng tạo/hoàn thành hồ sơ.');
      } else {
          setMyProfileError('Không thể tải hồ sơ của bạn.');
      }
    } finally {
      setMyProfileLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSummary();
    fetchMyProfile();
    const intervalId = setInterval(fetchSummary, 60000); 
    return () => clearInterval(intervalId); 
  }, [fetchSummary, fetchMyProfile]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('appNotifications'); 
    navigate('/login');
  };

  // (openProfileModal và closeProfileModal giữ nguyên)
  const openProfileModal = async (profile) => {
    setModalLoading(true);
    setModalError('');
    setSelectedProfile(null); 
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }
    try {
      const response = await axios.get(`${API_URL}/profiles/${profile.user_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSelectedProfile(response.data); 
    } catch (err) {
      console.error("Lỗi khi tải chi tiết hồ sơ:", err);
      setModalError('Không thể tải chi tiết hồ sơ. Vui lòng thử lại.');
    } finally {
      setModalLoading(false);
    }
  };
  const closeProfileModal = () => {
    setSelectedProfile(null);
    setModalLoading(false);
    setModalError('');
  };
  
  // (Các hàm logic matching giữ nguyên)
  const handleFetchRecommendations = async (mode) => {
    setRecLoading(true);
    setRecError('');
    setRecommendations([]); 
    
    if (!myProfile) {
        setRecError('Không thể tìm kiếm khi hồ sơ của bạn chưa được tải.');
        setRecLoading(false);
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }

    try {
      const response = await axios.get(`${API_URL}/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { mode: mode } 
      });
      setRecommendations(response.data);
      if (response.data.length === 0) {
        setRecError('Không tìm thấy ai phù hợp với thuật toán này.');
      }
    } catch (err) {
      console.error("Lỗi tải gợi ý:", err);
      setRecError('Lỗi khi tải gợi ý. Thử lại sau.');
    } finally {
      setRecLoading(false);
    }
  };
  const handleSendRequest = async (receiverId, receiverName) => {
    const token = localStorage.getItem('authToken');
    try {
      await axios.post(
        `${API_URL}/requests`, 
        { receiverId: receiverId, requestType: '1-to-1' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      addNotification(`Đã gửi lời mời đến ${receiverName} thành công!`, 'success'); 
      setRecommendations(prev => prev.filter(rec => rec.user_id !== receiverId));
      fetchSummary(); 
    } catch (err) {
      addNotification(`Gửi thất bại: ${err.response?.data?.message || 'Không thể gửi lời mời'}`, 'error');
    }
  };
  const handleAcceptRequest = async (requestId, senderName) => {
    const token = localStorage.getItem('authToken');
    try {
      await axios.post(
        `${API_URL}/requests/${requestId}/accept`, 
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      addNotification(`Bạn đã chấp nhận kết nối với ${senderName}.`, 'success'); 
      fetchSummary(); 
    } catch (err) {
      addNotification('Lỗi khi chấp nhận lời mời.', 'error');
    }
  };
  const handleRejectRequest = async (requestId, senderName) => {
    const token = localStorage.getItem('authToken');
    try {
      await axios.post(
        `${API_URL}/requests/${requestId}/reject`, 
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      addNotification(`Bạn đã từ chối lời mời từ ${senderName}.`, 'error');
      fetchSummary(); 
    } catch (err) {
      addNotification('Lỗi khi từ chối.', 'error');
    }
  };

  // (Hàm Hủy Request giữ nguyên)
  const handleCancelRequest = async (requestId, receiverName) => {
    const token = localStorage.getItem('authToken');
    
    if (!window.confirm(`Bạn có chắc muốn hủy lời mời đã gửi đến ${receiverName}?`)) {
      return;
    }
    
    try {
      await axios.delete(
        `${API_URL}/requests/${requestId}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      addNotification(`Đã hủy lời mời đến ${receiverName}.`, 'info'); 
      fetchSummary(); 
    } catch (err) {
      addNotification('Lỗi khi hủy lời mời.', 'error');
    }
  };

  // --- STYLES (Giữ nguyên) ---
  const pageStyle = { 
    padding: '0', 
    maxWidth: '1200px', 
    margin: '30px auto', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: '16px', 
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    overflow: 'hidden' 
  };
  const headerStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #e0e0e0', 
    padding: '20px 30px', 
    backgroundColor: '#fdf2f2' 
  };
  const mainContentStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '30px', 
    padding: '30px' 
  };
  const leftColumnStyle = {
    width: '320px', 
    flexShrink: 0,
  };
  const rightColumnStyle = {
    flexGrow: 1, 
    minWidth: 0, 
  };
  const tabContainerStyle = { 
    display: 'flex', 
    borderBottom: '2px solid #e0e0e0', 
    marginBottom: '20px' 
  };
  const tabStyle = { 
    padding: '12px 20px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    border: 'none', 
    background: 'none',
    color: '#555' 
  };
  const activeTabStyle = { 
    ...tabStyle, 
    color: '#c0392b', 
    borderBottom: '3px solid #c0392b' 
  };
  const boxStyle = { 
    border: '1px solid #eee', 
    padding: '20px', 
    borderRadius: '12px', 
    marginBottom: '15px',
    backgroundColor: '#fdfdfd' 
  };
  const notificationColor = (type) => {
    switch (type) {
      case 'success': return '#d4edda';
      case 'error': return '#f8d7da';
      default: return '#e2e3e5';
    }
  };
  const buttonStyle = {
      padding: '10px 15px', 
      marginRight: '10px',
      cursor: 'pointer',
      border: '1px solid #ccc',
      borderRadius: '8px', 
      backgroundColor: '#f9f9f9',
      fontWeight: '500'
  };

  // --- COMPONENT CỘT TRÁI (Giữ nguyên) ---
  const renderMyProfile = () => {
    if (myProfileLoading) {
      return <p>Đang tải hồ sơ của bạn...</p>;
    }
    if (myProfileError) {
      return (
        <div>
          <p style={{color: 'red'}}>{myProfileError}</p>
          <button onClick={fetchMyProfile}>Thử lại</button>
          {myProfileError.includes("Không tìm thấy") && (
             <button 
                style={{...buttonStyle, background: '#27ae60', color: 'white', marginTop: '10px', width: '100%'}}
                onClick={() => navigate('/onboarding')} 
              >
                Tạo hồ sơ ngay
              </button>
          )}
        </div>
      );
    }
    if (!myProfile) {
      return <p>Không có dữ liệu hồ sơ.</p>;
    }
    
    // --- STYLES CHO CỘT TRÁI ---
    const profileCardStyle = {
      border: '1px solid #e0e0e0',
      borderRadius: '12px', 
      padding: '25px',
      backgroundColor: '#f9f9f9',
      maxHeight: 'calc(100vh - 210px)', 
      overflowY: 'auto', 
      position: 'sticky', 
      top: '30px'
    };
    const avatarStyle = {
      width: '150px', 
      height: '150px', 
      borderRadius: '50%',
      margin: '0 auto 15px auto', display: 'block',
      border: '3px solid #f39c12', 
      objectFit: 'cover'
    };
    const editButtonStyle = {
      width: '100%', padding: '12px', marginTop: '20px',
      cursor: 'pointer', background: '#27ae60', 
      color: 'white', border: 'none', borderRadius: '8px',
      fontSize: '1em', fontWeight: 'bold'
    };
    const sectionTitleStyle = {
        borderBottom: '1px dashed #ccc',
        paddingBottom: '5px',
        marginTop: '20px',
        marginBottom: '10px',
        color: '#27ae60' 
    };
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr', 
        gap: '8px', 
        fontSize: '0.9em',
        wordBreak: 'break-word' 
    };
    const pStyle = { 
        margin: '5px 0',
        lineHeight: 1.5 
    };
    // ---------------------------------

    return (
      <div style={profileCardStyle}>
        
        <img 
          src={getStableRandomAvatar(myProfile.user_id)} 
          alt="Avatar" 
          style={avatarStyle}
        />
        
        <h3 style={{ textAlign: 'center', margin: '0 0 5px 0' }}>{myProfile.full_name}</h3>
        <p style={{ textAlign: 'center', margin: '0 0 15px 0', color: '#555' }}>{myProfile.user_role}</p>

        {/* ... (phần thông tin chi tiết giữ nguyên) ... */}
        
        <h4 style={sectionTitleStyle}>Thông tin chi tiết:</h4>
        <div style={gridStyle}>
            <p style={pStyle}><strong>Mục tiêu:</strong> {myProfile.objective}</p>
            <p style={pStyle}><strong>Mục tiêu chính:</strong> {myProfile.primaryGoal}</p>
            <p style={pStyle}><strong>Lĩnh vực chính:</strong> {myProfile.fieldOfStudyPrimary}</p>
            <p style={pStyle}><strong>Lĩnh vực phụ:</strong> {myProfile.fieldOfStudySecondary?.join(', ') || 'N/A'}</p>
            <p style={pStyle}><strong>Giờ cam kết:</strong> {myProfile.commitmentHours}</p>
            <p style={pStyle}><strong>Múi giờ:</strong> {myProfile.timezone}</p>
            <p style={pStyle}><strong>Phong cách:</strong> {myProfile.timeManagementStyle}</p>
            <p style={pStyle}><strong>Giao tiếp:</strong> {myProfile.communicationPref}</p>
            <p style={pStyle}><strong>Ngôn ngữ:</strong> {myProfile.primaryLanguage}</p>
            <p style={pStyle}><strong>Size nhóm:</strong> {myProfile.teamSizePref}</p>
        </div>
        <h4 style={sectionTitleStyle}>Kỹ năng:</h4>
        <div style={{...gridStyle, gridTemplateColumns: '1fr 1fr'}}> 
            <p style={pStyle}><strong>Lập trình:</strong> {formatSkill(myProfile.skills?.programming)}</p>
            <p style={pStyle}><strong>Thống kê:</strong> {formatSkill(myProfile.skills?.statistics)}</p>
            <p style={pStyle}><strong>Viết:</strong> {formatSkill(myProfile.skills?.academicWriting)}</p>
            <p style={pStyle}><strong>Trực quan:</strong> {formatSkill(myProfile.skills?.dataVisualization)}</p>
        </div>
        <h4 style={sectionTitleStyle}>Công cụ & Sở thích:</h4>
        <div style={gridStyle}>
            <p style={pStyle}>
                <strong>Công cụ:</strong> {myProfile.toolsProficiency?.join(', ') || 'N/A'}
            </p>
            <p style={pStyle}>
                <strong>Từ khóa:</strong> {myProfile.interestKeywords?.join(', ') || 'N/A'}
            </p>
            <p style={pStyle}>
                <strong>Giờ rảnh:</strong> {myProfile.availabilitySlots?.join(', ') || 'N/A'}
            </p>
        </div>
        
        <button 
          style={editButtonStyle}
          onClick={() => navigate('/onboarding?mode=edit')} 
        >
          Chỉnh sửa hồ sơ
        </button>
      </div>
    );
  };
  // --- === KẾT THÚC CỘT TRÁI === ---


  // --- RENDER NỘI DUNG TAB (Giữ nguyên) ---
  const renderTabContent = () => {
    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    if (activeTab === 'new') {
      return (
        <div>
          <h4>1. Chọn Chế độ (Kịch bản)</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              onClick={() => handleFetchRecommendations('mentorship')} 
              style={buttonStyle}
              disabled={!myProfile}
            >
              Tìm Mentor (Kịch bản 1)
            </button>
            <button 
              onClick={() => handleFetchRecommendations('collaborator_similar')} 
              style={buttonStyle}
              disabled={!myProfile}
            >
              Tìm Cộng tác viên (Tương đồng)
            </button>
            <button 
              onClick={() => handleFetchRecommendations('collaborator_complementary')} 
              style={buttonStyle}
              disabled={!myProfile}
            >
              Tìm Cộng tác viên (Bổ trợ)
            </button>
          </div>
          {!myProfile && myProfileError && (
             <p style={{ color: 'red', fontSize: '0.9em', marginTop: '10px' }}>{myProfileError} Bạn phải tạo hồ sơ trước khi tìm kiếm.</p>
          )}
          
          <hr style={{margin: '25px 0'}} />

          <h4>2. Kết quả gợi ý</h4>
          {recLoading && <p>Đang tìm kiếm...</p>}
          {recError && <p style={{ color: 'red' }}>{recError}</p>}
          
          {recommendations.length === 0 && !recLoading && !recError && (
            <p>Chưa có gợi ý. Hãy thử nhấn nút tìm kiếm.</p>
          )}

          {recommendations.map(rec => (
            <div key={rec.user_id} style={boxStyle}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Khu vực avatar nhỏ */}
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '15px', overflow: 'hidden', flexShrink: 0 }}>
                  
                  <img 
                    src={getStableRandomAvatar(rec.user_id)} 
                    alt="Avatar" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />

                </div>
                <p onClick={() => openProfileModal(rec)} style={{ fontWeight: 'bold', cursor: 'pointer', margin: 0, textDecoration: 'underline' }}>
                  {rec.full_name} ({rec.user_role})
                </p>
              </div>
              <p><i>Lĩnh vực: {rec.field_of_study_primary}</i></p>
              <button onClick={() => handleSendRequest(rec.user_id, rec.full_name)} style={{ background: '#c0392b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                Gửi lời mời
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'ongoing') {
      const { incomingRequests, outgoingRequests } = summaryData.onGoing;
      const clickableNameStyle = { textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' };
      return (
        <div>
          <h4>Lời mời đã nhận ({incomingRequests.length})</h4>
          {incomingRequests.length === 0 ? <p>Bạn không có lời mời nào.</p> : (
            incomingRequests.map(req => (
              <div key={req.request_id} style={boxStyle}>
                <p>
                  <strong style={clickableNameStyle} onClick={() => openProfileModal({ user_id: req.sender_id })}>
                    {req.sender_name}
                  </strong> 
                  {' '}({req.sender_role}) muốn kết nối.
                </p>
                <button onClick={() => handleAcceptRequest(req.request_id, req.sender_name)} style={{ background: '#27ae60', color: 'white', marginRight: '10px', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                  Chấp nhận
                </button>
                <button onClick={() => handleRejectRequest(req.request_id, req.sender_name)} style={{ background: '#95a5a6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                  Từ chối
                </button>
              </div>
            ))
          )}
          
          <h4 style={{marginTop: '30px'}}>Lời mời đã gửi ({outgoingRequests.length})</h4>
          {outgoingRequests.length === 0 ? <p>Bạn chưa gửi lời mời nào.</p> : (
            outgoingRequests.map(req => (
              <div key={req.request_id} style={boxStyle}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0 }}>Đã gửi yêu cầu đến 
                    <strong style={clickableNameStyle} onClick={() => openProfileModal({ user_id: req.receiver_id })}>
                      {req.receiver_name}
                    </strong> 
                    {' '}({req.receiver_role}) - <i>Đang chờ</i>
                  </p>
                  <button 
                    onClick={() => handleCancelRequest(req.request_id, req.receiver_name)}
                    style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9em' }}
                  >
                    Hủy
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      );
    }
    
    if (activeTab === 'matched') {
      // (Giữ nguyên logic tab Matched)
      const { connections_1v1 } = summaryData.matched;
      return (
        <div>
          <h4>Kết nối 1-với-1 ({connections_1v1.length})</h4>
          {connections_1v1.length === 0 ? <p>Bạn chưa có kết nối nào.</p> : (
            connections_1v1.map(conn => (
              <div key={conn.connection_id} style={boxStyle}>
                <p>Bạn đã kết nối với <strong>{conn.other_user_name}</strong> ({conn.other_user_role})</p>
                <button style={{ background: '#f39c12', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Chat</button>
              </div>
            ))
          )}
        </div>
      );
    }
  };


  // --- RENDER CHÍNH (ĐÃ THAY ĐỔI BỐ CỤC) ---
  return (
    <div style={pageStyle}>
      {/* Header (Giữ nguyên) */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              width: '40px', 
              height: '40px', 
              marginRight: '15px' 
            }} 
          />
          <h2 style={{ 
              color: '#c0392b', 
              fontWeight: '700', 
              fontFamily: 'Montserrat, sans-serif', 
              fontSize: '2.0rem',
              textTransform: 'uppercase', 
              letterSpacing: '1px' 
          }}>
            Trang Chủ
          </h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <button 
            onClick={handleBellClick} 
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8rem', position: 'relative', 
              marginRight: '20px', color: unreadCount > 0 ? '#f39c12' : '#777' 
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', top: '0', right: '0', background: 'red', color: 'white', 
                borderRadius: '50%', padding: '0 5px', fontSize: '0.6em' 
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {isBellOpen && (
            <div style={{ 
              position: 'absolute', top: '50px', right: '0', width: '300px', 
              maxHeight: '400px', overflowY: 'auto', background: 'white', border: '1px solid #ccc', 
              borderRadius: '8px', zIndex: '10', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ padding: '10px', borderBottom: '1px solid #eee', margin: '0', color: 'black' }}>
                Thông báo ({notifications.length})
              </h4>
              {notifications.length === 0 ? (
                <p style={{ padding: '10px', color: 'black' }}>Bạn không có thông báo nào.</p>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid #eee', 
                      backgroundColor: notificationColor(n.type),
                      color: 'black',
                      fontWeight: n.read ? 'normal' : 'bold'
                    }}
                  >
                    <p style={{ margin: '0' }}>{n.message}</p>
                    <small style={{ color: '#555' }}>{n.timestamp}</small>
                  </div>
                ))
              )}
            </div>
          )}

          <button onClick={handleLogout} style={{ padding: '8px 15px', cursor: 'pointer', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
            Đăng xuất
          </button>
        </div>
      </div>
      {/* === KẾT THÚC THAY ĐỔI HEADER === */}


      {/* BỐ CỤC 2 CỘT MỚI */}
      <div style={mainContentStyle}>
        
        {/* CỘT TRÁI */}
        <div style={leftColumnStyle}>
          {renderMyProfile()}
        </div>

        {/* CỘT PHẢI */}
        <div style={rightColumnStyle}>
          <div style={tabContainerStyle}>
            <button style={activeTab === 'new' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('new')}>
              Tìm kiếm mới (New Matching)
            </button>
            <button style={activeTab === 'ongoing' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('ongoing')}>
              Đang chờ (On-going) ({summaryData.onGoing.incomingRequests.length + summaryData.onGoing.outgoingRequests.length})
            </button>
            <button style={activeTab === 'matched' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('matched')}>
              Đã kết nối (Matched) ({summaryData.matched.connections_1v1.length})
            </button>
          </div>
          <div style={{ padding: '0px 10px' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* Modal (giữ nguyên) */}
      {(modalLoading || selectedProfile || modalError) && (
        <ProfileModal 
          profile={selectedProfile} 
          isLoading={modalLoading}
          error={modalError}
          onClose={closeProfileModal} 
          handleSendRequest={handleSendRequest}
          myUserId={myProfile?.user_id} 
        />
      )}
    </div>
  );
}

// --- COMPONENT MODAL (ĐÃ CẬP NHẬT AVATAR) ---
const ProfileModal = ({ profile, isLoading, error, onClose, handleSendRequest, myUserId }) => {
    
    const handleSendClick = () => {
        if (profile) {
            handleSendRequest(profile.user_id, profile.full_name);
            onClose(); 
        }
    };
    
    const modalOverlayStyle = { 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', 
        justifyContent: 'center', alignItems: 'center' 
    };
    const modalContentStyle = { 
        backgroundColor: 'white', padding: '30px', borderRadius: '12px', 
        maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', 
        position: 'relative', color: 'black', minHeight: '200px' 
    };
    const closeButtonStyle = { 
        position: 'absolute', top: '10px', right: '10px', 
        background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' 
    };
    const sectionTitleStyle = {
        borderBottom: '1px dashed #ccc',
        paddingBottom: '5px',
        marginTop: '20px',
        marginBottom: '10px',
        color: '#27ae60' 
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}> 
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> 
                <button onClick={onClose} style={closeButtonStyle}>
                    &times;
                </button>
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <h3>Đang tải chi tiết hồ sơ...</h3>
                    </div>
                )}
                {error && !isLoading && (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <h3 style={{ color: 'red' }}>Đã xảy ra lỗi</h3>
                        <p>{error}</p>
                        <button onClick={onClose}>Đóng</button>
                    </div>
                )}
                {profile && !isLoading && !error && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            
                            <img 
                              src={getStableRandomAvatar(profile.user_id)} 
                              alt="Avatar" 
                              style={{ 
                                width: '120px', 
                                height: '120px', 
                                borderRadius: '50%', 
                                marginBottom: '10px', 
                                objectFit: 'cover' 
                              }}
                            />

                            <h3 style={{ margin: 0 }}>{profile.full_name}</h3>
                            <p style={{ margin: 0, color: '#555' }}>{profile.user_role}</p>
                        </div>
                        <h4 style={sectionTitleStyle}>Thông tin chi tiết:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px', fontSize: '0.9em' }}>
                            <div><strong>Mục tiêu:</strong> {profile.objective}</div>
                            <div><strong>Mục tiêu chính:</strong> {profile.primaryGoal}</div>
                            <div><strong>Lĩnh vực chính:</strong> {profile.fieldOfStudyPrimary}</div>
                            <div><strong>Lĩnh vực phụ:</strong> {profile.fieldOfStudySecondary?.join(', ') || 'N/A'}</div>
                            <div><strong>Giờ cam kết:</strong> {profile.commitmentHours}</div>
                            <div><strong>Múi giờ:</strong> {profile.timezone}</div>
                            <div><strong>Phong cách:</strong> {profile.timeManagementStyle}</div>
                            <div><strong>Giao tiếp:</strong> {profile.communicationPref}</div>
                            <div><strong>Ngôn ngữ:</strong> {profile.primaryLanguage}</div>
                            <div><strong>Size nhóm:</strong> {profile.teamSizePref}</div>
                        </div>
                        <h4 style={sectionTitleStyle}>Kỹ năng:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', fontSize: '0.9em' }}>
                            <div><strong>Lập trình:</strong> {formatSkill(profile.skills?.programming)}</div>
                            <div><strong>Thống kê:</strong> {formatSkill(profile.skills?.statistics)}</div>
                            <div><strong>Viết học thuật:</strong> {formatSkill(profile.skills?.academicWriting)}</div>
                            <div><strong>Trực quan hóa:</strong> {formatSkill(profile.skills?.dataVisualization)}</div>
                        </div>
                        <h4 style={sectionTitleStyle}>Công cụ & Sở thích:</h4>
                         <div style={{fontSize: '0.9em'}}>
                            <p>
                                <strong>Công cụ:</strong> {profile.toolsProficiency?.join(', ') || 'N/A'}
                            </p>
                            <p>
                                <strong>Từ khóa quan tâm:</strong> {profile.interestKeywords?.join(', ') || 'N/A'}
                            </p>
                            <p>
                                <strong>Giờ rảnh:</strong> {profile.availabilitySlots?.join(', ') || 'N/A'}
                            </p>
                        </div>
                        
                        {myUserId !== profile.user_id && (
                            <button onClick={handleSendClick} style={{ padding: '10px 20px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '1em', marginTop: '10px' }}>
                                Gửi Lời Mời
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};


export default HomePage;