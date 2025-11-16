// File: frontend-app/src/AvailabilitySelector.js (TẠO FILE MỚI NÀY)

import React, { useState, useEffect } from 'react';

// Định nghĩa các hàng và cột cho bảng
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SLOTS = ['Sáng', 'Chiều', 'Tối'];

function AvailabilitySelector({ value, onChange }) {
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (value) {
      const slotsArray = value.split(',').map(s => s.trim()).filter(Boolean);
      setSelected(new Set(slotsArray));
    } else {
      setSelected(new Set());
    }
  }, [value]); 

  const handleToggle = (day, slot) => {
    const slotKey = `${slot} ${day}`; // Ví dụ: "Sáng T2"
    const newSelected = new Set(selected); 

    if (newSelected.has(slotKey)) {
      newSelected.delete(slotKey);
    } else {
      newSelected.add(slotKey);
    }
    
    setSelected(newSelected);
    
    const newValueString = Array.from(newSelected).join(',');
    onChange(newValueString); // Báo cho OnboardingPage
  };

  // --- Styles ---
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '50px repeat(7, 1fr)', 
    gap: '4px',
    userSelect: 'none', 
  };
  const cellStyle = {
    padding: '10px 5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '0.9em',
  };
  const headerCellStyle = { ...cellStyle, backgroundColor: '#f4f4f4', fontWeight: 'bold' };
  const slotHeaderStyle = { ...headerCellStyle, fontSize: '0.8em', padding: '12px 2px' };
  const selectableCellStyle = { ...cellStyle, cursor: 'pointer', backgroundColor: '#fff' };
  const selectedCellStyle = {
    ...selectableCellStyle,
    backgroundColor: '#007bff', 
    color: 'white',
    borderColor: '#007bff',
    fontWeight: 'bold',
  };

  // --- Render ---
  return (
    <div style={gridStyle}>
      <div style={headerCellStyle}></div> 
      {DAYS.map(day => (
        <div key={day} style={headerCellStyle}>{day}</div>
      ))}
      {SLOTS.map(slot => (
        <React.Fragment key={slot}>
          <div style={slotHeaderStyle}>{slot}</div>
          {DAYS.map(day => {
            const slotKey = `${slot} ${day}`;
            const isSelected = selected.has(slotKey);
            const style = isSelected ? selectedCellStyle : selectableCellStyle;
            return (
              <div
                key={slotKey}
                style={style}
                onClick={() => handleToggle(day, slot)}
              >
                {isSelected ? '✓' : ''} 
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

export default AvailabilitySelector;