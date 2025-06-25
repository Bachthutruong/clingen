import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
import { 
  TestTube, 
  Search, 
  Plus, 
  Trash2, 
//   Calculator,
  ShoppingCart,
  User,
//   Calendar
} from 'lucide-react'
import type { TestService, TestCategory, Patient } from '@/types/patient'
import { formatCurrency } from '@/lib/utils'

interface SelectedService {
  service: TestService
  quantity: number
  price: number
  total: number
}

const ServiceSelection: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchPatientQuery, setSearchPatientQuery] = useState('')
  const [searchServiceQuery, setSearchServiceQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data
  const mockTestCategories: TestCategory[] = [
    { id: '1', name: 'Xét nghiệm máu', code: 'BLOOD', description: 'Các xét nghiệm liên quan đến máu' },
    { id: '2', name: 'Xét nghiệm nước tiểu', code: 'URINE', description: 'Các xét nghiệm nước tiểu' },
    { id: '3', name: 'Xét nghiệm sinh hóa', code: 'BIOCHEM', description: 'Các xét nghiệm sinh hóa máu' },
    { id: '4', name: 'Xét nghiệm vi sinh', code: 'MICRO', description: 'Các xét nghiệm vi sinh vật' },
    { id: '5', name: 'Xét nghiệm hormon', code: 'HORMONE', description: 'Các xét nghiệm hormon' },
  ]

  const mockTestServices: TestService[] = [
    {
      id: '1',
      code: 'CBC',
      name: 'Công thức máu toàn phần',
      category: mockTestCategories[0],
      basePrice: 150000,
      description: 'Đếm số lượng và đánh giá hình thái các tế bào máu',
      normalRange: 'Theo độ tuổi và giới tính',
      unit: 'cells/μL',
      isActive: true,
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      code: 'GLU',
      name: 'Glucose máu đói',
      category: mockTestCategories[2],
      basePrice: 80000,
      description: 'Xét nghiệm đường huyết lúc đói',
      normalRange: '70-100 mg/dL',
      unit: 'mg/dL',
      isActive: true,
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      code: 'CHOL',
      name: 'Cholesterol toàn phần',
      category: mockTestCategories[2],
      basePrice: 120000,
      description: 'Xét nghiệm cholesterol tổng',
      normalRange: '<200 mg/dL',
      unit: 'mg/dL',
      isActive: true,
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      code: 'TSH',
      name: 'Hormone kích thích tuyến giáp',
      category: mockTestCategories[4],
      basePrice: 200000,
      description: 'Xét nghiệm TSH',
      normalRange: '0.4-4.0 mIU/L',
      unit: 'mIU/L',
      isActive: true,
      createdAt: '2024-01-01'
    },
    {
      id: '5',
      code: 'UREA',
      name: 'Urea máu',
      category: mockTestCategories[2],
      basePrice: 90000,
      description: 'Xét nghiệm chức năng thận',
      normalRange: '15-45 mg/dL',
      unit: 'mg/dL',
      isActive: true,
      createdAt: '2024-01-01'
    },
  ]

  const mockPatients: Patient[] = [
    {
      id: '1',
      patientCode: 'BN001',
      name: 'Nguyễn Văn A',
      dateOfBirth: '1990-01-15',
      gender: 'male',
      phone: '0123456789',
      address: '123 Đường ABC, Q1, TP.HCM',
      idNumber: '123456789',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '2',
      patientCode: 'BN002',
      name: 'Trần Thị B',
      dateOfBirth: '1985-03-20',
      gender: 'female',
      phone: '0987654321',
      address: '456 Đường XYZ, Q3, TP.HCM',
      idNumber: '987654321',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
  ]

  const filteredServices = mockTestServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchServiceQuery.toLowerCase()) ||
                         service.code.toLowerCase().includes(searchServiceQuery.toLowerCase())
    const matchesCategory = !selectedCategory || service.category.id === selectedCategory
    return matchesSearch && matchesCategory && service.isActive
  })

  const filteredPatients = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchPatientQuery.toLowerCase()) ||
    patient.patientCode.toLowerCase().includes(searchPatientQuery.toLowerCase()) ||
    patient.phone.includes(searchPatientQuery)
  )

  const addService = (service: TestService) => {
    const existingService = selectedServices.find(s => s.service.id === service.id)
    if (existingService) {
      setSelectedServices(prev =>
        prev.map(s =>
          s.service.id === service.id
            ? { ...s, quantity: s.quantity + 1, total: (s.quantity + 1) * s.price }
            : s
        )
      )
    } else {
      setSelectedServices(prev => [
        ...prev,
        {
          service,
          quantity: 1,
          price: service.basePrice,
          total: service.basePrice
        }
      ])
    }
  }

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId))
  }

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId)
      return
    }
    setSelectedServices(prev =>
      prev.map(s =>
        s.service.id === serviceId
          ? { ...s, quantity, total: quantity * s.price }
          : s
      )
    )
  }

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => sum + service.total, 0)
  }

  const handleSubmit = async () => {
    if (!selectedPatient || selectedServices.length === 0) {
      alert('Vui lòng chọn bệnh nhân và ít nhất một dịch vụ xét nghiệm!')
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const registrationData = {
        patientId: selectedPatient.id,
        services: selectedServices,
        totalAmount: calculateTotal(),
        notes: ''
      }
      
      console.log('Registration data:', registrationData)
      alert('Đã đăng ký dịch vụ xét nghiệm thành công!')
      
      // Reset form
      setSelectedServices([])
      setSelectedPatient(null)
      setSearchPatientQuery('')
    } catch (error) {
      alert('Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <TestTube size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dịch vụ xét nghiệm</h1>
            <p className="text-green-100">Chọn dịch vụ xét nghiệm cho bệnh nhân</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User size={20} className="text-blue-600" />
                <span>Chọn bệnh nhân</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm bệnh nhân..."
                  value={searchPatientQuery}
                  onChange={(e) => setSearchPatientQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedPatient ? (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-blue-900">{selectedPatient.name}</h3>
                      <p className="text-sm text-blue-700">Mã: {selectedPatient.patientCode}</p>
                      <p className="text-sm text-blue-700">SĐT: {selectedPatient.phone}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Đổi
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredPatients.map(patient => (
                    <div
                      key={patient.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-gray-600">
                        {patient.patientCode} • {patient.phone}
                      </div>
                    </div>
                  ))}
                  {filteredPatients.length === 0 && searchPatientQuery && (
                    <p className="text-gray-500 text-center py-4">
                      Không tìm thấy bệnh nhân
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Services Summary */}
          <Card className="shadow-lg border-0 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart size={20} className="text-green-600" />
                <span>Dịch vụ đã chọn</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedServices.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Chưa chọn dịch vụ nào
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedServices.map(item => (
                    <div key={item.service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.service.name}</div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(item.price)} x {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => removeService(item.service.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Tổng cộng:</span>
                      <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedPatient}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng ký xét nghiệm'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service Selection */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube size={20} className="text-purple-600" />
                <span>Danh sách dịch vụ xét nghiệm</span>
              </CardTitle>
              <CardDescription>
                Chọn các dịch vụ xét nghiệm cần thực hiện
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm dịch vụ..."
                    value={searchServiceQuery}
                    onChange={(e) => setSearchServiceQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tất cả danh mục</option>
                  {mockTestCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredServices.map(service => (
                  <div
                    key={service.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600">Mã: {service.code}</p>
                        <p className="text-sm text-blue-600">{service.category.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(service.basePrice)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addService(service)}
                          className="mt-2"
                        >
                          <Plus size={16} className="mr-1" />
                          Chọn
                        </Button>
                      </div>
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    )}
                    
                    {service.normalRange && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Giá trị bình thường:</span> {service.normalRange}
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredServices.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    Không tìm thấy dịch vụ phù hợp
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ServiceSelection 