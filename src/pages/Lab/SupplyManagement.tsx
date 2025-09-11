import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  Search, 
  Plus,
  // Minus,
  AlertTriangle,
  CheckCircle,
  Edit,
  X,
  Save,
  FileText,
  Eye,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { materialsApi, inventoryLogsApi, packagingApi } from '@/services/api'
import type { 
  Material, 
  InventoryLogsDTO,
  Packaging,
  PaginatedResponse
} from '@/types/api'
import { getMaterialTypeLabel, getInventoryLogTypeLabel } from '@/types/api'
import { formatDateTime, formatDateSimple } from '@/lib/utils'

const SupplyManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Material | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // API state
  const [materialsData, setMaterialsData] = useState<PaginatedResponse<Material> | null>(null)
  const [logsData, setLogsData] = useState<PaginatedResponse<InventoryLogsDTO> | null>(null)
  const [packagingData, setPackagingData] = useState<PaginatedResponse<Packaging> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states for creating new material
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    code: '',
    quantity: 0,
    packagingId: 0,
    importTime: '',
    expiryTime: '',
    type: 1 // 1 - hóa chất
  })

  // Transaction form state
  // const [transactionForm, setTransactionForm] = useState({
  //   logType: 1, // 1: nhập kho, 2: xuất kho
  //   quantity: 0,
  //   materialId: 0,
  //   note: ''
  // })

  // Debug API connection
  const testApiConnection = async () => {
    try {
      // Try simple GET request first
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pk.caduceus.vn/api/pk/v1'}/material`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
      
      console.log('GET /material response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('GET /material response data:', data)
        
        // Check if response has new structure: { status, message, data, totalRecord }
        if (data && data.status && Array.isArray(data.data)) {
          console.log('✅ New API structure detected:', data.data.length, 'materials found')
          toast.success(`✅ API kết nối thành công! Tìm thấy ${data.data.length} vật tư`, { id: 'api-test' })
          return data
        } else {
          console.log('⚠️ Unknown API response structure:', data)
          toast.success(`✅ API kết nối thành công! Status: ${response.status}`, { id: 'api-test' })
          return data
        }
      } else {
        console.error('GET /material failed:', response.status, response.statusText)
        toast.error(`❌ API thất bại! Status: ${response.status} - ${response.statusText}`, { id: 'api-test' })
        return null
      }
    } catch (error) {
      console.error('API connection test failed:', error)
      return null
    }
  }

  // Fetch materials from API
  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching materials with params:', {
        keyword: searchQuery || undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        materialType: typeFilter ? parseInt(typeFilter) : undefined
      })

      // Test API connection first
      const connectionTest = await testApiConnection()
      
      // Fetch materials first, handle errors gracefully
      let materialsResponse
      try {
        if (connectionTest) {
          // If simple GET works, try our API call
          materialsResponse = await materialsApi.getAll({
            keyword: searchQuery || undefined,
            pageIndex: currentPage,
            pageSize: pageSize,
            materialType: typeFilter ? parseInt(typeFilter) : undefined
          })
          console.log('Materials response:', materialsResponse)
          
          // Validate response structure
          if (materialsResponse && Array.isArray(materialsResponse.content)) {
            console.log(`✅ Successfully loaded ${materialsResponse.content.length} materials`)
          } else {
            console.warn('⚠️ Invalid materials response structure:', materialsResponse)
          }
        } else {
          throw new Error('API connection test failed')
        }
      } catch (materialsError) {
        console.error('Materials API error:', materialsError)
        // Set empty materials but continue with other APIs
        materialsResponse = {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: pageSize,
          number: currentPage,
          first: true,
          last: true,
          numberOfElements: 0
        }
      }

      // Fetch other data with error handling
      let logsResponse
      let packagingResponse
      
      try {
        [logsResponse, packagingResponse] = await Promise.all([
          inventoryLogsApi.search({
            pageIndex: 0,
            pageSize: 10
          }).catch(err => {
            console.warn('Inventory logs failed:', err)
            return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true, numberOfElements: 0 }
          }),
          packagingApi.getAll({
            pageIndex: 0,
            pageSize: 100
          }).catch(err => {
            console.warn('Packaging API failed:', err)
            return { content: [], totalElements: 0, totalPages: 0, size: 100, number: 0, first: true, last: true, numberOfElements: 0 }
          })
        ])
      } catch (err) {
        console.error('Error fetching additional data:', err)
        logsResponse = { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true, numberOfElements: 0 }
        packagingResponse = { content: [], totalElements: 0, totalPages: 0, size: 100, number: 0, first: true, last: true, numberOfElements: 0 }
      }
      
      // Ensure all data is properly structured
      const safeMaterialsData = materialsResponse && typeof materialsResponse === 'object' ? materialsResponse : {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: pageSize,
        number: currentPage,
        first: true,
        last: true,
        numberOfElements: 0
      }
      
      setMaterialsData(safeMaterialsData)
      setLogsData(logsResponse)
      setPackagingData(packagingResponse)
      
      // Show success message if we got some data
      if (safeMaterialsData.content && safeMaterialsData.content.length > 0) {
        console.log(`Loaded ${safeMaterialsData.content.length} materials successfully`)
      }
      
    } catch (err) {
      console.error('Error fetching materials:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách vật tư. Vui lòng thử lại.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchMaterials()
  }, [currentPage, searchQuery, typeFilter])

  const materials = Array.isArray(materialsData?.content) ? materialsData.content : []
  const logs = Array.isArray(logsData?.content) ? logsData.content : []
  const packagings = Array.isArray(packagingData?.content) ? packagingData.content : []

  const getStockStatus = (material: Material) => {
    const now = new Date()
    const expiry = material.expiryTime ? new Date(material.expiryTime) : null
    
    if (material.quantity === 0) {
      return { status: 'OUT_OF_STOCK', label: 'Hết hàng', color: 'bg-red-100 text-red-800' }
    }
    
    if (expiry && expiry <= now) {
      return { status: 'EXPIRED', label: 'Hết hạn', color: 'bg-gray-100 text-gray-800' }
    }
    
    if (expiry && (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 30) {
      return { status: 'EXPIRING', label: 'Sắp hết hạn', color: 'bg-yellow-100 text-yellow-800' }
    }
    
    if (material.quantity < 10) { // Assume low stock threshold is 10
      return { status: 'LOW_STOCK', label: 'Sắp hết', color: 'bg-orange-100 text-orange-800' }
    }
    
    return { status: 'NORMAL', label: 'Bình thường', color: 'bg-green-100 text-green-800' }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NORMAL': return <CheckCircle size={14} />
      case 'LOW_STOCK': return <AlertTriangle size={14} />
      case 'OUT_OF_STOCK': return <X size={14} />
      case 'EXPIRED': return <X size={14} />
      case 'EXPIRING': return <AlertTriangle size={14} />
      default: return <AlertTriangle size={14} />
    }
  }

  const handleViewMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setIsEditing(false)
    setShowTransactions(false)
  }

  const handleEditMaterial = () => {
    setIsEditing(true)
  }

  const handleSaveMaterial = async () => {
    if (!selectedMaterial) return
    
    // Validate required fields
    if (!selectedMaterial.name || !selectedMaterial.code) {
      toast.error('Vui lòng nhập tên và mã vật tư')
      return
    }
    
    if (!selectedMaterial.packagingId) {
      toast.error('Vui lòng chọn quy cách đóng gói')
      return
    }
    
    if (!selectedMaterial.type) {
      toast.error('Vui lòng chọn loại vật tư')
      return
    }
    
    try {
      setSubmitting(true)
      
      const updateData = {
        name: selectedMaterial.name,
        code: selectedMaterial.code,
        quantity: selectedMaterial.quantity || 0,
        packagingId: selectedMaterial.packagingId,
        importTime: selectedMaterial.importTime,
        expiryTime: selectedMaterial.expiryTime || undefined,
        type: selectedMaterial.type
      }
      
      console.log('Updating material with data:', updateData)
      
      await materialsApi.update(selectedMaterial.id!, updateData)
      
      toast.success('Lưu thông tin vật tư thành công!')
      setIsEditing(false)
      await fetchMaterials()
    } catch (error) {
      console.error('Error updating material:', error)
      toast.error('Có lỗi xảy ra khi lưu thông tin')
    } finally {
      setSubmitting(false)
    }
  }

  // const handleImportMaterial = async () => {
  //   if (!transactionForm.materialId || transactionForm.quantity <= 0) {
  //     toast.error('Vui lòng chọn vật tư và nhập số lượng hợp lệ')
  //     return
  //   }
    
  //   try {
  //     setSubmitting(true)
  //     await inventoryLogsApi.importMaterials({
  //       materialId: transactionForm.materialId,
  //       quantity: transactionForm.quantity,
  //       note: transactionForm.note
  //     })
      
  //     toast.success('Nhập kho thành công!')
  //     setTransactionForm({
  //       logType: 1, // 1: nhập kho
  //       quantity: 0,
  //       materialId: 0,
  //       note: ''
  //     })
  //     await fetchMaterials()
  //   } catch (error) {
  //     console.error('Error importing material:', error)
  //     toast.error('Có lỗi xảy ra khi nhập kho')
  //   } finally {
  //     setSubmitting(false)
  //   }
  // }

  // const handleExportMaterial = async () => {
  //   if (!transactionForm.materialId || transactionForm.quantity <= 0) {
  //     toast.error('Vui lòng chọn vật tư và nhập số lượng hợp lệ')
  //     return
  //   }
    
  //   try {
  //     setSubmitting(true)
  //     await inventoryLogsApi.exportMaterials({
  //       materialId: transactionForm.materialId,
  //       quantity: transactionForm.quantity,
  //       note: transactionForm.note
  //     })
      
  //     toast.success('Xuất kho thành công!')
  //     setTransactionForm({
  //       logType: 2, // 2: xuất kho
  //       quantity: 0,
  //       materialId: 0,
  //       note: ''
  //     })
  //     await fetchMaterials()
  //   } catch (error) {
  //     console.error('Error exporting material:', error)
  //     toast.error('Có lỗi xảy ra khi xuất kho')
  //   } finally {
  //     setSubmitting(false)
  //   }
  // }

  const handleViewTransactions = (material: Material) => {
    setSelectedMaterial(material)
    setShowTransactions(true)
  }

  const handleAddNew = async () => {
    try {
      setSubmitting(true)
      
      if (!newMaterial.code || !newMaterial.name || !newMaterial.packagingId) {
        toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã, Tên, Đóng gói)')
        return
      }
      
      await materialsApi.create({
        name: newMaterial.name,
        code: newMaterial.code,
        quantity: newMaterial.quantity,
        packagingId: newMaterial.packagingId,
        importTime: newMaterial.importTime || new Date().toISOString(),
        expiryTime: newMaterial.expiryTime,
        type: newMaterial.type
      })
      
      toast.success('Thêm vật tư mới thành công!')
      setNewMaterial({
        name: '',
        code: '',
        quantity: 0,
        packagingId: 0,
        importTime: '',
        expiryTime: '',
        type: 1 // 1 - hóa chất
      })
      setIsAddingNew(false)
      await fetchMaterials()
    } catch (error) {
      console.error('Error adding material:', error)
      toast.error('Có lỗi xảy ra khi thêm vật tư')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMaterial = async (material: Material) => {
    try {
      setSubmitting(true)
      await materialsApi.delete(material.id!)
      toast.success('Xóa vật tư thành công!')
      setShowDeleteConfirm(null)
      await fetchMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Có lỗi xảy ra khi xóa vật tư')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePagination = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1)
    } else if (direction === 'next' && materialsData && currentPage < materialsData.totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchMaterials()
  }

  const getPackagingName = (packagingId: number | string) => {
    if (!Array.isArray(packagings)) {
      return 'Không xác định'
    }
    const numericId = typeof packagingId === 'string' ? parseInt(packagingId) : packagingId
    const packaging = packagings.find(p => p.id === numericId)
    return packaging?.name || 'Không xác định'
  }

  // Removed statistics for Supplies page; CRUD only

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý vật tư - hóa chất</h1>
              <p className="text-orange-100">Quản lý kho vật tư và hóa chất phòng Lab</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {/* <Button 
              onClick={testApiConnection}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              disabled={submitting}
            >
              🔧 Debug API
            </Button> */}
            <Button 
              onClick={() => {
                setCurrentPage(0)
                setSearchQuery('')  
                setTypeFilter('')
                fetchMaterials()
              }}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : '🔄'} Refresh
            </Button>
            <Button 
              onClick={() => setIsAddingNew(true)}
              className="bg-white text-orange-600 hover:bg-gray-100"
              disabled={submitting}
            >
              <Plus size={16} className="mr-2" />
              Thêm vật tư
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle size={20} />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchMaterials}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRUD only - no statistics for Supplies page */}

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, mã vật tư..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả loại</option>
              <option value="1">Hóa chất</option>
              <option value="2">Vật tư</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Danh sách vật tư ({materialsData?.totalElements || materials.length || 0})</span>
              {loading && <Loader2 size={16} className="animate-spin" />}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Trang {currentPage + 1} / {materialsData?.totalPages || 1}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && materials.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">Mã</th>
                      <th className="text-left p-3 font-semibold">Tên vật tư</th>
                      <th className="text-left p-3 font-semibold">Loại</th>
                      <th className="text-left p-3 font-semibold">Số lượng</th>
                      <th className="text-left p-3 font-semibold">Đóng gói</th>
                      <th className="text-left p-3 font-semibold">Trạng thái</th>
                      <th className="text-left p-3 font-semibold">Hết hạn</th>
                      <th className="text-left p-3 font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!Array.isArray(materials) || materials.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          Không tìm thấy vật tư phù hợp
                        </td>
                      </tr>
                    ) : (
                      materials.map(material => {
                        const stockStatus = getStockStatus(material)
                        
                        return (
                          <tr key={material.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-mono text-sm">{material.code}</td>
                            <td className="p-3 font-medium">{material.name}</td>
                            <td className="p-3 text-sm">{getMaterialTypeLabel(typeof material.type === 'string' ? parseInt(material.type as unknown as string) : material.type)}</td>
                            <td className="p-3 text-sm font-medium">{material.quantity}</td>
                            <td className="p-3 text-sm">{getPackagingName(material.packagingId as unknown as number | string)}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                                {getStatusIcon(stockStatus.status)}
                                <span className="ml-1">{stockStatus.label}</span>
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {material.expiryTime ? formatDateSimple(material.expiryTime) : '-'}
                            </td>
                            <td className="p-3">
                              <div className="flex space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewMaterial(material)}
                                  title="Xem chi tiết"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMaterial(material)
                                    setIsEditing(true)
                                  }}
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewTransactions(material)}
                                  title="Lịch sử giao dịch"
                                >
                                  <FileText size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowDeleteConfirm(material)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {materialsData && materialsData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Hiển thị {Array.isArray(materials) ? materials.length : 0} trên tổng số {materialsData.totalElements} vật tư
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePagination('prev')}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft size={14} />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePagination('next')}
                      disabled={currentPage >= materialsData.totalPages - 1}
                    >
                      Sau
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Material Details Sidebar */}
      {(selectedMaterial || showTransactions) && (
        <div className="mt-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {showTransactions ? `Lịch sử giao dịch - ${selectedMaterial?.name || 'N/A'}` : 'Chi tiết vật tư'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMaterial(null)
                    setShowTransactions(false)
                    setIsEditing(false)
                  }}
                >
                  <X size={14} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showTransactions ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Array.isArray(logs) && logs.map(log => (
                    <Card key={log.logType} className="border">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {getInventoryLogTypeLabel(log.logType)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {log.note || 'Không có ghi chú'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!Array.isArray(logs) || logs.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có giao dịch nào
                    </div>
                  )}
                </div>
              ) : selectedMaterial ? (
                <>
                  {!isEditing && (
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" size="sm" onClick={handleEditMaterial}>
                        <Edit size={14} className="mr-1" />
                        Sửa
                      </Button>
                    </div>
                  )}
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Mã vật tư</Label>
                          <Input
                            value={selectedMaterial.code}
                            onChange={(e) => setSelectedMaterial({
                              ...selectedMaterial,
                              code: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label>Tên vật tư</Label>
                          <Input
                            value={selectedMaterial.name}
                            onChange={(e) => setSelectedMaterial({
                              ...selectedMaterial,
                              name: e.target.value
                            })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Số lượng</Label>
                          <Input
                            type="number"
                            value={selectedMaterial.quantity}
                            onChange={(e) => setSelectedMaterial({
                              ...selectedMaterial,
                              quantity: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div>
                          <Label>Loại *</Label>
                          <select
                            value={selectedMaterial.type || ''}
                            onChange={(e) => setSelectedMaterial({
                              ...selectedMaterial,
                              type: parseInt(e.target.value)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Chọn loại vật tư</option>
                            <option value={1}>Hoá chất</option>
                            <option value={2}>Vật tư</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Quy cách đóng gói *</Label>
                        <select
                          value={selectedMaterial.packagingId || ''}
                          onChange={(e) => setSelectedMaterial({
                            ...selectedMaterial,
                            packagingId: parseInt(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Chọn quy cách đóng gói</option>
                          {packagingData?.content?.map(packaging => (
                            <option key={packaging.id} value={packaging.id}>
                              {packaging.name} ({packaging.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label>Ngày hết hạn</Label>
                        <Input
                          type="date"
                          value={selectedMaterial.expiryTime ? String(selectedMaterial.expiryTime).slice(0, 10) : ''}
                          onChange={(e) => setSelectedMaterial({
                            ...selectedMaterial,
                            // store as date-only string YYYY-MM-DD
                            expiryTime: e.target.value || undefined
                          })}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveMaterial} disabled={submitting}>
                          {submitting ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                          Lưu
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          <X size={14} className="mr-1" />
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Mã:</span>
                          <p className="font-medium">{selectedMaterial.code}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Tên:</span>
                          <p className="font-medium">{selectedMaterial.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Loại:</span>
                          <p className="font-medium">{getMaterialTypeLabel(typeof selectedMaterial.type === 'string' ? parseInt(selectedMaterial.type as unknown as string) : selectedMaterial.type)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Số lượng:</span>
                          <p className="font-medium">{selectedMaterial.quantity}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Đóng gói:</span>
                          <p className="font-medium">{getPackagingName(selectedMaterial.packagingId as unknown as number | string)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Nhập kho:</span>
                          <p className="font-medium">{formatDateTime(selectedMaterial.importTime)}</p>
                        </div>
                        {selectedMaterial.expiryTime && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Hết hạn:</span>
                            <p className="font-medium">{formatDateSimple(selectedMaterial.expiryTime)}</p>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      {/* <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Thao tác nhanh</h4>
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <Input
                              type="number"
                              placeholder="Số lượng"
                              value={transactionForm.quantity || ''}
                              onChange={(e) => setTransactionForm({
                                ...transactionForm,
                                quantity: parseInt(e.target.value) || 0,
                                materialId: selectedMaterial?.id || 0
                              })}
                              className="flex-1"
                            />
                            <Button
                              onClick={handleImportMaterial}
                              disabled={submitting}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus size={14} className="mr-1" />
                              Nhập
                            </Button>
                            <Button
                              onClick={handleExportMaterial}
                              disabled={submitting}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Minus size={14} className="mr-1" />
                              Xuất
                            </Button>
                          </div>
                          <Input
                            placeholder="Ghi chú..."
                            value={transactionForm.note}
                            onChange={(e) => setTransactionForm({
                              ...transactionForm,
                              note: e.target.value
                            })}
                          />
                        </div>
                      </div> */}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chọn một vật tư để xem chi tiết
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle size={20} />
                <span>Xác nhận xóa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Bạn có chắc chắn muốn xóa vật tư <strong>{showDeleteConfirm.name}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Thao tác này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => handleDeleteMaterial(showDeleteConfirm)}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} className="mr-2" />
                      Xóa
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add New Material Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Thêm vật tư mới</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNew(false)}
                  disabled={submitting}
                >
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mã vật tư *</Label>
                    <Input
                      value={newMaterial.code}
                      onChange={(e) => setNewMaterial({ ...newMaterial, code: e.target.value })}
                      placeholder="VD: VT001"
                    />
                  </div>
                  <div>
                    <Label>Tên vật tư *</Label>
                    <Input
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="VD: Ống nghiệm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      value={newMaterial.quantity || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Loại *</Label>
                    <select
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, type: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={1}>Hóa chất</option>
                      <option value={2}>Vật tư</option>
                    </select>
                  </div>
                  <div>
                    <Label>Đóng gói *</Label>
                    <select
                      value={newMaterial.packagingId || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, packagingId: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Chọn đóng gói</option>
                      {Array.isArray(packagings) && packagings.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Ngày hết hạn</Label>
                  <Input
                    type="date"
                    value={newMaterial.expiryTime || ''}
                    onChange={(e) => setNewMaterial({ ...newMaterial, expiryTime: e.target.value || '' })}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingNew(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleAddNew} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Đang thêm...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Thêm vật tư
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SupplyManagement 