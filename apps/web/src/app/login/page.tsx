'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  Cookie,
  CupSoda,
  Apple,
  Sparkles,
  Package,
  UtensilsCrossed,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';

/* ─── Professional Lucide sticker badges ─────────────────────────────────── */
const STICKERS = [
  {
    icon: Cookie,
    color: '#FF8FB8',
    bg: '#FFEAF2',
    top: '10%',
    left: '12%',
    rotate: '-14deg',
    size: 32,
    dur: '4.2s',
    delay: '0s',
  },
  {
    icon: CupSoda,
    color: '#4DB8FF',
    bg: '#E6F6FF',
    top: '18%',
    right: '10%',
    rotate: '10deg',
    size: 30,
    dur: '3.8s',
    delay: '0.5s',
  },
  {
    icon: Apple,
    color: '#8BD450',
    bg: '#F2FBEB',
    bottom: '20%',
    left: '8%',
    rotate: '-8deg',
    size: 32,
    dur: '4.5s',
    delay: '1.0s',
  },
  {
    icon: UtensilsCrossed,
    color: '#C98B5A',
    bg: '#FBF0E7',
    bottom: '14%',
    right: '12%',
    rotate: '12deg',
    size: 28,
    dur: '3.6s',
    delay: '0.3s',
  },
  {
    icon: Flame,
    color: '#FF7A1A',
    bg: '#FFF0E5',
    top: '46%',
    right: '6%',
    rotate: '-18deg',
    size: 26,
    dur: '4.0s',
    delay: '0.8s',
  },
  {
    icon: Sparkles,
    color: '#7C5CFF',
    bg: '#F0ECFF',
    top: '8%',
    right: '30%',
    rotate: '7deg',
    size: 24,
    dur: '4.8s',
    delay: '1.4s',
  },
  {
    icon: Package,
    color: '#FFB800',
    bg: '#FFF8E6',
    bottom: '38%',
    left: '22%',
    rotate: '-6deg',
    size: 26,
    dur: '3.9s',
    delay: '0.6s',
  },
];

/* ─── Sparkles for right panel ──────────────────────────────────────────── */
const SPARKLES: {
  top?: string; bottom?: string;
  left?: string; right?: string;
  size: number;
  opacity: number;
}[] = [
  { top: '8%',    left: '10%',  size: 18, opacity: 0.45 },
  { top: '14%',   right: '8%',  size: 14, opacity: 0.35 },
  { bottom: '20%',right: '6%',  size: 20, opacity: 0.40 },
  { bottom: '12%',left: '14%',  size: 16, opacity: 0.35 },
  { top: '55%',   right: '10%', size: 14, opacity: 0.30 },
];

/* ─── Spinner ───────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 18,
        height: 18,
        border: '2.5px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'lp-spin 600ms linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

export default function LoginPage() {
  const { login }   = useAuth();
  const router      = useRouter();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [serverErr,   setServerErr]   = useState('');
  const [fieldErr,    setFieldErr]    = useState<{ email?: string; password?: string }>({});

  /* validation */
  function validate() {
    const e: typeof fieldErr = {};
    if (!email)                                           e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email    = 'Enter a valid email';
    if (!password)                                        e.password = 'Password is required';
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerErr('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErr(errs); return; }
    setFieldErr({});
    setLoading(true);
    try   { await login(email, password); router.replace('/dashboard'); }
    catch (err) { setServerErr(err instanceof ApiError ? err.message : 'Something went wrong.'); }
    finally     { setLoading(false); }
  }

  async function demo(type: 'admin' | 'member') {
    const c = type === 'admin'
      ? { e: 'admin@snackoverflow.local',  p: 'admin123' }
      : { e: 'member@snackoverflow.local', p: 'member123' };
    setEmail(c.e);
    setPassword(c.p);
    setFieldErr({});
    setServerErr('');
    setLoading(true);
    try   { await login(c.e, c.p); router.replace('/dashboard'); }
    catch (err) { setServerErr(err instanceof ApiError ? err.message : 'Demo login failed — is the API running?'); }
    finally     { setLoading(false); }
  }

  return (
    <>
      <style>{`
        /* keyframes */
        @keyframes lp-float {
          0%, 100% { transform: translateY(0px) rotate(var(--lp-r, 0deg)); }
          50%       { transform: translateY(-12px) rotate(calc(var(--lp-r, 0deg) + 3deg)); }
        }
        @keyframes lp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes lp-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* outer canvas */
        .lp {
          min-height: 100dvh;
          display: flex;
          background: #FAF8F5;
        }

        /* ─── LEFT PANEL ─────────────────────────────────────────────────── */
        .lp-left {
          flex: 0 0 50%;
          background: #FF7A1A;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justifyContent: center;
          align-items: center;
          padding: 60px 48px;
          border-right: 2.5px solid #1B1B2F;
        }

        /* stickers floating on left */
        .lp-sticker-badge {
          position: absolute;
          display: flex;
          align-items: center;
          justifyContent: center;
          padding: 14px;
          border-radius: 18px;
          border: 2px solid #1B1B2F;
          box-shadow: 3px 3px 0 #1B1B2F;
          user-select: none;
          pointer-events: none;
          animation: lp-float var(--lp-dur, 4s) ease-in-out infinite;
          animation-delay: var(--lp-delay, 0s);
        }

        .lp-left-content {
          position: relative;
          z-index: 2;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .lp-left-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .lp-left-brand-name {
          font-family: var(--font-bricolage), 'Bricolage Grotesque', sans-serif;
          font-size: 26px;
          font-weight: 900;
          color: #1B1B2F;
          letter-spacing: -0.5px;
        }

        .lp-left-tagline {
          font-family: var(--font-bricolage), 'Bricolage Grotesque', sans-serif;
          font-size: clamp(38px, 4.8vw, 62px);
          font-weight: 900;
          color: #1B1B2F;
          line-height: 1.05;
          letter-spacing: -1.5px;
          margin: 0 0 16px;
        }

        .lp-left-sub {
          font-size: 17px;
          font-weight: 600;
          color: #1B1B2F;
          opacity: 0.85;
          margin: 0;
          line-height: 1.45;
        }

        /* ─── RIGHT PANEL ────────────────────────────────────────────────── */
        .lp-right {
          flex: 1;
          display: flex;
          align-items: center;
          justifyContent: center;
          padding: 48px 40px;
          position: relative;
          background: #FAF8F5;
        }

        .lp-sparkle {
          position: absolute;
          color: #FF7A1A;
          user-select: none;
          pointer-events: none;
        }

        .lp-card {
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border: 2.5px solid #1B1B2F;
          box-shadow: 6px 6px 0 #1B1B2F;
          border-radius: 24px;
          padding: clamp(28px, 4vw, 44px) clamp(24px, 3.5vw, 40px);
          animation: lp-fadein 300ms ease both;
        }

        .lp-card-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .lp-card-logo-name {
          font-family: var(--font-bricolage), 'Bricolage Grotesque', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #1B1B2F;
          line-height: 1.1;
        }
        .lp-card-logo-name span { color: #FF7A1A; }

        .lp-card-h {
          font-family: var(--font-bricolage), 'Bricolage Grotesque', sans-serif;
          font-size: clamp(22px, 2.5vw, 28px);
          font-weight: 900;
          color: #1B1B2F;
          margin: 0 0 24px;
          line-height: 1.1;
        }

        .lp-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .lp-label { font-size: 14px; font-weight: 600; color: #1B1B2F; }
        .lp-input-wrap { position: relative; }
        .lp-input {
          width: 100%; height: 50px; padding: 0 46px 0 14px;
          background: #FFF8EC; border: 2px solid #1B1B2F; border-radius: 12px;
          font-size: 15px; font-family: var(--font-inter), 'Inter', sans-serif;
          color: #1B1B2F; outline: none;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .lp-input::placeholder { color: #B6B2CC; }
        .lp-input:focus { border-color: #7C5CFF; box-shadow: 0 0 0 3px rgba(124, 92, 255, .18); }
        .lp-input.lp-err { border-color: #EF4B4B; }
        .lp-eye {
          position: absolute; right: 0; top: 0; bottom: 0; width: 46px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: #5B5B72;
        }
        .lp-ferr { font-size: 12px; font-weight: 500; color: #EF4B4B; }

        .lp-serr {
          display: flex; align-items: center; gap: 10px;
          background: #FFF0F0; border: 1.5px solid #EF4B4B;
          border-radius: 10px; padding: 11px 14px;
          font-size: 13px; font-weight: 600; color: #8A1C1C;
          margin-bottom: 16px;
          animation: lp-fadein 150ms ease;
        }

        .lp-btn-login {
          width: 100%; height: 52px;
          background: #FF7A1A; color: #1B1B2F;
          border: 2.5px solid #1B1B2F; box-shadow: 4px 4px 0 #1B1B2F;
          border-radius: 14px;
          font-family: var(--font-bricolage), 'Bricolage Grotesque', sans-serif;
          font-weight: 900; font-size: 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: transform 100ms ease, box-shadow 100ms ease;
          letter-spacing: -0.3px;
        }
        @media (hover: hover) {
          .lp-btn-login:not(:disabled):hover {
            transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #1B1B2F;
          }
        }
        .lp-btn-login:not(:disabled):active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 #1B1B2F; }
        .lp-btn-login:disabled { opacity: .65; cursor: not-allowed; }

        .lp-divider {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: #5B5B72; margin: 18px 0;
        }
        .lp-divider::before, .lp-divider::after {
          content: ''; flex: 1; height: 1.5px; background: #1B1B2F; opacity: .12;
        }

        .lp-demos { display: flex; gap: 10px; }
        .lp-demo {
          flex: 1; height: 44px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: #fff; border: 2px solid #1B1B2F; box-shadow: 3px 3px 0 #1B1B2F;
          border-radius: 100px; font-size: 13px; font-weight: 700; color: #1B1B2F;
          cursor: pointer; transition: transform 100ms ease, box-shadow 100ms ease;
          font-family: var(--font-inter), 'Inter', sans-serif; white-space: nowrap;
        }
        @media (hover: hover) {
          .lp-demo:not(:disabled):hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #1B1B2F; }
        }
        .lp-demo:not(:disabled):active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #1B1B2F; }
        .lp-demo:disabled { opacity: .6; cursor: not-allowed; }

        @media (max-width: 900px) {
          .lp-left { flex: 0 0 44%; }
          .lp-right { padding: 40px 32px; }
        }

        @media (max-width: 680px) {
          .lp { flex-direction: column; }
          .lp-left {
            flex: none; min-height: 220px;
            padding: 28px 24px 36px;
            justify-content: flex-end;
          }
          .lp-left-tagline { font-size: clamp(28px, 8vw, 40px); }
          .lp-right { flex: 1; align-items: flex-start; padding: 32px 20px 48px; }
          .lp-card { border-radius: 20px; box-shadow: 4px 4px 0 #1B1B2F; }
          .lp-demos { flex-direction: column; gap: 8px; }
          .lp-demo { flex: none; }
        }

        @media (max-width: 380px) {
          .lp-card { padding: 24px 20px; }
          .lp-left { min-height: 190px; }
        }
      `}</style>

      <div className="lp">
        {/* ══ LEFT — orange hero panel ════════════════════════════════════ */}
        <div className="lp-left" aria-hidden="true">
          {STICKERS.map(({ icon: IconComp, color, bg, size, rotate, dur, delay, ...pos }, i) => (
            <div
              key={i}
              className="lp-sticker-badge"
              style={{
                ...pos,
                background: bg,
                color,
                transform: `rotate(${rotate})`,
                '--lp-r': rotate,
                '--lp-dur': dur,
                '--lp-delay': delay,
              } as unknown as React.CSSProperties}
            >
              <IconComp size={size} strokeWidth={2.4} />
            </div>
          ))}

          {/* Left panel main content centered */}
          <div className="lp-left-content">
            <p className="lp-left-tagline">
              Snack<br />Overflow
            </p>
            <p className="lp-left-sub">Never fight over the last packet again.</p>
          </div>
        </div>

        {/* ══ RIGHT — white panel + form card ════════════════════════════ */}
        <div className="lp-right">
          {/* sparkle decorations */}
          {SPARKLES.map(({ size, opacity, ...pos }, i) => (
            <span
              key={i}
              className="lp-sparkle"
              style={{ ...pos, opacity } as React.CSSProperties}
            >
              <Sparkles size={size} strokeWidth={2} />
            </span>
          ))}

          <div className="lp-card">
            {/* logo */}
            <div className="lp-card-logo">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--primary)',
                  border: '2px solid #1B1B2F',
                  boxShadow: '2.5px 2.5px 0 #1B1B2F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1B1B2F',
                }}
              >
                <Package size={24} strokeWidth={2.5} />
              </div>
              <div className="lp-card-logo-name">
                Snack <span>Overflow</span>
              </div>
            </div>

            {/* heading */}
            <h1 className="lp-card-h">Log in to your account</h1>

            {/* server error */}
            {serverErr && (
              <div className="lp-serr" role="alert" aria-live="assertive">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                {serverErr}
              </div>
            )}

            {/* form */}
            <form onSubmit={submit} noValidate>
              {/* email */}
              <div className="lp-field">
                <label htmlFor="lp-email" className="lp-label">Email</label>
                <div className="lp-input-wrap">
                  <input
                    id="lp-email"
                    type="email"
                    className={`lp-input${fieldErr.email ? ' lp-err' : ''}`}
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErr(p => ({ ...p, email: undefined })); }}
                    placeholder="you@company.com"
                    autoComplete="email"
                    disabled={loading}
                    style={{ paddingRight: 14 }}
                  />
                </div>
                {fieldErr.email && <span className="lp-ferr" role="alert">{fieldErr.email}</span>}
              </div>

              {/* password */}
              <div className="lp-field">
                <label htmlFor="lp-pwd" className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input
                    id="lp-pwd"
                    type={showPwd ? 'text' : 'password'}
                    className={`lp-input${fieldErr.password ? ' lp-err' : ''}`}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="lp-eye"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErr.password && <span className="lp-ferr" role="alert">{fieldErr.password}</span>}
              </div>

              {/* submit */}
              <button type="submit" className="lp-btn-login" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><Spinner /> Logging in…</> : 'Log in'}
              </button>
            </form>

            {/* divider + demo */}
            <div className="lp-divider">Or try a demo</div>
            <div className="lp-demos">
              <button type="button" className="lp-demo" onClick={() => demo('admin')} disabled={loading}>
                <User size={15} /> Use Admin demo
              </button>
              <button type="button" className="lp-demo" onClick={() => demo('member')} disabled={loading}>
                <User size={15} /> Use Member demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
