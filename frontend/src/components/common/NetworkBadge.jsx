import React from 'react';
import Badge from './Badge';

export default function NetworkBadge({ level }) {
  const map = { 
    high: { label: "Video", color: "green", icon: "📹" }, 
    medium: { label: "Voice", color: "amber", icon: "🎙️" }, 
    low: { label: "Chat", color: "blue", icon: "💬" }, 
    offline: { label: "SMS", color: "gray", icon: "📱" } 
  };
  const m = map[level];
  return <Badge color={m.color}>{m.icon} {m.label} mode</Badge>;
}
