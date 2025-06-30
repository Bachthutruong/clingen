import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { referralSourcesApi } from '@/services'
import type { ReferralSourceAPI, PaginatedResponse } from '@/types/api'

interface ReferralSourceForm {
  name: string
  code: string
  status: number
}

const ReferralSources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<ReferralSourceAPI | null>(null)
  const [formData, setFormData] = useState<ReferralSourceForm>({
    name: '',
    code: '',
    status: 1
  })

  // API state
  const [referralSourcesData, setReferralSourcesData] = useState<PaginatedResponse<ReferralSourceAPI> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // Fetch referral sources from API
  const fetchReferralSources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await referralSourcesApi.getAll({
        pageIndex: currentPage,
        pageSize: pageSize,
        keyword: searchQuery || undefined
      })
      
      setReferralSourcesData(response)
    } catch (err) {
      console.error('Error fetching referral sources:', err)
      setError('Không thể tải danh sách nguồn gửi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchReferralSources()
  }, [currentPage, searchQuery])

  const referralSources = referralSourcesData?.content || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Vui lòng nhập tên và mã nguồn gửi')
      return
    }

    try {
      setSubmitting(true)
      
      const submitData = {
        name: formData.name,
        code: formData.code,
        priceConfigs: [], // Empty array as per API structure
        status: formData.status
      }
      
      if (editingSource) {
        // Update existing source
        const updatedSource = await referralSourcesApi.update(editingSource.id!, submitData)
        console.log('Updated referral source:', updatedSource)
      } else {
        // Add new source
        const newSource = await referralSourcesApi.create(submitData)
        console.log('Created referral source:', newSource)
      }

      // Refresh the list
      await fetchReferralSources()
      
      // Reset form
      resetForm()
      toast.success(editingSource ? 'Cập nhật nguồn gửi thành công!' : 'Thêm nguồn gửi thành công!')
    } catch (error) {
      console.error('Error saving referral source:', error)
      toast.error('Có lỗi xảy ra khi lưu nguồn gửi. Vui lòng thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (source: ReferralSourceAPI) => {
    setEditingSource(source)
    setFormData({
      name: source.name,
      code: source.code,
      status: source.status
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nguồn gửi "${name}"?`)) {
      return
    }

    try {
      await referralSourcesApi.delete(id)
      await fetchReferralSources()
      toast.success('Xóa nguồn gửi thành công!')
    } catch (error) {
      console.error('Error deleting referral source:', error)
      toast.error('Có lỗi xảy ra khi xóa nguồn gửi. Vui lòng thử lại!')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      status: 1
    })
    setIsFormOpen(false)
    setEditingSource(null)
  }

  const getStatusLabel = (status: number) => {
    return status === 1 ? 'Hoạt động' : 'Không hoạt động'
  }

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchReferralSources()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý nguồn gửi</h1>
              <p className="text-purple-100">Danh sách các nguồn gửi bệnh nhân</p>
            </div>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-white text-purple-700 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm nguồn gửi
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nguồn gửi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle size={20} />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchReferralSources}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Sources List */}
      {loading && referralSources.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Đang tải danh sách nguồn gửi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {referralSources.map(source => (
            <Card key={source.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <p className="text-sm text-gray-600 font-medium">
                      Mã: {source.code}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getStatusColor(source.status)}`}>
                      {getStatusLabel(source.status)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(source)}
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(source.id!, source.name)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {source.priceConfigs && source.priceConfigs.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Cấu hình giá:</p>
                    <p>{source.priceConfigs.length} cấu hình</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {!loading && referralSources.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searchQuery ? 'Không tìm thấy nguồn gửi phù hợp' : 'Chưa có nguồn gửi nào'}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {referralSourcesData && referralSourcesData.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || loading}
          >
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {currentPage + 1} / {referralSourcesData.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(referralSourcesData.totalPages - 1, currentPage + 1))}
            disabled={currentPage >= referralSourcesData.totalPages - 1 || loading}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingSource ? 'Sửa nguồn gửi' : 'Thêm nguồn gửi mới'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên nguồn gửi *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Bệnh viện ABC"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Mã nguồn gửi *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="VD: BV_ABC"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={submitting}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Không hoạt động</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        {editingSource ? 'Đang cập nhật...' : 'Đang thêm...'}
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        {editingSource ? 'Cập nhật' : 'Thêm mới'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ReferralSources 