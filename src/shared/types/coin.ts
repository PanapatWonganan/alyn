/**
 * Coin and transaction-related types
 * ประเภทข้อมูลที่เกี่ยวข้องกับเหรียญและธุรกรรม
 */

import { TransactionType, TopupPackage, TOPUP_PACKAGES, REVENUE_SPLIT } from '../constants';
import { UserSummary } from './user';

// ==================== Transaction Types ====================

/**
 * บันทึกธุรกรรมเหรียญ
 */
export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: Date | string;
  userId: string;

  // Optional user info for display
  user?: UserSummary;
}

/**
 * ข้อมูลสำหรับการกรองธุรกรรม
 */
export interface TransactionFilterParams {
  userId?: string;
  type?: TransactionType;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number;
  limit?: number;
}

/**
 * สถิติธุรกรรม
 */
export interface TransactionStats {
  totalTopup: number;
  totalPurchase: number;
  totalEarning: number;
  totalDonationSent: number;
  totalDonationReceived: number;
  netBalance: number; // total topup + earning + donation received - purchase - donation sent
}

// ==================== Topup Types ====================

// Re-export TopupPackage and packages from constants
export type { TopupPackage };
export { TOPUP_PACKAGES };

/**
 * ข้อมูลสำหรับการเติมเหรียญ
 */
export interface TopupRequest {
  packageIndex: number; // Index in TOPUP_PACKAGES array
  paymentMethod: 'credit_card' | 'promptpay' | 'truewallet'; // Payment methods (example)
}

/**
 * ผลลัพธ์จากการเติมเหรียญ
 */
export interface TopupResponse {
  success: boolean;
  message: string;
  transaction?: TransactionRecord;
  newCoinBalance: number;
  coinsAdded: number; // Including bonus
}

// ==================== Purchase Types ====================

/**
 * ข้อมูลสำหรับการซื้อตอน
 */
export interface PurchaseRequest {
  chapterId: string;
}

/**
 * ผลลัพธ์จากการซื้อตอน
 */
export interface PurchaseResponse {
  success: boolean;
  message: string;
  transaction?: TransactionRecord;
  newCoinBalance: number;
  coinSpent: number;
}

// ==================== Donation Types ====================

/**
 * ข้อมูลการทิป/บริจาค
 */
export interface Donation {
  id: string;
  amount: number;
  message: string | null;
  createdAt: Date | string;
  senderId: string;
  receiverId: string;

  // User info for display
  sender?: UserSummary;
  receiver?: UserSummary;
}

/**
 * ข้อมูลสำหรับการส่งทิป
 */
export interface DonationRequest {
  receiverId: string; // Writer user ID
  amount: number;
  message?: string;
}

/**
 * ผลลัพธ์จากการส่งทิป
 */
export interface DonationResponse {
  success: boolean;
  message: string;
  donation?: Donation;
  newCoinBalance: number;
  coinSpent: number;
}

/**
 * ข้อมูลสำหรับการกรองการทิป
 */
export interface DonationFilterParams {
  senderId?: string;
  receiverId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  page?: number;
  limit?: number;
}

/**
 * สถิติการทิป
 */
export interface DonationStats {
  totalSent: number;
  totalReceived: number;
  totalEarnings: number; // After platform cut (90%)
  donorCount: number; // Unique donors
  recipientCount: number; // Unique recipients (if user sent donations)
}

// ==================== Revenue & Earnings Types ====================

// Re-export revenue split constants
export { REVENUE_SPLIT };

/**
 * รายละเอียดรายได้ของนักเขียน
 */
export interface WriterEarnings {
  userId: string;

  // Chapter sales
  chapterSales: number; // Total coins from chapter purchases
  chapterEarnings: number; // After platform cut (70%)

  // Donations
  donationsReceived: number; // Total coins from donations
  donationEarnings: number; // After platform cut (90%)

  // Total
  totalEarnings: number; // chapterEarnings + donationEarnings

  // Withdrawal (future feature)
  totalWithdrawn?: number;
  availableBalance?: number;
}

/**
 * สถิติรายได้ของแพลตฟอร์ม
 */
export interface PlatformRevenue {
  // Chapter sales
  chapterRevenue: number; // 30% of chapter sales

  // Donations
  donationRevenue: number; // 10% of donations

  // Total
  totalRevenue: number;

  // Period
  startDate: string;
  endDate: string;
}

/**
 * รายงานรายได้รายเดือน
 */
export interface MonthlyEarningsReport {
  userId: string;
  year: number;
  month: number;

  chapterSales: number;
  chapterEarnings: number;
  donationsReceived: number;
  donationEarnings: number;
  totalEarnings: number;

  // Breakdown
  purchaseCount: number;
  donationCount: number;
  uniqueReaders: number;
}

/**
 * ข้อมูลการถอนเงิน (future feature)
 */
export interface WithdrawalRequest {
  amount: number;
  bankAccount: string;
  bankName: string;
  accountName: string;
}

/**
 * ผลลัพธ์จากการถอนเงิน
 */
export interface WithdrawalResponse {
  success: boolean;
  message: string;
  withdrawalId?: string;
  amount: number;
  fee: number;
  netAmount: number;
  newBalance: number;
  estimatedTransferDate: string;
}
