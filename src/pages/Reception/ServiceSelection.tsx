import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  TestTube, 
  Search, 
  Plus, 
  Trash2, 
  ShoppingCart,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { testTypesApi, patientsApi } from '@/services'
import type { TestType, PatientAPI } from '@/types/api'
import { toast } from 'react-hot-toast'

interface SelectedService {
  service: TestType
  quantity: number
  price: number
  total: number
}

const ServiceSelection: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<PatientAPI | null>(null)
  const [searchPatientQuery, setSearchPatientQuery] = useState('')
  const [searchServiceQuery, setSearchServiceQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API state
  const [testTypes, setTestTypes] = useState<TestType[]>([])
  const [patients, setPatients] = useState<PatientAPI[]>([])
  
  const [loadingTestTypes, setLoadingTestTypes] = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  // Fetch test types on component mount
  useEffect(() => {
    const fetchTestTypes = async () => {
      try {
        setLoadingTestTypes(true)
        const response = await testTypesApi.getAll({ 
          pageSize: 100, 
          status: 1 // Active only
        })
        setTestTypes(response.content)
      } catch (error) {
        console.error('Error fetching test types:', error)
        setError('Không thể tải danh sách xét nghiệm')
      } finally {
        setLoadingTestTypes(false)
      }
    }

    fetchTestTypes()
  }, [])

  // Search patients when query changes
  useEffect(() => {
    if (searchPatientQuery.trim()) {
      searchPatients()
    } else {
      setPatients([])
    }
  }, [searchPatientQuery])

  const searchPatients = async () => {
    try {
      setLoadingPatients(true)
      const response = await patientsApi.getAll({ 
        keyword: searchPatientQuery,
        pageSize: 10,
        status: 1 // Active only
      })
      setPatients(response.content)
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setLoadingPatients(false)
    }
  }

  const filteredTestTypes = testTypes.filter(testType => {
    const matchesSearch = testType.name.toLowerCase().includes(searchServiceQuery.toLowerCase()) ||
                         testType.code.toLowerCase().includes(searchServiceQuery.toLowerCase())
    return matchesSearch
  })

  const addService = (testType: TestType) => {
    const existingService = selectedServices.find(s => s.service.id === testType.id)
    if (existingService) {
      setSelectedServices(prev =>
        prev.map(s =>
          s.service.id === testType.id
            ? { ...s, quantity: s.quantity + 1, total: (s.quantity + 1) * s.price }
            : s
        )
      )
    } else {
      // Use the price from the test type
      const basePrice = testType.price || 100000 // Default price if not available
      setSelectedServices(prev => [
        ...prev,
        {
          service: testType,
          quantity: 1,
          price: basePrice,
          total: basePrice
        }
      ])
    }
  }

  const removeService = (serviceId: number) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId))
  }

  const updateQuantity = (serviceId: number, quantity: number) => {
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
      toast.error('Vui lòng chọn bệnh nhân và ít nhất một dịch vụ xét nghiệm!')
      return
    }

    setIsSubmitting(true)
    try {
      // Here you would typically call a registration API
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const registrationData = {
        patientId: selectedPatient.id,
        services: selectedServices.map(s => ({
          testTypeId: s.service.id,
          quantity: s.quantity,
          price: s.price
        })),
        totalAmount: calculateTotal(),
        notes: ''
      }
      
      console.log('Registration data:', registrationData)
      toast.success('Đã đăng ký dịch vụ xét nghiệm thành công!')
      
      // Reset form
      setSelectedServices([])
      setSelectedPatient(null)
      setSearchPatientQuery('')
    } catch (error) {
      console.error('Error submitting registration:', error)
      toast.error('Có lỗi xảy ra, vui lòng thử lại!')
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

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

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
                {loadingPatients && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>

              {selectedPatient ? (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-blue-900">{selectedPatient.fullName}</h3>
                      <p className="text-sm text-blue-700">SĐT: {selectedPatient.phoneNumber}</p>
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
                  {patients.map(patient => (
                    <div
                      key={patient.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="font-medium">{patient.fullName}</div>
                      <div className="text-sm text-gray-600">
                        {patient.phoneNumber}
                      </div>
                    </div>
                  ))}
                  {patients.length === 0 && searchPatientQuery && !loadingPatients && (
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
                            onClick={() => updateQuantity(item.service.id!, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.service.id!, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => removeService(item.service.id!)}
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
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Đăng ký xét nghiệm'
                    )}
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
                <span>Danh sách loại xét nghiệm</span>
                {loadingTestTypes && <Loader2 size={16} className="animate-spin" />}
              </CardTitle>
              <CardDescription>
                Chọn các loại xét nghiệm cần thực hiện
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm loại xét nghiệm..."
                  value={searchServiceQuery}
                  onChange={(e) => setSearchServiceQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Test Types Grid */}
              {loadingTestTypes ? (
                <div className="text-center py-8">
                  <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
                  <p className="mt-4 text-gray-500">Đang tải danh sách xét nghiệm...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredTestTypes.map(testType => (
                    <div
                      key={testType.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{testType.name}</h3>
                          <p className="text-sm text-gray-600">Mã: {testType.code}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(testType.price || 100000)}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addService(testType)}
                            className="mt-2"
                          >
                            <Plus size={16} className="mr-1" />
                            Chọn
                          </Button>
                        </div>
                      </div>
                      
                      {testType.description && (
                        <p className="text-sm text-gray-600 mb-2">{testType.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {!loadingTestTypes && filteredTestTypes.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      Không tìm thấy loại xét nghiệm phù hợp
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ServiceSelection 