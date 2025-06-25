import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Phone, Mail, MapPin, Calendar, Users, Plus, Search } from 'lucide-react'
import type { ReferralSource } from '@/types/patient'

const patientSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Vui lòng chọn giới tính' }),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  idNumber: z.string().min(9, 'CMND/CCCD phải có ít nhất 9 số'),
  referralSourceId: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
})

type PatientForm = z.infer<typeof patientSchema>

const PatientRegistration: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data for referral sources
  const mockReferralSources: ReferralSource[] = [
    { id: '1', name: 'Tự đến', type: 'self', createdAt: '2024-01-01' },
    { id: '2', name: 'Bệnh viện Chợ Rẫy', type: 'hospital', createdAt: '2024-01-01' },
    { id: '3', name: 'Phòng khám Đa khoa ABC', type: 'clinic', createdAt: '2024-01-01' },
    { id: '4', name: 'BS. Nguyễn Văn A', type: 'doctor', createdAt: '2024-01-01' },
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  })

  const onSubmit = async (data: PatientForm) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Patient data:', data)
      alert('Đã đăng ký bệnh nhân thành công!')
      reset()
    } catch (error) {
      alert('Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearchExistingPatient = () => {
    if (searchQuery.trim()) {
      alert(`Tìm kiếm bệnh nhân: ${searchQuery}`)
    }
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

  const dateOfBirth = watch('dateOfBirth')

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
            Tìm kiếm theo mã bệnh nhân, tên, số điện thoại hoặc CMND/CCCD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                placeholder="Nhập thông tin tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button 
              onClick={handleSearchExistingPatient}
              className="px-6"
            >
              <Search size={16} className="mr-2" />
              Tìm kiếm
            </Button>
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
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User size={16} />
                  <span>Họ và tên *</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nguyễn Văn A"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>Ngày sinh *</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {dateOfBirth && (
                  <p className="text-sm text-green-600">
                    Tuổi: {calculateAge(dateOfBirth)}
                  </p>
                )}
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center space-x-2">
                  <Users size={16} />
                  <span>Giới tính *</span>
                </Label>
                <select
                  id="gender"
                  {...register('gender')}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-red-500">{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone size={16} />
                  <span>Số điện thoại *</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="0123456789"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
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

            {/* Address and ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin size={16} />
                  <span>Địa chỉ *</span>
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
                <Label htmlFor="idNumber" className="flex items-center space-x-2">
                  <User size={16} />
                  <span>CMND/CCCD *</span>
                </Label>
                <Input
                  id="idNumber"
                  placeholder="123456789"
                  {...register('idNumber')}
                  className={errors.idNumber ? 'border-red-500' : ''}
                />
                {errors.idNumber && (
                  <p className="text-sm text-red-500">{errors.idNumber.message}</p>
                )}
              </div>
            </div>

            {/* Referral Source */}
            <div className="space-y-2">
              <Label htmlFor="referralSourceId">Nguồn gửi</Label>
              <select
                id="referralSourceId"
                {...register('referralSourceId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Chọn nguồn gửi</option>
                {mockReferralSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.type === 'self' ? 'Tự đến' : 
                     source.type === 'hospital' ? 'Bệnh viện' :
                     source.type === 'clinic' ? 'Phòng khám' : 'Bác sĩ'})
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin người liên hệ khẩn cấp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Họ tên người liên hệ</Label>
                  <Input
                    id="emergencyContactName"
                    placeholder="Nguyễn Thị B"
                    {...register('emergencyContactName')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Số điện thoại</Label>
                  <Input
                    id="emergencyContactPhone"
                    placeholder="0987654321"
                    {...register('emergencyContactPhone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">Mối quan hệ</Label>
                  <Input
                    id="emergencyContactRelationship"
                    placeholder="Vợ/chồng, con, bạn bè..."
                    {...register('emergencyContactRelationship')}
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
              >
                Xóa form
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đăng ký bệnh nhân'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientRegistration 