import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { logout } from '../redux/authSlice';
import { useSelector, useDispatch } from 'react-redux';

const Chat = () => {
  const [problemText, setProblemText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [hintCount, setHintCount] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const handlePaste = async (e) => {
      if (sessionId) return; // only allow pasting to start a NEW session, matches "+/upload" behavior
      if (loading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await handleImageUpload({ target: { files: [file], value: '' } });
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [sessionId, loading]);
  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    if (menuOpen) {
      document.addEventListener('click', closeMenu);
    }
    return () => document.removeEventListener('click', closeMenu);
  }, [menuOpen]);

  const fetchSessions = async () => {
    try {
      const res = await axiosInstance.get('/tutor/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };
  const confirmRename = async (id) => {
    const trimmed = editValue.trim();
    setEditingId(null);
    if (!trimmed) return;

    const current = sessions.find(s => s._id === id);
    if (trimmed === (current?.title || current?.problemText)) return;

    try {
      await axiosInstance.patch(`/tutor/sessions/${id}`, { title: trimmed });
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Rename failed');
    }
  };
  const handleCopy = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const loadSession = async (id) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/tutor/sessions/${id}`);
      setSessionId(res.data._id);
      setProblemText(res.data.problemText);
      setMessages(res.data.conversationHistory.map(m => ({ role: m.role, content: m.content })));
      setHintCount(res.data.hintCount);
    } catch (err) {
      alert('Failed to load session');
    }
    setLoading(false);
  };

  const startSession = async () => {
    if (!problemText.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post('/tutor/start', { problemText });
      setSessionId(res.data.sessionId);
      setMessages([
        { role: 'user', content: problemText },
        { role: 'model', content: res.data.reply }
      ]);
      setHintCount(res.data.hintCount);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start session');
    }
    setLoading(false);
  };


  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/tutor/message', { sessionId, message: userMsg });
      setMessages((prev) => [...prev, { role: 'model', content: res.data.reply }]);
      setHintCount(res.data.hintCount);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    }
    setLoading(false);
  };
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;

    try {
      await axiosInstance.delete(`/tutor/sessions/${id}`);
      if (sessionId === id) resetSession();
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await axiosInstance.post('/tutor/start-image', {
        image: base64,
        mimeType: file.type
      });
      setSessionId(res.data.sessionId);
      setProblemText(res.data.problemText);
      setMessages([
        { role: 'user', content: res.data.problemText },
        { role: 'model', content: res.data.reply }
      ]);
      setHintCount(res.data.hintCount);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to read image');
    }
    setLoading(false);
    e.target.value = '';
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const resetSession = () => {
    setSessionId(null);
    setMessages([]);
    setProblemText('');
    setHintCount(0);
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <div className="sidebar">
        <div
          className="sidebar-brand brand"
          onClick={resetSession}
          style={{ cursor: 'pointer' }}
          title="Back to new problem"
        >
          DSA Tutor
        </div>
        <button className="new-chat-btn" onClick={resetSession}>+ New problem</button>
        <div className="session-label">Recent</div>
        <div className="session-list">
          {sessions.length === 0 && (
            <div style={{ color: 'var(--slate-dim)', fontSize: 12.5, padding: '4px 6px', lineHeight: 1.5 }}>
              No chats yet — paste a problem or upload a photo to get started.
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s._id}
              className={`session-item ${sessionId === s._id ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              {editingId === s._id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename(s._id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => confirmRename(s._id)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--amber)',
                    borderRadius: 5,
                    color: 'var(--paper)',
                    fontSize: 13.5,
                    padding: '4px 6px'
                  }}
                />
              ) : (
                <>
                  <span onClick={() => loadSession(s._id)} style={{ flex: 1, cursor: 'pointer' }}>
                    {(s.title || s.problemText).slice(0, 32)}
                    {(s.title || s.problemText).length > 32 ? '…' : ''}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(s._id);
                      setEditValue(s.title || s.problemText);
                    }}
                    title="Rename"
                    style={{ cursor: 'pointer', color: 'var(--slate)', fontSize: 12, marginLeft: 6 }}
                  >
                    ✎
                  </span>
                  <span
                    onClick={(e) => handleDelete(e, s._id)}
                    title="Delete"
                    style={{ cursor: 'pointer', color: 'var(--slate)', fontSize: 12, marginLeft: 6 }}
                  >
                    🗑
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        <div className="chat-header">
          <h1 className="brand">{sessionId ? 'In progress' : 'New problem'}</h1>
          <div style={{ position: 'relative' }}>
            <div
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--teal)',
                color: '#EAF5F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 44,
                  right: 0,
                  background: 'var(--ink-soft)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  minWidth: 180,
                  padding: 6,
                  zIndex: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}
              >
                <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--paper)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {user?.username}
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 2 }}>{user?.email}</div>
                </div>
                <div
                  onClick={() => alert('Account settings coming soon')}
                  style={{ padding: '9px 10px', fontSize: 13.5, color: 'var(--slate)', cursor: 'pointer', borderRadius: 6 }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Account settings
                </div>
                <div
                  onClick={handleLogout}
                  style={{ padding: '9px 10px', fontSize: 13.5, color: '#E8847A', cursor: 'pointer', borderRadius: 6 }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(232,132,122,0.08)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  Log out
                </div>
              </div>
            )}
          </div>
        </div>

        {!sessionId ? (
          <div className="starter">
            <textarea
              className="starter-textarea"
              placeholder="Paste your DSA problem here… (or Ctrl+V a screenshot)"
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
            />
            <div className="starter-actions">
              <button className="btn-start" onClick={startSession} disabled={loading}>
                {loading ? 'Starting…' : 'Start'}
              </button>
              <button
                className="btn-upload"
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
                title="Upload a photo of your problem"
              >
                +
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="hint-trail">
              <span className="hint-trail-label">Hints</span>
              {Array.from({ length: Math.max(hintCount, 5) }).map((_, i) => (
                <span key={i} className={`hint-dot ${i < hintCount ? 'lit' : ''}`} />
              ))}
            </div>

            <div className="message-scroll">
              {messages.map((m, i) => (
                <div key={i} className={`msg-row ${m.role}`} style={{ flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <pre className={`bubble ${m.role}`}>{m.content}</pre>
                  {m.role === 'model' && m.content.includes('```') && (
                    <button
                      onClick={() => handleCopy(m.content, i)}
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'var(--slate)',
                        borderRadius: 5,
                        padding: '3px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedIdx === i ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="msg-row model">
                  <div className="typing-bubble">
                    <span className="typing-dot" style={{ animationDelay: '0s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                    <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="input-row">
              <input
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your response…"
                disabled={loading}
              />
              <button className="btn-send" onClick={sendMessage} disabled={loading}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;