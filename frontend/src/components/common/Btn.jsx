import React from 'react';
import { COLORS } from '../../constants';

export default function Btn({ children, variant = "primary", onClick, style = {}, small = false }) {
  const variants = {
    primary: { background: COLORS.primary, color: "#000", border: "none" },
    outline: { background: "transparent", color: COLORS.primary, border: `2px solid ${COLORS.primary}` },
    danger: { background: COLORS.danger, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: COLORS.text, border: `1px solid ${COLORS.border}` },
    amber: { background: COLORS.accent, color: "#fff", border: "none" },
  };
  return (
    <button 
      onClick={onClick} 
      style={{ 
        ...variants[variant], 
        borderRadius: 10, 
        padding: small ? "6px 14px" : "10px 20px", 
        fontSize: small ? 12 : 14, 
        fontWeight: 600, 
        cursor: "pointer", 
        transition: "opacity 0.15s", 
        ...style 
      }} 
      onMouseOver={e => e.currentTarget.style.opacity = "0.85"} 
      onMouseOut={e => e.currentTarget.style.opacity = "1"}
    >
      {children}
    </button>
  );
}
