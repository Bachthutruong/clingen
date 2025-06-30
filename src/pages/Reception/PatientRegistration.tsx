import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Phone, Mail, MapPin, Calendar, Users, Plus, Search, Loader2 } from 'lucide-react'
import { patientsApi, referralSourcesApi } from '@/services'
import type { ReferralSourceAPI, PatientAPI } from '@/types/api'

const patientSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  birthYear: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.number().min(0).max(2, 'Vui lòng chọn giới tính'),
  phoneNumber: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự').optional(),
  reasonForVisit: z.string().optional(),
  referralSourceId: z.number().optional(),
  guardianName: z.string().optional(),
  guardianPhoneNumber: z.string().optional(),
  guardianRelationship: z.string().optional(),
})

type PatientForm = z.infer<typeof patientSchema>

const PatientRegistration: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PatientAPI[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [referralSources, setReferralSources] = useState<ReferralSourceAPI[]>([])
  const [loadingReferralSources, setLoadingReferralSources] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  })

  // Fetch referral sources on component mount
  useEffect(() => {
    const fetchReferralSources = async () => {
      try {
        setLoadingReferralSources(true)
        const response = await referralSourcesApi.getAll({
          keyword: '',
          status: 1, // Active only
          pageIndex: 0,
          pageSize: 100,
          orderCol: 'name',
          isDesc: false
        })
        setReferralSources(response.content)
      } catch (error) {
        console.error('Error fetching referral sources:', error)
      } finally {
        setLoadingReferralSources(false)
      }
    }

    fetchReferralSources()
  }, [])

  const onSubmit = async (data: PatientForm) => {
    setIsSubmitting(true)
    
    try {
      // Create patient data in the format expected by API
      const patientData = {
        fullName: data.fullName,
        birthYear: data.birthYear, // String format as expected by API
        gender: data.gender,
        phoneNumber: data.phoneNumber,
        email: data.email || undefined,
        address: data.address || undefined,
        reasonForVisit: data.reasonForVisit || undefined,
        referralSourceId: data.referralSourceId || undefined,
        guardianName: data.guardianName || undefined,
        guardianPhoneNumber: data.guardianPhoneNumber || undefined,
        guardianRelationship: data.guardianRelationship || undefined,
        typeTests: [] // Will be set later during service selection
      }
      
      const response = await patientsApi.create(patientData)
      console.log(response)
      toast.success(`Đã đăng ký bệnh nhân thành công!`)
      reset()
    } catch (error) {
      console.error('Error creating patient:', error)
      toast.error('Có lỗi xảy ra khi đăng ký bệnh nhân. Vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearchExistingPatient = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      const response = await patientsApi.getAll({
        keyword: searchQuery,
        status: 1, // Active patients only
        pageIndex: 0,
        pageSize: 10,
        orderCol: 'fullName',
        isDesc: false
      })
      
      setSearchResults(response.content)
    } catch (error) {
      console.error('Error searching patients:', error)
      toast.error('Có lỗi xảy ra khi tìm kiếm bệnh nhân')
    } finally {
      setIsSearching(false)
    }
  }

  const fillPatientData = (patient: PatientAPI) => {
    setValue('fullName', patient.fullName)
    setValue('birthYear', patient.birthYear)
    setValue('gender', patient.gender)
    setValue('phoneNumber', patient.phoneNumber)
    setValue('email', patient.email || '')
    setValue('address', patient.address || '')
    setValue('reasonForVisit', patient.reasonForVisit || '')
    setValue('referralSourceId', patient.referralSourceId || undefined)
    setValue('guardianName', patient.guardianName || '')
    setValue('guardianPhoneNumber', patient.guardianPhoneNumber || '')
    setValue('guardianRelationship', patient.guardianRelationship || '')
    setSearchResults([])
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ''
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return (age - 1).toString()
    }
    return age.toString()
  }

  const getGenderLabel = (gender: number) => {
    switch (gender) {
      case 0: return 'Nam'
      case 1: return 'Nữ'
      case 2: return 'Khác'
      default: return 'Không xác định'
    }
  }

  const birthYear = watch('birthYear')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tiếp đón bệnh nhân</h1>
            <p className="text-blue-100">Nhập thông tin hành chính của bệnh nhân</p>
          </div>
        </div>
      </div>

      {/* Search Existing Patient */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search size={20} className="text-blue-600" />
            <span>Tìm kiếm bệnh nhân đã có</span>
          </CardTitle>
          <CardDescription>
            Tìm kiếm theo tên, số điện thoại
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Input
                  placeholder="Nhập thông tin tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchExistingPatient()}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={handleSearchExistingPatient}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6"
              >
                {isSearching ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Search size={16} className="mr-2" />
                )}
                Tìm kiếm
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <div className="p-3 bg-gray-50 border-b font-medium">
                  Kết quả tìm kiếm ({searchResults.length})
                </div>
                {searchResults.map(patient => (
                  <div 
                    key={patient.id}
                    className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => fillPatientData(patient)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{patient.fullName}</div>
                        <div className="text-sm text-gray-600">
                          SĐT: {patient.phoneNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          Sinh: {new Date(patient.birthYear).toLocaleDateString('vi-VN')} • 
                          Giới tính: {getGenderLabel(patient.gender)}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Chọn
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Registration Form */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus size={20} className="text-green-600" />
            <span>Đăng ký bệnh nhân mới</span>
          </CardTitle>
          <CardDescription>
            Điền đầy đủ thông tin hành chính của bệnh nhân
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center space-x-2">
                  <User size={16} />
                  <span>Họ và tên *</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Nguyễn Văn A"
                  {...register('fullName')}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthYear" className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Ngày sinh *</span>
                </Label>
                <Input
                  id="birthYear"
                  type="date"
                  {...register('birthYear')}
                  className={errors.birthYear ? 'border-red-500' : ''}
                />
                {birthYear && (
                  <p className="text-sm text-green-600">
                    Tuổi: {calculateAge(birthYear)}
                  </p>
                )}
                {errors.birthYear && (
                  <p className="text-sm text-red-500">{errors.birthYear.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center space-x-2">
                  <Users size={16} />
                  <span>Giới tính *</span>
                </Label>
                <select
                  id="gender"
                  {...register('gender', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn giới tính</option>
                  <option value={0}>Nam</option>
                  <option value={1}>Nữ</option>
                  <option value={2}>Khác</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-red-500">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center space-x-2">
                  <Phone size={16} />
                  <span>Số điện thoại *</span>
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="0123456789"
                  {...register('phoneNumber')}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail size={16} />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Address and Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin size={16} />
                  <span>Địa chỉ</span>
                </Label>
                <Input
                  id="address"
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  {...register('address')}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForVisit">Lý do khám</Label>
                <Input
                  id="reasonForVisit"
                  placeholder="Lý do đến khám..."
                  {...register('reasonForVisit')}
                />
              </div>
            </div>

            {/* Referral Source */}
            <div className="space-y-2">
              <Label htmlFor="referralSourceId">Nguồn gửi</Label>
              <select
                id="referralSourceId"
                {...register('referralSourceId', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loadingReferralSources}
              >
                <option value="">Chọn nguồn gửi</option>
                {referralSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.code})
                  </option>
                ))}
              </select>
              {loadingReferralSources && (
                <p className="text-sm text-gray-500">Đang tải nguồn gửi...</p>
              )}
            </div>

            {/* Guardian Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin người giám hộ (nếu có)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Họ tên người giám hộ</Label>
                  <Input
                    id="guardianName"
                    placeholder="Nguyễn Thị B"
                    {...register('guardianName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianPhoneNumber">Số điện thoại</Label>
                  <Input
                    id="guardianPhoneNumber"
                    placeholder="0987654321"
                    {...register('guardianPhoneNumber')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianRelationship">Mối quan hệ</Label>
                  <Input
                    id="guardianRelationship"
                    placeholder="Cha/mẹ, vợ/chồng..."
                    {...register('guardianRelationship')}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Xóa form
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký bệnh nhân'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientRegistration 