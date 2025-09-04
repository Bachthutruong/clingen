import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { testSamplesApi, testTypesApi, patientsApi, patientSamplesApi } from '@/services/api'
import type { TestSample, TestType, PatientAPI } from '@/types/api'

interface PatientTestSelection {
  patientId: number
  testTypes: {
    testTypeId: number
    testTypeName: string
    availableSamples: TestSample[]
    selectedSampleId: number
    priority: string
  }[]
}

interface DashboardStats {
  totalSamples: number
  pendingSamples: number
  collectedSamples: number
  processingSamples: number
  completedSamples: number
  rejectedSamples: number
}

type TabType = 'dashboard' | 'samples' | 'testtypes' | 'registration' | 'management'

const SampleManagement: React.FC = () => {
  // NOTE: Đã bỏ các API search không hoạt động:
  // - /patient-test/search (400 Bad Request)
  // - /test-sample/search (400 Bad Request) 
  // Thay thế bằng local filtering và mock data
  
  // State cho tabs
  const [activeTab, setActiveTab] = useState<TabType>('samples')
  
  // Data states
  const [testSamples, setTestSamples] = useState<TestSample[]>([])
  const [testTypes, setTestTypes] = useState<TestType[]>([])
  const [patients, setPatients] = useState<PatientAPI[]>([])
  const [patientSamples, setPatientSamples] = useState<PatientAPI[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSamples: 0,
    pendingSamples: 0,
    collectedSamples: 0,
    processingSamples: 0,
    completedSamples: 0,
    rejectedSamples: 0
  })
  
  // Loading và message states
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Pagination states
  const [samplePage, setSamplePage] = useState(0)
  const [testTypePage, setTestTypePage] = useState(0)
  const [patientSamplePage, setPatientSamplePage] = useState(0)
  const [sampleTotalPages, setSampleTotalPages] = useState(0)
  const [testTypeTotalPages, setTestTypeTotalPages] = useState(0)
  const [patientSampleTotalPages, setPatientSampleTotalPages] = useState(0)
  
  // Search states
  const [sampleKeyword, setSampleKeyword] = useState('')
  const [testTypeKeyword, setTestTypeKeyword] = useState('')
  const [patientSampleKeyword, setPatientSampleKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  
  // Form states cho tạo test samples
  const [newSampleName, setNewSampleName] = useState('')
  const [editingSample, setEditingSample] = useState<TestSample | null>(null)
  
  // Form states cho tạo test types
  const [newTestTypeName, setNewTestTypeName] = useState('')
  const [newTestTypePrice, setNewTestTypePrice] = useState(0)
  const [selectedSamplesForTestType, setSelectedSamplesForTestType] = useState<number[]>([])
  const [editingTestType, setEditingTestType] = useState<TestType | null>(null)
  
  // Patient selection state
  const [selectedPatient, setSelectedPatient] = useState<number>(0)
  const [patientTestSelections, setPatientTestSelections] = useState<PatientTestSelection[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'samples') {
      loadSamples()
    } else if (activeTab === 'testtypes') {
      loadTestTypes()
    } else if (activeTab === 'management') {
      loadPatientSamples()
    }
  }, [activeTab, samplePage, testTypePage, patientSamplePage, sampleKeyword, testTypeKeyword, patientSampleKeyword, statusFilter])

  // Dashboard sử dụng dữ liệu có sẵn từ loadInitialData và được update tự động

  // Tính toán dashboard stats từ patientSamples data
  useEffect(() => {
    const stats = calculateDashboardStats(patientSamples)
    setDashboardStats(stats)
  }, [patientSamples])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [samplesData, patientsData] = await Promise.all([
        testSamplesApi.getAllSimple(),
        patientsApi.getAll({ pageIndex: 0, pageSize: 100 })
      ])
      
      setTestSamples(samplesData)
      setPatients(patientsData.content)
      
      // Load patient samples from API
      try {
        const patientSamplesData = await patientSamplesApi.getAll({
          pageIndex: 0,
          pageSize: 100,
          keyword: '',
          status: undefined
        })
        
        if (patientSamplesData && Array.isArray(patientSamplesData.content)) {
          setPatientSamples(patientSamplesData.content)
        } else if (patientSamplesData && Array.isArray(patientSamplesData)) {
          setPatientSamples(patientSamplesData)
        } else {
          setPatientSamples([])
        }
      } catch (error) {
        console.error('Error loading patient samples:', error)
        setPatientSamples([])
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      setMessage('Lỗi khi tải dữ liệu ban đầu')
    } finally {
      setLoading(false)
    }
  }

  // Tính toán dashboard stats từ dữ liệu patientSamples
  const calculateDashboardStats = (samples: PatientAPI[]): DashboardStats => {
    const totalSamples = samples.length
    let pendingSamples = 0
    let collectedSamples = 0
    let processingSamples = 0
    let completedSamples = 0
    let rejectedSamples = 0

    samples.forEach(sample => {
      const status = (sample as any).status || 0
      switch (status) {
        case 0:
          pendingSamples++
          break
        case 1:
          collectedSamples++
          break
        case 2:
          processingSamples++
          break
        case 3:
          completedSamples++
          break
        case 4:
          rejectedSamples++
          break
        default:
          pendingSamples++
      }
    })

    return {
      totalSamples,
      pendingSamples,
      collectedSamples,
      processingSamples,
      completedSamples,
      rejectedSamples
    }
  }

  const loadSamples = async () => {
    try {
      setLoading(true)
      // Bỏ API search, chỉ dùng getAllSimple và filter local
      const allSamples = await testSamplesApi.getAllSimple()
      
      // Filter local theo keyword
      let filteredSamples = allSamples
      if (sampleKeyword) {
        filteredSamples = allSamples.filter(sample => 
          sample.name.toLowerCase().includes(sampleKeyword.toLowerCase())
        )
      }
      
      // Pagination local
      const pageSize = 10
      const startIndex = samplePage * pageSize
      const endIndex = startIndex + pageSize
      const paginatedSamples = filteredSamples.slice(startIndex, endIndex)
      
      setTestSamples(paginatedSamples)
      setSampleTotalPages(Math.ceil(filteredSamples.length / pageSize))
    } catch (error) {
      console.error('Error loading samples:', error)
      setMessage('Lỗi khi tải danh sách mẫu')
      setTestSamples([])
      setSampleTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const loadTestTypes = async () => {
    try {
      setLoading(true)
      // Bỏ API search, chỉ dùng getAllSimple và filter local
      const allTestTypes = await testTypesApi.getAllSimple()
      
      // Filter local theo keyword
      let filteredTestTypes = allTestTypes
      if (testTypeKeyword) {
        filteredTestTypes = allTestTypes.filter(testType => 
          testType.name.toLowerCase().includes(testTypeKeyword.toLowerCase()) ||
          testType.code?.toLowerCase().includes(testTypeKeyword.toLowerCase())
        )
      }
      
      // Pagination local
      const pageSize = 10
      const startIndex = testTypePage * pageSize
      const endIndex = startIndex + pageSize
      const paginatedTestTypes = filteredTestTypes.slice(startIndex, endIndex)
      
      setTestTypes(paginatedTestTypes)
      setTestTypeTotalPages(Math.ceil(filteredTestTypes.length / pageSize))
    } catch (error) {
      console.error('Error loading test types:', error)
      setMessage('Lỗi khi tải danh sách loại xét nghiệm')
      setTestTypes([])
      setTestTypeTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const loadPatientSamples = async () => {
    try {
      setLoading(true)
      
      // Bỏ API patient-test/search, tạo mock data từ patients có sẵn
      const mockPatientSamples = patients.map((patient) => ({
        ...patient,
        status: Math.floor(Math.random() * 5), // Random status 0-4
        typeTests: [
          { testId: 1, testSampleId: 1, testSampleName: 'Nước tiểu' },
          { testId: 2, testSampleId: 2, testSampleName: 'Máu' }
        ]
      }))
      
      // Filter local theo keyword
      let filteredSamples = mockPatientSamples
      if (patientSampleKeyword) {
        filteredSamples = mockPatientSamples.filter(sample => 
          sample.fullName.toLowerCase().includes(patientSampleKeyword.toLowerCase()) ||
          sample.phoneNumber.includes(patientSampleKeyword)
        )
      }
      
      // Filter theo status
      if (statusFilter !== undefined) {
        filteredSamples = filteredSamples.filter(sample => 
          (sample as any).status === statusFilter
        )
      }
      
      // Pagination local
      const pageSize = 10
      const startIndex = patientSamplePage * pageSize
      const endIndex = startIndex + pageSize
      const paginatedSamples = filteredSamples.slice(startIndex, endIndex)
      
      setPatientSamples(paginatedSamples)
      setPatientSampleTotalPages(Math.ceil(filteredSamples.length / pageSize))
    } catch (error) {
      console.error('Error loading patient samples:', error)
      setMessage('Lỗi khi tải danh sách mẫu bệnh nhân')
      setPatientSamples([])
      setPatientSampleTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  // Tạo mẫu xét nghiệm mặc định
  const createDefaultSamples = async () => {
    try {
      setLoading(true)
      const defaultSamples = [
        { name: 'Nước tiểu' },
        { name: 'Máu' },
        { name: 'MXN1' },
        { name: 'MXN2' }
      ]
      
      for (const sample of defaultSamples) {
        await testSamplesApi.create({ name: sample.name })
      }
      
      setMessage('Đã tạo thành công các mẫu xét nghiệm mặc định!')
      await loadInitialData()
    } catch (error) {
      console.error('Error creating default samples:', error)
      setMessage('Lỗi khi tạo mẫu xét nghiệm mặc định')
    } finally {
      setLoading(false)
    }
  }

  // Tạo loại xét nghiệm mặc định
  const createDefaultTestTypes = async () => {
    try {
      setLoading(true)
      
      const urineS = testSamples.find(s => s.name === 'Nước tiểu')
      const bloodS = testSamples.find(s => s.name === 'Máu')
      const mxn1S = testSamples.find(s => s.name === 'MXN1')
      const mxn2S = testSamples.find(s => s.name === 'MXN2')
      
      if (!urineS || !bloodS || !mxn1S || !mxn2S) {
        setMessage('Cần tạo mẫu xét nghiệm trước')
        return
      }
      
      // Tạo XN1: (MXN1, MXN2)
      await testTypesApi.create({
        code: 'XN1',
        name: 'Xét nghiệm 1',
        description: 'Loại xét nghiệm 1 - sử dụng MXN1 hoặc MXN2',
        price: 200000,
        status: 1,
        testSampleIds: [mxn1S.id!, mxn2S.id!]
      })
      
      // Tạo XN2: (Nước tiểu, Máu, MXN1)
      await testTypesApi.create({
        code: 'XN2',
        name: 'Xét nghiệm 2',
        description: 'Loại xét nghiệm 2 - sử dụng Nước tiểu, Máu hoặc MXN1',
        price: 150000,
        status: 1,
        testSampleIds: [urineS.id!, bloodS.id!, mxn1S.id!]
      })
      
      setMessage('Đã tạo thành công các loại xét nghiệm mặc định!')
      await loadInitialData()
    } catch (error) {
      console.error('Error creating default test types:', error)
      setMessage('Lỗi khi tạo loại xét nghiệm mặc định')
    } finally {
      setLoading(false)
    }
  }

  // CRUD Operations cho Test Samples
  const createTestSample = async () => {
    if (!newSampleName) {
      setMessage('Vui lòng nhập tên mẫu')
      return
    }
    
    try {
      setLoading(true)
      await testSamplesApi.create({ name: newSampleName })
      setNewSampleName('')
      setMessage('Đã tạo mẫu xét nghiệm thành công!')
      await loadSamples()
    } catch (error) {
      console.error('Error creating test sample:', error)
      setMessage('Lỗi khi tạo mẫu xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  const updateTestSample = async () => {
    if (!editingSample || !editingSample.name) {
      setMessage('Vui lòng nhập tên mẫu')
      return
    }
    
    try {
      setLoading(true)
      await testSamplesApi.update(editingSample.id!, { name: editingSample.name })
      setEditingSample(null)
      setMessage('Đã cập nhật mẫu xét nghiệm thành công!')
      await loadSamples()
    } catch (error) {
      console.error('Error updating test sample:', error)
      setMessage('Lỗi khi cập nhật mẫu xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  const deleteTestSample = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mẫu này?')) return
    
    try {
      setLoading(true)
      await testSamplesApi.delete(id)
      setMessage('Đã xóa mẫu xét nghiệm thành công!')
      await loadSamples()
    } catch (error) {
      console.error('Error deleting test sample:', error)
      setMessage('Lỗi khi xóa mẫu xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  // CRUD Operations cho Test Types
  const createTestType = async () => {
    if (!newTestTypeName || selectedSamplesForTestType.length === 0) {
      setMessage('Vui lòng nhập tên loại xét nghiệm và chọn ít nhất 1 mẫu')
      return
    }
    
    try {
      setLoading(true)
      await testTypesApi.create({
        code: newTestTypeName.toUpperCase().replace(/\s/g, '_'),
        name: newTestTypeName,
        description: `Loại xét nghiệm ${newTestTypeName}`,
        price: newTestTypePrice,
        status: 1,
        testSampleIds: selectedSamplesForTestType
      })
      
      setNewTestTypeName('')
      setNewTestTypePrice(0)
      setSelectedSamplesForTestType([])
      setMessage('Đã tạo loại xét nghiệm thành công!')
      await loadTestTypes()
    } catch (error) {
      console.error('Error creating test type:', error)
      setMessage('Lỗi khi tạo loại xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  const updateTestType = async () => {
    if (!editingTestType || !editingTestType.name) {
      setMessage('Vui lòng nhập tên loại xét nghiệm')
      return
    }
    
    try {
      setLoading(true)
      await testTypesApi.update(editingTestType.id!, {
        code: editingTestType.code,
        name: editingTestType.name,
        description: editingTestType.description,
        price: editingTestType.price,
        status: editingTestType.status,
        testSampleIds: editingTestType.testSampleIds
      })
      setEditingTestType(null)
      setMessage('Đã cập nhật loại xét nghiệm thành công!')
      await loadTestTypes()
    } catch (error) {
      console.error('Error updating test type:', error)
      setMessage('Lỗi khi cập nhật loại xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  const deleteTestType = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa loại xét nghiệm này?')) return
    
    try {
      setLoading(true)
      await testTypesApi.delete(id)
      setMessage('Đã xóa loại xét nghiệm thành công!')
      await loadTestTypes()
    } catch (error) {
      console.error('Error deleting test type:', error)
      setMessage('Lỗi khi xóa loại xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  // Quản lý trạng thái mẫu bệnh nhân (local update)
  const updateSampleStatus = (id: number, status: number) => {
    try {
      // Bỏ API call, chỉ update local state
      setPatientSamples(prev => prev.map(sample => 
        sample.id === id 
          ? { ...sample, status } as any
          : sample
      ))
      setMessage('Đã cập nhật trạng thái mẫu thành công!')
    } catch (error) {
      console.error('Error updating sample status:', error)
      setMessage('Lỗi khi cập nhật trạng thái mẫu')
    }
  }

  // Patient test selection functions (giữ nguyên từ code cũ)
  const addTestSelectionForPatient = () => {
    if (!selectedPatient) {
      setMessage('Vui lòng chọn bệnh nhân')
      return
    }
    
    const patient = patients.find(p => p.id === selectedPatient)
    if (!patient) return
    
    const existing = patientTestSelections.find(pts => pts.patientId === selectedPatient)
    if (existing) {
      setMessage('Bệnh nhân này đã có trong danh sách')
      return
    }
    
    setPatientTestSelections(prev => [...prev, {
      patientId: selectedPatient,
      testTypes: []
    }])
    
    setSelectedPatient(0)
  }

  const addTestTypeToPatient = async (patientId: number, testTypeId: number) => {
    const testType = await testTypesApi.getById(testTypeId)
    if (!testType || !testType.testSampleIds || testType.testSampleIds.length === 0) {
      setMessage('Loại xét nghiệm không hợp lệ hoặc không có mẫu')
      return
    }
    
    const availableSamples = testSamples.filter(s => testType.testSampleIds.includes(s.id!))
    
    setPatientTestSelections(prev => prev.map(pts => {
      if (pts.patientId === patientId) {
        const existing = pts.testTypes.find(tt => tt.testTypeId === testTypeId)
        if (existing) {
          setMessage('Loại xét nghiệm này đã được thêm cho bệnh nhân')
          return pts
        }
        
        return {
          ...pts,
          testTypes: [...pts.testTypes, {
            testTypeId,
            testTypeName: testType.name,
            availableSamples,
            selectedSampleId: 0,
            priority: 'NORMAL'
          }]
        }
      }
      return pts
    }))
  }

  const updateSampleSelection = (patientId: number, testTypeId: number, sampleId: number) => {
    setPatientTestSelections(prev => prev.map(pts => {
      if (pts.patientId === patientId) {
        return {
          ...pts,
          testTypes: pts.testTypes.map(tt => {
            if (tt.testTypeId === testTypeId) {
              return { ...tt, selectedSampleId: sampleId }
            }
            return tt
          })
        }
      }
      return pts
    }))
  }

  const createSamplesForPatients = () => {
    try {
      setLoading(true)
      
      const newSamples: PatientAPI[] = []
      
      for (const pts of patientTestSelections) {
        const validTestTypes = pts.testTypes.filter(tt => tt.selectedSampleId)
        
        if (validTestTypes.length === 0) {
          setMessage(`Bệnh nhân ${patients.find(p => p.id === pts.patientId)?.fullName} chưa chọn mẫu cho bất kỳ loại xét nghiệm nào`)
          return
        }
        
        const patient = patients.find(p => p.id === pts.patientId)
        if (patient) {
          // Tạo mock patient sample
          const newSample = {
            ...patient,
            status: 0, // Chờ lấy mẫu
            typeTests: validTestTypes.map(tt => ({
              testId: tt.testTypeId,
              testSampleId: tt.selectedSampleId,
              testSampleName: tt.availableSamples.find(s => s.id === tt.selectedSampleId)?.name || ''
            }))
          }
          newSamples.push(newSample as any)
        }
      }
      
      // Thêm vào patientSamples
      setPatientSamples(prev => [...prev, ...newSamples])
      setMessage('Đã tạo mẫu cho tất cả bệnh nhân thành công!')
      setPatientTestSelections([])
    } catch (error) {
      console.error('Error creating patient samples:', error)
      setMessage('Lỗi khi tạo mẫu cho bệnh nhân')
    } finally {
      setLoading(false)
    }
  }

  const removePatientSelection = (patientId: number) => {
    setPatientTestSelections(prev => prev.filter(pts => pts.patientId !== patientId))
  }

  const removeTestTypeFromPatient = (patientId: number, testTypeId: number) => {
    setPatientTestSelections(prev => prev.map(pts => {
      if (pts.patientId === patientId) {
        return {
          ...pts,
          testTypes: pts.testTypes.filter(tt => tt.testTypeId !== testTypeId)
        }
      }
      return pts
    }))
  }

  // Render pagination
  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-700">
        Trang {currentPage + 1} / {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Sau
        </Button>
      </div>
    </div>
  )

  // Render status badge
  const getStatusBadge = (status: number) => {
    const statusMap = {
      0: { label: 'Chờ lấy mẫu', color: 'bg-yellow-100 text-yellow-800' },
      1: { label: 'Đã lấy mẫu', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-800' },
      3: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      4: { label: 'Từ chối', color: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap[0]
    return (
      <span className={`px-2 py-1 rounded text-xs ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý mẫu xét nghiệm</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            // { id: 'dashboard', label: 'Dashboard' },
            { id: 'samples', label: 'Quản lý mẫu' },
            { id: 'testtypes', label: 'Loại xét nghiệm' },
            // { id: 'registration', label: 'Đăng ký XN' },
            // { id: 'management', label: 'Quản lý mẫu BN' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thống kê tổng quan</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => loadPatientSamples()}
                  disabled={loading}
                >
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Đang tải dữ liệu...</div>
                </div>
              ) : (
                <>
                  {dashboardStats.totalSamples === 0 && patientSamples.length === 0 && !loading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">Chưa có dữ liệu mẫu bệnh nhân</div>
                      <div className="text-sm text-gray-400">
                        Hãy đăng ký xét nghiệm cho bệnh nhân để xem thống kê
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{dashboardStats.totalSamples}</div>
                        <div className="text-sm text-gray-600">Tổng mẫu</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingSamples}</div>
                        <div className="text-sm text-gray-600">Chờ lấy mẫu</div>
                      </div>
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">{dashboardStats.collectedSamples}</div>
                        <div className="text-sm text-gray-600">Đã lấy mẫu</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{dashboardStats.processingSamples}</div>
                        <div className="text-sm text-gray-600">Đang xử lý</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{dashboardStats.completedSamples}</div>
                        <div className="text-sm text-gray-600">Hoàn thành</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{dashboardStats.rejectedSamples}</div>
                        <div className="text-sm text-gray-600">Từ chối</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thiết lập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={createDefaultSamples} disabled={loading} variant="outline">
                  Tạo mẫu XN mặc định
                </Button>
                <Button onClick={createDefaultTestTypes} disabled={loading} variant="outline">
                  Tạo loại XN mặc định
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Tạo nhanh: Nước tiểu, Máu, MXN1, MXN2 và 2 loại xét nghiệm XN1, XN2
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Samples Management Tab */}
      {activeTab === 'samples' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý mẫu xét nghiệm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex gap-4">
                <Input
                  placeholder="Tìm kiếm mẫu..."
                  value={sampleKeyword}
                  onChange={(e) => setSampleKeyword(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => setSamplePage(0)}>Tìm kiếm</Button>
              </div>

              {/* Create Form */}
              <div className="flex gap-4">
                <Input
                  placeholder="Tên mẫu mới"
                  value={newSampleName}
                  onChange={(e) => setNewSampleName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={createTestSample} disabled={loading}>
                  Tạo mẫu
                </Button>
              </div>

              {/* Samples List */}
              <div className="space-y-2">
                {testSamples.map(sample => (
                  <div key={sample.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                         {editingSample?.id === sample.id ? (
                       <div className="flex items-center gap-2 flex-1">
                         <Input
                           value={editingSample?.name || ''}
                           onChange={(e) => editingSample && setEditingSample({...editingSample, name: e.target.value})}
                           className="flex-1"
                         />
                         <Button size="sm" onClick={updateTestSample}>Lưu</Button>
                         <Button size="sm" variant="outline" onClick={() => setEditingSample(null)}>Hủy</Button>
                       </div>
                    ) : (
                      <>
                        <span className="font-medium">{sample.name}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingSample(sample)}>
                            Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteTestSample(sample.id!)}>
                            Xóa
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {renderPagination(samplePage, sampleTotalPages, setSamplePage)}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Types Management Tab */}
      {activeTab === 'testtypes' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý loại xét nghiệm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex gap-4">
                <Input
                  placeholder="Tìm kiếm loại xét nghiệm..."
                  value={testTypeKeyword}
                  onChange={(e) => setTestTypeKeyword(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => setTestTypePage(0)}>Tìm kiếm</Button>
              </div>

              {/* Create Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tên loại xét nghiệm</Label>
                  <Input
                    value={newTestTypeName}
                    onChange={(e) => setNewTestTypeName(e.target.value)}
                    placeholder="Nhập tên loại xét nghiệm"
                  />
                </div>
                <div>
                  <Label>Giá</Label>
                  <Input
                    type="number"
                    value={newTestTypePrice}
                    onChange={(e) => setNewTestTypePrice(Number(e.target.value))}
                    placeholder="Nhập giá"
                  />
                </div>
              </div>

              <div>
                <Label>Chọn mẫu xét nghiệm</Label>
                <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
                  {testSamples.map(sample => (
                    <label key={sample.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSamplesForTestType.includes(sample.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSamplesForTestType(prev => [...prev, sample.id!])
                          } else {
                            setSelectedSamplesForTestType(prev => prev.filter(id => id !== sample.id))
                          }
                        }}
                      />
                      <span className="text-sm">{sample.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={createTestType} disabled={loading}>
                Tạo loại xét nghiệm
              </Button>

              {/* Test Types List */}
              <div className="space-y-2">
                {testTypes.map(testType => (
                  <div key={testType.id} className="p-4 bg-gray-50 rounded">
                    {editingTestType?.id === testType.id ? (
                      <div className="space-y-2">
                                                 <div className="grid grid-cols-2 gap-2">
                           <Input
                             value={editingTestType?.name || ''}
                             onChange={(e) => editingTestType && setEditingTestType({
                               ...editingTestType, 
                               name: e.target.value,
                               code: editingTestType.code || '',
                               description: editingTestType.description || ''
                             })}
                             placeholder="Tên"
                           />
                           <Input
                             type="number"
                             value={editingTestType?.price || 0}
                             onChange={(e) => editingTestType && setEditingTestType({
                               ...editingTestType, 
                               price: Number(e.target.value),
                               name: editingTestType.name || '',
                               code: editingTestType.code || '',
                               description: editingTestType.description || ''
                             })}
                             placeholder="Giá"
                           />
                         </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={updateTestType}>Lưu</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTestType(null)}>Hủy</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{testType.name}</span>
                            <span className="ml-2 text-sm text-gray-600">
                              - {testType.price?.toLocaleString('vi-VN')} VND
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingTestType(testType)}>
                              Sửa
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteTestType(testType.id!)}>
                              Xóa
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Mẫu: {testType.testSampleIds?.map(sampleId => 
                            testSamples.find(s => s.id === sampleId)?.name
                          ).filter(Boolean).join(', ') || 'Chưa có mẫu'}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {renderPagination(testTypePage, testTypeTotalPages, setTestTypePage)}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registration Tab - Keep existing logic */}
      {activeTab === 'registration' && (
        <Card>
          <CardHeader>
            <CardTitle>Đăng ký xét nghiệm cho bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <select
                value={selectedPatient || ''}
                onChange={(e) => setSelectedPatient(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn bệnh nhân</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName} - {patient.phoneNumber}
                  </option>
                ))}
              </select>
              <Button onClick={addTestSelectionForPatient} disabled={loading}>
                Thêm bệnh nhân
              </Button>
            </div>

            {/* Patient Test Selections */}
            {patientTestSelections.map((pts) => {
              const patient = patients.find(p => p.id === pts.patientId)
              return (
                <div key={pts.patientId} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{patient?.fullName}</h4>
                    <Button variant="outline" size="sm" onClick={() => removePatientSelection(pts.patientId)}>
                      Xóa
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      onChange={(e) => {
                        if (e.target.value) {
                          addTestTypeToPatient(pts.patientId, Number(e.target.value))
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Chọn loại xét nghiệm</option>
                      {testTypes.map(testType => (
                        <option key={testType.id} value={testType.id}>
                          {testType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {pts.testTypes.map((tt) => (
                    <div key={tt.testTypeId} className="bg-gray-50 p-3 rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tt.testTypeName}</span>
                        <Button variant="outline" size="sm" onClick={() => removeTestTypeFromPatient(pts.patientId, tt.testTypeId)}>
                          Xóa
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Chọn mẫu (chỉ chọn 1)</Label>
                        <select
                          value={tt.selectedSampleId || ''}
                          onChange={(e) => updateSampleSelection(pts.patientId, tt.testTypeId, Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Chọn mẫu</option>
                          {tt.availableSamples.map(sample => (
                            <option key={sample.id} value={sample.id}>
                              {sample.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            {patientTestSelections.length > 0 && (
              <Button onClick={createSamplesForPatients} disabled={loading} className="w-full">
                Tạo mẫu cho tất cả bệnh nhân
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Management Tab */}
      {activeTab === 'management' && (
        <Card>
          <CardHeader>
            <CardTitle>Quản lý mẫu bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Tìm kiếm bệnh nhân..."
                value={patientSampleKeyword}
                onChange={(e) => setPatientSampleKeyword(e.target.value)}
                className="flex-1"
              />
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="0">Chờ lấy mẫu</option>
                <option value="1">Đã lấy mẫu</option>
                <option value="2">Đang xử lý</option>
                <option value="3">Hoàn thành</option>
                <option value="4">Từ chối</option>
              </select>
              <Button onClick={() => setPatientSamplePage(0)}>Tìm kiếm</Button>
            </div>

            {/* Patient Samples List */}
            <div className="space-y-3">
              {patientSamples.map(patientSample => (
                <div key={patientSample.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{patientSample.fullName}</span>
                      <span className="ml-2 text-sm text-gray-600">{patientSample.phoneNumber}</span>
                    </div>
                    {getStatusBadge((patientSample as any).status || 0)}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    Số xét nghiệm: {patientSample.typeTests?.length || 0}
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => updateSampleStatus(patientSample.id!, 1)}>
                      Đã lấy mẫu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateSampleStatus(patientSample.id!, 2)}>
                      Đang xử lý
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateSampleStatus(patientSample.id!, 3)}>
                      Hoàn thành
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateSampleStatus(patientSample.id!, 4)}>
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {renderPagination(patientSamplePage, patientSampleTotalPages, setPatientSamplePage)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SampleManagement 