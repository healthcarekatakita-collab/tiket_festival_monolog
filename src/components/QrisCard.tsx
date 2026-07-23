import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, Download, Eye, X, Phone, CreditCard, Sparkles, ZoomIn } from 'lucide-react';

interface QrisCardProps {
  danaNumber?: string;
  danaName?: string;
  nmid?: string;
  merchantName?: string;
}

const QRIS_RAW_PAYLOAD = '00020101021126580014ID.LINKAJA.WWW01189360091500000000000215ID10265460390450303UME51440014ID.QRIS.WWW0215ID10265460390450303UME5204581253033605802ID5904GINA6013BANDARLAMPUNG61053511162070703A016304C25C';

export default function QrisCard({
  danaNumber = '089630869336',
  danaName = 'MAZAYA GINA',
  nmid = 'ID1026546039045',
  merchantName = 'Gina'
}: QrisCardProps) {
  const [copiedDana, setCopiedDana] = useState(false);
  const [copiedNmid, setCopiedNmid] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  useEffect(() => {
    // Generate crisp, high error-correction 600px QR Code Data URL locally
    QRCode.toDataURL(QRIS_RAW_PAYLOAD, {
      width: 600,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => {
        console.error('Failed to generate local QRIS code:', err);
        // Fallback to API if qrcode lib fails
        setQrCodeDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(QRIS_RAW_PAYLOAD)}`);
      });
  }, []);

  const handleCopyDana = () => {
    navigator.clipboard.writeText(danaNumber);
    setCopiedDana(true);
    setTimeout(() => setCopiedDana(false), 2000);
  };

  const handleCopyNmid = () => {
    navigator.clipboard.writeText(nmid);
    setCopiedNmid(true);
    setTimeout(() => setCopiedNmid(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Choice Header 1: DANA Direct */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-indigo-600 p-0.5 rounded-2xl shadow-md">
        <div className="bg-white p-4 rounded-[14px] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 text-amber-700 rounded-xl font-black text-xs">
                Metode 1
              </span>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm font-sans flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                Transfer DANA / E-Wallet Direct
              </h4>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Instan & Tanpa Biaya
            </span>
          </div>

          <div className="bg-slate-50 border-2 border-dashed border-amber-300 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                Nomor DANA & e-Wallet
              </p>
              <p className="text-lg font-black text-slate-900 font-mono tracking-tight flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                {danaNumber}
              </p>
              <p className="text-xs text-slate-600 font-extrabold">
                Atas Nama: <span className="text-red-600 font-black">{danaName}</span>
              </p>
            </div>

            <button
              onClick={handleCopyDana}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedDana ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Nomor DANA Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin No. DANA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Choice Header 2: QRIS Standar Nasional */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-indigo-600 p-0.5 rounded-2xl shadow-md">
        <div className="bg-white p-4 sm:p-5 rounded-[14px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-700 rounded-xl font-black text-xs">
                Metode 2
              </span>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm font-sans flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-red-600" />
                Scan QRIS Standar Pembayaran Nasional
              </h4>
            </div>
            <span className="text-[10px] bg-red-50 text-red-700 font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">
              Gopay / OVO / Shopee / BCA / Mandiri / BRI
            </span>
          </div>

          {/* Official QRIS Card Replica Container */}
          <div className="max-w-xs mx-auto bg-white border-2 border-slate-300 rounded-2xl shadow-xl overflow-hidden relative font-sans">
            {/* Top QRIS Header Banner */}
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              {/* QRIS Logo */}
              <div className="flex items-center gap-1">
                <div className="font-black tracking-tighter text-slate-900 text-lg leading-none font-sans">
                  Q<span className="text-red-600">RIS</span>
                </div>
                <div className="text-[8px] font-bold text-slate-600 leading-none pl-1 border-l border-slate-300">
                  QR Code Standar<br />Pembayaran Nasional
                </div>
              </div>

              {/* GPN Wings Logo */}
              <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                <span className="font-black text-red-600 text-[10px] tracking-wider">GPN</span>
              </div>
            </div>

            {/* Merchant Details */}
            <div className="pt-3 pb-1 text-center bg-white space-y-0.5">
              <h5 className="font-black text-slate-900 text-base">{merchantName}</h5>
              <p className="text-[10px] font-mono text-slate-500 font-extrabold tracking-wide">
                NMID: {nmid}
              </p>
              <p className="text-[9px] text-slate-400 font-mono">A01</p>
            </div>

            {/* QR Code Barcode Graphic */}
            <div className="p-4 bg-white flex flex-col items-center justify-center">
              <div className="p-3 bg-white border-4 border-slate-900 rounded-2xl shadow-inner relative group cursor-pointer" onClick={() => setIsZoomOpen(true)}>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QRIS Barcode Gina MAZAYA GINA"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400 font-mono">
                    Memuat QRIS...
                  </div>
                )}
                
                {/* Center QRIS Badge Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white border-2 border-red-600 rounded-md p-1 shadow-md">
                    <span className="font-black text-[9px] text-red-600 uppercase">GINA</span>
                  </div>
                </div>

                {/* Hover overlay zoom indicator */}
                <div className="absolute inset-0 bg-slate-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                  <ZoomIn className="w-4 h-4" />
                  <span>Klik untuk Perbesar</span>
                </div>
              </div>

              <div className="mt-2 text-center space-y-1">
                <p className="text-[10px] font-black text-slate-800 tracking-wider uppercase font-sans">
                  SATU QRIS UNTUK SEMUA
                </p>
                <button
                  onClick={() => setIsZoomOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-full transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Perbesar / Simpan Barcode</span>
                </button>
              </div>
            </div>

            {/* Red Instructions Banner at Bottom of QRIS */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-2.5 text-[9px] text-center space-y-1">
              <p className="font-extrabold uppercase tracking-wide">Cara bayar dengan QRIS:</p>
              <div className="flex justify-center items-center gap-2 font-semibold">
                <span>1. Buka Aplikasi</span>
                <span>→</span>
                <span>2. Scan QRIS</span>
                <span>→</span>
                <span>3. Bayar</span>
              </div>
            </div>
          </div>

          {/* Copy NMID & Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-xs">
            <div className="text-[11px] text-slate-500 font-medium">
              NMID Resmi: <strong className="font-mono text-slate-800">{nmid}</strong> (a.n <strong className="text-red-700 font-extrabold">MAZAYA GINA</strong>)
            </div>
            <button
              onClick={handleCopyNmid}
              className="text-[11px] text-red-700 hover:text-red-800 font-extrabold flex items-center gap-1 cursor-pointer underline"
            >
              {copiedNmid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>NMID Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin NMID QRIS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Zoom QRIS */}
      {isZoomOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl space-y-4 flex flex-col items-center text-center">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-1 pt-2">
              <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                QRIS Pembayaran Resmi
              </span>
              <h3 className="font-black text-slate-900 text-lg">Scan QRIS Gina</h3>
              <p className="text-xs text-slate-500 font-semibold">NMID: {nmid} • a.n MAZAYA GINA</p>
            </div>

            <div className="p-4 bg-white border-4 border-slate-900 rounded-2xl shadow-xl relative">
              {qrCodeDataUrl && (
                <img
                  src={qrCodeDataUrl}
                  alt="QRIS HD Barcode"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white border-2 border-red-600 rounded-md p-1.5 shadow-md">
                  <span className="font-black text-xs text-red-600 uppercase">GINA</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 font-medium bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1 w-full text-left">
              <p className="font-extrabold text-amber-800">Petunjuk Pembayaran:</p>
              <p>• Buka m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, ShopeePay, DANA).</p>
              <p>• Pilih menu <strong>Scan QRIS</strong> dan arahkan kamera ke barcode di atas.</p>
            </div>

            <div className="flex gap-2 w-full pt-1">
              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download="QRIS_MAZAYA_GINA_FESTIVAL_MONOLOG.png"
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Simpan Gambar QRIS</span>
                </a>
              )}
              <button
                onClick={() => setIsZoomOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
