import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Loader2,
  RefreshCw,
  Trash2,
  X,
  Save
} from 'lucide-react'
import { patientsApi } from '@/services'
import { getGenderLabel } from '@/types/api'
import type { PatientAPI, PaginatedResponse, CreatePatientRequest } from '@/types/api'
import { formatDate } from '@/lib/utils'

const PatientList: React.FC = () => {
  const navigate = useNavigate()
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

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientAPI | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<CreatePatientRequest>>({})
  const [actionLoading, setActionLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Prepare search parameters
      const searchParams = {
        pageIndex: currentPage,
        pageSize: pageSize,
        keyword: searchQuery.trim() || undefined,
        orderCol: sortBy === 'name' ? 'fullName' : sortBy === 'date' ? 'birthYear' : 'birthYear',
        isDesc: sortOrder === 'desc'
      }
      
      const response = await patientsApi.getAll(searchParams)
      setPatientsData(response)
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError('Không thể tải danh sách bệnh nhân. Vui lòng thử lại.')
      toast.error('Không thể tải danh sách bệnh nhân')
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(0) // Reset to first page when search changes
      fetchPatients()
    }, 300) // Debounce search

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, sortBy, sortOrder])

  // Effect to fetch data when page changes
  useEffect(() => {
    fetchPatients()
  }, [currentPage])

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

  const fetchPatientDetails = async (patientId: number): Promise<PatientAPI | null> => {
    try {
      setDetailLoading(true)
      const patientDetails = await patientsApi.getById(patientId)
      return patientDetails
    } catch (error) {
      console.error('Error fetching patient details:', error)
      toast.error('Không thể tải thông tin chi tiết bệnh nhân')
      return null
    } finally {
      setDetailLoading(false)
    }
  }

  const handleViewDetails = async (patient: PatientAPI) => {
    if (!patient.id) {
      toast.error('Không tìm thấy ID bệnh nhân')
      return
    }

    const patientDetails = await fetchPatientDetails(patient.id)
    if (patientDetails) {
      setSelectedPatient(patientDetails)
      setViewModalOpen(true)
    }
  }

  const handleEditPatient = async (patient: PatientAPI) => {
    if (!patient.id) {
      toast.error('Không tìm thấy ID bệnh nhân')
      return
    }

    const patientDetails = await fetchPatientDetails(patient.id)
    if (patientDetails) {
      setSelectedPatient(patientDetails)
      setEditFormData({
        fullName: patientDetails.fullName,
        birthYear: patientDetails.birthYear,
        gender: patientDetails.gender,
        address: patientDetails.address,
        phoneNumber: patientDetails.phoneNumber,
        reasonForVisit: patientDetails.reasonForVisit,
        email: patientDetails.email,
        guardianName: patientDetails.guardianName,
        guardianRelationship: patientDetails.guardianRelationship,
        guardianPhoneNumber: patientDetails.guardianPhoneNumber,
        typeTests: patientDetails.typeTests || []
      })
      setEditModalOpen(true)
    }
  }

  const handleDeletePatient = (patient: PatientAPI) => {
    setSelectedPatient(patient)
    setDeleteModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedPatient || !editFormData.fullName) return

    try {
      setActionLoading(true)
      await patientsApi.update(selectedPatient.id!, editFormData)
      toast.success('Cập nhật thông tin bệnh nhân thành công')
      setEditModalOpen(false)
      fetchPatients() // Refresh data
    } catch (error) {
      console.error('Error updating patient:', error)
      toast.error('Lỗi khi cập nhật thông tin bệnh nhân')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedPatient) return

    try {
      setActionLoading(true)
      await patientsApi.delete(selectedPatient.id!)
      toast.success('Xóa bệnh nhân thành công')
      setDeleteModalOpen(false)
      fetchPatients() // Refresh data
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Lỗi khi xóa bệnh nhân')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddPatient = () => {
    navigate('/reception/patient-registration')
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      toast.loading('Đang chuẩn bị xuất dữ liệu...', { id: 'export' })
      
      // Get all patients for export (without pagination)
      const allPatientsResponse = await patientsApi.getAllWithoutPaging()
      
      if (!allPatientsResponse || allPatientsResponse.length === 0) {
        toast.error('Không có dữ liệu để xuất', { id: 'export' })
        return
      }
      
      // Prepare data for Excel
      const exportData = allPatientsResponse.map((patient, index) => ({
        'STT': index + 1,
        'Họ và tên': patient.fullName,
        'Giới tính': getGenderLabel(patient.gender),
        'Năm sinh': patient.birthYear ? formatDate(patient.birthYear) : '',
        'Tuổi': patient.birthYear ? calculateAge(patient.birthYear) : '',
        'Số điện thoại': patient.phoneNumber || '',
        'Địa chỉ': patient.address || '',
        'Email': patient.email || '',
        'Người giám hộ': patient.guardianName || '',
        'Quan hệ với người giám hộ': patient.guardianRelationship || '',
        'SĐT người giám hộ': patient.guardianPhoneNumber || '',
        'Lý do khám': patient.reasonForVisit || ''
      }))
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths
      const colWidths = [
        { wch: 5 },   // STT
        { wch: 25 },  // Họ và tên
        { wch: 10 },  // Giới tính
        { wch: 12 },  // Năm sinh
        { wch: 8 },   // Tuổi
        { wch: 15 },  // Số điện thoại
        { wch: 30 },  // Địa chỉ
        { wch: 25 },  // Email
        { wch: 20 },  // Người giám hộ
        { wch: 15 },  // Quan hệ
        { wch: 15 },  // SĐT người giám hộ
        { wch: 30 }   // Lý do khám
      ]
      ws['!cols'] = colWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách bệnh nhân')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Save file
      const fileName = `Danh_sach_benh_nhan_${new Date().toISOString().split('T')[0]}.xlsx`
      saveAs(blob, fileName)
      
      toast.success(`Xuất thành công ${allPatientsResponse.length} bệnh nhân`, { id: 'export' })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Lỗi khi xuất dữ liệu', { id: 'export' })
    } finally {
      setLoading(false)
    }
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

  const handleRefresh = () => {
    fetchPatients()
    toast.success('Đã làm mới dữ liệu')
  }

  // Get patients data and apply client-side filters
  const patients = patientsData?.content || []
  const totalPatients = patientsData?.totalElements || 0

  // Apply client-side filters for gender and age
  const filteredPatients = patients.filter((patient: PatientAPI) => {
    const matchesGender = !genderFilter || patient.gender.toString() === genderFilter
    const age = patient.birthYear ? calculateAge(patient.birthYear) : 0
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
              onClick={handleRefresh}
              disabled={loading}
              className="bg-white/20 text-white hover:bg-white/30 border border-white/30"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading}
              className="bg-white text-indigo-700 hover:bg-gray-100"
            >
              <Download size={16} className="mr-2" />
              Xuất Excel
            </Button>
            <Button
              onClick={handleAddPatient}
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
                  placeholder="Tìm theo tên, SĐT, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Tất cả giới tính</option>
              <option value="0">Nữ</option>
              <option value="1">Nam</option>
              <option value="2">Khác</option>
            </select>

            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <p className="text-sm text-gray-600">Hiển thị</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
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
          <CardTitle className="flex items-center justify-between">
            <span>
              Danh sách bệnh nhân ({filteredPatients.length})
              {loading && <Loader2 className="inline ml-2 h-5 w-5 animate-spin" />}
            </span>
            {searchQuery && (
              <span className="text-sm text-gray-500 font-normal">
                Kết quả tìm kiếm cho: "{searchQuery}"
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchPatients} variant="outline">
                <RefreshCw size={16} className="mr-2" />
                Thử lại
              </Button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  Đang tải dữ liệu...
                </div>
              ) : searchQuery ? (
                <div>
                  <p className="text-lg mb-2">Không tìm thấy kết quả</p>
                  <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Chưa có bệnh nhân nào</p>
                  <Button onClick={handleAddPatient} className="mt-2">
                    <UserPlus size={16} className="mr-2" />
                    Thêm bệnh nhân đầu tiên
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-4 font-semibold text-gray-700">STT</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Họ và tên</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Giới tính</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Tuổi</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Số điện thoại</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Địa chỉ</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Lý do khám</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient: PatientAPI, index) => {
                      const age = patient.birthYear ? calculateAge(patient.birthYear) : 0
                      const ageGroup = getAgeGroup(age)
                      const stt = currentPage * pageSize + index + 1
                      
                      return (
                        <tr key={patient.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-600">{stt}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-gray-900">{patient.fullName}</p>
                              {patient.email && (
                                <p className="text-sm text-gray-500">{patient.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getGenderColor(patient.gender)}`}>
                              {getGenderLabel(patient.gender)}
                            </span>
                          </td>
                          <td className="p-4">
                            {patient.birthYear && (
                              <div>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${ageGroup.color}`}>
                                  {age} tuổi
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(patient.birthYear)}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                            {patient.phoneNumber || '-'}
                          </td>
                          <td className="p-4 text-sm text-gray-700 max-w-xs">
                            <div className="truncate" title={patient.address}>
                              {patient.address || '-'}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-700 max-w-xs">
                            <div className="truncate" title={patient.reasonForVisit}>
                              {patient.reasonForVisit || '-'}
                            </div>
                          </td>
                                                     <td className="p-4">
                             <div className="flex justify-center space-x-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleViewDetails(patient)}
                                 title="Xem chi tiết"
                                 disabled={detailLoading}
                               >
                                 {detailLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                               </Button>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleEditPatient(patient)}
                                 title="Chỉnh sửa"
                                 disabled={detailLoading}
                               >
                                 {detailLoading ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
                               </Button>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleDeletePatient(patient)}
                                 title="Xóa bệnh nhân"
                                 className="text-red-600 hover:text-red-700 hover:border-red-300"
                                 disabled={detailLoading}
                               >
                                 <Trash2 size={14} />
                               </Button>
                             </div>
                           </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredPatients.map((patient: PatientAPI, index) => {
                  const age = patient.birthYear ? calculateAge(patient.birthYear) : 0
                  const ageGroup = getAgeGroup(age)
                  const stt = currentPage * pageSize + index + 1
                  
                  return (
                    <Card key={patient.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm text-gray-500">#{stt}</span>
                              <h3 className="font-semibold text-gray-900">{patient.fullName}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getGenderColor(patient.gender)}`}>
                                {getGenderLabel(patient.gender)}
                              </span>
                              {patient.birthYear && (
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${ageGroup.color}`}>
                                  {age} tuổi
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(patient)}
                              title="Xem chi tiết"
                              disabled={detailLoading}
                            >
                              {detailLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPatient(patient)}
                              title="Chỉnh sửa"
                              disabled={detailLoading}
                            >
                              {detailLoading ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePatient(patient)}
                              title="Xóa bệnh nhân"
                              className="text-red-600 hover:text-red-700 hover:border-red-300"
                              disabled={detailLoading}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {patient.phoneNumber && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Phone size={14} />
                              <span>{patient.phoneNumber}</span>
                            </div>
                          )}
                          
                          {patient.birthYear && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Calendar size={14} />
                              <span>Sinh: {formatDate(patient.birthYear)}</span>
                            </div>
                          )}
                          
                          {patient.address && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <MapPin size={14} />
                              <span className="line-clamp-2">{patient.address}</span>
                            </div>
                          )}

                          {patient.email && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <span>📧</span>
                              <span className="truncate">{patient.email}</span>
                            </div>
                          )}

                          {patient.reasonForVisit && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500 mb-1">Lý do khám:</p>
                              <p className="text-gray-600 line-clamp-2">{patient.reasonForVisit}</p>
                            </div>
                          )}

                          {patient.guardianName && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500 mb-1">Người giám hộ:</p>
                              <p className="text-gray-700">
                                {patient.guardianName}
                                {patient.guardianRelationship && ` (${patient.guardianRelationship})`}
                              </p>
                              {patient.guardianPhoneNumber && (
                                <p className="text-gray-600">{patient.guardianPhoneNumber}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {patientsData && patientsData.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0 || loading}
                  >
                    Đầu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0 || loading}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-gray-600 px-4">
                    Trang {currentPage + 1} / {patientsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(patientsData.totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= patientsData.totalPages - 1 || loading}
                  >
                    Sau
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(patientsData.totalPages - 1)}
                    disabled={currentPage >= patientsData.totalPages - 1 || loading}
                  >
                    Cuối
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Chi tiết bệnh nhân</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewModalOpen(false)}
                disabled={detailLoading}
              >
                <X size={16} />
              </Button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
                  <p className="text-gray-600">Đang tải thông tin bệnh nhân...</p>
                </div>
              </div>
            ) : selectedPatient ? (
              <>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Họ và tên</Label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Giới tính</Label>
                      <p className="mt-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getGenderColor(selectedPatient.gender)}`}>
                          {getGenderLabel(selectedPatient.gender)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Năm sinh</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPatient.birthYear ? formatDate(selectedPatient.birthYear) : 'Chưa có thông tin'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tuổi</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPatient.birthYear ? calculateAge(selectedPatient.birthYear) : 'Chưa có thông tin'} tuổi
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Số điện thoại</Label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.phoneNumber || 'Chưa có thông tin'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.email || 'Chưa có thông tin'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Địa chỉ</Label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.address || 'Chưa có thông tin'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Lý do khám</Label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPatient.reasonForVisit || 'Chưa có thông tin'}</p>
                    </div>
                    {selectedPatient.guardianName && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Người giám hộ</Label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPatient.guardianName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Quan hệ</Label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPatient.guardianRelationship || 'Chưa có thông tin'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">SĐT người giám hộ</Label>
                          <p className="mt-1 text-sm text-gray-900">{selectedPatient.guardianPhoneNumber || 'Chưa có thông tin'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                  <Button onClick={() => setViewModalOpen(false)} variant="outline">
                    Đóng
                  </Button>
                  <Button onClick={() => {
                    setViewModalOpen(false)
                    handleEditPatient(selectedPatient)
                  }}>
                    Chỉnh sửa
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-12">
                <p className="text-gray-500">Không thể tải thông tin bệnh nhân</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Chỉnh sửa thông tin bệnh nhân</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
                  <p className="text-gray-600">Đang tải thông tin bệnh nhân...</p>
                </div>
              </div>
            ) : selectedPatient ? (
              <>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Họ và tên *</Label>
                      <Input
                        id="fullName"
                        value={editFormData.fullName || ''}
                        onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Giới tính *</Label>
                      <select
                        id="gender"
                        value={editFormData.gender ?? ''}
                        onChange={(e) => setEditFormData({...editFormData, gender: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="0">Nữ</option>
                        <option value="1">Nam</option>
                        <option value="2">Khác</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="birthYear">Năm sinh</Label>
                      <Input
                        id="birthYear"
                        type="date"
                        value={editFormData.birthYear || ''}
                        onChange={(e) => setEditFormData({...editFormData, birthYear: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Số điện thoại *</Label>
                      <Input
                        id="phoneNumber"
                        value={editFormData.phoneNumber || ''}
                        onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        placeholder="Nhập email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Địa chỉ</Label>
                      <Input
                        id="address"
                        value={editFormData.address || ''}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        placeholder="Nhập địa chỉ"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="reasonForVisit">Lý do khám</Label>
                      <Input
                        id="reasonForVisit"
                        value={editFormData.reasonForVisit || ''}
                        onChange={(e) => setEditFormData({...editFormData, reasonForVisit: e.target.value})}
                        placeholder="Nhập lý do khám"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianName">Người giám hộ</Label>
                      <Input
                        id="guardianName"
                        value={editFormData.guardianName || ''}
                        onChange={(e) => setEditFormData({...editFormData, guardianName: e.target.value})}
                        placeholder="Nhập tên người giám hộ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianRelationship">Quan hệ với người giám hộ</Label>
                      <Input
                        id="guardianRelationship"
                        value={editFormData.guardianRelationship || ''}
                        onChange={(e) => setEditFormData({...editFormData, guardianRelationship: e.target.value})}
                        placeholder="Ví dụ: Con, Anh/Em, ..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianPhoneNumber">SĐT người giám hộ</Label>
                      <Input
                        id="guardianPhoneNumber"
                        value={editFormData.guardianPhoneNumber || ''}
                        onChange={(e) => setEditFormData({...editFormData, guardianPhoneNumber: e.target.value})}
                        placeholder="Nhập SĐT người giám hộ"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                  <Button onClick={() => setEditModalOpen(false)} variant="outline" disabled={actionLoading}>
                    Hủy
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={actionLoading || !editFormData.fullName || !editFormData.phoneNumber}>
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-12">
                <p className="text-gray-500">Không thể tải thông tin bệnh nhân</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa bệnh nhân</h3>
                  <p className="text-sm text-gray-600">Hành động này không thể hoàn tác.</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Bạn có chắc chắn muốn xóa bệnh nhân <strong>{selectedPatient.fullName}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Tất cả thông tin liên quan sẽ bị xóa vĩnh viễn.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setDeleteModalOpen(false)} variant="outline" disabled={actionLoading}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa bệnh nhân
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientList 