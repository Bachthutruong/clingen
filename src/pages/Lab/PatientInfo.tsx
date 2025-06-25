import React, { useState } from 'react'
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
  FileText
} from 'lucide-react'
import type { Patient, Registration, RegistrationService } from '@/types/patient'
import { formatDate, formatDateTime } from '@/lib/utils'

const PatientInfo: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Mock data cho bệnh nhân có xét nghiệm
  const [registrations] = useState<Registration[]>([
    {
      id: 'REG001',
      patientId: '1',
      patient: {
        id: '1',
        patientCode: 'BN001',
        name: 'Nguyễn Văn A',
        dateOfBirth: '1990-01-15',
        gender: 'male',
        phone: '0123456789',
        address: '123 Đường ABC, Q1, TP.HCM',
        idNumber: '123456789',
        createdAt: '2024-01-15T10:30:00',
        updatedAt: '2024-01-15T10:30:00'
      },
      registrationDate: '2024-01-25T08:00:00',
      services: [
        {
          id: 'RS001',
          serviceId: '1',
          service: {
            id: '1',
            code: 'CBC',
            name: 'Công thức máu toàn phần',
            category: { id: '1', name: 'Xét nghiệm máu', code: 'BLOOD' },
            basePrice: 150000,
            isActive: true,
            createdAt: '2024-01-01'
          },
          price: 150000,
          status: 'collecting'
        },
        {
          id: 'RS002',
          serviceId: '2',
          service: {
            id: '2',
            code: 'GLU',
            name: 'Glucose máu đói',
            category: { id: '2', name: 'Sinh hóa', code: 'BIOCHEM' },
            basePrice: 80000,
            isActive: true,
            createdAt: '2024-01-01'
          },
          price: 80000,
          status: 'testing'
        },
        {
          id: 'RS003',
          serviceId: '3',
          service: {
            id: '3',
            code: 'CHOL',
            name: 'Cholesterol toàn phần',
            category: { id: '2', name: 'Sinh hóa', code: 'BIOCHEM' },
            basePrice: 120000,
            isActive: true,
            createdAt: '2024-01-01'
          },
          price: 120000,
          status: 'completed',
          result: {
            id: 'TR001',
            registrationServiceId: 'RS003',
            value: '185',
            normalRange: '<200 mg/dL',
            unit: 'mg/dL',
            interpretation: 'normal',
            notes: 'Kết quả bình thường',
            testedBy: 'user3',
            testedAt: '2024-01-25T14:30:00'
          }
        }
      ],
      totalAmount: 350000,
      status: 'in_progress',
      createdBy: 'user2',
      createdAt: '2024-01-25T08:00:00',
      updatedAt: '2024-01-25T14:30:00'
    },
    {
      id: 'REG002',
      patientId: '2',
      patient: {
        id: '2',
        patientCode: 'BN002',
        name: 'Trần Thị B',
        dateOfBirth: '1985-03-20',
        gender: 'female',
        phone: '0987654321',
        address: '456 Đường XYZ, Q3, TP.HCM',
        idNumber: '987654321',
        createdAt: '2024-01-14T14:20:00',
        updatedAt: '2024-01-14T14:20:00'
      },
      registrationDate: '2024-01-24T09:30:00',
      services: [
        {
          id: 'RS004',
          serviceId: '4',
          service: {
            id: '4',
            code: 'TSH',
            name: 'Hormone kích thích tuyến giáp',
            category: { id: '3', name: 'Hormone', code: 'HORMONE' },
            basePrice: 200000,
            isActive: true,
            createdAt: '2024-01-01'
          },
          price: 200000,
          status: 'pending'
        }
      ],
      totalAmount: 200000,
      status: 'pending',
      createdBy: 'user2',
      createdAt: '2024-01-24T09:30:00',
      updatedAt: '2024-01-24T09:30:00'
    }
  ])

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.patient.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleUpdateStatus = (serviceId: string, newStatus: string) => {
    alert(`Cập nhật trạng thái ${newStatus} cho dịch vụ ${serviceId}`)
  }

  const handleInputResult = (service: RegistrationService) => {
    alert(`Nhập kết quả cho: ${service.service.name}`)
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

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên bệnh nhân, mã BN, mã đăng ký..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ lấy mẫu</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {registrations.flatMap(r => r.services).filter(s => s.status === 'pending').length}
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
                  {registrations.flatMap(r => r.services).filter(s => s.status === 'testing').length}
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
                  {registrations.flatMap(r => r.services).filter(s => s.status === 'completed').length}
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
                  {registrations.flatMap(r => r.services).length}
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
              <CardTitle>Danh sách đăng ký ({filteredRegistrations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRegistrations.length === 0 ? (
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
                            <h3 className="font-semibold text-lg">{registration.patient.name}</h3>
                            <p className="text-sm text-gray-600">
                              Mã BN: {registration.patient.patientCode} • Mã ĐK: {registration.id}
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
                    <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Mã bệnh nhân:</span>
                        <p className="font-medium">{selectedPatient.patientCode}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Giới tính:</span>
                        <p className="font-medium">
                          {selectedPatient.gender === 'male' ? 'Nam' : 'Nữ'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ngày sinh:</span>
                        <p className="font-medium">{formatDate(selectedPatient.dateOfBirth)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Số điện thoại:</span>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-gray-600 text-sm">Địa chỉ:</span>
                      <p className="font-medium">{selectedPatient.address}</p>
                    </div>
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
    </div>
  )
}

export default PatientInfo 