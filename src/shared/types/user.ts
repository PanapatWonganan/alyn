/**
 * User-related types
 * ประเภทข้อมูลที่เกี่ยวข้องกับผู้ใช้
 */

import { UserRole } from '../constants';

// ==================== Core User Types ====================

/**
 * ข้อมูลโปรไฟล์สาธารณะของผู้ใช้
 * (ไม่รวมข้อมูลที่เป็นความลับเช่น passwordHash)
 */
export interface UserPublicProfile {
  id: string;
  email: string;
  name: string;
  penName: string | null;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  coinBalance: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * ข้อมูลผู้ใช้ในเซสชัน (JWT)
 * เก็บเฉพาะข้อมูลที่จำเป็นสำหรับ auth
 */
export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  penName: string | null;
  coinBalance: number;
}

/**
 * ข้อมูลโปรไฟล์ผู้ใช้แบบย่อ
 * ใช้สำหรับแสดงในรายการหรือการ์ด
 */
export interface UserSummary {
  id: string;
  name: string;
  penName: string | null;
  avatar: string | null;
  role: UserRole;
}

/**
 * ข้อมูลผู้ใช้แบบเต็ม (สำหรับ admin หรือโปรไฟล์ตัวเอง)
 */
export interface UserDetail extends UserPublicProfile {
  // สามารถเพิ่มข้อมูลเพิ่มเติมได้ เช่น statistics
  novelCount?: number;
  totalViews?: number;
  totalEarnings?: number;
}

// ==================== Auth Request Types ====================

/**
 * ข้อมูลสำหรับการเข้าสู่ระบบ
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * ข้อมูลสำหรับการลงทะเบียน
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  penName?: string;
}

/**
 * ข้อมูลสำหรับการรีเซ็ตรหัสผ่าน (ขอรีเซ็ต)
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * ข้อมูลสำหรับการรีเซ็ตรหัสผ่าน (ตั้งรหัสใหม่)
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * ข้อมูลสำหรับการเปลี่ยนรหัสผ่าน
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==================== Profile Update Types ====================

/**
 * ข้อมูลสำหรับการอัปเดตโปรไฟล์
 */
export interface UpdateProfileRequest {
  name?: string;
  penName?: string;
  avatar?: string;
  bio?: string;
}

// ==================== Auth Response Types ====================

/**
 * ผลลัพธ์จากการเข้าสู่ระบบหรือลงทะเบียน
 */
export interface AuthResponse {
  user: UserSession;
  message?: string;
}
