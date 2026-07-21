/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, AlertCircle, XCircle, Search, Filter, Trash2, Eye, 
  Settings, Database, FileText, Mail, LogOut, Check, X, ShieldAlert, 
  Plus, HelpCircle, Save, RotateCcw, Camera, Download, RefreshCw, Smartphone
} from 'lucide-react';
import { Booking, TicketCategory, EventSettings, ActivityLog, EmailLog, AdminUser, IndividualTicket } from '../types';
import QRCodeScanner from './QRCodeScanner';

interface AdminHubProps {
  eventSettings: EventSettings;
  categories: TicketCategory[];
  onRefreshAll: () => void;
}

export default function AdminHub({ eventSettings, categories, onRefreshAll }: AdminHubProps) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin View state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pembeli' | 'scanner' | 'settings' | 'sheets' | 'logs' | 'emails'>('dashboard');
  
  // Data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  // Search, Filter, Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Booking details modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Settings state
  const [editedSettings, setEditedSettings] = useState<EventSettings>({ ...eventSettings });
  const [editedCategories, setEditedCategories] = useState<TicketCategory[]>([...categories]);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setAdminUser(parsed);
        setIsAdminLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  // Fetch admin data when logged in
  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminLoggedIn, activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, logsRes, emailsRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/logs'),
        fetch('/api/admin/emails')
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        setBookings(bData.bookings);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs);
      }
      if (emailsRes.ok) {
        const eData = await emailsRes.json();
        setEmails(eData.emails);
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAdminUser(data.user);
        setIsAdminLoggedIn(true);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        setUsername('');
        setPassword('');
      } else {
        setLoginError(data.error || 'Login gagal.');
      }
    } catch (err: any) {
      setLoginError('Koneksi gagal: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    setAdminUser(null);
    setIsAdminLoggedIn(false);
  };

  // Approve / Reject handler
  const handleVerifyBooking = async (bookingId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectReason.trim()) {
      alert('Harap masukkan alasan penolakan tiket.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/bookings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action,
          rejectReason: action === 'reject' ? rejectReason : undefined,
          notes: adminNotes,
          operatorName: adminUser?.name || 'Admin'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Refresh
        await fetchAdminData();
        onRefreshAll();
        setIsDetailModalOpen(false);
        setSelectedBooking(null);
        setRejectReason('');
        setAdminNotes('');
        alert(action === 'approve' ? 'Pemesanan berhasil disetujui!' : 'Pemesanan berhasil ditolak.');
      } else {
        alert('Gagal memverifikasi: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Kesalahan jaringan: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete booking handler
  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pemesanan dengan Kode Booking ${bookingId}? Kuota tiket akan dikembalikan.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Pemesanan berhasil dihapus.');
        fetchAdminData();
        onRefreshAll();
      } else {
        const d = await response.json();
        alert('Gagal menghapus: ' + d.error);
      }
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Reset System Handler
  const handleResetSystem = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin merestore sistem ke pengaturan pabrik? Semua data transaksi, tiket, logs akan dihapus dan di-seed ulang ke data bawaan.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/reset-system', {
        method: 'POST'
      });
      if (response.ok) {
        alert('Sistem berhasil di-reset.');
        fetchAdminData();
        onRefreshAll();
      }
    } catch (err: any) {
      alert('Gagal mereset: ' + err.message);
    }
  };

  // Update Event Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMessage('');
    try {
      const response = await fetch('/api/admin/event-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: editedSettings,
          categories: editedCategories
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSettingsSavedMessage('Pengaturan berhasil disimpan!');
        onRefreshAll();
        setTimeout(() => setSettingsSavedMessage(''), 3000);
      } else {
        alert('Gagal menyimpan: ' + data.error);
      }
    } catch (err: any) {
      alert('Koneksi gagal: ' + err.message);
    }
  };

  // Export Table to CSV
  const handleExportCSV = () => {
    if (bookings.length === 0) return;
    const headers = ['Kode Booking', 'Nama Lengkap', 'WhatsApp', 'Email', 'Kota', 'Instansi', 'Kategori', 'Jumlah Tiket', 'Tanggal Pemesanan', 'Status Pembayaran', 'Metode Pembayaran', 'Detail Nomor Tiket'];
    const rows = bookings.map(b => {
      const categoryName = categories.find(c => c.id === b.categoryId)?.name || b.categoryId;
      const ticketNumbers = b.tickets.map(t => `${t.ticketNumber} (${t.ownerName})`).join(' | ');
      return [
        b.id,
        b.fullname,
        b.whatsapp,
        b.email,
        b.city,
        b.institution || 'Umum',
        categoryName,
        b.ticketCount,
        new Date(b.bookingDate).toLocaleDateString('id-ID'),
        b.status,
        b.paymentMethod,
        ticketNumbers
      ];
    });

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Pemesanan_Festival_Monolog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Sheets Sync Simulator
  const handleTriggerSheetsSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2500);
    }, 1500);
  };

  // Calculate dynamic dashboard stats
  const totalLunasBookings = bookings.filter(b => b.status === 'Lunas');
  const revenue = totalLunasBookings.reduce((sum, b) => {
    const price = categories.find(c => c.id === b.categoryId)?.price || 0;
    return sum + (b.ticketCount * price);
  }, 0);

  const waitingCount = bookings.filter(b => b.status === 'Menunggu Verifikasi').length;
  const lunasCount = bookings.filter(b => b.status === 'Lunas').length;
  const rejectedCount = bookings.filter(b => b.status === 'Ditolak').length;

  const totalTicketsSold = bookings
    .filter(b => b.status === 'Lunas')
    .reduce((sum, b) => sum + b.ticketCount, 0);

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.whatsapp.includes(searchQuery) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tickets.some(t => 
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.accessCode && t.accessCode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    
    const matchesStatus = statusFilter === 'Semua' || b.status === statusFilter;
    const matchesCategory = categoryFilter === 'Semua' || b.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Paginate Bookings
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Code for Google Apps Script Code.gs
  const gasCode = `/**
 * Google Apps Script Backend for Festival Monolog Lampung Ticketing
 * Google Sheets Database Setup:
 * Create a sheet and rename sheets tab: "Pembeli", "Pembayaran", "Verifikasi", "Admin", "Log Aktivitas"
 * Deploy this script as Web App, Set access to: "Anyone, even anonymous"
 */

const SHEET_ID = "MASUKKAN_SHEET_ID_ANDA_DISINI";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === "submitForm") {
      return ContentService.createTextOutput(JSON.stringify(submitForm(payload.data)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "checkStatus") {
      return ContentService.createTextOutput(JSON.stringify(checkStatus(payload.query)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "approveTicket") {
      return ContentService.createTextOutput(JSON.stringify(approveTicket(payload.bookingId, payload.operator)))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "rejectTicket") {
      return ContentService.createTextOutput(JSON.stringify(rejectTicket(payload.bookingId, payload.reason, payload.operator)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: "Action not recognized" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitForm(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Pembeli");
  
  // Create randomized 6-char booking code
  const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = new Date();
  
  // Append data row
  sheet.appendRow([
    bookingCode,
    data.fullname,
    data.whatsapp,
    data.email,
    data.city,
    data.institution || 'Umum',
    data.ticketCount,
    data.categoryId,
    timestamp,
    "Menunggu Verifikasi",
    data.paymentMethod,
    data.ticketNames.join(", ")
  ]);
  
  logActivity("Sistem", "Pemesanan Baru", "Kode " + bookingCode + " diajukan oleh " + data.fullname);
  return { success: true, bookingCode: bookingCode, status: "Menunggu Verifikasi" };
}

function checkStatus(query) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Pembeli");
  const values = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < values.length; i++) {
    const code = values[i][0];
    const phone = String(values[i][2]);
    if (code === query || phone.includes(query)) {
      results.push({
        bookingCode: code,
        fullname: values[i][1],
        status: values[i][9],
        ticketCount: values[i][6],
        category: values[i][7]
      });
    }
  }
  return results;
}

function approveTicket(bookingId, operator) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Pembeli");
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === bookingId) {
      sheet.getRange(i + 1, 10).setValue("Lunas");
      logActivity(operator || "Admin", "Persetujuan Tiket", "Booking " + bookingId + " disetujui.");
      
      // Trigger Email
      sendEmailNotification(values[i][3], values[i][1], bookingId, "Disetujui");
      return { success: true };
    }
  }
  return { error: "Booking tidak ditemukan" };
}

function rejectTicket(bookingId, reason, operator) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Pembeli");
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === bookingId) {
      sheet.getRange(i + 1, 10).setValue("Ditolak");
      logActivity(operator || "Admin", "Penolakan Tiket", "Booking " + bookingId + " ditolak. Alasan: " + reason);
      
      // Trigger Email
      sendEmailNotification(values[i][3], values[i][1], bookingId, "Ditolak", reason);
      return { success: true };
    }
  }
  return { error: "Booking tidak ditemukan" };
}

function logActivity(operator, action, details) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Log Aktivitas");
  sheet.appendRow([new Date(), operator, action, details]);
}

function sendEmailNotification(email, name, bookingId, status, reason) {
  const subject = status === "Disetujui" 
    ? "Tiket Festival Monolog Anda Telah Disetujui" 
    : "Pemberitahuan Verifikasi Tiket Ditangguhkan";
    
  let body = "Yth. " + name + ",\\n\\n";
  if (status === "Disetujui") {
    body += "Pembayaran Anda untuk Tiket Festival Monolog Komunitas Kata Kita telah berhasil diverifikasi.\\n\\n";
    body += "Kode Booking: " + bookingId + "\\n\\n";
    body += "Silakan cek status pemesanan Anda di website resmi untuk mengunduh E-Ticket digital.";
  } else {
    body += "Maaf, verifikasi pembayaran untuk Kode Booking " + bookingId + " ditangguhkan.\\n\\n";
    body += "Alasan: \\"" + reason + "\\"\\n\\n";
    body += "Silakan hubungi narahubung panitia untuk bantuan lebih lanjut.";
  }
  
  MailApp.sendEmail(email, subject, body);
}`;

  // Custom mock data generator for dynamic Sales Charts (SVG Line chart)
  const salesHistory = [
    { date: '14 Jul', count: 2 },
    { date: '15 Jul', count: 5 },
    { date: '16 Jul', count: 3 },
    { date: '17 Jul', count: 12 },
    { date: '18 Jul', count: 18 },
    { date: '19 Jul', count: 22 },
    { date: '20 Jul', count: bookings.length } // actual database total bookings
  ];

  const maxChartCount = Math.max(...salesHistory.map(h => h.count), 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-orange-100/70 text-slate-800 flex flex-col font-sans" id="admin-hub">
      
      {/* 1. Admin Login View */}
      {!isAdminLoggedIn ? (
        <div className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-br from-indigo-150 via-sky-50 to-orange-100/60">
          <div className="w-full max-w-md bg-gradient-to-br from-indigo-50/95 via-sky-50/95 to-amber-50/95 border-2 border-indigo-200 shadow-2xl rounded-2xl p-8 relative overflow-hidden" id="admin-login-card">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-blue-600" />
            
            <div className="text-center mb-8">
              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded font-mono font-black">
                Sistem Otentikasi Gate
              </span>
              <h2 className="text-2xl font-black mt-3 text-slate-900 font-sans">Login Panitia Festival</h2>
              <p className="text-slate-500 text-xs mt-1 font-semibold">Sistem Tiket Festival Monolog Komunitas Kata Kita</p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-lg flex items-center gap-2 mb-6 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username panitia"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-mono text-sm transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-mono text-sm transition font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black py-2.5 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer text-sm font-sans"
                id="btn-admin-login-submit"
              >
                Masuk ke Dashboard
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-4 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-2">Informasi Akses Cepat</p>
              <div className="grid grid-cols-3 gap-1.5 text-[9px] text-slate-600 font-mono font-medium">
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <p className="font-black text-red-600">Super Admin</p>
                  <p>admin</p>
                  <p className="text-[8px] text-slate-500">adminkata123</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <p className="font-black text-indigo-600">Verifikator</p>
                  <p>verifikator</p>
                  <p className="text-[8px] text-slate-500">verif123</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <p className="font-black text-emerald-600">Gate Staff</p>
                  <p>gatestaff</p>
                  <p className="text-[8px] text-slate-500">gate123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        
        // 2. Logged In View
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-gradient-to-b from-indigo-100/95 via-sky-50/90 to-slate-100 border-b md:border-b-0 md:border-r-2 border-indigo-200 flex flex-col justify-between shrink-0 shadow-lg">
            <div>
              {/* Profile Card */}
              <div className="p-6 border-b-2 border-indigo-200 bg-indigo-100/80 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                  {adminUser?.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1">{adminUser?.name}</h4>
                  <span className="inline-block bg-indigo-50 border border-indigo-200 text-[10px] font-mono font-bold text-indigo-700 px-1.5 py-0.5 rounded mt-0.5">
                    {adminUser?.role}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-1 text-xs font-bold">
                {adminUser?.role !== 'Gate Staff' && (
                  <>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black shadow-md shadow-red-500/10' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                      id="nav-admin-dashboard"
                    >
                      <Users className="w-4.5 h-4.5" />
                      <span>Ringkasan & Tren</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('pembeli')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'pembeli' ? 'bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black shadow-md shadow-red-500/10' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                      id="nav-admin-pembeli"
                    >
                      <FileText className="w-4.5 h-4.5" />
                      <span>Data Pembeli</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setActiveTab('scanner')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'scanner' ? 'bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black shadow-md shadow-red-500/10' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                  id="nav-admin-scanner"
                >
                  <Camera className="w-4.5 h-4.5" />
                  <span>Gate Scanner Check-In</span>
                </button>

                {adminUser?.role === 'Super Admin' && (
                  <>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'settings' ? 'bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black shadow-md shadow-red-500/10' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                      id="nav-admin-settings"
                    >
                      <Settings className="w-4.5 h-4.5" />
                      <span>Atur Event & Kuota</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('sheets')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'sheets' ? 'bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black shadow-md shadow-red-500/10' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                      id="nav-admin-sheets"
                    >
                      <Database className="w-4.5 h-4.5" />
                      <span>Developer Sheet Hub</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('logs')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'logs' ? 'bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black shadow-md shadow-red-500/10' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                      id="nav-admin-logs"
                    >
                      <FileText className="w-4.5 h-4.5" />
                      <span>Logs Aktivitas</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('emails')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left cursor-pointer ${activeTab === 'emails' ? 'bg-gradient-to-r from-red-600 via-amber-500 to-blue-600 text-white font-black shadow-md shadow-red-500/10' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                      id="nav-admin-emails"
                    >
                      <Mail className="w-4.5 h-4.5" />
                      <span>Email Terkirim</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Logout Row */}
            <div className="p-4 border-t border-slate-200 flex flex-col gap-2">
              {adminUser?.role === 'Super Admin' && (
                <button
                  onClick={handleResetSystem}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  id="btn-admin-reset-db"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Bawaan Pabrik
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-700 font-extrabold py-2 rounded-xl text-xs transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
                id="btn-admin-logout"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                Logout Panitia
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-gradient-to-br from-sky-50 via-indigo-50/40 to-amber-50/50 text-slate-800 p-6 md:p-8 overflow-y-auto">
            
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && adminUser?.role !== 'Gate Staff' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 font-sans uppercase tracking-tight">Ringkasan Eksekutif</h2>
                  <p className="text-slate-600 text-xs mt-1 font-semibold">Status riil penjualan tiket, pemasukan, dan persetujuan saat ini.</p>
                </div>

                {/* KPI Cards Grid - Bright Diverse Gradients with Hover & Neon Glass Shadows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: Total Tiket Terjual (Amber Premium Glass) */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/35 to-orange-100/10 backdrop-blur-md border-2 border-amber-300 p-5 rounded-2xl flex items-center gap-4 shadow-[0_8px_32px_0_rgba(245,158,11,0.06)] hover:shadow-[0_12px_40px_0_rgba(245,158,11,0.15)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="p-3 bg-amber-100 border border-amber-200 text-amber-700 rounded-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Total Tiket Terjual</p>
                      <p className="text-2xl font-black text-amber-700 font-mono mt-0.5">{totalTicketsSold}</p>
                    </div>
                  </div>

                  {/* Card 2: Total Pemasukan (Emerald Premium Glass) */}
                  <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-100/35 to-teal-100/10 backdrop-blur-md border-2 border-emerald-300 p-5 rounded-2xl flex items-center gap-4 shadow-[0_8px_32px_0_rgba(16,185,129,0.06)] hover:shadow-[0_12px_40px_0_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Total Pemasukan</p>
                      <p className="text-2xl font-black text-emerald-700 font-mono mt-0.5">Rp {revenue.toLocaleString('id-ID')}</p>
                    </div>
                  </div>

                  {/* Card 3: Menunggu Verifikasi (Indigo Premium Glass) */}
                  <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-100/35 to-blue-100/10 backdrop-blur-md border-2 border-indigo-300 p-5 rounded-2xl flex items-center gap-4 shadow-[0_8px_32px_0_rgba(99,102,241,0.06)] hover:shadow-[0_12px_40px_0_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="p-3 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Menunggu Verifikasi</p>
                      <p className="text-2xl font-black text-indigo-700 font-mono mt-0.5">{waitingCount}</p>
                    </div>
                  </div>

                  {/* Card 4: Pemesanan Ditolak (Rose Premium Glass) */}
                  <div className="bg-gradient-to-br from-rose-500/10 via-rose-100/35 to-pink-100/10 backdrop-blur-md border-2 border-rose-300 p-5 rounded-2xl flex items-center gap-4 shadow-[0_8px_32px_0_rgba(244,63,94,0.06)] hover:shadow-[0_12px_40px_0_rgba(244,63,94,0.15)] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">Pemesanan Ditolak</p>
                      <p className="text-2xl font-black text-rose-700 font-mono mt-0.5">{rejectedCount}</p>
                    </div>
                  </div>
                </div>

                {/* Main section: Chart & Category Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Sales Area Line Chart (Left 7/12) */}
                  <div className="lg:col-span-8 bg-gradient-to-br from-indigo-50/70 to-white/95 border-2 border-indigo-200 rounded-2xl p-5 shadow-xl">
                    <h3 className="font-extrabold text-slate-800 text-base mb-4 font-sans">Tren Penjualan Tiket (7 Hari Terakhir)</h3>
                    
                    {/* Beautiful SVG Area Chart */}
                    <div className="h-64 w-full relative mt-4">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono">
                        {[4, 3, 2, 1, 0].map(i => (
                          <div key={i} className="flex items-center gap-2 border-b border-slate-100 pb-1 w-full">
                            <span className="w-6 text-right">{Math.round(maxChartCount * i / 4)}</span>
                            <div className="flex-1" />
                          </div>
                        ))}
                      </div>

                      {/* SVG Line / Area */}
                      <svg className="absolute inset-0 w-full h-full pt-2" viewBox="0 0 700 240" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Area Fill */}
                        <path
                          d={`M 10 240
                              L 10 ${240 - (salesHistory[0].count / maxChartCount * 220)}
                              L 125 ${240 - (salesHistory[1].count / maxChartCount * 220)}
                              L 240 ${240 - (salesHistory[2].count / maxChartCount * 220)}
                              L 355 ${240 - (salesHistory[3].count / maxChartCount * 220)}
                              L 470 ${240 - (salesHistory[4].count / maxChartCount * 220)}
                              L 585 ${240 - (salesHistory[5].count / maxChartCount * 220)}
                              L 700 ${240 - (salesHistory[6].count / maxChartCount * 220)}
                              L 700 240 Z`}
                          fill="url(#chartGradient)"
                        />

                        {/* Chart Line */}
                        <path
                          d={`M 10 ${240 - (salesHistory[0].count / maxChartCount * 220)}
                              L 125 ${240 - (salesHistory[1].count / maxChartCount * 220)}
                              L 240 ${240 - (salesHistory[2].count / maxChartCount * 220)}
                              L 355 ${240 - (salesHistory[3].count / maxChartCount * 220)}
                              L 470 ${240 - (salesHistory[4].count / maxChartCount * 220)}
                              L 585 ${240 - (salesHistory[5].count / maxChartCount * 220)}
                              L 700 ${240 - (salesHistory[6].count / maxChartCount * 220)}`}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />

                        {/* Hotspot circles */}
                        {salesHistory.map((h, i) => {
                          const x = 10 + i * (690 / 6);
                          const y = 240 - (h.count / maxChartCount * 220);
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="cursor-pointer"
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* Chart Bottom Dates Label */}
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-3 px-1">
                      {salesHistory.map((h, i) => (
                        <div key={i} className="text-center w-12">
                          <p className="text-slate-800 font-extrabold">{h.count} tkt</p>
                          <p className="text-[9px] text-slate-400 font-medium">{h.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket Quota Sales Tracking (Right 5/12) */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-amber-50/70 to-white/95 border-2 border-amber-200 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base mb-4 font-sans">Ketersediaan Kuota Tiket</h3>
                      <div className="space-y-4">
                        {categories.map(cat => {
                          const percent = Math.min(100, Math.round((cat.sold / cat.quota) * 100));
                          return (
                            <div key={cat.id} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-700 font-extrabold">{cat.name.split(' (')[0]}</span>
                                <span className="font-mono text-slate-500 font-semibold">
                                  {cat.sold} / <strong className="text-slate-800 font-black">{cat.quota}</strong> tkt
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${percent > 85 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-6 text-xs text-slate-500 space-y-1.5 font-medium leading-relaxed">
                      <p className="font-extrabold text-slate-800">Panduan Verifikasi:</p>
                      <p>1. Cek menu <span className="text-amber-600 font-extrabold">Data Pembeli</span> untuk menyaring pembeli yang statusnya <span className="text-amber-600 font-extrabold">Menunggu Verifikasi</span>.</p>
                      <p>2. Periksa kecocokan foto bukti bayar dengan nomor rekening penerima panitia.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DATA PEMBELI TABLE */}
            {activeTab === 'pembeli' && adminUser?.role !== 'Gate Staff' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 font-sans uppercase tracking-tight">Manajemen Data Pembeli</h2>
                    <p className="text-slate-600 text-xs mt-1 font-semibold">Kelola pendaftaran, review bukti pembayaran, dan ekspor laporan.</p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-4 py-2.5 rounded-xl border border-emerald-600/20 transition cursor-pointer shadow-md shadow-emerald-500/10"
                    id="btn-export-csv"
                  >
                    <Download className="w-4 h-4" />
                    Ekspor CSV (Excel)
                  </button>
                </div>

                {/* Filters and Search toolbar */}
                <div className="bg-gradient-to-r from-indigo-50/95 to-sky-50/95 border-2 border-indigo-200 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center shadow-md">
                  {/* Search Bar */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Cari Nama Pembeli, Email, Kode Booking, Nomor Tiket..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/60 focus:bg-white text-xs font-bold transition"
                    />
                  </div>

                  {/* Status Payment Filter */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg py-2 px-3.5 focus:outline-none focus:border-amber-500/60"
                    >
                      <option value="Semua">Semua Status Bayar</option>
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                      <option value="Lunas">Lunas</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="w-full md:w-auto shrink-0">
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg py-2 px-3.5 focus:outline-none focus:border-amber-500/60"
                    >
                      <option value="Semua">Semua Kategori</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Table Container */}
                <div className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-lg">
                  {loading ? (
                    <div className="text-center py-20 text-slate-500 space-y-2">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                      <p className="text-sm font-medium">Memuat database pembeli...</p>
                    </div>
                  ) : currentItems.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <p className="text-sm font-medium">Tidak ada data pembeli yang cocok dengan filter.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-mono tracking-wider uppercase text-[10px]">
                            <th className="py-4 px-4 font-black">Kode</th>
                            <th className="py-4 px-4 font-black">Pembeli</th>
                            <th className="py-4 px-4 font-black">Kategori</th>
                            <th className="py-4 px-4 font-black text-center">Tiket</th>
                            <th className="py-4 px-4 font-black">Metode</th>
                            <th className="py-4 px-4 font-black">Status</th>
                            <th className="py-4 px-4 font-black text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentItems.map((b) => {
                            const cat = categories.find(c => c.id === b.categoryId);
                            return (
                              <tr key={b.id} className="hover:bg-slate-50/50 text-slate-700 transition">
                                <td className="py-4.5 px-4 font-black font-mono text-slate-900 tracking-wider">
                                  {b.id}
                                </td>
                                <td className="py-4.5 px-4">
                                  <div>
                                    <p className="font-extrabold text-slate-900 text-sm leading-tight">{b.fullname}</p>
                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{b.whatsapp} | {b.email}</p>
                                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{b.city} • {b.institution}</p>

                                    {/* Sub-list of tickets & Security access PINs for committee ease */}
                                    {b.tickets && b.tickets.length > 0 && b.status === 'Lunas' && (
                                      <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-sm">
                                        <p className="text-[8px] text-amber-700 font-black tracking-wider uppercase font-mono">
                                          TIKET DIGITAL & KODE PIN AKSES ({b.tickets.length}):
                                        </p>
                                        <div className="space-y-1">
                                          {b.tickets.map((t: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-[9px] font-mono text-slate-500 gap-4 border-t border-slate-100 pt-1 mt-1 first:border-0 first:pt-0 first:mt-0">
                                              <span className="text-slate-800 truncate font-sans font-bold max-w-[100px]" title={t.ownerName}>
                                                {t.ownerName}
                                              </span>
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-amber-600 font-black">{t.ticketNumber}</span>
                                                <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-emerald-700 font-bold" title="PIN Kode Akses">
                                                  PIN: {t.accessCode || 'N/A'}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4.5 px-4">
                                  <span className="font-extrabold text-slate-800">{cat?.name.split(' (')[0] || b.categoryId}</span>
                                </td>
                                <td className="py-4.5 px-4 text-center">
                                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold font-mono">
                                    {b.ticketCount}x
                                  </span>
                                </td>
                                <td className="py-4.5 px-4">
                                  <span className="capitalize text-slate-600 text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-semibold">
                                    {b.paymentMethod === 'transfer' ? 'Transfer Bank' : 'Offline'}
                                  </span>
                                </td>
                                <td className="py-4.5 px-4">
                                  {b.status === 'Lunas' && (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                      Lunas
                                    </span>
                                  )}
                                  {b.status === 'Menunggu Verifikasi' && (
                                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200">
                                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                      Review
                                    </span>
                                  )}
                                  {b.status === 'Ditolak' && (
                                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-200">
                                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                      Ditolak
                                    </span>
                                  )}
                                </td>
                                <td className="py-4.5 px-4">
                                  <div className="flex justify-center items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedBooking(b);
                                        setIsDetailModalOpen(true);
                                      }}
                                      className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition cursor-pointer"
                                      title="Review Detail Pembeli"
                                      id={`btn-review-${b.id}`}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    
                                    {adminUser?.role === 'Super Admin' && (
                                      <button
                                        onClick={() => handleDeleteBooking(b.id)}
                                        className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded transition cursor-pointer"
                                        title="Hapus Pemesanan"
                                        id={`btn-delete-${b.id}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Footer */}
                  {totalPages > 1 && (
                    <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
                      <p className="text-slate-500 text-xs">
                        Menampilkan <span className="text-slate-800 font-extrabold">{indexOfFirstItem + 1}</span> - <span className="text-slate-800 font-extrabold">{Math.min(indexOfLastItem, filteredBookings.length)}</span> dari <span className="text-slate-800 font-extrabold">{filteredBookings.length}</span> pembeli
                      </p>
                      <div className="flex gap-1">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 rounded text-xs transition cursor-pointer shadow-sm"
                        >
                          Sebelumnya
                        </button>
                        {[...Array(totalPages)].map((_, idx) => (
                          <button
                            key={idx + 1}
                            onClick={() => handlePageChange(idx + 1)}
                            className={`px-3 py-1.5 rounded text-xs transition cursor-pointer ${currentPage === idx + 1 ? 'bg-amber-500 text-white font-black' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 rounded text-xs transition cursor-pointer shadow-sm"
                        >
                          Berikutnya
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: GATE SCANNER CHECK-IN */}
            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 font-sans uppercase tracking-tight">Gate Check-In Registrasi</h2>
                  <p className="text-slate-600 text-xs mt-1 font-semibold">Pindai QR Code E-Ticket pengunjung atau masukkan nomor tiket secara manual.</p>
                </div>

                {/* Mount the Real Scanner component */}
                <QRCodeScanner onSuccessCheckIn={fetchAdminData} bookings={bookings} />
              </div>
            )}

            {/* TAB 4: EVENT & KUOTA SETTINGS */}
            {activeTab === 'settings' && adminUser?.role === 'Super Admin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 font-sans uppercase tracking-tight">Konfigurasi Event & Kategori Tiket</h2>
                  <p className="text-slate-600 text-xs mt-1 font-semibold">Sesuaikan info festival, rekening bank panitia, kuota, dan harga masing-masing tiket.</p>
                </div>

                {settingsSavedMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{settingsSavedMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Event Profile Card */}
                  <div className="bg-gradient-to-br from-indigo-50/70 to-white/95 border-2 border-indigo-200 p-6 rounded-2xl space-y-4 shadow-md">
                    <h3 className="font-black text-slate-900 text-base border-b border-slate-200 pb-2 flex items-center gap-2 uppercase tracking-tight">
                      <Settings className="w-4.5 h-4.5 text-amber-500" />
                      Profil Festival
                    </h3>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Judul Event Utama</label>
                        <input
                          type="text"
                          value={editedSettings.eventTitle}
                          onChange={(e) => setEditedSettings({ ...editedSettings, eventTitle: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Sub-judul / Tagline</label>
                        <input
                          type="text"
                          value={editedSettings.subtitle}
                          onChange={(e) => setEditedSettings({ ...editedSettings, subtitle: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Deskripsi Festival</label>
                        <textarea
                          rows={3}
                          value={editedSettings.description}
                          onChange={(e) => setEditedSettings({ ...editedSettings, description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition resize-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">Tanggal Acara</label>
                          <input
                            type="text"
                            value={editedSettings.date}
                            onChange={(e) => setEditedSettings({ ...editedSettings, date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-bold mb-1">Jam Mulai</label>
                          <input
                            type="text"
                            value={editedSettings.time}
                            onChange={(e) => setEditedSettings({ ...editedSettings, time: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Lokasi Pementasan</label>
                        <input
                          type="text"
                          value={editedSettings.location}
                          onChange={(e) => setEditedSettings({ ...editedSettings, location: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment settings, Bank and Offline Coordinators */}
                  <div className="bg-gradient-to-br from-amber-50/70 to-white/95 border-2 border-amber-200 p-6 rounded-2xl space-y-4 shadow-md flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-base border-b border-slate-200 pb-2 flex items-center gap-2 uppercase tracking-tight">
                        <Database className="w-4.5 h-4.5 text-amber-500" />
                        Metode Pembayaran Transfer & Offline
                      </h3>

                      <div className="space-y-3.5 text-xs mt-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Nama Bank</label>
                            <input
                              type="text"
                              value={editedSettings.bankName}
                              onChange={(e) => setEditedSettings({ ...editedSettings, bankName: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-slate-500 font-bold mb-1">No. Rekening</label>
                            <input
                              type="text"
                              value={editedSettings.bankAccount}
                              onChange={(e) => setEditedSettings({ ...editedSettings, bankAccount: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1">Atas Nama Rekening</label>
                          <input
                            type="text"
                            value={editedSettings.bankAccountName}
                            onChange={(e) => setEditedSettings({ ...editedSettings, bankAccountName: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition"
                          />
                        </div>

                        {/* Ticket Quota Categories */}
                        <div className="border-t border-slate-200 pt-4 mt-2">
                          <p className="font-black text-slate-900 mb-2.5 uppercase tracking-tight">Harga & Kuota Tiket</p>
                          <div className="space-y-3.5">
                            {editedCategories.map((cat, idx) => (
                              <div key={cat.id} className="grid grid-cols-12 gap-2 items-center">
                                <span className="col-span-4 text-xs text-slate-700 font-extrabold truncate">{cat.name.split(' (')[0]}</span>
                                <div className="col-span-4">
                                  <input
                                    type="number"
                                    placeholder="Harga"
                                    value={cat.price}
                                    onChange={(e) => {
                                      const updated = [...editedCategories];
                                      updated[idx].price = parseInt(e.target.value, 10);
                                      setEditedCategories(updated);
                                    }}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-bold"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <input
                                    type="number"
                                    placeholder="Kuota"
                                    value={cat.quota}
                                    onChange={(e) => {
                                      const updated = [...editedCategories];
                                      updated[idx].quota = parseInt(e.target.value, 10);
                                      setEditedCategories(updated);
                                    }}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-bold"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex justify-end">
                      <button
                        type="submit"
                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md"
                        id="btn-save-settings"
                      >
                        <Save className="w-4 h-4" />
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            )}

            {/* TAB 5: DEVELOPER SHEETS GUIDE HUB */}
            {activeTab === 'sheets' && adminUser?.role === 'Super Admin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 font-sans uppercase tracking-tight">Developer & Google Sheets Integration Hub</h2>
                  <p className="text-slate-600 text-xs mt-1 font-semibold">Pelajari konfigurasi database Google Sheets Anda dan pasang kode Apps Script untuk integrasi real-time penuh.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Sheet Columns Schema Schema Guide (Left 5/12) */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/70 to-white/95 border-2 border-indigo-200 p-6 rounded-2xl space-y-5 shadow-md">
                    <div>
                      <h3 className="font-black text-slate-900 text-base border-b border-slate-200 pb-2 flex items-center gap-2 uppercase tracking-tight">
                        <Database className="w-4.5 h-4.5 text-amber-500" />
                        Struktur Sheet Database
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed font-semibold">
                        Buat Google Sheets baru di Drive Anda, beri nama tab sheet persis seperti di bawah ini, dan buat kolom baris pertama (A1, B1, ...) sesuai struktur berikut:
                      </p>
                    </div>

                    <div className="space-y-4 text-xs font-mono">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <p className="font-black text-amber-800 text-[11px] mb-1 font-sans">1. Tab Sheet: "Pembeli"</p>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                          A: Kode Booking | B: Nama Lengkap | C: WhatsApp | D: Email | E: Asal Kota | F: Instansi | G: Jml Tiket | H: Kategori | I: Tgl Booking | J: Status Bayar | K: Metode | L: Nama Pemilik
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <p className="font-black text-indigo-800 text-[11px] mb-1 font-sans">2. Tab Sheet: "Log Aktivitas"</p>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                          A: Timestamp | B: Operator | C: Action | D: Details
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <p className="font-black text-emerald-800 text-[11px] mb-1 font-sans">3. Integrasi Sync Webhook</p>
                        <p className="text-[10px] text-slate-600 mb-2 mt-1 font-semibold font-sans">Uji sinkronisasi proxy dari container Cloud Run ke Google Drive:</p>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={handleTriggerSheetsSync}
                            disabled={syncStatus === 'syncing'}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-50 text-slate-700 hover:text-slate-900 font-black text-[10px] px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
                            id="btn-trigger-sheets-sync"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                            <span>
                              {syncStatus === 'syncing' ? 'Menghubungkan...' : syncStatus === 'success' ? 'Sukses Sinkron!' : 'Tes Koneksi'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Apps Script Code.gs Generator (Right 7/12) */}
                  <div className="lg:col-span-7 bg-gradient-to-br from-amber-50/70 to-white/95 border-2 border-amber-200 p-6 rounded-2xl space-y-4 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-base flex items-center gap-2 uppercase tracking-tight">
                          <FileText className="w-4.5 h-4.5 text-amber-500" />
                          Google Apps Script (Code.gs)
                        </h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(gasCode);
                            alert('Kode Apps Script berhasil disalin ke clipboard!');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-amber-700 hover:text-amber-950 text-[10px] font-mono px-3 py-1.5 rounded-lg transition border border-slate-200 cursor-pointer shadow-sm font-bold"
                          id="btn-copy-gas-code"
                        >
                          Salin Kode
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed font-semibold">
                        Tempelkan seluruh kode ini pada editor Google Apps Script Anda (pilih Ekstensi - Apps Script), ganti ID spreadsheet Anda, lalu deploy sebagai Web App.
                      </p>
                    </div>

                    <div className="flex-1 mt-3">
                      <textarea
                        readOnly
                        rows={14}
                        value={gasCode}
                        className="w-full p-3 bg-slate-950 border border-slate-200 rounded-xl text-[10px] text-amber-300 font-mono focus:outline-none leading-relaxed shadow-inner"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 6: ACTIVITY LOGS */}
            {activeTab === 'logs' && adminUser?.role === 'Super Admin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 font-sans uppercase tracking-tight">Log Audit Aktivitas Sistem</h2>
                  <p className="text-slate-600 text-xs mt-1 font-semibold">Histori audit aktivitas panitia, persetujuan tiket, reset sistem, dan check-in gate.</p>
                </div>

                <div className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-mono uppercase text-[9px] tracking-wider">
                          <th className="py-3.5 px-4">Waktu</th>
                          <th className="py-3.5 px-4">Operator</th>
                          <th className="py-3.5 px-4">Tindakan</th>
                          <th className="py-3.5 px-4">Detail Logs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {logs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[10px] font-semibold">
                              {new Date(log.timestamp).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900">
                              {log.operator}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-amber-700 font-black font-mono text-[10px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-semibold">
                              {log.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: EMAILS LOG */}
            {activeTab === 'emails' && adminUser?.role === 'Super Admin' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 font-sans uppercase tracking-tight">Notifikasi Email Otomatis</h2>
                  <p className="text-slate-600 text-xs mt-1 font-semibold">Histori antrian email persetujuan/penolakan tiket yang berhasil dikirim ke penonton secara otomatis.</p>
                </div>

                <div className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-mono uppercase text-[9px] tracking-wider">
                          <th className="py-3.5 px-4">Waktu</th>
                          <th className="py-3.5 px-4">Penerima</th>
                          <th className="py-3.5 px-4">Subjek Email</th>
                          <th className="py-3.5 px-4">Isi Notifikasi</th>
                          <th className="py-3.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {emails.map(eml => (
                          <tr key={eml.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[10px] font-semibold shrink-0">
                              {new Date(eml.timestamp).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900">
                              {eml.recipient}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {eml.subject}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-semibold truncate max-w-xs" title={eml.body}>
                              {eml.body}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono">
                                Sent
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      {/* 3. REVIEW DETAILS MODAL (Pop-up workspace) */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md" id="detail-verification-modal">
          <div className="w-full max-w-3xl bg-gradient-to-br from-indigo-50/95 via-sky-50/95 to-amber-50/95 border-2 border-indigo-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-zoomIn">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-indigo-100/80 border-b-2 border-indigo-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-950 text-base uppercase tracking-tight">Detail Pembeli & Pembayaran</h3>
                <p className="text-[11px] text-slate-600 font-bold font-mono mt-0.5">Kode Booking: {selectedBooking.id}</p>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedBooking(null);
                  setRejectReason('');
                  setAdminNotes('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-150 rounded-xl transition cursor-pointer"
                id="btn-close-detail-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Buyer profile info */}
                <div className="space-y-4">
                  <h4 className="font-black text-amber-600 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 font-sans">
                    Identitas Pemohon
                  </h4>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Nama Pemesan</p>
                      <p className="font-extrabold text-slate-900 text-sm">{selectedBooking.fullname}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Kategori Tiket</p>
                      <p className="font-extrabold text-indigo-700">
                        {categories.find(c => c.id === selectedBooking.categoryId)?.name.split(' (')[0] || selectedBooking.categoryId}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">WhatsApp</p>
                      <p className="font-bold text-slate-800">{selectedBooking.whatsapp}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Email</p>
                      <p className="font-bold text-slate-800">{selectedBooking.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Asal Kota</p>
                      <p className="font-bold text-slate-800">{selectedBooking.city}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Instansi / Kampus</p>
                      <p className="font-bold text-slate-800">{selectedBooking.institution || 'Umum'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Jumlah Tiket</p>
                      <p className="font-black text-amber-600 font-mono text-sm">{selectedBooking.ticketCount} Lembar</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Tanggal Booking</p>
                      <p className="font-bold text-slate-800">
                        {new Date(selectedBooking.bookingDate).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Multi ticket names if count > 1 */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-slate-700 font-extrabold font-sans text-[10px]">Daftar Pemilik Tiket & Kode Akses Keamanan:</p>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {selectedBooking.tickets.map((t, idx) => (
                        <div key={idx} className="flex flex-col gap-1 bg-white p-3 rounded-xl border border-slate-150">
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="text-slate-900 font-black">{t.ownerName}</span>
                            <span className="text-amber-600 font-black">{t.ticketNumber}</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 border-t border-slate-100 pt-1 mt-1">
                            <span>KODE AKSES TIKET (PIN):</span>
                            <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-emerald-700 font-black select-all" title="Klik ganda untuk menyalin">
                              {t.accessCode || 'Belum Diterbitkan'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Payment details and uploaded proof */}
                <div className="space-y-4">
                  <h4 className="font-black text-amber-600 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 font-sans">
                    Metode & Bukti Transaksi
                  </h4>

                  {selectedBooking.paymentMethod === 'transfer' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400 font-extrabold font-mono text-[9px]">Pilihan Metode</p>
                          <p className="font-extrabold text-indigo-600">Transfer Bank</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-extrabold font-mono text-[9px]">Rekening Panitia</p>
                          <p className="font-bold text-slate-800">{eventSettings.bankName} - {eventSettings.bankAccount}</p>
                        </div>
                      </div>

                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Upload Foto Bukti Transfer</p>
                      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[180px] relative p-2">
                        {selectedBooking.paymentProof ? (
                          <img
                            src={selectedBooking.paymentProof}
                            alt="Bukti Transfer"
                            className="max-h-[220px] object-contain w-full hover:scale-105 transition duration-350 cursor-zoom-in rounded-xl"
                            referrerPolicy="no-referrer"
                            id="img-transfer-proof"
                          />
                        ) : (
                          <span className="text-slate-400 italic font-semibold">Bukti transfer kosong</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400 font-extrabold font-mono text-[9px]">Metode</p>
                          <p className="font-extrabold text-amber-600">Pembayaran Offline</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 font-extrabold font-mono text-[9px]">Kwitansi / Koordinator</p>
                          <p className="font-bold text-slate-800">{selectedBooking.offlineDetails?.receiptNumber} • {selectedBooking.offlineDetails?.coordinatorName.split(' ')[0]}</p>
                        </div>
                      </div>

                      <p className="text-slate-400 font-extrabold font-mono text-[9px] uppercase">Upload Kertas Bukti Lunas / Kwitansi</p>
                      <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[180px] relative p-2">
                        {selectedBooking.offlineProof ? (
                          <img
                            src={selectedBooking.offlineProof}
                            alt="Bukti Offline"
                            className="max-h-[220px] object-contain w-full hover:scale-105 transition duration-350 cursor-zoom-in rounded-xl"
                            referrerPolicy="no-referrer"
                            id="img-offline-proof"
                          />
                        ) : (
                          <span className="text-slate-400 italic font-semibold">Kertas kwitansi lunas kosong</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Form Actions (Approve / Reject Workspace) */}
              {selectedBooking.status === 'Menunggu Verifikasi' && (
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="font-black text-amber-600 text-xs uppercase tracking-wider font-sans">
                    Langkah Verifikasi Panitia
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rejection Cause input */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-bold">Alasan Penolakan (Hanya jika memilih Tolak Tiket)</label>
                      <textarea
                        rows={2}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Contoh: Foto bukti transfer terpotong, nominal kurang Rp 15.000, atau bukti buram."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-red-500 focus:bg-white font-bold transition resize-none leading-relaxed"
                      />
                    </div>

                    {/* Admin internal logs note */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-bold">Catatan Admin Internal (Opsional)</label>
                      <textarea
                        rows={2}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Catatan tambahan internal panitia..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-amber-500 focus:bg-white font-bold transition resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Actions Buttons Row */}
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleVerifyBooking(selectedBooking.id, 'reject')}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-xl transition text-xs cursor-pointer shadow-sm"
                      id="btn-verify-reject"
                    >
                      <X className="w-4 h-4" />
                      Tolak Pengajuan Tiket
                    </button>
                    <button
                      onClick={() => handleVerifyBooking(selectedBooking.id, 'approve')}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white font-black px-5 py-2.5 rounded-xl transition text-xs cursor-pointer shadow-md"
                      id="btn-verify-approve"
                    >
                      <Check className="w-4 h-4" />
                      Approve & Kirim E-Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
