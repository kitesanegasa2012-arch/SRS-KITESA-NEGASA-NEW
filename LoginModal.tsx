import React, { useState } from 'react';
import { getStoredAuthorizedUsers, getStoredRevokedUsers, saveStoredAuthorizedUsers, removeRevokedUser, validateUniversalPassword } from '../utils/storage';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { WelcomeAnimation } from './WelcomeAnimation';

interface LoginModalProps {
  onLoginSuccess: (email: string) => void;
  revokedMessage?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, revokedMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(revokedMessage || '');
  const [showWelcome, setShowWelcome] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Teessoo Gmail fi Jecha Darbiisaa (Password) guutuun barbaachisaa dha!');
      return;
    }

    const isCreatorEmail = cleanEmail === 'kitesanegasa2012@gmail.com';
    const revokedUsers = getStoredRevokedUsers();

    // 1. Creator Access (Kitesa Negasa Feyisa)
    if (isCreatorEmail) {
      const validCreatorPass =
        cleanPass === 'kitesanegasa2012password' ||
        cleanPass === 'SRS@2026#$K' ||
        cleanPass === 'admin2026' ||
        cleanPass.toLowerCase() === 'lati';

      if (!validCreatorPass) {
        setError('Jechi Darbiisaa (Password) abbaa kalaqaa dogoggoraa dha! Maaloo irra deebi\'aa yaalaa.');
        return;
      }
    } else {
      // 2. Check if user access was revoked explicitly
      if (revokedUsers.includes(cleanEmail)) {
        setError('Eeyyamni fayyadamaa Gmail kanaa haqameera! Maaloo abbaa kalaqaa (Kitesa Negasa Feyisa) irraa jecha darbii (Password) haaraa fi eeyyama deebisaa gaafadhaa.');
        return;
      }

      // 3. Strict Verification: User must match Creator-assigned authorized list OR Creator Universal Admin Key
      const authUsers = getStoredAuthorizedUsers();
      const userStoredPass = authUsers[cleanEmail];

      const isPassMatched = userStoredPass && userStoredPass === cleanPass;
      const isMasterAdminPass =
        cleanPass === 'SRS@2026#$K' ||
        cleanPass === 'kitesanegasa2012password' ||
        cleanPass === 'admin2026' ||
        cleanPass.toLowerCase() === 'lati';

      if (!isPassMatched && !isMasterAdminPass) {
        if (!userStoredPass) {
          setError(`Teessoon Gmail '${cleanEmail}' eeyyama hin qabu! Maaloo abbaa kalaqaa (Kitesa Negasa Feyisa) qunnamuun Gmail fi Password eeyyamsiisaa.`);
        } else {
          setError(`Jechi darbiisaa (Password) '${cleanEmail}' tiif galchitan dogoggora! Maaloo password abbaan kalaqaa siif kenne galchaa.`);
        }
        return;
      }

      // If authorized via master key or existing, ensure user record is saved
      removeRevokedUser(cleanEmail);
      if (!userStoredPass) {
        authUsers[cleanEmail] = cleanPass;
        saveStoredAuthorizedUsers(authUsers);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('srs_admin_level_unlocked', 'true');
    }

    setError('');
    setLoggedInEmail(cleanEmail);
    setShowWelcome(true);
  };

  if (showWelcome) {
    return (
      <WelcomeAnimation
        userEmail={loggedInEmail}
        onComplete={() => onLoginSuccess(loggedInEmail)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 sm:p-10 shadow-2xl border-4 border-amber-400/80 text-white">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 mb-4 shadow-lg animate-pulse">
            <span className="text-4xl">🎓</span>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-wide text-white mb-1">
            Student Registration System
          </h1>
          <p className="text-amber-300 font-semibold text-sm sm:text-base tracking-wider uppercase mb-1">
            Systema Galmee Barattootaa
          </p>
          <p className="text-slate-300 text-xs sm:text-sm font-light italic mb-4">
            By Kitesa Negasa Feyisa
          </p>

          <div className="h-1 w-32 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 mx-auto rounded-full mb-6" />

          {error && (
            <div className="mb-4 p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-rose-100 text-xs sm:text-sm font-medium space-y-2 text-center shadow-lg animate-bounce">
              <p className="font-extrabold text-amber-300 text-sm sm:text-base">
                ⚠️ {error}
              </p>
              <div className="pt-2 border-t border-rose-800 text-[11px] sm:text-xs text-slate-200 space-y-0.5 font-sans">
                <p className="font-bold text-amber-200">📞 Toora Qunnamtii Abbaa Kalaqaa (Creator Contact):</p>
                <p>👤 <b>Maqaa:</b> Kitesa Negasa Feyisa</p>
                <p>📱 <b>Lakk. Bilbilaa:</b> <a href="tel:0910927936" className="underline text-amber-300 font-bold">0910927936</a> / <a href="tel:0969184005" className="underline text-amber-300 font-bold">0969184005</a></p>
                <p>✉️ <b>Gmail:</b> kitesanegasa2012@gmail.com</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Gmail Address | Teessoo Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kitesanegasa2012@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password | Jecha Darbiisaa
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-400/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Seeni / Login</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
