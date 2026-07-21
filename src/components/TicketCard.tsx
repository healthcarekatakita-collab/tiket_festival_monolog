/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Ticket, 
  Download, 
  Printer, 
  ArrowLeft, 
  Landmark, 
  RefreshCw, 
  Eye, 
  X,
  AlertCircle
} from 'lucide-react';
import { IndividualTicket, EventSettings } from '../types';

// Import local assets to eliminate cross-origin constraints and load failures
import festivalMonologLogo from '../assets/images/festival_monolog_logo_1784564565784.jpg';
import kataKitaLogo from '../assets/images/kata_kita_logo_1784564549101.jpg';

interface TicketCardProps {
  ticket: IndividualTicket;
  eventSettings: EventSettings;
  onBack?: () => void;
}

export default function TicketCard({ ticket, eventSettings, onBack }: TicketCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [fallbackImageUri, setFallbackImageUri] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'png' | 'pdf'>('png');
  const [festivalLogoBase64, setFestivalLogoBase64] = useState<string>('');
  const [kataKitaLogoBase64, setKataKitaLogoBase64] = useState<string>('');
  const ticketRef = useRef<HTMLDivElement>(null);

  // Helper to convert dynamic local asset URL to safe base64 to completely eliminate CORS and iframe relative path issues in canvas
  const convertUrlToBase64 = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch status ${res.status}`);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) resolve(reader.result as string);
          else reject(new Error('Reader returned empty result'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn(`Local browser conversion failed for ${url}, trying fallback`, err);
      return '';
    }
  };

  useEffect(() => {
    const fetchLogos = async () => {
      // Method 1: Convert directly in browser using dynamic import relative paths
      let festBase64 = await convertUrlToBase64(festivalMonologLogo);
      let kataBase64 = await convertUrlToBase64(kataKitaLogo);

      // Method 2: Fallback to Backend local fs base64 pre-encoder API if available and client-side conversion was empty
      if (!festBase64 || !kataBase64) {
        try {
          const res = await fetch('/api/assets/logos');
          if (res.ok) {
            const data = await res.json();
            if (!festBase64 && data.festivalLogo) festBase64 = data.festivalLogo;
            if (!kataBase64 && data.kataKitaLogo) kataBase64 = data.kataKitaLogo;
          }
        } catch (err) {
          console.error('Failed to load base64 logos from API fallback:', err);
        }
      }

      if (festBase64) setFestivalLogoBase64(festBase64);
      if (kataBase64) setKataKitaLogoBase64(kataBase64);
    };
    fetchLogos();
  }, []);

  useEffect(() => {
    // Generate QR Code containing the ticket verification payload:
    const qrPayload = JSON.stringify({
      t: ticket.ticketNumber,
      b: ticket.bookingCode,
      h: ticket.securityHash
    });

    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#030712', // deep slate black
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR Code', err);
      });
  }, [ticket]);

  // Method to trigger automatic PNG download & open fallback/preview modal instantly so user is never left hanging
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    setModalMode('png');
    
    try {
      // Short timeout to guarantee QR is fully painted
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // High definition quality
        useCORS: true,
        logging: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      });
      
      const imageUri = canvas.toDataURL('image/png');
      setFallbackImageUri(imageUri);
      setIsModalOpen(true);

      // Attempt automatic download (may be blocked by sandboxed iframe security policies)
      try {
        const link = document.createElement('a');
        link.href = imageUri;
        link.download = `E_Tiket_${ticket.ownerName.trim().replace(/\s+/g, '_')}_${ticket.ticketNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Automatic link.click download was blocked by browser sandbox:', dlErr);
      }
    } catch (err) {
      console.error('Failed to generate ticket image:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Method to trigger automatic PDF download & open native printing fallback modal instantly
  const handlePrint = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    setModalMode('pdf');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        logging: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      setFallbackImageUri(imgData);
      setIsModalOpen(true);

      // Attempt automatic PDF generation & download
      try {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [120, 150]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, 120, 150);
        pdf.save(`E_Tiket_${ticket.ownerName.trim().replace(/\s+/g, '_')}_${ticket.ticketNumber}.pdf`);
      } catch (pdfErr) {
        console.warn('Automatic PDF generation or save was blocked by browser sandbox:', pdfErr);
      }
    } catch (err) {
      console.error('Failed to generate ticket PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Alternative manual trigger
  const handleGenerateManualImage = async () => {
    setModalMode('png');
    await handleDownload();
  };

  // Direct programmatic download for PDF within the modal
  const handleDownloadPDFManual = () => {
    if (!fallbackImageUri) return;
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [120, 150]
      });
      pdf.addImage(fallbackImageUri, 'PNG', 0, 0, 120, 150);
      pdf.save(`E_Tiket_${ticket.ownerName.trim().replace(/\s+/g, '_')}_${ticket.ticketNumber}.pdf`);
    } catch (err) {
      console.error('Manual PDF compilation failed:', err);
      alert('Gagal membuat PDF otomatis. Silakan simpan gambar tiket di bawah ini secara langsung.');
    }
  };

  // Safe helper to format date
  const renderDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition mb-6 print:hidden cursor-pointer mx-auto"
          id="btn-back-ticket"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-sans font-medium text-sm">Kembali ke Cek Tiket</span>
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mb-4 print:hidden">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-xl hover:shadow-blue-500/10 active:scale-95 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider font-mono shrink-0"
          id="btn-download-ticket"
        >
          {downloading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading ? 'Memproses...' : 'Unduh Gambar (PNG)'}
        </button>

        <button
          onClick={handlePrint}
          disabled={downloading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black px-5 py-3 rounded-xl transition-all shadow-xl hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider font-mono shrink-0"
          id="btn-print-ticket"
        >
          <Printer className="w-4 h-4" />
          Cetak / Simpan PDF
        </button>
      </div>

      {/* Alternative View & Save Button (Bypass for sandboxed iframes) */}
      <div className="text-center mb-6 print:hidden">
        <button
          onClick={handleGenerateManualImage}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/50 cursor-pointer transition-colors"
          id="btn-manual-save"
        >
          <Eye className="w-3.5 h-3.5" />
          Alternatif: Lihat & Simpan Gambar Secara Manual
        </button>
      </div>

      {/* Friendly Notification Box for Iframe Environment */}
      <div className="mb-6 p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex gap-2.5 items-start text-xs text-slate-300 leading-relaxed print:hidden">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-200 mb-0.5">Catatan Penting:</p>
          <p>Jika unduhan otomatis terblokir oleh keamanan browser di dalam preview ini, silakan klik tombol <b>"Alternatif: Lihat & Simpan Gambar Secara Manual"</b> di atas, atau klik tombol <b>"Open in new tab"</b> di kanan atas layar untuk membuka di halaman penuh.</p>
        </div>
      </div>

      {/* Premium World-Class 4:5 E-Ticket Container */}
      <div
        ref={ticketRef}
        className="relative w-full mx-auto bg-gradient-to-br from-white via-slate-50 to-amber-50/40 text-slate-900 rounded-3xl overflow-hidden print:shadow-none print:border-amber-500 transition-all flex flex-col justify-between"
        style={{ 
          aspectRatio: '4/5',
          boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.1), 0 25px 50px -12px rgba(217, 119, 6, 0.15), 0 25px 50px -12px rgba(29, 78, 216, 0.1)',
          border: '3px solid rgba(245, 158, 11, 0.5)'
        }}
        id="premium-e-ticket"
      >
        {/* World Class Vivid Neon Background Highlights (Red, Gold, Blue) */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-12 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Premium watermark overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#00000005_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />

        {/* Balanced Watermark Background Logo without box framing - Transparent, fully integrated */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.09] pointer-events-none select-none mix-blend-multiply scale-125">
          <img
            src={kataKitaLogoBase64 || kataKitaLogo}
            alt="Watermark Logo"
            className="w-[85%] h-auto object-contain"
          />
        </div>

        {/* Content Layout */}
        <div className="h-full flex flex-col justify-between p-5 md:p-6 z-10 relative">
          
          {/* Section 1: Header (Official Logo & Pass Badge) */}
          <div className="flex items-center justify-between gap-4">
            {/* Transparent Community & Festival brand identity */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-slate-200/60 shadow-sm min-h-[44px]">
              <img
                src={festivalLogoBase64 || festivalMonologLogo}
                alt="Festival Monolog Logo"
                className="h-8 w-auto object-contain"
              />
              <div className="w-px h-6 bg-slate-300" />
              <img
                src={kataKitaLogoBase64 || kataKitaLogo}
                alt="Komunitas Kata Kita Logo"
                className="h-6 w-auto object-contain"
              />
            </div>
            
            <div className="flex flex-col items-end">
              <span className="bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white text-[8px] font-black tracking-widest px-3 py-1 rounded-full uppercase shadow-md shadow-amber-500/15">
                TIKET MASUK RESMI
              </span>
              <p className="text-[7px] text-slate-500 font-mono mt-1 tracking-wider">GATE ENTRY CO-2026</p>
            </div>
          </div>

          {/* Section 2: Festival Title & Subtitle - Vibrant Neon Gold-Red-Blue */}
          <div className="text-center my-1.5 space-y-1">
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase font-sans leading-none text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 drop-shadow-[0_1px_5px_rgba(245,158,11,0.1)]">
              FESTIVAL MONOLOG
            </h2>
            <p className="text-[9px] text-red-600 font-mono tracking-[0.12em] font-extrabold uppercase">
              PELAJAR SE-PROVINSI LAMPUNG 2026
            </p>
          </div>

          {/* Ticket cutouts / dashed line separator */}
          <div className="relative flex items-center py-1">
            <div className="absolute -left-8 w-5 h-5 bg-slate-100 border border-slate-200 rounded-full" />
            <div className="w-full border-t-2 border-dashed border-slate-200/80" />
            <div className="absolute -right-8 w-5 h-5 bg-slate-100 border border-slate-200 rounded-full" />
          </div>

          {/* Section 3: Attendee, Category and Booking info */}
          <div className="grid grid-cols-12 gap-3 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-3.5 shadow-sm">
            {/* Left side info */}
            <div className="col-span-8 space-y-2.5">
              <div>
                <p className="text-[7px] text-slate-500 uppercase tracking-widest font-mono font-bold">PEMEGANG TIKET</p>
                <p className="text-sm md:text-base font-black text-slate-900 tracking-tight line-clamp-1">
                  {ticket.ownerName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[7px] text-slate-500 uppercase tracking-widest font-mono font-bold">KATEGORI TIKET</p>
                  <p className="text-[11px] font-extrabold text-red-600 tracking-tight leading-tight uppercase">
                    {ticket.categoryName}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-500 uppercase tracking-widest font-mono font-bold">KODE BOOKING</p>
                  <p className="text-[11px] font-black text-blue-700 tracking-wider font-mono">
                    {ticket.bookingCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side QR Code wrapper */}
            <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-200/80 pl-2">
              <div className="bg-white p-1 rounded-lg shadow-md inline-block border border-slate-100">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Tiket"
                    className="w-14 h-14 object-contain md:w-16 md:h-16"
                    id={`qr-${ticket.ticketNumber}`}
                  />
                ) : (
                  <div className="w-14 h-14 bg-slate-50 animate-pulse rounded flex items-center justify-center text-slate-400 text-[8px]">
                    ...
                  </div>
                )}
              </div>
              <p className="text-[6.5px] text-slate-500 font-mono mt-1 font-bold">{ticket.ticketNumber}</p>
            </div>
          </div>

          {/* Section 4: Date, Time & Venue - Color Accentuation */}
          <div className="grid grid-cols-3 gap-2 bg-white/95 border border-slate-200 rounded-xl p-2.5 text-center text-[10px] text-slate-700 shadow-inner">
            <div className="flex flex-col items-center justify-center border-r border-slate-200/80">
              <Calendar className="w-3.5 h-3.5 text-red-600 mb-0.5 animate-pulse" />
              <span className="font-sans text-[7.5px] font-black text-slate-800 uppercase">{renderDate(eventSettings.date)}</span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-slate-200/80">
              <Clock className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
              <span className="font-sans text-[7.5px] font-black text-slate-800 uppercase">{eventSettings.time.replace(' WIB - Selesai', '')} WIB</span>
            </div>
            <div className="flex flex-col items-center justify-center px-1">
              <Landmark className="w-3.5 h-3.5 text-blue-600 mb-0.5" />
              <span className="font-sans text-[7.5px] font-black text-slate-800 uppercase truncate w-full" title="Taman Budaya Lampung">Taman Budaya</span>
            </div>
          </div>

          {/* Section 5: Footer branding */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-[7px] text-slate-500">
            <span className="font-sans font-bold tracking-wide">KATA KITA GROUP © 2026</span>
            <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
              SIGN: {ticket.securityHash.substring(0, 8).toUpperCase()}
            </span>
          </div>

        </div>
      </div>

      <div className="text-center text-xs text-slate-500 mt-6 leading-relaxed print:hidden">
        <p>E-Ticket ini berlaku sebagai pass masuk resmi ke pementasan.</p>
        <p>Gunakan format file PNG HD atau simpan PDF ini untuk ditunjukkan saat masuk.</p>
      </div>

      {/* Manual Save Fallback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 relative shadow-2xl flex flex-col items-center">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center mb-5 mt-2">
              <span className="inline-block bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 animate-pulse">
                Siap Diunduh / Disimpan
              </span>
              <h3 className="text-lg font-bold text-white mb-1.5">
                {modalMode === 'png' ? 'Unduh Gambar E-Tiket' : 'Cetak / Simpan PDF Tiket'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {modalMode === 'png' 
                  ? 'Gunakan salah satu tombol di bawah atau ikuti instruksi manual jika download otomatis terhalang oleh browser.'
                  : 'Gunakan tombol Cetak PDF di bawah ini. Jika gagal, Anda juga dapat menyimpan gambar tiket secara langsung.'
                }
              </p>
            </div>

            {fallbackImageUri && (
              <div className="flex flex-col items-center gap-4 w-full">
                {/* HD Ticket Rendered Image Preview */}
                <div className="border-4 border-amber-500/80 rounded-2xl overflow-hidden shadow-2xl w-full max-w-[280px]">
                  <img 
                    src={fallbackImageUri} 
                    alt="Pratinjau E-Tiket Resmi" 
                    className="w-full h-auto select-all cursor-pointer hover:scale-[1.02] transition duration-300"
                    title="Sentuh & Tahan / Klik Kanan untuk Simpan"
                  />
                </div>

                {/* Friendly Custom Guide */}
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-[11px] text-slate-300 space-y-1.5 w-full leading-relaxed">
                  <p className="font-extrabold text-amber-400 uppercase tracking-wider text-xs">Petunjuk Simpan Manual:</p>
                  <p>📱 <b>Ponsel/HP</b>: Sentuh dan Tahan gambar tiket di atas, lalu ketuk <b>"Simpan Gambar"</b> / <b>"Download Gambar"</b>.</p>
                  <p>💻 <b>Komputer/Laptop</b>: Klik Kanan pada gambar tiket di atas, lalu pilih <b>"Simpan Gambar Sebagai..."</b>.</p>
                </div>

                {/* Interactive Save Buttons */}
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  {modalMode === 'png' ? (
                    <>
                      <a
                        href={fallbackImageUri}
                        download={`E_Tiket_${ticket.ownerName.trim().replace(/\s+/g, '_')}_${ticket.ticketNumber}.png`}
                        className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs text-center cursor-pointer font-mono"
                      >
                        <Download className="w-3.5 h-3.5" />
                        AUTO DOWNLOAD
                      </a>
                      <a
                        href={fallbackImageUri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl transition text-xs text-center cursor-pointer font-mono border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        BUKA GAMBAR
                      </a>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleDownloadPDFManual}
                        className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black py-2.5 px-3 rounded-xl transition text-xs cursor-pointer font-mono"
                      >
                        <Download className="w-3.5 h-3.5" />
                        UNDUH PDF
                      </button>
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          setTimeout(() => window.print(), 250);
                        }}
                        className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs cursor-pointer font-mono"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        CETAK PRINT
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-5 w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-xs uppercase font-mono tracking-wider"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* Print-specific isolation styling */}
      <style>{`
        #premium-e-ticket {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #premium-e-ticket:hover {
          transform: translateY(-4px) scale(1.005);
          box-shadow: 0 20px 45px rgba(220, 38, 38, 0.15), 0 20px 45px rgba(245, 158, 11, 0.2), 0 20px 45px rgba(29, 78, 216, 0.15) !important;
          border-color: rgba(245, 158, 11, 0.8) !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media print {
          /* Hide absolutely everything on the web page */
          body * {
            visibility: hidden !important;
            background: none !important;
          }
          /* Except the target e-ticket and its immediate nested content */
          #premium-e-ticket, #premium-e-ticket * {
            visibility: visible !important;
          }
          #premium-e-ticket {
            position: absolute !important;
            left: 50% !important;
            top: 45% !important;
            transform: translate(-50%, -50%) !important;
            width: 380px !important;
            height: 475px !important;
            border: 3px solid #f59e0b !important;
            border-radius: 24px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
