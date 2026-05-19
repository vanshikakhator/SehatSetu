import React, { useState } from 'react';
import { COLORS } from '../../constants';

export default function SOSButton({ onPress }) {
  const [pressed, setPressed] = useState(false);
  const handle = () => { 
    setPressed(true); 
    onPress && onPress(); 
    setTimeout(() => setPressed(false), 3000); 
  };
  return (
    <button 
      onClick={handle} 
      style={{ 
        width: 100, 
        height: 100, 
        borderRadius: "50%", 
        background: pressed ? "#7f1d1d" : COLORS.danger, 
        border: "4px solid #fca5a5", 
        color: "#fff", 
        fontWeight: 900, 
        fontSize: 16, 
        cursor: "pointer", 
        boxShadow: pressed ? "0 0 0 8px #fee2e233" : "none", 
        transition: "all 0.2s", 
        animation: pressed ? "none" : "pulse 2s infinite" 
      }}
    >
      {pressed ? "SENT!" : "SOS"}
    </button>
  );
}
