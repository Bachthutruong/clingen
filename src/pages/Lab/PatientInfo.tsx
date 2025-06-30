import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Search, 
  Eye, 
  TestTube,
//   Calendar,
//   Phone,
//   MapPin,
//   User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Microscope,
  FileText,
  Loader2
} from 'lucide-react'
import { patientsApi } from '@/services'
import { getGenderLabel } from '@/types/api'
import type { PatientAPI, PaginatedResponse, PatientTestDTO } from '@/types/api'
import { formatDate, formatDateTime } from '@/lib/utils'

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
  patient: PatientAPI
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
  const [selectedPatient, setSelectedPatient] = useState<PatientAPI | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // API state
  const [patientsData, setPatientsData] = useState<PaginatedResponse<PatientAPI> | null>(null)
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
      
      setPatientsData(response)
      
      // Fetch registrations for all patients
      await fetchRegistrations(response.content)
      
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError('Không thể tải danh sách bệnh nhân. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch registrations for patients
  const fetchRegistrations = async (patients: PatientAPI[]) => {
    try {
      const registrationsPromises = patients.map(async (patient) => {
        // Skip patients without ID
        if (!patient.id) return []
        
        try {
          // Fetch registrations for each patient
          const patientRegistrations = await patientsApi.getRegistrations(patient.id)
          
          // Transform to expected format
          return patientRegistrations.map((reg: any) => ({
            id: reg.id || `REG${patient.id}`,
            patientId: patient.id!,
            patient: patient,
            registrationDate: reg.registrationDate || new Date().toISOString(),
            services: patient.typeTests?.map((test, index) => ({
              id: `${patient.id}_${test.testId}_${index}`,
              serviceId: test.testId.toString(),
              service: {
                id: test.testId.toString(),
                code: `TEST_${test.testId}`,
                name: test.testSampleName || `Xét nghiệm ${test.testId}`,
                category: 'Xét nghiệm'
              },
              price: 150000, // Default price
              status: getTestStatus(test),
              // No result data in PatientTestDTO, will be fetched separately if needed
            })) || [],
            totalAmount: (patient.typeTests?.length || 0) * 150000,
            status: getPatientStatus(patient),
            createdBy: 'system',
            createdAt: reg.createdAt || new Date().toISOString(),
            updatedAt: reg.updatedAt || new Date().toISOString()
          }))
        } catch (patientError) {
          console.warn(`Could not fetch registrations for patient ${patient.id}:`, patientError)
          // Return a default registration if API fails
          return [{
            id: `REG${patient.id}`,
            patientId: patient.id!,
            patient: patient,
            registrationDate: new Date().toISOString(),
            services: patient.typeTests?.map((test, index) => ({
              id: `${patient.id}_${test.testId}_${index}`,
              serviceId: test.testId.toString(),
              service: {
                id: test.testId.toString(),
                code: `TEST_${test.testId}`,
                name: test.testSampleName || `Xét nghiệm ${test.testId}`,
                category: 'Xét nghiệm'
              },
              price: 150000,
              status: getTestStatus(test),
            })) || [],
            totalAmount: (patient.typeTests?.length || 0) * 150000,
            status: getPatientStatus(patient),
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        }
      })

      const allRegistrations = await Promise.all(registrationsPromises)
      setRegistrations(allRegistrations.flat())
      
    } catch (err) {
      console.error('Error fetching registrations:', err)
      // Use patient data to create basic registrations
      const basicRegistrations: Registration[] = patients
        .filter(patient => patient.id) // Filter out patients without ID
        .map(patient => ({
          id: `REG${patient.id}`,
          patientId: patient.id!,
          patient: patient,
          registrationDate: new Date().toISOString(),
          services: patient.typeTests?.map((test, index) => ({
            id: `${patient.id}_${test.testId}_${index}`,
            serviceId: test.testId.toString(),
            service: {
              id: test.testId.toString(),
              code: `TEST_${test.testId}`,
              name: test.testSampleName || `Xét nghiệm ${test.testId}`,
              category: 'Xét nghiệm'
            },
            price: 150000,
            status: getTestStatus(test),
          })) || [],
          totalAmount: (patient.typeTests?.length || 0) * 150000,
          status: getPatientStatus(patient),
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      
      setRegistrations(basicRegistrations)
    }
  }

  // Helper function to determine test status
  const getTestStatus = (test: PatientTestDTO): 'pending' | 'collecting' | 'testing' | 'completed' => {
    // Since PatientTestDTO doesn't have status or result fields,
    // we'll use a simple logic based on testSampleId presence
    if (test.testSampleId && test.testSampleName) return 'testing'
    if (test.testSampleId) return 'collecting'
    return 'pending'
  }

  // Helper function to determine patient status
  const getPatientStatus = (patient: PatientAPI): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
    if (!patient.typeTests || patient.typeTests.length === 0) return 'pending'
    
    // Simple logic: if patient has tests, they're in progress
    const hasTestsWithSamples = patient.typeTests.some(test => test.testSampleId)
    if (hasTestsWithSamples) return 'in_progress'
    
    return 'pending'
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchPatients()
  }, [currentPage, searchQuery])

  // const patients = patientsData?.content || []

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
  }

  const handleUpdateStatus = async (serviceId: string, newStatus: string) => {
    try {
      // In real implementation, call API to update status
      // await registrationsApi.updateServiceStatus(registrationId, serviceId, newStatus)
      toast.success(`Cập nhật trạng thái ${newStatus} cho dịch vụ ${serviceId}`)
      // Refresh data after update
      fetchPatients()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  const handleInputResult = async (service: RegistrationService) => {
    try {
      // In real implementation, call API to add test result
      // await registrationsApi.addTestResult(service.id, resultData)
      toast.success(`Nhập kết quả cho: ${service.service.name}`)
      // Refresh data after adding result
      fetchPatients()
    } catch (error) {
      console.error('Error adding result:', error)
      toast.error('Có lỗi xảy ra khi nhập kết quả')
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchPatients()
  }

  const allServices = registrations.flatMap(r => r.services)

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

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên bệnh nhân, mã đăng ký..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ lấy mẫu</option>
              <option value="collecting">Đang lấy mẫu</option>
              <option value="testing">Đang xét nghiệm</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="pt-6">
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
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
          <CardContent className="p-6">
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
          <CardContent className="p-6">
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
          <CardContent className="p-6">
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

      {/* Registration List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Danh sách đăng ký ({filteredRegistrations.length})</span>
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
                  Không tìm thấy đăng ký phù hợp
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredRegistrations.map(registration => (
                    <Card key={registration.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{registration.patient.fullName}</h3>
                            <p className="text-sm text-gray-600">
                              Mã ĐK: {registration.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              Đăng ký: {formatDateTime(registration.registrationDate)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(registration)}
                          >
                            <Eye size={14} className="mr-1" />
                            Xem
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {registration.services.map(service => (
                            <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{service.service.name}</p>
                                <p className="text-xs text-gray-600">{service.service.code}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(service.status)}`}>
                                  {getStatusIcon(service.status)}
                                  <span className="ml-1">{getStatusLabel(service.status)}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient Details */}
        <div>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Chi tiết bệnh nhân</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPatient ? (
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold">{selectedPatient.fullName}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Giới tính:</span>
                        <p className="font-medium">
                          {getGenderLabel(selectedPatient.gender)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ngày sinh:</span>
                        <p className="font-medium">{formatDate(selectedPatient.birthYear)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Số điện thoại:</span>
                        <p className="font-medium">{selectedPatient.phoneNumber}</p>
                      </div>
                    </div>
                    {selectedPatient.address && (
                      <div className="mt-3">
                        <span className="text-gray-600 text-sm">Địa chỉ:</span>
                        <p className="font-medium">{selectedPatient.address}</p>
                      </div>
                    )}
                  </div>

                  {/* Test Services for selected patient */}
                  <div>
                    <h4 className="font-semibold mb-3">Dịch vụ xét nghiệm</h4>
                    {filteredRegistrations
                      .filter(reg => reg.patient.id === selectedPatient.id)
                      .flatMap(reg => reg.services)
                      .map(service => (
                      <div key={service.id} className="p-3 border rounded-lg mb-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{service.service.name}</p>
                            <p className="text-sm text-gray-600">{service.service.code}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(service.status)}`}>
                            {getStatusIcon(service.status)}
                            <span className="ml-1">{getStatusLabel(service.status)}</span>
                          </span>
                        </div>

                        {service.result && (
                          <div className="mt-3 p-2 bg-green-50 rounded">
                            <h5 className="font-medium text-sm text-green-800 mb-1">Kết quả:</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Giá trị:</span>
                                <span className="ml-1 font-medium">{service.result.value} {service.result.unit}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Bình thường:</span>
                                <span className="ml-1">{service.result.normalRange}</span>
                              </div>
                            </div>
                            {service.result.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Ghi chú:</span> {service.result.notes}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-2 mt-3">
                          {service.status !== 'completed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(service.id, 'testing')}
                              >
                                Bắt đầu XN
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleInputResult(service)}
                              >
                                <FileText size={14} className="mr-1" />
                                Nhập KQ
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chọn một bệnh nhân để xem chi tiết
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pagination */}
      {patientsData && patientsData.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
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
    </div>
  )
}

export default PatientInfo 