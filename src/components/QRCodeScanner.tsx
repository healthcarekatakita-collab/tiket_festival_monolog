/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, XCircle, Search, Ticket, Users, CheckSquare } from 'lucide-react';
import { Booking } from '../types';

interface QRCodeScannerProps {
  onSuccessCheckIn: () => void;
  bookings: Booking[];
}

interface ScanResult {
  status: 'success' | 'already' | 'error';
  message: string;
  ticketNumber?: string;
  ownerName?: string;
  categoryName?: string;
  checkInTime?: string;
  checkInCount?: number;
  maxCheckIns?: number;
  remainingCheckIns?: number;
}

export default function QRCodeScanner({ onSuccessCheckIn, bookings }: QRCodeScannerProps) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualTicket, setManualTicket] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Derive stats
  const totalTickets = bookings
    .filter(b => b.status === 'Lunas')
    .reduce((sum, b) => sum + b.ticketCount, 0);

  const checkedInCount = bookings
    .filter(b => b.status === 'Lunas')
    .flatMap(b => b.tickets)
    .filter(t => t.isCheckedIn).length;

  const remainingCount = totalTickets - checkedInCount;
  const attendancePercentage = totalTickets > 0 ? Math.round((checkedInCount / totalTickets) * 100) : 0;

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        try {
          // Pause camera scanner by clearing result quickly if already processing
          if (isLoading) return;
          
          let parsedData: { t: string; b: string; h: string };
          try {
            parsedData = JSON.parse(decodedText);
          } catch (e) {
            // If QR is not JSON, try treating entire string as the ticket number
            parsedData = { t: decodedText.trim(), b: '', h: '' };
          }

          if (parsedData.t) {
            await triggerCheckIn(parsedData.t, parsedData.h);
          } else {
            setScanResult({
              status: 'error',
              message: 'Format QR Code tidak dikenali atau tidak valid.'
            });
          }
        } catch (err: any) {
          setScanResult({
            status: 'error',
            message: err.message || 'Kesalahan memproses QR Code.'
          });
        }
      },
      (error) => {
        // Silent error to prevent flooding console on active frame scanning
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Error clearing scanner', err));
      }
    };
  }, [isLoading]);

  // Handle manual or scanned check-in
  const triggerCheckIn = async (ticketNumber: string, hash?: string) => {
    setIsLoading(true);
    setScanResult(null);

    try {
      const response = await fetch('/api/admin/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketNumber: ticketNumber.trim(),
          hash,
          operatorName: 'Gate Staff (Scanner Camera)'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setScanResult({
          status: 'success',
          message: data.message || 'Check-In Berhasil! Silakan masuk.',
          ticketNumber: data.ticket.ticketNumber,
          ownerName: data.ticket.ownerName,
          categoryName: data.ticket.categoryName,
          checkInTime: new Date(data.ticket.checkInTime).toLocaleTimeString('id-ID'),
          checkInCount: data.checkInCount || data.ticket.checkInCount || 1,
          maxCheckIns: data.maxCheckIns || data.ticket.maxCheckIns || 1,
          remainingCheckIns: data.remainingCheckIns ?? (data.ticket.maxCheckIns - data.ticket.checkInCount)
        });
        // Play high-pitch success sound
        playBeep(2000, 150);
        onSuccessCheckIn();
      } else {
        // Check if already checked in / quota exhausted from response data
        if (data.error && (data.error.includes('sudah pernah digunakan') || data.error.includes('HABIS'))) {
          setScanResult({
            status: 'already',
            message: data.error || 'TOLAK MASUK: Kuota scan tiket telah habis!',
            ticketNumber: data.ticketNumber || ticketNumber,
            ownerName: data.ownerName || 'Tidak Diketahui',
            categoryName: data.categoryName || '',
            checkInTime: data.checkInTime ? new Date(data.checkInTime).toLocaleTimeString('id-ID') : 'Tidak Diketahui',
            checkInCount: data.checkInCount || data.maxCheckIns || 1,
            maxCheckIns: data.maxCheckIns || 1,
            remainingCheckIns: 0
          });
          playBeep(120, 500); // low buzz
        } else {
          setScanResult({
            status: 'error',
            message: data.error || 'Check-in gagal.'
          });
          playBeep(120, 500); // low buzz
        }
      }
    } catch (err: any) {
      setScanResult({
        status: 'error',
        message: 'Koneksi ke server gagal: ' + err.message
      });
      playBeep(120, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // Sound generator using Web Audio API
  const playBeep = (freq: number, duration: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      // Audio context blocked or not supported
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicket.trim()) return;
    triggerCheckIn(manualTicket);
    setManualTicket('');
  };

  return (
    <div className="space-y-6" id="qr-scanner-dashboard">
      
      {/* Real-time Statistics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-indigo-700 font-bold">Total Tiket Lunas</p>
            <p className="text-2xl font-black text-indigo-950">{totalTickets}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-700 font-bold">Sudah Hadir</p>
            <p className="text-2xl font-black text-emerald-950">{checkedInCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xs text-amber-700 font-bold">Belum Hadir</p>
            <p className="text-2xl font-black text-amber-950">{remainingCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span className="font-semibold">Kehadiran</span>
            <span className="font-bold text-slate-900">{attendancePercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${attendancePercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Camera Scanner Box (Left 7/12) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">Kamera Pindai Gate</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Aktif
            </span>
          </div>

          {/* HTML5 Qr Code element wrapper */}
          <div className="relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-200 aspect-square max-w-[400px] mx-auto shadow-inner">
            <div id="qr-reader" className="w-full h-full border-0!" />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
              Posisikan QR Code tiket di dalam kotak pemindai kamera. Pastikan pencahayaan cukup dan QR tidak melengkung atau terpotong.
            </p>
          </div>

          {/* Manual Entry Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-mono font-black">Atau Masukkan Manual</span>
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={manualTicket}
                onChange={(e) => setManualTicket(e.target.value)}
                placeholder="Contoh: FMKKL-2026-000001"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-mono text-sm transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !manualTicket.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-slate-950 font-black px-5 py-2.5 rounded-xl transition text-sm cursor-pointer shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Verifikasi</span>
            </button>
          </form>
        </div>

        {/* Scan Status Feedback Card (Right 5/12) */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex-1 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="font-black text-slate-900 text-base mb-4 border-b border-slate-200 pb-3 uppercase tracking-tight">
                Hasil Pemindaian Terakhir
              </h3>

              {!scanResult ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center mb-3">
                    <Camera className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Belum ada aktivitas</p>
                  <p className="text-xs max-w-[200px] mt-1 font-semibold leading-relaxed">Scan QR Code tiket atau ketik nomor tiket di samping untuk memverifikasi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Pill Alert */}
                  {scanResult.status === 'success' && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-sm">CHECK-IN BERHASIL</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-semibold">{scanResult.message}</p>
                      </div>
                    </div>
                  )}

                  {scanResult.status === 'already' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-sm">TIKET SUDAH DIPAKAI!</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-semibold">{scanResult.message}</p>
                      </div>
                    </div>
                  )}

                  {scanResult.status === 'error' && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
                      <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-sm">VERIFIKASI GAGAL</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-semibold">{scanResult.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Scanned ticket details */}
                  {(scanResult.status === 'success' || scanResult.status === 'already') && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400 font-mono text-[10px] font-black uppercase">No. Tiket</p>
                          <p className="font-extrabold text-slate-900 font-mono">{scanResult.ticketNumber}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-mono text-[10px] font-black uppercase">Kategori</p>
                          <p className="font-black text-amber-600">{scanResult.categoryName}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-slate-400 font-mono text-[10px] font-black uppercase">Nama Pemilik Tiket</p>
                        <p className="text-base font-black text-slate-900">{scanResult.ownerName}</p>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-slate-400 font-mono text-[10px] font-black uppercase mb-1.5">Status Kuota Masuk Gate ({scanResult.checkInCount || 1}/{scanResult.maxCheckIns || 1} Show)</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {Array.from({ length: scanResult.maxCheckIns || 1 }).map((_, idx) => {
                            const isUsed = idx < (scanResult.checkInCount || 1);
                            return (
                              <div
                                key={idx}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black flex items-center gap-1 border ${
                                  isUsed
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}
                              >
                                {isUsed ? '✓ Show Used' : `○ Show ${idx + 1}`}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-slate-400 font-mono text-[10px] font-black uppercase">Waktu Check-In Terakhir</p>
                        <p className="text-sm font-extrabold text-slate-700">
                          {scanResult.checkInTime} WIB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clear Button */}
            {scanResult && (
              <button
                onClick={() => setScanResult(null)}
                className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                id="btn-clear-scan-result"
              >
                Bersihkan & Siap Pindai Berikutnya
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
