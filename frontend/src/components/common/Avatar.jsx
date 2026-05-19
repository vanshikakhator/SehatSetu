import React from 'react';
import { COLORS } from '../../constants';

export default function Avatar({ initials, size = 40, color = COLORS.primary }) {
  return (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: "50%", 
      background: color + "22", 
      border: `2px solid ${color}44`, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      fontWeight: 700, 
      fontSize: size * 0.35, 
      color: color, 
      flexShrink: 0 
    }}>
      {initials}
    </div>
  );
}
