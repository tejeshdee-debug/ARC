import { useState, useEffect } from "react";
import { LogIn, Eye, EyeOff, Shield, Anchor } from "lucide-react";
import { api } from "../api/client";
import fmuLogo from "../fmu_logo.png";
import easternSwordLogo from "../eastern_sword_logo.png";
import navalBanner from "../naval_banner.jpg";

// Demo credentials — in production these would come from an API
const DEMO_USERS: Record<string, { role: string; id: string }> = {
  superadmin: { role: "Super Admin",    id: "U-001" },
  baradmin:   { role: "Bar Admin",      id: "U-002" },
  posuser1:   { role: "POS User",       id: "U-003" },
  posuser2:   { role: "POS User",       id: "U-004" },
  stockmgr:   { role: "Stock Manager",  id: "U-005" },
};
// All demo users share password "admin123"
const DEMO_PASSWORD = "admin123";

interface LoginPageProps {
  onLogin: (username: string, role: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [time, setTime]         = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(username.trim(), password);
      onLogin(res.username, res.role);
    } catch (err: any) {
      // Fallback for demo offline mode
      const user = DEMO_USERS[username.trim().toLowerCase()];
      if (user && password === DEMO_PASSWORD) {
        onLogin(username.trim().toLowerCase(), user.role);
      } else {
        setError(err.message || "Invalid username or password. Please try again.");
        setLoading(false);
      }
    }
  }

  const dateStr = time.toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });
  const timeStr = time.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });

  return (
    <div className="login-root relative overflow-hidden bg-[#040d1a]">
      {/* ── Background banner featuring Indian Navy warships, submarines & constellation map ── */}
      <div className="absolute inset-0 bg-cover bg-center opacity-75 brightness-95 contrast-110 transition-transform duration-1000 scale-105" style={{ backgroundImage: `url(${navalBanner})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#041022]/90 via-[#061830]/75 to-[#020914]/95" />
      <div className="login-grid-overlay opacity-30" />

      {/* ── Top Header Banner (Matching Reference Image) ── */}
      <header className="relative z-10 w-full border-b border-cyan-500/30 bg-[#061830]/90 shadow-xl backdrop-blur-md">
        <div className="w-full flex items-center justify-between px-6 py-2">
          {/* Left Corner Logo: Eastern Sword */}
          <div className="flex items-center gap-3">
            <img src={easternSwordLogo} alt="Eastern Sword - The Sunrise Fleet" className="h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]" />
          </div>

          {/* Center Banner Title */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-slate-200 to-gray-300 tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-[Cinzel,Georgia,serif]">
              AFLOAT RECREATION CENTER
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-amber-400 to-amber-500" />
              <span className="text-amber-400 text-[10px] font-bold tracking-[0.2em] uppercase drop-shadow">
                EASTERN NAVAL COMMAND
              </span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-amber-400 to-amber-500" />
            </div>
          </div>

          {/* Right Corner Logo: Fleet Maintenance Unit & Clock */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-xs text-cyan-200/80 font-mono">
              <span className="font-semibold tracking-wider text-cyan-300">{dateStr}</span>
              <span className="text-amber-400 font-bold tracking-widest">{timeStr}</span>
            </div>
            <div className="h-8 w-[1px] bg-cyan-500/30 hidden sm:block" />
            <img src={fmuLogo} alt="Fleet Maintenance Unit" className="h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />
          </div>
        </div>
      </header>

      {/* ── Center card ── */}
      <main className="login-main relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="login-card relative w-full max-w-md p-8 rounded-2xl border border-cyan-500/30 bg-[#0a1e38]/90 shadow-[0_0_50px_rgba(0,180,255,0.2)] backdrop-blur-xl">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-amber-400 rounded-t-2xl" />

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-2 rounded-full bg-cyan-500/10 border border-cyan-400/30 mb-3 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
              <Shield size={26} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-widest uppercase">ARC LOGIN</h2>
            <p className="text-amber-400/90 text-[10px] font-bold tracking-wider mt-1 uppercase">Eastern Naval Command</p>
          </div>

          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-6" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            {/* Username */}
            <div className="login-field">
              <label htmlFor="login-username" className="login-label">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">@</span>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(""); }}
                  placeholder="Enter username"
                  className="login-input"
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="login-password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  className="login-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="login-eye-btn"
                  tabIndex={-1}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error" role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Demo hint */}
            <div className="login-hint">
              Demo: use any username above with password <strong>admin123</strong>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className={"login-btn" + (loading ? " login-btn-loading" : "")}
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="login-card-footer">
            Authorised personnel only. Unauthorised access is prohibited.
          </p>
        </div>

        {/* Decorative side panels */}
        <div className="login-side login-side-left">
          <div className="login-side-line" />
          <div className="login-side-dot" />
        </div>
        <div className="login-side login-side-right">
          <div className="login-side-line" />
          <div className="login-side-dot" />
        </div>
      </main>

      {/* ── Bottom bar ── */}
      <footer className="login-footer">
        <span>© {new Date().getFullYear()} Indian Navy — ARC Management System v2.0</span>
        <span className="login-footer-sep">·</span>
        <span>Classified System — Restricted Access</span>
      </footer>
    </div>
  );
}
