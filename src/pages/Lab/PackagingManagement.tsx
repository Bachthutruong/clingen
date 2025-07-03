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
  AlertTriangle,
  CheckCircle,
  Edit,
  X,
  Save,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { packagingApi } from '@/services/api'
import type { 
  Packaging, 
  PaginatedResponse
} from '@/types/api'


const PackagingManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedPackaging, setSelectedPackaging] = useState<Packaging | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Packaging | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // API state
  const [packagingData, setPackagingData] = useState<PaginatedResponse<Packaging> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states for creating new packaging
  const [newPackaging, setNewPackaging] = useState({
    name: '',
    code: '',
    quantity: 1,
    status: 1 // 1 - active
  })

  // Fetch packaging from API
  const fetchPackaging = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching packaging with params:', {
        keyword: searchQuery || undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        status: statusFilter ? parseInt(statusFilter) : undefined
      })

      const packagingResponse = await packagingApi.getAll({
        keyword: searchQuery || undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        status: statusFilter ? parseInt(statusFilter) : undefined
      })
      
      console.log('Packaging response received:', packagingResponse)
      console.log('Response type:', typeof packagingResponse)
      console.log('Response keys:', Object.keys(packagingResponse || {}))
      console.log('Content:', packagingResponse?.content)
      console.log('Content type:', typeof packagingResponse?.content)
      console.log('Is content array?', Array.isArray(packagingResponse?.content))
      
      setPackagingData(packagingResponse)
      
      // Show success message if we got some data
      const contentArray = Array.isArray(packagingResponse?.content) ? packagingResponse.content : []
      if (contentArray.length > 0) {
        console.log(`✅ Loaded ${contentArray.length} packaging items successfully`)
        toast.success(`Đã tải ${contentArray.length} quy cách đóng gói`)
      } else {
        console.warn('⚠️ No packaging data received or content is not an array')
        console.log('Data received:', packagingResponse)
      }
      
    } catch (err) {
      console.error('❌ Error fetching packaging:', err)
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách quy cách đóng gói. Vui lòng thử lại.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchPackaging()
  }, [currentPage, searchQuery, statusFilter])

  const packagings = Array.isArray(packagingData?.content) ? packagingData.content : []

  const handleEditPackaging = (packaging: Packaging) => {
    setSelectedPackaging(packaging)
    setIsEditing(true)
  }

  const handleSavePackaging = async () => {
    if (!selectedPackaging) return
    
    try {
      setSubmitting(true)
      await packagingApi.update(selectedPackaging.id!, {
        name: selectedPackaging.name,
        code: selectedPackaging.code,
        quantity: selectedPackaging.quantity,
        status: selectedPackaging.status
      })
      
      toast.success('Lưu thông tin quy cách đóng gói thành công!')
      setIsEditing(false)
      setSelectedPackaging(null)
      await fetchPackaging()
    } catch (error) {
      console.error('Error updating packaging:', error)
      toast.error('Có lỗi xảy ra khi lưu thông tin')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddNew = async () => {
    try {
      setSubmitting(true)
      
      if (!newPackaging.code || !newPackaging.name) {
        toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã, Tên)')
        return
      }
      
      await packagingApi.create({
        name: newPackaging.name,
        code: newPackaging.code,
        quantity: newPackaging.quantity,
        status: newPackaging.status
      })
      
      toast.success('Thêm quy cách đóng gói mới thành công!')
      setNewPackaging({
        name: '',
        code: '',
        quantity: 1,
        status: 1
      })
      setIsAddingNew(false)
      await fetchPackaging()
    } catch (error) {
      console.error('Error adding packaging:', error)
      toast.error('Có lỗi xảy ra khi thêm quy cách đóng gói')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePackaging = async (packaging: Packaging) => {
    try {
      setSubmitting(true)
      await packagingApi.delete(packaging.id!)
      toast.success('Xóa quy cách đóng gói thành công!')
      setShowDeleteConfirm(null)
      await fetchPackaging()
    } catch (error) {
      console.error('Error deleting packaging:', error)
      toast.error('Có lỗi xảy ra khi xóa quy cách đóng gói')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePagination = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1)
    } else if (direction === 'next' && packagingData && currentPage < packagingData.totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchPackaging()
  }

//   // Debug API connection for packaging
//   const testPackagingAPI = async () => {
//     try {
//       console.log('Testing Packaging API connection...')
//       toast.loading('Đang test kết nối Packaging API...', { id: 'packaging-api-test' })
      
//       const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pk.caduceus.vn/api/pkv1'}/packing`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
//         }
//       })
      
//       console.log('GET /packing response status:', response.status)
      
//       if (response.ok) {
//         const data = await response.json()
//         console.log('GET /packing response data:', data)
//         toast.success(`✅ Packaging API kết nối thành công! Status: ${response.status}`, { id: 'packaging-api-test' })
//         return data
//       } else {
//         console.error('GET /packing failed:', response.status, response.statusText)
//         toast.error(`❌ Packaging API thất bại! Status: ${response.status} - ${response.statusText}`, { id: 'packaging-api-test' })
//         return null
//       }
//     } catch (error) {
//       console.error('Packaging API connection test failed:', error)
//       toast.error(`🔥 Lỗi kết nối Packaging API: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'packaging-api-test' })
//       return null
//     }
//   }

  const stats = {
    total: packagings.length || 0,
    active: packagings.filter((p: Packaging) => p && p.status === 1).length || 0,
    inactive: packagings.filter((p: Packaging) => p && p.status === 0).length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý quy cách đóng gói</h1>
              <p className="text-blue-100">Quản lý các quy cách đóng gói vật tư và hóa chất</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {/* <Button 
              onClick={testPackagingAPI}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              disabled={submitting}
            >
              🔧 Debug API
            </Button>
            <Button 
              onClick={() => {
                setCurrentPage(0)
                setSearchQuery('')
                setStatusFilter('')
                fetchPackaging()
              }}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : '🔄'} Refresh
            </Button> */}
            <Button 
              onClick={() => setIsAddingNew(true)}
              className="bg-white text-blue-600 hover:bg-gray-100"
              disabled={submitting}
            >
              <Plus size={16} className="mr-2" />
              Thêm quy cách
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
              <Button variant="outline" size="sm" onClick={fetchPackaging}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-xs text-gray-600">Đang hoạt động</p>
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
                <p className="text-xs text-gray-600">Không hoạt động</p>
                <p className="text-lg font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <X className="h-6 w-6 text-gray-600" />
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
                  placeholder="Tìm theo tên, mã quy cách..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

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

      {/* Packaging Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Danh sách quy cách đóng gói ({packagingData?.totalElements || 0})</span>
              {loading && <Loader2 size={16} className="animate-spin" />}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Trang {currentPage + 1} / {packagingData?.totalPages || 1}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && packagings.length === 0 ? (
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
                      <th className="text-left p-3 font-semibold">Tên quy cách</th>
                      <th className="text-left p-3 font-semibold">Số lượng</th>
                      <th className="text-left p-3 font-semibold">Trạng thái</th>
                      <th className="text-left p-3 font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packagings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          Không tìm thấy quy cách đóng gói phù hợp
                        </td>
                      </tr>
                    ) : (
                      packagings.map(packaging => (
                        <tr key={packaging.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-mono text-sm">{packaging.code}</td>
                          <td className="p-3 font-medium">{packaging.name}</td>
                          <td className="p-3 text-sm font-medium">{packaging.quantity}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                              packaging.status === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {packaging.status === 1 ? (
                                <>
                                  <CheckCircle size={14} />
                                  <span className="ml-1">Hoạt động</span>
                                </>
                              ) : (
                                <>
                                  <X size={14} />
                                  <span className="ml-1">Không hoạt động</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPackaging(packaging)}
                                title="Chỉnh sửa"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(packaging)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {packagingData && packagingData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Hiển thị {packagings.length} trên tổng số {packagingData.totalElements} quy cách
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
                      disabled={currentPage >= packagingData.totalPages - 1}
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

      {/* Edit Packaging Dialog */}
      {selectedPackaging && isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Chỉnh sửa quy cách đóng gói</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setSelectedPackaging(null)
                  }}
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
                    <Label>Mã quy cách *</Label>
                    <Input
                      value={selectedPackaging.code}
                      onChange={(e) => setSelectedPackaging({
                        ...selectedPackaging,
                        code: e.target.value
                      })}
                      placeholder="VD: PKG001"
                    />
                  </div>
                  <div>
                    <Label>Tên quy cách *</Label>
                    <Input
                      value={selectedPackaging.name}
                      onChange={(e) => setSelectedPackaging({
                        ...selectedPackaging,
                        name: e.target.value
                      })}
                      placeholder="VD: Hộp 10 ống"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      value={selectedPackaging.quantity || ''}
                      onChange={(e) => setSelectedPackaging({
                        ...selectedPackaging,
                        quantity: parseInt(e.target.value) || 0
                      })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Trạng thái</Label>
                    <select
                      value={selectedPackaging.status}
                      onChange={(e) => setSelectedPackaging({
                        ...selectedPackaging,
                        status: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={1}>Hoạt động</option>
                      <option value={0}>Không hoạt động</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setSelectedPackaging(null)
                    }}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleSavePackaging} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
                Bạn có chắc chắn muốn xóa quy cách <strong>{showDeleteConfirm.name}</strong>?
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
                  onClick={() => handleDeletePackaging(showDeleteConfirm)}
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

      {/* Add New Packaging Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Thêm quy cách đóng gói mới</CardTitle>
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
                    <Label>Mã quy cách *</Label>
                    <Input
                      value={newPackaging.code}
                      onChange={(e) => setNewPackaging({ ...newPackaging, code: e.target.value })}
                      placeholder="VD: PKG001"
                    />
                  </div>
                  <div>
                    <Label>Tên quy cách *</Label>
                    <Input
                      value={newPackaging.name}
                      onChange={(e) => setNewPackaging({ ...newPackaging, name: e.target.value })}
                      placeholder="VD: Hộp 10 ống"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      value={newPackaging.quantity || ''}
                      onChange={(e) => setNewPackaging({ ...newPackaging, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label>Trạng thái *</Label>
                    <select
                      value={newPackaging.status}
                      onChange={(e) => setNewPackaging({ ...newPackaging, status: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={1}>Hoạt động</option>
                      <option value={0}>Không hoạt động</option>
                    </select>
                  </div>
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
                        Thêm quy cách
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

export default PackagingManagement
