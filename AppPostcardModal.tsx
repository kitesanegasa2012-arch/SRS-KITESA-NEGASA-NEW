import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Landmark,
  Baby,
  UserPlus,
  Target,
  FileSpreadsheet,
  FileText,
  Settings as SettingsIcon,
  X,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  School,
  Star,
} from 'lucide-react';

interface AppPostcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export interface PostcardSection {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  buttonBg: string;
  points: string[];
}

export const APP_SECTIONS_DATA: PostcardSection[] = [
  {
    id: 'dashboard',
    num: 1,
    title: 'Daashboordii (M/Barumsaa)',
    subtitle: 'School Level Dashboard & Analytics',
    icon: LayoutDashboard,
    badge: 'M/Barumsaa Level',
    bgGradient: 'from-blue-600/15 via-indigo-600/10 to-slate-900',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-300',
    accentColor: 'bg-blue-500',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white',
    points: [
      'Odeeffannoo Waliigalaa Mana Barumsaa (Total Enrolled, Boys, Girls, Age-appropriate %)',
      'Infographics fi Graafiiwwan (Grade level distribution, Gender parity, Age charts)',
      'Checklist Tarkaanfii Barattootaa (Active, Transferred, Dropped out, Completed)',
      'Bara Barnootaa fi M/Barumsaa calaluu, ilaaluu fi odeeffannoo haaromsuu',
    ],
  },
  {
    id: 'aanaa',
    num: 2,
    title: 'Sadarkaa Aanaa Dashboard',
    subtitle: 'Woreda Education Office Aggregation',
    icon: Building2,
    badge: 'Sadarkaa Aanaa',
    bgGradient: 'from-emerald-600/15 via-teal-600/10 to-slate-900',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-300',
    accentColor: 'bg-emerald-500',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white',
    points: [
      'Gabaasa Mana Barumsaa Aanaa Hunda Ijaaruu fi Xiinxaluu',
      'Ilaalcha Caasaa M/Bara Aanaa (School directory & Filter by Aanaa)',
      'Shakallii fi Raawwii Galmee Aanaa Keessatti Walbira Qabuu',
      'Gabaasa Aanaa gara Excel / PDF tiin Foorumatii gochuu fi erguu',
    ],
  },
  {
    id: 'godina',
    num: 3,
    title: 'Sadarkaa Godinaa Dashboard',
    subtitle: 'Zonal Education Department Overview',
    icon: MapPin,
    badge: 'Sadarkaa Godinaa',
    bgGradient: 'from-amber-600/15 via-orange-600/10 to-slate-900',
    borderColor: 'border-amber-500/50',
    textColor: 'text-amber-300',
    accentColor: 'bg-amber-500',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black',
    points: [
      'Sadarkaa Godinaatti M/Barumsaa fi Aanaalee Hunda Qindeessuu',
      'Ragaa Waliigalaa Godinaa Ilaaluu, Madaaluu fi Xiinxaluu',
      'Garaagarummaa Aanaalee Keessaa Xiinxaluu (Zone-wide Data Aggregation)',
      'Misoomaa fi Karoora Godinaa Qopheessuu fi Tarkaanfii Fudhatamu Madaaluu',
    ],
  },
  {
    id: 'oromiyaa',
    num: 4,
    title: 'Biiroo Barnoota Oromiyaa Dashboard',
    subtitle: 'Regional Bureau Statistics & Analytics',
    icon: Landmark,
    badge: 'Biiroo Barnoota Oromiyaa',
    bgGradient: 'from-rose-600/15 via-red-600/10 to-slate-900',
    borderColor: 'border-rose-500/50',
    textColor: 'text-rose-300',
    accentColor: 'bg-rose-500',
    buttonBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white',
    points: [
      'Sadarkaa Biiroo Barnoota Oromiyaatti Ragaa Barattootaa Waliigalaa Xiinxaluu',
      'Biiroo Barnoota Oromiyaatiif Gabaasa Waliigalaa (Regional Overview)',
      'Godinaalee fi Aanaalee Hunda Walbira Qabanii Madaaluu',
      'Istadistiksii fi Raawwii Naannoo Oromiyaa Ilaaluu fi Madda Ragaa Cufuu',
    ],
  },
  {
    id: 'buuura_boruu',
    num: 5,
    title: 'Bu\'uura Boruu (Umurii 4-6)',
    subtitle: 'Pre-Primary & O-Class Early Education',
    icon: Baby,
    badge: 'Umurii 4-6',
    bgGradient: 'from-purple-600/15 via-fuchsia-600/10 to-slate-900',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-300',
    accentColor: 'bg-purple-500',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white',
    points: [
      'Galmee Barattoota Oltrooyyii / Umurii 4-6 (O-Class / Early Childhood)',
      'Daataan Umurii Saree (Age 4, Age 5, Age 6) Addaan Baasuu',
      'Raawwii Sagantaa Bu\'uura Boruu Hordofuu fi Xiinxaluu',
      'Gabaasa Qulqullina fi Baay\'ina Dhiiraa fi Dhalaa Bu\'uura Boruu',
    ],
  },
  {
    id: 'students',
    num: 6,
    title: 'Galmee Barattootaa (Student Registration)',
    subtitle: 'Individual Enrolment & Record Editing',
    icon: UserPlus,
    badge: 'Registration',
    bgGradient: 'from-cyan-600/15 via-blue-600/10 to-slate-900',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-300',
    accentColor: 'bg-cyan-500',
    buttonBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white',
    points: [
      'Barataa Haaraa Galmeessuu (First Name, Middle, Last, Gender, Grade, Age, FAN ID, Photo, Stream)',
      'Barattoota Galmeeffaman Tarreessuu, Search gochuu fi Filter gochuu',
      'Odeeffannoo Barataa Gulaaluu (Edit) fi Haquu (Delete) bilisaan',
      'Barattoota Batch Import (Excel/CSV) tiin Galmeessuu fi Export gochuu',
    ],
  },
  {
    id: 'targets',
    num: 7,
    title: 'Karoora Grade Targets',
    subtitle: 'Target Setting & Comparative Analysis',
    icon: Target,
    badge: 'Grade Targets',
    bgGradient: 'from-violet-600/15 via-purple-600/10 to-slate-900',
    borderColor: 'border-violet-500/50',
    textColor: 'text-violet-300',
    accentColor: 'bg-violet-500',
    buttonBg: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white',
    points: [
      'Karoora Kutaa Kutaan (Grade 1 - 8 / Pre-primary) Qopheessuu',
      'Karoora Dhiiraa fi Dhalaa Addaan Baasanii Galmeessuu',
      'Karoora fi Raawwii Dhugaa Walbira Qabanii Madaaluu (Achievement %)',
      'Target Comparison Charts fi Visual Progress Bars Ilaaluu',
    ],
  },
  {
    id: 'emis',
    num: 8,
    title: 'EMIS Upload & Verification',
    subtitle: 'EMIS Data Sync, File Upload & Locking',
    icon: FileSpreadsheet,
    badge: 'EMIS Verification',
    bgGradient: 'from-amber-500/15 via-yellow-600/10 to-slate-900',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-300',
    accentColor: 'bg-yellow-500',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black',
    points: [
      'Ragaa Galmee Barattootaa EMIS system-aatiin Wal-simsiisuu (Verify Data)',
      'Faayila Excel EMIS irraa Fe\'uu (Upload Excel File)',
      'Dogoggora Ragaa (Data Validation / Discrepancies) Adda Baasuu',
      'Ragaa EMIS Cufuu (Lock / Seal Data) fi Cloud irratti Ol-kaa\'uu',
    ],
  },
  {
    id: 'reports',
    num: 9,
    title: 'Gabaasa (Reports & Export)',
    subtitle: 'Comprehensive EMIS Export & Printing',
    icon: FileText,
    badge: 'Reports & Export',
    bgGradient: 'from-teal-600/15 via-emerald-600/10 to-slate-900',
    borderColor: 'border-teal-500/50',
    textColor: 'text-teal-300',
    accentColor: 'bg-teal-500',
    buttonBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white',
    points: [
      'Gabaasa Bifa Standard EMIS tiin Qopheessuu fi Maxxansuu (Print / PDF)',
      'Ragaa Barattootaa bifa Excel (.xlsx) fi CSV tiin Ol-kaa\'uu (Export)',
      'Gabaasa Caasaa Sadarkaa Sadarkaan (M/Barumsaa, Aanaa, Godina, Oromiyaa)',
      'Suuraa fi Ragaa Barattootaa wajjin Maxxansa Gabaasaa Qopheessuu',
    ],
  },
  {
    id: 'settings',
    num: 10,
    title: 'Qindaa\'ina (Settings & User Management)',
    subtitle: 'System Configuration & User Credentials',
    icon: SettingsIcon,
    badge: 'Settings',
    bgGradient: 'from-pink-600/15 via-rose-600/10 to-slate-900',
    borderColor: 'border-pink-500/50',
    textColor: 'text-pink-300',
    accentColor: 'bg-pink-500',
    buttonBg: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white',
    points: [
      'Maggaalaa, Aanaa, Godina fi M/Barumsaa Qindeeffachuu',
      'Fayyadamtoota Eeyyama argatanii (Authorized Users & Passwords) Bulchuu',
      'Fayyadamaa Haaraa Dabaluu, Odeeffannoo Jijjiiruu (Edit) fi Haquu (Revoke/Delete)',
      'Backup & Restore Data (Ragaa Ol-kaa\'uu fi Deebisuu) & Gmail Credentials',
    ],
  },
];

export const AppPostcardModal: React.FC<AppPostcardModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);
  const [filterView, setFilterView] = useState<'all' | 'single'>('all');

  if (!isOpen) return null;

  const currentSection = APP_SECTIONS_DATA[selectedCardIdx];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-indigo-500/60 rounded-3xl shadow-2xl text-white overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Postcard Header Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 p-5 sm:p-6 border-b border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-500 flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg shadow-amber-400/20 border border-amber-300 shrink-0">
              🎴
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest mb-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>WELCOME TO STUDENT REGISTRATION SYSTEM</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                QABIYYEEWWAN GURGUDDOO APPI KANAAN WALBARAA!
              </h2>
              <p className="text-slate-300 text-xs mt-0.5">
                Kutaalee Gurguddoo 10 fi Qabxiilee isaani kellaa Postcard kanaa keessatti tarreeffamaniiru.
              </p>
            </div>
          </div>

          {/* Controls & Close */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setFilterView(filterView === 'all' ? 'single' : 'all')}
              className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/80 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{filterView === 'all' ? '🔍 Ilaalcha Card Tokkoo' : '📋 Ilaalcha Hundaa (10)'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition cursor-pointer border border-rose-500/40"
              title="Cufi (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Postcard Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto grow space-y-6">
          
          {filterView === 'all' ? (
            /* ALL 10 POSTCARDS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {APP_SECTIONS_DATA.map((section) => {
                const IconComp = section.icon;
                return (
                  <div
                    key={section.id}
                    className={`relative p-5 rounded-2xl bg-gradient-to-br ${section.bgGradient} border-2 ${section.borderColor} shadow-xl hover:scale-[1.01] transition duration-200 flex flex-col justify-between group`}
                  >
                    {/* Top Row: Number badge & Category Icon */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center font-black text-xs text-amber-400">
                            #{section.num}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-slate-300">
                            {section.badge}
                          </span>
                        </div>
                        <div className={`p-2 rounded-xl bg-slate-950/80 border border-slate-700/80 ${section.textColor}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Section Title */}
                      <h3 className="text-base sm:text-lg font-black text-white mb-1 group-hover:text-amber-300 transition">
                        {section.num}. {section.title}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 mb-3">
                        {section.subtitle}
                      </p>

                      {/* Sub-points with REQUIRED SMALL FONT and ITALIC styling */}
                      <div className="space-y-1.5 mb-4 border-t border-slate-800/80 pt-3">
                        {section.points.map((pt, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 text-xs font-bold shrink-0 mt-0.5">•</span>
                            <p className="text-xs sm:text-[11px] italic text-slate-200 leading-relaxed">
                              {pt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button to Switch Tab */}
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateTab(section.id);
                          onClose();
                        }}
                        className={`w-full py-2 px-4 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2 ${section.buttonBg}`}
                      >
                        <span>Gara Kutaatti Seeni ({section.title.split(' ')[0]})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* SINGLE CARD CAROUSEL VIEW */
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Card {selectedCardIdx + 1} / 10</span>
                <div className="flex items-center gap-1">
                  {APP_SECTIONS_DATA.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedCardIdx(i)}
                      className={`w-2.5 h-2.5 rounded-full transition ${
                        i === selectedCardIdx ? 'bg-amber-400 scale-125' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Single Card */}
              <div
                className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${currentSection.bgGradient} border-2 ${currentSection.borderColor} shadow-2xl relative`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-slate-950/90 text-amber-400 font-black text-sm rounded-xl border border-slate-700">
                    Kutaa #{currentSection.num}
                  </span>
                  <div className={`p-3 rounded-2xl bg-slate-950/80 border border-slate-700 ${currentSection.textColor}`}>
                    <currentSection.icon className="w-8 h-8" />
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                  {currentSection.num}. {currentSection.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mb-4">
                  {currentSection.subtitle}
                </p>

                {/* Sub-points with REQUIRED SMALL FONT and ITALIC styling */}
                <div className="space-y-2.5 mb-6 border-t border-slate-800/80 pt-4">
                  {currentSection.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs italic text-slate-100 leading-relaxed">
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Navigation inside carousel */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={selectedCardIdx === 0}
                    onClick={() => setSelectedCardIdx((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Dudduuba</span>
                  </button>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab(currentSection.id);
                        onClose();
                      }}
                      className={`py-2.5 px-6 rounded-xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${currentSection.buttonBg}`}
                    >
                      <span>Kutaa Kanatti Seeni</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={selectedCardIdx === APP_SECTIONS_DATA.length - 1}
                    onClick={() => setSelectedCardIdx((prev) => Math.min(APP_SECTIONS_DATA.length - 1, prev + 1))}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Fuuldura</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Postcard Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold">🎓 Student Registration System</span>
            <span>•</span>
            <span className="italic text-slate-300">Created by Kitesa Negasa Feyisa</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl shadow-md transition cursor-pointer text-xs uppercase tracking-wider"
          >
            Kutaa keessatti Darbaa
          </button>
        </div>

      </div>
    </div>
  );
};
