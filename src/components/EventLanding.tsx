/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Clock, Ticket, CheckCircle, ChevronRight, Upload, 
  Search, ShieldCheck, CreditCard, User, AlertCircle, RefreshCw, FileText,
  Lock, Unlock, MessageSquare, ExternalLink, Share2, Users, GraduationCap, Mail, Phone
} from 'lucide-react';
import { TicketCategory, EventSettings, Booking, IndividualTicket } from '../types';
import TicketCard from './TicketCard';

interface EventLandingProps {
  eventSettings: EventSettings;
  categories: TicketCategory[];
  onSuccessBooking: () => void;
  initialSearchQuery?: string;
}

export default function EventLanding({ eventSettings, categories, onSuccessBooking, initialSearchQuery }: EventLandingProps) {
  // Navigation State
  const [view, setView] = useState<'landing' | 'booking' | 'status' | 'ticket'>('landing');
  
  // Active registration step
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Status check input & results
  const [statusQuery, setStatusQuery] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResults, setStatusResults] = useState<any[]>([]);
  const [statusError, setStatusError] = useState('');
  const [activeTicket, setActiveTicket] = useState<{ ticket: IndividualTicket; settings: EventSettings } | null>(null);

  // Ticket Secure Access States
  const [unlockedTickets, setUnlockedTickets] = useState<Record<string, boolean>>({});
  const [ticketPinInput, setTicketPinInput] = useState<Record<string, string>>({});
  const [ticketPinError, setTicketPinError] = useState<Record<string, string>>({});
  const [showingPinForm, setShowingPinForm] = useState<Record<string, boolean>>({});

  // STEP 1 Form State (Data Diri)
  const [fullname, setFullname] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [ticketNames, setTicketNames] = useState<string[]>(['']);

  // STEP 2 Form State (Metode Pembayaran)
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'offline'>('transfer');
  const [selectedCoordinatorIdx, setSelectedCoordinatorIdx] = useState<number>(0);
  const [receiptNumber, setReceiptNumber] = useState('');

  // STEP 3 Form State (Upload Proof)
  const [uploadProofBase64, setUploadProofBase64] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Completed booking code holder
  const [completedBookingCode, setCompletedBookingCode] = useState('');
  const [completedTickets, setCompletedTickets] = useState<IndividualTicket[]>([]);

  const currentCategory = categories.find(c => c.id === selectedCategoryId);

  // Handle Multi-Ticket Names sizing on change of count
  const handleTicketCountChange = (count: number) => {
    setTicketCount(count);
    const updatedNames = [...ticketNames];
    if (count > updatedNames.length) {
      // expand
      while (updatedNames.length < count) {
        updatedNames.push('');
      }
    } else {
      // shrink
      updatedNames.splice(count);
    }
    setTicketNames(updatedNames);
  };

  const handleTicketNameChange = (idx: number, val: string) => {
    const updated = [...ticketNames];
    updated[idx] = val;
    setTicketNames(updated);
  };

  // Convert uploaded image/pdf file to base64
  const handleFileChange = (file: File) => {
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran file maksimal adalah 5MB.');
      return;
    }

    // Validate extension
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Format file tidak didukung. Harap upload gambar (JPG, JPEG, PNG) atau PDF.');
      return;
    }

    setFormError('');
    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadProofBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Submits the whole form to the Express server
  const handleFormSubmit = async () => {
    setFormError('');
    setSubmittingBooking(true);

    try {
      const payload: any = {
        fullname,
        whatsapp,
        email,
        city,
        institution,
        ticketCount,
        categoryId: selectedCategoryId,
        paymentMethod,
        ticketNames
      };

      if (paymentMethod === 'transfer') {
        payload.paymentProof = uploadProofBase64;
        payload.bankDetails = {
          bankName: eventSettings.bankName,
          bankAccount: eventSettings.bankAccount,
          bankAccountName: eventSettings.bankAccountName
        };
      } else {
        const coordinator = eventSettings.coordinators[selectedCoordinatorIdx] || { name: 'Andi Wijaya', phone: '081234567890' };
        payload.offlineDetails = {
          coordinatorName: coordinator.name,
          coordinatorPhone: coordinator.phone,
          receiptNumber
        };
        payload.offlineProof = uploadProofBase64;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCompletedBookingCode(data.bookingCode);
        setBookingStep(5); // Go to Completed Screen
        onSuccessBooking(); // Update core tables in background

        // Fetch newly created tickets to show PIN codes immediately
        try {
          const checkRes = await fetch(`/api/bookings/check-status?query=${data.bookingCode}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.bookings && checkData.bookings[0]) {
              setCompletedTickets(checkData.bookings[0].tickets || []);
            }
          }
        } catch (e) {
          console.error('Gagal mengambil detail tiket baru:', e);
        }
      } else {
        setFormError(data.error || 'Terjadi kesalahan saat menyimpan pesanan.');
      }
    } catch (err: any) {
      setFormError('Gagal menyambungkan ke server: ' + err.message);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Handle checking ticket status
  const handleCheckStatusSubmit = async (e: React.FormEvent, customQuery?: string) => {
    e.preventDefault();
    const queryToUse = customQuery || statusQuery;
    if (!queryToUse.trim()) return;

    setCheckingStatus(true);
    setStatusError('');
    setStatusResults([]);

    try {
      const response = await fetch(`/api/bookings/check-status?query=${encodeURIComponent(queryToUse.trim())}`);
      const data = await response.json();

      if (response.ok && data.bookings) {
        setStatusResults(data.bookings);
      } else {
        setStatusError(data.error || 'Data pemesanan tidak ditemukan.');
      }
    } catch (err: any) {
      setStatusError('Koneksi terganggu: ' + err.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Handle URL deep-linking on public search
  useEffect(() => {
    if (initialSearchQuery) {
      setStatusQuery(initialSearchQuery);
      // Execute the search directly
      handleCheckStatusSubmit({ preventDefault: () => {} } as any, initialSearchQuery);
      setView('status');
    }
  }, [initialSearchQuery]);

  // Handle opening ticket with passcode security check
  const handleOpenTicket = (t: IndividualTicket, isSingleView: boolean) => {
    if (isSingleView || unlockedTickets[t.ticketNumber] || !t.accessCode) {
      setActiveTicket({ ticket: t, settings: eventSettings });
      setView('ticket');
    } else {
      // Toggle showing PIN entry form
      setShowingPinForm(prev => ({
        ...prev,
        [t.ticketNumber]: !prev[t.ticketNumber]
      }));
    }
  };

  const handleVerifyPin = (t: IndividualTicket) => {
    const input = (ticketPinInput[t.ticketNumber] || '').trim().toUpperCase();
    const actual = (t.accessCode || '').trim().toUpperCase();
    
    if (input === actual) {
      setUnlockedTickets(prev => ({ ...prev, [t.ticketNumber]: true }));
      setTicketPinError(prev => ({ ...prev, [t.ticketNumber]: '' }));
      // Open the ticket card directly
      setActiveTicket({ ticket: t, settings: eventSettings });
      setView('ticket');
    } else {
      setTicketPinError(prev => ({
        ...prev,
        [t.ticketNumber]: 'Kode Akses salah! Silakan periksa kembali.'
      }));
    }
  };

  const handleStartBooking = () => {
    // Pick first category as default
    if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
    // Reset wizard
    setBookingStep(1);
    setFullname('');
    setWhatsapp('');
    setEmail('');
    setCity('');
    setInstitution('');
    setTicketCount(1);
    setTicketNames(['']);
    setPaymentMethod('transfer');
    setUploadProofBase64('');
    setUploadFileName('');
    setReceiptNumber('');
    setFormError('');
    setView('booking');
  };

  return (
    <div className="w-full flex flex-col min-h-[80vh]" id="landing-component">
      
      {/* Dynamic E-Ticket Full Screen Viewer */}
      {view === 'ticket' && activeTicket && (
        <TicketCard 
          ticket={activeTicket.ticket} 
          eventSettings={activeTicket.settings} 
          onBack={() => setView('status')} 
        />
      )}

      {/* 1. PUBLIC LANDING PAGE */}
      {view === 'landing' && (
        <div className="space-y-12 pb-16">
          
          {/* Glassmorphic Hero Banner - Vibrant Bright Premium Neon Glass */}
          <section className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-100/90 via-sky-50 to-amber-100/80 border-2 border-indigo-200 py-16 px-6 md:px-12 text-center" id="hero-banner">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-3xl mx-auto space-y-6 relative z-10">
              {/* Dual Logo Display with divider */}
              <div className="flex items-center justify-center gap-5 mb-6 select-none">
                <img
                  src="https://katakita-group.biz.id/uploads/festival-monolog.png"
                  alt="Festival Monolog"
                  className="h-20 w-auto object-contain hover:scale-105 transition-all duration-300 drop-shadow-md"
                />
                <div className="w-px h-12 bg-slate-300" />
                <img
                  src="https://katakita-group.biz.id/uploads/komunitas-katakita.png"
                  alt="Komunitas Kata Kita"
                  className="h-16 w-auto object-contain hover:scale-105 transition-all duration-300 drop-shadow-md"
                />
              </div>

              <span className="inline-block bg-red-600/10 text-red-600 border border-red-200/30 text-xs uppercase tracking-widest px-3 py-1 rounded-full font-mono font-black">
                Pementasan Seni Monolog Lampung 2026
              </span>
              
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-500 to-blue-700 tracking-tight leading-none font-sans drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                {eventSettings.eventTitle}
              </h1>
              
              <p className="text-amber-600 font-extrabold tracking-wide text-sm md:text-base">
                {eventSettings.subtitle}
              </p>
              
              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium">
                {eventSettings.description}
              </p>

              <div className="flex items-center justify-center gap-2.5 bg-blue-100/60 border border-blue-200 text-blue-800 text-xs font-sans px-4 py-2.5 rounded-xl max-w-md mx-auto mt-4 shadow-sm">
                <GraduationCap className="w-5 h-5 shrink-0 text-blue-600" />
                <span className="text-left leading-normal font-semibold">
                  <strong className="text-red-600">Pemberitahuan Pelajar:</strong> Festival ini didominasi oleh pelajar-pelajar sekolah dari seluruh penjuru se-Provinsi Lampung!
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                  onClick={handleStartBooking}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-extrabold px-8 py-3.5 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_25px_rgba(220,38,38,0.45)] transform hover:-translate-y-0.5 active:scale-95 transition-all duration-300 cursor-pointer text-base"
                  id="btn-beli-tiket"
                >
                  <Ticket className="w-5 h-5 shrink-0" />
                  <span>BELI TIKET ONLINE</span>
                </button>
                <button
                  onClick={() => {
                    setStatusQuery('');
                    setStatusResults([]);
                    setStatusError('');
                    setView('status');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold px-8 py-3.5 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.45)] transform hover:-translate-y-0.5 active:scale-95 transition-all duration-300 cursor-pointer text-base"
                  id="btn-cek-tiket"
                >
                  <Search className="w-5 h-5 shrink-0 text-white" />
                  <span>CEK STATUS TIKET</span>
                </button>
              </div>
            </div>
          </section>

          {/* Quick Schedule, Map and pricing section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6" id="event-details-grid">
            
            {/* 1. Schedule Card - Red-themed light gradient */}
            <div className="bg-gradient-to-br from-red-100/90 to-red-50/70 border-2 border-red-200 p-6 rounded-2xl flex gap-4 items-start relative shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
              <div className="p-3 bg-red-600/10 text-red-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-red-600 text-xs font-sans uppercase tracking-wider">Jadwal Acara</h3>
                <p className="text-slate-800 text-sm font-extrabold">{eventSettings.date}</p>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{eventSettings.time}</span>
                </div>
              </div>
            </div>

            {/* 2. Location Card - School-Blue themed light gradient */}
            <div className="bg-gradient-to-br from-blue-100/90 to-blue-50/70 border-2 border-blue-200 p-6 rounded-2xl flex gap-4 items-start relative shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group md:col-span-2">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
              <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-blue-700 text-xs font-sans uppercase tracking-wider">Lokasi Pementasan</h3>
                <p className="text-slate-800 text-sm font-extrabold">Taman Budaya Lampung</p>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">{eventSettings.location}</p>
              </div>
            </div>
          </section>

          {/* Category Ticket Pricing List */}
          <section className="space-y-6" id="pricing-bento">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-500 to-blue-700 font-sans uppercase">Kategori & Harga Tiket</h2>
              <p className="text-slate-500 text-xs font-semibold">Pilihlah kursi pementasan terbaik untuk menyaksikan pertunjukan eksklusif Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className={`border-2 hover:border-amber-500 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${
                    cat.id === 'cat-pelajar' 
                      ? 'bg-gradient-to-br from-red-100/90 via-red-50 to-amber-50/45 border-red-300' 
                      : 'bg-gradient-to-br from-sky-100/90 via-blue-50 to-indigo-50/45 border-blue-300'
                  }`}
                  id={`pricing-${cat.id}`}
                >
                  {cat.id === 'cat-pelajar' ? (
                    <div className="absolute top-4 right-4 bg-red-100 text-red-700 border border-red-200/50 text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Pelajar / Mahasiswa</span>
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 border border-blue-200/50 text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Umum / Praktisi</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">Kategori Tiket</p>
                    <div>
                      <h3 className={`text-xl font-extrabold tracking-tight transition-colors ${
                        cat.id === 'cat-pelajar' ? 'text-red-600 group-hover:text-red-700' : 'text-blue-700 group-hover:text-blue-800'
                      }`}>
                        {cat.name.split(' (')[0]}
                      </h3>
                      {cat.name.includes('(') && (
                        <p className="text-xs text-amber-600 font-mono mt-1 font-extrabold tracking-wide">
                          {cat.name.split('(')[1].replace(')', '')}
                        </p>
                      )}
                    </div>
                    
                    <div className="py-2">
                      <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                        Rp {cat.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-semibold leading-relaxed min-h-[60px]">
                      {cat.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-5 mt-6 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold font-sans">Kapasitas Kursi:</span>
                    <span className="font-mono text-slate-800 font-extrabold bg-white px-3 py-1 border border-slate-200 rounded-lg shadow-sm">
                      {cat.quota - cat.sold} / {cat.quota} Kursi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Guidelines Section - Golden Amber light gradient */}
          <section className="bg-gradient-to-br from-amber-100 via-amber-50/90 to-orange-50/65 border-2 border-amber-300 p-8 rounded-2xl space-y-4 shadow-lg" id="festival-instructions">
            <h3 className="text-base font-black text-amber-600 uppercase tracking-wider font-sans border-b border-amber-200 pb-2">
              Alur Pembelian E-Ticket & Registrasi Gate:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-xs text-slate-700 font-semibold">
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-white hover:shadow-sm transition duration-300">
                <p className="font-mono text-red-600 font-extrabold text-lg">01. Isi Biodata</p>
                <p className="text-slate-500 leading-relaxed font-semibold">Pilih kategori kursi dan isi nama lengkap beserta data kontak untuk pendaftaran e-ticket.</p>
              </div>
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-white hover:shadow-sm transition duration-300">
                <p className="font-mono text-amber-500 font-extrabold text-lg">02. Pembayaran</p>
                <p className="text-slate-500 leading-relaxed font-semibold">Lakukan transfer ke rekening resmi panitia Mandiri atau lapor lunas kepada koordinator offline tiket.</p>
              </div>
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-white hover:shadow-sm transition duration-300">
                <p className="font-mono text-blue-600 font-extrabold text-lg">03. Upload Bukti</p>
                <p className="text-slate-500 leading-relaxed font-semibold">Unggah foto struk transfer ATM atau kwitansi offline Anda ke dalam sistem sebagai bukti otentik.</p>
              </div>
              <div className="space-y-1.5 p-3 rounded-xl hover:bg-white hover:shadow-sm transition duration-300">
                <p className="font-mono text-emerald-600 font-extrabold text-lg">04. Gate Check-In</p>
                <p className="text-slate-500 leading-relaxed font-semibold">Panitia memverifikasi pesanan Anda. Unduh E-Ticket digital dan tunjukkan QR Code untuk dipindai di pintu masuk.</p>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* 2. DYNAMIC REGISTRATION WIZARD (FORM PEMBELIAN) */}
      {view === 'booking' && (
        <div className="w-full max-w-2xl mx-auto py-8 px-4 flex-1">
          
          {/* Stepper Header */}
          <div className="mb-8 flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-200 pb-4">
            <span className={bookingStep >= 1 ? 'text-red-600 font-extrabold' : ''}>01. Data Diri</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={bookingStep >= 2 ? 'text-amber-500 font-extrabold' : ''}>02. Pembayaran</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={bookingStep >= 3 ? 'text-blue-600 font-extrabold' : ''}>03. Upload Bukti</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={bookingStep >= 4 ? 'text-red-600 font-extrabold' : ''}>04. Konfirmasi</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className={bookingStep >= 5 ? 'text-emerald-600 font-extrabold' : ''}>05. Selesai</span>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/95 via-sky-50/95 to-amber-50/95 border-2 border-indigo-200 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden" id="booking-wizard-card">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600" />

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-xs mb-6 flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: DATA DIRI */}
            {bookingStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Masukkan Identitas Lengkap Anda</h3>
                  <p className="text-slate-500 text-xs font-semibold">Informasi tiket akan dikirimkan langsung ke Kontak WhatsApp dan Email di bawah.</p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <div>
                    <label className="block text-slate-600 mb-1.5 font-bold">Nama Lengkap Pemesan (Sesuai KTP/SIM/Paspor)</label>
                    <input
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 mb-1.5 font-bold">Nomor WhatsApp / HP</label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1.5 font-bold">Alamat Email Aktif</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Contoh: nama@gmail.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 mb-1.5 font-bold">Asal Kota / Kabupaten</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Contoh: Bandar Lampung"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1.5 font-bold">Instansi / Sekolah / Kampus (Opsional)</label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="Contoh: Universitas Lampung"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 border-t border-slate-100 pt-4 mt-2">
                    <div className="sm:col-span-8">
                      <label className="block text-slate-600 mb-1.5 font-bold">Pilih Kategori Kursi Tiket</label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-semibold"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name.split(' (')[0]} - Rp {c.price.toLocaleString('id-ID')} ({c.quota - c.sold} Kursi Tersisa)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-slate-600 mb-1.5 font-bold">Jumlah Pembelian</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        required
                        value={ticketCount}
                        onChange={(e) => handleTicketCountChange(Math.max(1, parseInt(e.target.value, 10)))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-center font-mono font-extrabold focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Multi Owner Input Names */}
                  <div className="space-y-3.5 bg-indigo-50/80 p-4 rounded-xl border-2 border-indigo-150 mt-2 shadow-sm">
                    <p className="text-slate-700 font-extrabold font-sans">Nama Masing-Masing Pemilik Tiket Digital:</p>
                    {ticketNames.map((name, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[10px] text-slate-500 font-mono font-bold">Tiket #{idx + 1} Pemilik Nama</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => handleTicketNameChange(idx, e.target.value)}
                          placeholder={`Nama Pemilik Tiket #${idx + 1}`}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    disabled={!fullname || !whatsapp || !email || !city || ticketNames.some(n => !n.trim())}
                    onClick={() => setBookingStep(2)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl border border-red-500/20 shadow-[0_0_12px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-xs"
                    id="btn-step1-next"
                  >
                    <span>Lanjutkan Pembayaran</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: METODE PEMBAYARAN */}
            {bookingStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Pilih Metode Pembayaran</h3>
                  <p className="text-slate-500 text-xs font-semibold">Pilihlah salah satu cara pelunasan tiket resmi di bawah ini.</p>
                </div>

                {/* Toggle Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-4 rounded-xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'bg-gradient-to-br from-amber-500/15 to-red-500/10 border-amber-500 text-amber-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:shadow-md'
                    }`}
                    id="btn-pay-transfer"
                  >
                    <CreditCard className="w-6 h-6 text-amber-500" />
                    <span className="text-xs">Transfer Bank (Mandiri)</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('offline')}
                    className={`p-4 rounded-xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === 'offline'
                        ? 'bg-gradient-to-br from-amber-500/15 to-red-500/10 border-amber-500 text-amber-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:shadow-md'
                    }`}
                    id="btn-pay-offline"
                  >
                    <User className="w-6 h-6 text-amber-500" />
                    <span className="text-xs">Titip Offline (Kwitansi)</span>
                  </button>
                </div>

                {/* Method instructions */}
                <div className="bg-amber-50/85 p-5 rounded-xl border-2 border-amber-200 space-y-4 text-xs text-slate-700">
                  {paymentMethod === 'transfer' ? (
                    <div className="space-y-3">
                      <p className="font-extrabold text-slate-900 font-sans text-xs">Instruksi Transfer Bank Mandiri:</p>
                      <div className="p-3.5 bg-white rounded-lg border-2 border-amber-200 font-mono text-[11px] text-slate-700 space-y-1.5 shadow-sm">
                        <p>Bank Penerima: <strong className="text-slate-900">{eventSettings.bankName}</strong></p>
                        <p>No. Rekening: <strong className="text-red-600 text-sm font-black">{eventSettings.bankAccount}</strong></p>
                        <p>Atas Nama: <strong className="text-slate-900">{eventSettings.bankAccountName}</strong></p>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        <p>1. Silakan lakukan transfer sebesar nominal tagihan Anda.</p>
                        <p>2. Simpan struk cetak ATM, SMS banking, atau tangkapan layar m-banking Anda untuk di-upload di langkah berikutnya.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="font-extrabold text-slate-900 font-sans text-xs">Instruksi Pembayaran Offline Titip Panitia:</p>
                      
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">Pilih Koordinator Penjualan Tiket</label>
                        <select
                          value={selectedCoordinatorIdx}
                          onChange={(e) => setSelectedCoordinatorIdx(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 font-bold rounded-lg focus:outline-none"
                        >
                          {eventSettings.coordinators.map((c, idx) => (
                            <option key={idx} value={idx}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400 font-mono font-bold">No. WA Koordinator</p>
                          <p className="mt-1">
                            <a
                              href={`https://wa.me/${(eventSettings.coordinators[selectedCoordinatorIdx]?.phone || '').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 transition-colors bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-sm"
                            >
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              {eventSettings.coordinators[selectedCoordinatorIdx]?.phone}
                            </a>
                          </p>
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1 font-bold">Nomor Kwitansi Lunas</label>
                          <input
                            type="text"
                            required
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                            placeholder="Contoh: KW-10982"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Harap minta bukti kwitansi kertas resmi berstempel dari koordinator offline di atas, dan isikan nomor kwitansi lunas yang tertera.
                      </p>
                    </div>
                  )}
                </div>

                {/* Back / Next Row */}
                <div className="flex justify-between pt-4 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setBookingStep(1)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg hover:shadow-sm transition-all duration-300 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    disabled={paymentMethod === 'offline' && !receiptNumber.trim()}
                    onClick={() => setBookingStep(3)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl border border-red-500/20 shadow-[0_0_12px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    id="btn-step2-next"
                  >
                    <span>Lanjutkan Upload Bukti</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: UPLOAD BUKTI */}
            {bookingStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Unggah Bukti Transaksi</h3>
                  <p className="text-slate-500 text-xs font-semibold">Unggah gambar bukti transfer atau bukti kwitansi fisik Anda untuk divalidasi.</p>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center min-h-[200px] cursor-pointer ${isDragOver ? 'border-amber-500 bg-amber-500/5' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                >
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  
                  {uploadFileName ? (
                    <div className="space-y-2">
                      <p className="text-slate-900 text-sm font-extrabold">{uploadFileName}</p>
                      <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">Berhasil Dipilih</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadProofBase64('');
                          setUploadFileName('');
                        }}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-slate-800 text-sm font-extrabold">Tarik & Lepas File di Sini</p>
                      <p className="text-slate-500 text-xs font-semibold">Atau klik untuk memilih file dari galeri/penyimpanan.</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Dukungan: JPG, JPEG, PNG, atau PDF (Max 5MB)</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                  />
                </div>

                {/* Testing helper mock proof if needed */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setUploadProofBase64('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
                      setUploadFileName('Struk_Pembayaran_Mock.png');
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 underline font-mono font-bold"
                  >
                    (Gunakan File Simulasi Cepat untuk Testing)
                  </button>
                </div>

                {/* Back / Next Row */}
                <div className="flex justify-between pt-4 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setBookingStep(2)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg hover:shadow-sm transition-all duration-300 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    disabled={!uploadProofBase64}
                    onClick={() => setBookingStep(4)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl border border-red-500/20 shadow-[0_0_12px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    id="btn-step3-next"
                  >
                    <span>Lanjutkan Konfirmasi</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW DATA */}
            {bookingStep === 4 && currentCategory && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-900">Review & Ajukan Pendaftaran</h3>
                  <p className="text-slate-500 text-xs font-semibold">Periksa kembali data Anda sebelum menyerahkan transaksi.</p>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  {/* Summary grid */}
                  <div className="bg-indigo-50/80 p-4 rounded-xl border-2 border-indigo-200 grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Nama Pemesan</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{fullname}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Kontak WhatsApp</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{whatsapp}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Email</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">{email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Kota & Instansi</p>
                      <p className="font-bold text-slate-800 mt-0.5">{city} • {institution || 'Umum'}</p>
                    </div>
                    <div className="col-span-2 border-t border-slate-200 pt-2 mt-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Kategori Kursi & Lembar</p>
                      <p className="font-black text-red-600 mt-0.5 text-sm">{currentCategory.name.split(' (')[0]} • {ticketCount} Lembar</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-1">Masing-Masing Pemilik Tiket:</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 font-mono text-[11px] font-semibold">
                        {ticketNames.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-amber-100/90 p-4 rounded-xl border-2 border-amber-300 text-xs space-y-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Harga Satuan ({currentCategory.name.split(' (')[0]}):</span>
                      <span className="font-mono">Rp {currentCategory.price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold">
                      <span>Kuantitas:</span>
                      <span className="font-mono font-extrabold text-slate-900">{ticketCount}x</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-amber-200 pt-2 text-sm text-slate-900 font-black">
                      <span className="text-red-600 uppercase tracking-wider font-sans text-xs">Total Pembayaran:</span>
                      <span className="font-mono text-base text-red-600 font-black">Rp {(currentCategory.price * ticketCount).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Back / Submit */}
                <div className="flex justify-between pt-4 border-t border-slate-100 text-xs">
                  <button
                    disabled={submittingBooking}
                    onClick={() => setBookingStep(3)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg hover:shadow-sm transition-all duration-300 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    disabled={submittingBooking}
                    onClick={handleFormSubmit}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 disabled:opacity-50 text-white font-black px-7 py-3 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_25px_rgba(220,38,38,0.45)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    id="btn-submit-booking-form"
                  >
                    {submittingBooking ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengajukan Form...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Kirim & Ajukan Verifikasi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: COMPLETED FORM SUCCESS */}
            {bookingStep === 5 && (
              <div className="text-center py-8 space-y-6" id="booking-completed-step">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 font-sans">Terima Kasih!</h3>
                  <p className="text-slate-700 text-sm font-bold">Pembayaran Anda sedang kami verifikasi.</p>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed font-semibold">
                    Proses peninjauan manual oleh panitia Komunitas Kata Kita memakan waktu maksimal 1x24 jam. Kami juga mengirimkan detail ke email Anda.
                  </p>
                </div>

                {/* Highlighted Booking Code */}
                <div className="flex flex-col items-center gap-3 justify-center">
                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 inline-block font-mono shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Simpan Kode Booking Anda</p>
                    <p className="text-2xl font-black text-red-600 tracking-widest mt-1">
                      {completedBookingCode}
                    </p>
                  </div>
                </div>

                {/* Newly generated tickets & PIN access codes */}
                {completedTickets && completedTickets.length > 0 && (
                  <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-3 shadow-md">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-900 font-sans uppercase tracking-wider text-red-600">Kode Akses Keamanan E-Ticket (PIN)</h4>
                      <p className="text-slate-500 text-[10px] mt-0.5 leading-normal font-sans font-semibold">
                        Catat atau salin kode PIN di bawah ini. Anda memerlukan PIN ini untuk membuka masing-masing E-Ticket setelah disetujui oleh panitia.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {completedTickets.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-mono">
                          <div>
                            <p className="font-sans font-black text-slate-900 leading-tight">{t.ownerName}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 font-bold">{t.ticketNumber}</p>
                          </div>
                          <div className="bg-white px-2.5 py-1 rounded border border-slate-200 text-emerald-600 font-extrabold select-all shadow-sm" title="Klik ganda untuk menyalin PIN">
                            PIN: {t.accessCode}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simulated WhatsApp Notification Box */}
                <div className="max-w-md mx-auto bg-[#0b141a] border border-[#202c33] rounded-2xl p-4.5 text-left space-y-3.5 shadow-xl relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#25d366]/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-center border-b border-[#202c33] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-[#25d366] rounded-full animate-ping" />
                      <span className="text-[10px] text-[#25d366] font-mono font-bold tracking-wider uppercase">
                        WhatsApp Gateway Simulator
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">Terkirim ke {whatsapp}</span>
                  </div>

                  <div className="space-y-1 bg-[#121b22] border border-[#222d34] p-3.5 rounded-xl text-xs font-sans text-slate-200 relative">
                    <p className="font-bold text-[#25d366] text-[10px] uppercase font-mono mb-1">Pesan Notifikasi Otomatis:</p>
                    <div className="space-y-1 font-mono text-[11px] leading-relaxed select-all">
                      <p className="text-slate-400 font-sans italic text-[10px] mb-2">"Sistem: Halo *{fullname}*, pendaftaran Anda berhasil diajukan!</p>
                      <p>Kode Booking Anda: <strong className="text-amber-400">{completedBookingCode}</strong></p>
                      <p>Kategori: {currentCategory ? currentCategory.name : 'Festival'}</p>
                      <p>Jumlah: {ticketCount} Lembar</p>
                      <p>Lacak status pembayaran & unduh E-Ticket di:</p>
                      <p className="text-blue-400 break-all">{window.location.origin + window.location.pathname}?code={completedBookingCode}</p>
                      <p className="text-slate-400 font-sans italic text-[10px] mt-2">Simpan kode untuk di-cek setelah diverifikasi panitia."</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${whatsapp.replace(/\D/g, '').startsWith('0') ? '62' + whatsapp.replace(/\D/g, '').substring(1) : whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(
                        `*KONFIRMASI PENDAFTARAN FESTIVAL MONOLOG*\n\nHalo *${fullname}*,\nPendaftaran tiket Anda telah berhasil diajukan!\n\nKode Booking: *${completedBookingCode}*\nKategori: *${currentCategory ? currentCategory.name : ''}*\nJumlah: *${ticketCount}* lembar\n\nLacak Status & Unduh E-Ticket Anda di tautan resmi ini:\n${window.location.origin + window.location.pathname}?code=${completedBookingCode}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#25d366] hover:bg-[#20ba5a] text-slate-950 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer text-center"
                      id="btn-whatsapp-send"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>KIRIM KE WHATSAPP SAYA</span>
                    </a>
                  </div>
                  
                  <p className="text-[9px] text-slate-400 text-center leading-normal">
                    Klik tombol di atas untuk membuka aplikasi WhatsApp dan menyimpan salinan digital Kode Booking langsung di chat pribadi Anda.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 max-w-sm mx-auto flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setStatusQuery(completedBookingCode);
                      handleCheckStatusSubmit({ preventDefault: () => {} } as any, completedBookingCode);
                      setView('status');
                    }}
                    className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-extrabold py-2.5 rounded-xl text-xs border border-red-500/20 shadow-[0_0_12px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                    id="btn-complete-check"
                  >
                    Langsung Lacak Status Tiket
                  </button>
                  <button
                    onClick={() => setView('landing')}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 3. CHECK STATUS TIKET SECTION */}
      {view === 'status' && (
        <div className="w-full max-w-2xl mx-auto py-8 px-4 flex-1 space-y-6" id="status-checker-view">
          
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors duration-200 cursor-pointer"
          >
            ← Kembali ke Beranda
          </button>

          <div className="bg-gradient-to-br from-indigo-50/95 via-sky-50/95 to-amber-50/95 border-2 border-indigo-200 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 font-sans mb-1.5">Lacak Status & Unduh E-Ticket</h3>
            <p className="text-slate-500 text-xs mb-6 font-semibold">Masukkan Kode Booking 6 karakter atau Nomor WhatsApp yang didaftarkan.</p>

            <form onSubmit={handleCheckStatusSubmit} className="flex gap-2">
              <input
                type="text"
                required
                value={statusQuery}
                onChange={(e) => setStatusQuery(e.target.value)}
                placeholder="Contoh: A8D92F atau 0812XXXXXXXX"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono text-sm uppercase transition"
              />
              <button
                type="submit"
                disabled={checkingStatus || !statusQuery.trim()}
                className="bg-gradient-to-r from-red-600 to-amber-500 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl border border-red-500/20 shadow-[0_0_12px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 transition-all duration-300 text-xs flex items-center gap-2 cursor-pointer"
                id="btn-find-booking"
              >
                {checkingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Lacak</span>
              </button>
            </form>

            {statusError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-xl flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            {/* Results Display */}
            {statusResults.length > 0 && (
              <div className="mt-8 space-y-5 border-t border-slate-200 pt-6">
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-bold">
                  Hasil Pencarian Pemesanan ({statusResults.length})
                </p>

                {statusResults.map((b: any) => {
                  const cat = categories.find(c => c.id === b.categoryId);
                  return (
                    <div 
                      key={b.id} 
                      className="bg-white/95 p-5 rounded-2xl border-2 border-indigo-200 space-y-4 shadow-md"
                      id={`booking-result-${b.id}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-mono text-red-600 font-black text-sm tracking-wider">{b.id}</p>
                          <p className="font-black text-slate-900 text-base mt-0.5">{b.fullname}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{cat?.name.split(' (')[0] || b.categoryId} • {b.ticketCount} Lembar</p>
                        </div>

                        {/* Status Label */}
                        <div>
                          {b.status === 'Lunas' && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200 shadow-sm">
                              Lunas / Disetujui
                            </span>
                          )}
                          {b.status === 'Menunggu Verifikasi' && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black border border-blue-200 shadow-sm">
                              Menunggu Verifikasi
                            </span>
                          )}
                          {b.status === 'Ditolak' && (
                            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-black border border-rose-200 shadow-sm">
                              Ditolak / Gagal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Note Wording */}
                      <div className="text-xs text-slate-700 leading-relaxed pt-2 border-t border-slate-200">
                        {b.status === 'Lunas' && (
                          <div className="space-y-4 text-xs">
                            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-black text-emerald-600">Pembayaran Terverifikasi & Lunas!</p>
                                <p className="text-slate-500 leading-relaxed text-[11px] font-semibold">
                                  Guna menjaga keamanan tiket digital dan mencegah duplikasi, masing-masing penonton wajib membuka E-Ticket menggunakan **Kode Akses E-Ticket** pribadinya yang didapatkan dari pembeli utama.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {b.tickets.map((t: IndividualTicket, i: number) => {
                                const isUnlocked = b.isSingleTicketView || unlockedTickets[t.ticketNumber] || !t.accessCode;
                                const isFormOpen = showingPinForm[t.ticketNumber];
                                const errorMsg = ticketPinError[t.ticketNumber];
                                
                                return (
                                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 transition-all hover:shadow-md">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-black text-slate-900 text-sm">{t.ownerName}</p>
                                          {isUnlocked ? (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black border border-emerald-200 font-mono">
                                              <Unlock className="w-2.5 h-2.5" /> Terbuka
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-black border border-amber-200 font-mono">
                                              <Lock className="w-2.5 h-2.5" /> Keamanan Aktif
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1 font-mono font-bold">{t.ticketNumber} • {t.categoryName}</p>
                                      </div>

                                      <div>
                                        {isUnlocked ? (
                                          <button
                                            onClick={() => {
                                              setActiveTicket({ ticket: t, settings: eventSettings });
                                              setView('ticket');
                                            }}
                                            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black px-4 py-2 rounded-xl font-sans text-xs border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                                            id={`btn-download-${t.ticketNumber}`}
                                          >
                                            <FileText className="w-4 h-4" />
                                            BUKA E-TIKET RESMI
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleOpenTicket(t, false)}
                                            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-500 text-white font-black px-4 py-2 rounded-xl font-sans text-xs border border-red-500/20 shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer animate-pulse"
                                            id={`btn-unlock-prompt-${t.ticketNumber}`}
                                          >
                                            <Lock className="w-4 h-4" />
                                            BUKA DENGAN KODE
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Input Form for Passcode */}
                                    {!isUnlocked && isFormOpen && (
                                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-3 mt-1.5">
                                        <div>
                                          <label className="block text-slate-700 text-[10px] uppercase tracking-wider font-mono font-black mb-1">
                                            Masukkan Kode Akses E-Ticket ({t.ownerName})
                                          </label>
                                          <p className="text-slate-500 text-[10px] mb-2 leading-normal font-semibold">
                                            Kode berformat <strong className="text-slate-700 font-mono">TKT-XXXXX</strong>. Kode dikirim ke WA/Email pembeli utama.
                                          </p>
                                          
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              placeholder="Contoh: TKT-X8A2K"
                                              value={ticketPinInput[t.ticketNumber] || ''}
                                              onChange={(e) => setTicketPinInput(prev => ({ ...prev, [t.ticketNumber]: e.target.value }))}
                                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded font-mono text-xs text-slate-800 uppercase placeholder-slate-400 focus:outline-none focus:border-amber-500"
                                            />
                                            <button
                                              onClick={() => handleVerifyPin(t)}
                                              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black px-4 py-1.5 rounded-lg text-xs border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                                            >
                                              Buka Tiket
                                            </button>
                                          </div>
                                        </div>

                                        {errorMsg && (
                                          <p className="text-rose-600 font-bold text-[10px] flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            {errorMsg}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {b.status === 'Menunggu Verifikasi' && (
                          <p className="text-blue-700 italic font-bold">
                            Dokumen bukti transaksi Anda sedang dalam review panitia. Biasanya memakan waktu maksimal 1x24 jam sejak form dikirimkan. Harap cek kembali halaman ini berkala.
                          </p>
                        )}

                        {b.status === 'Ditolak' && (
                          <div className="space-y-2 text-rose-600">
                            <p className="font-black">VERIFIKASI DITANGGUHKAN:</p>
                            <p className="text-slate-800 font-semibold italic bg-rose-50 p-3 rounded-lg border border-rose-100">
                              "{b.rejectReason || 'Bukti pembayaran tidak sah atau tidak valid.'}"
                            </p>
                            <p className="text-slate-500 text-[11px] leading-normal pt-1 font-semibold">
                              Silakan lakukan pemesanan ulang secara benar, atau hubungi koordinator panitia jika ini adalah kesalahan.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
