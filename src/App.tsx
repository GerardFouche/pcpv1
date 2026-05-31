/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Check, 
  X,
  History, 
  LogOut, 
  ArrowLeft, 
  User as UserIcon, 
  Shield, 
  ClipboardList, 
  Users, 
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Camera,
  Trash2,
  Eye,
  Mail,
  Settings,
  Wifi,
  WifiOff,
  Signal,
  Pencil,
  UserPlus,
  Minus,
  Cpu,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  BarChart3,
  Activity,
  RefreshCw,
  Send,
  Info,
  ExternalLink,
  Calendar,
  Globe
} from 'lucide-react';
import { cn } from './lib/utils';
import { User, PillRecord, View, Role } from './types';

// Constants
const TOAST_DURATION = 2000;

// Components
const Toast: React.FC<{ message: string, type?: 'success' | 'error', onDismiss: () => void }> = ({ message, type = 'success', onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      onClick={onDismiss}
      className={cn(
        "fixed top-8 right-8 z-[100] px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] font-black flex items-center gap-4 border-2 cursor-pointer active:scale-95 transition-all overflow-hidden",
        type === 'error' ? "bg-red-950 border-red-500/50 text-red-500" : "bg-primary text-bg border-primary/20"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        type === 'error' ? "bg-red-500/20" : "bg-bg/20"
      )}>
        {type === 'error' ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
      </div>
      <span className="uppercase tracking-widest text-sm whitespace-nowrap">{message}</span>
    </motion.div>
  );
};

export default function App() {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // State for flow
  const [medName, setMedName] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [currentSsid, setCurrentSsid] = useState<string | null>(null);

  // WiFi status updater
  const fetchWifiStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wifi/status');
      const data = await res.json();
      setCurrentSsid(data.ssid);
    } catch {
      setCurrentSsid(null);
    }
  }, []);

  useEffect(() => {
    fetchWifiStatus();
    const timer = setInterval(fetchWifiStatus, 10000); // Check every 10s
    return () => clearInterval(timer);
  }, [fetchWifiStatus]);

  // Theme synchronization
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.theme) setTheme(data.theme);
      });
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  // Time updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleLogout = () => {
    setUser(null);
    setView('login');
    showToast('Logged out');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Helper for UI Buttons
  const BigButton = ({ 
    onClick, 
    children, 
    variant = 'primary', 
    className = '' 
  }: { 
    onClick: () => void, 
    children: React.ReactNode, 
    variant?: 'primary' | 'secondary' | 'danger' | 'admin',
    className?: string
  }) => {
    const variants = {
      primary: "bg-primary text-bg border-primary/20",
      secondary: "bg-surface text-text-themed border-border-themed hover:opacity-80",
      danger: "bg-red-900/40 text-red-100 border-red-900/50 hover:bg-red-800/60",
      admin: "bg-surface text-purple-300 border-purple-900/50 hover:border-purple-600/50"
    };

    return (
      <button
        onClick={onClick}
        className={cn(
          "h-[80px] px-6 rounded-xl border flex items-center justify-center gap-4 text-lg font-black uppercase tracking-widest transition-all active:scale-95 touch-manipulation shadow-lg",
          variants[variant],
          className
        )}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-bg text-[var(--text-color)] font-sans overflow-hidden select-none touch-pan-y flex flex-col transition-colors duration-300">
      {/* Global Header */}
      <div className="h-[60px] px-6 flex items-center justify-between border-b border-border-themed bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-success rounded-full shadow-[0_0_8px_rgba(76,175,80,0.5)]" />
          <h1 className="text-base font-black tracking-[0.2em] uppercase text-text-themed">
            PILL <span className="text-primary">PRO</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {user && (
            <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase text-[10px] tracking-tight">
              <UserIcon className="w-3.5 h-3.5 text-primary" />
              <span className="text-text-themed truncate max-w-[100px]">{user.username}</span>
              <span className="bg-muted-bg px-1.5 py-0.5 rounded text-[8px] text-text-themed">
                {user.role}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-3 bg-muted-bg/30 px-3 py-1.5 rounded-xl border border-border-themed">
            {currentSsid ? (
              <div className="flex items-center gap-2">
                 <div className="flex items-end gap-0.5 h-2.5">
                    <div className="w-0.5 h-1 bg-success rounded-full opacity-40" />
                    <div className="w-0.5 h-1.5 bg-success rounded-full opacity-70" />
                    <div className="w-0.5 h-2.5 bg-success rounded-full" />
                 </div>
                 <span className="text-[10px] font-black text-success uppercase tracking-widest leading-none">{currentSsid}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <WifiOff className="w-3 h-3 text-red-500/50" />
                <span className="text-[8px] font-bold text-red-500/50 uppercase tracking-widest leading-none">OFFLINE</span>
              </div>
            )}
            
            <div className="w-px h-3 bg-border-themed" />

            <div className="text-lg font-black font-mono text-text-themed tracking-tighter">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <LoginScreen 
                currentSsid={currentSsid}
                onLogin={(u) => { setUser(u); setView(u.role === 'admin' ? 'admin' : 'dashboard'); showToast('Login Successful'); }} 
                onSettings={() => setView('settings')} 
                showToast={showToast} 
              />
            </motion.div>
          )}
          {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="h-full">
              <SettingsScreen 
                currentSsid={currentSsid}
                onConnected={fetchWifiStatus}
                theme={theme} 
                onThemeChange={setTheme} 
                onHardware={() => setView('hardware_status')}
                onBack={() => setView('login')} 
                showToast={showToast} 
              />
            </motion.div>
          )}
          {view === 'dashboard' && user && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full">
              <UserDashboard user={user} onNavigate={setView} onLogout={handleLogout} />
            </motion.div>
          )}
          {view === 'count_med_input' && (
            <motion.div key="med_input" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="h-full">
              <MedicationInputScreen medName={medName} setMedName={setMedName} onBack={() => setView('dashboard')} onStart={() => setView('count_live')} showToast={showToast} />
            </motion.div>
          )}
          {view === 'count_live' && (
            <motion.div key="live_count" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="h-full">
              <LiveCountScreen medName={medName} count={liveCount} setCount={setLiveCount} onBack={() => setView('count_med_input')} onDone={() => { setView('dashboard'); setLiveCount(0); showToast('Saved'); }} user={user!} showToast={showToast} />
            </motion.div>
          )}
          {view === 'history' && user && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <HistoryScreen user={user} onBack={() => setView('dashboard')} />
            </motion.div>
          )}
          
          {view === 'admin' && user?.role === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full">
              <AdminPanel onNavigate={setView} onLogout={handleLogout} />
            </motion.div>
          )}
          {view === 'admin_verify' && user?.role === 'admin' && (
            <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <VerifyRecordsScreen onBack={() => setView('admin')} showToast={showToast} />
            </motion.div>
          )}
          {view === 'admin_users' && user?.role === 'admin' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <UserManagementScreen onBack={() => setView('admin')} showToast={showToast} />
            </motion.div>
          )}
          {view === 'admin_reports' && user?.role === 'admin' && (
            <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <ReportsScreen onBack={() => setView('admin')} showToast={showToast} />
            </motion.div>
          )}
          {view === 'admin_settings' && user?.role === 'admin' && (
            <motion.div key="admin_settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <AdminSettingsScreen onBack={() => setView('admin')} showToast={showToast} />
            </motion.div>
          )}
          {view === 'hardware_status' && (
            <motion.div key="hardware_status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <HardwareStatusScreen onBack={() => setView('settings')} showToast={showToast} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast Notification Layer */}
      <AnimatePresence>
        {toast && (
          <Toast 
            key={toast.msg} 
            message={toast.msg} 
            type={toast.type}
            onDismiss={dismissToast} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Screens ---

function LoginScreen({ currentSsid, onLogin, onSettings, showToast }: { currentSsid: string | null, onLogin: (u: User) => void, onSettings: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(() => showToast('Could not load users', 'error'));
  }, [showToast]);

  const handleLogin = async () => {
    if (!username) return showToast('Select a username', 'error');
    if (!pin) return showToast('Enter PIN', 'error');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Connection failed', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center p-6 relative bg-gradient-to-br from-bg to-surface/20"
    >
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left Side: Branding/Status */}
        <div className="flex flex-col items-center lg:items-start gap-4 lg:w-1/2">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black text-text-themed tracking-tight uppercase">Terminal Access</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">Authorized Personnel Only</p>
          </div>
          
          <div className="mt-4 hidden lg:block">
            {currentSsid ? (
              <div className="flex items-center gap-2 bg-success/10 px-4 py-2 rounded-full border border-success/20">
                <Wifi className="w-4 h-4 text-success" />
                <span className="text-[10px] font-black text-success uppercase tracking-widest">WIFI: {currentSsid}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                <WifiOff className="w-4 h-4 text-red-500/50" />
                <span className="text-[10px] font-black text-red-500/50 uppercase tracking-widest">NETWORK LINK DOWN</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side: Inputs */}
        <div className="w-full max-w-md space-y-4 lg:w-1/2">
          <div className="relative z-20">
            <button 
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "w-full h-16 bg-muted-bg border-2 border-border-themed text-text-themed rounded-2xl px-6 text-xl flex items-center justify-between transition-all outline-none",
                isDropdownOpen ? "border-primary" : "hover:border-primary/50"
              )}
            >
              <span className={cn("font-bold tracking-tight", !username ? "text-zinc-500" : "")}>
                {username || "Select User"}
              </span>
              <ChevronDown className={cn("w-6 h-6 text-zinc-500 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsDropdownOpen(false)}
                    className="fixed inset-0 z-[-1]"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-black border-2 border-primary/30 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30"
                  >
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {users.length === 0 ? (
                        <div className="p-4 text-zinc-600 text-center font-bold uppercase tracking-widest text-[10px]">No Operators</div>
                      ) : (
                        users.map(u => (
                          <button
                            key={u.username}
                            onClick={() => {
                              setUsername(u.username);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full p-4 text-left text-lg font-black transition-all hover:bg-primary hover:text-bg",
                              username === u.username ? "bg-primary/20 text-primary" : "text-white"
                            )}
                          >
                            {u.username}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <input 
            type="password" 
            placeholder="PIN"
            maxLength={4}
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full h-16 bg-muted-bg border-2 border-border-themed text-text-themed rounded-2xl px-6 text-2xl text-center tracking-[1em] focus:border-primary outline-none placeholder:text-zinc-500 placeholder:tracking-normal font-black"
          />

          <button 
            onClick={handleLogin}
            className="w-full h-16 bg-primary text-bg rounded-2xl text-xl font-black uppercase transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
          >
            Access System
          </button>
        </div>
      </div>

      <button 
        onClick={onSettings}
        className="absolute bottom-6 left-6 w-14 h-14 bg-surface border border-border-themed rounded-xl flex items-center justify-center hover:opacity-80 transition-all shadow-lg group"
      >
        <Settings className="w-6 h-6 text-zinc-400 group-hover:rotate-45 group-hover:text-primary duration-500" />
        {!currentSsid && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bg animate-pulse" />
        )}
      </button>
    </motion.div>
  );
}

function UserDashboard({ user, onNavigate, onLogout }: { user: User, onNavigate: (v: View) => void, onLogout: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-bg to-surface/40">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-10">
        <div className="text-center lg:text-left lg:w-1/3">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Interface</span>
          <h2 className="text-5xl font-black text-text-themed uppercase tracking-tighter mt-2 leading-none">
            {user.username}
          </h2>
          <div className="flex items-center gap-2 justify-center lg:justify-start mt-4">
             <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Session</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:w-2/3">
          <button 
            onClick={() => onNavigate('count_med_input')} 
            className="md:col-span-2 h-24 bg-primary text-bg rounded-2xl flex items-center justify-center gap-6 text-2xl font-black shadow-[0_20px_50px_rgba(0,188,212,0.2)] transition-all active:scale-95 group border-none"
          >
            <div className="bg-bg/10 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Camera className="w-10 h-10" strokeWidth={3} />
            </div>
            INITIALIZE COUNT
          </button>
          
          <button 
            onClick={() => onNavigate('history')} 
            className="h-24 bg-surface border-2 border-border-themed hover:border-primary/50 rounded-2xl flex items-center justify-center gap-4 text-xl font-black text-text-themed transition-all active:scale-95 shadow-lg group"
          >
            <History className="w-8 h-8 text-primary group-hover:-rotate-45 transition-transform" />
            HISTORY
          </button>
          
          <button 
            onClick={onLogout} 
            className="h-24 bg-surface border-2 border-border-themed hover:border-red-900/50 rounded-2xl flex items-center justify-center gap-4 text-xl font-black text-zinc-500 hover:text-red-500 transition-all active:scale-95 shadow-lg group"
          >
            <LogOut className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

function MedicationInputScreen({ medName, setMedName, onBack, onStart, showToast }: { medName: string, setMedName: (v: string) => void, onBack: () => void, onStart: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
      className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-bg to-surface/20"
    >
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Capture Setup</span>
          <h2 className="text-3xl font-black text-text-themed uppercase tracking-tight mt-1">Identification</h2>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Medication Name / Batch ID</label>
          <input 
            autoFocus
            type="text" 
            placeholder="Search or enter manually..."
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            className="w-full h-16 bg-muted-bg border-4 border-border-themed text-text-themed rounded-2xl px-6 text-xl font-bold focus:border-primary outline-none tracking-tight transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onBack} className="h-16 bg-surface border-2 border-border-themed rounded-2xl flex items-center justify-center gap-3 text-base font-black text-text-themed hover:bg-muted-bg transition-all">
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
            CANCEL
          </button>
          <button 
            onClick={() => {
              if(!medName.trim()) return showToast('Input Required', 'error');
              onStart();
            }} 
            className="h-16 bg-primary rounded-2xl flex items-center justify-center gap-3 text-base font-black text-bg shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            INITIALIZE SCAN
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function LiveCountScreen({ medName, count, setCount, onBack, onDone, user, showToast }: { medName: string, count: number, setCount: React.Dispatch<React.SetStateAction<number>>, onBack: () => void, onDone: () => void, user: User, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: 'environment'
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        showToast("Hardware Camera Error", "error");
      }
    }
    
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showToast]);

  const handleSave = async () => {
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user.username,
          med: medName,
          count,
          time: new Date().toISOString(),
          image: `https://placehold.co/400x300/0891b2/white?text=ID+Proof+${Date.now()}`
        })
      });
      onDone();
    } catch {
      showToast('Save failed', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
      className="h-full flex flex-col relative bg-bg"
    >
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 h-full overflow-hidden">
        {/* Camera Feed Area */}
        <div className="flex-1 bg-black rounded-3xl border-2 border-border-themed relative overflow-hidden flex items-center justify-center min-h-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.1) 40px)' }} 
          />
          
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/50 text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              AI VISION: ACTIVE
            </div>
            <div className="bg-success/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-success/50 text-[10px] font-black tracking-[0.2em] text-success uppercase animate-pulse">
              TRACKING PILLS
            </div>
          </div>

          <div className="relative w-full h-full flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-20 capitalize text-4xl font-black tracking-widest text-zinc-700 select-none pointer-events-none">
              Live Feed
            </div>
            
            {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute w-14 h-14 border-2 border-primary bg-primary/20 rounded-xl uppercase text-[9px] font-black p-2 text-primary shadow-[0_0_15px_rgba(0,188,212,0.4)] backdrop-blur-sm"
                style={{ 
                  top: `${25 + (i % 3) * 20 + Math.random() * 5}%`, 
                  left: `${25 + Math.floor(i / 3) * 15 + Math.random() * 5}%`,
                  transform: `rotate(${Math.sin(i) * 30}deg)`
                }}
              >
                OBJ_{i+1}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Control Column */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4 shrink-0">
          <div className="bg-surface rounded-3xl border-2 border-border-themed p-6 flex flex-col gap-4 lg:gap-6 h-full shadow-2xl overflow-y-auto custom-scrollbar">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">ID SPEC:</span>
              <h3 className="text-2xl font-black truncate tracking-tighter uppercase text-text-themed leading-none mt-1">{medName}</h3>
            </div>

            <div className="bg-muted-bg/50 border-2 border-border-themed rounded-2xl p-6 text-center shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block relative">Unit Count</span>
              <div className="text-7xl font-black text-primary font-mono leading-none tracking-tighter relative">{count}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setCount(prev => Math.max(0, prev - 1))}
                className="h-16 bg-surface border-2 border-border-themed rounded-xl flex flex-col items-center justify-center gap-0.5 active:bg-zinc-800 transition-colors uppercase font-black text-zinc-400 group"
              >
                <Minus className="w-6 h-6 group-active:scale-125 transition-transform" />
                <span className="text-[9px] tracking-widest">SUB</span>
              </button>
              <button 
                onClick={() => setCount(prev => prev + 1)}
                className="h-16 bg-surface border-2 border-border-themed rounded-xl flex flex-col items-center justify-center gap-0.5 active:bg-zinc-800 transition-colors uppercase font-black text-primary group"
              >
                <Plus className="w-6 h-6 group-active:scale-125 transition-transform" />
                <span className="text-[9px] tracking-widest">ADD</span>
              </button>
            </div>

            <div className="mt-auto space-y-3">
               <button 
                onClick={handleSave}
                disabled={count === 0}
                className="w-full h-20 bg-primary text-bg rounded-2xl flex items-center justify-center gap-3 text-lg font-black uppercase tracking-wider shadow-xl shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-20"
              >
                <Check className="w-6 h-6" strokeWidth={4} />
                Confirm
              </button>
              <button 
                onClick={onBack}
                className="w-full h-12 bg-surface border-2 border-border-themed text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors"
              >
                Abandone
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryScreen({ user, onBack }: { user: User, onBack: () => void }) {
  const [history, setHistory] = useState<PillRecord[]>([]);

  useEffect(() => {
    fetch(`/api/records?username=${user.username}`)
      .then(r => r.json())
      .then(setHistory);
  }, [user.username]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full flex flex-col relative bg-bg"
    >
      <div className="px-8 py-6 border-b border-border-themed flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Logs</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-text-themed">Record History</h2>
        </div>
        <button onClick={onBack} className="px-8 h-12 bg-muted-bg rounded-2xl border-2 border-border-themed flex items-center justify-center gap-3 font-black hover:border-primary transition-all uppercase tracking-widest text-[10px] text-text-themed shadow-lg">
          <ArrowLeft className="w-4 h-4 text-primary" />
          Return to Hub
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-4">
          {history.length === 0 && (
            <div className="text-center py-32 flex flex-col items-center gap-4 opacity-20">
              <History className="w-20 h-20" />
              <div className="text-2xl italic font-black uppercase tracking-widest">No Log Data Found</div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {history.map(item => (
              <motion.div 
                layout
                key={item.id} 
                className="bg-surface border-2 border-border-themed p-6 rounded-3xl flex items-center justify-between hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-2xl font-black uppercase text-text-themed truncate">{item.med}</h3>
                    <div className="px-3 py-1 bg-muted-bg rounded-full border border-border-themed text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border shadow-sm", 
                      item.verified ? "bg-success/10 text-success border-success/30" : "bg-zinc-800 text-zinc-500 border-zinc-700")}>
                      {item.verified ? "AUTHENTICATED" : "PENDING REVIEW"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600 font-bold tracking-tight">LOG_REF: {item.id?.toString().padStart(6, '0')}</span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{new Date(item.time).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tabular-nums text-primary tracking-tighter leading-none">{item.count}</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">units</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsScreen({ currentSsid, onConnected, theme, onThemeChange, onHardware, onBack, showToast }: { currentSsid: string | null, onConnected: () => void, theme: 'dark' | 'light', onThemeChange: (t: 'dark' | 'light') => void, onHardware: () => void, onBack: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [networks, setNetworks] = useState<{ssid: string, strength: number, secure: boolean}[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('Loading...');

  // Core Self-Update Engine states
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
    changelog: string[];
  } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => setDeviceName(data.device_name || 'UNKNOWN'));
  }, []);

  const checkForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await fetch('/api/updates/check');
      const data = await res.json();
      if (data.success) {
        setUpdateInfo(data);
        if (data.updateAvailable) {
          showToast(`New firmware ${data.latestVersion} found! Downloading & installing automatically...`, 'success');
          // Add a brief delay so the user can read the toast before the overlay transitions
          setTimeout(() => {
            applyUpdateByData(data);
          }, 1500);
        } else {
          showToast('System is currently up to date.', 'success');
          setCheckingUpdate(false);
        }
      } else {
        showToast('Update server handshake failed', 'error');
        setCheckingUpdate(false);
      }
    } catch {
      showToast('Offline or update server unreachable', 'error');
      setCheckingUpdate(false);
    }
  };

  const applyUpdateByData = async (data: any) => {
    setCheckingUpdate(false);
    setUpdating(true);
    setUpdateProgress(0);
    setUpdateStatus('Handshaking with repository runner...');
    try {
      const res = await fetch('/api/updates/apply', { method: 'POST' });
      const applyData = await res.json();
      
      if (applyData.success) {
        // Run simulated countdown that mirrors backend's 5s reload timeout
        const duration = 5000;
        const stepTime = 100;
        let elapsed = 0;

        const interval = setInterval(() => {
          elapsed += stepTime;
          const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
          setUpdateProgress(pct);

          if (pct < 25) {
            setUpdateStatus('Downloading target files from repo origin...');
          } else if (pct < 50) {
            setUpdateStatus('Securing persistent database state...');
          } else if (pct < 75) {
            setUpdateStatus('Compiling production codebase layers...');
          } else if (pct < 95) {
            setUpdateStatus('Setting up system config endpoints...');
          } else {
            setUpdateStatus('Reloading application systems...');
          }

          if (elapsed >= duration) {
            clearInterval(interval);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }, stepTime);
      } else {
        showToast(applyData.message || 'Update failed', 'error');
        setUpdating(false);
      }
    } catch {
      showToast('Connection timed out during download process', 'error');
      setUpdating(false);
    }
  };

  const applyUpdate = async () => {
    if (updateInfo) {
      applyUpdateByData(updateInfo);
    }
  };

  const scanWifi = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/wifi/scan');
      const data = await res.json();
      setNetworks(data);
    } catch {
      showToast('Scan failed', 'error');
    } finally {
      setScanning(false);
    }
  };

  const connectWifi = async () => {
    if (!selectedNetwork) return;
    setConnecting(true);
    try {
      const res = await fetch('/api/wifi/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid: selectedNetwork, password })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Connected to ${selectedNetwork}`);
        setSelectedNetwork(null);
        setPassword('');
        onConnected();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Connection failed', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const setThemeMode = async (newMode: 'dark' | 'light') => {
    if (newMode === theme) return;
    onThemeChange(newMode);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newMode })
      });
    } catch (e) {
      console.error("Failed to save theme preference");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full flex flex-col bg-bg relative"
    >
      <div className="p-6 border-b border-border-themed flex items-center justify-between bg-surface">
        <div className="flex items-center gap-4">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-text-themed">System Settings</h2>
        </div>
        <button onClick={onBack} className="px-6 h-10 bg-muted-bg rounded-xl border border-border-themed flex items-center justify-center gap-2 font-black hover:opacity-80 transition-all uppercase tracking-widest text-[8px] text-text-themed">
          <ArrowLeft className="w-3 h-3 text-primary" />
          Exit Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-2 gap-8 items-start">
            {/* WiFi Section */}
            <div className="bg-surface rounded-3xl border border-border-themed p-8 flex flex-col gap-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Wifi className="w-6 h-6 text-primary" />
                   <h3 className="text-xl font-black uppercase tracking-tight text-text-themed">Wireless Networks</h3>
                </div>
                <button 
                  onClick={scanWifi} 
                  disabled={scanning}
                  className="px-6 h-10 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 disabled:opacity-50"
                >
                  {scanning ? 'Scanning...' : 'Refresh List'}
                </button>
              </div>

              <div className={cn(
                "rounded-2xl p-4 flex items-center justify-between border",
                currentSsid ? "bg-success/5 border-success/20" : "bg-red-500/5 border-red-500/20"
              )}>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-1",
                    currentSsid ? "text-success/60" : "text-red-500/60"
                  )}>
                    {currentSsid ? 'Active Connection' : 'Connection Status'}
                  </span>
                  <span className={cn(
                    "text-xl font-black tracking-tighter",
                    currentSsid ? "text-success" : "text-red-500/80"
                  )}>
                    {currentSsid || 'NOT CONNECTED'}
                  </span>
                </div>
                {currentSsid ? (
                  <div className="flex items-end gap-1 h-5">
                    <div className="w-1 h-2 bg-success rounded-full" />
                    <div className="w-1 h-3 bg-success rounded-full" />
                    <div className="w-1 h-4 bg-success rounded-full" />
                    <div className="w-1 h-5 bg-success rounded-full" />
                  </div>
                ) : (
                  <WifiOff className="w-8 h-8 text-red-500/30" />
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar border border-border-themed rounded-xl bg-muted-bg p-4 space-y-2">
                {networks.length === 0 && !scanning && (
                  <div className="py-20 flex flex-col items-center justify-center text-zinc-500 gap-4 opacity-50 grayscale">
                     <Search className="w-12 h-12" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-center">Touch "Refresh List" to scan nearby signals</span>
                  </div>
                )}
                {networks.map((n, i) => (
                  <button 
                    key={`${n.ssid}-${i}`} 
                    onClick={() => setSelectedNetwork(n.ssid)}
                    className={cn(
                      "w-full p-4 rounded-xl flex items-center justify-between border transition-all",
                      selectedNetwork === n.ssid ? "bg-primary/20 border-primary shadow-lg" : "bg-bg/40 border-border-themed hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {n.secure ? <Lock className="w-4 h-4 text-zinc-500" /> : <Wifi className="w-4 h-4 text-zinc-500" />}
                      <span className="font-bold text-sm tracking-tight text-text-themed">{n.ssid}</span>
                      {currentSsid === n.ssid && (
                         <span className="px-2 py-0.5 bg-success/20 text-success text-[8px] font-black rounded-md border border-success/30 uppercase tracking-widest">Connected</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Signal className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-zinc-500">{n.strength}%</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedNetwork && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4 pt-4 border-t border-border-themed">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Connect to: {selectedNetwork}</span>
                    <button onClick={() => setSelectedNetwork(null)} className="text-[10px] text-zinc-500 hover:text-primary uppercase font-black">Cancel</button>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Network Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 bg-bg border border-border-themed rounded-xl px-4 text-sm font-bold focus:border-primary outline-none text-text-themed"
                  />
                  <button 
                    onClick={connectWifi}
                    disabled={connecting}
                    className="w-full h-14 bg-primary text-bg rounded-xl font-black uppercase tracking-widest text-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {connecting ? 'Establishing Connection...' : 'Connect Now'}
                  </button>
                </motion.div>
              )}
            </div>

            {/* System Info & Appearance */}
            <div className="flex flex-col gap-8">
               <div className="bg-surface rounded-3xl border border-border-themed p-8 flex flex-col gap-6 shadow-sm">
                  <div className="flex items-center gap-3">
                     <Cpu className="w-6 h-6 text-primary" />
                     <h3 className="text-xl font-black uppercase tracking-tight text-text-themed">System Identity</h3>
                  </div>

                  <div className="space-y-4">
                     <div className="p-6 bg-muted-bg border border-border-themed rounded-2xl flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Device Name</span>
                           <span className="text-2xl font-black text-text-themed tracking-tighter">{deviceName}</span>
                        </div>
                        <div className="bg-bg/50 p-2 rounded-lg">
                           <Lock className="w-5 h-5 text-zinc-500" />
                        </div>
                     </div>

                     <div className="p-6 bg-muted-bg border border-border-themed rounded-2xl flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Version</span>
                           <span className="text-2xl font-black text-text-themed tracking-tighter">PCPv1.1</span>
                        </div>
                        <button 
                          onClick={checkForUpdates}
                          disabled={checkingUpdate}
                          className="px-5 h-12 bg-primary hover:opacity-95 text-bg font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg"
                        >
                          {checkingUpdate ? 'Checking...' : 'Check Updates'}
                        </button>
                     </div>

                     <button 
                       onClick={onHardware}
                       className="w-full h-16 bg-muted-bg border-2 border-border-themed hover:border-primary/50 rounded-2xl flex items-center justify-between px-6 transition-all group"
                     >
                       <div className="flex items-center gap-4">
                         <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 group-hover:border-primary/30 transition-all">
                           <Cpu className="w-5 h-5 text-emerald-400" />
                         </div>
                         <span className="font-black text-sm uppercase tracking-widest text-text-themed">Hardware Diagnostics</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-success rounded-full" />
                         <span className="text-[10px] font-black text-success uppercase tracking-widest">Active</span>
                       </div>
                     </button>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted-bg border border-border-themed rounded-2xl">
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Architecture</span>
                           <span className="font-bold text-[10px] uppercase text-text-themed tracking-widest opacity-80">64-bit Platform</span>
                        </div>
                        <div className="p-4 bg-muted-bg border border-border-themed rounded-3xl">
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">OS Environment</span>
                           <span className="font-bold text-[10px] uppercase text-text-themed tracking-widest opacity-80">Secure Linux v1.2</span>
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                     <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium uppercase">
                           Device name is write-protected. Modifications must be performed through the <span className="text-primary font-bold">Admin Panel</span>.
                        </p>
                     </div>
                  </div>
               </div>

            </div>

            {/* Firmware updates modals */}
            <AnimatePresence>
              {updateInfo && updateInfo.updateAvailable && !updating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-45 flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-primary/20 text-primary px-2.5 py-1 rounded-md border border-primary/30 font-black uppercase tracking-widest">Update Available</span>
                        <h3 className="text-2xl font-black text-white mt-2 uppercase tracking-tight">Version {updateInfo.latestVersion}</h3>
                      </div>
                      <button onClick={() => setUpdateInfo(null)} className="text-zinc-500 hover:text-white font-black text-xs uppercase tracking-widest">Dismiss</button>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Changelog & Improvements:</span>
                      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 max-h-40 overflow-y-auto space-y-2">
                        {updateInfo.changelog?.map((item, idx) => (
                          <div key={idx} className="flex gap-2 text-xs font-semibold text-zinc-300 leading-relaxed uppercase">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <button 
                        onClick={() => setUpdateInfo(null)}
                        className="h-14 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                      >
                        Postpone
                      </button>
                      <button 
                        onClick={applyUpdate}
                        className="h-14 bg-primary text-bg hover:opacity-90 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                      >
                        Install Now
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {updating && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-2xl"
                  >
                    <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center animate-pulse">
                      <Cpu className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight text-white uppercase">Installing firmware update</h3>
                      <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{updateStatus}</p>
                    </div>

                    <div className="w-full space-y-2">
                      <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-900">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
                          style={{ width: `${updateProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <span>PROGRESS</span>
                        <span className="text-primary font-black">{updateProgress}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl w-full">
                      <p className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider leading-relaxed">
                        ⚠️ The device will auto restart once the update is completed. Do not power off the equipment.
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-40" /> {/* Extra spacer for bottom scroll padding */}
        </div>
      </div>
    </motion.div>
  );
}

function AdminSettingsScreen({ onBack, showToast }: { onBack: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setDeviceName(data.device_name || '');
      setLoading(false);
    });
  }, []);

  const saveSettings = async () => {
    if (!deviceName.trim()) return showToast('Device name cannot be empty', 'error');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_name: deviceName })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Device Name Updated');
        onBack();
      }
    } catch {
      showToast('Save failed', 'error');
    }
  };

  if (loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full flex flex-col bg-bg relative"
    >
      <div className="p-6 border-b border-border-themed flex items-center justify-between bg-surface bg-opacity-20 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-primary">
          <Settings className="w-6 h-6" />
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-text-themed">Administrative Overrides</h2>
        </div>
        <button onClick={onBack} className="px-6 h-10 bg-muted-bg border border-border-themed rounded-xl flex items-center justify-center gap-2 font-black hover:opacity-80 transition-all uppercase tracking-widest text-[8px] text-text-themed">
          <ArrowLeft className="w-3 h-3 text-primary" />
          Return to Panel
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-12 pt-10 overflow-y-auto custom-scrollbar">
         <div className="w-full max-w-2xl bg-surface border border-border-themed p-12 rounded-[2.5rem] shadow-2xl flex flex-col gap-10">
            <div className="space-y-3">
               <h3 className="text-3xl font-black uppercase tracking-tight text-text-themed border-l-4 border-primary pl-6 leading-none">Device Identity</h3>
               <p className="text-zinc-500 text-sm font-medium pl-10 uppercase tracking-widest leading-relaxed">
                  Modify the broadcast identity of this terminal on the local network.
               </p>
            </div>

            <div className="space-y-3 pl-10">
               <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Device Name Configuration</label>
               <input 
                 type="text" 
                 value={deviceName}
                 onChange={(e) => setDeviceName(e.target.value)}
                 className="w-full h-20 bg-bg border-2 border-border-themed rounded-2xl px-6 text-3xl font-black focus:border-primary outline-none tracking-tighter uppercase text-text-themed"
               />
            </div>

            <div className="flex gap-4 pl-10">
               <button 
                onClick={saveSettings}
                className="flex-1 h-20 bg-primary text-bg rounded-2xl flex items-center justify-center gap-4 text-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-primary/20"
               >
                 <CheckCircle2 className="w-8 h-8" />
                 Apply New Name
               </button>
               <button 
                onClick={onBack}
                className="h-20 px-8 bg-muted-bg border border-border-themed text-text-themed rounded-2xl flex items-center justify-center text-xl font-black uppercase tracking-widest transition-all active:scale-95"
               >
                 Cancel
               </button>
            </div>

            <div className="p-6 bg-red-900/10 border border-red-900/20 rounded-2xl flex items-center gap-4 mx-10">
               <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
               <p className="text-xs text-red-500/80 leading-relaxed font-bold uppercase italic">
                 Critical System setting. Changes will force a network stack restart.
               </p>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

function AdminPanel({ onNavigate, onLogout }: { onNavigate: (v: View) => void, onLogout: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col items-center justify-start gap-8 p-8 relative"
    >
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-start p-4 pt-10">
        <h2 className="text-2xl text-zinc-500 mb-8 border-b-4 border-purple-900/50 pb-2 uppercase tracking-tighter font-black italic text-center">
          Systems <span className="text-zinc-100 italic">Administrator</span>
        </h2>
        <div className="grid grid-cols-2 w-full max-w-4xl gap-4">
          <button onClick={() => onNavigate('admin_verify')} className="h-28 bg-purple-900/20 hover:bg-purple-800/40 border border-purple-900/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-lg font-black text-purple-100 transition-all active:scale-95 uppercase tracking-widest shadow-xl">
            <ClipboardList className="w-6 h-6 text-purple-400" />
            VERIFY RECORDS
          </button>
          <button onClick={() => onNavigate('admin_users')} className="h-28 bg-surface hover:bg-zinc-800 border border-[#333] rounded-2xl flex flex-col items-center justify-center gap-2 text-lg font-black text-zinc-100 transition-all active:scale-95 uppercase tracking-widest shadow-xl">
            <Users className="w-6 h-6 text-primary" />
            MANAGE USERS
          </button>
          <button onClick={() => onNavigate('admin_reports')} className="h-28 bg-surface hover:bg-zinc-800 border border-[#333] rounded-2xl flex flex-col items-center justify-center gap-2 text-lg font-black text-zinc-400 transition-all active:scale-95 uppercase tracking-widest shadow-xl">
            <FileText className="w-6 h-6 text-zinc-500" />
            REPORTS
          </button>
          <button onClick={() => onNavigate('admin_settings')} className="h-28 bg-surface hover:bg-zinc-800 border border-[#333] rounded-2xl flex flex-col items-center justify-center gap-2 text-lg font-black text-zinc-400 transition-all active:scale-95 uppercase tracking-widest shadow-xl">
            <Settings className="w-6 h-6 text-primary" />
            DEVICE SETTINGS
          </button>
        </div>
        
        <button onClick={onLogout} className="mt-8 h-20 px-12 bg-zinc-950 border border-red-900/20 text-red-900/60 hover:text-red-500 rounded-xl flex items-center justify-center gap-4 text-xl font-black transition-all active:scale-95 uppercase tracking-widest">
          <LogOut className="w-6 h-6" />
          Terminate Session
        </button>
      </div>
    </motion.div>
  );
}

function VerifyRecordsScreen({ onBack, showToast }: { onBack: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [records, setRecords] = useState<PillRecord[]>([]);

  const fetchRecords = useCallback(() => {
    fetch('/api/records')
      .then(r => r.json())
      .then(setRecords);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleVerify = async (id: number, verified: number) => {
    try {
      await fetch(`/api/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified })
      });
      showToast(verified ? 'Verified' : 'Verification removed');
      fetchRecords();
    } catch {
      showToast('Action failed', 'error');
    }
  };

  // Group records by user
  const grouped = records.reduce((acc, rec) => {
    if (!acc[rec.user]) acc[rec.user] = [];
    acc[rec.user].push(rec);
    return acc;
  }, {} as Record<string, PillRecord[]>);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full flex flex-col relative"
    >
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-purple-900/10">
        <h2 className="text-xl font-black uppercase italic text-purple-400">Verification Queue</h2>
        <button onClick={onBack} className="px-6 h-10 bg-zinc-800 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-zinc-700 transition-all text-xs">
          <ArrowLeft className="w-4 h-4 text-primary" />
          BACK
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          {Object.keys(grouped).length === 0 && <div className="text-center py-20 text-zinc-600 text-2xl italic font-bold">No records to verify</div>}
          {(Object.entries(grouped) as [string, PillRecord[]][]).map(([user, userRecords]) => (
            <div key={user} className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">User Group</span>
                <h3 className="text-3xl font-black text-zinc-200 uppercase">{user}</h3>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full" />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {userRecords.map(item => (
                  <div key={item.id} className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 flex items-center gap-8">
                    <div className="w-48 h-32 bg-zinc-950 rounded-2xl flex flex-col items-center justify-center border border-zinc-800 text-zinc-700 shrink-0">
                      <Camera className="w-10 h-10 mb-2 opacity-20" />
                      <span className="text-[10px] font-bold uppercase tracking-tight opacity-40">Placeholder</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-2">
                       <div className="flex items-baseline gap-4">
                         <h4 className="text-3xl font-black uppercase text-zinc-100">{item.med}</h4>
                         <span className="text-5xl font-black text-cyan-500 tabular-nums">{item.count}</span>
                       </div>
                       <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                         <span className="font-mono">{new Date(item.time).toLocaleString()}</span>
                         <span className={cn("px-2 py-0.5 rounded uppercase tracking-widest", item.verified ? "text-green-500 bg-green-500/10" : "text-amber-500 bg-amber-500/10")}>
                           {item.verified ? "Verified" : "Pending Approval"}
                         </span>
                       </div>
                    </div>

                    <button 
                      onClick={() => handleVerify(item.id, item.verified ? 0 : 1)}
                      className={cn(
                        "h-20 px-10 rounded-2xl font-black text-2xl transition-all active:scale-95",
                        item.verified ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-cyan-600 text-white hover:bg-cyan-500"
                      )}
                    >
                      {item.verified ? "UNDO" : "VERIFY"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function UserManagementScreen({ onBack, showToast }: { onBack: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [newUser, setNewUser] = useState('');
  const [newPin, setNewPin] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserValue, setEditUserValue] = useState('');
  const [editPinValue, setEditPinValue] = useState('');
  const [currentPinValue, setCurrentPinValue] = useState('');
  const [showPins, setShowPins] = useState<{[key: string]: boolean}>({});

  const fetchUsers = useCallback(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!newUser.trim()) return showToast('Enter username', 'error');
    if (newPin.length !== 4) return showToast('PIN must be 4 digits', 'error');
    if (users.length >= 4) return showToast('Max users reached', 'error');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUser, pin: newPin })
      });
      const data = await res.json();
      if (data.success) {
        showToast('User added');
        setNewUser('');
        setNewPin('');
        fetchUsers();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Action failed', 'error');
    }
  };

  const handleDeleteUser = async (username: string) => {
    try {
      const res = await fetch(`/api/users/${username}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('User deleted');
        fetchUsers();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Action failed', 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!editUserValue.trim()) return showToast('Username cannot be empty', 'error');
    if (editPinValue && editPinValue.length !== 4) return showToast('PIN must be 4 digits', 'error');
    if (!currentPinValue) return showToast('Verification PIN required', 'error');

    try {
      const res = await fetch(`/api/users/${editingUser.username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: editUserValue !== editingUser.username ? editUserValue : undefined,
          pin: editPinValue || undefined,
          currentPin: currentPinValue
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Account updated');
        setEditingUser(null);
        setCurrentPinValue('');
        fetchUsers();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Update failed', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full flex flex-col relative"
    >
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h2 className="text-xl font-black uppercase italic text-zinc-400">User Management</h2>
        <button onClick={onBack} className="px-6 h-10 bg-zinc-800 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-zinc-700 transition-all text-xs">
          <ArrowLeft className="w-4 h-4 text-primary" />
          BACK
        </button>
      </div>

      <div className="flex-1 flex p-8 gap-8 overflow-y-auto custom-scrollbar">
        {/* List */}
        <div className="flex-1 bg-zinc-950 rounded-3xl border border-zinc-800 p-8 h-fit min-h-full">
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.username} className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black uppercase text-zinc-100">{u.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">{u.role}</span>
                    <span className="text-[10px] text-zinc-800">•</span>
                    <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
                      {showPins[u.username] ? u.pin : '••••'}
                      <button 
                        onClick={() => setShowPins(prev => ({...prev, [u.username]: !prev[u.username]}))}
                        className="p-1 hover:text-primary transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => {
                       setEditingUser(u);
                       setEditUserValue(u.username);
                       setEditPinValue('');
                       setCurrentPinValue('');
                     }}
                     className="p-4 bg-zinc-800/50 text-primary rounded-xl hover:bg-primary/10 transition-all border border-border-themed"
                   >
                     <Pencil className="w-8 h-8" />
                   </button>
                   {u.username !== 'admin' && (
                     <button onClick={() => handleDeleteUser(u.username)} className="p-4 bg-zinc-800 text-red-500 rounded-xl hover:bg-red-900/20 transition-all">
                       <Trash2 className="w-8 h-8" />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="w-[450px] space-y-8 h-fit">
          <AnimatePresence mode="wait">
            {editingUser ? (
              <motion.div 
                key="edit-form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="bg-primary/5 border-2 border-primary/20 p-8 rounded-3xl flex flex-col gap-8 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tight">Edit Account</h3>
                  <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Update Username</label>
                    <input 
                      type="text" 
                      value={editUserValue}
                      onChange={(e) => setEditUserValue(e.target.value)}
                      className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-xl font-bold focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Change PIN (optional)</label>
                    <input 
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Leave blank to keep current"
                      type="password" 
                      value={editPinValue}
                      onChange={(e) => setEditPinValue(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-xl font-bold focus:border-primary outline-none text-center tracking-[1em] placeholder:tracking-normal placeholder:text-[10px]"
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t border-primary/10">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Verify Identity (Current PIN)</label>
                    <input 
                      inputMode="numeric"
                      maxLength={4}
                      type="password" 
                      value={currentPinValue}
                      onChange={(e) => setCurrentPinValue(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-16 bg-bg border-2 border-primary/30 rounded-xl px-4 text-xl font-bold focus:border-primary outline-none text-center tracking-[1em]"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button onClick={handleUpdateUser} className="flex-1 h-20 bg-primary rounded-2xl text-2xl font-black uppercase text-bg hover:opacity-90 transition-all active:scale-95 shadow-xl">
                    Save Changes
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="add-form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col gap-8 shadow-2xl"
              >
                <h3 className="text-2xl font-black text-cyan-500 uppercase tracking-tight">Add New Operator</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Username</label>
                    <input 
                      type="text" 
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-xl font-bold focus:border-cyan-600 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">4-Digit PIN</label>
                    <input 
                      inputMode="numeric"
                      maxLength={4}
                      type="password" 
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-xl font-bold focus:border-cyan-600 outline-none text-center tracking-[1em]"
                    />
                  </div>
                </div>
                <button onClick={handleAddUser} className="h-20 bg-cyan-600 rounded-2xl text-2xl font-black uppercase text-white hover:bg-cyan-500 transition-all active:scale-95 shadow-xl shadow-cyan-950/20">
                  Create User
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-xl">
             <p className="text-[10px] text-amber-500/80 leading-relaxed font-medium uppercase tracking-tighter">
               System Limits: 4 Active Profiles Total. Administrators can change their own credentials anytime.
             </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReportsScreen({ onBack, showToast }: { onBack: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [email, setEmail] = useState('');
  const [scheduledEmail, setScheduledEmail] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [records, setRecords] = useState<PillRecord[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules');
      const data = await res.json();
      setSchedules(data);
    } catch (e) {
      console.error('Failed to fetch schedules');
    }
  }, []);

  useEffect(() => {
    fetch('/api/records')
      .then(r => r.json())
      .then(setRecords);
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSendReport = async () => {
    // Robust email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      return showToast('Invalid email address', 'error');
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/reports/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Report sent successfully', 'success');
      } else {
        showToast(data.message || 'Failed to send', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleReport = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!scheduledEmail.trim() || !emailRegex.test(scheduledEmail)) {
      return showToast('Invalid schedule email', 'error');
    }
    if (!scheduledTime) {
      return showToast('Please select a time', 'error');
    }

    setIsScheduling(true);
    try {
      const dateObj = new Date(scheduledTime);
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: scheduledEmail, scheduled_time: dateObj.toISOString() })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Report scheduled successfully', 'success');
        setScheduledEmail('');
        setScheduledTime('');
        fetchSchedules();
      } else {
        showToast(data.message || 'Failed to schedule', 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsScheduling(false);
    }
  };

  const cancelSchedule = async (id: number) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Schedule cancelled');
        fetchSchedules();
      }
    } catch {
      showToast('Error cancelling schedule', 'error');
    }
  };

  const totalPills = records.reduce((sum, r) => sum + r.count, 0);
  const verifiedPills = records.filter(r => r.verified === 1).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col relative bg-bg"
    >
      <div className="p-6 border-b border-border-themed bg-surface flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase text-zinc-100 flex items-center gap-2 tracking-tight">
              Audit Intelligence
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text--themed">System-Generated Audit Reports</p>
          </div>
        </div>
        <button onClick={onBack} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-95">
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
        <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { label: 'Total Records', val: records.length, icon: FileText, color: 'text-cyan-500' },
            { label: 'Pills Counted', val: totalPills, icon: Activity, color: 'text-emerald-500' },
            { label: 'Verified Checks', val: verifiedPills, icon: CheckCircle2, color: 'text-amber-500' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all"
            >
              <stat.icon className={`absolute -right-4 -bottom-4 w-32 h-32 opacity-5 ${stat.color} group-hover:scale-110 transition-transform`} />
              <div className="relative space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{stat.label}</p>
                <p className={`text-6xl font-black italic ${stat.color}`}>{stat.val}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          {/* Send Report Section */}
          <div className="bg-surface border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Send Report</h3>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Manual summary ledger transmission</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Recipient Email"
                  className="w-full h-16 bg-zinc-950 border-2 border-zinc-800 rounded-2xl pl-16 pr-6 text-xl font-bold text-white outline-none focus:border-primary/50 transition-all shadow-inner"
                />
              </div>

              <button 
                disabled={isSending}
                onClick={handleSendReport}
                className={`w-full h-20 rounded-2xl flex items-center justify-center gap-4 text-2xl font-black italic uppercase transition-all shadow-2xl ${
                  isSending ? 'bg-zinc-800 text-zinc-600 scale-95 cursor-not-allowed' : 'bg-primary text-bg hover:opacity-90 active:scale-95 shadow-primary/20'
                }`}
              >
                {isSending ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
                {isSending ? 'SENDING...' : 'EXECUTE MISSION'}
              </button>
            </div>
          </div>

          {/* Auto-Schedule Audit Section */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">Auto-Schedule Audit</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Programmed Ledger Transmissions</p>
                  </div>
                </div>
                {schedules.length > 0 && (
                  <span className="px-4 py-1.5 bg-primary/20 text-primary text-[10px] font-black rounded-full border border-primary/30 animate-pulse uppercase tracking-widest">
                    {schedules.length} PENDING
                  </span>
                )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Future Recipient</label>
                    <input 
                      type="email"
                      value={scheduledEmail}
                      onChange={(e) => setScheduledEmail(e.target.value)}
                      placeholder="Reports to..."
                      className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-lg font-bold text-white focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Execution Timestamp</label>
                    <input 
                      type="datetime-local"
                      value={scheduledTime}
                      min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-lg font-bold text-white focus:border-primary/50 outline-none transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  <button 
                    onClick={handleScheduleReport}
                    disabled={isScheduling}
                    className="w-full h-16 bg-surface border-2 border-primary/30 rounded-xl flex items-center justify-center gap-3 text-xl font-black uppercase text-primary hover:bg-primary hover:text-bg transition-all active:scale-95 shadow-xl shadow-primary/5"
                  >
                    {isScheduling ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                    {isScheduling ? 'SCHEDULING...' : 'PLAN AUDIT'}
                  </button>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 flex flex-col">
                  <p className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em] mb-3">Planned Queue</p>
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[220px] pr-2 custom-scrollbar">
                    {schedules.length === 0 ? (
                      <div className="h-full border-2 border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-4 opacity-50 py-12">
                        <Calendar className="w-12 h-12 text-zinc-800" />
                        <p className="text-zinc-700 text-sm font-bold uppercase italic tracking-widest">Empty Ledger Pool</p>
                      </div>
                    ) : (
                      schedules.map((s) => (
                        <motion.div 
                          key={s.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all shadow-lg"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-black text-primary uppercase tracking-wider">{new Date(s.scheduled_time).toLocaleString()}</p>
                            <p className="text-sm font-bold text-zinc-400">{s.email}</p>
                          </div>
                          <button 
                            onClick={() => cancelSchedule(s.id)}
                            className="p-4 bg-red-950/20 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HardwareStatusScreen({ onBack, showToast }: { onBack: () => void, showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [devices, setDevices] = useState<{name: string, kernel: string, capabilities: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(() => {
    setLoading(true);
    fetch('/api/system/inputs')
      .then(r => r.json())
      .then(data => {
        setDevices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        showToast('Failed to fetch hardware data', 'error');
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full flex flex-col relative bg-bg"
    >
      <div className="px-8 py-6 border-b border-border-themed flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Diagnosis Console</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-zinc-100">Hardware Layer</h2>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchDevices} className="w-12 h-12 bg-muted-bg rounded-2xl border-2 border-border-themed flex items-center justify-center hover:border-emerald-500 transition-all text-text-themed shadow-lg">
            <RefreshCw className={cn("w-5 h-5 text-emerald-400", loading && "animate-spin")} />
          </button>
          <button onClick={onBack} className="px-8 h-12 bg-muted-bg rounded-2xl border-2 border-border-themed flex items-center justify-center gap-3 font-black hover:border-emerald-500 transition-all uppercase tracking-widest text-[10px] text-text-themed shadow-lg">
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            Terminal Exit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Note about Wayland/X11 */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-6 rounded-2xl">
            <div className="flex gap-4">
              <Info className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Environment Note: Wayland Active</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The host system utilizes a Wayland-secured display environment. Traditional X11 utilities like <code className="bg-black px-1 rounded">xinput</code> are restricted. Use <code className="bg-black px-1 rounded">libinput</code> for native kernel-level diagnostics.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Kernel-Attached Inputs</h3>
            {loading && devices.length === 0 ? (
              <div className="text-center py-20 animate-pulse text-zinc-600 font-black uppercase tracking-widest">Querying Hardware Bus...</div>
            ) : (
              devices.map((dev, i) => (
                <div key={i} className="bg-surface border-2 border-border-themed p-6 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
                      {dev.capabilities?.includes('touch') ? <Activity className="w-6 h-6 text-emerald-400" /> : <Cpu className="w-6 h-6 text-zinc-500" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-zinc-100 uppercase tracking-tight">{dev.name}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Port: {dev.kernel}</span>
                        <span className="text-[10px] font-bold text-emerald-500/70 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest">{dev.capabilities}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(76,175,80,0.5)]" />
                    <span className="text-[10px] font-black text-success uppercase tracking-widest">Active</span>
                  </div>
                </div>
              ))
            )}
            {!loading && devices.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl opacity-30">
                <Search className="w-12 h-12 mx-auto mb-4" />
                <p className="text-sm font-black uppercase tracking-widest italic">No HID Devices Detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
