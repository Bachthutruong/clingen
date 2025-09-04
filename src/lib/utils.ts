import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('vi-VN')
  }
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function formatDateSimple(date: Date | string): string {
  if (typeof date === 'string') {
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('vi-VN')
  }
  return date.toLocaleDateString('vi-VN')
}

export function formatDateTime(dateString?: string | Date): string {
  if (!dateString) return 'Chưa có'
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleString('vi-VN')
}

// Role management utilities
export const ROLE_CODES = {
  ADMIN: 1,
  TIEP_NHAN_HO_SO: 2,
  BAC_SI: 3,
  TAI_CHINH_KE_TOAN: 4
} as const

export const ROLE_NAMES = {
  [ROLE_CODES.ADMIN]: 'ADMIN',
  [ROLE_CODES.TIEP_NHAN_HO_SO]: 'Tiếp nhận hồ sơ',
  [ROLE_CODES.BAC_SI]: 'Bác sĩ',
  [ROLE_CODES.TAI_CHINH_KE_TOAN]: 'Tài chính - Kế toán'
} as const

export type RoleCode = typeof ROLE_CODES[keyof typeof ROLE_CODES]

// Map roleCode to role string
export function mapRoleCodeToRole(roleCode: number): string {
  switch (roleCode) {
    case ROLE_CODES.ADMIN:
      return 'admin'
    case ROLE_CODES.TIEP_NHAN_HO_SO:
      return 'receptionist'
    case ROLE_CODES.BAC_SI:
      return 'lab_technician'
    case ROLE_CODES.TAI_CHINH_KE_TOAN:
      return 'accountant'
    default:
      return 'admin'
  }
}

// Map role string to roleCode
export function mapRoleToRoleCode(role: string): number {
  switch (role) {
    case 'admin':
      return ROLE_CODES.ADMIN
    case 'receptionist':
      return ROLE_CODES.TIEP_NHAN_HO_SO
    case 'lab_technician':
      return ROLE_CODES.BAC_SI
    case 'accountant':
      return ROLE_CODES.TAI_CHINH_KE_TOAN
    default:
      return ROLE_CODES.ADMIN
  }
}

// Get role display name
export function getRoleDisplayName(roleCode: number): string {
  return ROLE_NAMES[roleCode as RoleCode] || 'Không xác định'
} 