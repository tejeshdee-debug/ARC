import { useState, useEffect } from "react";
import { LogIn, Eye, EyeOff, Shield, Anchor } from "lucide-react";
import { api } from "../api/client";

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
    <div className="login-root">
      {/* ── Animated background mesh ── */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-grid-overlay" />
      </div>

      {/* ── Top bar ── */}
      <header className="login-topbar">
        <div className="login-topbar-inner">
          <div className="login-topbar-brand">
            <Anchor size={16} className="login-anchor-icon" />
            <span>INDIAN NAVY — EASTERN NAVAL COMMAND</span>
          </div>
          <div className="login-topbar-clock">
            <span className="login-clock-date">{dateStr}</span>
            <span className="login-clock-sep">|</span>
            <span className="login-clock-time">{timeStr}</span>
          </div>
        </div>
      </header>

      {/* ── Center card ── */}
      <main className="login-main">
        <div className="login-card">
          {/* Glow ring */}
          <div className="login-card-glow" />

          {/* Logo / badge */}
          <div className="login-badge">
            <div className="login-badge-ring login-badge-ring-outer" />
            <div className="login-badge-ring login-badge-ring-inner" />
            <div className="login-badge-core">
              <Shield size={28} className="login-shield-icon" />
            </div>
          </div>

          {/* Heading */}
          <div className="login-heading">
            <h1 className="login-title">ARC</h1>
            <p className="login-subtitle">Afloat Recreation Center</p>
            <p className="login-subtitle2">Management System</p>
          </div>

          <div className="login-divider" />

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
