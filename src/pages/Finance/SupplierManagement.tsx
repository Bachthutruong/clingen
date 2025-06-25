import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Building, 
  Search, 
  Plus,
  Edit,
//   Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
//   CreditCard,
//   Calendar,
  DollarSign,
  ShoppingCart,
//   FileText,
  User,
  Star,
  CheckCircle,
  AlertTriangle,
  Clock,
//   RefreshCw,
//   Filter
} from 'lucide-react'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'

interface Supplier {
  id: string
  code: string
  name: string
  category: 'medical_supplies' | 'equipment' | 'chemicals' | 'services' | 'other'
  contactPerson: string
  phone: string
  email: string
  address: string
  taxId: string
  website?: string
  paymentTerms: string
  creditLimit: number
  currentDebt: number
  rating: number
  status: 'active' | 'inactive' | 'suspended'
  contractStart?: string
  contractEnd?: string
  lastOrderDate?: string
  totalOrders: number
  totalValue: number
  notes?: string
  createdAt: string
  updatedAt: string
}

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
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  console.log(isAddingNew)
  const [showOrders, setShowOrders] = useState(false)

  // Mock data cho nhà cung cấp
  const [suppliers] = useState<Supplier[]>([
    {
      id: 'SUP001',
      code: 'NCC001',
      name: 'Công ty Y khoa ABC',
      category: 'medical_supplies',
      contactPerson: 'Nguyễn Văn An',
      phone: '0123456789',
      email: 'contact@ykhoa-abc.com',
      address: '123 Đường Lê Lợi, Q1, TP.HCM',
      taxId: '0123456789',
      website: 'https://ykhoa-abc.com',
      paymentTerms: '30 ngày',
      creditLimit: 500000000,
      currentDebt: 125000000,
      rating: 4.8,
      status: 'active',
      contractStart: '2024-01-01',
      contractEnd: '2024-12-31',
      lastOrderDate: '2024-01-20T10:30:00',
      totalOrders: 24,
      totalValue: 2450000000,
      notes: 'Nhà cung cấp chính cho thuốc thử và vật tư y tế',
      createdAt: '2023-01-15T09:00:00',
      updatedAt: '2024-01-20T10:30:00'
    },
    {
      id: 'SUP002',
      code: 'NCC002',
      name: 'Thiết bị Y tế XYZ',
      category: 'equipment',
      contactPerson: 'Trần Thị Bình',
      phone: '0987654321',
      email: 'sales@tbyt-xyz.com',
      address: '456 Đường Nguyễn Huệ, Q3, TP.HCM',
      taxId: '0987654321',
      paymentTerms: '45 ngày',
      creditLimit: 800000000,
      currentDebt: 0,
      rating: 4.5,
      status: 'active',
      contractStart: '2023-06-01',
      contractEnd: '2025-06-01',
      lastOrderDate: '2024-01-15T14:20:00',
      totalOrders: 12,
      totalValue: 1850000000,
      notes: 'Chuyên cung cấp thiết bị xét nghiệm',
      createdAt: '2023-05-20T11:30:00',
      updatedAt: '2024-01-15T14:20:00'
    },
    {
      id: 'SUP003',
      code: 'NCC003',
      name: 'Hóa chất Sài Gòn',
      category: 'chemicals',
      contactPerson: 'Lê Văn Cường',
      phone: '0912345678',
      email: 'info@hoachat-sg.com',
      address: '789 Đường Điện Biên Phủ, Q10, TP.HCM',
      taxId: '0912345678',
      paymentTerms: '15 ngày',
      creditLimit: 200000000,
      currentDebt: 45000000,
      rating: 4.2,
      status: 'active',
      lastOrderDate: '2024-01-18T09:45:00',
      totalOrders: 18,
      totalValue: 890000000,
      createdAt: '2023-03-10T08:15:00',
      updatedAt: '2024-01-18T09:45:00'
    },
    {
      id: 'SUP004',
      code: 'NCC004',
      name: 'Dịch vụ Bảo trì DEF',
      category: 'services',
      contactPerson: 'Phạm Thị Dung',
      phone: '0976543210',
      email: 'support@baotri-def.com',
      address: '321 Đường Cách Mạng Tháng 8, Q3, TP.HCM',
      taxId: '0976543210',
      paymentTerms: '7 ngày',
      creditLimit: 100000000,
      currentDebt: 15000000,
      rating: 4.0,
      status: 'active',
      lastOrderDate: '2024-01-10T16:00:00',
      totalOrders: 36,
      totalValue: 540000000,
      notes: 'Bảo trì thiết bị định kỳ',
      createdAt: '2023-02-05T10:00:00',
      updatedAt: '2024-01-10T16:00:00'
    },
    {
      id: 'SUP005',
      code: 'NCC005',
      name: 'Văn phòng phẩm GHI',
      category: 'other',
      contactPerson: 'Hoàng Văn Em',
      phone: '0934567890',
      email: 'order@vpp-ghi.com',
      address: '654 Đường Võ Văn Tần, Q1, TP.HCM',
      taxId: '0934567890',
      paymentTerms: '30 ngày',
      creditLimit: 50000000,
      currentDebt: 8000000,
      rating: 3.8,
      status: 'inactive',
      lastOrderDate: '2023-12-20T11:30:00',
      totalOrders: 8,
      totalValue: 120000000,
      createdAt: '2023-01-01T00:00:00',
      updatedAt: '2023-12-20T11:30:00'
    }
  ])

  // Mock data cho đơn hàng
  const [purchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 'PO001',
      orderNumber: 'DH-2024-0001',
      supplierId: 'SUP001',
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
    },
    {
      id: 'PO002',
      orderNumber: 'DH-2024-0002',
      supplierId: 'SUP002',
      orderDate: '2024-01-15T14:20:00',
      expectedDate: '2024-01-30T00:00:00',
      status: 'confirmed',
      totalAmount: 450000000,
      paidAmount: 0,
      items: [
        {
          id: 'OI002',
          productName: 'Máy xét nghiệm tự động',
          quantity: 1,
          unitPrice: 450000000,
          total: 450000000
        }
      ]
    }
  ])

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone.includes(searchQuery)

    const matchesCategory = !categoryFilter || supplier.category === categoryFilter
    const matchesStatus = !statusFilter || supplier.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medical_supplies': return 'Vật tư y tế'
      case 'equipment': return 'Thiết bị'
      case 'chemicals': return 'Hóa chất'
      case 'services': return 'Dịch vụ'
      case 'other': return 'Khác'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical_supplies': return 'bg-blue-100 text-blue-800'
      case 'equipment': return 'bg-purple-100 text-purple-800'
      case 'chemicals': return 'bg-orange-100 text-orange-800'
      case 'services': return 'bg-green-100 text-green-800'
      case 'other': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động'
      case 'inactive': return 'Không hoạt động'
      case 'suspended': return 'Tạm ngưng'
      default: return status
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-yellow-600'
    if (rating >= 3.5) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsEditing(false)
    setShowOrders(false)
  }

  const handleEditSupplier = () => {
    setIsEditing(true)
  }

  const handleSaveSupplier = () => {
    alert('Lưu thông tin nhà cung cấp thành công!')
    setIsEditing(false)
  }

//   const handleDeleteSupplier = (supplier: Supplier) => {
//     if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp ${supplier.name}?`)) {
//       alert(`Xóa nhà cung cấp ${supplier.name} thành công!`)
//     }
//   }

  const handleViewOrders = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowOrders(true)
  }

  const handleCreateOrder = (supplier: Supplier) => {
    alert(`Tạo đơn hàng mới cho ${supplier.name}`)
  }

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    inactive: suppliers.filter(s => s.status === 'inactive').length,
    suspended: suppliers.filter(s => s.status === 'suspended').length,
    totalValue: suppliers.reduce((sum, s) => sum + s.totalValue, 0),
    totalDebt: suppliers.reduce((sum, s) => sum + s.currentDebt, 0)
  }

  const getSupplierOrders = (supplierId: string) => {
    return purchaseOrders.filter(order => order.supplierId === supplierId)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ))
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
            onClick={() => setIsAddingNew(true)}
            className="bg-white text-slate-600 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm NCC
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng số NCC</p>
                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              </div>
              <Building className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Hoạt động</p>
                <p className="text-lg font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Không HĐ</p>
                <p className="text-lg font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tạm ngưng</p>
                <p className="text-lg font-bold text-red-600">{stats.suspended}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng giao dịch</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
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
                  placeholder="Tìm theo tên, mã, người liên hệ, SĐT..."
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
              <option value="medical_supplies">Vật tư y tế</option>
              <option value="equipment">Thiết bị</option>
              <option value="chemicals">Hóa chất</option>
              <option value="services">Dịch vụ</option>
              <option value="other">Khác</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Tạm ngưng</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Supplier List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Danh sách nhà cung cấp ({filteredSuppliers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy nhà cung cấp phù hợp
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredSuppliers.map(supplier => (
                  <Card key={supplier.id} className="border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewSupplier(supplier)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{supplier.name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getCategoryColor(supplier.category)}`}>
                              {getCategoryLabel(supplier.category)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Mã: {supplier.code}</p>
                          <p className="text-sm text-gray-600">LH: {supplier.contactPerson}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(supplier.status)}`}>
                          {getStatusLabel(supplier.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Tổng giao dịch:</p>
                          <p className="font-bold text-green-600">{formatCurrency(supplier.totalValue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Đánh giá:</p>
                          <div className="flex items-center space-x-1">
                            {renderStars(supplier.rating)}
                            <span className={`font-medium ${getRatingColor(supplier.rating)}`}>
                              {supplier.rating}
                            </span>
                          </div>
                        </div>
                      </div>

                      {supplier.currentDebt > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600">
                            Công nợ: {formatCurrency(supplier.currentDebt)}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          <p>Đơn hàng gần nhất: {supplier.lastOrderDate ? formatDate(supplier.lastOrderDate) : 'Chưa có'}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation()
                            handleViewOrders(supplier)
                          }}>
                            <ShoppingCart size={12} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation()
                            handleEditSupplier()
                            setSelectedSupplier(supplier)
                          }}>
                            <Edit size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Details */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{showOrders ? 'Đơn hàng' : 'Chi tiết nhà cung cấp'}</span>
              {selectedSupplier && (
                <div className="flex space-x-2">
                  {!showOrders ? (
                    <>
                      {!isEditing ? (
                        <>
                          <Button size="sm" variant="outline" onClick={handleEditSupplier}>
                            <Edit size={14} className="mr-1" />
                            Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleViewOrders(selectedSupplier)}>
                            <ShoppingCart size={14} className="mr-1" />
                            Đơn hàng
                          </Button>
                          <Button size="sm" onClick={() => handleCreateOrder(selectedSupplier)}>
                            <Plus size={14} className="mr-1" />
                            Tạo đơn
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={handleSaveSupplier}>
                            <CheckCircle size={14} className="mr-1" />
                            Lưu
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
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
                      <Button size="sm" onClick={() => handleCreateOrder(selectedSupplier)}>
                        <Plus size={14} className="mr-1" />
                        Tạo đơn
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSupplier ? (
              showOrders ? (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-semibold">{selectedSupplier.name}</h3>
                    <p className="text-sm text-gray-600">Tổng số đơn hàng: {selectedSupplier.totalOrders}</p>
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
                    <h3 className="font-semibold text-lg">{selectedSupplier.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Mã NCC:</span>
                        {isEditing ? (
                          <Input className="mt-1" defaultValue={selectedSupplier.code} />
                        ) : (
                          <p className="font-medium">{selectedSupplier.code}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Danh mục:</span>
                        <p className="font-medium">{getCategoryLabel(selectedSupplier.category)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Thông tin liên hệ</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-600">Người liên hệ:</span>
                        {isEditing ? (
                          <Input className="flex-1" defaultValue={selectedSupplier.contactPerson} />
                        ) : (
                          <span className="font-medium">{selectedSupplier.contactPerson}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-600">Điện thoại:</span>
                        {isEditing ? (
                          <Input className="flex-1" defaultValue={selectedSupplier.phone} />
                        ) : (
                          <span className="font-medium">{selectedSupplier.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-600">Email:</span>
                        {isEditing ? (
                          <Input className="flex-1" defaultValue={selectedSupplier.email} />
                        ) : (
                          <span className="font-medium">{selectedSupplier.email}</span>
                        )}
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin size={16} className="text-gray-400 mt-0.5" />
                        <span className="text-gray-600">Địa chỉ:</span>
                        {isEditing ? (
                          <textarea className="flex-1 p-2 border rounded" defaultValue={selectedSupplier.address} />
                        ) : (
                          <span className="font-medium">{selectedSupplier.address}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Thông tin tài chính</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Điều khoản TT:</span>
                        <p className="font-medium">{selectedSupplier.paymentTerms}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Hạn mức tín dụng:</span>
                        <p className="font-medium">{formatCurrency(selectedSupplier.creditLimit)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Công nợ hiện tại:</span>
                        <p className={`font-medium ${selectedSupplier.currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(selectedSupplier.currentDebt)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Mã số thuế:</span>
                        <p className="font-medium">{selectedSupplier.taxId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Hiệu suất</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Tổng đơn hàng:</span>
                        <p className="font-medium">{selectedSupplier.totalOrders}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tổng giá trị:</span>
                        <p className="font-medium text-green-600">{formatCurrency(selectedSupplier.totalValue)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Đánh giá:</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(selectedSupplier.rating)}
                          <span className={`font-medium ${getRatingColor(selectedSupplier.rating)}`}>
                            {selectedSupplier.rating}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Đơn hàng cuối:</span>
                        <p className="font-medium">
                          {selectedSupplier.lastOrderDate ? formatDate(selectedSupplier.lastOrderDate) : 'Chưa có'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contract Info */}
                  {selectedSupplier.contractStart && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold mb-3">Hợp đồng</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Ngày bắt đầu:</span>
                          <p className="font-medium">{formatDate(selectedSupplier.contractStart)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Ngày kết thúc:</span>
                          <p className="font-medium">{selectedSupplier.contractEnd ? formatDate(selectedSupplier.contractEnd) : 'Không giới hạn'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedSupplier.notes && (
                    <div className="border-b pb-4">
                      <h4 className="font-semibold mb-2">Ghi chú</h4>
                      {isEditing ? (
                        <textarea
                          className="w-full p-2 border rounded"
                          rows={3}
                          defaultValue={selectedSupplier.notes}
                        />
                      ) : (
                        <p className="text-sm">{selectedSupplier.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Created/Updated Info */}
                  <div className="text-sm text-gray-500">
                    <p>Tạo: {formatDateTime(selectedSupplier.createdAt)}</p>
                    <p>Cập nhật: {formatDateTime(selectedSupplier.updatedAt)}</p>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                Chọn một nhà cung cấp để xem chi tiết
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SupplierManagement 