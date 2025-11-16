// File: frontend-app/src/MultiSelectTags.js (ĐÃ SỬA LỖI VỊ TRÍ DROPDOWN)

import React, { useState, useRef, useEffect } from 'react';

function MultiSelectTags({ options, value, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filteredSuggestions = options.filter(option => 
    !value.includes(option) && 
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef]);

  const addTag = (tag) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]); 
    }
    setInputValue(''); 
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  // --- Styles ---
  
  // === THAY ĐỔI 1: THÊM STYLE CHO KHUNG BỌC BÊN NGOÀI ===
  const outerWrapperStyle = {
    position: 'relative', // <-- Đây là cái "neo" (anchor) cho suggestionsStyle
  };
  // ===================================================

  const containerStyle = {
    // position: 'relative', // <-- BỎ DÒNG NÀY ĐI
    border: '1px solid #aaa',
    borderRadius: '4px',
    padding: '5px',
    backgroundColor: 'white',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    minHeight: '44px',
  };
  const tagStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    padding: '3px 8px',
    margin: '3px',
    fontSize: '0.9em',
    fontWeight: '500',
  };
  const tagCloseStyle = {
    marginLeft: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };
  const inputStyle = {
    border: 'none',
    outline: 'none',
    padding: '8px',
    flex: '1',
    minWidth: '150px',
  };
  
  // Style này giữ nguyên, nó sẽ tự động "bám" vào outerWrapperStyle
  const suggestionsStyle = {
    position: 'absolute', 
    top: '100%', // 100% của outerWrapperStyle (ngay bên dưới)
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  };
  const suggestionItemStyle = {
    padding: '10px',
    cursor: 'pointer',
  };

  return (
    // === THAY ĐỔI 2: ÁP DỤNG STYLE MỚI VÀO DIV CHA ===
    <div ref={containerRef} style={outerWrapperStyle}>
    {/* ============================================== */}

      <div style={containerStyle} onClick={() => inputRef.current?.focus()}>
        {/* Render các tags đã chọn */}
        {value.map(tag => (
          <div key={tag} style={tagStyle}>
            {tag}
            <span style={tagCloseStyle} onClick={() => removeTag(tag)}>&times;</span>
          </div>
        ))}
        {/* Ô input để gõ */}
        <input
          ref={inputRef}
          type="text"
          style={inputStyle}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
        />
      </div>
      
      {/* Danh sách gợi ý (giờ sẽ nằm đúng vị trí) */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={suggestionsStyle}>
          {filteredSuggestions.map(suggestion => (
            <div
              key={suggestion}
              style={suggestionItemStyle}
              // Thêm hover effect cho đẹp
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f4f4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              onClick={() => addTag(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectTags;