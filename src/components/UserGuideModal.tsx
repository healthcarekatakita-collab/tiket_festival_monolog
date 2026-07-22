import React, { useState } from 'react';
import { 
  X, FileText, Download, ShieldCheck, UserCheck, Smartphone, 
  Users, CheckCircle2, AlertTriangle, Table, BookOpen, ExternalLink, HelpCircle, Lock, Copy
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'panitia' | 'penonton' | 'downloads'>('overview');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isOpen) return null;

  // Word Document Generator (.doc)
  const downloadWordDoc = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-office:office' xmlns:w='urn:schemas-microsoft-office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Pedoman Operasional - Festival Teater Monolog Kata Kita 2026</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
          h1 { color: #b91c1c; font-size: 24pt; border-bottom: 2px solid #b91c1c; padding-bottom: 8px; margin-bottom: 10px; }
          h2 { color: #1e1b4b; font-size: 16pt; margin-top: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
          h3 { color: #4338ca; font-size: 13pt; margin-top: 15px; }
          p { margin-bottom: 8px; font-size: 11pt; }
          ul, ol { margin-left: 20px; margin-bottom: 12px; }
          li { margin-bottom: 4px; font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
          th { background-color: #1e1b4b; color: #ffffff; padding: 10px; text-align: left; font-size: 10pt; border: 1px solid #1e1b4b; }
          td { padding: 8px; border: 1px solid #cbd5e1; font-size: 10pt; vertical-align: top; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { background-color: #fef3c7; color: #92400e; padding: 3px 8px; font-weight: bold; border-radius: 4px; font-size: 9pt; }
          .footer { margin-top: 30px; font-size: 9pt; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>PEDOMAN OPERASIONAL & PANDUAN PENGGUNAAN APLIKASI</h1>
        <p><strong>FESTIVAL TEATER MONOLOG KATA KITA 2026</strong><br>
        Lokasi: Taman Budaya Lampung • Tanggal: 22 - 23 Agustus 2026</p>
        <hr>

        <h2>1. RINGKASAN STRUKTUR PENGGUNA & OTOISASI PANITIA</h2>
        <table>
          <thead>
            <tr>
              <th>Peran / Role</th>
              <th>Fungsi Utama</th>
              <th>Tanggung Jawab Operasional</th>
              <th>Area Akses Portal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Super Admin</strong></td>
              <td>Pengontrol Penuh Sistem & Konfigurasi</td>
              <td>Mengatur Kuota Tiket, Harga, Rekening Pembayaran, Manajemen Pengguna Panitia, & Laporan Keuangan Total.</td>
              <td>Dashboard Penuh, Pengaturan Event, Manajemen Kategori, Log Aktivitas</td>
            </tr>
            <tr>
              <td><strong>Verifikator</strong></td>
              <td>Verifikasi Transaksi & Pembayaran</td>
              <td>Memeriksa mutasi bank/QRIS, memverifikasi bukti transfer penonton, menyetujui (Approve) atau menolak (Reject) pesanan.</td>
              <td>Daftar Pesanan Tiket, Verifikasi Pembayaran, Cetak Laporan Relevan</td>
            </tr>
            <tr>
              <td><strong>Gate Staff</strong></td>
              <td>Pemindaian QR Code Pintu Masuk</td>
              <td>Memindai E-Tiket penonton di lokasi acara (Taman Budaya Lampung), memastikan tiket valid dan mencegah pemakaian ganda.</td>
              <td>Kamera QR Code Scanner, Validator Tiket Venue</td>
            </tr>
          </tbody>
        </table>

        <h2>2. PANDUAN LANGKAH KERJA PANITIA (COMMITTEE WORKFLOW)</h2>
        
        <h3>A. Super Admin</h3>
        <ol>
          <li><strong>Login:</strong> Masuk ke Portal Panitia via tombol "Portal Panitia" di bagian bawah website. Masukkan kredensial Super Admin Anda.</li>
          <li><strong>Pengaturan Acara:</strong> Buka menu "Pengaturan Event". Atur Nama Acara, Tanggal, Lokasi, serta Informasi Rekening Pembayaran Bank/QRIS.</li>
          <li><strong>Kategori & Kuota Tiket:</strong> Buka menu "Kategori Tiket". Tentukan harga Presale/Reguler, jumlah kuota harian, serta deskripsi fasilitas tiket.</li>
          <li><strong>Manajemen Panitia:</strong> Tambah atau ubah kredensial akun Verifikator dan Gate Staff agar operasional berjalan aman.</li>
          <li><strong>Monitoring Laporan:</strong> Pantau rekapitulasi penjualan tiket dan jumlah kehadiran pengunjung secara real-time.</li>
        </ol>

        <h3>B. Verifikator (Tim Keuangan)</h3>
        <ol>
          <li><strong>Login:</strong> Masuk ke Portal Panitia menggunakan akun Verifikator.</li>
          <li><strong>Pemeriksaan Pesanan:</strong> Buka tab "Daftar Pesanan Tiket" dan filter berdasarkan status <em>"Menunggu Verifikasi"</em>.</li>
          <li><strong>Pencocokan Transaksi:</strong> Buka detail pesanan, periksa foto Bukti Transfer yang diunggah penonton dengan mutasi rekening bank/QRIS resmi panitia.</li>
          <li><strong>Persetujuan (Approve):</strong> Jika dana telah masuk sesuai nominal, klik tombol <strong>"Setujui Pembayaran"</strong>. Sistem otomatis menerbitkan Kode Booking & E-Tiket resmi.</li>
          <li><strong>Penolakan (Reject):</strong> Jika bukti tidak valid atau dana tidak masuk, klik <strong>"Tolak Pesanan"</strong> dan tuliskan catatan alasan penolakan.</li>
        </ol>

        <h3>C. Gate Staff (Petugas Gate)</h3>
        <ol>
          <li><strong>Login:</strong> Masuk ke Portal Panitia menggunakan akun Gate Staff pada perangkat smartphone/tablet panitia saat hari pementasan.</li>
          <li><strong>Persiapan Scanner:</strong> Buka menu <strong>"Gate QR Scanner"</strong> dan izinkan akses kamera pada perangkat.</li>
          <li><strong>Proses Scan:</strong> Minta penonton menunjukkan QR Code pada E-Tiket mereka. Arahkan kamera ke QR Code tersebut.</li>
          <li><strong>Hasil Validasi:</strong>
            <ul>
              <li><strong>HIJAU (Valid):</strong> Tampil nama penonton, kategori tiket, dan status Check-In berhasil. Izinkan penonton masuk ke studio teater.</li>
              <li><strong>MERAH (Ditolak):</strong> Tampil peringatan "Tiket Sudah Digunakan" atau "Tiket Tidak Ditemukan". Arahkan penonton ke meja Helpdesk/Verifikator.</li>
            </ul>
          </li>
        </ol>

        <h2>3. PANDUAN UNTUK PENONTON (AUDIENCE GUIDE)</h2>
        <ol>
          <li><strong>Pemesanan Tiket Online:</strong> Buka website resmi, pilih hari pementasan, kategori tiket, dan isi formulir data diri (Nama, No WA, Email, Sekolah/Umum).</li>
          <li><strong>Pembayaran:</strong> Lakukan transfer sesuai nominal ke nomor rekening bank/QRIS yang tertera pada layar checkout.</li>
          <li><strong>Unggah Bukti Transfer:</strong> Unggah foto/screenshot bukti pembayaran, lalu klik "Kirim & Dapatkan Kode Booking". Simpan Kode Booking Anda (contoh: KATA-2026-XXXX).</li>
          <li><strong>Cek Status Tiket:</strong> Masuk ke menu "Cek Status Tiket" di website dengan memasukkan Kode Booking atau Nomor WhatsApp/Email.</li>
          <li><strong>Unduh E-Tiket:</strong> Setelah diverifikasi panitia, klik "Lihat & Unduh E-Tiket" untuk menyimpan E-Tiket ber-QR Code di HP Anda.</li>
          <li><strong>Masuk Ke Venue:</strong> Datang ke Taman Budaya Lampung 30 menit sebelum acara, dan tunjukkan QR Code E-Tiket kepada Gate Staff di pintu masuk.</li>
        </ol>

        <div class="footer">
          <p>© 2026 Festival Teater Monolog Kata Kita. Dokumen Pedoman Operasional Resmi.</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Pedoman_Aplikasi_Festival_Teater_Kata_Kita_2026.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Google Docs / Plain Text Document (.txt)
  const downloadTextDoc = () => {
    const textContent = `PEDOMAN OPERASIONAL & PANDUAN PENGGUNAAN APLIKASI
FESTIVAL TEATER MONOLOG KATA KITA 2026
Taman Budaya Lampung • 22 - 23 Agustus 2026

========================================================================
1. RINGKASAN STRUKTUR PENGGUNA & HAK AKSES PANITIA
========================================================================

[SUPER ADMIN]
- Fungsi Utama: Pengontrol Penuh Sistem & Pengaturan Festival.
- Tanggung Jawab: Mengatur kuota tiket harian, harga tiket, nomor rekening pembayaran, mengelola akun panitia, serta memantau laporan keuangan total.
- Hak Akses: Seluruh Fitur Portal Panitia & Pengaturan Event.

[VERIFIKATOR]
- Fungsi Utama: Keuangan & Verifikasi Pembayaran Transaksi Penonton.
- Tanggung Jawab: Memeriksa kelengkapan data pemesan, mencocokkan bukti transfer/QRIS penonton dengan mutasi bank resmi panitia, menyetujui (Approve) atau menolak (Reject) pesanan.
- Hak Akses: Daftar Pesanan Tiket, Verifikasi Pembayaran, & Filter Status Pesanan.

[GATE STAFF]
- Fungsi Utama: Petugas Pemindaian (Scan) Tiket di Pintu Masuk / Venue.
- Tanggung Jawab: Memindai QR Code E-Tiket penonton di Taman Budaya Lampung saat hari acara, memastikan keabsahan tiket, dan mencatat kehadiran (Check-in).
- Hak Akses: Fitur Kamera QR Scanner & Validator Tiket.


========================================================================
2. PANDUAN PROSEDUR KERJA PANITIA (STEP-BY-STEP)
========================================================================

A. TUGAS SUPER ADMIN:
1. Masuk ke Portal Panitia melalui tombol "Portal Panitia" di bawah website.
2. Masukkan Username dan Password resmi Super Admin.
3. Di menu "Pengaturan Event", pastikan Nama Acara, Tanggal, Lokasi, dan Nomor Rekening Transfer Bank/QRIS sudah benar.
4. Di menu "Kategori Tiket", kelola harga tiket Presale & Reguler serta batasan kuota penonton harian.
5. Pantau statistik total pendapatan dan jumlah tiket yang telah terverifikasi.

B. TUGAS VERIFIKATOR:
1. Masuk ke Portal Panitia menggunakan akun Verifikator.
2. Buka tab "Daftar Pesanan Tiket", ubah filter ke status "Menunggu Verifikasi".
3. Klik pesanan yang masuk untuk melihat rincian pemesan dan foto Bukti Transfer.
4. Cocokkan nominal dan tanggal transfer dengan mutasi bank/QRIS resmi panitia.
5. Jika valid: Klik "Setujui (Approve)" agar sistem otomatis menerbitkan E-Tiket resmi.
6. Jika tidak valid: Klik "Tolak (Reject)" dan cantumkan alasan penolakan.

C. TUGAS GATE STAFF:
1. Masuk ke Portal Panitia menggunakan akun Gate Staff pada HP/Tablet panitia.
2. Buka fitur "Gate QR Scanner" dan beri izin akses kamera.
3. Minta penonton memperlihatkan QR Code pada E-Tiket mereka.
4. Arahkan kamera ke QR Code E-Tiket.
5. Jika Lolos (HIJAU): Persilakan penonton masuk ke studio teater.
6. Jika Ditolak (MERAH): Arahkan penonton ke meja Verifikator/Helpdesk panitia.


========================================================================
3. PANDUAN PENGGUNAAN UNTUK PENONTON (AUDIENCE GUIDE)
========================================================================
1. Buka website resmi Festival Teater Monolog Kata Kita 2026.
2. Pilih Hari Pementasan (22 atau 23 Agustus 2026) dan Kategori Tiket yang diinginkan.
3. Isi Data Diri secara lengkap (Nama, No WhatsApp, Email, Sekolah/Kampus/Umum).
4. Lakukan Pembayaran melalui Transfer Bank / QRIS ke rekening resmi panitia.
5. Unggah foto Bukti Transfer pada halaman website lalu klik "Kirim & Dapatkan Kode Booking".
6. Simpan Kode Booking Anda (Contoh: KATA-2026-XXXX).
7. Buka menu "Cek Status Tiket" di website untuk memeriksa status pesanan Anda.
8. Setelah terverifikasi, klik "Lihat & Unduh E-Tiket" dan simpan E-Tiket ber-QR Code di HP Anda.
9. Tunjukkan QR Code E-Tiket kepada Gate Staff di Taman Budaya Lampung saat hari acara.

========================================================================
Dokumen Pedoman Resmi © 2026 Festival Teater Monolog Kata Kita.
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Pedoman_Aplikasi_Kata_Kita_2026.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel Table Spreadsheet (.csv / html excel format)
  const downloadExcelTable = () => {
    const csvContent = "\uFEFF" + [
      ["NO", "KATEGORI PENGGUNA", "PERAN / ROLE", "FUNGSI UTAMA", "TANGGUNG JAWAB OPERASIONAL", "MENU / AREA HAK AKSES", "PETUNJUK KESALAHAN (DO'S & DON'TS)"],
      ["1", "PANITIA", "Super Admin", "Pengontrol Utama Sistem & Event", "Mengatur kuota tiket, harga, nomor rekening, membuat akun panitia, dan mengawasi laporan keuangan total", "Dashboard Utama, Pengaturan Event, Kategori Tiket, Log System", "JANGAN bagikan akun ke publik; Selalu periksa kembali nomor rekening sebelum event dibuka"],
      ["2", "PANITIA", "Verifikator", "Verifikasi Pembayaran & Mutasi", "Memeriksa bukti transfer penonton, membandingkan dengan mutasi bank/QRIS panitia, menyetujui (Approve) atau menolak (Reject) pesanan", "Daftar Pesanan Tiket, Verifikasi Transaksi, Laporan Penjualan", "JANGAN Approve sebelum cek mutasi rekening bank; Berikan alasan jelas jika menolak pesanan"],
      ["3", "PANITIA", "Gate Staff", "Pemindaian QR Code di Venue", "Memindai QR Code E-Tiket penonton di pintu masuk studio Taman Budaya Lampung dan mencatat Check-In", "Fitur Kamera Gate QR Scanner & Validator Tiket", "JANGAN izinkan penonton masuk jika hasil scan MERAH; Arahkan ke Helpdesk jika ada kendala"],
      ["4", "PENONTON", "Pembeli Tiket", "Pemesanan & Pendaftaran Online", "Mengisi formulir pendaftaran, memilih hari & kategori tiket, melakukan transfer pembayaran, serta mengunggah bukti bayar", "Formulir Booking Tiket, Upload Bukti Transfer", "SIMPAN Kode Booking Anda; Pastikan mengunggah foto bukti bayar yang jelas dan sesuai nominal"],
      ["5", "PENONTON", "Pengunjung Venue", "Pemeriksaan Status & Check-In", "Memeriksa status pendaftaran di menu Cek Status, mengunduh E-Tiket ber-QR Code, dan menunjukkannya di venue", "Cek Status Tiket, Tampilan E-Tiket Unik", "DATANG 30 menit sebelum acara dimulai; Siapkan layar HP terang saat scan QR Code"]
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Tabel_Pedoman_Panitia_dan_Penonton_Kata_Kita_2026.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyGuideSummary = () => {
    const guideSummary = `PEDOMAN OPERASIONAL & PERAN PANITIA FESTIVAL MONOLOG KATA KITA 2026:

1. SUPER ADMIN:
- Fungsi: Pengontrol penuh sistem, kuota tiket, harga, rekening pembayaran, & laporan keuangan.
- Kredensial: Digunakan oleh Penanggung Jawab Utama.

2. VERIFIKATOR:
- Fungsi: Memeriksa bukti transfer penonton dengan mutasi bank resmi panitia, lalu klik Approve/Reject.
- Kredensial: Digunakan oleh Tim Keuangan.

3. GATE STAFF:
- Fungsi: Memindai (Scan) QR Code E-Tiket di pintu masuk Taman Budaya Lampung saat hari acara.
- Kredensial: Digunakan oleh Petugas Gate Pintu Masuk.

PANDUAN PENONTON:
1. Buka website -> Pilih tiket -> Isi data diri.
2. Transfer sesuai nominal -> Upload bukti transfer -> Simpan Kode Booking.
3. Cek status tiket di website -> Unduh E-Tiket ber-QR Code.
4. Tunjukkan QR Code kepada Gate Staff di venue.`;

    navigator.clipboard.writeText(guideSummary);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                Pedoman Operasional Aplikasi
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Lengkap
                </span>
              </h2>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1 flex-wrap">
                <span>Petunjuk penggunaan Panitia & Penonton</span>
                <span className="font-black text-red-400">Festival</span>
                <span className="font-black text-amber-400">Monolog</span>
                <span className="font-black text-blue-400">Komunitas</span>
                <span className="font-black text-red-400">Kata</span>
                <span className="font-black text-amber-400">Kita</span>
                <span className="font-black text-blue-300">2026</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Header - Responsive 2x2 Grid on Mobile, 4-Cols on Desktop */}
        <div className="bg-slate-100 border-b border-slate-200 p-3 sm:px-6 sm:py-3.5 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200 shadow-xs'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">1. Ringkasan</span>
            </button>

            <button
              onClick={() => setActiveTab('panitia')}
              className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                activeTab === 'panitia'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200 shadow-xs'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">2. Panduan Panitia</span>
            </button>

            <button
              onClick={() => setActiveTab('penonton')}
              className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                activeTab === 'penonton'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200 shadow-xs'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">3. Panduan Penonton</span>
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                activeTab === 'downloads'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-xs'
              }`}
            >
              <Download className="w-4 h-4 shrink-0 text-amber-600" />
              <span className="truncate">4. Pusat Unduh File</span>
            </button>
          </div>
        </div>

        {/* Modal Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 grow text-slate-700 text-sm">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-indigo-950 text-base">
                    Sistem Manajemen Acara Terintegrasi Real-Time
                  </h3>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    Aplikasi ini dirancang khusus untuk mengelola pemesanan tiket online, verifikasi pembayaran otomatis/manual, penerbitan E-Tiket ber-QR Code, hingga pemindaian tiket di lokasi acara Taman Budaya Lampung.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-600 font-black text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>1. Super Admin</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bertanggung jawab penuh atas konfigurasi acara, harga & kuota tiket, pengaturan rekening bank, serta laporan statistik keuangan total.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                    <UserCheck className="w-4 h-4" />
                    <span>2. Verifikator</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memeriksa kesesuaian bukti transfer pembayaran penonton dengan mutasi rekening bank resmi panitia, lalu klik Approve atau Reject.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                    <Smartphone className="w-4 h-4" />
                    <span>3. Gate Staff</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memindai (scan) QR Code E-Tiket penonton di lokasi acara Taman Budaya Lampung untuk validasi dan mencatat kehadiran Check-in.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  Ingin mengunduh dokumen resmi pedoman lengkap untuk dibagikan ke seluruh tim panitia?
                </div>
                <button
                  onClick={() => setActiveTab('downloads')}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Buka Pusat Unduh File
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PANDUAN PANITIA (3 ROLES) */}
          {activeTab === 'panitia' && (
            <div className="space-y-6">
              
              {/* Role 1: Super Admin */}
              <div className="border border-red-200 rounded-2xl overflow-hidden bg-red-50/30 space-y-3 p-5">
                <div className="flex items-center justify-between border-b border-red-200/80 pb-3">
                  <div className="flex items-center gap-2.5 text-red-700 font-black text-base">
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                    <span>PERAN 1: SUPER ADMIN (Penanggung Jawab Utama)</span>
                  </div>
                  <span className="bg-red-100 text-red-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-red-200">
                    Akses Penuh
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>Fungsi Utama:</strong> Mengontrol penuh seluruh sistem, pengaturan acara, kuota tiket, harga, kustomisasi nomor rekening, manajemen akun panitia, & laporan keuangan.</p>
                  <p className="font-bold text-slate-900 mt-2">Langkah Kerja Operasional:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Login ke Portal Panitia dengan akun Super Admin.</li>
                    <li>Buka menu <strong>Pengaturan Event</strong> untuk memastikan Nama Acara, Tanggal, Lokasi (Taman Budaya Lampung), dan Nomor Rekening Bank/QRIS sudah sesuai.</li>
                    <li>Buka menu <strong>Kategori Tiket</strong> untuk mengatur harga tiket Presale / Reguler serta batas kuota penonton harian.</li>
                    <li>Buka menu <strong>Manajemen Panitia</strong> untuk mengelola kata sandi atau menambah akun Verifikator dan Gate Staff.</li>
                    <li>Buka menu <strong>Statistik & Laporan</strong> untuk melihat total penjualan dan kehadiran penonton secara langsung.</li>
                  </ol>
                  <div className="bg-red-100/80 border border-red-200 rounded-xl p-3 text-[11px] text-red-900 font-medium flex items-start gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span><strong>Peringatan Keamanan:</strong> Jangan berikan akun Super Admin kepada pihak di luar penanggung jawab utama untuk mencegah perubahan konfigurasi acara secara tidak sengaja.</span>
                  </div>
                </div>
              </div>

              {/* Role 2: Verifikator */}
              <div className="border border-indigo-200 rounded-2xl overflow-hidden bg-indigo-50/30 space-y-3 p-5">
                <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3">
                  <div className="flex items-center gap-2.5 text-indigo-700 font-black text-base">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    <span>PERAN 2: VERIFIKATOR (Tim Keuangan & Transaksi)</span>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                    Keuangan
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>Fungsi Utama:</strong> Memeriksa kelengkapan data pemesan, mencocokkan bukti transfer bank / QRIS dengan mutasi rekening resmi, lalu menyetujui (Approve) atau menolak (Reject) pesanan.</p>
                  <p className="font-bold text-slate-900 mt-2">Langkah Kerja Operasional:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Login ke Portal Panitia menggunakan akun Verifikator.</li>
                    <li>Buka tab <strong>Daftar Pesanan Tiket</strong> dan filter status pesanan ke <em>"Menunggu Verifikasi"</em>.</li>
                    <li>Klik <strong>Detail / Cek Bukti</strong> pada pesanan yang masuk.</li>
                    <li>Periksa gambar bukti transfer, nominal pembayaran, dan tanggal transaksi dengan mutasi rekening bank/QRIS resmi panitia.</li>
                    <li>Jika valid: Klik <strong>Setujui (Approve)</strong>. Sistem otomatis menerbitkan Kode Booking resmi dan E-Tiket unik.</li>
                    <li>Jika tidak valid: Klik <strong>Tolak (Reject)</strong> dan cantumkan alasan penolakan secara jelas.</li>
                  </ol>
                </div>
              </div>

              {/* Role 3: Gate Staff */}
              <div className="border border-emerald-200 rounded-2xl overflow-hidden bg-emerald-50/30 space-y-3 p-5">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-2.5 text-emerald-700 font-black text-base">
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    <span>PERAN 3: GATE STAFF (Petugas Pintu Masuk / Venue)</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    Scan Venue
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <p><strong>Fungsi Utama:</strong> Memindai (scan) QR Code pada E-Tiket fisik/HP penonton saat hari pementasan di Taman Budaya Lampung.</p>
                  <p className="font-bold text-slate-900 mt-2">Langkah Kerja Operasional:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Login ke Portal Panitia menggunakan akun Gate Staff pada perangkat smartphone/tablet panitia.</li>
                    <li>Buka fitur <strong>Gate QR Scanner</strong> dan beri izin akses kamera pada HP/Tablet.</li>
                    <li>Arahkan kamera ke QR Code E-Tiket yang ditunjukkan oleh penonton.</li>
                    <li><strong>Hasil HIJAU (Valid):</strong> Tampil nama penonton, kategori tiket, dan status "Check-in Berhasil". Penonton diperbolehkan masuk studio teater.</li>
                    <li><strong>Hasil MERAH (Ditolak):</strong> Tampil peringatan "Tiket Sudah Digunakan" atau "Tiket Belum Terverifikasi / Tidak Ditemukan". Arahkan penonton ke meja Helpdesk.</li>
                  </ol>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PANDUAN PENONTON */}
          {activeTab === 'penonton' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong>Panduan Lengkap Untuk Penonton:</strong> Bagikan langkah-langkah ini di media sosial, poster, atau pesan broadcast WhatsApp agar calon penonton tidak bingung saat memesan tiket.
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs">1</div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Pemesanan Tiket Online</h4>
                    <p className="text-slate-600 mt-1">
                      Buka website resmi Festival Teater Monolog Kata Kita 2026. Pilih hari pementasan (22 atau 23 Agustus 2026), pilih kategori tiket (Presale/Reguler), dan isi formulir data diri (Nama Lengkap, No WA, Email, dan asal Sekolah/Kampus/Umum).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs">2</div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Pembayaran & Unggah Bukti Transfer</h4>
                    <p className="text-slate-600 mt-1">
                      Lakukan transfer sesuai nominal ke nomor rekening bank/QRIS yang tertera. Unggah foto/screenshot bukti transfer, lalu klik tombol <strong>"Kirim & Dapatkan Kode Booking"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs">3</div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Simpan Kode Booking & Cek Status Tiket</h4>
                    <p className="text-slate-600 mt-1">
                      Catat Kode Booking Anda (contoh: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700">KATA-2026-XXXX</code>). Buka menu <strong>"Cek Status Tiket"</strong> di website untuk memantau proses verifikasi oleh panitia.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs">4</div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Unduh E-Tiket & Check-in di Venue</h4>
                    <p className="text-slate-600 mt-1">
                      Setelah diverifikasi oleh Panitia, klik <strong>"Lihat & Unduh E-Tiket"</strong> untuk mendapatkan E-Tiket ber-QR Code. Tunjukkan QR Code E-Tiket tersebut pada layar HP Anda kepada petugas Gate Staff di Taman Budaya Lampung saat hari acara.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOWNLOADS CENTER */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5 max-w-xl mx-auto">
                <h3 className="text-base font-black text-slate-900">
                  Pusat Unduh Berkas Pedoman Operasional
                </h3>
                <p className="text-xs text-slate-600">
                  Unduh berkas pedoman resmi dalam berbagai format sesuai kebutuhan dokumen panitia, cetak, maupun arsip digital.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                {/* Download Word */}
                <div className="bg-white border-2 border-blue-200 hover:border-blue-500 rounded-2xl p-5 space-y-3 transition shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Dokumen Word (.doc / .docx)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Format dokumen resmi Microsoft Word lengkap dengan tata letak judul, tabel perbandingan peran, dan nomor urut kerja.
                    </p>
                  </div>
                  <button
                    onClick={downloadWordDoc}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Dokumen Word
                  </button>
                </div>

                {/* Download Text / Google Docs */}
                <div className="bg-white border-2 border-slate-200 hover:border-slate-500 rounded-2xl p-5 space-y-3 transition shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Google Docs / Teks (.txt)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Format teks bersih mentah yang sangat mudah di-copy paste langsung ke Google Docs, WhatsApp, atau dokumen digital.
                    </p>
                  </div>
                  <button
                    onClick={downloadTextDoc}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File Teks
                  </button>
                </div>

                {/* Download Excel Table */}
                <div className="bg-white border-2 border-emerald-200 hover:border-emerald-500 rounded-2xl p-5 space-y-3 transition shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                      <Table className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Tabel Excel (.csv / .xlsx)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tabel matriks perbandingan fungsi, tanggung jawab, dan aturan Do's & Don'ts untuk tiap peran panitia & penonton.
                    </p>
                  </div>
                  <button
                    onClick={downloadExcelTable}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Tabel Excel
                  </button>
                </div>

              </div>

              {/* Copy Quick Summary Box */}
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 mt-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Salin Ringkasan Cepat ke Clipboard</p>
                  <p className="text-[11px] text-slate-500">Salin ringkasan singkat pedoman untuk dikirimkan melalui grup WhatsApp panitia.</p>
                </div>
                <button
                  onClick={copyGuideSummary}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedNotification ? 'Tersalin!' : 'Salin Teks'}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-mono font-medium">
            Festival Teater Monolog Kata Kita 2026 • Taman Budaya Lampung
          </div>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Tutup Pedoman
          </button>
        </div>

      </div>
    </div>
  );
}
