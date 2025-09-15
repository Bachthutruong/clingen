import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Package, 
  Search, 
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
import { formatDateTime } from '@/lib/utils'
import { inventoryApi, inventoryLogsApi, departmentApi, supplierApi, materialsApi } from '@/services'
import { transformToPaginatedResponse } from '@/services'
import type { 
  InventoryLogsDTO,
  InventorySearchRequest,
  InventoryLogSearchRequest,
  CreateInventoryLogRequest,
  PaginatedResponse,
  MaterialAPIResponse
} from '@/types/api'

const InventoryManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'items' | 'logs'>('items')
  const [searchQuery, setSearchQuery] = useState('')
  const [materialTypeFilter, setMaterialTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [itemLogs, setItemLogs] = useState<any[]>([])
  const [loadingItemLogs, setLoadingItemLogs] = useState(false)
  const [unpaidStats, setUnpaidStats] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  const [departments, setDepartments] = useState<Array<{id:number;name:string}>>([])
  const [suppliers, setSuppliers] = useState<Array<{id:number;name:string}>>([])
  const [materialsByType, setMaterialsByType] = useState<{[key: number]: MaterialAPIResponse[]}>({})
  const [loadingMaterials, setLoadingMaterials] = useState<{[key: number]: boolean}>({})

  // API State
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [logsTabData, setLogsTabData] = useState<PaginatedResponse<InventoryLogsDTO> | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logsError, setLogsError] = useState<string | null>(null)

  // Form States
  const [logForm, setLogForm] = useState<{
    quantity: number
    note: string
    logType: number
    exportType: number
    exportId: number
    isPay?: boolean
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

  // Logs tab state & loader
  const [logsKeyword, setLogsKeyword] = useState('')
  const [logsType, setLogsType] = useState<string>('')
  const [logsFromDate, setLogsFromDate] = useState('')
  const [logsToDate, setLogsToDate] = useState('')
  const [logsPage, setLogsPage] = useState(0)
  const [logsPageSize, setLogsPageSize] = useState(20)

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
        isDesc: false
      }

      const response = await inventoryApi.search(searchParams)
      console.log('🔍 Inventory API response:', response)
      setInventoryData(response)
    } catch (err) {
      console.error('Error fetching inventory items:', err)
      setError('Không thể tải danh sách vật tư kho. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const fetchLogsTab = async () => {
    try {
      setLoadingLogs(true)
      setLogsError(null)
      const params: InventoryLogSearchRequest = {
        keyword: logsKeyword || undefined,
        pageIndex: logsPage,
        pageSize: logsPageSize,
        isDesc: true,
        logType: logsType ? parseInt(logsType) : undefined,
        fromDate: logsFromDate || undefined,
        toDate: logsToDate || undefined
      }
      const response = await inventoryLogsApi.search(params)
      console.log('🔍 Logs API response:', response)
      setLogsTabData(response)
    } catch (err) {
      console.error('Error fetching logs tab:', err)
      setLogsError('Không thể tải lịch sử nhập xuất. Vui lòng thử lại.')
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchInventoryItems()
  }, [currentPage, searchQuery, materialTypeFilter, statusFilter])

  useEffect(() => {
    if (currentTab === 'logs') {
      fetchLogsTab()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, logsKeyword, logsType, logsFromDate, logsToDate, logsPage, logsPageSize])

  // Load logs data on component mount
  useEffect(() => {
      fetchLogsTab()
  }, [])

  // Fetch materials by type
  const fetchMaterialsByType = async (type: number) => {
    if (materialsByType[type]) {
      return // Already loaded
    }

    try {
      setLoadingMaterials(prev => ({ ...prev, [type]: true }))
      const materials = await materialsApi.getByTypeForDropdown(type)
      setMaterialsByType(prev => ({ ...prev, [type]: materials }))
    } catch (error) {
      console.error(`Error fetching materials for type ${type}:`, error)
      setMaterialsByType(prev => ({ ...prev, [type]: [] }))
    } finally {
      setLoadingMaterials(prev => ({ ...prev, [type]: false }))
    }
  }

  // Fetch unpaid statistics
  const fetchUnpaidStats = async () => {
    try {
      const stats = await inventoryApi.getUnpaidStatistics()
      setUnpaidStats(stats)
    } catch (error) {
      console.error('Error fetching unpaid stats:', error)
    }
  }

  useEffect(() => {
    // Preload master data
    departmentApi.getAll().then(depts => {
      setDepartments(depts.map(dept => ({ id: dept.id!, name: dept.name })))
    }).catch(() => setDepartments([]))
    supplierApi.getAll().then(setSuppliers).catch(() => setSuppliers([]))
    
    // Fetch unpaid statistics
    fetchUnpaidStats()
  }, [])

  const getStockStatus = (item: any) => {
    const quantity = item.quantity || 0
    if (quantity <= 0) {
      return { status: 'OUT_OF_STOCK', label: 'Hết hàng', color: 'bg-red-100 text-red-800' }
    } else if (quantity <= 5) { // Assume low stock threshold is 5
      return { status: 'LOW_STOCK', label: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' }
    } else if (quantity >= 50) { // Assume over stock threshold is 50
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

  const handleViewItem = (item: any) => {
    setSelectedItem(item)
    setShowItemDialog(true)
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
    
    // Preload materials for both types
    fetchMaterialsByType(1) // Hóa chất
    fetchMaterialsByType(2) // Vật tư
  }

  const handleSubmitImportExport = async () => {
    if (logForm.items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một vật tư')
      return
    }

    // Validate items
    for (const item of logForm.items) {
      if (item.materialId <= 0) {
        toast.error('Vui lòng chọn vật tư/hóa chất')
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
        })),
        isPay: logForm.logType === 1 ? logForm.isPay : undefined
      }

      console.log('Submitting inventory log:', logData)
      await inventoryLogsApi.create(logData)
      
      toast.success(logForm.logType === 1 ? 'Nhập kho thành công!' : 'Xuất kho thành công!')
      setIsAddingNew(false)
      await fetchLogsTab()
      
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
          materialId: selectedItem.materialId, // Use materialId instead of id
          quantity: logForm.quantity,
          expiryDate: selectedItem.expiryDate || '', // Use item's expiry date
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
      await fetchLogsTab()
    } catch (error) {
      console.error('Error creating log:', error)
      toast.error(`Có lỗi xảy ra khi ${type === 'import' ? 'nhập' : 'xuất'} kho`)
    } finally {
      setSubmitting(false)
    }
  }

  const fetchItemLogs = async (item: any) => {
    try {
      setLoadingItemLogs(true)
      console.log('🔍 Fetching logs for item:', item)
      
      const searchParams: InventoryLogSearchRequest = {
        pageIndex: 0,
        pageSize: 100, // Get more logs for the dialog
        orderCol: 'createdAt',
        isDesc: true
        // Note: materialId filter not available in current API
      }
      
      const response = await inventoryLogsApi.search(searchParams)
      console.log('📊 Raw logs response:', response)
      
      const logsData = transformToPaginatedResponse(response, 0, 100)
      console.log('📋 Transformed logs data:', logsData)
      
      // Filter logs by materialId in frontend since API doesn't support it
      const filteredLogs = (logsData.content || []).filter((log: any) => {
        const hasMaterial = log.logDetails && Array.isArray(log.logDetails) && 
          log.logDetails.some((detail: any) => detail.materialId === item.materialId)
        console.log(`🔍 Log ${log.id}: hasMaterial=${hasMaterial}, materialId=${item.materialId}`, log.logDetails)
        return hasMaterial
      })
      
      console.log('✅ Filtered logs for item:', filteredLogs)
      setItemLogs(filteredLogs)
    } catch (error) {
      console.error('Error fetching item logs:', error)
      setItemLogs([])
    } finally {
      setLoadingItemLogs(false)
    }
  }

  const handleViewLogs = (item: any) => {
    setSelectedItem(item)
    setShowItemDialog(false) // Close item dialog
    setShowLogsDialog(true)
    fetchItemLogs(item)
  }

  const handleDeleteLog = (log: any) => {
    setItemToDelete(log)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      setSubmitting(true)
      await inventoryLogsApi.delete(itemToDelete.id)
      toast.success('Xóa giao dịch thành công!')
      
      // Refresh logs
      if (selectedItem) {
        await fetchItemLogs(selectedItem)
      }
      await fetchLogsTab()
    } catch (error) {
      console.error('Error deleting log:', error)
      toast.error('Có lỗi xảy ra khi xóa giao dịch')
    } finally {
      setSubmitting(false)
      setShowDeleteDialog(false)
      setItemToDelete(null)
    }
  }

  const handleUpdateLog = async (log: any) => {
    try {
      setSubmitting(true)
      
      // Validate required fields
      if (!log.id) {
        toast.error('Không tìm thấy ID giao dịch')
        return
      }
      
      if (!log.logDetails || !Array.isArray(log.logDetails) || log.logDetails.length === 0) {
        toast.error('Giao dịch phải có ít nhất một vật tư')
        return
      }
      
      // Prepare update data according to API spec
      const updateData = {
        logType: log.logType,
        exportType: log.exportType || 1, // Default to department
        exportId: log.exportId || 1, // Default export ID
        items: log.logDetails.map((detail: any) => ({
          type: detail.materialType,
          materialId: detail.materialId,
          quantity: detail.quantity,
          expiryDate: detail.expiryDate || '',
          unitPrice: detail.unitPrice || 0,
          amount: detail.amount || 0,
          note: detail.note || ''
        })),
        note: log.note || '',
        isPay: log.isPay
      }
      
      // Remove undefined values to avoid API errors
      Object.keys(updateData).forEach(key => {
        if ((updateData as any)[key] === undefined) {
          delete (updateData as any)[key]
        }
      })
      
      console.log('Updating log with data:', updateData)
      await inventoryLogsApi.update(log.id, updateData)
      toast.success('Cập nhật giao dịch thành công!')
      
      // Refresh logs
      if (selectedItem) {
        await fetchItemLogs(selectedItem)
      }
      await fetchLogsTab()
    } catch (error: any) {
      console.error('Error updating log:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật giao dịch'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchInventoryItems()
  }

  const handleLogsSearch = () => {
    setLogsPage(0)
    fetchLogsTab()
  }

  // Ensure inventoryItems is always an array
  const inventoryItems = Array.isArray(inventoryData?.content) 
    ? inventoryData.content 
    : Array.isArray(inventoryData) 
      ? inventoryData 
      : []
  
  // Debug logging
  console.log('🔍 Inventory data:', inventoryData)
  console.log('🔍 Inventory items:', inventoryItems)
  console.log('🔍 Inventory items length:', inventoryItems.length)
  
  // Get logs from logsTabData instead of inventoryLogs
  const logs = Array.isArray(logsTabData?.content) 
    ? logsTabData.content 
    : Array.isArray(logsTabData) 
      ? logsTabData 
      : []

  // Debug logging for logs
  console.log('🔍 Logs tab data:', logsTabData)
  console.log('🔍 Logs array:', logs)
  console.log('🔍 Logs length:', logs.length)

  // Calculate statistics - with additional safety checks
  const stats = {
    total: inventoryItems.length,
    lowStock: inventoryItems.filter((item: any) => item && getStockStatus(item).status === 'LOW_STOCK').length,
    outOfStock: inventoryItems.filter((item: any) => item && getStockStatus(item).status === 'OUT_OF_STOCK').length,
    normal: inventoryItems.filter((item: any) => item && getStockStatus(item).status === 'NORMAL').length,
    totalQuantity: inventoryItems.reduce((sum: number, item: any) => {
      if (!item || typeof item.quantity !== 'number') {
        return sum
      }
      return sum + item.quantity
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
                <p className="text-xs text-gray-600">Tổng số lượng</p>
                <p className="text-lg font-bold text-emerald-600">{stats.totalQuantity}</p>
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

          {/* Inventory Items Table */}
              <Card className="shadow-lg border-0">
                <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span>Danh sách vật tư ({inventoryItems.length})</span>
                    {loading && <Loader2 size={16} className="animate-spin" />}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Trang {currentPage + 1} / {inventoryData?.totalPages || 1}
                  </span>
                </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading && inventoryItems.length === 0 ? (
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
                          <th className="text-left p-3 font-semibold">Số lượng</th>
                          <th className="text-left p-3 font-semibold">Ngày nhập</th>
                          <th className="text-left p-3 font-semibold">Ngày hết hạn</th>
                          <th className="text-left p-3 font-semibold">Trạng thái</th>
                          <th className="text-left p-3 font-semibold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-gray-500">
                      Không tìm thấy vật tư phù hợp
                            </td>
                          </tr>
                  ) : (
                          inventoryItems.map((item: any) => {
                        if (!item) return null
                        const stockStatus = getStockStatus(item)
                        
                        return (
                              <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-3 font-mono text-sm">{item.code}</td>
                                <td className="p-3 font-medium">{item.materialName}</td>
                                <td className="p-3 text-sm">
                                  <span className="font-bold text-lg text-emerald-600">{item.quantity}</span>
                                </td>
                                <td className="p-3 text-sm">{item.importDate}</td>
                                <td className="p-3 text-sm">{item.expiryDate}</td>
                                <td className="p-3">
                                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                                      {getStatusIcon(stockStatus.status)}
                                      <span className="ml-1">{stockStatus.label}</span>
                                    </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex space-x-1">
                                <Button 
                                  variant="outline"
                                      size="sm"
                                      onClick={() => handleViewItem(item)}
                                      title="Xem chi tiết"
                                >
                                      <Eye size={14} />
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
                </>
                  )}
                </CardContent>
              </Card>

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
              <CardDescription>Lọc theo từ khóa, loại log và khoảng ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm theo ghi chú..."
                      value={logsKeyword}
                      onChange={(e) => setLogsKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogsSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={logsType}
                  onChange={(e) => { setLogsType(e.target.value); setLogsPage(0) }}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tất cả loại log</option>
                  <option value="1">Nhập kho</option>
                  <option value="2">Xuất kho</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={logsFromDate} onChange={(e) => { setLogsFromDate(e.target.value); setLogsPage(0) }} />
                  <Input type="date" value={logsToDate} onChange={(e) => { setLogsToDate(e.target.value); setLogsPage(0) }} />
                </div>
                <div className="flex space-x-2">
                  <select
                    value={logsPageSize}
                    onChange={(e) => { setLogsPageSize(parseInt(e.target.value)); setLogsPage(0) }}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={10}>10/trang</option>
                    <option value={20}>20/trang</option>
                    <option value={50}>50/trang</option>
                    <option value={100}>100/trang</option>
                  </select>
                  <Button
                    onClick={handleLogsSearch}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Search size={16} />
                  </Button>
                </div>
              </div>

              {logsError && (
                <div className="text-red-600 mb-3">{logsError}</div>
              )}

              {/* Unpaid Statistics */}
              {unpaidStats && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Thống kê chưa thanh toán</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {unpaidStats.totalUnpaid || 0}
                        </div>
                        <div className="text-sm text-gray-600">Tổng giao dịch chưa thanh toán</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {unpaidStats.totalAmount || 0}
                        </div>
                        <div className="text-sm text-gray-600">Tổng số tiền chưa thanh toán</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {unpaidStats.importUnpaid || 0}
                        </div>
                        <div className="text-sm text-gray-600">Nhập kho chưa thanh toán</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {loadingLogs ? (
                <div className="text-center py-8">
                  <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
                  <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Không có dữ liệu</p>
                </div>
              ) : (
                <>
                  {/* Pagination Info */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                      Hiển thị {logs.length} / {logsTabData?.totalElements || 0} giao dịch
                    </div>
                    <div className="text-sm text-gray-600">
                      Trang {logsPage + 1} / {logsTabData?.totalPages || 1}
                    </div>
                  </div>
                <div className="space-y-3">
                    {logs.map((log: any) => (
                      <div key={log.id || Math.random()} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          {log.logType === 1 ? (
                            <ArrowUpCircle size={16} className="text-green-600" />
                          ) : (
                            <ArrowDownCircle size={16} className="text-red-600" />
                          )}
                            <span className="font-medium text-lg">{log.logType === 1 ? 'Nhập kho' : 'Xuất kho'}</span>
                            <span className="text-sm text-gray-500">#{log.id}</span>
                        </div>
                          <div className="text-right text-sm text-gray-600">
                            <div>{formatDateTime(log.createdAt)}</div>
                            <div>Bởi: {log.createdBy}</div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Tổng số lượng:</span> {log.totalQuantity}
                          </div>
                          {log.name && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Phòng ban:</span> {log.name}
                            </div>
                          )}
                          {typeof log.isPay === 'boolean' && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Thanh toán:</span> 
                              <span className={`ml-1 ${log.isPay ? 'text-green-600' : 'text-red-600'}`}>
                                {log.isPay ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </span>
                      </div>
                          )}
                      {log.note && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Ghi chú:</span> {log.note}
                            </div>
                      )}
                        </div>

                        {/* Log Details */}
                        {log.logDetails && Array.isArray(log.logDetails) && log.logDetails.length > 0 && (
                          <div className="border-t pt-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Chi tiết vật tư:</div>
                            <div className="space-y-2">
                              {log.logDetails.map((detail: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                  <div className="flex-1">
                                    <div className="font-medium">{detail.materialName}</div>
                                    <div className="text-gray-600">Mã: {detail.materialCode}</div>
                                    {detail.expiryDate && (
                                      <div className="text-gray-600">Hết hạn: {detail.expiryDate}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{detail.quantity} {detail.materialType === 1 ? 'Hóa chất' : 'Vật tư'}</div>
                                    {detail.note && (
                                      <div className="text-xs text-gray-500">{detail.note}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                      )}
                    </div>
                  ))}

                    {logsTabData && typeof logsTabData.totalPages === 'number' && logsTabData.totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => setLogsPage(Math.max(0, logsPage - 1))} 
                          disabled={logsPage === 0 || loadingLogs}
                        >
                        Trước
                      </Button>
                        <span className="text-sm text-gray-600">
                          Trang {logsPage + 1} / {logsTabData.totalPages}
                        </span>
                        <Button 
                          variant="outline" 
                          onClick={() => setLogsPage(Math.min(logsTabData.totalPages - 1, logsPage + 1))} 
                          disabled={logsPage >= logsTabData.totalPages - 1 || loadingLogs}
                        >
                        Sau
                      </Button>
                    </div>
                  )}
                </div>
                </>
              )}
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
                      onChange={(e) => {
                        const newLogType = parseInt(e.target.value)
                        setLogForm({ 
                          ...logForm, 
                          logType: newLogType,
                          exportType: newLogType === 1 ? 2 : 1 // Auto set exportType
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={submitting}
                    >
                      <option value={1}>Nhập kho</option>
                      <option value={2}>Xuất kho</option>
                    </select>
                  </div>

                  <div>
                    <Label>{logForm.logType === 1 ? 'Nhà cung cấp' : 'Phòng ban'} *</Label>
                    <select
                      value={logForm.exportId}
                      onChange={(e) => setLogForm({ ...logForm, exportId: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={submitting}
                    >
                      <option value={0}>Chọn {logForm.logType === 1 ? 'nhà cung cấp' : 'phòng ban'}</option>
                      {(logForm.logType === 1 ? suppliers : departments).map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Auto set exportType by logType: import -> supplier (2), export -> department (1) */}

                <div>
                  <Label>Ghi chú</Label>
                  <Input
                    value={logForm.note}
                    onChange={(e) => setLogForm({ ...logForm, note: e.target.value })}
                    placeholder="Nhập ghi chú (tùy chọn)"
                    disabled={submitting}
                  />
                </div>

                {logForm.logType === 1 && (
                  <div>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={logForm.isPay || false}
                        onChange={(e) => setLogForm({ ...logForm, isPay: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span>Đã thanh toán</span>
                    </label>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Label className="text-lg font-semibold">Danh sách vật tư</Label>
                  <div className="space-y-2 mt-2">
                    {logForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border rounded">
                        <div>
                          <Label className="text-sm">Loại hàng hóa</Label>
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const newItems = [...logForm.items]
                              const newType = parseInt(e.target.value)
                              newItems[index].type = newType
                              newItems[index].materialId = 0 // Reset material selection
                              setLogForm({ ...logForm, items: newItems })
                              // Fetch materials for the new type
                              fetchMaterialsByType(newType)
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            disabled={submitting}
                          >
                            <option value={1}>Hóa chất</option>
                            <option value={2}>Vật tư</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm">Vật tư/Hóa chất</Label>
                          <div className="relative">
                            <select
                            value={item.materialId}
                            onChange={(e) => {
                              const newItems = [...logForm.items]
                              newItems[index].materialId = parseInt(e.target.value) || 0
                              setLogForm({ ...logForm, items: newItems })
                            }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              disabled={submitting || loadingMaterials[item.type]}
                              onFocus={() => fetchMaterialsByType(item.type)}
                            >
                              <option value={0}>
                                {loadingMaterials[item.type] ? 'Đang tải...' : 'Chọn vật tư/hóa chất'}
                              </option>
                              {materialsByType[item.type]?.map((material) => (
                                <option key={material.id} value={material.id}>
                                  {material.name} ({material.code})
                                </option>
                              ))}
                            </select>
                            {loadingMaterials[item.type] && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <Loader2 size={14} className="animate-spin text-gray-400" />
                              </div>
                            )}
                          </div>
                          {item.materialId > 0 && materialsByType[item.type] && (
                            <div className="mt-1 text-xs text-gray-600">
                              {(() => {
                                const selectedMaterial = materialsByType[item.type].find(m => m.id === item.materialId)
                                return selectedMaterial ? (
                                  <span>
                                    Đã chọn: <span className="font-medium">{selectedMaterial.name}</span>
                                    {selectedMaterial.description && (
                                      <span className="block text-gray-500">{selectedMaterial.description}</span>
                                    )}
                                  </span>
                                ) : null
                              })()}
                            </div>
                          )}
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
                        <div>
                          <Label className="text-sm">Ngày hết hạn</Label>
                          <Input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => {
                              const newItems = [...logForm.items]
                              newItems[index].expiryDate = e.target.value
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
                        const newItem = {
                            type: 1,
                            materialId: 0,
                            quantity: 0,
                            expiryDate: '',
                            unitPrice: 0,
                            amount: 0,
                            note: ''
                        }
                        setLogForm({
                          ...logForm,
                          items: [...logForm.items, newItem]
                        })
                        // Fetch materials for the default type (1 - Hóa chất)
                        fetchMaterialsByType(1)
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

      {/* Item Details Dialog */}
      {showItemDialog && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Chi tiết vật tư</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewLogs(selectedItem)}
                    title="Xem lịch sử giao dịch"
                  >
                    <History size={14} className="mr-1" />
                    Lịch sử
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowItemDialog(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg">{selectedItem.materialName}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Mã:</span>
                      <p className="font-medium">{selectedItem.code}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Material ID:</span>
                      <p className="font-medium">{selectedItem.materialId}</p>
                    </div>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-3">Thông tin tồn kho</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Số lượng hiện tại:</span>
                      <p className="font-bold text-2xl text-emerald-600">
                        {selectedItem.quantity}
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
                      <span className="text-gray-600">Ngày nhập:</span>
                      <p className="font-medium">{selectedItem.importDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ngày hết hạn:</span>
                      <p className="font-medium">{selectedItem.expiryDate}</p>
                    </div>
                  </div>
                </div>

                {/* Stock Transaction Form */}
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Dialog */}
      {showLogsDialog && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Lịch sử nhập xuất - {selectedItem.materialName}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowLogsDialog(false)
                      setShowItemDialog(true)
                    }}
                    title="Quay lại chi tiết vật tư"
                  >
                    <Eye size={14} className="mr-1" />
                    Chi tiết
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogsDialog(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {loadingItemLogs ? (
                  <div className="text-center py-8">
                    <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
                    <p className="mt-4 text-gray-500">Đang tải lịch sử...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {itemLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Chưa có giao dịch nào
                      </div>
                    ) : (
                      itemLogs.map(log => (
                      <div key={log.id} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            {log.logType === 1 ? (
                              <ArrowUpCircle size={16} className="text-green-600" />
                            ) : (
                              <ArrowDownCircle size={16} className="text-red-600" />
                            )}
                            <span className="font-medium text-lg">{log.logType === 1 ? 'Nhập kho' : 'Xuất kho'}</span>
                            <span className="text-sm text-gray-500">#{log.id}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right text-sm text-gray-600">
                              <div>{formatDateTime(log.createdAt)}</div>
                              <div>Bởi: {log.createdBy}</div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateLog(log)}
                                title="Cập nhật giao dịch"
                              >
                                <Save size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteLog(log)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Xóa giao dịch"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Tổng số lượng:</span> {log.totalQuantity}
                          </div>
                          {log.name && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Phòng ban:</span> {log.name}
                            </div>
                          )}
                          {typeof log.isPay === 'boolean' && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Thanh toán:</span> 
                              <span className={`ml-1 ${log.isPay ? 'text-green-600' : 'text-red-600'}`}>
                                {log.isPay ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </span>
                            </div>
                          )}
                          {log.note && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Ghi chú:</span> {log.note}
                            </div>
                          )}
                        </div>

                        {/* Log Details */}
                        {log.logDetails && Array.isArray(log.logDetails) && log.logDetails.length > 0 && (
                          <div className="border-t pt-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Chi tiết vật tư:</div>
                            <div className="space-y-2">
                              {log.logDetails.map((detail: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                  <div className="flex-1">
                                    <div className="font-medium">{detail.materialName}</div>
                                    <div className="text-gray-600">Mã: {detail.materialCode}</div>
                                    {detail.expiryDate && (
                                      <div className="text-gray-600">Hết hạn: {detail.expiryDate}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{detail.quantity} {detail.materialType === 1 ? 'Hóa chất' : 'Vật tư'}</div>
                                    {detail.note && (
                                      <div className="text-xs text-gray-500">{detail.note}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b">
              <CardTitle className="text-red-600">Xác nhận xóa</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p>Bạn có chắc chắn muốn xóa giao dịch <strong>#{itemToDelete.id}</strong>?</p>
                <p className="text-sm text-gray-600">
                  Loại: {itemToDelete.logType === 1 ? 'Nhập kho' : 'Xuất kho'}
                </p>
                <p className="text-sm text-gray-600">Hành động này không thể hoàn tác.</p>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false)
                      setItemToDelete(null)
                    }}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      'Xóa'
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