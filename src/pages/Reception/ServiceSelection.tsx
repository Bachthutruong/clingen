import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TestTube, 
  Search, 
  Plus, 
  Trash2, 
  Loader2,
  AlertCircle,
  X,
  Settings,
  Edit,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { testTypesApi, testSamplesApi } from '@/services'
import type { TestType, TestSample, CreateTestTypeRequest } from '@/types/api'
import { toast } from 'react-hot-toast'

interface NewTestTypeForm {
  name: string
  code: string
  description: string
  price: number
  status: number
  testSampleIds: number[]
  classPathTemplate?: string
}

const ServiceSelection: React.FC = () => {
  const [searchServiceQuery, setSearchServiceQuery] = useState('')

  // Modal state for adding new test type
  const [showAddModal, setShowAddModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTestTypeForm, setNewTestTypeForm] = useState<NewTestTypeForm>({
    name: '',
    code: '',
    description: '',
    price: 0,
    status: 1,
    testSampleIds: [],
    classPathTemplate: ''
  })

  // Modal state for editing test type
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTestType, setEditingTestType] = useState<TestType | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTestTypeForm, setEditTestTypeForm] = useState<NewTestTypeForm>({
    name: '',
    code: '',
    description: '',
    price: 0,
    status: 1,
    testSampleIds: [],
    classPathTemplate: ''
  })

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingTestType, setDeletingTestType] = useState<TestType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Setup state
  const [isSettingUp, setIsSettingUp] = useState(false)

  // API state
  const [testTypes, setTestTypes] = useState<TestType[]>([])
  const [testSamples, setTestSamples] = useState<TestSample[]>([])
  
  const [loadingTestTypes, setLoadingTestTypes] = useState(true)
  const [loadingTestSamples, setLoadingTestSamples] = useState(false)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0
  })
  
  const [error, setError] = useState<string | null>(null)

  // Fetch test types với pagination
  const fetchTestTypes = async (pageIndex: number = pagination.pageIndex, pageSize: number = pagination.pageSize) => {
    try {
      setLoadingTestTypes(true)
      const testTypesResponse = await testTypesApi.getAll({ 
        pageIndex,
        pageSize, 
        status: 1 // Active only
      })
      
      // Fix: Response có structure lồng nhau response.content.content
      // @ts-ignore - Response có nested structure
      const testTypesArray = testTypesResponse.content?.content || testTypesResponse.content || []
      setTestTypes(testTypesArray)
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        pageIndex,
        pageSize,
        totalElements: testTypesResponse.totalElements || 0,
        totalPages: testTypesResponse.totalPages || 0
      }))
    } catch (error) {
      console.error('Error fetching test types:', error)
      setError('Không thể tải danh sách xét nghiệm')
    } finally {
      setLoadingTestTypes(false)
    }
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    fetchTestTypes(0, newPageSize) // Reset to first page when changing page size
  }

  // Fetch test types and samples on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingTestSamples(true)
        
        const [, testSamplesResponse] = await Promise.all([
          fetchTestTypes(0), // Load first page
          testSamplesApi.getAllSimple() // Sử dụng GET /test-sample endpoint
        ])
        
        setTestSamples(testSamplesResponse) // Response đã được transform trong API
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Không thể tải danh sách xét nghiệm')
      } finally {
        setLoadingTestSamples(false)
      }
    }

    fetchData()
  }, [])

  // Fetch test samples when modal opens
  useEffect(() => {
    if (showAddModal && (!Array.isArray(testSamples) || testSamples.length === 0)) {
      fetchTestSamples()
    }
  }, [showAddModal])

  const fetchTestSamples = async () => {
    try {
      setLoadingTestSamples(true)
      const response = await testSamplesApi.getAllSimple() // Sử dụng GET /test-sample endpoint
      setTestSamples(response)
    } catch (error) {
      console.error('Error fetching test samples:', error)
      toast.error('Không thể tải danh sách mẫu xét nghiệm')
    } finally {
      setLoadingTestSamples(false)
    }
  }

  // Debug edit modal data
  useEffect(() => {
    if (showEditModal && editingTestType) {
      console.log('Edit Modal opened - Form data:', editTestTypeForm)
      console.log('Edit Modal opened - Test samples:', testSamples)
      console.log('Edit Modal opened - Editing test type:', editingTestType)
    }
  }, [showEditModal, editingTestType, editTestTypeForm, testSamples])

  // Setup default data
  const setupDefaultData = async () => {
    try {
      setIsSettingUp(true)
      toast.loading('Đang thiết lập dữ liệu mặc định...')
      
      // Create default samples
      const defaultSamples = [
        { name: 'Nước tiểu' },
        { name: 'Máu' },
        { name: 'MXN1' },
        { name: 'MXN2' }
      ]
      
      const createdSamples = []
      for (const sample of defaultSamples) {
        try {
                     const existing = (Array.isArray(testSamples) ? testSamples : []).find(s => s.name === sample.name)
          if (!existing) {
            const created = await testSamplesApi.create(sample)
            createdSamples.push(created)
          } else {
            createdSamples.push(existing)
          }
        } catch (err) {
          console.log(`Sample ${sample.name} might already exist`)
        }
      }
      
      // Refresh samples list
      const allSamples = await testSamplesApi.getAllSimple()
      setTestSamples(allSamples)
      
      // Find created samples
      const urineS = allSamples.find(s => s.name === 'Nước tiểu')
      const bloodS = allSamples.find(s => s.name === 'Máu')
      const mxn1S = allSamples.find(s => s.name === 'MXN1')
      const mxn2S = allSamples.find(s => s.name === 'MXN2')
      
      if (!urineS || !bloodS || !mxn1S || !mxn2S) {
        throw new Error('Không thể tạo đủ mẫu xét nghiệm')
      }
      
      // Create default test types
      const defaultTestTypes = [
        {
          code: 'XN1',
          name: 'Xét nghiệm 1',
          description: 'Loại xét nghiệm 1 - sử dụng MXN1 hoặc MXN2',
          price: 200000,
          status: 1,
          testSampleIds: [mxn1S.id!, mxn2S.id!]
        },
        {
          code: 'XN2',
          name: 'Xét nghiệm 2', 
          description: 'Loại xét nghiệm 2 - sử dụng Nước tiểu, Máu hoặc MXN1',
          price: 150000,
          status: 1,
          testSampleIds: [urineS.id!, bloodS.id!, mxn1S.id!]
        }
      ]
      
      for (const testType of defaultTestTypes) {
        try {
          const existing = testTypes.find(tt => tt.code === testType.code)
          if (!existing) {
            await testTypesApi.create(testType)
          }
        } catch (err) {
          console.log(`Test type ${testType.code} might already exist`)
        }
      }
      
      // Refresh test types
      await fetchTestTypes(pagination.pageIndex)
      
      toast.dismiss()
      toast.success('Đã thiết lập dữ liệu mặc định thành công!')
    } catch (error) {
      console.error('Error setting up default data:', error)
      toast.dismiss()
      toast.error('Có lỗi khi thiết lập dữ liệu mặc định')
    } finally {
      setIsSettingUp(false)
    }
  }

  const filteredTestTypes = (Array.isArray(testTypes) ? testTypes : []).filter(testType => {
    // Null check để tránh lỗi
    if (!testType || !testType.name || !testType.code) {
      return false
    }
    
    const matchesSearch = testType.name.toLowerCase().includes(searchServiceQuery.toLowerCase()) ||
                         testType.code.toLowerCase().includes(searchServiceQuery.toLowerCase())
    return matchesSearch
  })




  // Handle form input changes
  const handleFormChange = (field: keyof NewTestTypeForm, value: any) => {
    setNewTestTypeForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle test sample selection
  const handleTestSampleSelection = (sampleId: number, isSelected: boolean) => {
    setNewTestTypeForm(prev => ({
      ...prev,
      testSampleIds: isSelected 
        ? [...prev.testSampleIds, sampleId]
        : prev.testSampleIds.filter(id => id !== sampleId)
    }))
  }

  // Handle edit form input changes
  const handleEditFormChange = (field: keyof NewTestTypeForm, value: any) => {
    setEditTestTypeForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle edit test sample selection
  const handleEditTestSampleSelection = (sampleId: number, isSelected: boolean) => {
    console.log(`Edit sample selection - ID: ${sampleId}, Selected: ${isSelected}`)
    setEditTestTypeForm(prev => {
      const newIds = isSelected 
        ? [...prev.testSampleIds, sampleId]
        : prev.testSampleIds.filter(id => id !== sampleId)
      console.log('Previous IDs:', prev.testSampleIds, 'New IDs:', newIds)
      return {
        ...prev,
        testSampleIds: newIds
      }
    })
  }

  // Submit new test type
  const handleCreateTestType = async () => {
    // Validation
    if (!newTestTypeForm.name.trim()) {
      toast.error('Vui lòng nhập tên dịch vụ xét nghiệm')
      return
    }
    if (!newTestTypeForm.code.trim()) {
      toast.error('Vui lòng nhập mã dịch vụ')
      return
    }
    if (newTestTypeForm.price <= 0) {
      toast.error('Vui lòng nhập giá hợp lệ')
      return
    }
    if (newTestTypeForm.testSampleIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một mẫu xét nghiệm')
      return
    }

    setIsCreating(true)
    try {
      const createData: CreateTestTypeRequest = {
        name: newTestTypeForm.name.trim(),
        code: newTestTypeForm.code.trim(),
        description: newTestTypeForm.description.trim(),
        price: newTestTypeForm.price,
        status: newTestTypeForm.status,
        testSampleIds: newTestTypeForm.testSampleIds,
        classPathTemplate: newTestTypeForm.classPathTemplate?.trim() || undefined
      }

      const newTestType = await testTypesApi.create(createData)
      console.log('New test type:', newTestType)
      
      // Refresh danh sách test types để hiển thị ngay
      await fetchTestTypes(pagination.pageIndex)
      
      // Reset form and close modal
      setNewTestTypeForm({
        name: '',
        code: '',
        description: '',
        price: 0,
        status: 1,
        testSampleIds: [],
        classPathTemplate: ''
      })
      setShowAddModal(false)
      
      toast.success('Đã thêm dịch vụ xét nghiệm thành công!')
    } catch (error) {
      console.error('Error creating test type:', error)
      toast.error('Có lỗi xảy ra khi thêm dịch vụ!')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle edit test type
  const handleEditTestType = (testType: TestType) => {
    console.log('Editing test type:', testType)
    setEditingTestType(testType)
    
    // Extract sample IDs from testSamples array (new API format) or fallback to testSampleIds (old format)
    const sampleIds = testType.testSamples 
      ? testType.testSamples.map(s => s.id).filter(id => id !== undefined) as number[]
      : (testType.testSampleIds || [])
    
    console.log('Sample IDs for editing:', sampleIds)
    console.log('Test samples from API:', testType.testSamples)
    
    setEditTestTypeForm({
      name: testType.name,
      code: testType.code,
      description: testType.description || '',
      price: testType.price,
      status: testType.status,
      testSampleIds: sampleIds,
      classPathTemplate: testType.classPathTemplate || ''
    })
    setShowEditModal(true)
  }

  // Submit edit test type
  const handleUpdateTestType = async () => {
    if (!editingTestType) return

    // Validation
    if (!editTestTypeForm.name.trim()) {
      toast.error('Vui lòng nhập tên dịch vụ xét nghiệm')
      return
    }
    if (!editTestTypeForm.code.trim()) {
      toast.error('Vui lòng nhập mã dịch vụ')
      return
    }
    if (editTestTypeForm.price <= 0) {
      toast.error('Vui lòng nhập giá hợp lệ')
      return
    }
    if (editTestTypeForm.testSampleIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một mẫu xét nghiệm')
      return
    }

    setIsEditing(true)
    try {
      const updateData: Partial<CreateTestTypeRequest> = {
        name: editTestTypeForm.name.trim(),
        code: editTestTypeForm.code.trim(),
        description: editTestTypeForm.description.trim(),
        price: editTestTypeForm.price,
        status: editTestTypeForm.status,
        testSampleIds: editTestTypeForm.testSampleIds,
        classPathTemplate: editTestTypeForm.classPathTemplate?.trim() || undefined
      }

      await testTypesApi.update(editingTestType.id!, updateData)
      
      // Refresh danh sách test types để hiển thị ngay
      await fetchTestTypes(pagination.pageIndex)
      
      // Reset form and close modal
      setEditTestTypeForm({
        name: '',
        code: '',
        description: '',
        price: 0,
        status: 1,
        testSampleIds: [],
        classPathTemplate: ''
      })
      setEditingTestType(null)
      setShowEditModal(false)
      
      toast.success('Đã cập nhật dịch vụ xét nghiệm thành công!')
    } catch (error) {
      console.error('Error updating test type:', error)
      toast.error('Có lỗi xảy ra khi cập nhật dịch vụ!')
    } finally {
      setIsEditing(false)
    }
  }

  // Handle delete test type
  const handleDeleteTestType = (testType: TestType) => {
    setDeletingTestType(testType)
    setShowDeleteModal(true)
  }

  // Confirm delete test type
  const confirmDeleteTestType = async () => {
    if (!deletingTestType) return

    setIsDeleting(true)
    try {
      await testTypesApi.delete(deletingTestType.id!)
      
      // Refresh danh sách test types để hiển thị ngay
      await fetchTestTypes(pagination.pageIndex)
      
      // Close modal
      setDeletingTestType(null)
      setShowDeleteModal(false)
      
      toast.success('Đã xóa dịch vụ xét nghiệm thành công!')
    } catch (error) {
      console.error('Error deleting test type:', error)
      toast.error('Có lỗi xảy ra khi xóa dịch vụ!')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <TestTube size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý dịch vụ xét nghiệm</h1>
              <p className="text-green-100">Quản lý các loại xét nghiệm trong hệ thống</p>
            </div>
          </div>
          <Button
            onClick={setupDefaultData}
            disabled={isSettingUp}
            variant="outline"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {isSettingUp ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Đang thiết lập...
              </>
            ) : (
              <>
                <Settings size={16} className="mr-2" />
                Thiết lập dữ liệu mặc định
              </>
            )}
          </Button>
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

      <div className="grid grid-cols-1 gap-6">
        {/* Service Selection */}
        <div className="flex flex-col">
          <Card className="shadow-lg border-0 flex flex-col h-auto min-h-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <TestTube size={20} className="text-purple-600" />
                    <span>Danh sách loại xét nghiệm</span>
                    {loadingTestTypes && <Loader2 size={16} className="animate-spin" />}
                  </CardTitle>
                  <CardDescription>
                    Chọn các loại xét nghiệm cần thực hiện
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus size={16} className="mr-2" />
                  Thêm dịch vụ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-visible">
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
              {loadingTestTypes || loadingTestSamples ? (
                <div className="text-center py-8">
                  <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
                  <p className="mt-4 text-gray-500">Đang tải danh sách xét nghiệm...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full auto-rows-max">
                  {filteredTestTypes.map(testType => {
                    // Hiển thị mẫu mặc định cho test type này từ testSamples API
                    const defaultSamples = testType.testSamples || []
                    
                    return (
                      <div
                        key={testType.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow relative"
                      >
                        {/* Action Buttons - Top Right */}
                        <div className="absolute top-3 right-3 flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTestType(testType)}
                            className="h-7 w-7 p-0 bg-white hover:bg-gray-50"
                            title="Sửa"
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTestType(testType)}
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 bg-white"
                            title="Xóa"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>

                        <div className="pr-16">
                          <div className="mb-2">
                            <h3 className="font-semibold text-gray-900">{testType.name}</h3>
                            <p className="text-sm text-gray-600">Mã: {testType.code}</p>
                          </div>
                          
                          {testType.description && (
                            <p className="text-sm text-gray-600 mb-2">{testType.description}</p>
                          )}
                          
                          {/* Default Samples */}
                          <div className="text-xs text-gray-500 mb-3">
                            Mẫu mặc định: {defaultSamples.map((s: any) => s.sampleName).join(', ') || 'Chưa cấu hình'}
                          </div>

                          {/* Class Path Template */}
                          {testType.classPathTemplate && (
                            <div className="text-xs text-blue-600 mb-3">
                              Template: {testType.classPathTemplate}
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(testType.price || 100000)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {testType.status === 1 ? 'Hoạt động' : 'Không hoạt động'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {!loadingTestTypes && filteredTestTypes.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      Không tìm thấy loại xét nghiệm phù hợp
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {!loadingTestTypes && pagination.totalElements > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-700">
                      Hiển thị {pagination.pageIndex * pagination.pageSize + 1} - {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.totalElements)} của {pagination.totalElements} kết quả
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Hiển thị:</span>
                      <select
                        value={pagination.pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-700">/ trang</span>
                    </div>
                  </div>
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTestTypes(pagination.pageIndex - 1)}
                        disabled={pagination.pageIndex === 0}
                      >
                        Trước
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum = i
                          if (pagination.totalPages > 5) {
                            if (pagination.pageIndex < 3) {
                              pageNum = i
                            } else if (pagination.pageIndex > pagination.totalPages - 3) {
                              pageNum = pagination.totalPages - 5 + i
                            } else {
                              pageNum = pagination.pageIndex - 2 + i
                            }
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.pageIndex === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => fetchTestTypes(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum + 1}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTestTypes(pagination.pageIndex + 1)}
                        disabled={pagination.pageIndex >= pagination.totalPages - 1}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Test Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Thêm dịch vụ xét nghiệm mới</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="p-1"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <Label htmlFor="name">Tên dịch vụ *</Label>
                  <Input
                    id="name"
                    placeholder="VD: Dịch vụ kiểm tra"
                    value={newTestTypeForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </div>

                {/* Code */}
                <div>
                  <Label htmlFor="code">Mã dịch vụ *</Label>
                  <Input
                    id="code"
                    placeholder="VD: ABC1"
                    value={newTestTypeForm.code}
                    onChange={(e) => handleFormChange('code', e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Input
                    id="description"
                    placeholder="VD: Dịch vụ kiểm tra lần 1"
                    value={newTestTypeForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="price">Giá dịch vụ (VNĐ) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="3000000"
                    value={newTestTypeForm.price || ''}
                    onChange={(e) => handleFormChange('price', parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Trạng thái</Label>
                  <select
                    id="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTestTypeForm.status}
                    onChange={(e) => handleFormChange('status', parseInt(e.target.value))}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
                  </select>
                </div>

                {/* Class Path Template */}
                <div>
                  <Label htmlFor="classPathTemplate">Mẫu Class Path (tùy chọn)</Label>
                  <Input
                    id="classPathTemplate"
                    placeholder="VD: com.example.lab.TestType1"
                    value={newTestTypeForm.classPathTemplate || ''}
                    onChange={(e) => handleFormChange('classPathTemplate', e.target.value)}
                  />
                </div>

                {/* Test Samples */}
                <div>
                  <Label>Mẫu xét nghiệm *</Label>
                  {loadingTestSamples ? (
                    <div className="flex items-center space-x-2 py-4">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang tải mẫu xét nghiệm...</span>
                    </div>
                  ) : (
                    <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                      {(!Array.isArray(testSamples) || testSamples.length === 0) ? (
                        <p className="text-gray-500 text-sm">Không có mẫu xét nghiệm nào</p>
                      ) : (
                        <div className="space-y-2">
                          {testSamples.map(sample => (
                            <label key={sample.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={newTestTypeForm.testSampleIds.includes(sample.id!)}
                                onChange={(e) => handleTestSampleSelection(sample.id!, e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{sample.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={isCreating}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateTestType}
                  disabled={isCreating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo dịch vụ'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Type Modal */}
      {showEditModal && editingTestType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Sửa dịch vụ xét nghiệm</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  className="p-1"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <Label htmlFor="edit-name">Tên dịch vụ *</Label>
                  <Input
                    id="edit-name"
                    placeholder="VD: Dịch vụ kiểm tra"
                    value={editTestTypeForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                  />
                </div>

                {/* Code */}
                <div>
                  <Label htmlFor="edit-code">Mã dịch vụ *</Label>
                  <Input
                    id="edit-code"
                    placeholder="VD: ABC1"
                    value={editTestTypeForm.code}
                    onChange={(e) => handleEditFormChange('code', e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="edit-description">Mô tả</Label>
                  <Input
                    id="edit-description"
                    placeholder="VD: Dịch vụ kiểm tra lần 1"
                    value={editTestTypeForm.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                  />
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="edit-price">Giá dịch vụ (VNĐ) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    placeholder="3000000"
                    value={editTestTypeForm.price || ''}
                    onChange={(e) => handleEditFormChange('price', parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="edit-status">Trạng thái</Label>
                  <select
                    id="edit-status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editTestTypeForm.status}
                    onChange={(e) => handleEditFormChange('status', parseInt(e.target.value))}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
                  </select>
                </div>

                {/* Class Path Template */}
                <div>
                  <Label htmlFor="edit-classPathTemplate">Mẫu Class Path (tùy chọn)</Label>
                  <Input
                    id="edit-classPathTemplate"
                    placeholder="VD: com.example.lab.TestType1"
                    value={editTestTypeForm.classPathTemplate || ''}
                    onChange={(e) => handleEditFormChange('classPathTemplate', e.target.value)}
                  />
                </div>

                {/* Test Samples */}
                <div>
                  <Label>Mẫu xét nghiệm *</Label>
                  {loadingTestSamples ? (
                    <div className="flex items-center space-x-2 py-4">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang tải mẫu xét nghiệm...</span>
                    </div>
                  ) : (
                    <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                      {(!Array.isArray(testSamples) || testSamples.length === 0) ? (
                        <p className="text-gray-500 text-sm">Không có mẫu xét nghiệm nào</p>
                      ) : (
                        <div className="space-y-2">
                          {testSamples.map(sample => {
                            const isChecked = editTestTypeForm.testSampleIds.includes(sample.id!)
                            console.log(`Sample ${sample.name} (ID: ${sample.id}) - Checked: ${isChecked}`, 'Form IDs:', editTestTypeForm.testSampleIds)
                            return (
                              <label key={sample.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleEditTestSampleSelection(sample.id!, e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm">{sample.name} (ID: {sample.id})</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isEditing}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleUpdateTestType}
                  disabled={isEditing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập nhật dịch vụ'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTestType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Xóa dịch vụ xét nghiệm
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Bạn có chắc chắn muốn xóa dịch vụ <strong>"{deletingTestType.name}"</strong>? 
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Hủy
                </Button>
                <Button
                  onClick={confirmDeleteTestType}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa dịch vụ'
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

export default ServiceSelection 