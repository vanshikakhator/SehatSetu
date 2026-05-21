import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { COLORS } from '../../constants';

const SOCKET_URL = 'http://localhost:5000';

export default function ChatPanel({ appointmentId, userName, role, partnerName, isOffline }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to Socket.io
  useEffect(() => {
    if (!appointmentId) return;

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setConnected(true);
      s.emit('join-room', { appointmentId, userName, role });
    });

    s.on('disconnect', () => setConnected(false));

    // Receive full history on join
    s.on('chat-history', (history) => {
      setMessages(history);
    });

    // New message from anyone in the room
    s.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setPartnerTyping(false);
    });

    // Typing indicators
    s.on('user-typing', ({ sender }) => {
      if (sender !== userName) {
        setPartnerTyping(true);
        setTimeout(() => setPartnerTyping(false), 2000);
      }
    });

    s.on('user-joined', ({ userName: joinedUser }) => {
      setMessages(prev => [...prev, {
        sender: 'system',
        text: `${joinedUser} joined the chat`,
        timestamp: new Date().toISOString(),
        system: true
      }]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [appointmentId, userName, role]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socket) return;

    socket.emit('send-message', {
      appointmentId,
      sender: userName,
      role,
      text,
      timestamp: new Date().toISOString()
    });
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (socket) {
      socket.emit('typing', { appointmentId, sender: userName });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fff',
      borderLeft: '1px solid #e5e7eb',
      fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: '#1a1a2e', borderBottom: '1px solid #333', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <div>
            <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 15 }}>
              In-Call Chat {isOffline && <span style={{ fontSize: 11, background: '#f59e0b', color: '#000', borderRadius: 4, padding: '1px 6px', marginLeft: 6 }}>OFFLINE MODE</span>}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: connected ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
              {connected ? `● Connected · chatting with ${partnerName}` : '● Connecting...'}
            </p>
          </div>
        </div>
        {isOffline && (
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#fbbf24', lineHeight: 1.4 }}>
            📱 Chat works even on low data. Use this instead of video when signal is poor.
          </p>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 30 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <p>No messages yet. Say hi!</p>
            {isOffline && <p style={{ fontSize: 12, color: '#f59e0b' }}>You're in offline mode — use chat to communicate</p>}
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.system) {
            return (
              <div key={i} style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '4px 0' }}>
                {msg.text}
              </div>
            );
          }

          const isMe = msg.sender === userName;

          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
              gap: 3
            }}>
              {!isMe && (
                <span style={{ fontSize: 11, color: '#6b7280', paddingLeft: 4 }}>
                  {msg.role === 'doctor' ? '👨‍⚕️' : '🧑'} {msg.sender}
                </span>
              )}
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? COLORS.primary : '#f3f4f6',
                color: isMe ? '#fff' : '#111',
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: 'break-word',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: 10, color: '#9ca3af', paddingRight: isMe ? 4 : 0, paddingLeft: isMe ? 0 : 4 }}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          );
        })}

        {partnerTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 13 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#9ca3af',
                  animation: `bounce 1.2s ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
            {partnerName} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 20,
              border: '1.5px solid #d1d5db',
              fontSize: 14,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              maxHeight: 100,
              overflowY: 'auto',
              lineHeight: 1.5,
              background: '#fff',
              color: '#000',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: input.trim() && connected ? COLORS.primary : '#d1d5db',
              border: 'none',
              cursor: input.trim() && connected ? 'pointer' : 'not-allowed',
              color: '#fff',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s'
            }}
          >
            ➤
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          Messages are instant · Works on low bandwidth
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
