import React from 'react';
import { COLORS } from '../../constants';

export default function Card({ children, style = {}, onClick }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        background: "rgba(5, 9, 20, 0.6)", 
        border: `1px solid ${COLORS.border}`, 
        borderRadius: 16, 
        padding: "1.25rem", 
        backdropFilter: "blur(10px)",
        boxShadow: `0 0 20px rgba(0, 240, 255, 0.02)`,
        ...style, 
        cursor: onClick ? "pointer" : "default" 
      }}
    >
      {children}
    </div>
  );
}
