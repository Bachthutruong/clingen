import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Package, 
  Search, 
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  Calendar,
  // Truck,
  // ShoppingCart,
  // BarChart3,
  Edit,
  // Trash2,
  // RefreshCw,
  X,
  Save,
  FileText,
  Eye
} from 'lucide-react'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'

interface Supply {
  id: string
  code: string
  name: string
  category: 'reagent' | 'equipment' | 'consumable' | 'chemical'
  manufacturer: string
  supplier: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  expiryDate?: string
  lotNumber?: string
  storageLocation: string
  status: 'available' | 'low_stock' | 'out_of_stock' | 'expired' | 'expired_soon'
  lastRestockDate?: string
  notes?: string
}

interface StockTransaction {
  id: string
  supplyId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  performedBy: string
  performedAt: string
  notes?: string
}

const SupplyManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  console.log(isAddingNew)

  // Mock data cho vật tư
  const [supplies] = useState<Supply[]>([
    {
      id: 'S001',
      code: 'REA001',
      name: 'Glucose Reagent Kit',
      category: 'reagent',
      manufacturer: 'Roche Diagnostics',
      supplier: 'Y Khoa ABC',
      unit: 'Kit',
      currentStock: 25,
      minStock: 10,
      maxStock: 50,
      unitPrice: 2500000,
      expiryDate: '2024-06-15',
      lotNumber: 'GT240115',
      storageLocation: 'Tủ lạnh A2',
      status: 'available',
      lastRestockDate: '2024-01-15T10:00:00',
      notes: 'Bảo quản ở nhiệt độ 2-8°C'
    },
    {
      id: 'S002',
      code: 'REA002',
      name: 'CBC Reagent',
      category: 'reagent',
      manufacturer: 'Sysmex',
      supplier: 'Thiết bị Y tế XYZ',
      unit: 'Lọ',
      currentStock: 8,
      minStock: 15,
      maxStock: 40,
      unitPrice: 850000,
      expiryDate: '2024-03-20',
      lotNumber: 'CB240120',
      storageLocation: 'Tủ lạnh B1',
      status: 'low_stock',
      lastRestockDate: '2024-01-10T14:30:00',
      notes: 'Cần đặt hàng bổ sung'
    },
    {
      id: 'S003',
      code: 'EQU001',
      name: 'Ống nghiệm EDTA 5ml',
      category: 'consumable',
      manufacturer: 'Greiner Bio-One',
      supplier: 'Vật tư Lab 123',
      unit: 'Hộp',
      currentStock: 150,
      minStock: 50,
      maxStock: 300,
      unitPrice: 450000,
      storageLocation: 'Kho A - Kệ 3',
      status: 'available',
      lastRestockDate: '2024-01-20T09:15:00'
    },
    {
      id: 'S004',
      code: 'CHE001',
      name: 'Ethanol 70%',
      category: 'chemical',
      manufacturer: 'Merck',
      supplier: 'Hóa chất Sài Gòn',
      unit: 'Lít',
      currentStock: 0,
      minStock: 5,
      maxStock: 20,
      unitPrice: 120000,
      expiryDate: '2025-12-31',
      storageLocation: 'Tủ hóa chất',
      status: 'out_of_stock',
      notes: 'Hết hàng - cần đặt ngay'
    },
    {
      id: 'S005',
      code: 'REA003',
      name: 'Cholesterol Test Kit',
      category: 'reagent',
      manufacturer: 'Abbott',
      supplier: 'Y Khoa ABC',
      unit: 'Kit',
      currentStock: 12,
      minStock: 8,
      maxStock: 30,
      unitPrice: 1800000,
      expiryDate: '2024-02-28',
      lotNumber: 'CH240105',
      storageLocation: 'Tủ lạnh A1',
      status: 'expired_soon',
      lastRestockDate: '2023-12-05T11:20:00',
      notes: 'Sắp hết hạn - ưu tiên sử dụng'
    }
  ])

  // Mock data cho giao dịch kho
  const [transactions] = useState<StockTransaction[]>([
    {
      id: 'T001',
      supplyId: 'S001',
      type: 'in',
      quantity: 10,
      reason: 'Nhập hàng mới',
      performedBy: 'Nguyễn Văn A',
      performedAt: '2024-01-15T10:00:00',
      notes: 'Đơn hàng #DH001'
    },
    {
      id: 'T002',
      supplyId: 'S001',
      type: 'out',
      quantity: -5,
      reason: 'Sử dụng cho xét nghiệm',
      performedBy: 'Trần Thị B',
      performedAt: '2024-01-20T14:30:00'
    },
    {
      id: 'T003',
      supplyId: 'S002',
      type: 'out',
      quantity: -7,
      reason: 'Sử dụng cho CBC',
      performedBy: 'Lê Văn C',
      performedAt: '2024-01-22T09:15:00'
    }
  ])

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = 
      supply.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supply.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supply.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !categoryFilter || supply.category === categoryFilter
    const matchesStatus = !statusFilter || supply.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'expired_soon': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Có sẵn'
      case 'low_stock': return 'Sắp hết'
      case 'out_of_stock': return 'Hết hàng'
      case 'expired': return 'Hết hạn'
      case 'expired_soon': return 'Sắp hết hạn'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle size={14} />
      case 'low_stock': return <AlertTriangle size={14} />
      case 'out_of_stock': return <X size={14} />
      case 'expired': return <X size={14} />
      case 'expired_soon': return <Calendar size={14} />
      default: return <AlertTriangle size={14} />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'reagent': return 'Thuốc thử'
      case 'equipment': return 'Thiết bị'
      case 'consumable': return 'Vật tư tiêu hao'
      case 'chemical': return 'Hóa chất'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reagent': return 'bg-blue-100 text-blue-800'
      case 'equipment': return 'bg-purple-100 text-purple-800'
      case 'consumable': return 'bg-green-100 text-green-800'
      case 'chemical': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24))
    return daysDiff <= 30
  }

  const handleViewSupply = (supply: Supply) => {
    setSelectedSupply(supply)
    setIsEditing(false)
    setShowTransactions(false)
  }

  const handleEditSupply = () => {
    setIsEditing(true)
  }

  const handleSaveSupply = () => {
    alert('Lưu thông tin vật tư thành công!')
    setIsEditing(false)
  }

  const handleAddStock = (supply: Supply) => {
    const quantity = prompt(`Nhập số lượng ${supply.unit} cần thêm:`)
    if (quantity && !isNaN(Number(quantity))) {
      alert(`Thêm ${quantity} ${supply.unit} vào kho thành công!`)
    }
  }

  const handleRemoveStock = (supply: Supply) => {
    const quantity = prompt(`Nhập số lượng ${supply.unit} cần xuất:`)
    if (quantity && !isNaN(Number(quantity))) {
      alert(`Xuất ${quantity} ${supply.unit} từ kho thành công!`)
    }
  }

  const handleViewTransactions = (supply: Supply) => {
    setSelectedSupply(supply)
    setShowTransactions(true)
  }

  const stats = {
    total: supplies.length,
    available: supplies.filter(s => s.status === 'available').length,
    lowStock: supplies.filter(s => s.status === 'low_stock').length,
    outOfStock: supplies.filter(s => s.status === 'out_of_stock').length,
    expiringSoon: supplies.filter(s => s.expiryDate && isExpiringSoon(s.expiryDate)).length
  }

  const getSupplyTransactions = (supplyId: string) => {
    return transactions.filter(t => t.supplyId === supplyId)
  }

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
          <Button 
            onClick={() => setIsAddingNew(true)}
            className="bg-white text-orange-600 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm vật tư
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng số</p>
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
                <p className="text-xs text-gray-600">Có sẵn</p>
                <p className="text-lg font-bold text-green-600">{stats.available}</p>
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
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
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
              <X className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Sắp hết hạn</p>
                <p className="text-lg font-bold text-orange-600">{stats.expiringSoon}</p>
              </div>
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, mã, nhà sản xuất..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả danh mục</option>
              <option value="reagent">Thuốc thử</option>
              <option value="equipment">Thiết bị</option>
              <option value="consumable">Vật tư tiêu hao</option>
              <option value="chemical">Hóa chất</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="available">Có sẵn</option>
              <option value="low_stock">Sắp hết</option>
              <option value="out_of_stock">Hết hàng</option>
              <option value="expired_soon">Sắp hết hạn</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Supply List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Danh sách vật tư ({filteredSupplies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSupplies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy vật tư phù hợp
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredSupplies.map(supply => (
                  <Card key={supply.id} className="border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewSupply(supply)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{supply.name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getCategoryColor(supply.category)}`}>
                              {getCategoryLabel(supply.category)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Mã: {supply.code}</p>
                          <p className="text-sm text-gray-600">NSX: {supply.manufacturer}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(supply.status)}`}>
                          {getStatusIcon(supply.status)}
                          <span className="ml-1">{getStatusLabel(supply.status)}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Tồn kho:</p>
                          <p className={`font-bold ${supply.currentStock <= supply.minStock ? 'text-red-600' : 'text-green-600'}`}>
                            {supply.currentStock} {supply.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Min - Max:</p>
                          <p className="font-medium">{supply.minStock} - {supply.maxStock}</p>
                        </div>
                      </div>

                      {supply.expiryDate && (
                        <div className="mt-2 text-sm">
                          <p className={`${isExpiringSoon(supply.expiryDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            HSD: {formatDate(supply.expiryDate)}
                            {isExpiringSoon(supply.expiryDate) && ' (Sắp hết hạn)'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supply Details */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{showTransactions ? 'Lịch sử giao dịch' : 'Chi tiết vật tư'}</span>
              {selectedSupply && !showTransactions && (
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <>
                      <Button size="sm" variant="outline" onClick={handleEditSupply}>
                        <Edit size={14} className="mr-1" />
                        Sửa
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewTransactions(selectedSupply)}>
                        <FileText size={14} className="mr-1" />
                        Lịch sử
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={handleSaveSupply}>
                        <Save size={14} className="mr-1" />
                        Lưu
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        <X size={14} className="mr-1" />
                        Hủy
                      </Button>
                    </>
                  )}
                </div>
              )}
              {showTransactions && (
                <Button size="sm" variant="outline" onClick={() => setShowTransactions(false)}>
                  <Eye size={14} className="mr-1" />
                  Chi tiết
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSupply ? (
              showTransactions ? (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-semibold">{selectedSupply.name}</h3>
                    <p className="text-sm text-gray-600">Mã: {selectedSupply.code}</p>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getSupplyTransactions(selectedSupply.id).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Chưa có giao dịch nào
                      </div>
                    ) : (
                      getSupplyTransactions(selectedSupply.id).map(transaction => (
                        <div key={transaction.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                                transaction.type === 'in' ? 'bg-green-100 text-green-800' : 
                                transaction.type === 'out' ? 'bg-red-100 text-red-800' : 
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {transaction.type === 'in' ? 'Nhập' : transaction.type === 'out' ? 'Xuất' : 'Điều chỉnh'}
                              </span>
                              <p className="font-medium mt-1">
                                {transaction.type === 'in' ? '+' : ''}{transaction.quantity} {selectedSupply.unit}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-gray-600">{formatDateTime(transaction.performedAt)}</p>
                              <p className="font-medium">{transaction.performedBy}</p>
                            </div>
                          </div>
                          <p className="text-sm">{transaction.reason}</p>
                          {transaction.notes && (
                            <p className="text-xs text-gray-600 mt-1">{transaction.notes}</p>
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
                    <h3 className="font-semibold text-lg">{selectedSupply.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Mã vật tư:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedSupply.code} />
                        ) : (
                          <p className="font-medium">{selectedSupply.code}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Danh mục:</span>
                        <p className="font-medium">{getCategoryLabel(selectedSupply.category)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Nhà sản xuất:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedSupply.manufacturer} />
                        ) : (
                          <p className="font-medium">{selectedSupply.manufacturer}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Nhà cung cấp:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedSupply.supplier} />
                        ) : (
                          <p className="font-medium">{selectedSupply.supplier}</p>
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
                        <p className={`font-bold text-lg ${selectedSupply.currentStock <= selectedSupply.minStock ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedSupply.currentStock} {selectedSupply.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Đơn vị:</span>
                        <p className="font-medium">{selectedSupply.unit}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tồn kho tối thiểu:</span>
                        {isEditing ? (
                          <Input type="number" className="mt-1" defaultValue={selectedSupply.minStock} />
                        ) : (
                          <p className="font-medium">{selectedSupply.minStock} {selectedSupply.unit}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Tồn kho tối đa:</span>
                        {isEditing ? (
                          <Input type="number" className="mt-1" defaultValue={selectedSupply.maxStock} />
                        ) : (
                          <p className="font-medium">{selectedSupply.maxStock} {selectedSupply.unit}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Giá đơn vị:</span>
                        {isEditing ? (
                          <Input type="number" className="mt-1" defaultValue={selectedSupply.unitPrice} />
                        ) : (
                          <p className="font-medium">{formatCurrency(selectedSupply.unitPrice)}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Vị trí lưu trữ:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedSupply.storageLocation} />
                        ) : (
                          <p className="font-medium">{selectedSupply.storageLocation}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expiry Info */}
                  {selectedSupply.expiryDate && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold mb-3">Thông tin hạn sử dụng</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Hạn sử dụng:</span>
                          <p className={`font-medium ${isExpiringSoon(selectedSupply.expiryDate) ? 'text-red-600' : ''}`}>
                            {formatDate(selectedSupply.expiryDate)}
                          </p>
                        </div>
                        {selectedSupply.lotNumber && (
                          <div>
                            <span className="text-gray-600">Số lô:</span>
                            <p className="font-medium">{selectedSupply.lotNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedSupply.notes && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold mb-2">Ghi chú</h4>
                      {isEditing ? (
                        <textarea
                          className="w-full p-2 border rounded"
                          rows={3}
                          defaultValue={selectedSupply.notes}
                        />
                      ) : (
                        <p className="text-sm">{selectedSupply.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Last Restock */}
                  {selectedSupply.lastRestockDate && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold mb-2">Nhập kho gần nhất</h4>
                      <p className="text-sm">{formatDateTime(selectedSupply.lastRestockDate)}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {!isEditing && (
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={() => handleAddStock(selectedSupply)}
                        className="w-full"
                      >
                        <Plus size={16} className="mr-2" />
                        Nhập kho
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleRemoveStock(selectedSupply)}
                        className="w-full"
                      >
                        <Minus size={16} className="mr-2" />
                        Xuất kho
                      </Button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                Chọn một vật tư để xem chi tiết
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SupplyManagement 