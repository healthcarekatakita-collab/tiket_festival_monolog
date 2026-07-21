/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TicketStatus = 'Belum Bayar' | 'Menunggu Verifikasi' | 'Lunas' | 'Ditolak';
export type VerificationStatus = 'Belum Diverifikasi' | 'Disetujui' | 'Ditolak';
export type AdminRole = 'Super Admin' | 'Verifikator' | 'Gate Staff';

export interface TicketCategory {
  id: string;
  name: string;
  price: number;
  quota: number;
  sold: number;
  description: string;
}

export interface OfflineCoordinator {
  name: string;
  phone: string;
}

export interface EventSettings {
  eventTitle: string;
  subtitle: string;
  description: string;
  date: string; // e.g., '2026-08-15'
  time: string; // e.g., '19:00 - Selesai'
  location: string; // e.g., 'Gedung Kesenian Lampung'
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  qrisUrl?: string; // Optional QRIS image
  coordinators: OfflineCoordinator[];
  googleSheetsUrl?: string;
  googleAppsScriptUrl?: string;
}

export interface IndividualTicket {
  ticketNumber: string; // FMKKL-2026-000001
  bookingCode: string;
  ownerName: string;
  categoryName: string;
  isCheckedIn: boolean;
  checkInTime: string | null;
  securityHash: string; // Anti-counterfeiting hash
  accessCode?: string; // Secure passcode/PIN for each ticket owner
}

export interface Booking {
  id: string; // Booking Code (e.g., A8D92F)
  fullname: string;
  whatsapp: string;
  email: string;
  city: string;
  institution?: string;
  ticketCount: number;
  categoryId: string;
  bookingDate: string;
  status: TicketStatus;
  verificationStatus: VerificationStatus;
  paymentMethod: 'transfer' | 'offline';
  
  // Transfer payment info
  bankDetails?: {
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
  };
  paymentProof?: string; // base64 or URL

  // Offline payment info
  offlineDetails?: {
    coordinatorName: string;
    coordinatorPhone: string;
    receiptNumber: string;
  };
  offlineProof?: string; // base64 or URL
  
  tickets: IndividualTicket[];
  rejectReason?: string;
  notes?: string;
}

export interface AdminUser {
  username: string;
  name: string;
  role: AdminRole;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  body: string;
  status: 'Sent' | 'Failed';
}
