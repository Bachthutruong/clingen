import React, { useState, useEffect } from 'react'
// import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  Eye, 
  TestTube,
  Clock,
  CheckCircle,
  AlertTriangle,
  Microscope,
  // FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { patientsApi } from '@/services'
import { getGenderLabel } from '@/types/api'
import type { PatientAPI, PaginatedResponse } from '@/types/api'
import { formatDate } from '@/lib/utils'

// Updated interface to match API response
interface PatientDetail {
  id: number
  testTypeName: string
  testSampleName: string
  price: number
  status: number
}

interface PatientWithDetails extends PatientAPI {
  details: PatientDetail[]
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  stringStatus?: string
}

interface RegistrationService {
  id: string
  serviceId: string
  service: {
    id: string
    code: string
    name: string
    category?: string
  }
  price: number
  status: 'pending' | 'collecting' | 'testing' | 'completed'
  result?: {
    id: string
    value: string
    normalRange?: string
    unit?: string
    interpretation?: 'normal' | 'abnormal' | 'critical'
    notes?: string
    testedBy: string
    testedAt: string
  }
}

interface Registration {
  id: string
  patientId: number
  patient: PatientWithDetails
  registrationDate: string
  services: RegistrationService[]
  totalAmount: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: string
  updatedAt: string
}

const PatientInfo: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedPatient, setSelectedPatient] = useState<PatientWithDetails | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // API state
  const [patientsData, setPatientsData] = useState<PaginatedResponse<PatientWithDetails> | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch patients and their registrations from API
  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await patientsApi.getAll({
        pageIndex: currentPage,
        pageSize: pageSize,
        keyword: searchQuery || undefined,
        status: 1 // Active patients only
      })
      
      // Type assertion to match our expected structure
      const patientsWithDetails = response.content.map(patient => ({
        ...patient,
        details: (patient as any).details || []
      })) as PatientWithDetails[]
      
      const updatedResponse = {
        ...response,
        content: patientsWithDetails
      }
      
      setPatientsData(updatedResponse)
      
      // Fetch registrations for all patients
      await fetchRegistrations(patientsWithDetails)
      
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError('Không thể tải danh sách bệnh nhân. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch registrations for patients
  const fetchRegistrations = async (patients: PatientWithDetails[]) => {
    try {
      const registrationsPromises = patients.map(async (patient) => {
        // Skip patients without ID
        if (!patient.id) return []
        
        try {
          // Use patient details directly since they're included in the response
          const services: RegistrationService[] = patient.details.map((detail, index) => ({
            id: `${patient.id}_${detail.id}_${index}`,
            serviceId: detail.id.toString(),
            service: {
              id: detail.id.toString(),
              code: `TEST_${detail.id}`,
              name: detail.testTypeName,
              category: 'Xét nghiệm'
            },
            price: detail.price,
            status: getTestStatus(detail),
          }))
          
          return [{
            id: `REG${patient.id}`,
            patientId: patient.id,
            patient: patient,
            registrationDate: patient.createdAt || new Date().toISOString(),
            services: services,
            totalAmount: patient.details.reduce((sum, detail) => sum + detail.price, 0),
            status: getPatientStatus(patient),
            createdBy: patient.createdBy || 'system',
            createdAt: patient.createdAt || new Date().toISOString(),
            updatedAt: patient.updatedAt || new Date().toISOString()
          }]
        } catch (patientError) {
          console.warn(`Could not process patient ${patient.id}:`, patientError)
          return []
        }
      })

      const allRegistrations = await Promise.all(registrationsPromises)
      setRegistrations(allRegistrations.flat())
      
    } catch (err) {
      console.error('Error processing registrations:', err)
      // Use patient data to create basic registrations
      const basicRegistrations: Registration[] = patients
        .filter(patient => patient.id) // Filter out patients without ID
        .map(patient => ({
          id: `REG${patient.id}`,
          patientId: patient.id!,
          patient: patient,
          registrationDate: patient.createdAt || new Date().toISOString(),
          services: patient.details.map((detail, index) => ({
            id: `${patient.id}_${detail.id}_${index}`,
            serviceId: detail.id.toString(),
            service: {
              id: detail.id.toString(),
              code: `TEST_${detail.id}`,
              name: detail.testTypeName,
              category: 'Xét nghiệm'
            },
            price: detail.price,
            status: getTestStatus(detail),
          })),
          totalAmount: patient.details.reduce((sum, detail) => sum + detail.price, 0),
          status: getPatientStatus(patient),
          createdBy: patient.createdBy || 'system',
          createdAt: patient.createdAt || new Date().toISOString(),
          updatedAt: patient.updatedAt || new Date().toISOString()
        }))
      
      setRegistrations(basicRegistrations)
    }
  }

  // Helper function to determine test status from PatientDetail
  const getTestStatus = (detail: PatientDetail): 'pending' | 'collecting' | 'testing' | 'completed' => {
    // Simple logic based on status field
    switch (detail.status) {
      case 0: return 'pending'
      case 1: return 'collecting'
      case 2: return 'testing'
      case 3: return 'completed'
      default: return 'pending'
    }
  }

  // Helper function to determine patient status
  const getPatientStatus = (patient: PatientWithDetails): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
    if (!patient.details || patient.details.length === 0) return 'pending'
    
    const hasCompletedTests = patient.details.some(detail => detail.status === 3)
    const hasInProgressTests = patient.details.some(detail => detail.status === 1 || detail.status === 2)
    
    if (hasCompletedTests && !hasInProgressTests) return 'completed'
    if (hasInProgressTests) return 'in_progress'
    
    return 'pending'
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchPatients()
  }, [currentPage, searchQuery])

  // Filter registrations based on search and status
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || 
      reg.services.some(service => service.status === statusFilter)

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'collecting': return 'bg-blue-100 text-blue-800'
      case 'testing': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />
      case 'collecting': return <TestTube size={14} />
      case 'testing': return <Microscope size={14} />
      case 'completed': return <CheckCircle size={14} />
      default: return <AlertTriangle size={14} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ lấy mẫu'
      case 'collecting': return 'Đang lấy mẫu'
      case 'testing': return 'Đang xét nghiệm'
      case 'completed': return 'Hoàn thành'
      default: return status
    }
  }

  const handleViewDetails = (registration: Registration) => {
    setSelectedPatient(registration.patient)
    setShowDialog(true)
  }

  // const handleUpdateStatus = async (serviceId: string, newStatus: string) => {
  //   try {
  //     // In real implementation, call API to update status
  //     // await registrationsApi.updateServiceStatus(registrationId, serviceId, newStatus)
  //     toast.success(`Cập nhật trạng thái ${newStatus} cho dịch vụ ${serviceId}`)
  //     // Refresh data after update
  //     fetchPatients()
  //   } catch (error) {
  //     console.error('Error updating status:', error)
  //     toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
  //   }
  // }

  // const handleInputResult = async (service: RegistrationService) => {
  //   try {
  //     // In real implementation, call API to add test result
  //     // await registrationsApi.addTestResult(service.id, resultData)
  //     toast.success(`Nhập kết quả cho: ${service.service.name}`)
  //     // Refresh data after adding result
  //     fetchPatients()
  //   } catch (error) {
  //     console.error('Error adding result:', error)
  //     toast.error('Có lỗi xảy ra khi nhập kết quả')
  //   }
  // }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchPatients()
  }

  const allServices = registrations.flatMap(r => r.services)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Thông tin bệnh nhân</h1>
            <p className="text-purple-100">Quản lý thông tin và tiến độ xét nghiệm</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ lấy mẫu</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {allServices.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang xét nghiệm</p>
                <p className="text-2xl font-bold text-purple-600">
                  {allServices.filter(s => s.status === 'testing').length}
                </p>
              </div>
              <Microscope className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">
                  {allServices.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng ca xét nghiệm</p>
                <p className="text-2xl font-bold text-blue-600">
                  {allServices.length}
                </p>
              </div>
              <TestTube className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter - Compact */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên bệnh nhân, mã đăng ký..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ lấy mẫu</option>
              <option value="collecting">Đang lấy mẫu</option>
              <option value="testing">Đang xét nghiệm</option>
              <option value="completed">Hoàn thành</option>
            </select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle size={20} />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchPatients}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient List - Full Width Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách bệnh nhân ({filteredRegistrations.length})</span>
            {loading && <Loader2 size={16} className="animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && filteredRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy bệnh nhân phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Bệnh nhân</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Số lượng dịch vụ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Tổng tiền</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Ngày đăng ký</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRegistrations.map(registration => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{registration.patient.fullName}</div>
                          <div className="text-gray-600">{registration.patient.phoneNumber}</div>
                          <div className="text-xs text-gray-500">
                            {getGenderLabel(registration.patient.gender)} • {formatDate(registration.patient.birthYear)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{registration.services.length}</div>
                          <div className="text-xs text-gray-500">dịch vụ</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{formatCurrency(registration.totalAmount)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {registration.services.slice(0, 3).map(service => (
                            <span key={service.id} className={`inline-flex items-center px-2 py-1 text-xs rounded-full mr-1 ${getStatusColor(service.status)}`}>
                              {getStatusIcon(service.status)}
                              <span className="ml-1">{getStatusLabel(service.status)}</span>
                            </span>
                          ))}
                          {registration.services.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{registration.services.length - 3} khác
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{formatDate(registration.registrationDate)}</div>
                        <div className="text-xs text-gray-500">bởi {registration.createdBy}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(registration)}
                        >
                          <Eye size={14} className="mr-1" />
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {patientsData && patientsData.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || loading}
          >
            <ChevronLeft size={16} />
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {currentPage + 1} / {patientsData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(patientsData.totalPages - 1, currentPage + 1))}
            disabled={currentPage >= patientsData.totalPages - 1 || loading}
          >
            Sau
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Patient Details Dialog */}
      {showDialog && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết bệnh nhân</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(false)}
              >
                <X size={20} />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold">{selectedPatient.fullName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Giới tính:</span>
                    <span className="ml-2 font-medium">
                      {getGenderLabel(selectedPatient.gender)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ngày sinh:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedPatient.birthYear)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span className="ml-2 font-medium">{selectedPatient.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedPatient.email || 'Chưa có'}</span>
                  </div>
                  {selectedPatient.address && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Địa chỉ:</span>
                      <span className="ml-2 font-medium">{selectedPatient.address}</span>
                    </div>
                  )}
                  {selectedPatient.reasonForVisit && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Lý do khám:</span>
                      <span className="ml-2 font-medium">{selectedPatient.reasonForVisit}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Services */}
              <div>
                <h4 className="font-semibold mb-3">Dịch vụ xét nghiệm ({selectedPatient.details.length})</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Tên dịch vụ</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Mẫu xét nghiệm</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Giá</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Trạng thái</th>
                        {/* <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Thao tác</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPatient.details.map((detail) => {
                        const serviceStatus = getTestStatus(detail)
                        return (
                          <tr key={detail.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 border-b">
                              <div className="font-medium text-gray-900">{detail.testTypeName}</div>
                            </td>
                            <td className="px-4 py-4 border-b">
                              <div className="text-gray-900">{detail.testSampleName}</div>
                            </td>
                            <td className="px-4 py-4 border-b">
                              <div className="font-medium text-gray-900">{formatCurrency(detail.price)}</div>
                            </td>
                            <td className="px-4 py-4 border-b">
                              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(serviceStatus)}`}>
                                {getStatusIcon(serviceStatus)}
                                <span className="ml-1">{getStatusLabel(serviceStatus)}</span>
                              </span>
                            </td>
                            {/* <td className="px-4 py-4 border-b">
                              <div className="flex space-x-2">
                                {serviceStatus !== 'completed' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateStatus(`${selectedPatient.id}_${detail.id}_${index}`, 'testing')}
                                    >
                                      Bắt đầu XN
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleInputResult({
                                        id: `${selectedPatient.id}_${detail.id}_${index}`,
                                        serviceId: detail.id.toString(),
                                        service: {
                                          id: detail.id.toString(),
                                          code: `TEST_${detail.id}`,
                                          name: detail.testTypeName,
                                          category: 'Xét nghiệm'
                                        },
                                        price: detail.price,
                                        status: serviceStatus,
                                      })}
                                    >
                                      <FileText size={14} className="mr-1" />
                                      Nhập KQ
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td> */}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Total */}
                <div className="mt-4 text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    Tổng cộng: {formatCurrency(selectedPatient.details.reduce((sum, detail) => sum + detail.price, 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientInfo 