import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  Search, 
  Edit3, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Package2,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Eye,
  Loader2,
  Save,
  X
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { inventoryApi, inventoryLogsApi } from '@/services'
import { getMaterialTypeLabel } from '@/types/api'
import type { 
  InventoryItem, 
  InventoryLogsDTO,
  InventorySearchRequest,
  InventoryLogSearchRequest,
  CreateInventoryLogRequest,
  PaginatedResponse 
} from '@/types/api'

const InventoryManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'items' | 'logs'>('items')
  const [searchQuery, setSearchQuery] = useState('')
  const [materialTypeFilter, setMaterialTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // API State
  const [inventoryData, setInventoryData] = useState<PaginatedResponse<InventoryItem> | null>(null)
  const [inventoryLogs, setInventoryLogs] = useState<PaginatedResponse<InventoryLogsDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form States

  const [logForm, setLogForm] = useState<{
    quantity: number
    note: string
    logType: number
    exportType: number
    exportId: number
    items: Array<{
      type: number
      materialId: number
      quantity: number
      expiryDate: string
      unitPrice: number
      amount: number
      note: string
    }>
  }>({
    quantity: 0,
    note: '',
    logType: 1,
    exportType: 1,
    exportId: 1,
    items: []
  })

  // Fetch inventory items
  const fetchInventoryItems = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchParams: InventorySearchRequest = {
        keyword: searchQuery || undefined,
        materialType: materialTypeFilter ? parseInt(materialTypeFilter) : undefined,
        status: statusFilter ? parseInt(statusFilter) : undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        // orderCol: 'name',
        isDesc: false
      }

      const response = await inventoryApi.search(searchParams)
      setInventoryData(response)
    } catch (err) {
      console.error('Error fetching inventory items:', err)
      setError('Không thể tải danh sách vật tư kho. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch inventory logs
  const fetchInventoryLogs = async () => {
    try {
      const searchParams: InventoryLogSearchRequest = {
        keyword: '',
        status: 1,
        pageIndex: 0,
        pageSize: 50,
        // orderCol: 'createdAt',
        isDesc: true
      }

      const response = await inventoryLogsApi.search(searchParams)
      setInventoryLogs(response)
    } catch (err) {
      console.error('Error fetching inventory logs:', err)
    }
  }

  useEffect(() => {
    fetchInventoryItems()
  }, [currentPage, searchQuery, materialTypeFilter, statusFilter])

  useEffect(() => {
    if (selectedItem?.id) {
      fetchInventoryLogs()
    }
  }, [selectedItem])

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= 0) {
      return { status: 'OUT_OF_STOCK', label: 'Hết hàng', color: 'bg-red-100 text-red-800' }
    } else if (item.currentStock <= item.minStock) {
      return { status: 'LOW_STOCK', label: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' }
    } else if (item.currentStock >= item.maxStock) {
      return { status: 'OVER_STOCK', label: 'Dư thừa', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { status: 'NORMAL', label: 'Bình thường', color: 'bg-green-100 text-green-800' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK': return <AlertTriangle size={14} className="text-red-600" />
      case 'LOW_STOCK': return <TrendingDown size={14} className="text-yellow-600" />
      case 'OVER_STOCK': return <TrendingUp size={14} className="text-blue-600" />
      default: return <CheckCircle size={14} className="text-green-600" />
    }
  }



  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowLogs(false)
    setIsEditing(false)
  }

  const handleEditItem = () => {
    setIsEditing(true)
  }

  const handleSaveItem = async () => {
    if (!selectedItem) return

    try {
      setSubmitting(true)
      
      // Note: Inventory items are read-only, updates should be done through inventory logs
      toast.success('Vật tư kho chỉ có thể xem, không thể chỉnh sửa trực tiếp. Sử dụng nhập/xuất kho để cập nhật.')
      setIsEditing(false)
      await fetchInventoryItems()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Có lỗi xảy ra khi cập nhật vật tư')
    } finally {
      setSubmitting(false)
    }
  }


  const handleImportExport = (type: 'import' | 'export') => {
    setLogForm({
      quantity: 0,
      note: '',
      logType: type === 'import' ? 1 : 2,
      exportType: 1, // 1 - department, 2 - referral source
      exportId: 1, // Default department ID
      items: []
    })
    setIsAddingNew(true)
  }

  const handleSubmitImportExport = async () => {
    if (logForm.items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một vật tư')
      return
    }

    // Validate items
    for (const item of logForm.items) {
      if (item.materialId <= 0) {
        toast.error('Vui lòng nhập ID vật tư hợp lệ')
        return
      }
      if (item.quantity <= 0) {
        toast.error('Vui lòng nhập số lượng hợp lệ')
        return
      }
    }

    try {
      setSubmitting(true)
      
      const logData: CreateInventoryLogRequest = {
        logType: logForm.logType,
        exportType: logForm.exportType,
        exportId: logForm.exportId,
        note: logForm.note,
        items: logForm.items.map(item => ({
          type: item.type,
          materialId: item.materialId,
          quantity: item.quantity,
          expiryDate: item.expiryDate || '',
          unitPrice: item.unitPrice || 0,
          amount: item.amount || 0,
          note: item.note || ''
        }))
      }

      console.log('Submitting inventory log:', logData)
      await inventoryLogsApi.create(logData)
      
      toast.success(logForm.logType === 1 ? 'Nhập kho thành công!' : 'Xuất kho thành công!')
      setIsAddingNew(false)
      await fetchInventoryLogs()
      
      // Reset form
      setLogForm({
        quantity: 0,
        note: '',
        logType: 1,
        exportType: 1,
        exportId: 1,
        items: []
      })
    } catch (error) {
      console.error('Error submitting inventory log:', error)
      toast.error('Có lỗi xảy ra khi thực hiện giao dịch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStockTransaction = async (type: 'import' | 'export') => {
    if (!selectedItem || logForm.quantity <= 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ')
      return
    }

    try {
      setSubmitting(true)
      
      const logData: CreateInventoryLogRequest = {
        logType: type === 'import' ? 1 : 2, // 1 - nhập kho, 2 - xuất kho
        exportType: 1, // 1 - department, 2 - referral source
        exportId: 1, // Default department ID
        items: [{
          type: 1, // 1 - hóa chất, 2 - vật tư
          materialId: selectedItem.id!,
          quantity: logForm.quantity,
          expiryDate: '', // Default expiry date
          unitPrice: 0, // Default unit price
          amount: 0, // Default amount
          note: logForm.note || ''
        }],
        note: logForm.note || ''
      }
      
      await inventoryLogsApi.create(logData)
      toast.success(`${type === 'import' ? 'Nhập' : 'Xuất'} kho thành công!`)
      
      setLogForm({
        quantity: 0,
        note: '',
        logType: 1,
        exportType: 1,
        exportId: 1,
        items: []
      })
      
      await fetchInventoryItems()
      await fetchInventoryLogs()
    } catch (error) {
      console.error('Error creating log:', error)
      toast.error(`Có lỗi xảy ra khi ${type === 'import' ? 'nhập' : 'xuất'} kho`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewLogs = () => {
    setShowLogs(true)
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchInventoryItems()
  }

  // Ensure inventoryItems is always an array
  const inventoryItems = Array.isArray(inventoryData?.content) 
    ? inventoryData.content 
    : Array.isArray(inventoryData) 
      ? inventoryData 
      : []
  
  const logs = Array.isArray(inventoryLogs?.content) 
    ? inventoryLogs.content 
    : Array.isArray(inventoryLogs) 
      ? inventoryLogs 
      : []

  // Calculate statistics - with additional safety checks
  const stats = {
    total: inventoryItems.length,
    lowStock: inventoryItems.filter(item => item && getStockStatus(item).status === 'LOW_STOCK').length,
    outOfStock: inventoryItems.filter(item => item && getStockStatus(item).status === 'OUT_OF_STOCK').length,
    normal: inventoryItems.filter(item => item && getStockStatus(item).status === 'NORMAL').length,
    totalValue: inventoryItems.reduce((sum, item) => {
      if (!item || typeof item.currentStock !== 'number' || typeof item.unitPrice !== 'number') {
        return sum
      }
      return sum + (item.currentStock * item.unitPrice)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý kho</h1>
              <p className="text-emerald-100">Quản lý vật tư và theo dõi tồn kho</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleImportExport('import')}
              className="bg-white text-green-600 hover:bg-gray-100"
              disabled={submitting}
            >
              <ArrowUpCircle size={16} className="mr-2" />
              Nhập kho
            </Button>
            <Button 
              onClick={() => handleImportExport('export')}
              className="bg-white text-red-600 hover:bg-gray-100"
              disabled={submitting}
            >
              <ArrowDownCircle size={16} className="mr-2" />
              Xuất kho
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentTab === 'items' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setCurrentTab('items')}
        >
          <Package2 size={16} className="inline mr-2" />
          Vật tư kho
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentTab === 'logs' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setCurrentTab('logs')}
        >
          <History size={16} className="inline mr-2" />
          Lịch sử nhập xuất
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle size={20} />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchInventoryItems}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng vật tư</p>
                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Bình thường</p>
                <p className="text-lg font-bold text-green-600">{stats.normal}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Sắp hết</p>
                <p className="text-lg font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Hết hàng</p>
                <p className="text-lg font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng giá trị</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalValue)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {currentTab === 'items' ? (
        <>
          {/* Search and Filter */}
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  value={materialTypeFilter}
                  onChange={(e) => setMaterialTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tất cả loại</option>
                  <option value="1">Hóa chất</option>
                  <option value="2">Vật tư</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Hoạt động</option>
                  <option value="0">Không hoạt động</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Items List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Danh sách vật tư ({inventoryItems.length})</span>
                    {loading && <Loader2 size={16} className="animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading && inventoryItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
                      <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                  ) : inventoryItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Không tìm thấy vật tư phù hợp
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {inventoryItems.map(item => {
                        if (!item) return null
                        const stockStatus = getStockStatus(item)
                        
                        return (
                          <Card key={item.id} className="border hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleViewItem(item)}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{item.name}</h3>
                                  <p className="text-sm text-gray-600">Mã: {item.code}</p>
                                  <p className="text-sm text-gray-600">
                                    Loại: {getMaterialTypeLabel(item.materialType)}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                                      {getStatusIcon(stockStatus.status)}
                                      <span className="ml-1">{stockStatus.label}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Tồn kho:</span>
                                  <p className="font-medium">{item.currentStock} {item.unit}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Đơn giá:</span>
                                  <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Tối thiểu:</span>
                                  <p className="font-medium">{item.minStock} {item.unit}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Tối đa:</span>
                                  <p className="font-medium">{item.maxStock} {item.unit}</p>
                                </div>
                              </div>

                              {item.location && (
                                <div className="mt-2 text-sm">
                                  <span className="text-gray-600">Vị trí:</span>
                                  <span className="ml-1 font-medium">{item.location}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Item Details / Stock Transaction */}
            <div>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{showLogs ? 'Lịch sử nhập xuất' : 'Chi tiết vật tư'}</span>
                    {selectedItem && (
                      <div className="flex space-x-2">
                        {!showLogs ? (
                          <>
                            {!isEditing ? (
                              <>
                                <Button size="sm" variant="outline" onClick={handleEditItem}>
                                  <Edit3 size={14} className="mr-1" />
                                  Sửa
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleViewLogs}>
                                  <History size={14} className="mr-1" />
                                  Lịch sử
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" onClick={handleSaveItem} disabled={submitting}>
                                  {submitting ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                                  Lưu
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                                  <X size={14} className="mr-1" />
                                  Hủy
                                </Button>
                              </>
                            )}
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setShowLogs(false)}>
                            <Eye size={14} className="mr-1" />
                            Chi tiết
                          </Button>
                        )}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedItem ? (
                    showLogs ? (
                      <div className="space-y-4">
                        <div className="border-b pb-2">
                          <h3 className="font-semibold">{selectedItem.name}</h3>
                          <p className="text-sm text-gray-600">Lịch sử nhập xuất kho</p>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {logs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              Chưa có giao dịch nào
                            </div>
                          ) : (
                            logs.map(log => (
                              <div key={log.id} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center space-x-2">
                                    {log.logType === 1 ? (
                                      <ArrowUpCircle size={16} className="text-green-600" />
                                    ) : (
                                      <ArrowDownCircle size={16} className="text-red-600" />
                                    )}
                                    <span className="font-medium">
                                      {log.logType === 1 ? 'Nhập kho' : 'Xuất kho'}
                                    </span>
                                  </div>
                                  <div className="text-right text-sm">
                                    <p className="font-bold">{log.quantity} {selectedItem.unit}</p>
                                    <p className="text-gray-600">{formatDateTime(log.createdAt!)}</p>
                                  </div>
                                </div>
                                {log.reason && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Lý do:</span> {log.reason}
                                  </p>
                                )}
                                {log.note && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Ghi chú:</span> {log.note}
                                  </p>
                                )}
                                {log.createdBy && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Người thực hiện: {log.createdBy}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="border-b pb-4">
                          <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-gray-600">Mã:</span>
                              {isEditing ? (
                                <Input 
                                  className="mt-1" 
                                  value={selectedItem.code}
                                  onChange={(e) => setSelectedItem({...selectedItem, code: e.target.value})}
                                />
                              ) : (
                                <p className="font-medium">{selectedItem.code}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-600">Đơn vị:</span>
                              {isEditing ? (
                                <Input 
                                  className="mt-1" 
                                  value={selectedItem.unit}
                                  onChange={(e) => setSelectedItem({...selectedItem, unit: e.target.value})}
                                />
                              ) : (
                                <p className="font-medium">{selectedItem.unit}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stock Info */}
                        <div className="border-b pb-4">
                          <h4 className="font-semibold mb-3">Thông tin tồn kho</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Tồn kho hiện tại:</span>
                              <p className="font-bold text-2xl text-emerald-600">
                                {selectedItem.currentStock} {selectedItem.unit}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Trạng thái:</span>
                              <div className="mt-1">
                                {(() => {
                                  const status = getStockStatus(selectedItem)
                                  return (
                                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${status.color}`}>
                                      {getStatusIcon(status.status)}
                                      <span className="ml-1">{status.label}</span>
                                    </span>
                                  )
                                })()}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Tối thiểu:</span>
                              {isEditing ? (
                                <Input 
                                  type="number"
                                  className="mt-1" 
                                  value={selectedItem.minStock}
                                  onChange={(e) => setSelectedItem({...selectedItem, minStock: parseInt(e.target.value) || 0})}
                                />
                              ) : (
                                <p className="font-medium">{selectedItem.minStock} {selectedItem.unit}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-600">Tối đa:</span>
                              {isEditing ? (
                                <Input 
                                  type="number"
                                  className="mt-1" 
                                  value={selectedItem.maxStock}
                                  onChange={(e) => setSelectedItem({...selectedItem, maxStock: parseInt(e.target.value) || 0})}
                                />
                              ) : (
                                <p className="font-medium">{selectedItem.maxStock} {selectedItem.unit}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price, Location, and Dates */}
                        <div className="border-b pb-4">
                          <h4 className="font-semibold mb-3">Thông tin khác</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Đơn giá:</span>
                              {isEditing ? (
                                <Input 
                                  type="number"
                                  className="mt-1" 
                                  value={selectedItem.unitPrice}
                                  onChange={(e) => setSelectedItem({...selectedItem, unitPrice: parseFloat(e.target.value) || 0})}
                                />
                              ) : (
                                <p className="font-medium">{formatCurrency(selectedItem.unitPrice)}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-600">Vị trí:</span>
                              {isEditing ? (
                                <Input 
                                  className="mt-1" 
                                  value={selectedItem.location || ''}
                                  onChange={(e) => setSelectedItem({...selectedItem, location: e.target.value})}
                                />
                              ) : (
                                <p className="font-medium">{selectedItem.location || 'Chưa xác định'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-600">Loại vật tư:</span>
                              {isEditing ? (
                                <select 
                                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" 
                                  value={selectedItem.materialType}
                                  onChange={(e) => setSelectedItem({...selectedItem, materialType: parseInt(e.target.value)})}
                                >
                                  <option value={0}>Thuốc thử</option>
                                  <option value={1}>Thiết bị</option>
                                  <option value={2}>Vật tư tiêu hao</option>
                                  <option value={3}>Hóa chất</option>
                                  <option value={4}>An toàn</option>
                                  <option value={5}>Khác</option>
                                </select>
                              ) : (
                                <p className="font-medium">{getMaterialTypeLabel(selectedItem.materialType)}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-600">Ngày nhập:</span>
                              {isEditing ? (
                                <Input 
                                  type="date"
                                  className="mt-1" 
                                  value={selectedItem.importDate?.split('T')[0] || ''}
                                  onChange={(e) => setSelectedItem({...selectedItem, importDate: e.target.value})}
                                />
                              ) : (
                                <p className="font-medium">{selectedItem.importDate ? new Date(selectedItem.importDate).toLocaleDateString('vi-VN') : 'Chưa có'}</p>
                              )}
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Ngày hết hạn:</span>
                              {isEditing ? (
                                <Input 
                                  type="date"
                                  className="mt-1" 
                                  value={selectedItem.expiryDate?.split('T')[0] || ''}
                                  onChange={(e) => setSelectedItem({...selectedItem, expiryDate: e.target.value})}
                                />
                              ) : (
                                <p className="font-medium">{selectedItem.expiryDate ? new Date(selectedItem.expiryDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stock Transaction Form */}
                        {!isEditing && (
                          <div>
                            <h4 className="font-semibold mb-3">Nhập/Xuất kho</h4>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Số lượng</Label>
                                  <Input
                                    type="number"
                                    value={logForm.quantity}
                                    onChange={(e) => setLogForm({...logForm, quantity: parseInt(e.target.value) || 0})}
                                    placeholder="Nhập số lượng"
                                  />
                                </div>
                                <div>
                                  <Label>Ghi chú</Label>
                                  <Input
                                    value={logForm.note}
                                    onChange={(e) => setLogForm({...logForm, note: e.target.value})}
                                    placeholder="Ghi chú nhập/xuất"
                                  />
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  onClick={() => handleStockTransaction('import')}
                                  disabled={submitting || logForm.quantity <= 0}
                                  className="flex-1"
                                >
                                  <ArrowUpCircle size={16} className="mr-1" />
                                  Nhập kho
                                </Button>
                                <Button 
                                  onClick={() => handleStockTransaction('export')}
                                  disabled={submitting || logForm.quantity <= 0}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <ArrowDownCircle size={16} className="mr-1" />
                                  Xuất kho
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Chọn một vật tư để xem chi tiết</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pagination */}
          {inventoryData && inventoryData.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || loading}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {currentPage + 1} / {inventoryData.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(inventoryData.totalPages - 1, currentPage + 1))}
                disabled={currentPage >= inventoryData.totalPages - 1 || loading}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      ) : (
        <div>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Lịch sử nhập xuất kho</CardTitle>
              <CardDescription>Xem toàn bộ lịch sử giao dịch kho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <History size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Tính năng đang phát triển</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import/Export Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {logForm.logType === 1 ? 'Nhập kho' : 'Xuất kho'}
                </CardTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Loại giao dịch *</Label>
                    <select
                      value={logForm.logType}
                      onChange={(e) => setLogForm({ ...logForm, logType: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={submitting}
                    >
                      <option value={1}>Nhập kho</option>
                      <option value={2}>Xuất kho</option>
                    </select>
                  </div>

                  <div>
                    <Label>Loại xuất *</Label>
                    <select
                      value={logForm.exportType}
                      onChange={(e) => setLogForm({ ...logForm, exportType: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={submitting}
                    >
                      <option value={1}>Phòng ban</option>
                      <option value={2}>Nguồn gửi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>ID Phòng ban/Nguồn gửi *</Label>
                  <Input
                    type="number"
                    value={logForm.exportId}
                    onChange={(e) => setLogForm({ ...logForm, exportId: parseInt(e.target.value) || 0 })}
                    placeholder="Nhập ID phòng ban hoặc nguồn gửi"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label>Ghi chú</Label>
                  <Input
                    value={logForm.note}
                    onChange={(e) => setLogForm({ ...logForm, note: e.target.value })}
                    placeholder="Nhập ghi chú (tùy chọn)"
                    disabled={submitting}
                  />
                </div>

                <div className="border-t pt-4">
                  <Label className="text-lg font-semibold">Danh sách vật tư</Label>
                  <div className="space-y-2 mt-2">
                    {logForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded">
                        <div>
                          <Label className="text-sm">Loại hàng hóa</Label>
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const newItems = [...logForm.items]
                              newItems[index].type = parseInt(e.target.value)
                              setLogForm({ ...logForm, items: newItems })
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            disabled={submitting}
                          >
                            <option value={1}>Hóa chất</option>
                            <option value={2}>Vật tư</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm">ID Vật tư</Label>
                          <Input
                            type="number"
                            value={item.materialId}
                            onChange={(e) => {
                              const newItems = [...logForm.items]
                              newItems[index].materialId = parseInt(e.target.value) || 0
                              setLogForm({ ...logForm, items: newItems })
                            }}
                            className="text-sm"
                            disabled={submitting}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Số lượng</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...logForm.items]
                              newItems[index].quantity = parseInt(e.target.value) || 0
                              setLogForm({ ...logForm, items: newItems })
                            }}
                            className="text-sm"
                            disabled={submitting}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItems = logForm.items.filter((_, i) => i !== index)
                              setLogForm({ ...logForm, items: newItems })
                            }}
                            disabled={submitting}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLogForm({
                          ...logForm,
                          items: [...logForm.items, {
                            type: 1,
                            materialId: 0,
                            quantity: 0,
                            expiryDate: '',
                            unitPrice: 0,
                            amount: 0,
                            note: ''
                          }]
                        })
                      }}
                      disabled={submitting}
                    >
                      + Thêm vật tư
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingNew(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSubmitImportExport}
                    disabled={submitting || logForm.items.length === 0}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        {logForm.logType === 1 ? 'Nhập kho' : 'Xuất kho'}
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

export default InventoryManagement 