import React from 'react';

export default function Badge({ children, color = "green", dot = false }) {
  const map = { 
    green: { bg: "#d1fae5", text: "#065f46" }, 
    red: { bg: "#fee2e2", text: "#991b1b" }, 
    amber: { bg: "#fef3c7", text: "#92400e" }, 
    blue: { bg: "#dbeafe", text: "#1e40af" }, 
    gray: { bg: "#f3f4f6", text: "#374151" } 
  };
  const c = map[color] || map.gray;
  return (
    <span style={{ 
      background: c.bg, 
      color: c.text, 
      fontSize: 11, 
      fontWeight: 600, 
      padding: "2px 8px", 
      borderRadius: 20, 
      display: "inline-flex", 
      alignItems: "center", 
      gap: 4 
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text }} />}
      {children}
    </span>
  );
}
