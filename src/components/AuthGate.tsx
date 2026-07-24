// Auth Gate - AI Project Intelligence Platform
// Path: src/components/AuthGate.tsx
// Predator/HUD login screen backed by Supabase Auth. Renders children only
// once a session exists; otherwise shows the access terminal.

'use client';

import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/shared/supabase-client';

export default function AuthGate({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setNotice('Access request registered. Check your email to confirm, then sign in.');
          setMode('signin');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  // ---- booting ----
  if (checking) {
    return (
      <div className="auth-screen">
        <div className="auth-boot">
          <span className="hud-empty-dot" />
          ESTABLISHING SECURE LINK…
        </div>
      </div>
    );
  }

  // ---- authenticated ----
  if (session) return <>{children}</>;

  // ---- access terminal ----
  return (
    <div className="auth-screen">
      <div className="auth-grid" />
      <div className="auth-panel glass-panel">
        <div className="auth-core">
          <div className="jarvis-core relative">
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-cyan-400 font-extrabold tracking-widest uppercase">
              AI
            </span>
          </div>
        </div>

        <div className="auth-head">
          <h1 className="auth-title">JARVIS // OS</h1>
          <p className="auth-sub">
            {mode === 'signin' ? 'IDENTITY VERIFICATION REQUIRED' : 'REQUEST NEW ACCESS CLEARANCE'}
          </p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span className="auth-label">Operator ID · Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
              className="auth-input"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Passkey</span>
            <input
              type="password"
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input"
            />
          </label>

          {error && <div className="auth-error">⚠ {error}</div>}
          {notice && <div className="auth-notice">{notice}</div>}

          <button type="submit" disabled={busy} className="auth-submit">
            {busy ? 'AUTHENTICATING…' : mode === 'signin' ? '▶ INITIATE LINK' : '▶ REGISTER OPERATOR'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError('');
            setNotice('');
          }}
        >
          {mode === 'signin'
            ? 'No clearance? · Request access →'
            : 'Have clearance? · Return to sign in →'}
        </button>

        <div className="auth-foot">
          <span className="w-1 h-1 rounded-full bg-[#00ffaa] animate-ping inline-block" />
          SUPABASE AUTH · ENCRYPTED CHANNEL
        </div>
      </div>
    </div>
  );
}
