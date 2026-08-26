import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]                   = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => { setOpen(v => !v); if (!open && unread > 0) markAllRead(); }}
        style={{ background:'#f1f5f9', border:'none', borderRadius:'8px', width:'36px', height:'36px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', position:'relative' }}>
        🔔
        {unread > 0 && (
          <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'#ef4444', color:'#fff', fontSize:'10px', fontWeight:'700', borderRadius:'50%', width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:'absolute', top:'44px', right:0, width:'300px', background:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0', boxShadow:'0 10px 25px rgba(0,0,0,0.12)', zIndex:200, overflow:'hidden' }}>
          <div style={{ padding:'0.875rem 1rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:'600', fontSize:'0.875rem', color:'#0f172a' }}>Notifications</span>
            {unread > 0 && <button onClick={markAllRead} style={{ background:'none', border:'none', color:'#6366f1', fontSize:'0.75rem', cursor:'pointer', fontWeight:'500' }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight:'320px', overflowY:'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ textAlign:'center', color:'#94a3b8', padding:'2rem', margin:0, fontSize:'0.875rem' }}>No notifications yet</p>
            ) : notifications.map(n => (
              <div key={n.id} style={{ padding:'0.875rem 1rem', borderBottom:'1px solid #f8fafc', background: n.read ? '#fff' : '#eff6ff' }}>
                <p style={{ margin:'0 0 0.25rem', fontSize:'0.85rem', color:'#0f172a' }}>{n.message}</p>
                <p style={{ margin:0, fontSize:'0.7rem', color:'#94a3b8' }}>{new Date(n.createdAt).toLocaleDateString('en-NZ', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}