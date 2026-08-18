import React, { useEffect } from 'react';
import { School, GraduationCap, Sparkles, BookOpen, Volume2, ShieldCheck, ArrowRight } from 'lucide-react';

interface WelcomeAnimationProps {
  onComplete: () => void;
  userEmail?: string;
}

export const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ onComplete, userEmail }) => {
  useEffect(() => {
    // Speak English greeting using Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // cancel any ongoing speech
        const text = "WELCOME TO STUDENT REGISTRATION SYSTEM CREATED BY KITESA NEGASA !";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // medium speech rate
        utterance.pitch = 1.0; // medium pitch
        utterance.volume = 1.0;

        // Try to pick an English voice
        const setVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          const engVoice = voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Compact'));
          if (engVoice) {
            utterance.voice = engVoice;
          }
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          setVoice();
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            setVoice();
            window.speechSynthesis.onvoiceschanged = null;
          };
          // Fallback if voiceschanged doesn't trigger quickly
          setTimeout(setVoice, 100);
        }
      } catch (err) {
        console.error('Speech synthesis failed:', err);
      }
    }

    // Auto complete after 4 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
      
      {/* Floating School Icons */}
      <div className="absolute top-12 left-12 text-amber-400/30 animate-bounce text-4xl">🎓</div>
      <div className="absolute bottom-16 left-20 text-purple-400/30 animate-pulse text-5xl">🏫</div>
      <div className="absolute top-16 right-16 text-indigo-400/30 animate-bounce text-4xl">📚</div>
      <div className="absolute bottom-12 right-20 text-amber-400/30 animate-pulse text-5xl">✨</div>

      <div className="relative z-10 max-w-2xl w-full bg-slate-900/90 border-4 border-amber-400/90 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl animate-fadeIn">
        {/* Animated School Icon Shield */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 p-1 shadow-2xl shadow-amber-500/40 animate-pulse">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400 border-2 border-amber-300/50">
              <School className="w-14 h-14 text-amber-400 animate-bounce" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full shadow-lg animate-ping">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="absolute -bottom-1 -left-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Voice Indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 animate-pulse">
          <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>ENGLISH VOICE GREETING PLAYING...</span>
        </div>

        {/* Welcome Text */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
            WELCOME TO STUDENT REGISTRATION SYSTEM
          </span>
          <br />
          <span className="text-amber-400 text-xl sm:text-3xl font-black mt-2 block">
            CREATED BY KITESA NEGASA !
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base font-medium max-w-lg mx-auto mb-6">
          Systema Galmee Barattootaa Mana Barumsaa tiin Baga Nagaan Dhuftan!
        </p>

        {userEmail && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Fayyadamaa: {userEmail}</span>
          </div>
        )}

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-6 border border-slate-700">
          <div className="bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 h-full rounded-full animate-[ping_2s_infinite]" style={{ width: '100%', transition: 'width 4s linear' }} />
        </div>

        {/* Continue Button */}
        <button
          onClick={onComplete}
          className="px-8 py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-400/30 transition transform hover:scale-105 flex items-center justify-center gap-2 mx-auto cursor-pointer text-sm sm:text-base uppercase tracking-wider"
        >
          <span>FUULDURATTI TARSIISI (ENTER SYSTEM)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
