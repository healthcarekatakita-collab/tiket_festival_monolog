/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import https from 'https';
import { createServer as createViteServer } from 'vite';

// Interfaces match /src/types.ts
interface TicketCategory {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  description: string;
}

interface OfflineCoordinator {
  name: string;
  phone: string;
}

interface EventSettings {
  eventTitle: string;
  subtitle: string;
  description: string;
  date: string;
  time: string;
  location: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  qrisUrl?: string;
  coordinators: OfflineCoordinator[];
  googleSheetsUrl?: string;
  googleAppsScriptUrl?: string;
}

interface IndividualTicket {
  ticketNumber: string;
  bookingCode: string;
  ownerName: string;
  categoryName: string;
  isCheckedIn: boolean;
  checkInTime: string | null;
  securityHash: string;
  accessCode?: string;
}

interface Booking {
  id: string;
  fullname: string;
  whatsapp: string;
  email: string;
  city: string;
  institution?: string;
  ticketCount: number;
  categoryId: string;
  bookingDate: string;
  status: 'Belum Bayar' | 'Menunggu Verifikasi' | 'Lunas' | 'Ditolak';
  verificationStatus: 'Belum Diverifikasi' | 'Disetujui' | 'Ditolak';
  paymentMethod: 'transfer' | 'offline';
  bankDetails?: {
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
  };
  paymentProof?: string;
  offlineDetails?: {
    coordinatorName: string;
    coordinatorPhone: string;
    receiptNumber: string;
  };
  offlineProof?: string;
  tickets: IndividualTicket[];
  rejectReason?: string;
  notes?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
}

interface EmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  body: string;
  status: 'Sent' | 'Failed';
}

const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to generate a unique hash for ticket verification
function generateSecurityHash(ticketNumber: string, bookingCode: string, ownerName: string): string {
  const secretSalt = 'KataKitaLampung2026FestivalMonolog';
  return crypto.createHash('sha256').update(`${ticketNumber}-${bookingCode}-${ownerName}-${secretSalt}`).digest('hex').substring(0, 16);
}

// Generate sequential ticket number FMKKL-2026-XXXXXX
function generateNextTicketNumber(lastNumber: number): string {
  const nextNum = lastNumber + 1;
  const padded = String(nextNum).padStart(6, '0');
  return `FMKKL-2026-${padded}`;
}

function generateUniqueAccessCode(db: any): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    code = 'TKT-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(crypto.randomInt(0, chars.length));
    }
    isUnique = !db.bookings.some((b: any) => b.tickets.some((t: any) => t.accessCode === code));
  }
  return code;
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Initialize default DB
function initializeDB() {
  const defaultCategories: TicketCategory[] = [
    {
      id: 'cat-umum',
      name: 'Umum (Reguler)',
      price: 35000,
      quota: 50,
      sold: 1,
      description: "Rasakan kedalaman emosi, kritik sosial, dan pementasan monolog paling spektakuler di Lampung! Kategori ini terbuka untuk seluruh pecinta seni teater, alumni, praktisi seni, dan masyarakat umum. Bersiaplah terhanyut dalam karakter kuat dan tata panggung yang memukau!"
    },
    {
      id: 'cat-pelajar',
      name: 'Pelajar / Mahasiswa',
      price: 35000,
      quota: 450,
      sold: 2,
      description: "Dukungan penuh untuk kreativitas generasi muda! Penawaran khusus bagi pelajar aktif (SMP/SMA/Sederajat) & mahasiswa se-Provinsi Lampung. Jadilah saksi perjuangan seni peran sekolah jagoanmu secara langsung di atas panggung megah! *Wajib menunjukkan Kartu Identitas Pelajar/Mahasiswa aktif di lokasi.*"
    }
  ];

  const defaultSettings: EventSettings = {
    eventTitle: 'Festival Monolog Komunitas Kata Kita',
    subtitle: 'Festival Monolog Pelajar Se-Provinsi Lampung 2026',
    description: 'Saksikan pementasan seni monolog paling spektakuler dan penuh emosi di Lampung! Festival Monolog Pelajar Se-Provinsi Lampung 2026 mempertemukan talenta-talenta muda berbakat dari berbagai sekolah menengah dan universitas untuk memperebutkan gelar penampil monolog terbaik se-Provinsi. Bersiaplah terhanyut dalam karakter-karakter yang kuat, penulisan naskah yang tajam, dan visual tata panggung yang memukau. Jadilah bagian dari sejarah kebangkitan teater remaja Lampung dan dukung perjuangan seni peran sekolah jagoanmu secara langsung di atas panggung megah Taman Budaya Lampung!',
    date: '22 - 23 Agustus 2026',
    time: '10:00 WIB - Selesai',
    location: 'Taman Budaya Lampung, Jalan Cut Nyak Dien No. 24, Palapa, Kecamatan Tanjung Karang Pusat, Kota Bandar Lampung',
    bankName: 'Bank Mandiri',
    bankAccount: '114-00-2234455-8',
    bankAccountName: 'Komunitas Kata Kita',
    coordinators: [
      { name: 'Rere (Hotline Panitia 1)', phone: '083125721380' },
      { name: 'EL (Hotline Panitia 2)', phone: '082159057672' }
    ],
    googleSheetsUrl: 'https://docs.google.com/spreadsheets/d/1example_sheets_id/edit',
    googleAppsScriptUrl: ''
  };

  // Seeding sample bookings with diverse schools/campuses
  const sampleBookings: Booking[] = [
    {
      id: 'A8D92F',
      fullname: 'Muhammad Farhan',
      whatsapp: '081277889900',
      email: 'farhan.m@gmail.com',
      city: 'Bandar Lampung',
      institution: 'Universitas Lampung',
      ticketCount: 1,
      categoryId: 'cat-pelajar',
      bookingDate: '2026-07-18T14:35:00.000Z',
      status: 'Lunas',
      verificationStatus: 'Disetujui',
      paymentMethod: 'transfer',
      bankDetails: {
        bankName: 'Bank Mandiri',
        bankAccount: '114-00-2234455-8',
        bankAccountName: 'Komunitas Kata Kita'
      },
      paymentProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      tickets: [
        {
          ticketNumber: 'FMKKL-2026-000001',
          bookingCode: 'A8D92F',
          ownerName: 'Muhammad Farhan',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000001', 'A8D92F', 'Muhammad Farhan'),
          accessCode: 'TKT-FAR88'
        }
      ],
      notes: 'Terverifikasi otomatis saat seed database.'
    },
    {
      id: 'SMN201',
      fullname: 'Dewi Lestari',
      whatsapp: '085766223344',
      email: 'dewi.lestari@gmail.com',
      city: 'Bandar Lampung',
      institution: 'SMAN 2 Bandar Lampung',
      ticketCount: 2,
      categoryId: 'cat-pelajar',
      bookingDate: '2026-07-19T09:12:00.000Z',
      status: 'Lunas',
      verificationStatus: 'Disetujui',
      paymentMethod: 'transfer',
      bankDetails: {
        bankName: 'Bank Mandiri',
        bankAccount: '114-00-2234455-8',
        bankAccountName: 'Komunitas Kata Kita'
      },
      paymentProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      tickets: [
        {
          ticketNumber: 'FMKKL-2026-000002',
          bookingCode: 'SMN201',
          ownerName: 'Dewi Lestari',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000002', 'SMN201', 'Dewi Lestari'),
          accessCode: 'TKT-DEW55'
        },
        {
          ticketNumber: 'FMKKL-2026-000003',
          bookingCode: 'SMN201',
          ownerName: 'Salsa Bila',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000003', 'SMN201', 'Salsa Bila'),
          accessCode: 'TKT-SAL22'
        }
      ]
    },
    {
      id: 'SMN301',
      fullname: 'Siti Aisyah',
      whatsapp: '081399887766',
      email: 'siti.aisyah@gmail.com',
      city: 'Bandar Lampung',
      institution: 'SMAN 3 Bandar Lampung',
      ticketCount: 3,
      categoryId: 'cat-pelajar',
      bookingDate: '2026-07-19T10:20:00.000Z',
      status: 'Lunas',
      verificationStatus: 'Disetujui',
      paymentMethod: 'transfer',
      bankDetails: {
        bankName: 'Bank Mandiri',
        bankAccount: '114-00-2234455-8',
        bankAccountName: 'Komunitas Kata Kita'
      },
      paymentProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      tickets: [
        {
          ticketNumber: 'FMKKL-2026-000004',
          bookingCode: 'SMN301',
          ownerName: 'Siti Aisyah',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000004', 'SMN301', 'Siti Aisyah'),
          accessCode: 'TKT-AIS11'
        },
        {
          ticketNumber: 'FMKKL-2026-000005',
          bookingCode: 'SMN301',
          ownerName: 'Bunga Citra',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000005', 'SMN301', 'Bunga Citra'),
          accessCode: 'TKT-BUN33'
        },
        {
          ticketNumber: 'FMKKL-2026-000006',
          bookingCode: 'SMN301',
          ownerName: 'Rina Nose',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000006', 'SMN301', 'Rina Nose'),
          accessCode: 'TKT-RIN44'
        }
      ]
    },
    {
      id: 'SMN302',
      fullname: 'Budi Santoso',
      whatsapp: '082188776655',
      email: 'budi.santoso@yahoo.com',
      city: 'Bandar Lampung',
      institution: 'SMAN 3 Bandar Lampung',
      ticketCount: 1,
      categoryId: 'cat-pelajar',
      bookingDate: '2026-07-20T08:15:00.000Z',
      status: 'Menunggu Verifikasi',
      verificationStatus: 'Belum Diverifikasi',
      paymentMethod: 'transfer',
      bankDetails: {
        bankName: 'Bank Mandiri',
        bankAccount: '114-00-2234455-8',
        bankAccountName: 'Komunitas Kata Kita'
      },
      paymentProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      tickets: [
        {
          ticketNumber: 'FMKKL-2026-000007',
          bookingCode: 'SMN302',
          ownerName: 'Budi Santoso',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000007', 'SMN302', 'Budi Santoso'),
          accessCode: 'TKT-BUD99'
        }
      ]
    },
    {
      id: 'SMN101',
      fullname: 'Andi Pratama',
      whatsapp: '081234567811',
      email: 'andi.pratama@gmail.com',
      city: 'Bandar Lampung',
      institution: 'SMAN 1 Bandar Lampung',
      ticketCount: 2,
      categoryId: 'cat-pelajar',
      bookingDate: '2026-07-20T09:30:00.000Z',
      status: 'Lunas',
      verificationStatus: 'Disetujui',
      paymentMethod: 'transfer',
      bankDetails: {
        bankName: 'Bank Mandiri',
        bankAccount: '114-00-2234455-8',
        bankAccountName: 'Komunitas Kata Kita'
      },
      paymentProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      tickets: [
        {
          ticketNumber: 'FMKKL-2026-000008',
          bookingCode: 'SMN101',
          ownerName: 'Andi Pratama',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000008', 'SMN101', 'Andi Pratama'),
          accessCode: 'TKT-AND11'
        },
        {
          ticketNumber: 'FMKKL-2026-000009',
          bookingCode: 'SMN101',
          ownerName: 'Reza Rahadian',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000009', 'SMN101', 'Reza Rahadian'),
          accessCode: 'TKT-REZ88'
        }
      ]
    },
    {
      id: 'XAV101',
      fullname: 'Maria Angelina',
      whatsapp: '089677889911',
      email: 'maria.angela@gmail.com',
      city: 'Bandar Lampung',
      institution: 'SMA Xaverius 1 Bandar Lampung',
      ticketCount: 1,
      categoryId: 'cat-pelajar',
      bookingDate: '2026-07-20T11:00:00.000Z',
      status: 'Lunas',
      verificationStatus: 'Disetujui',
      paymentMethod: 'offline',
      offlineDetails: {
        coordinatorName: 'Rere (Hotline Panitia 1)',
        coordinatorPhone: '083125721380',
        receiptNumber: 'KW-00122'
      },
      offlineProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      tickets: [
        {
          ticketNumber: 'FMKKL-2026-000010',
          bookingCode: 'XAV101',
          ownerName: 'Maria Angelina',
          categoryName: 'Pelajar / Mahasiswa',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000010', 'XAV101', 'Maria Angelina'),
          accessCode: 'TKT-MAR77'
        }
      ]
    },
    {
      id: 'MON456',
      fullname: 'Rian Hidayat',
      whatsapp: '089911223344',
      email: 'rian.hidayat@yahoo.com',
      city: 'Kalianda',
      institution: 'Umum',
      ticketCount: 1,
      categoryId: 'cat-umum',
      bookingDate: '2026-07-19T11:45:00.000Z',
      status: 'Ditolak',
      verificationStatus: 'Ditolak',
      paymentMethod: 'offline',
      offlineDetails: {
        coordinatorName: 'EL (Hotline Panitia 2)',
        coordinatorPhone: '082159057672',
        receiptNumber: 'KW-09887'
      },
      offlineProof: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      rejectReason: 'Foto bukti kwitansi tidak terbaca / buram. Silakan unggah ulang.',
      tickets: [
        {
          ticketNumber: 'FMKKL-2026-000011',
          bookingCode: 'MON456',
          ownerName: 'Rian Hidayat',
          categoryName: 'Umum (Reguler)',
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash('FMKKL-2026-000011', 'MON456', 'Rian Hidayat'),
          accessCode: 'TKT-RIA22'
        }
      ]
    }
  ];

  const defaultLogs: ActivityLog[] = [
    {
      id: 'log-1',
      timestamp: '2026-07-20T08:00:00.000Z',
      operator: 'Sistem',
      action: 'Inisialisasi Database',
      details: 'Sistem Tiket Online Monolog Lampung berhasil diinisialisasi.'
    }
  ];

  const defaultEmails: EmailLog[] = [
    {
      id: 'eml-1',
      timestamp: '2026-07-18T14:36:00.000Z',
      recipient: 'farhan.m@gmail.com',
      subject: 'Tiket Festival Monolog Anda Telah Disetujui',
      body: 'Selamat! Pembayaran Anda telah diverifikasi oleh panitia Festival Monolog Komunitas Kata Kita. Silakan klik tombol di bawah untuk mengunduh e-ticket Anda.',
      status: 'Sent'
    }
  ];

  const defaultDB = {
    eventSettings: defaultSettings,
    categories: defaultCategories,
    bookings: sampleBookings,
    logs: defaultLogs,
    emails: defaultEmails,
    ticketCounter: 3 // seed generated 3 ticket numbers
  };

  writeDB(defaultDB);
}

function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    initializeDB();
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    initializeDB();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
}

function saveDB(data: any) {
  writeDB(data);
}

// Log actions
function addLog(operator: string, action: string, details: string) {
  const db = getDB();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    operator,
    action,
    details
  };
  db.logs.unshift(newLog); // Put new logs at front
  saveDB(db);
}

// Log emails
function addEmail(recipient: string, subject: string, body: string, status: 'Sent' | 'Failed' = 'Sent') {
  const db = getDB();
  const newEmail: EmailLog = {
    id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    recipient,
    subject,
    body,
    status
  };
  db.emails.unshift(newEmail);
  saveDB(db);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON & URL Encoded parsers with high limits for base64 image proofs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize DB immediately
  getDB();

  // --- API ROUTES ---

  // Proxy image to bypass CORS limits on HTML Canvas downloads
  app.get('/api/proxy-image', (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('URL is required');
    }

    try {
      https.get(imageUrl, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
          return res.status(proxyRes.statusCode || 500).send('Failed to fetch image');
        }

        const contentType = proxyRes.headers['content-type'] || 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        proxyRes.pipe(res);
      }).on('error', (err) => {
        console.error('Proxy image error:', err);
        res.status(500).send('Error proxying image: ' + err.message);
      });
    } catch (error: any) {
      console.error('Proxy image exception:', error);
      res.status(500).send('Error: ' + error.message);
    }
  });

  // Endpoint to return pre-converted local logos as base64 to avoid cross-origin and path resolution issues in canvas rendering
  app.get('/api/assets/logos', (req, res) => {
    try {
      const festivalPath = path.join(process.cwd(), 'src/assets/images/festival_monolog_logo_1784564565784.jpg');
      const kataKitaPath = path.join(process.cwd(), 'src/assets/images/kata_kita_logo_1784564549101.jpg');

      let festivalLogoBase64 = '';
      let kataKitaLogoBase64 = '';

      if (fs.existsSync(festivalPath)) {
        const fileBuffer = fs.readFileSync(festivalPath);
        festivalLogoBase64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      } else {
        console.warn('Festival logo path not found:', festivalPath);
      }

      if (fs.existsSync(kataKitaPath)) {
        const fileBuffer = fs.readFileSync(kataKitaPath);
        kataKitaLogoBase64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      } else {
        console.warn('Kata Kita logo path not found:', kataKitaPath);
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.json({
        festivalLogo: festivalLogoBase64,
        kataKitaLogo: kataKitaLogoBase64
      });
    } catch (error: any) {
      console.error('Error loading local logo assets:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 1. GET Event Settings & Categories (Public)
  app.get('/api/event-settings', (req, res) => {
    try {
      const db = getDB();
      res.json({
        eventSettings: db.eventSettings,
        categories: db.categories
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal mengambil data event settings: ' + error.message });
    }
  });

  // 2. POST Update Event Settings (Admin Only)
  app.post('/api/admin/event-settings', (req, res) => {
    try {
      const db = getDB();
      const { settings, categories } = req.body;
      if (settings) {
        db.eventSettings = { ...db.eventSettings, ...settings };
      }
      if (categories) {
        db.categories = categories;
      }
      saveDB(db);
      addLog('Admin', 'Update Pengaturan Event', 'Memperbarui profil acara, kategori, atau harga tiket.');
      res.json({ success: true, eventSettings: db.eventSettings, categories: db.categories });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal memperbarui pengaturan: ' + error.message });
    }
  });

  // 3. GET Bookings (Admin Only)
  app.get('/api/admin/bookings', (req, res) => {
    try {
      const db = getDB();
      res.json({ bookings: db.bookings });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal mengambil data pembeli: ' + error.message });
    }
  });

  // 4. POST Submit Booking (Public Form)
  app.post('/api/bookings', (req, res) => {
    try {
      const db = getDB();
      const {
        fullname,
        whatsapp,
        email,
        city,
        institution,
        ticketCount,
        categoryId,
        paymentMethod,
        bankDetails,
        paymentProof,
        offlineDetails,
        offlineProof,
        ticketNames // Array of strings matching the count
      } = req.body;

      // Validation
      if (!fullname || !whatsapp || !email || !city || !ticketCount || !categoryId || !paymentMethod) {
        return res.status(400).json({ error: 'Silakan isi semua data yang wajib diisi.' });
      }

      // Check category and quota
      const categoryIndex = db.categories.findIndex((c: TicketCategory) => c.id === categoryId);
      if (categoryIndex === -1) {
        return res.status(404).json({ error: 'Kategori tiket tidak valid.' });
      }

      const category = db.categories[categoryIndex];
      const count = parseInt(ticketCount, 10);
      if (category.sold + count > category.quota) {
        return res.status(400).json({ error: `Kebutuhan tiket (${count}) melebihi kuota tersisa (${category.quota - category.sold}).` });
      }

      // Generate booking code: unique 6-character random letters/digits
      let bookingCode = '';
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
      let isCodeUnique = false;
      while (!isCodeUnique) {
        bookingCode = '';
        for (let i = 0; i < 6; i++) {
          bookingCode += chars.charAt(crypto.randomInt(0, chars.length));
        }
        isCodeUnique = !db.bookings.some((b: Booking) => b.id === bookingCode);
      }

      // Create individual tickets
      const tickets: IndividualTicket[] = [];
      let currentCounter = db.ticketCounter;

      for (let i = 0; i < count; i++) {
        currentCounter++;
        const ticketNumber = generateNextTicketNumber(currentCounter - 1);
        const ownerName = ticketNames && ticketNames[i] ? ticketNames[i] : `${fullname} [Ticket ${i + 1}]`;
        tickets.push({
          ticketNumber,
          bookingCode,
          ownerName,
          categoryName: category.name,
          isCheckedIn: false,
          checkInTime: null,
          securityHash: generateSecurityHash(ticketNumber, bookingCode, ownerName),
          accessCode: generateUniqueAccessCode(db)
        });
      }

      // Construct booking
      const newBooking: Booking = {
        id: bookingCode,
        fullname,
        whatsapp,
        email,
        city,
        institution: institution || 'Umum',
        ticketCount: count,
        categoryId,
        bookingDate: new Date().toISOString(),
        status: 'Menunggu Verifikasi', // Starts waiting for verification
        verificationStatus: 'Belum Diverifikasi',
        paymentMethod,
        tickets,
        notes: ''
      };

      if (paymentMethod === 'transfer') {
        newBooking.bankDetails = bankDetails || {
          bankName: db.eventSettings.bankName,
          bankAccount: db.eventSettings.bankAccount,
          bankAccountName: db.eventSettings.bankAccountName
        };
        newBooking.paymentProof = paymentProof;
      } else {
        newBooking.offlineDetails = offlineDetails;
        newBooking.offlineProof = offlineProof;
      }

      // Update quota sold
      db.categories[categoryIndex].sold += count;
      db.ticketCounter = currentCounter;
      db.bookings.unshift(newBooking); // Add to the top of the bookings list

      saveDB(db);
      addLog('Sistem', 'Pemesanan Tiket Baru', `Kode Booking ${bookingCode} diajukan oleh ${fullname} (${count}x ${category.name}).`);

      res.status(201).json({
        success: true,
        bookingCode,
        status: newBooking.status,
        ticketCount: newBooking.ticketCount
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal mengajukan pemesanan: ' + error.message });
    }
  });

  // 5. GET Check Ticket Status (Public)
  app.get('/api/bookings/check-status', (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Masukkan Kode Booking, Nomor WhatsApp, atau Kode Akses Tiket.' });
      }

      const q = String(query).trim().toUpperCase();
      const db = getDB();

      // First check: does the query match an individual ticket's accessCode?
      let foundTicketBooking: Booking | null = null;
      let matchedTicket: IndividualTicket | null = null;

      for (const b of db.bookings) {
        const ticket = b.tickets.find((t: IndividualTicket) => t.accessCode && t.accessCode.toUpperCase() === q);
        if (ticket) {
          foundTicketBooking = b;
          matchedTicket = ticket;
          break;
        }
      }

      if (foundTicketBooking && matchedTicket) {
        const { paymentProof, offlineProof, ...rest } = foundTicketBooking;
        const singleTicketBooking = {
          ...rest,
          tickets: [matchedTicket],
          isSingleTicketView: true // Flag to indicate direct, secure ticket access
        };
        return res.json({ bookings: [singleTicketBooking] });
      }

      // Search by exact Booking Code, Whatsapp, Ticket Number, or Name
      const bookings = db.bookings.filter((b: Booking) => {
        // 1. Booking Code match
        if (b.id.toUpperCase() === q) return true;

        // 2. Ticket Number match
        if (b.tickets && b.tickets.some((t: IndividualTicket) => t.ticketNumber.toUpperCase() === q)) return true;

        // 3. Name match (case-insensitive, minimum 3 chars query to prevent short query clutter)
        if (q.length >= 3 && b.fullname.toUpperCase().includes(q)) return true;

        // 4. Robust Phone match
        const cleanQuery = q.replace(/\D/g, '');
        if (cleanQuery.length >= 5) {
          const cleanWhatsapp = b.whatsapp.replace(/\D/g, '');
          
          // Strip leading 62 or 0 to compare suffixes
          const s1 = cleanWhatsapp.startsWith('62') ? cleanWhatsapp.substring(2) : (cleanWhatsapp.startsWith('0') ? cleanWhatsapp.substring(1) : cleanWhatsapp);
          const s2 = cleanQuery.startsWith('62') ? cleanQuery.substring(2) : (cleanQuery.startsWith('0') ? cleanQuery.substring(1) : cleanQuery);
          
          if (s1 && s2 && (s1 === s2 || s1.endsWith(s2) || s2.endsWith(s1))) {
            return true;
          }
        }

        return false;
      });

      if (bookings.length === 0) {
        return res.status(404).json({ error: 'Data pemesanan tidak ditemukan.' });
      }

      // Return matching bookings, stripping raw upload proof to keep response light
      const result = bookings.map((b: Booking) => {
        const { paymentProof, offlineProof, ...rest } = b;
        return rest;
      });

      res.json({ bookings: result });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal memverifikasi status tiket: ' + error.message });
    }
  });

  // 6. POST Verify Booking (Admin Action: Approve / Reject)
  app.post('/api/admin/bookings/verify', (req, res) => {
    try {
      const db = getDB();
      const { bookingId, action, rejectReason, notes, operatorName } = req.body;

      if (!bookingId || !action) {
        return res.status(400).json({ error: 'Parameter tidak lengkap.' });
      }

      const bookingIndex = db.bookings.findIndex((b: Booking) => b.id === bookingId);
      if (bookingIndex === -1) {
        return res.status(404).json({ error: 'Pemesanan tidak ditemukan.' });
      }

      const booking = db.bookings[bookingIndex];
      const operator = operatorName || 'Admin';

      if (action === 'approve') {
        booking.status = 'Lunas';
        booking.verificationStatus = 'Disetujui';
        booking.notes = notes || 'Disetujui oleh panitia.';
        booking.rejectReason = undefined;

        // Generate Simulated Email with individual ticket codes and direct links
        const ticketDetailsList = booking.tickets.map((t: any) => {
          const directUrl = `${process.env.APP_URL || 'http://localhost:3000'}/?ticket=${t.accessCode || ''}`;
          return `- ${t.ownerName}: [KODE AKSES: ${t.accessCode || 'N/A'}] \n  Link Langsung: ${directUrl}`;
        }).join('\n');

        const emailBody = `Yth. ${booking.fullname},
        
Selamat! Pembayaran Anda sebesar Rp ${(booking.tickets.length * (db.categories.find((c: any) => c.id === booking.categoryId)?.price || 0)).toLocaleString('id-ID')} telah diverifikasi oleh panitia Festival Monolog Komunitas Kata Kita.

Informasi Registrasi Penonton:
- Kode Booking: ${booking.id}
- Nama Pemesan: ${booking.fullname}
- Sekolah/Kampus: ${booking.institution || 'Umum'}
- Jumlah Tiket: ${booking.ticketCount} Lembar

Rincian Kode Akses E-Ticket untuk masing-masing penonton:
${ticketDetailsList}

Silakan bagikan link langsung di atas kepada masing-masing penonton bersangkutan atau klik link untuk melihat E-Ticket Anda sendiri. Anda juga bisa melacak status booking Anda kapan saja menggunakan Kode Booking Anda:
${process.env.APP_URL || 'http://localhost:3000'}/?code=${booking.id}

Salam hangat,
Panitia Festival Monolog Komunitas Kata Kita`;

        addEmail(booking.email, 'Tiket Festival Monolog Anda Telah Disetujui', emailBody, 'Sent');
        addLog(operator, 'Persetujuan Tiket', `Pemesanan ${booking.id} (${booking.fullname}) disetujui.`);
      } else if (action === 'reject') {
        booking.status = 'Ditolak';
        booking.verificationStatus = 'Ditolak';
        booking.rejectReason = rejectReason || 'Bukti pembayaran tidak sah atau tidak terbaca.';
        booking.notes = notes || '';

        // Generate Simulated Email for rejection
        const emailBody = `Yth. ${booking.fullname},
        
Maaf, pengajuan verifikasi pembayaran untuk pemesanan tiket Anda dengan Kode Booking ${booking.id} belum disetujui oleh panitia.

Alasan Penolakan:
"${booking.rejectReason}"

Silakan lakukan pendaftaran ulang atau hubungi narahubung panitia jika Anda merasa ini adalah kesalahan.

Salam hangat,
Panitia Festival Monolog Komunitas Kata Kita`;

        addEmail(booking.email, 'Pemberitahuan Verifikasi Tiket Ditangguhkan', emailBody, 'Sent');
        addLog(operator, 'Penolakan Tiket', `Pemesanan ${booking.id} (${booking.fullname}) ditolak. Alasan: ${booking.rejectReason}`);
      } else if (action === 'reset_pending') {
        booking.status = 'Menunggu Verifikasi';
        booking.verificationStatus = 'Menunggu Verifikasi';
        booking.rejectReason = undefined;
        booking.notes = notes || 'Status dikembalikan ke Menunggu Verifikasi oleh panitia.';

        addLog(operator, 'Reset Status Tiket', `Pemesanan ${booking.id} (${booking.fullname}) dikembalikan ke Menunggu Verifikasi.`);
      } else {
        return res.status(400).json({ error: 'Tindakan tidak valid.' });
      }

      db.bookings[bookingIndex] = booking;
      saveDB(db);

      res.json({ success: true, booking });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal memverifikasi tiket: ' + error.message });
    }
  });

  // 6b. POST Resend / Trigger Direct Email to Participant (Admin Action)
  app.post('/api/admin/emails/resend', (req, res) => {
    try {
      const { bookingId, operatorName } = req.body;
      if (!bookingId) {
        return res.status(400).json({ error: 'Kode Booking wajib dispesifikasikan.' });
      }

      const db = getDB();
      const booking = db.bookings.find((b: Booking) => b.id === bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Data pemesanan tidak ditemukan.' });
      }

      const categoryName = db.categories.find((c: any) => c.id === booking.categoryId)?.name || booking.categoryId;

      const ticketDetailsText = booking.tickets.map((t: any) => {
        const directUrl = `${process.env.APP_URL || 'http://localhost:3000'}/?ticket=${t.accessCode || ''}`;
        return `• Nama Penonton: ${t.ownerName}\n  Nomor Tiket : ${t.ticketNumber}\n  PIN Akses    : ${t.accessCode || 'N/A'}\n  Link E-Ticket: ${directUrl}`;
      }).join('\n\n');

      const emailSubject = `Konfirmasi E-Ticket Festival Monolog Lampung 2026 - [${booking.id}]`;
      const emailBody = `Yth. ${booking.fullname},

Berikut adalah rincian lengkap data registrasi penonton dan kode e-ticket resmi Anda:

----------------------------------------------------------------------
TABEL DATA PEMBELI & KONFIRMASI E-TICKET
----------------------------------------------------------------------
• Kode Booking                : ${booking.id}
• Nama Lengkap Pemesan         : ${booking.fullname}
• No. WhatsApp                : ${booking.whatsapp}
• Email Penonton               : ${booking.email}
• Instansi / Sekolah / Kampus : ${booking.institution || 'Umum'}
• Asal Kota                  : ${booking.city}
• Kategori Tiket             : ${categoryName}
• Jumlah Tiket               : ${booking.ticketCount} Lembar
• Status Pembayaran           : ${booking.status}

----------------------------------------------------------------------
RINCIAN KODE AKSES TIKET INDIVIDUAL (UNTUK CETAK E-TICKET)
----------------------------------------------------------------------
${ticketDetailsText}

Tunjukkan QR Code E-Ticket ini saat memasuki Gate Registrasi Panggung Taman Budaya Lampung.

Salam hangat,
Panitia Festival Monolog Komunitas Kata Kita`;

      addEmail(booking.email, emailSubject, emailBody, 'Sent');
      addLog(operatorName || 'Admin', 'Kirim Email Manual', `Email konfirmasi E-Ticket berhasil dikirimkan ke ${booking.email} (Kode Booking: ${booking.id}).`);

      res.json({ success: true, message: `Email konfirmasi e-ticket berhasil dikirim ke ${booking.email}` });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal mengirim email: ' + error.message });
    }
  });

  // 6c. POST Bulk Send Email for All Lunas Bookings
  app.post('/api/admin/emails/bulk-send', (req, res) => {
    try {
      const db = getDB();
      const lunasBookings = db.bookings.filter((b: Booking) => b.status === 'Lunas');
      let sentCount = 0;

      for (const booking of lunasBookings) {
        const categoryName = db.categories.find((c: any) => c.id === booking.categoryId)?.name || booking.categoryId;
        const ticketDetailsText = booking.tickets.map((t: any) => {
          return `• Nama Penonton: ${t.ownerName} | No Tiket: ${t.ticketNumber} | PIN: ${t.accessCode || 'N/A'}`;
        }).join('\n');

        const emailSubject = `Rincian E-Ticket Resmi Festival Monolog Lampung 2026 - [${booking.id}]`;
        const emailBody = `Yth. ${booking.fullname},

Berikut adalah rincian lengkap data registrasi penonton dan kode e-ticket resmi Anda:

----------------------------------------------------------------------
Rangkuman Registrasi
----------------------------------------------------------------------
• Kode Booking: ${booking.id}
• Nama Pemesan: ${booking.fullname}
• Sekolah/Kampus: ${booking.institution || 'Umum'}
• Kategori: ${categoryName}
• Jumlah Tiket: ${booking.ticketCount} Lembar
• Status: LUNAS VERIFIKASI

----------------------------------------------------------------------
PIN Akses Cetak E-Ticket:
----------------------------------------------------------------------
${ticketDetailsText}

Salam hangat,
Panitia Festival Monolog Komunitas Kata Kita`;

        addEmail(booking.email, emailSubject, emailBody, 'Sent');
        sentCount++;
      }

      addLog('Super Admin', 'Kirim Email Massal', `Mengirimkan email konfirmasi e-ticket secara massal ke ${sentCount} pemesanan bertatus Lunas.`);
      res.json({ success: true, count: sentCount, message: `Berhasil mengirim email massal ke ${sentCount} pemesanan Lunas.` });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal pengiriman email massal: ' + error.message });
    }
  });

  // 7. POST Delete Booking (Admin Only)
  app.delete('/api/admin/bookings/:id', (req, res) => {
    try {
      const db = getDB();
      const bookingId = req.params.id;
      const index = db.bookings.findIndex((b: Booking) => b.id === bookingId);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Booking tidak ditemukan.' });
      }

      const booking = db.bookings[index];
      
      // Release quota
      const categoryIndex = db.categories.findIndex((c: TicketCategory) => c.id === booking.categoryId);
      if (categoryIndex !== -1) {
        db.categories[categoryIndex].sold = Math.max(0, db.categories[categoryIndex].sold - booking.ticketCount);
      }

      db.bookings.splice(index, 1);
      saveDB(db);
      addLog('Admin', 'Hapus Booking', `Menghapus booking ${bookingId} milik ${booking.fullname} dan mengembalikan kuota.`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal menghapus booking: ' + error.message });
    }
  });

  // 8. POST Gate Check-In (Live Scanning gate staff)
  app.post('/api/admin/check-in', (req, res) => {
    try {
      const { ticketNumber, hash, operatorName } = req.body;
      if (!ticketNumber) {
        return res.status(400).json({ error: 'Nomor tiket wajib diisi.' });
      }

      const db = getDB();
      let foundTicket: IndividualTicket | null = null;
      let foundBooking: Booking | null = null;

      // Find ticket and booking
      for (const booking of db.bookings) {
        const ticketIdx = booking.tickets.findIndex((t: IndividualTicket) => t.ticketNumber === ticketNumber);
        if (ticketIdx !== -1) {
          foundTicket = booking.tickets[ticketIdx];
          foundBooking = booking;
          break;
        }
      }

      if (!foundTicket || !foundBooking) {
        return res.status(404).json({ error: 'Tiket tidak valid atau tidak terdaftar dalam sistem.' });
      }

      // Check anti-counterfeit hash
      const computedHash = generateSecurityHash(foundTicket.ticketNumber, foundTicket.bookingCode, foundTicket.ownerName);
      if (hash && hash !== computedHash) {
        return res.status(400).json({ error: 'Peringatan Keamanan! Tanda tangan digital tiket tidak cocok (kemungkinan tiket palsu).' });
      }

      // Ticket must belong to an approved booking (Status Lunas)
      if (foundBooking.status !== 'Lunas') {
        return res.status(400).json({ error: `Registrasi ditangguhkan. Status pemesanan tiket ini adalah: "${foundBooking.status}".` });
      }

      // Check if already checked in
      if (foundTicket.isCheckedIn) {
        return res.status(400).json({
          error: 'Tiket sudah pernah digunakan!',
          ownerName: foundTicket.ownerName,
          ticketNumber: foundTicket.ticketNumber,
          categoryName: foundTicket.categoryName,
          checkInTime: foundTicket.checkInTime
        });
      }

      // Successful check-in!
      const checkInTimeStr = new Date().toISOString();
      foundTicket.isCheckedIn = true;
      foundTicket.checkInTime = checkInTimeStr;

      // Update in database
      const bookingIdx = db.bookings.findIndex((b: Booking) => b.id === foundBooking!.id);
      const ticketIdx = db.bookings[bookingIdx].tickets.findIndex((t: IndividualTicket) => t.ticketNumber === ticketNumber);
      db.bookings[bookingIdx].tickets[ticketIdx] = foundTicket;
      
      saveDB(db);

      const op = operatorName || 'Gate Staff';
      addLog(op, 'Check-In Pengunjung', `Tiket ${ticketNumber} (${foundTicket.ownerName} - ${foundTicket.categoryName}) berhasil check-in di gate.`);

      res.json({
        success: true,
        message: 'Check-In Sukses!',
        ticket: foundTicket
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal memproses check-in: ' + error.message });
    }
  });

  // 9. GET Activity Logs (Admin Only)
  app.get('/api/admin/logs', (req, res) => {
    try {
      const db = getDB();
      res.json({ logs: db.logs || [] });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal mengambil data logs: ' + error.message });
    }
  });

  // 10. GET Email Logs (Admin Only)
  app.get('/api/admin/emails', (req, res) => {
    try {
      const db = getDB();
      res.json({ emails: db.emails || [] });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal mengambil email logs: ' + error.message });
    }
  });

  // 11. POST Reset System Data (Admin Super Only)
  app.post('/api/admin/reset-system', (req, res) => {
    try {
      initializeDB();
      addLog('Super Admin', 'Reset Sistem', 'Seluruh data pemesanan, tiket, log, dan email berhasil di-reset ke data bawaan (seeding).');
      res.json({ success: true, message: 'Sistem berhasil di-reset ke kondisi awal.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Gagal mereset sistem: ' + error.message });
    }
  });

  // 12. POST Admin Authentication
  app.post('/api/admin/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Harap isi username dan password.' });
      }

      // Check users
      if (username === 'admin' && password === 'adminkata123') {
        return res.json({
          success: true,
          user: { username: 'admin', name: 'Super Admin Panitia', role: 'Super Admin' }
        });
      } else if (username === 'verifikator' && password === 'verif123') {
        return res.json({
          success: true,
          user: { username: 'verifikator', name: 'Siti Rahma (Verifikator)', role: 'Verifikator' }
        });
      } else if (username === 'gatestaff' && password === 'gate123') {
        return res.json({
          success: true,
          user: { username: 'gatestaff', name: 'Andi Wijaya (Gate Staff)', role: 'Gate Staff' }
        });
      }

      res.status(401).json({ error: 'Username atau password salah.' });
    } catch (error: any) {
      res.status(500).json({ error: 'Kesalahan sistem saat login: ' + error.message });
    }
  });

  // --- VITE MIDDLEWARE INTEGRATION ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Backend] Running on http://localhost:${PORT}`);
  });
}

startServer();
