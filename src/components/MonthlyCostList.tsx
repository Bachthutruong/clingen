import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Calendar,
  DollarSign,
  Building,
  Receipt,
  RefreshCw,
  Download,
  // Eye
} from 'lucide-react'
import { monthlyCostsApi } from '@/services'
import type { MonthlyCost, MonthlyCostSearchParams } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MonthlyCostForm } from './MonthlyCostForm'

interface MonthlyCostListProps {
  month?: number
  year?: number
  onCostUpdate?: () => void
}

export const MonthlyCostList: React.FC<MonthlyCostListProps> = ({
  month,
  year,
  onCostUpdate
}) => {
  const [costs, setCosts] = useState<MonthlyCost[]>([])
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState<MonthlyCostSearchParams>({
    month: month || new Date().getMonth() + 1,
    year: year || new Date().getFullYear(),
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  })
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 20
  })
  const [selectedCosts, setSelectedCosts] = useState<number[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCost, setEditingCost] = useState<MonthlyCost | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isPaid: '',
    isRecurring: ''
  })

  // Load costs
  const loadCosts = async (params: MonthlyCostSearchParams = searchParams) => {
    setLoading(true)
    try {
      const response = await monthlyCostsApi.search(params)
      setCosts(response.content || [])
      setPagination({
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.number || 0,
        size: response.size || 20
      })
    } catch (error) {
      console.error('Error loading monthly costs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCosts()
  }, [month, year])

  // Handle search
  const handleSearch = () => {
    const newParams = {
      ...searchParams,
      costName: filters.search || undefined,
      category: filters.category ? parseInt(filters.category) : undefined,
      isPaid: filters.isPaid ? filters.isPaid === 'true' : undefined,
      isRecurring: filters.isRecurring ? filters.isRecurring === 'true' : undefined,
      page: 0
    }
    setSearchParams(newParams)
    loadCosts(newParams)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newParams = { ...searchParams, page }
    setSearchParams(newParams)
    loadCosts(newParams)
  }

  // Mark as paid/unpaid
  const togglePaymentStatus = async (id: number, isPaid: boolean) => {
    try {
      if (isPaid) {
        await monthlyCostsApi.markUnpaid(id)
      } else {
        await monthlyCostsApi.markPaid(id)
      }
      loadCosts()
      onCostUpdate?.()
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  // Delete cost
  const deleteCost = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
      try {
        await monthlyCostsApi.delete(id)
        loadCosts()
        onCostUpdate?.()
      } catch (error) {
        console.error('Error deleting cost:', error)
      }
    }
  }

  // Bulk operations
  const markMultiplePaid = async () => {
    if (selectedCosts.length === 0) return
    
    try {
      await monthlyCostsApi.markMultiplePaid(selectedCosts)
      setSelectedCosts([])
      loadCosts()
      onCostUpdate?.()
    } catch (error) {
      console.error('Error marking multiple as paid:', error)
    }
  }

  const deleteMultiple = async () => {
    if (selectedCosts.length === 0) return
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCosts.length} chi phí đã chọn?`)) {
      try {
        await monthlyCostsApi.deleteBulk(selectedCosts)
        setSelectedCosts([])
        loadCosts()
        onCostUpdate?.()
      } catch (error) {
        console.error('Error deleting multiple costs:', error)
      }
    }
  }

  // Toggle selection
  const toggleSelection = (id: number) => {
    setSelectedCosts(prev => 
      prev.includes(id) 
        ? prev.filter(costId => costId !== id)
        : [...prev, id]
    )
  }

  // Select all
  // const selectAll = () => {
  //   if (selectedCosts.length === costs.length) {
  //     setSelectedCosts([])
  //   } else {
  //     setSelectedCosts(costs.map(cost => cost.id))
  //   }
  // }

  // Handle form save
  const handleFormSave = () => {
    loadCosts()
    onCostUpdate?.()
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  // Get category name
  const getCategoryName = (category: number): string => {
    const categories: Record<number, string> = {
      1: 'Thuê phòng',
      2: 'Hóa chất',
      3: 'Vật tư tiêu hao',
      4: 'Lương nhân viên',
      5: 'Chi phí quản lý',
      6: 'Thiết bị',
      7: 'Bảo trì',
      8: 'Tiện ích',
      9: 'Marketing',
      10: 'Bảo hiểm',
      11: 'Đào tạo',
      12: 'Khác'
    }
    return categories[category] || 'Không xác định'
  }

  // Get status color
  const getStatusColor = (isPaid: boolean, isOverdue: boolean): string => {
    if (isPaid) return 'text-green-600 bg-green-100'
    if (isOverdue) return 'text-red-600 bg-red-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  // Get status text
  const getStatusText = (isPaid: boolean, isOverdue: boolean): string => {
    if (isPaid) return 'Đã thanh toán'
    if (isOverdue) return 'Quá hạn'
    return 'Chưa thanh toán'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý chi phí hàng tháng</h2>
          <p className="text-gray-600">
            Tháng {searchParams.month}/{searchParams.year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadCosts()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Export to Excel
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm chi phí
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm tên chi phí..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tất cả loại</option>
            <option value="1">Thuê phòng</option>
            <option value="2">Hóa chất</option>
            <option value="3">Vật tư tiêu hao</option>
            <option value="4">Lương nhân viên</option>
            <option value="5">Chi phí quản lý</option>
            <option value="6">Thiết bị</option>
            <option value="7">Bảo trì</option>
            <option value="8">Tiện ích</option>
            <option value="9">Marketing</option>
            <option value="10">Bảo hiểm</option>
            <option value="11">Đào tạo</option>
            <option value="12">Khác</option>
          </select>
          
          <select
            value={filters.isPaid}
            onChange={(e) => setFilters(prev => ({ ...prev, isPaid: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="false">Chưa thanh toán</option>
            <option value="true">Đã thanh toán</option>
          </select>
          
          <Button onClick={handleSearch} className="w-full">
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </Button>
        </div>
      </Card>

      {/* Actions */}
      {selectedCosts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedCosts.length} chi phí đã chọn
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markMultiplePaid}
              >
                <Check className="h-4 w-4 mr-1" />
                Đánh dấu đã thanh toán
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteMultiple}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Costs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : costs.length === 0 ? (
          <Card className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không có chi phí nào</p>
          </Card>
        ) : (
          costs.map((cost) => (
            <Card key={cost.id} className="p-4">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedCosts.includes(cost.id)}
                  onChange={() => toggleSelection(cost.id)}
                  className="mt-1 rounded"
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-lg">{cost.costName}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(cost.isPaid, cost.isOverdue)}`}>
                        {getStatusText(cost.isPaid, cost.isOverdue)}
                      </span>
                      {cost.isRecurring && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                          Định kỳ
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(cost.amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{getCategoryName(cost.category)}</span>
                    </div>
                    
                    {cost.vendorName && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{cost.vendorName}</span>
                      </div>
                    )}
                    
                    {cost.invoiceNumber && (
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        <span>{cost.invoiceNumber}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Đến hạn: {formatDate(cost.dueDate)}</span>
                    </div>
                    
                    {cost.paymentDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Thanh toán: {formatDate(cost.paymentDate)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span>Tạo bởi: {cost.createdBy}</span>
                    </div>
                  </div>
                  
                  {cost.description && (
                    <p className="text-sm text-gray-600 mt-2">{cost.description}</p>
                  )}
                  
                  {cost.notes && (
                    <p className="text-sm text-gray-500 mt-1 italic">{cost.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePaymentStatus(cost.id, cost.isPaid)}
                  >
                    {cost.isPaid ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCost(cost)
                      setShowForm(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCost(cost.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 0}
          >
            Trước
          </Button>
          
          <span className="text-sm text-gray-600">
            Trang {pagination.currentPage + 1} / {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages - 1}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <MonthlyCostForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingCost(null)
        }}
        onSave={handleFormSave}
        cost={editingCost}
        month={searchParams.month}
        year={searchParams.year}
      />
    </div>
  )
}
