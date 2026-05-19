import React from 'react';
import { COLORS } from '../../constants';

export default function Card({ children, style = {}, onClick }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        background: "#fff", 
        border: `1px solid ${COLORS.border}`, 
        borderRadius: 16, 
        padding: "1.25rem", 
        ...style, 
        cursor: onClick ? "pointer" : "default" 
      }}
    >
      {children}
    </div>
  );
}
