/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Ticket, ShieldAlert, Sparkles, RefreshCw, Layers, Mail, Phone, MapPin, ShieldCheck, Globe, BookOpen } from 'lucide-react';
import { EventSettings, TicketCategory } from './types';
import EventLanding from './components/EventLanding';
import AdminHub from './components/AdminHub';
import UserGuideModal from './components/UserGuideModal';
import kataKitaLogo from './assets/images/kata_kita_logo_1784564549101.jpg';

export interface Theme {
  id: string;
  name: string;
  color: string;
  primary: string;
  hover: string;
  muted: string;
  mutedUltra: string;
  border: string;
  borderHover: string;
  borderHoverBold: string;
}

export const themes: Theme[] = [
  {
    id: 'sunset-gold',
    name: 'Sunset Gold',
    color: '#f59e0b',
    primary: '#f59e0b',
    hover: '#d97706',
    muted: 'rgba(245, 158, 11, 0.1)',
    mutedUltra: 'rgba(245, 158, 11, 0.05)',
    border: 'rgba(245, 158, 11, 0.2)',
    borderHover: 'rgba(245, 158, 11, 0.3)',
    borderHoverBold: 'rgba(245, 158, 11, 0.5)'
  },
  {
    id: 'emerald-teal',
    name: 'Emerald Teal',
    color: '#10b981',
    primary: '#10b981',
    hover: '#059669',
    muted: 'rgba(16, 185, 129, 0.1)',
    mutedUltra: 'rgba(16, 185, 129, 0.05)',
    border: 'rgba(16, 185, 129, 0.2)',
    borderHover: 'rgba(16, 185, 129, 0.3)',
    borderHoverBold: 'rgba(16, 185, 129, 0.5)'
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    color: '#6366f1',
    primary: '#6366f1',
    hover: '#4f46e5',
    muted: 'rgba(99, 102, 241, 0.1)',
    mutedUltra: 'rgba(99, 102, 241, 0.05)',
    border: 'rgba(99, 102, 241, 0.2)',
    borderHover: 'rgba(99, 102, 241, 0.3)',
    borderHoverBold: 'rgba(99, 102, 241, 0.5)'
  },
  {
    id: 'ocean-cyan',
    name: 'Ocean Cyan',
    color: '#06b6d4',
    primary: '#06b6d4',
    hover: '#0891b2',
    muted: 'rgba(6, 182, 212, 0.1)',
    mutedUltra: 'rgba(6, 182, 212, 0.05)',
    border: 'rgba(6, 182, 212, 0.2)',
    borderHover: 'rgba(6, 182, 212, 0.3)',
    borderHoverBold: 'rgba(6, 182, 212, 0.5)'
  },
  {
    id: 'crimson-rose',
    name: 'Crimson Rose',
    color: '#f43f5e',
    primary: '#f43f5e',
    hover: '#e11d48',
    muted: 'rgba(244, 63, 94, 0.1)',
    mutedUltra: 'rgba(244, 63, 94, 0.05)',
    border: 'rgba(244, 63, 94, 0.2)',
    borderHover: 'rgba(244, 63, 94, 0.3)',
    borderHoverBold: 'rgba(244, 63, 94, 0.5)'
  }
];

export default function App() {
  const [activePortal, setActivePortal] = useState<'public' | 'admin'>('public');
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('komunitas-kata-kita-theme');
    if (saved) {
      const parsed = themes.find(t => t.id === saved);
      if (parsed) return parsed;
    }
    return themes[0];
  });

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/event-settings');
      if (response.ok) {
        const data = await response.json();
        setEventSettings(data.eventSettings);
        setCategories(data.categories);
      } else {
        setError('Gagal memuat profil konfigurasi event dari server.');
      }
    } catch (err: any) {
      setError('Gagal menyambungkan ke backend server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Check URL parameters on mount
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const ticket = params.get('ticket');
    if (code) {
      setInitialSearchQuery(code);
      setActivePortal('public');
    } else if (ticket) {
      setInitialSearchQuery(ticket);
      setActivePortal('public');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('komunitas-kata-kita-theme', activeTheme.id);
  }, [activeTheme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-orange-100/70 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      
      <style>{`
        :root {
          --theme-primary: ${activeTheme.primary};
          --theme-hover: ${activeTheme.hover};
          --theme-muted: ${activeTheme.muted};
          --theme-muted-ultra: ${activeTheme.mutedUltra};
          --theme-border: ${activeTheme.border};
          --theme-border-hover: ${activeTheme.borderHover};
          --theme-border-hover-bold: ${activeTheme.borderHoverBold};
        }
        
        /* Dynamic Theme Overrides */
        .text-amber-500, .text-amber-400 {
          color: var(--theme-primary) !important;
        }
        .bg-amber-500 {
          background-color: var(--theme-primary) !important;
        }
        .bg-amber-500\\/10 {
          background-color: var(--theme-muted) !important;
        }
        .bg-amber-500\\/5 {
          background-color: var(--theme-muted-ultra) !important;
        }
        .border-amber-500 {
          border-color: var(--theme-primary) !important;
        }
        .border-amber-500\\/20 {
          border-color: var(--theme-border) !important;
        }
        .hover\\:bg-amber-600:hover {
          background-color: var(--theme-hover) !important;
        }
        .hover\\:text-amber-400:hover {
          color: var(--theme-primary) !important;
        }
        .hover\\:border-amber-500\\/30:hover {
          border-color: var(--theme-border-hover) !important;
        }
        .hover\\:border-amber-500\\/40:hover {
          border-color: var(--theme-border-hover-bold) !important;
        }
        .focus\\:border-amber-500:focus {
          border-color: var(--theme-primary) !important;
        }
        .focus\\:ring-amber-500:focus {
          --tw-ring-color: var(--theme-primary) !important;
        }
        .selection\\:bg-amber-500::selection {
          background-color: var(--theme-primary) !important;
        }
        .selection\\:text-slate-950::selection {
          color: #020617 !important;
        }
      `}</style>
      
      {/* 1. Master Application Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-50/95 via-sky-50/95 to-amber-50/95 backdrop-blur-md border-b-2 border-indigo-200/60 shadow-md print:hidden">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3.5">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActivePortal('public')}>
            <div className="bg-indigo-100/90 border-2 border-indigo-200 rounded-xl px-2.5 py-1 flex items-center shadow-sm">
              <img
                src={kataKitaLogo}
                alt="Komunitas Kata Kita Logo"
                className="h-8 w-auto object-contain max-w-[120px] mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight font-sans flex items-center gap-1.5">
                <span className="text-slate-900">Komunitas</span>
                <span className="text-red-700">Kata</span>
                <span className="text-amber-600">Kita</span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              </h1>
              <p className="text-[10px] font-mono tracking-wider font-extrabold flex items-center gap-1.5">
                <span className="text-slate-500">Sistem Tiket</span>
                <span className="text-red-700 font-black">Festival Monolog</span>
              </p>
            </div>
          </div>

          {/* Portal Switcher & Quick Helpers */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-center">
            
            <button
              onClick={() => setActivePortal('public')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all duration-300 cursor-pointer ${
                activePortal === 'public'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_25px_rgba(220,38,38,0.45)] hover:-translate-y-0.5'
                  : 'bg-white/80 backdrop-blur-sm text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 hover:shadow-sm'
              }`}
              id="btn-portal-pembeli"
            >
              Portal Penonton
            </button>
            <button
              onClick={() => setActivePortal('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all duration-300 cursor-pointer ${
                activePortal === 'admin'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:-translate-y-0.5'
                  : 'bg-white/80 backdrop-blur-sm text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 hover:shadow-sm'
              }`}
              id="btn-portal-panitia"
            >
              Portal Panitia
            </button>
            
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:-translate-y-0.5"
              title="Buka Pedoman & Petunjuk Penggunaan (Bisa Diunduh)"
              id="btn-pedoman-aplikasi"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline font-extrabold">Pedoman Aplikasi</span>
            </button>

            <button
              onClick={fetchConfig}
              className="p-1.5 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg shadow-sm hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-300 shrink-0 cursor-pointer hover:-translate-y-0.5"
              title="Refresh Data"
              id="btn-global-refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main App Content Coordinator */}
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-500 space-y-2.5">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium font-sans">Menginisialisasi Sistem Tiket Komunitas Kata Kita...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md bg-rose-950/30 border border-rose-500/20 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Inisialisasi Gagal</h3>
                <p className="text-rose-400/80 text-xs mt-1 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={fetchConfig}
                className="bg-gradient-to-r from-rose-600 to-red-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_25px_rgba(244,63,94,0.45)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : eventSettings && (
          <div className="flex-1 flex flex-col">
            {activePortal === 'public' ? (
              <div className="w-full px-4 md:px-8 py-8 flex-1">
                <EventLanding
                  eventSettings={eventSettings}
                  categories={categories}
                  onSuccessBooking={fetchConfig}
                  initialSearchQuery={initialSearchQuery}
                />
              </div>
            ) : (
              <AdminHub
                eventSettings={eventSettings}
                categories={categories}
                onRefreshAll={fetchConfig}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. Global Footer */}
      <footer className="bg-gradient-to-b from-indigo-50/70 via-sky-50/80 to-amber-100/60 border-t-2 border-indigo-200/60 pt-12 pb-8 text-xs text-slate-600 print:hidden mt-auto">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 text-left">
          
          {/* Column 1: Brand Info & Portal Navigation */}
          <div className="md:col-span-4 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 flex items-center shadow-sm">
                  <img
                    src={kataKitaLogo}
                    alt="Komunitas Kata Kita Logo"
                    className="h-6 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-extrabold text-slate-900 text-sm uppercase tracking-wider font-sans">
                  Kata Kita Group
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Akselerator seni peran, teater remaja, dan wadah kreativitas seni monolog pelajar se-Provinsi Lampung. Kami menghadirkan standar manajemen produksi event teater yang profesional, kredibel, dan inklusif.
              </p>
            </div>

            <div className="space-y-2.5 border-t border-slate-200 pt-4">
              <h4 className="text-slate-900 font-bold uppercase tracking-wider text-[10px] font-mono">
                Akses Portal
              </h4>
              <ul className="space-y-2 text-[11px] font-sans">
                <li>
                  <button
                    onClick={() => { setActivePortal('public'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <Ticket className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>Pesan Tiket & Portal Penonton</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setActivePortal('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>Validasi Tiket (Gerbang Panitia)</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Contact, Hotline & Links */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-slate-900 font-bold uppercase tracking-wider text-xs border-l-2 border-red-500 pl-2">
              Hubungi Sekretariat & Hotline
            </h4>
            <div className="space-y-3 text-[11px] text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Taman Budaya Lampung:</strong> Jalan Cut Nyak Dien No. 24, Palapa, Kecamatan Tanjung Karang Pusat, Kota Bandar Lampung.
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <a href="mailto:belajar.katakita@gmail.com" className="hover:text-red-600 transition-colors underline decoration-slate-300 hover:decoration-red-600">
                  belajar.katakita@gmail.com
                </a>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Hotline Resmi (WhatsApp):</span>
                <div className="flex flex-col gap-2 mt-1">
                  <a href="https://wa.me/6283125721380" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-[10px] w-fit shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="font-sans font-bold text-slate-700">Rere:</span> 0831-2572-1380
                  </a>
                  <a href="https://wa.me/6282159057672" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-400 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-[10px] w-fit shadow-sm">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="font-sans font-bold text-slate-700">EL:</span> 0821-5905-7672
                  </a>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Situs Resmi:</span>
                <div className="grid grid-cols-1 gap-1.5 mt-1">
                  <a href="https://katakita-group.biz.id/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-red-600 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="underline decoration-slate-300 hover:decoration-red-600">katakita-group.biz.id</span>
                  </a>
                  <a href="https://bagus-supriyadi.biz.id/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-red-600 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="underline decoration-slate-300 hover:decoration-red-600">bagus-supriyadi.biz.id</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Peta Lokasi Acara (Google Maps) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-slate-900 font-bold uppercase tracking-wider text-xs border-l-2 border-red-500 pl-2">
              Lokasi Taman Budaya
            </h4>
            <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 relative group shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.0059775567984!2d105.2478276!3d-5.416057899999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e40da5c5e3be683%3A0xb11517ab72630545!2sTaman%20Budaya%20Lampung!5e0!3m2!1sid!2sid!4v1784570757728!5m2!1sid!2sid" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Gunakan peta di atas untuk petunjuk arah langsung ke arena panggung monolog Taman Budaya Lampung.
            </p>
          </div>

        </div>

        {/* Subfooter */}
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3.5 text-[11px]">
          <p className="text-slate-500 font-sans text-center md:text-left">
            Sistem Tiket Online Festival Monolog Komunitas Kata Kita © 2026. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[10px]">
            <span className="hover:text-red-600 transition-colors">v2.1.0-Release</span>
            <span>•</span>
            <span className="hover:text-red-600 transition-colors">Taman Budaya Lampung</span>
          </div>
        </div>
      </footer>

      {/* Global Pedoman Application Modal */}
      <UserGuideModal 
        isOpen={isUserGuideOpen} 
        onClose={() => setIsUserGuideOpen(false)} 
      />

    </div>
  );
}
