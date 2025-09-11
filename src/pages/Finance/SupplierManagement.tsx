import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Building, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { supplierApi } from '@/services'
import type { SupplierDTO, SupplierSearchDTO } from '@/types/api'

// Using SupplierDTO from API types
interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  orderDate: string
  expectedDate: string
  status: 'draft' | 'sent' | 'confirmed' | 'delivered' | 'cancelled'
  totalAmount: number
  paidAmount: number
  items: OrderItem[]
  notes?: string
}

interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

const SupplierManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDTO | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // API state
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([])
  const [editingSupplier, setEditingSupplier] = useState<Partial<SupplierDTO>>({})

  // Mock data cho đơn hàng (keeping for now as there's no order API)
  const [purchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 'PO001',
      orderNumber: 'DH-2024-0001',
      supplierId: '1',
      orderDate: '2024-01-20T10:30:00',
      expectedDate: '2024-01-25T00:00:00',
      status: 'delivered',
      totalAmount: 125000000,
      paidAmount: 125000000,
      items: [
        {
          id: 'OI001',
          productName: 'Glucose Reagent Kit',
          quantity: 50,
          unitPrice: 2500000,
          total: 125000000
        }
      ],
      notes: 'Giao hàng đúng hạn'
    }
  ])

  // API Functions
  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchParams: SupplierSearchDTO = {
        keyword: searchQuery || undefined,
        status: statusFilter ? parseInt(statusFilter) : undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        isDesc: true
      }
      
      console.log('Calling supplierApi.search with params:', searchParams)
      const response = await supplierApi.search(searchParams)
      console.log('API Response:', response)
      
      // Handle nested data structure: response.data.data
      if (response.status && response.data && response.data.content && Array.isArray(response.data.content)) {
        setSuppliers(response.data.content)
        setTotalElements(response.data.totalElements || 0)
        setTotalPages(response.data.totalPages || 0)
        console.log('✅ Loaded', response.data.content.length, 'suppliers')
      } else {
        setSuppliers([])
        setTotalElements(0)
        setTotalPages(0)
        console.log('📭 No suppliers found')
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setError('Không thể tải danh sách nhà cung cấp. Vui lòng thử lại.')
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSupplier = async () => {
    try {
      if (!editingSupplier.name) {
        toast.error('Vui lòng nhập tên nhà cung cấp')
        return
      }

      const supplierData = {
        name: editingSupplier.name,
        description: editingSupplier.description || '',
        status: editingSupplier.status !== undefined ? editingSupplier.status : 1
      }

      console.log('Creating supplier with data:', supplierData)
      console.log('editingSupplier.status:', editingSupplier.status, 'Type:', typeof editingSupplier.status)
      
      const response = await supplierApi.create(supplierData)
      if (response.status) {
        toast.success('Tạo nhà cung cấp thành công!')
        setIsAddingNew(false)
        setEditingSupplier({})
        await fetchSuppliers()
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi tạo nhà cung cấp')
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
      toast.error('Có lỗi xảy ra khi tạo nhà cung cấp')
    }
  }

  const handleUpdateSupplier = async () => {
    try {
      if (!selectedSupplier || !editingSupplier.name) {
        toast.error('Vui lòng nhập tên nhà cung cấp')
        return
      }

      const supplierData = {
        name: editingSupplier.name,
        description: editingSupplier.description || '',
        status: editingSupplier.status !== undefined ? editingSupplier.status : 1
      }

      console.log('Updating supplier with data:', supplierData)
      console.log('editingSupplier.status:', editingSupplier.status, 'Type:', typeof editingSupplier.status)
      
      const response = await supplierApi.update(selectedSupplier.id, supplierData)
      if (response.status) {
        toast.success('Cập nhật nhà cung cấp thành công!')
        setIsEditing(false)
        setEditingSupplier({})
        await fetchSuppliers()
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi cập nhật nhà cung cấp')
      }
    } catch (error) {
      console.error('Error updating supplier:', error)
      toast.error('Có lỗi xảy ra khi cập nhật nhà cung cấp')
    }
  }

  const handleDeleteSupplier = async (supplier: SupplierDTO) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp ${supplier.name}?`)) {
      try {
        const response = await supplierApi.delete(supplier.id)
        if (response.status) {
          toast.success('Xóa nhà cung cấp thành công!')
          await fetchSuppliers()
        } else {
          toast.error(response.message || 'Có lỗi xảy ra khi xóa nhà cung cấp')
        }
      } catch (error) {
        console.error('Error deleting supplier:', error)
        toast.error('Có lỗi xảy ra khi xóa nhà cung cấp')
      }
    }
  }

  // Effects
  useEffect(() => {
    fetchSuppliers()
  }, [currentPage, pageSize, searchQuery, statusFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, statusFilter, pageSize])

  // Client-side filtering removed - using server-side search and filtering

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-100 text-green-800'
      case 0: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1: return 'Hoạt động'
      case 0: return 'Không hoạt động'
      default: return 'Không xác định'
    }
  }


  const handleViewSupplier = (supplier: SupplierDTO) => {
    setSelectedSupplier(supplier)
    setEditingSupplier({
      ...supplier,
      status: supplier.status || 1 // Ensure status is set
    })
    setIsEditing(false)
    setShowOrders(false)
    setShowDetailDialog(true)
  }

  const handleEditSupplier = () => {
    console.log('Editing supplier:', selectedSupplier)
    console.log('Current editingSupplier:', editingSupplier)
    setIsEditing(true)
  }

  const handleSaveSupplier = () => {
    if (isAddingNew) {
      handleCreateSupplier()
    } else {
      handleUpdateSupplier()
    }
  }

  const handleViewOrders = (supplier: SupplierDTO) => {
    setSelectedSupplier(supplier)
    setShowOrders(true)
    setShowDetailDialog(true)
  }

  const handleCreateOrder = (supplier: SupplierDTO) => {
    toast(`Tạo đơn hàng mới cho ${supplier.name}`)
  }

  const handleAddNew = () => {
    setEditingSupplier({
      name: '',
      description: '',
      status: 1 // Default to active
    })
    setIsAddingNew(true)
    setShowDetailDialog(true)
  }

  const stats = {
    total: totalElements,
    active: Array.isArray(suppliers) ? suppliers?.filter(s => s.status === 1).length : 0,
    inactive: Array.isArray(suppliers) ? suppliers?.filter(s => s.status === 0).length : 0,
    suspended: 0, // Not available in API
    totalValue: 0, // Not available in API
    totalDebt: 0 // Not available in API
  }

  const getSupplierOrders = (supplierId: number) => {
    return purchaseOrders.filter(order => order.supplierId === supplierId.toString())
  }


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý nhà cung cấp</h1>
              <p className="text-slate-100">Quản lý thông tin và giao dịch với nhà cung cấp</p>
            </div>
          </div>
          <Button 
            onClick={handleAddNew}
            className="bg-white text-slate-600 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm NCC
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng số NCC</p>
                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              </div>
              <Building className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Hoạt động</p>
                <p className="text-lg font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Không HĐ</p>
                <p className="text-lg font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tạm ngưng</p>
                <p className="text-lg font-bold text-red-600">{stats.suspended}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 md:col-span-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng giao dịch</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                placeholder="Tìm theo tên nhà cung cấp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="1">Hoạt động</option>
                <option value="0">Không hoạt động</option>
            </select>

            <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
            </select>

              <Button onClick={fetchSuppliers} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle size={20} />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchSuppliers}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier List - Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách nhà cung cấp ({totalElements} NCC)</span>
            <div className="flex items-center space-x-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              <Button size="sm" onClick={fetchSuppliers} disabled={loading}>
                <RefreshCw size={14} className="mr-1" />
                Làm mới
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (!Array.isArray(suppliers) || suppliers.length === 0) ? (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : !Array.isArray(suppliers) || suppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy nhà cung cấp phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Tên NCC</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Mô tả</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Ngày tạo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(suppliers) && suppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">#{supplier.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{supplier.name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {supplier.description || 'Không có mô tả'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(supplier.status)}`}>
                          {supplier.stringStatus || getStatusLabel(supplier.status)}
                          </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {supplier.createdAt || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSupplier(supplier)}
                            className="text-xs"
                          >
                            <Eye size={12} className="mr-1" />
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrders(supplier)}
                            className="text-xs"
                          >
                            <ShoppingCart size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSupplier(supplier)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={12} />
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

      {/* Pagination - Server-side pagination */}
      {totalPages > 1 && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Hiển thị {totalElements > 0 ? currentPage * pageSize + 1 : 0} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} nhà cung cấp
              </div>
              
              {/* Pagination Controls */}
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
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 5
                    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1)
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(0, endPage - maxVisiblePages + 1)
                    }
                    
                    // First page
                    if (startPage > 0) {
                      pages.push(
                        <Button
                          key={0}
                          variant={currentPage === 0 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(0)}
                          disabled={loading}
                        >
                          1
                        </Button>
                      )
                      if (startPage > 1) {
                        pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>)
                      }
                    }
                    
                    // Page numbers
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          disabled={loading}
                        >
                          {i + 1}
                        </Button>
                      )
                    }
                    
                    // Last page
                    if (endPage < totalPages - 1) {
                      if (endPage < totalPages - 2) {
                        pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>)
                      }
                      pages.push(
                        <Button
                          key={totalPages - 1}
                          variant={currentPage === totalPages - 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages - 1)}
                          disabled={loading}
                        >
                          {totalPages}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && (selectedSupplier || isAddingNew) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {showOrders ? 'Đơn hàng' : (isAddingNew ? 'Thêm nhà cung cấp mới' : 'Chi tiết nhà cung cấp')}
                </h2>
                <div className="flex items-center space-x-2">
                  {!showOrders ? (
                    <>
                      {!isEditing && !isAddingNew ? (
                        <>
                          <Button size="sm" variant="outline" onClick={handleEditSupplier}>
                            <Edit size={14} className="mr-1" />
                            Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewOrders(selectedSupplier!)}>
                            <ShoppingCart size={14} className="mr-1" />
                            Đơn hàng
                          </Button>
                          <Button size="sm" onClick={() => handleCreateOrder(selectedSupplier!)}>
                            <Plus size={14} className="mr-1" />
                            Tạo đơn
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={handleSaveSupplier}>
                            <CheckCircle size={14} className="mr-1" />
                            {isAddingNew ? 'Tạo' : 'Lưu'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setIsEditing(false)
                            setIsAddingNew(false)
                            setEditingSupplier({
                              name: '',
                              description: '',
                              status: 1
                            })
                          }}>
                            Hủy
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setShowOrders(false)}>
                        <Eye size={14} className="mr-1" />
                        Chi tiết NCC
                      </Button>
                      <Button size="sm" onClick={() => handleCreateOrder(selectedSupplier!)}>
                        <Plus size={14} className="mr-1" />
                        Tạo đơn
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowDetailDialog(false)
                    setIsEditing(false)
                    setIsAddingNew(false)
                    setEditingSupplier({
                      name: '',
                      description: '',
                      status: 1
                    })
                  }}>
                    <X size={14} />
                  </Button>
                </div>
              </div>

              {showOrders && selectedSupplier ? (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-semibold">{selectedSupplier.name}</h3>
                    <p className="text-sm text-gray-600">Đơn hàng của nhà cung cấp</p>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getSupplierOrders(selectedSupplier.id).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Chưa có đơn hàng nào
                      </div>
                    ) : (
                      getSupplierOrders(selectedSupplier.id).map(order => (
                        <div key={order.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">
                                Ngày đặt: {formatDate(order.orderDate)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Dự kiến: {formatDate(order.expectedDate)}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'sent' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'delivered' ? 'Đã giao' :
                               order.status === 'confirmed' ? 'Đã xác nhận' :
                               order.status === 'sent' ? 'Đã gửi' :
                               order.status === 'draft' ? 'Bản thảo' : 'Đã hủy'}
                            </span>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">Tổng tiền: {formatCurrency(order.totalAmount)}</p>
                            <p>Đã thanh toán: {formatCurrency(order.paidAmount)}</p>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-600">Sản phẩm:</p>
                            {order.items.map(item => (
                              <p key={item.id} className="text-xs text-gray-600">
                                • {item.productName} (SL: {item.quantity})
                              </p>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg">
                      {isAddingNew ? 'Thông tin nhà cung cấp mới' : selectedSupplier?.name}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Tên nhà cung cấp *:</span>
                        {(isEditing || isAddingNew) ? (
                          <Input 
                            className="mt-1" 
                            value={editingSupplier.name || ''}
                            onChange={(e) => setEditingSupplier({...editingSupplier, name: e.target.value})}
                            placeholder="Nhập tên nhà cung cấp"
                          />
                        ) : (
                          <p className="font-medium">{selectedSupplier?.name}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Mô tả:</span>
                        {(isEditing || isAddingNew) ? (
                          <textarea 
                            className="mt-1 w-full p-2 border rounded" 
                            rows={3}
                            value={editingSupplier.description || ''}
                            onChange={(e) => setEditingSupplier({...editingSupplier, description: e.target.value})}
                            placeholder="Nhập mô tả nhà cung cấp"
                          />
                        ) : (
                          <p className="font-medium">{selectedSupplier?.description || 'Không có mô tả'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Trạng thái:</span>
                        {(isEditing || isAddingNew) ? (
                          <select 
                            className="mt-1 px-3 py-2 border border-gray-300 rounded-md"
                            value={editingSupplier.status ?? 1}
                            onChange={(e) => {
                              const newStatus = parseInt(e.target.value)
                              console.log('Status changed to:', newStatus, 'Type:', typeof newStatus)
                              setEditingSupplier({...editingSupplier, status: newStatus})
                            }}
                          >
                            <option value={1}>Hoạt động</option>
                            <option value={0}>Không hoạt động</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(selectedSupplier?.status || 0)}`}>
                            {getStatusLabel(selectedSupplier?.status || 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ID Info for existing suppliers */}
                  {!isAddingNew && selectedSupplier && (
                  <div className="border-b pb-4">
                      <h4 className="font-semibold mb-3">Thông tin hệ thống</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                          <span className="text-gray-600">ID:</span>
                          <p className="font-medium">#{selectedSupplier.id}</p>
                      </div>
                      <div>
                          <span className="text-gray-600">Ngày tạo:</span>
                          <p className="font-medium">{selectedSupplier.createdAt || 'N/A'}</p>
                      </div>
                      <div>
                          <span className="text-gray-600">Người tạo:</span>
                          <p className="font-medium">{selectedSupplier.createdBy || 'N/A'}</p>
                      </div>
                      <div>
                          <span className="text-gray-600">Cập nhật lần cuối:</span>
                          <p className="font-medium">{selectedSupplier.updatedAt || 'N/A'}</p>
                      </div>
                      <div>
                          <span className="text-gray-600">Người cập nhật:</span>
                          <p className="font-medium">{selectedSupplier.updatedBy || 'N/A'}</p>
                      </div>
                      </div>
                    </div>
                      )}
                    </div>
                  )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierManagement 