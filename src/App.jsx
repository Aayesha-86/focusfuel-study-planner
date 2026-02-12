import { useState, useEffect } from 'react'
// Helper for ID generation
import './index.css'

// Helper for ID generation
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

function App() {
  // State
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('focusfuel_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins in seconds
  const [timerMode, setTimerMode] = useState('FOCUS'); // FOCUS or BREAK
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('focusfuel_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      // Play sound or notify?
      if (timerMode === 'FOCUS') {
        // Complete session logic if linked
        if (activeSessionId) {
          markSessionComplete(activeSessionId);
        }
        setTimerMode('BREAK');
        setTimeLeft(5 * 60);
      } else {
        setTimerMode('FOCUS');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerMode, activeSessionId]);

  // Handlers
  const addSession = (session) => {
    setSessions([...sessions, { id: generateId(), ...session, completed: false }]);
  };

  const markSessionComplete = (id) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, completed: true } : s));
  };

  const deleteSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const toggleTimer = () => setTimerActive(!timerActive);

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(timerMode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Derived State
  const completedCount = sessions.filter(s => s.completed).length;
  const progress = sessions.length > 0 ? (completedCount / sessions.length) * 100 : 0;

  // Smart Suggestion Logic
  const getSmartSuggestion = () => {
    // Find next uncompleted session
    const nextSession = sessions.find(s => !s.completed);
    if (!nextSession) return "All caught up! Great job!";

    // Suggest based on energy
    const { energy } = nextSession;
    if (energy === 'Low') return "Feeling low energy? Try a 5-minute easy review.";
    if (energy === 'Medium') return "Good time for some steady progress.";
    if (energy === 'High') return "High energy! Tackle the hardest problem now.";
    return "Plan your next move!";
  };

  return (
    <div className="app-container fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          FocusFuel ⚡
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Smart Study & Energy Planner</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>

        {/* Left Column: Timer & Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Smart Suggestion Card */}
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--secondary-color)' }}>
            <h3 style={{ fontSize: '1.1rem' }}>🤖 Smart Suggestion</h3>
            <p>{getSmartSuggestion()}</p>
          </div>

          {/* Timer Card */}
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', fontFamily: 'monospace', margin: '1rem 0' }}>
              {formatTime(timeLeft)}
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                background: timerMode === 'FOCUS' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: timerMode === 'FOCUS' ? '#a5b4fc' : '#6ee7b7',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.9rem'
              }}>
                {timerMode === 'FOCUS' ? 'Focus Mode' : 'Break Time'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={toggleTimer}>
                {timerActive ? 'Pause' : 'Start'}
              </button>
              <button className="btn btn-secondary" onClick={resetTimer}>
                Reset
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="glass-panel">
            <h3>Daily Progress</h3>
            <div style={{ background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(to right, var(--primary-color), var(--secondary-color))',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {completedCount} of {sessions.length} sessions completed
            </p>
          </div>
        </div>

        {/* Right Column: Add Session & List */}
        <div className="glass-panel">
          <h3>Add Focus Session</h3>
          <SessionForm onAdd={addSession} />

          <h3 style={{ marginTop: '2rem' }}>Upcoming Sessions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {sessions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No sessions planned yet.</p>}
            {sessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                onToggle={() => markSessionComplete(session.id)}
                onDelete={() => deleteSession(session.id)}
                isActive={session.id === activeSessionId}
                onSelect={() => setActiveSessionId(session.id)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// Sub-components (Internal for simplicity as requested)

function SessionForm({ onAdd }) {
  const [subject, setSubject] = useState('');
  const [time, setTime] = useState('25');
  const [energy, setEnergy] = useState('Medium');
  const [priority, setPriority] = useState('Medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject) return;
    onAdd({ subject, time, energy, priority });
    setSubject('');
    setEnergy('Medium');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Subject (e.g., Math, History)"
        value={subject}
        onChange={e => setSubject(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select value={energy} onChange={e => setEnergy(e.target.value)} style={{ flex: 1 }}>
          <option value="Low">Low Energy 🔋</option>
          <option value="Medium">Medium Energy ⚡</option>
          <option value="High">High Energy 🔥</option>
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ flex: 1 }}>
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
        + Add Session
      </button>
    </form>
  )
}

function SessionItem({ session, onToggle, onDelete, isActive, onSelect }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      padding: '1rem',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      border: isActive ? '1px solid var(--primary-color)' : '1px solid transparent',
      transition: 'all 0.2s ease',
      opacity: session.completed ? 0.6 : 1
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={onSelect}>
        <input
          type="checkbox"
          checked={session.completed}
          onChange={onToggle}
          style={{ width: '1.2rem', height: '1.2rem', margin: 0, cursor: 'pointer' }}
        />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 600, textDecoration: session.completed ? 'line-through' : 'none' }}>
            {session.subject}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {session.energy} Energy • {session.priority} Priority
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  )
}

export default App
