import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { departmentApi } from '@/services'
import { 
  Building2, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle
} from 'lucide-react'
import type { DepartmentDTO, SearchDTO } from '@/types/api'

const DepartmentManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDTO | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentDTO | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<DepartmentDTO[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Form states for adding/editing departments
  const [formData, setFormData] = useState<Omit<DepartmentDTO, 'id'>>({
    name: '',
    description: ''
  })

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setLoading(true)
      
      const searchParams: SearchDTO = {
        keyword: searchQuery || undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        orderCol: 'name',
        isDesc: false
      }
      
      const response = await departmentApi.search(searchParams)
      
      setDepartments(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách phòng ban!')
      // Fallback to empty array on error
      setDepartments([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [currentPage, searchQuery])

  // Debounce search query
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(0) // Reset to first page when search changes
      fetchDepartments()
    }, 300) // Debounce search

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleViewDepartment = async (department: DepartmentDTO) => {
    try {
      // Try to fetch fresh data from API
      const freshDepartment = await departmentApi.getById(department.id!)
      setSelectedDepartment(freshDepartment)
    } catch (error) {
      // If API fails, use local data
      console.warn('Failed to fetch department details from API, using local data:', error)
      setSelectedDepartment(department)
    }
    setIsEditing(false)
    setShowDetailDialog(true)
  }

  const handleEditDepartment = () => {
    setIsEditing(true)
    setFormData({
      name: selectedDepartment?.name || '',
      description: selectedDepartment?.description || ''
    })
  }

  const handleAddDepartment = () => {
    setIsAddingNew(true)
    setFormData({
      name: '',
      description: ''
    })
    setShowDetailDialog(true)
  }

  const handleSaveDepartment = async () => {
    try {
      if (isAddingNew) {
        // Validate form data
        if (!formData.name.trim()) {
          toast.error('Vui lòng nhập tên phòng ban!')
          return
        }
        
        // Create new department via API
        await departmentApi.create(formData)
        
        // Refresh the department list
        await fetchDepartments()
        toast.success('Tạo phòng ban thành công!')
        setIsAddingNew(false)
      } else {
        // Update existing department via API
        if (selectedDepartment) {
          await departmentApi.update(selectedDepartment.id!, formData)
          
          // Refresh the department list
          await fetchDepartments()
          toast.success('Cập nhật phòng ban thành công!')
          setIsEditing(false)
        }
      }
      setShowDetailDialog(false)
    } catch (error) {
      console.error('Error saving department:', error)
      toast.error('Có lỗi xảy ra khi lưu phòng ban!')
    }
  }

  const handleDeleteDepartment = (department: DepartmentDTO) => {
    setDepartmentToDelete(department)
    setShowDeleteDialog(true)
  }

  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return
    
    try {
      await departmentApi.delete(departmentToDelete.id!)
      
      // Refresh the department list
      await fetchDepartments()
      toast.success(`Xóa phòng ban ${departmentToDelete.name} thành công!`)
    } catch (error) {
      console.error('Error deleting department:', error)
      toast.error('Có lỗi xảy ra khi xóa phòng ban!')
    } finally {
      setShowDeleteDialog(false)
      setDepartmentToDelete(null)
    }
  }

  const cancelDeleteDepartment = () => {
    setShowDeleteDialog(false)
    setDepartmentToDelete(null)
  }

  const handleFormChange = (field: keyof Omit<DepartmentDTO, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const stats = {
    total: totalElements,
    active: departments.length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý phòng ban</h1>
              <p className="text-blue-100">Quản lý các phòng ban trong hệ thống</p>
            </div>
          </div>
          <Button 
            onClick={handleAddDepartment}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm phòng ban
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng phòng ban</p>
                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              </div>
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đang hiển thị</p>
                <p className="text-lg font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm phòng ban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Department List - Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách phòng ban ({departments.length})</span>
            <Button size="sm" onClick={fetchDepartments} disabled={loading}>
              <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Đang tải...
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy phòng ban phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Tên phòng ban</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Mô tả</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {departments.map(department => (
                    <tr key={department.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{department.name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-gray-600 max-w-xs truncate">
                          {department.description || 'Không có mô tả'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDepartment(department)}
                            className="text-xs"
                          >
                            <Eye size={12} className="mr-1" />
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDepartment(department)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || loading}
          >
            <ChevronLeft size={16} />
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {currentPage + 1} / {totalPages} ({totalElements} phòng ban)
          </span>
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

      {/* Detail Dialog */}
      {showDetailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {isAddingNew ? 'Thêm phòng ban mới' : 'Chi tiết phòng ban'}
                </h2>
                <div className="flex items-center space-x-2">
                  {!isAddingNew ? (
                    <>
                      {!isEditing ? (
                        <>
                          <Button size="sm" variant="outline" onClick={handleEditDepartment}>
                            <Edit size={14} className="mr-1" />
                            Sửa
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => selectedDepartment && handleDeleteDepartment(selectedDepartment)}>
                            <Trash2 size={14} className="mr-1" />
                            Xóa
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={handleSaveDepartment}>
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
                      <Button size="sm" onClick={handleSaveDepartment}>
                        <CheckCircle size={14} className="mr-1" />
                        Tạo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsAddingNew(false)
                        setShowDetailDialog(false)
                      }}>
                        Hủy
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowDetailDialog(false)
                    setIsAddingNew(false)
                    setIsEditing(false)
                  }}>
                    <X size={14} />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg">
                    {isAddingNew ? 'Thông tin phòng ban mới' : selectedDepartment?.name}
                  </h3>
                  <div className="space-y-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên phòng ban *
                      </label>
                      {isEditing || isAddingNew ? (
                        <Input 
                          value={formData.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          placeholder="Nhập tên phòng ban"
                        />
                      ) : (
                        <p className="font-medium text-gray-900">{selectedDepartment?.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả
                      </label>
                      {isEditing || isAddingNew ? (
                        <textarea 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          placeholder="Nhập mô tả phòng ban"
                        />
                      ) : (
                        <p className="text-gray-900">
                          {selectedDepartment?.description || 'Không có mô tả'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID Info */}
                {!isAddingNew && selectedDepartment && (
                  <div className="text-sm text-gray-500">
                    <p>ID: {selectedDepartment.id}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && departmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa phòng ban</h3>
                  <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Bạn có chắc chắn muốn xóa phòng ban này không?
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{departmentToDelete.name}</p>
                      <p className="text-sm text-gray-500">
                        {departmentToDelete.description || 'Không có mô tả'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteDepartment}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteDepartment}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa phòng ban
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentManagement
