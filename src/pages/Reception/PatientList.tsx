import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
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
  UserPlus,
  Loader2
} from 'lucide-react'
import { patientsApi } from '@/services'
import { getGenderLabel } from '@/types/api'
import type { PatientAPI, PaginatedResponse } from '@/types/api'
import { formatDate } from '@/lib/utils'

const PatientList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [ageFilter, setAgeFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'age'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // API state
  const [patientsData, setPatientsData] = useState<PaginatedResponse<PatientAPI> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await patientsApi.getAll({
        pageIndex: currentPage,
        pageSize: pageSize,
        keyword: searchQuery || undefined,
        orderCol: sortBy === 'name' ? 'fullName' : sortBy === 'date' ? 'birthYear' : 'birthYear',
        isDesc: sortOrder === 'desc'
      })
      
      setPatientsData(response)
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError('Không thể tải danh sách bệnh nhân. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchPatients()
  }, [currentPage, pageSize, searchQuery, sortBy, sortOrder])

  const calculateAge = (birthYear: string): number => {
    const today = new Date()
    const birth = new Date(birthYear)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleViewDetails = (patient: PatientAPI) => {
    toast(`Xem chi tiết bệnh nhân: ${patient.fullName}`)
  }

  const handleEditPatient = (patient: PatientAPI) => {
    toast(`Chỉnh sửa thông tin bệnh nhân: ${patient.fullName}`)
  }

  const handleExport = () => {
    toast('Xuất danh sách bệnh nhân ra file Excel')
  }

  const getGenderColor = (gender: number) => {
    switch (gender) {
      case 0: return 'bg-pink-100 text-pink-800' // Nữ
      case 1: return 'bg-blue-100 text-blue-800' // Nam
      case 2: return 'bg-gray-100 text-gray-800' // Khác
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAgeGroup = (age: number) => {
    if (age < 18) return { label: 'Trẻ em', color: 'bg-green-100 text-green-800' }
    if (age < 60) return { label: 'Người lớn', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Người cao tuổi', color: 'bg-orange-100 text-orange-800' }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchPatients()
  }

  const patients = patientsData?.content || []
  const totalPatients = patientsData?.totalElements || 0

  // Filter patients by gender and age if needed
  const filteredPatients = patients.filter(patient => {
    const matchesGender = !genderFilter || patient.gender.toString() === genderFilter
    const age = calculateAge(patient.birthYear)
    const matchesAge = !ageFilter || 
      (ageFilter === 'child' && age < 18) ||
      (ageFilter === 'adult' && age >= 18 && age < 60) ||
      (ageFilter === 'elderly' && age >= 60)
    
    return matchesGender && matchesAge
  })

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
                  placeholder="Tìm theo tên, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                  <option value="0">Nữ</option>
                  <option value="1">Nam</option>
                  <option value="2">Khác</option>
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
                <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trang hiện tại</p>
                <p className="text-2xl font-bold text-gray-900">{currentPage + 1}</p>
              </div>
              <Search className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Số lượng/trang</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng trang</p>
                <p className="text-2xl font-bold text-gray-900">{patientsData?.totalPages || 0}</p>
              </div>
              <User className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>
            Danh sách bệnh nhân ({filteredPatients.length})
            {loading && <Loader2 className="inline ml-2 h-5 w-5 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchPatients}>Thử lại</Button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {loading ? 'Đang tải...' : 'Không tìm thấy bệnh nhân nào'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map(patient => {
                  const age = calculateAge(patient.birthYear)
                  const ageGroup = getAgeGroup(age)
                  
                  return (
                    <Card key={patient.id} className="border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{patient.fullName}</CardTitle>
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
                          <span>{patient.phoneNumber}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          <span>Sinh: {formatDate(patient.birthYear)}</span>
                        </div>
                        
                        {patient.address && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin size={14} />
                            <span className="line-clamp-2">{patient.address}</span>
                          </div>
                        )}

                        {patient.guardianName && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-1">Người giám hộ:</p>
                            <p className="text-sm text-gray-700">
                              {patient.guardianName} ({patient.guardianRelationship})
                            </p>
                            {patient.guardianPhoneNumber && (
                              <p className="text-sm text-gray-600">{patient.guardianPhoneNumber}</p>
                            )}
                          </div>
                        )}

                        {patient.reasonForVisit && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-1">Lý do khám:</p>
                            <p className="text-sm text-gray-600">{patient.reasonForVisit}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {patientsData && patientsData.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0 || loading}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-gray-600">
                    Trang {currentPage + 1} / {patientsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(patientsData.totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= patientsData.totalPages - 1 || loading}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientList 