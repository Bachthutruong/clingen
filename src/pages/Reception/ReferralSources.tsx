import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
  TestTube,
  DollarSign,
  Minus,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw
} from 'lucide-react'
import { referralSourcesApi, testTypesApi } from '@/services'
import type { 
  ReferralSourceAPI, 
  PaginatedResponse, 
  TestType,
  CreateReferralSourceRequest,
  
} from '@/types/api'

interface TestPriceConfig {
  quantityRangeId?: number
  minQuantity: number
  maxQuantity: number
  price: number
}

interface ReferralSourceTestType {
  testTypeId: number
  testTypeName?: string
  testPriceConfigs: TestPriceConfig[]
}

interface ReferralSourceForm {
  name: string
  code: string
  status: number
  priceConfigs: ReferralSourceTestType[]
}

const ReferralSources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<ReferralSourceAPI | null>(null)
  const [formData, setFormData] = useState<ReferralSourceForm>({
    name: '',
    code: '',
    status: 1,
    priceConfigs: []
  })

  // API state
  const [referralSourcesData, setReferralSourcesData] = useState<PaginatedResponse<ReferralSourceAPI> | null>(null)
  const [testTypes, setTestTypes] = useState<TestType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedSource, setSelectedSource] = useState<any>(null)

  // Fetch test types for selection
  const fetchTestTypes = async () => {
    try {
      const testTypesData = await testTypesApi.getAllSimple()
      console.log('Raw API response:', testTypesData)
      
      // Defensive programming - ensure we have an array
      let dataArray: any[] = []
      
      if (Array.isArray(testTypesData)) {
        dataArray = testTypesData
      } else if (testTypesData && typeof testTypesData === 'object') {
        // Try to extract data from wrapped response
        const wrapped = testTypesData as any
        if (wrapped.data && Array.isArray(wrapped.data)) {
          dataArray = wrapped.data
        } else {
          console.error('Invalid test types data structure:', testTypesData)
          toast.error('Dữ liệu xét nghiệm không hợp lệ')
          setTestTypes([])
          return
        }
      } else {
        console.error('Invalid test types data structure:', testTypesData)
        toast.error('Dữ liệu xét nghiệm không hợp lệ')
        setTestTypes([])
        return
      }
      
      // Filter only active test types (status = 1)
      const activeTestTypes = dataArray.filter((t: any) => t.status === 1)
      console.log('Filtered active test types:', activeTestTypes)
      setTestTypes(activeTestTypes)
    } catch (err) {
      console.error('Error fetching test types:', err)
      toast.error('Không thể tải danh sách xét nghiệm')
      setTestTypes([])
    }
  }

  // Fetch referral sources from API
  const fetchReferralSources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await referralSourcesApi.getAll({
        pageIndex: currentPage,
        pageSize: pageSize,
        keyword: searchQuery || undefined
      })
      
      setReferralSourcesData(response)
    } catch (err) {
      console.error('Error fetching referral sources:', err)
      setError('Không thể tải danh sách nguồn gửi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when page changes or initial load
  useEffect(() => {
    fetchReferralSources()
  }, [currentPage, pageSize])

  useEffect(() => {
    fetchTestTypes()
  }, [])

  // Load test types when form opens if not already loaded
  useEffect(() => {
    if (isFormOpen && testTypes.length === 0) {
      toast.loading('Đang tải danh sách xét nghiệm...', { id: 'loading-test-types' })
      fetchTestTypes().finally(() => {
        toast.dismiss('loading-test-types')
      })
    }
  }, [isFormOpen])

  // Extract and transform referral sources from flat API response
  const referralSources = (() => {
    if (!referralSourcesData) {
      return []
    }
    
    const responseData = referralSourcesData as any
    let flatData: any[] = []
    
    // Get flat data array
    if (responseData.content && Array.isArray(responseData.content.content)) {
      flatData = responseData.content.content
    } else if (Array.isArray(responseData.content)) {
      flatData = responseData.content
    } else if (Array.isArray(responseData.data)) {
      flatData = responseData.data
    } else if (Array.isArray(responseData)) {
      flatData = responseData
    } else if (responseData.status && responseData.data && Array.isArray(responseData.data)) {
      flatData = responseData.data
    } else {
      console.warn('Unexpected referral sources data structure:', referralSourcesData)
      return []
    }

    // Transform flat data to nested structure
    const groupedMap = new Map()
    
    flatData.forEach((item: any) => {
      const key = `${item.name}_${item.code}_${item.status}`
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: item.id || Date.now() + Math.random(), // Generate ID if not present
          name: item.name,
          code: item.code,
          status: item.status,
          priceConfigs: new Map() // Temporary map for grouping test types
        })
      }
      
      const source = groupedMap.get(key)
      
      // Group by test type
      if (item.testTypeId) {
        if (!source.priceConfigs.has(item.testTypeId)) {
          source.priceConfigs.set(item.testTypeId, {
            testTypeId: item.testTypeId,
            testTypeName: item.testTypeName,
            testPriceConfigs: []
          })
        }
        
        // Add price config
        source.priceConfigs.get(item.testTypeId).testPriceConfigs.push({
          quantityRangeId: item.quantityRangeId,
          minQuantity: item.minQuantity,
          maxQuantity: item.maxQuantity,
          price: item.price
        })
      }
    })
    
         // Convert Maps to Arrays
     const transformedSources = Array.from(groupedMap.values()).map(source => ({
       ...source,
       priceConfigs: Array.from(source.priceConfigs.values())
     }))
     
           return transformedSources
   })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng nhập tên và mã nguồn gửi')
      return
    }

    // Validate price configs
    for (const config of formData.priceConfigs) {
      if (config.testPriceConfigs.length === 0) {
        toast.error('Vui lòng thêm ít nhất một cấu hình giá cho mỗi loại xét nghiệm')
        return
      }
      
      for (const priceConfig of config.testPriceConfigs) {
        if (priceConfig.minQuantity <= 0 || priceConfig.maxQuantity <= 0) {
          toast.error('Số lượng phải lớn hơn 0')
          return
        }
        if (priceConfig.minQuantity > priceConfig.maxQuantity) {
          toast.error('Số lượng tối thiểu không thể lớn hơn số lượng tối đa')
          return
        }
        if (priceConfig.price <= 0) {
          toast.error('Giá phải lớn hơn 0')
          return
        }
      }
    }

    try {
      setSubmitting(true)
      
      const submitData: CreateReferralSourceRequest = {
        name: formData.name,
        code: formData.code,
        priceConfigs: formData.priceConfigs.map(config => ({
          testTypeId: config.testTypeId,
          testPriceConfigs: config.testPriceConfigs.map(priceConfig => ({
            quantityRangeId: priceConfig.quantityRangeId,
            minQuantity: priceConfig.minQuantity,
            maxQuantity: priceConfig.maxQuantity,
            price: priceConfig.price
          }))
        })),
        status: formData.status
      }
      
      if (editingSource) {
        // Update existing source
        const updatedSource = await referralSourcesApi.update(editingSource.id!, submitData)
        console.log('Updated referral source:', updatedSource)
      } else {
        // Add new source
        const newSource = await referralSourcesApi.create(submitData)
        console.log('Created referral source:', newSource)
      }

      // Refresh the list
      await fetchReferralSources()
      
      // Reset form
      resetForm()
      toast.success(editingSource ? 'Cập nhật nguồn gửi thành công!' : 'Thêm nguồn gửi thành công!')
    } catch (error) {
      console.error('Error saving referral source:', error)
      toast.error('Có lỗi xảy ra khi lưu nguồn gửi. Vui lòng thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (source: ReferralSourceAPI) => {
    setEditingId(source.id!)
    setEditingSource(source)
    
    try {
      // Ensure test types are loaded before setting form data
      if (testTypes.length === 0) {
        await fetchTestTypes()
      }
      
      setFormData({
        name: source.name,
        code: source.code,
        status: source.status,
        priceConfigs: (source.priceConfigs || []).map(config => {
          const configAny = config as any
          const testTypeName = configAny.testTypeName || testTypes.find(t => t.id === config.testTypeId)?.name || 'Không tìm thấy'
          
          return {
            testTypeId: config.testTypeId,
            testTypeName: testTypeName,
            testPriceConfigs: (config.testPriceConfigs || []).map(priceConfig => ({
              quantityRangeId: priceConfig.quantityRangeId,
              minQuantity: priceConfig.minQuantity,
              maxQuantity: priceConfig.maxQuantity,
              price: priceConfig.price
            }))
          }
        })
              })
        
        setIsFormOpen(true)
    } finally {
      setEditingId(null)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nguồn gửi "${name}"?\n\nHành động này không thể hoàn tác!`)) {
      return
    }

    setDeletingId(id)
    const toastId = toast.loading(`Đang xóa nguồn gửi "${name}"...`)
    
    try {
      await referralSourcesApi.delete(id)
      await fetchReferralSources()
      toast.success('Xóa nguồn gửi thành công!', { id: toastId })
    } catch (error) {
      console.error('Error deleting referral source:', error)
      toast.error('Có lỗi xảy ra khi xóa nguồn gửi. Vui lòng thử lại!', { id: toastId })
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      status: 1,
      priceConfigs: []
    })
    setIsFormOpen(false)
    setEditingSource(null)
    setEditingId(null)
    setDeletingId(null)
  }

  // Test type management functions
  const addTestType = () => {
    // Defensive check: ensure testTypes is an array
    if (!Array.isArray(testTypes)) {
      console.error('testTypes is not an array:', testTypes)
      toast.error('Dữ liệu xét nghiệm không hợp lệ')
      setTestTypes([]) // Reset to empty array
      return
    }
    
    // Kiểm tra nếu chưa có test types, thử fetch lại
    if (testTypes.length === 0) {
      toast.loading('Đang tải danh sách xét nghiệm...', { id: 'reload-test-types' })
      fetchTestTypes().then(() => {
        toast.dismiss('reload-test-types')
        if (!Array.isArray(testTypes) || testTypes.length === 0) {
          toast.error('Không thể tải danh sách xét nghiệm. Vui lòng kiểm tra kết nối.')
        }
      }).catch(() => {
        toast.dismiss('reload-test-types')
        toast.error('Lỗi khi tải danh sách xét nghiệm')
      })
      return
    }
    
    // Kiểm tra nếu đã thêm hết tất cả test types
    if (formData.priceConfigs.length >= testTypes.length) {
      toast.error('Đã thêm tất cả loại xét nghiệm có sẵn')
      return
    }
    
    const availableTestTypes = testTypes.filter(
      t => !formData.priceConfigs.some(config => config.testTypeId === t.id)
    )
    
    if (availableTestTypes.length === 0) {
      toast.error('Không còn loại xét nghiệm nào để thêm')
      return
    }

    const firstAvailable = availableTestTypes[0]
    const newTestType: ReferralSourceTestType = {
      testTypeId: firstAvailable.id!,
      testTypeName: firstAvailable.name,
      testPriceConfigs: [{
        minQuantity: 1,
        maxQuantity: 10,
        price: 0
      }]
    }

    setFormData({
      ...formData,
      priceConfigs: [...formData.priceConfigs, newTestType]
    })
    
    toast.success(`Đã thêm xét nghiệm: ${firstAvailable.name}`)
  }

  const removeTestType = (index: number) => {
    const newPriceConfigs = [...formData.priceConfigs]
    newPriceConfigs.splice(index, 1)
    setFormData({
      ...formData,
      priceConfigs: newPriceConfigs
    })
  }

  const updateTestType = (index: number, testTypeId: number) => {
    const testType = testTypes.find(t => t.id === testTypeId)
    if (!testType) return

    const newPriceConfigs = [...formData.priceConfigs]
    newPriceConfigs[index] = {
      ...newPriceConfigs[index],
      testTypeId: testTypeId,
      testTypeName: testType.name
    }
    setFormData({
      ...formData,
      priceConfigs: newPriceConfigs
    })
  }

  // Price config management functions
  const addPriceConfig = (testTypeIndex: number) => {
    const newPriceConfigs = [...formData.priceConfigs]
    newPriceConfigs[testTypeIndex].testPriceConfigs.push({
      minQuantity: 1,
      maxQuantity: 10,
      price: 0
    })
    setFormData({
      ...formData,
      priceConfigs: newPriceConfigs
    })
  }

  const removePriceConfig = (testTypeIndex: number, priceConfigIndex: number) => {
    const newPriceConfigs = [...formData.priceConfigs]
    newPriceConfigs[testTypeIndex].testPriceConfigs.splice(priceConfigIndex, 1)
    setFormData({
      ...formData,
      priceConfigs: newPriceConfigs
    })
  }

  const updatePriceConfig = (
    testTypeIndex: number, 
    priceConfigIndex: number, 
    field: keyof TestPriceConfig, 
    value: number
  ) => {
    const newPriceConfigs = [...formData.priceConfigs]
    newPriceConfigs[testTypeIndex].testPriceConfigs[priceConfigIndex] = {
      ...newPriceConfigs[testTypeIndex].testPriceConfigs[priceConfigIndex],
      [field]: value
    }
    setFormData({
      ...formData,
      priceConfigs: newPriceConfigs
    })
  }

  const getStatusLabel = (status: number) => {
    return status === 1 ? 'Hoạt động' : 'Không hoạt động'
  }

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchReferralSources()
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0) // Reset to first page
  }

  const handleViewDetail = (source: any) => {
    setSelectedSource(source)
    setShowDetailDialog(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate pagination data
  const paginationData = (referralSourcesData as any)?.content || referralSourcesData
  const totalPages = paginationData?.totalPages || 0
  const totalElements = paginationData?.totalElements || 0
  const shouldShowPagination = referralSourcesData && (totalPages > 1 || totalElements > 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý nguồn gửi</h1>
              <p className="text-purple-100">Danh sách các nguồn gửi bệnh nhân với cấu hình giá</p>
            </div>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-white text-purple-700 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm nguồn gửi
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nguồn gửi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(0)
                  fetchReferralSources()
                }}
                disabled={loading}
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle size={20} />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchReferralSources}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Sources Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách nguồn gửi ({totalElements})</span>
            <Button size="sm" onClick={fetchReferralSources}>
              <RefreshCw size={14} className="mr-1" />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && referralSources.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Đang tải danh sách nguồn gửi...</p>
            </div>
          ) : referralSources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'Không tìm thấy nguồn gửi phù hợp' : 'Chưa có nguồn gửi nào'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Nguồn gửi</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Mã</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Số loại XN</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Cấu hình giá</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referralSources.map((source: any) => (
                    <tr key={source.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{source.name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-700">{source.code}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(source.status)}`}>
                          {getStatusLabel(source.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <TestTube size={14} className="text-purple-600 mr-1" />
                          <span className="font-medium">{source.priceConfigs?.length || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {source.priceConfigs && source.priceConfigs.length > 0 ? (
                          <div className="text-xs">
                            {source.priceConfigs.slice(0, 2).map((config: any, index: number) => {
                              const testType = testTypes.find(t => t.id === config.testTypeId)
                              const minPrice = Math.min(...(config.testPriceConfigs || []).map((pc: any) => pc.price))
                              const maxPrice = Math.max(...(config.testPriceConfigs || []).map((pc: any) => pc.price))
                              return (
                                <div key={index} className="mb-1">
                                  <span className="font-medium">{testType?.name || 'N/A'}</span>
                                  <br />
                                  <span className="text-gray-600">
                                    {minPrice === maxPrice 
                                      ? formatCurrency(minPrice)
                                      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
                                    }
                                  </span>
                                </div>
                              )
                            })}
                            {source.priceConfigs.length > 2 && (
                              <div className="text-gray-500">+{source.priceConfigs.length - 2} khác</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Chưa cấu hình</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetail(source)}
                            className="text-xs"
                          >
                            <Eye size={12} className="mr-1" />
                            Chi tiết
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(source)}
                            disabled={editingId === source.id || deletingId === source.id}
                            className="text-xs"
                          >
                            {editingId === source.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Edit3 size={12} />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 text-xs"
                            onClick={() => handleDelete(source.id!, source.name)}
                            disabled={editingId === source.id || deletingId === source.id}
                          >
                            {deletingId === source.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </Button>
                        </div>
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
      {shouldShowPagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} của {totalElements} nguồn gửi
              {searchQuery && ` (tìm kiếm: "${searchQuery}")`}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                disabled={loading}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700">/ trang</span>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft size={16} />
                Trước
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i
                  if (totalPages > 5) {
                    if (currentPage < 3) {
                      pageNum = i
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 5 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
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
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
              >
                Sau
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingSource ? 'Sửa nguồn gửi' : 'Thêm nguồn gửi mới'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên nguồn gửi *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Bệnh viện ABC"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Mã nguồn gửi *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="VD: BV_ABC"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={submitting}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
                  </select>
                </div>

                {/* Price Configurations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-lg font-semibold">Cấu hình giá xét nghiệm</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Có {testTypes.length} loại xét nghiệm, đã chọn {formData.priceConfigs.length}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTestType}
                      disabled={submitting}
                    >
                      {testTypes.length === 0 ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Tải xét nghiệm
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Thêm xét nghiệm
                        </>
                      )}
                    </Button>
                  </div>

                                    {formData.priceConfigs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <TestTube size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Chưa có xét nghiệm nào được cấu hình</p>
                      <p className="text-sm">Nhấn "Thêm xét nghiệm" để bắt đầu</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.priceConfigs.map((testConfig, testIndex) => (
                        <Card key={testIndex} className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <TestTube size={20} className="text-blue-600" />
                                <div className="flex-1">
                                  <select
                                    value={testConfig.testTypeId}
                                    onChange={(e) => updateTestType(testIndex, parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    disabled={submitting}
                                  >
                                    {testTypes
                                      .filter(t => 
                                        t.id === testConfig.testTypeId || 
                                        !formData.priceConfigs.some(config => config.testTypeId === t.id)
                                      )
                                      .map(testType => (
                                        <option key={testType.id} value={testType.id}>
                                          {testType.name}
                                        </option>
                                      ))
                                    }
                                  </select>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTestType(testIndex)}
                                disabled={submitting}
                                className="text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Cấu hình giá theo số lượng</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addPriceConfig(testIndex)}
                                disabled={submitting}
                              >
                                <Plus size={14} className="mr-1" />
                                Thêm khoảng giá
                              </Button>
                            </div>
                            
                            {testConfig.testPriceConfigs.length === 0 ? (
                              <div className="text-center py-4 text-gray-500 border border-dashed border-gray-200 rounded">
                                <DollarSign size={24} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Chưa có cấu hình giá</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {testConfig.testPriceConfigs.map((priceConfig, priceIndex) => (
                                  <div key={priceIndex} className="grid grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Số lượng tối thiểu</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={priceConfig.minQuantity}
                                        onChange={(e) => updatePriceConfig(
                                          testIndex, 
                                          priceIndex, 
                                          'minQuantity', 
                                          parseInt(e.target.value) || 0
                                        )}
                                        disabled={submitting}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Số lượng tối đa</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={priceConfig.maxQuantity}
                                        onChange={(e) => updatePriceConfig(
                                          testIndex, 
                                          priceIndex, 
                                          'maxQuantity', 
                                          parseInt(e.target.value) || 0
                                        )}
                                        disabled={submitting}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Giá (VNĐ)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={priceConfig.price}
                                        onChange={(e) => updatePriceConfig(
                                          testIndex, 
                                          priceIndex, 
                                          'price', 
                                          parseInt(e.target.value) || 0
                                        )}
                                        disabled={submitting}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removePriceConfig(testIndex, priceIndex)}
                                        disabled={submitting}
                                        className="text-red-500 hover:bg-red-50 w-full"
                                      >
                                        <Minus size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        {editingSource ? 'Đang cập nhật...' : 'Đang thêm...'}
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        {editingSource ? 'Cập nhật' : 'Thêm mới'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Chi tiết nguồn gửi</h2>
                <Button size="sm" variant="outline" onClick={() => setShowDetailDialog(false)}>
                  <X size={14} />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Thông tin cơ bản</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tên:</span>
                        <span className="font-medium">{selectedSource.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã:</span>
                        <span className="font-medium">{selectedSource.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedSource.status)}`}>
                          {getStatusLabel(selectedSource.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Thống kê</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số loại XN:</span>
                        <span className="font-medium">{selectedSource.priceConfigs?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng cấu hình:</span>
                        <span className="font-medium">
                          {selectedSource.priceConfigs?.reduce((sum: number, config: any) => sum + (config.testPriceConfigs?.length || 0), 0) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Configurations */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <TestTube size={16} className="mr-2" />
                    Cấu hình xét nghiệm
                  </h3>
                  {selectedSource.priceConfigs && selectedSource.priceConfigs.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSource.priceConfigs.map((config: any, index: number) => {
                        const testType = testTypes.find(t => t.id === config.testTypeId)
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-lg mb-3">
                              {testType?.name || `Xét nghiệm #${config.testTypeId}`}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium">Số lượng tối thiểu</th>
                                    <th className="px-3 py-2 text-left font-medium">Số lượng tối đa</th>
                                    <th className="px-3 py-2 text-left font-medium">Giá</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {config.testPriceConfigs?.map((priceConfig: any, priceIndex: number) => (
                                    <tr key={priceIndex} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">{priceConfig.minQuantity}</td>
                                      <td className="px-3 py-2">{priceConfig.maxQuantity}</td>
                                      <td className="px-3 py-2 font-medium text-emerald-600">
                                        {formatCurrency(priceConfig.price)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                      <TestTube size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Chưa có cấu hình xét nghiệm nào</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Đóng
                </Button>
                <Button onClick={() => {
                  setShowDetailDialog(false)
                  handleEdit(selectedSource)
                }}>
                  <Edit3 size={14} className="mr-1" />
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReferralSources 