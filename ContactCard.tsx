import React from 'react';
import { Phone, Mail, Facebook, Send } from 'lucide-react';

export const ContactCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/40 to-blue-50/60 border-2 border-indigo-200 rounded-2xl p-6 shadow-md transition-all hover:shadow-xl hover:-translate-y-0.5">
      <h4 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
        <span className="text-2xl">📞</span> Contact Information | Odeeffannoo Qunnamtii
      </h4>
      <div className="space-y-2 text-slate-700 text-sm md:text-base">
        <p className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Phone & Telegram:</strong>{' '}
            <a href="tel:+251969184005" className="hover:underline text-indigo-700 font-semibold">+251969184005</a> /{' '}
            <a href="tel:+251910927936" className="hover:underline text-indigo-700 font-semibold">0910927936</a>
          </span>
          <Send className="w-4 h-4 text-blue-500 ml-1 inline" />
        </p>
        <p className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Gmail:</strong>{' '}
            <a href="mailto:kitesanegasa2012@gmail.com" className="hover:underline text-rose-700 font-semibold">
              kitesanegasa2012@gmail.com
            </a>
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Facebook:</strong>{' '}
            <span className="font-semibold text-blue-800">Kitesa Negasa</span>
          </span>
        </p>
      </div>
    </div>
  );
};
