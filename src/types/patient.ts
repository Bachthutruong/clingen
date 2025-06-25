export interface Patient {
  id: string
  patientCode: string
  name: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  phone: string
  email?: string
  address: string
  idNumber: string
  referralSource?: ReferralSource
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  createdAt: string
  updatedAt: string
}

export interface ReferralSource {
  id: string
  name: string
  type: 'hospital' | 'clinic' | 'doctor' | 'self' | 'other'
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  priceModifier?: number // Giá có thể khác nhau theo nguồn gửi
  createdAt: string
}

export interface TestService {
  id: string
  code: string
  name: string
  category: TestCategory
  basePrice: number
  description?: string
  normalRange?: string
  unit?: string
  preparationInstructions?: string
  isActive: boolean
  createdAt: string
}

export interface TestCategory {
  id: string
  name: string
  code: string
  description?: string
}

export interface Registration {
  id: string
  patientId: string
  patient: Patient
  registrationDate: string
  referralSourceId?: string
  referralSource?: ReferralSource
  services: RegistrationService[]
  totalAmount: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface RegistrationService {
  id: string
  serviceId: string
  service: TestService
  price: number
  status: 'pending' | 'collecting' | 'testing' | 'completed'
  result?: TestResult
}

export interface TestResult {
  id: string
  registrationServiceId: string
  value: string
  normalRange?: string
  unit?: string
  interpretation?: 'normal' | 'abnormal' | 'critical'
  notes?: string
  testedBy: string
  testedAt: string
  verifiedBy?: string
  verifiedAt?: string
} 