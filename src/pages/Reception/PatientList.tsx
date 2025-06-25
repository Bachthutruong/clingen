import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  Eye, 
  Edit3,
  Calendar,
  Phone,
  MapPin,
  User,
  Filter,
  Download,
  UserPlus
} from 'lucide-react'
import type { Patient } from '@/types/patient'
import { formatDate } from '@/lib/utils'

const PatientList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [ageFilter, setAgeFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'age'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Mock data
  const [patients] = useState<Patient[]>([
    {
      id: '1',
      patientCode: 'BN001',
      name: 'Nguyễn Văn A',
      dateOfBirth: '1990-01-15',
      gender: 'male',
      phone: '0123456789',
      email: 'nguyenvana@email.com',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      idNumber: '123456789',
      emergencyContact: {
        name: 'Nguyễn Thị B',
        phone: '0987654321',
        relationship: 'Vợ'
      },
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00'
    },
    {
      id: '2',
      patientCode: 'BN002',
      name: 'Trần Thị B',
      dateOfBirth: '1985-03-20',
      gender: 'female',
      phone: '0987654321',
      email: 'tranthib@email.com',
      address: '456 Đường XYZ, Quận 3, TP.HCM',
      idNumber: '987654321',
      emergencyContact: {
        name: 'Trần Văn C',
        phone: '0123456789',
        relationship: 'Chồng'
      },
      createdAt: '2024-01-14T14:20:00',
      updatedAt: '2024-01-14T14:20:00'
    },
    {
      id: '3',
      patientCode: 'BN003',
      name: 'Lê Văn C',
      dateOfBirth: '1975-07-10',
      gender: 'male',
      phone: '0345678901',
      email: 'levanc@email.com',
      address: '789 Đường DEF, Quận 5, TP.HCM',
      idNumber: '345678901',
      emergencyContact: {
        name: 'Lê Thị D',
        phone: '0765432109',
        relationship: 'Con gái'
      },
      createdAt: '2024-01-13T09:15:00',
      updatedAt: '2024-01-13T09:15:00'
    },
    {
      id: '4',
      patientCode: 'BN004',
      name: 'Phạm Thị D',
      dateOfBirth: '2000-12-05',
      gender: 'female',
      phone: '0567890123',
      email: 'phamthid@email.com',
      address: '321 Đường GHI, Quận 7, TP.HCM',
      idNumber: '567890123',
      createdAt: '2024-01-12T16:45:00',
      updatedAt: '2024-01-12T16:45:00'
    },
    {
      id: '5',
      patientCode: 'BN005',
      name: 'Hoàng Văn E',
      dateOfBirth: '1995-08-25',
      gender: 'male',
      phone: '0789012345',
      address: '654 Đường JKL, Quận 2, TP.HCM',
      idNumber: '789012345',
      emergencyContact: {
        name: 'Hoàng Thị F',
        phone: '0234567890',
        relationship: 'Mẹ'
      },
      createdAt: '2024-01-11T11:30:00',
      updatedAt: '2024-01-11T11:30:00'
    }
  ])

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const filteredPatients = patients
    .filter(patient => {
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery) ||
        patient.idNumber.includes(searchQuery)

      const matchesGender = !genderFilter || patient.gender === genderFilter

      let matchesAge = true
      if (ageFilter) {
        const age = calculateAge(patient.dateOfBirth)
        switch (ageFilter) {
          case 'child':
            matchesAge = age < 18
            break
          case 'adult':
            matchesAge = age >= 18 && age < 60
            break
          case 'elderly':
            matchesAge = age >= 60
            break
        }
      }

      return matchesSearch && matchesGender && matchesAge
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'vi')
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'age':
          comparison = calculateAge(a.dateOfBirth) - calculateAge(b.dateOfBirth)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleViewDetails = (patient: Patient) => {
    alert(`Xem chi tiết bệnh nhân: ${patient.name}`)
  }

  const handleEditPatient = (patient: Patient) => {
    alert(`Chỉnh sửa thông tin bệnh nhân: ${patient.name}`)
  }

  const handleExport = () => {
    alert('Xuất danh sách bệnh nhân ra file Excel')
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Nam'
      case 'female': return 'Nữ'
      case 'other': return 'Khác'
      default: return gender
    }
  }

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-800'
      case 'female': return 'bg-pink-100 text-pink-800'
      case 'other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAgeGroup = (age: number) => {
    if (age < 18) return { label: 'Trẻ em', color: 'bg-green-100 text-green-800' }
    if (age < 60) return { label: 'Người lớn', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Người cao tuổi', color: 'bg-orange-100 text-orange-800' }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Danh sách bệnh nhân</h1>
              <p className="text-indigo-100">Quản lý thông tin bệnh nhân</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleExport}
              className="bg-white text-indigo-700 hover:bg-gray-100"
            >
              <Download size={16} className="mr-2" />
              Xuất Excel
            </Button>
            <Button
              className="bg-white text-indigo-700 hover:bg-gray-100"
            >
              <UserPlus size={16} className="mr-2" />
              Thêm bệnh nhân
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-600" />
            <span>Tìm kiếm và lọc</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, mã BN, SĐT, CMND..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>

            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả độ tuổi</option>
              <option value="child">Trẻ em (&lt;18)</option>
              <option value="adult">Người lớn (18-59)</option>
              <option value="elderly">Cao tuổi (≥60)</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as 'name' | 'date' | 'age')
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="date-desc">Mới nhất</option>
              <option value="date-asc">Cũ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="age-asc">Tuổi tăng dần</option>
              <option value="age-desc">Tuổi giảm dần</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng bệnh nhân</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kết quả tìm kiếm</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
              </div>
              <Search className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nam</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.gender === 'male').length}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nữ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.gender === 'female').length}
                </p>
              </div>
              <User className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Danh sách bệnh nhân ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery || genderFilter || ageFilter 
                ? 'Không tìm thấy bệnh nhân phù hợp với bộ lọc'
                : 'Chưa có bệnh nhân nào'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map(patient => {
                const age = calculateAge(patient.dateOfBirth)
                const ageGroup = getAgeGroup(age)
                
                return (
                  <Card key={patient.id} className="border hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{patient.name}</CardTitle>
                          <p className="text-sm text-gray-600 font-medium">
                            Mã: {patient.patientCode}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getGenderColor(patient.gender)}`}>
                              {getGenderLabel(patient.gender)}
                            </span>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${ageGroup.color}`}>
                              {age} tuổi
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(patient)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <Edit3 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone size={14} />
                        <span>{patient.phone}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>Sinh: {formatDate(patient.dateOfBirth)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span className="line-clamp-2">{patient.address}</span>
                      </div>

                      {patient.emergencyContact && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">Liên hệ khẩn cấp:</p>
                          <p className="text-sm text-gray-700">
                            {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                          </p>
                          <p className="text-sm text-gray-600">{patient.emergencyContact.phone}</p>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Đăng ký: {formatDate(patient.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientList 