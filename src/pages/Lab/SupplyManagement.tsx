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
  Minus,
  AlertTriangle,
  CheckCircle,
  Edit,
  X,
  Save,
  FileText,
  Eye,
  Loader2
} from 'lucide-react'
import { materialsApi, inventoryApi, packagingApi } from '@/services/api'
import type { 
  Material, 
  InventoryLogsDTO,
  Packaging,
  PaginatedResponse
} from '@/types/api'
import { getMaterialTypeLabel, getInventoryLogTypeLabel } from '@/types/api'
import { formatDateTime } from '@/lib/utils'

const SupplyManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
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
  const [transactionForm, setTransactionForm] = useState({
    logType: 1, // 1: nhập kho, 2: xuất kho
    quantity: 0,
    materialId: 0,
    note: ''
  })

  // Fetch materials from API
  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [materialsResponse, logsResponse, packagingResponse] = await Promise.all([
        materialsApi.getAll({
          keyword: searchQuery || undefined,
          pageIndex: currentPage,
          pageSize: pageSize,
          materialType: typeFilter ? parseInt(typeFilter) : undefined
        }),
        inventoryApi.getLogs({
          pageIndex: 0,
          pageSize: 10
        }),
        packagingApi.getAll({
          pageIndex: 0,
          pageSize: 100
        })
      ])
      
      setMaterialsData(materialsResponse)
      setLogsData(logsResponse)
      setPackagingData(packagingResponse)
      
    } catch (err) {
      console.error('Error fetching materials:', err)
      setError('Không thể tải danh sách vật tư. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchMaterials()
  }, [currentPage, searchQuery, typeFilter])

  const materials = materialsData?.content || []
  const logs = logsData?.content || []
  const packagings = packagingData?.content || []

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = !typeFilter || material.type.toString() === typeFilter

    return matchesSearch && matchesType
  })

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
    
    try {
      setSubmitting(true)
      await materialsApi.update(selectedMaterial.id!, {
        name: selectedMaterial.name,
        code: selectedMaterial.code,
        quantity: selectedMaterial.quantity,
        packagingId: selectedMaterial.packagingId,
        importTime: selectedMaterial.importTime,
        expiryTime: selectedMaterial.expiryTime,
        type: selectedMaterial.type
      })
      
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

  const handleImportMaterial = async () => {
    if (!transactionForm.materialId || transactionForm.quantity <= 0) {
      toast.error('Vui lòng chọn vật tư và nhập số lượng hợp lệ')
      return
    }
    
    try {
      setSubmitting(true)
      await inventoryApi.importMaterials({
        materialId: transactionForm.materialId,
        quantity: transactionForm.quantity,
        note: transactionForm.note
      })
      
      toast.success('Nhập kho thành công!')
      setTransactionForm({
        logType: 1, // 1: nhập kho
        quantity: 0,
        materialId: 0,
        note: ''
      })
      await fetchMaterials()
    } catch (error) {
      console.error('Error importing material:', error)
      toast.error('Có lỗi xảy ra khi nhập kho')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportMaterial = async () => {
    if (!transactionForm.materialId || transactionForm.quantity <= 0) {
      toast.error('Vui lòng chọn vật tư và nhập số lượng hợp lệ')
      return
    }
    
    try {
      setSubmitting(true)
      await inventoryApi.exportMaterials({
        materialId: transactionForm.materialId,
        quantity: transactionForm.quantity,
        note: transactionForm.note
      })
      
      toast.success('Xuất kho thành công!')
      setTransactionForm({
        logType: 2, // 2: xuất kho
        quantity: 0,
        materialId: 0,
        note: ''
      })
      await fetchMaterials()
    } catch (error) {
      console.error('Error exporting material:', error)
      toast.error('Có lỗi xảy ra khi xuất kho')
    } finally {
      setSubmitting(false)
    }
  }

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

  const handleSearch = () => {
    setCurrentPage(0)
    fetchMaterials()
  }

  const getPackagingName = (packagingId: number) => {
    const packaging = packagings.find(p => p.id === packagingId)
    return packaging?.name || 'Không xác định'
  }

  const stats = {
    total: filteredMaterials.length,
    normal: filteredMaterials.filter(m => getStockStatus(m).status === 'NORMAL').length,
    lowStock: filteredMaterials.filter(m => getStockStatus(m).status === 'LOW_STOCK').length,
    outOfStock: filteredMaterials.filter(m => getStockStatus(m).status === 'OUT_OF_STOCK').length,
    expiring: filteredMaterials.filter(m => getStockStatus(m).status === 'EXPIRING').length,
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
            disabled={submitting}
          >
            <Plus size={16} className="mr-2" />
            Thêm vật tư
          </Button>
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
                <p className="text-lg font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Materials List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Danh sách vật tư ({filteredMaterials.length})</span>
                {loading && <Loader2 size={16} className="animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && filteredMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
                  <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy vật tư phù hợp
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredMaterials.map(material => {
                    const stockStatus = getStockStatus(material)
                    
                    return (
                      <Card key={material.id} className="border hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{material.name}</h3>
                              <p className="text-sm text-gray-600">Mã: {material.code}</p>
                              <p className="text-sm text-gray-600">
                                Loại: {getMaterialTypeLabel(material.type)}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                                  {getStatusIcon(stockStatus.status)}
                                  <span className="ml-1">{stockStatus.label}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewMaterial(material)}
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewTransactions(material)}
                              >
                                <FileText size={14} />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Số lượng:</span>
                              <p className="font-medium">{material.quantity}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Đóng gói:</span>
                              <p className="font-medium">{getPackagingName(material.packagingId)}</p>
                            </div>
                            {material.expiryTime && (
                              <div className="col-span-2">
                                <span className="text-gray-600">Hết hạn:</span>
                                <p className="font-medium">{formatDateTime(material.expiryTime)}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Material Details / Transaction Form */}
        <div>
          {showTransactions ? (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Lịch sử giao dịch - {selectedMaterial?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {logs.map(log => (
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
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có giao dịch nào
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : selectedMaterial ? (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Chi tiết vật tư</span>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={handleEditMaterial}>
                      <Edit size={14} className="mr-1" />
                      Sửa
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        <Label>Loại</Label>
                        <select
                          value={selectedMaterial.type}
                          onChange={(e) => setSelectedMaterial({
                            ...selectedMaterial,
                            type: parseInt(e.target.value)
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value={0}>Thuốc thử</option>
                          <option value={1}>Thiết bị</option>
                          <option value={2}>Vật tư tiêu hao</option>
                          <option value={3}>Hóa chất</option>
                          <option value={4}>Khác</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Ngày hết hạn</Label>
                      <Input
                        type="datetime-local"
                        value={selectedMaterial.expiryTime ? new Date(selectedMaterial.expiryTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setSelectedMaterial({
                          ...selectedMaterial,
                          expiryTime: e.target.value ? new Date(e.target.value).toISOString() : undefined
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
                        <p className="font-medium">{getMaterialTypeLabel(selectedMaterial.type)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Số lượng:</span>
                        <p className="font-medium">{selectedMaterial.quantity}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Đóng gói:</span>
                        <p className="font-medium">{getPackagingName(selectedMaterial.packagingId)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Nhập kho:</span>
                        <p className="font-medium">{formatDateTime(selectedMaterial.importTime)}</p>
                      </div>
                      {selectedMaterial.expiryTime && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Hết hạn:</span>
                          <p className="font-medium">{formatDateTime(selectedMaterial.expiryTime)}</p>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t pt-4">
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
                              materialId: selectedMaterial.id || 0
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Chi tiết vật tư</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Chọn một vật tư để xem chi tiết
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
                      <option value={0}>Thuốc thử</option>
                      <option value={1}>Thiết bị</option>
                      <option value={2}>Vật tư tiêu hao</option>
                      <option value={3}>Hóa chất</option>
                      <option value={4}>Khác</option>
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
                      {packagings.map(pkg => (
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
                    type="datetime-local"
                    value={newMaterial.expiryTime ? new Date(newMaterial.expiryTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setNewMaterial({ ...newMaterial, expiryTime: e.target.value ? new Date(e.target.value).toISOString() : '' })}
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