import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X, Info, ExternalLink, Copy, Check } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(true);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const sharedUrl = 'https://ais-pre-6mgdg6aeqridjbwe5ls4cl-626059989758.europe-west2.run.app';

  useEffect(() => {
    // Check if running inside iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check if app is already running as standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      setShowBanner(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowBanner(false);
        }
      } catch {
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handleForceRefresh = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!showBanner || isInstalled) return null;

  return (
    <>
      {/* Floating PWA Install Bar at top of app */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-900 text-slate-950 p-2.5 px-4 shadow-lg flex items-center justify-between gap-3 text-xs border-b-2 border-amber-300 relative z-40">
        <div className="flex items-center gap-2.5 grow min-w-0">
          <div className="p-1.5 bg-slate-950 text-amber-400 rounded-xl shrink-0 font-bold shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="truncate">
            <p className="font-extrabold text-slate-950 text-xs sm:text-sm leading-tight truncate">
              📲 Appii SRS KITESA Bilbila Keessan irratti Install (Add to Home Screen) Godhaa!
            </p>
            <p className="text-[11px] text-slate-900 font-medium hidden sm:block truncate">
              {isInIframe
                ? 'Linkii guutuu Chrome keessatti banuun Appii bilbila keessan irratti fe’aa!'
                : 'Install gochuun offline fayyadamuuf isin gargaara.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInIframe ? (
            <a
              href={sharedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Chrome-iin Banaa</span>
            </a>
          ) : (
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{deferredPrompt ? 'Instaal Godhi' : 'Install Akkam'}</span >
            </button>
          )}

          <button
            onClick={() => setShowInstructions(true)}
            className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-sm hidden md:flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Qajeelfama</span>
          </button>

          <button
            onClick={() => setShowBanner(false)}
            className="p-1.5 text-slate-900 hover:text-slate-950 hover:bg-black/10 rounded-lg transition"
            title="Cufi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instructional Modal when manually adding to Home Screen */}
      {showInstructions && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-2xl font-black">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Akkaataa Appii SRS KITESA Install (Home Screen) Itti Gotan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">SRS KITESA Offline PWA</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="font-semibold text-amber-950">
                    PWA (Progressive Web App) bilbila keessan irratti fe'amuuf linkii kanaan Chrome ykn Safari keessatti banamuu qaba:
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200">
                  <input
                    type="text"
                    readOnly
                    value={sharedUrl}
                    className="w-full text-[11px] font-mono text-slate-700 bg-transparent outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 bg-indigo-950 text-amber-300 hover:bg-slate-900 font-bold rounded-lg text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Waraabame!' : 'Waraabi'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 font-medium">
                <h4 className="font-black text-slate-900 text-sm border-b pb-1">💻 Laptop / PC (Google Chrome & Microsoft Edge):</h4>
                <div className="flex items-start gap-3 p-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
                  <span className="w-6 h-6 rounded-full bg-indigo-900 text-amber-300 font-black flex items-center justify-center text-xs shrink-0">1</span>
                  <p>
                    Linkii olitti waraabdaniin <b>Chrome</b> ykn <b>Edge</b> keessatti tab haaraa banaa (Iframe keessatti hin fe'amu).
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-300">
                  <span className="w-6 h-6 rounded-full bg-amber-800 text-amber-100 font-black flex items-center justify-center text-xs shrink-0">2</span>
                  <p className="text-amber-950 font-bold">
                    Sarara URL (Address Bar) mirga irratti mallattoo <b>"Install SRS KITESA" 💻⬇️</b> (Monitorii xiyya gadii) ilaalaatii dhiiba.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-indigo-900 text-amber-300 font-black flex items-center justify-center text-xs shrink-0">3</span>
                  <p>
                    Ykn mirga olitti <b>Tuqaa 3 (⋮)</b> tuqaa ➔ <b>"Save and share"</b> ➔ <b>"Install SRS KITESA..."</b> (ykn <b>"Create shortcut..."</b> ➔ 'Open as window' tik gochaa) Install dhiiba! Screen laptop irratti ni kaa'ama.
                  </p>
                </div>
              </div>

              <div className="space-y-3 font-medium">
                <h4 className="font-black text-slate-900 text-sm border-b pb-1">📱 Android (Chrome / Samsung Internet):</h4>
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-indigo-900 text-amber-300 font-black flex items-center justify-center text-xs shrink-0">1</span>
                  <p>
                    Linkii olitti waraabdaniin Chrome keessatti banaa. Mirga gubbaa menu <b>tuqaa 3 (⋮)</b> tuqaa.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-300">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-emerald-100 font-black flex items-center justify-center text-xs shrink-0">2</span>
                  <p className="text-emerald-950 font-bold">
                    Tarree keessaa <b>"Install app"</b> ykn <b>"Add to Home screen"</b> kan jedhu filadhaa.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-indigo-900 text-amber-300 font-black flex items-center justify-center text-xs shrink-0">3</span>
                  <p>
                    Screen dhufu irratti <b>"Install"</b> ykn <b>"Add"</b> dhiiba. Appiin fakkii fi maqaa <b>SRS KITESA</b>'n screena bilbilaa irratti ni fe'ama!
                  </p>
                </div>
              </div>

              {/* Troubleshooting Notice for Phone Re-Installation */}
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
                <h4 className="font-black text-rose-950 text-xs flex items-center gap-1.5">
                  <span>⚠️ YOO DURAAN INSTALL TA'EE AMMA INSTALL DIDE (Tarkaanfii Furmaataa):</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-900 font-semibold">
                  <li><b>1. Appii Screen irratti barbaadaa:</b> Yoo yeroo tokko fe'amee ture, screena bilbilaa keessan irratti fakkii <b>SRS KITESA</b> jedhu jiraachuu dhiisuu isaa mirkaneeffadhaa.</li>
                  <li><b>2. Chrome Menu (Tuqaa 3) Tuqaa:</b> Chrome mirga olitti <b>⋮</b> tuqaa ➔ <b>"Add to Home screen"</b> ykn <b>"Install App"</b> dhiiba.</li>
                  <li><b>3. Cache Clear Godhaa:</b> Butoonii <b>"Clear Cache / Haaromsi"</b> gadii dhiibaatii peejii kana renew godhaa.</li>
                  <li><b>4. Browser Keessatti Banaa:</b> In-App Browser (Telegram, Facebook) keessatti osoo hin taane, <b>Chrome direct</b> keessatti banaa.</li>
                </ul>
              </div>

              <div className="space-y-3 font-medium pt-2">
                <h4 className="font-black text-slate-900 text-sm border-b pb-1">🍎 iPhone / iPad (Safari):</h4>
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-indigo-900 text-amber-300 font-black flex items-center justify-center text-xs shrink-0">1</span>
                  <p>
                    Safari keessatti linkii kana banaa, sana booda mallattoo <b>Share (⬆️)</b> jala jiru tuqaa.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-300">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-emerald-100 font-black flex items-center justify-center text-xs shrink-0">2</span>
                  <p className="text-emerald-950 font-bold">
                    Tarree gadi bu'u keessaa <b>"Add to Home Screen" (➕)</b> filadhaati Install godhaa.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-indigo-950 text-amber-300 font-bold rounded-xl text-center text-xs space-y-2">
                <p>Erga Install gootanii booda Internet malee (Offline) guutummaatti ni hojjeta!</p>
                <button
                  type="button"
                  onClick={handleForceRefresh}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>🔄 Appii Haaromsi / Clear Cache (Versii Haaraa Fudhu)</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 text-amber-400 font-extrabold rounded-2xl transition shadow-md cursor-pointer"
                >
                  Hubadheera / Cufi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

