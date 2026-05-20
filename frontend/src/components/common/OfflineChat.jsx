import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { COLORS } from '../../constants';
import Btn from './Btn';

export default function OfflineChat({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncMessages();
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    loadMessages();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadMessages = async () => {
    const stored = await localforage.getItem(`chat_${user?._id}`) || [];
    setMessages(stored);
  };

  const syncMessages = async () => {
    const stored = await localforage.getItem(`chat_${user?._id}`) || [];
    let synced = false;
    
    const updatedMessages = stored.map(msg => {
      if (msg.status === 'queued') {
        // Mock sending to backend
        synced = true;
        return { ...msg, status: 'sent' };
      }
      return msg;
    });

    if (synced) {
      await localforage.setItem(`chat_${user?._id}`, updatedMessages);
      setMessages(updatedMessages);
      console.log('Synced queued messages to server');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      status: isOffline ? 'queued' : 'sent',
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setMessage('');

    await localforage.setItem(`chat_${user?._id}`, newMessages);

    // Mock bot reply if online
    if (!isOffline) {
      setTimeout(async () => {
        const botReply = {
          id: Date.now() + 1,
          text: "I'm a virtual assistant. A real health worker will reply shortly.",
          sender: 'bot',
          status: 'received',
          timestamp: new Date().toISOString()
        };
        const updatedWithBot = [...newMessages, botReply];
        setMessages(updatedWithBot);
        await localforage.setItem(`chat_${user?._id}`, updatedWithBot);
      }, 1000);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: COLORS.primary,
          color: 'white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          border: 'none',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          fontSize: '24px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '320px',
      height: '450px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 5px 25px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <div style={{
        background: COLORS.primary,
        color: 'white',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{ margin: 0 }}>Assistance Chat</h4>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>✖</button>
      </div>
      
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: '50%' }}>
            {isOffline ? "You are offline. Messages will be sent when connection is restored." : "How can we help you today?"}
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            background: msg.sender === 'user' ? COLORS.primaryLight : 'white',
            border: `1px solid ${msg.sender === 'user' ? COLORS.primary : COLORS.border}`,
            padding: '10px 14px',
            borderRadius: '12px',
            maxWidth: '80%'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>{msg.text}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: COLORS.textMuted }}>
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              {msg.sender === 'user' && (
                <span style={{ fontSize: '12px' }}>
                  {msg.status === 'queued' ? '⏳' : '✓'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ padding: '16px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isOffline ? "Type offline SMS..." : "Type a message..."}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${COLORS.border}` }}
        />
        <Btn type="submit" small style={{ padding: '0 16px' }}>➤</Btn>
      </form>
    </div>
  );
}
