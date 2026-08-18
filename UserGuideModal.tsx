import React, { useState } from 'react';
import {
  BookOpen,
  X,
  UserPlus,
  FileSpreadsheet,
  FileText,
  Building2,
  MapPin,
  Landmark,
  LayoutDashboard,
  CheckCircle2,
  Upload,
  Download,
  Send,
  HelpCircle,
  Search,
  Filter,
  Eye,
  School,
  ArrowRight,
  Target as TargetIcon,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: '1. RAGAA GALCHUU (Data Entry)',
      icon: UserPlus,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Sadarkaa M/Barumsaa',
      summary: 'Galmee Barattootaa Tokkoon Tokkoon Galchuu fi Karoora Qabachuu',
      details: [
        {
          label: 'Bakka Argamaa (Button Location):',
          text: 'Gubbaa Navbaar irratti TAB "Galmee Barattootaa" (UserPlus Icon) fi TAB "Karoora" (Target Icon) cuqaasi.',
        },
        {
          label: 'Tarkaanfii 1 - Galmee Barattootaa:',
          text: 'Formii banamu keessatti: Maqaa barataa, Saala (D/D), Umurii, Kutaa (Grade 1-8 / Kindergarten), fi Haala Barataa (Active, Transferred, Dropped out, Completed) galchi. Koodii barataa systemni ofumaan kenna.',
        },
        {
          label: 'Tarkaanfii 2 - Karoora (Grade Targets):',
          text: 'TAB "Karoora" keessatti karoora barattoota kutaa tokkoon tokkoon (Grades 1-8) B.B 2018 qabdan galchaa. Systemni raawwii karoora waliin walbira qabee % naaf hojjeta.',
        },
        {
          label: 'Butoonii Galmeessu:',
          text: 'Jalatti butoonii sammuda gurraacha/magariisa "Barataa Galmeessi / Save Student" jedhu cuqaasi. Ragaan battalatti olkawwama.',
        },
      ],
    },
    {
      num: 2,
      title: '2. UPLOAD GOCHUU (EMIS Upload)',
      icon: FileSpreadsheet,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Faayiloota Excel Uploading',
      summary: 'Faayiloota Excel Manneen Barnootaa irraa dhufan Wallitti Fiduu fi Systematti Olgachuu',
      details: [
        {
          label: 'Bakka Argamaa (Button Location):',
          text: 'Gubbaa Navbaar irratti TAB "EMIS Upload" (FileSpreadsheet Icon) cuqaasi.',
        },
        {
          label: 'Tarkaanfii 1 - Faayiloota Komputera Irraa Filachuu:',
          text: 'Iddoo "Drag & Drop ama Drop Excel files here" jedhutti cuqaasitii faayiloota Excel gabaasa manneen barnootaa (.xlsx / .xls) tokko ykn baay\'ee (fkn. M/B 30) filadhu.',
        },
        {
          label: 'Tarkaanfii 2 - Adda Baafannaa Otomaatikiisaa (Auto Recognition):',
          text: 'Systemni ofumaan Maqaa M/Barumsaa, Aanaa, Kutaa, fi Tab gabaasaa (Tab A - Tab I, Tab B, Tab C...) dubbisee adda baasa.',
        },
        {
          label: 'Tarkaanfii 3 - Sassaabuu fi Qindeessuu (Upload & Merge):',
          text: 'Butoonii magariisa "Upload & Merge Files" cuqaasi. Systemni otomaatikiin gabaasota M/B 30 walitti fidasi sadarkaa aanaatti qindeessa!',
        },
      ],
    },
    {
      num: 3,
      title: '3. KAROORA AANAA & MANNEEN BARNOOTAA GALCHUU',
      icon: TargetIcon,
      color: 'from-amber-500 to-emerald-600',
      badge: 'Target Settings',
      summary: 'Karoora Waliigala Aanaa fi Karoora Tokkoo Tokkoo Manneen Barnootaa Galchuu fi Gulaaluu',
      details: [
        {
          label: 'A. Karoora Waliigala Aanaa Galchuu:',
          text: '1. Gubbaa Navbaarii irratti TAB "Gabaasaa" (Reports) cuqaasitii "Tab A: Karoora Galchuu" filadhu YKN TAB "Aanaa" irratti Kaardii Magariisa "Karoora" cuqaasi.\n2. Kutaa tokkoon tokkoo (Kutaa 1 - 12) irratti karoora barattoota Dhiiraa fi Dhalaa galchaa save godhaa. Systemni ofumaan idaa\'ee Karoora Waliigala Aanaa (Total Woreda Target) sana heerega.',
        },
        {
          label: 'B. Karoora Manneen Barnootaa Tokkoon Tokkoo Galchuu:',
          text: '1. Gubbaa Navbaarii irratti TAB "Aanaa" (Sadarkaa Aanaa) cuqaasi.\n2. Jalatti kutaa "Bulchiinsa Yuunitii (Galmee, Gulaala & Haqa Yuunitii)" deemi.\n3. Formii "Galmee Yuunitii Haaraa" keessatti:\n   • Gosa Yuunitii: "Mana Barumsaa (School)" filadhu\n   • Maqaa Yuunitii: Maqaa M/B galchi\n   • Yuunitii Haadhoo: Aanaa keessan filadhu\n   • 🎯 Karoora (Target): Lakkoofsa karoora M/B sanaa galchi\n   • Butoonii "+ Galmeessi" cuqaasi.',
        },
        {
          label: 'C. Karoora M/Barumsaa Gulaaluu (Edit Target):',
          text: 'Tarree Yuunitiilee (Woreda & Schools List) keessatti M/B sana biratti Butoonii ambo/keelloo "Gulaali" cuqaasuun lakkoofsa karooraa jijjiiriitii "Kawwi" cuqaasi.',
        },
      ],
    },
    {
      num: 4,
      title: '4. GABAASA AANAA FI TOKKOO TOKKOO M/BARNOOTAA ILAALUU',
      icon: Eye,
      color: 'from-blue-600 to-indigo-700',
      badge: 'Reports & Filtering',
      summary: 'Gabaasa Sadarkaa Aanaa Waliigalaa fi Tokkoo Tokkoo Manneen Barnootaa Qorachuu',
      details: [
        {
          label: 'A. Gabaasa Waliigala Aanaa Ilaaluu:',
          text: '1. Gubbaa Navbaarii irratti TAB "Aanaa" ykn TAB "Gabaasaa" cuqaasi.\n2. Filter "Aanaa Filadhu" irratti Aanaa keessan ykn "Aanaa Hundumaa" filadhu.\n3. Tab A (Enrollment), Tab B (Age), Tab C (Dropout), Tab D (Special Needs), Tab E (Teachers) ilaali. Systemni idaatama manneen barnootaa aanaa hunda walitti qabee agarsiisa.',
        },
        {
          label: 'B. Gabaasa Tokkoo Tokkoo M/Barumsaa Ilaaluu:',
          text: '1. TAB "Gabaasaa" (Reports) cuqaasi.\n2. Gubbaa bitaatti Filter "Mana Barumsaa Filadhu" (Filter School) jedhu banuun M/B barbaaddan filadhu.\n3. Battalatti gabaasni Tab A - Tab I hundi M/Barumsaa sana qofatti calalamee mul\'ata.',
        },
        {
          label: 'C. Maxxansuu fi Export Gochuu:',
          text: 'Gabaasa M/B sanaa ykn Aanaa waliigalaa PDF teessisuuf ykn Print gochuuf Butoonii "Print / Save PDF" ykn "Export to Excel" cuqaasi.',
        },
      ],
    },
    {
      num: 4,
      title: '4. GABAASA ERGUU & EXPORT GOCHUU (Exporting)',
      icon: Download,
      color: 'from-purple-500 to-pink-600',
      badge: 'Excel, PDF & Print',
      summary: 'Gabaasota Sadarkaa Aanaatti Qinda\'an Gara Excel/PDF tiin Buusuu fi Erguu',
      details: [
        {
          label: 'Bakka Argamaa (Button Location):',
          text: 'Fuula "Gabaasa" (Reports) ykn Dashboordii "Aanaa" irratti Gubbaa mirgaatti Butoonota Export argatta.',
        },
        {
          label: 'Tarkaanfii 1 - Excel tiin Buusuu (Export to Excel):',
          text: 'Butoonii "Export to Excel / Download Excel" cuqaasitii gabaasa waliigalaa aanaa (.xlsx) komputera keetti kuufadhu.',
        },
        {
          label: 'Tarkaanfii 2 - PDF & Maxxansuu (Print / PDF):',
          text: 'Butoonii "Print / Save PDF" cuqaasuun fuula gabaasaa fi poostara sadarkaa aanaa maashinaan maxxansi ykn PDF teessisi.',
        },
        {
          label: 'Tarkaanfii 3 - Sadarkaa Ol-aanaatti Erguu:',
          text: 'Faayila Excel bu\'e sana xalayaa gabaasaa Aanaa waliin ergaa Godinaa ykn Biiroo Barnoota Oromiyaatifi ergi.',
        },
      ],
    },
    {
      num: 5,
      title: '5. CAASAA SADARKAA BOORDII & DASHBOARD',
      icon: Landmark,
      color: 'from-cyan-500 to-blue-600',
      badge: 'M/Barumsaa, Aanaa, Godina, Oromiyaa',
      summary: 'Haala Caasaa Sadarkaa 4n (Hierarchy) fi Butoonota Navbaarii',
      details: [
        {
          label: '1. Daashboordii (M/Barumsaa):',
          text: 'Gabaasaa fi lakkoofsa barattoota mana barumsaa tokkoo qofa (Enrolled, Boys, Girls, Age-appropriate) agarsiisa.',
        },
        {
          label: '2. Aanaa (Sadarkaa Aanaa):',
          text: 'Gabaasa manneen barnootaa aanaa keessa jiran hunda (fkn M/Barumsaa 30n) walitti qabee gabaasa waliigalaa aanaa ijaara.',
        },
        {
          label: '3. Godina (Sadarkaa Godinaa):',
          text: 'Gabaasa aanaalee godina keessa jiran waliigalaan qindeessa fi dorgommi/walbira qabiinsa aanaalee agarsiisa.',
        },
        {
          label: '4. Oromiyaa (Biiroo Barnoota Oromiyaa):',
          text: 'Odeeffannoo sadarkaa naannoo Oromiyaa fi Bu\'uura Boruu (Umurii 4-6) waliigalaa mul\'isa.',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 border-b border-indigo-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg border border-amber-300">
              <BookOpen className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Qajeelfama Fayyadamtootaa (Step-by-Step Guide)
              </h2>
              <p className="text-xs text-amber-300 font-medium">
                Akkaata Systema Galmee Barattootaa fi Gabaasa EMIS Sadarkaa Hundaatti Fayyadaman
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
            title="Cufi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="bg-slate-950/80 p-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCurrent = activeStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 shadow-md border border-amber-300 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>STEP {step.num}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {steps.map((step) => {
            if (step.num !== activeStep) return null;
            const Icon = step.icon;
            return (
              <div key={step.num} className="space-y-6 animate-fadeIn">
                {/* Step Banner */}
                <div className={`p-5 rounded-2xl bg-gradient-to-r ${step.color} text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/20`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-widest text-amber-200">
                        {step.badge}
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {step.title}
                      </h3>
                      <p className="text-xs text-white/90 font-medium">
                        {step.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-1 gap-4">
                  {step.details.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-800/70 border border-indigo-500/30 flex items-start gap-3.5 hover:border-indigo-500/60 transition">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/40 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-amber-300 block">
                          {item.label}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct Action Link */}
                <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Amma kallattiin iddoo kanatti deemuu ni dandeessa:</span>
                  </div>
                  <button
                    onClick={() => {
                      if (step.num === 1) onNavigateTab('students');
                      else if (step.num === 2) onNavigateTab('emis');
                      else if (step.num === 3) onNavigateTab('reports');
                      else if (step.num === 4) onNavigateTab('reports');
                      else if (step.num === 5) onNavigateTab('aanaa');
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer shrink-0"
                  >
                    <span>Fuula Kanatti Deemi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeStep === 1
                ? 'opacity-40 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 cursor-pointer'
            }`}
          >
            ← Step Duraa
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Tarkaanfii <span className="font-bold text-amber-300">{activeStep}</span> / {steps.length}
          </span>

          <button
            disabled={activeStep === steps.length}
            onClick={() => setActiveStep((prev) => Math.min(steps.length, prev + 1))}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeStep === steps.length
                ? 'opacity-40 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 font-black cursor-pointer'
            }`}
          >
            Step Itti Aanu →
          </button>
        </div>

      </div>
    </div>
  );
};
