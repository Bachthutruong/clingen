import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  TestTube, 
  Search, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Microscope,
  RefreshCw,
  Eye,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar,
  // MapPin,
  DollarSign,
  FileText
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { patientSamplesApi } from '@/services'
import type { PatientTestSearchDTO } from '@/types/api'

// Interface cho API response thực tế
interface SampleTestResponse {
  status: boolean
  message: string | null
  data: SampleTestData[]
  totalRecord: number | null
}

interface SampleTestData {
  id: number
  patientName: string
  patientId: number
  testTypeName: string
  testTypeId: number
  testSampleName: string
  testSampleId: number
  price: number
  status: number
  stringStatus: string
}

interface PatientSample {
  id: string
  sampleCode: string
  patientName: string
  patientCode: string
  testService: string
  serviceCode: string
  sampleType: string
  collectedAt?: string
  collectedBy?: string
  status: 'pending' | 'collected' | 'processing' | 'completed' | 'rejected'
  priority: 'normal' | 'urgent' | 'stat'
  notes?: string
  containerType: string
  storageLocation?: string
  processedAt?: string
  processedBy?: string
  rejectionReason?: string
  price: number
}

const SampleStatus: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  
  // API state
  const [responseData, setResponseData] = useState<SampleTestResponse | null>(null)
  console.log(responseData)
  const [samples, setSamples] = useState<PatientSample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [selectedSample, setSelectedSample] = useState<PatientSample | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'update_status' | 'reject'
    newStatus?: string
    sample: PatientSample
  } | null>(null)

  // Fetch patient samples from API
  const fetchSamples = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchParams: PatientTestSearchDTO = {
        keyword: searchQuery || undefined,
        status: statusFilter ? parseInt(statusFilter) : undefined,
        pageIndex: currentPage,
        pageSize: pageSize,
        isDesc: true
      }
      
      console.log('Calling patientSamplesApi.getAll with params:', searchParams)
      const response = await patientSamplesApi.getAll(searchParams)
      console.log('API Response:', response) // Debug log
      console.log('Response keys:', response ? Object.keys(response) : 'null')
      
      // Process response based on structure
      if (response && typeof response === 'object') {
        // Case 1: Custom API structure {status: true, data: [...]}
        if (response.status && Array.isArray(response.data)) {
          console.log('✅ Using custom API structure - found', response.data.length, 'items')
          setResponseData(response as SampleTestResponse)
          
          if (response.data.length > 0) {
            const transformedSamples: PatientSample[] = response.data.map((item: any) => ({
              id: item.id.toString(),
              sampleCode: `SM${item.id.toString().padStart(4, '0')}`,
              patientName: item.patientName,
              patientCode: `BN${item.patientId}`,
              testService: item.testTypeName,
              serviceCode: `TEST_${item.testTypeId}`,
              sampleType: item.testSampleName,
              containerType: 'Ống tiêu chuẩn',
              status: mapApiStatusToStatus(item.status),
              priority: 'normal',
              collectedAt: new Date().toISOString(),
              collectedBy: 'Hệ thống',
              notes: `${item.stringStatus} - Giá: ${item.price.toLocaleString('vi-VN')} VND`,
              storageLocation: 'Kho mẫu A',
              price: item.price
            }))
            
            setSamples(transformedSamples)
            console.log('✅ Transformed', transformedSamples.length, 'samples')
          } else {
            setSamples([])
            console.log('📭 No data in response')
          }
        }
        // Case 2: Standard pagination structure {content: [...], totalElements: ...}
        else if (Array.isArray(response.content)) {
          console.log('✅ Using pagination structure - found', response.content.length, 'items')
          
          if (response.content.length > 0) {
            const transformedSamples: PatientSample[] = response.content.map((item: any) => ({
              id: item.id.toString(),
              sampleCode: `SM${item.id.toString().padStart(4, '0')}`,
              patientName: item.patientName,
              patientCode: `BN${item.patientId}`,
              testService: item.testTypeName,
              serviceCode: `TEST_${item.testTypeId}`,
              sampleType: item.testSampleName,
              containerType: 'Ống tiêu chuẩn',
              status: mapApiStatusToStatus(item.status),
              priority: 'normal',
              collectedAt: new Date().toISOString(),
              collectedBy: 'Hệ thống',
              notes: `${item.stringStatus} - Giá: ${item.price.toLocaleString('vi-VN')} VND`,
              storageLocation: 'Kho mẫu A',
              price: item.price
            }))
            
            setSamples(transformedSamples)
            console.log('✅ Transformed', transformedSamples.length, 'samples')
          } else {
            setSamples([])
          }
        }
        // Case 3: Direct array
        else if (Array.isArray(response)) {
          console.log('✅ Using direct array structure - found', response.length, 'items')
          const transformedSamples: PatientSample[] = response.map((item: any) => ({
            id: item.id.toString(),
            sampleCode: `SM${item.id.toString().padStart(4, '0')}`,
            patientName: item.patientName,
            patientCode: `BN${item.patientId}`,
            testService: item.testTypeName,
            serviceCode: `TEST_${item.testTypeId}`,
            sampleType: item.testSampleName,
            containerType: 'Ống tiêu chuẩn',
            status: mapApiStatusToStatus(item.status),
            priority: 'normal',
            collectedAt: new Date().toISOString(),
            collectedBy: 'Hệ thống',
            notes: `${item.stringStatus} - Giá: ${item.price.toLocaleString('vi-VN')} VND`,
            storageLocation: 'Kho mẫu A',
            price: item.price
          }))
          
          setSamples(transformedSamples)
        }
        else {
          console.error('❌ Unknown response structure:', {
            hasStatus: 'status' in response,
            hasData: 'data' in response,
            hasContent: 'content' in response,
            dataIsArray: 'data' in response ? Array.isArray(response.data) : false,
            contentIsArray: 'content' in response ? Array.isArray(response.content) : false,
            keys: Object.keys(response)
          })
          setSamples([])
        }
      } else {
        console.error('❌ Invalid response:', response)
        setSamples([])
      }
      
    } catch (err) {
      console.error('Error fetching patient samples:', err)
      setError('Không thể tải danh sách mẫu. Vui lòng thử lại.')
      setSamples([])
    } finally {
      setLoading(false)
    }
  }

  // Helper to map API status number to local status
  const mapApiStatusToStatus = (status: number): 'pending' | 'collected' | 'processing' | 'completed' | 'rejected' => {
    switch (status) {
      case 1: return 'pending' // Đang tiếp nhận
      case 2: return 'collected' // Đã lấy mẫu  
      case 3: return 'processing' // Đang xử lý
      case 4: return 'completed' // Hoàn thành
      case 5: return 'rejected' // Từ chối
      default: return 'pending'
    }
  }

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchSamples()
  }, [currentPage, searchQuery, statusFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, statusFilter, priorityFilter])

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = 
      sample.sampleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.testService.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || sample.status === statusFilter
    const matchesPriority = !priorityFilter || sample.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'collected': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />
      case 'collected': return <Package size={14} />
      case 'processing': return <Microscope size={14} />
      case 'completed': return <CheckCircle size={14} />
      case 'rejected': return <XCircle size={14} />
      default: return <AlertTriangle size={14} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ lấy mẫu'
      case 'collected': return 'Đã lấy mẫu'
      case 'processing': return 'Đang xử lý'
      case 'completed': return 'Hoàn thành'
      case 'rejected': return 'Từ chối'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'bg-red-500 text-white'
      case 'urgent': return 'bg-orange-500 text-white'
      case 'normal': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'stat': return 'CITO'
      case 'urgent': return 'Khẩn'
      case 'normal': return 'Bình thường'
      default: return priority
    }
  }

  const handleUpdateStatus = async (sample: PatientSample, newStatus: string) => {
    setConfirmAction({
      type: 'update_status',
      newStatus,
      sample
    })
    setShowConfirmDialog(true)
  }

  const handleViewDetails = (sample: PatientSample) => {
    setSelectedSample(sample)
    setShowDetailDialog(true)
  }

  const handleReject = async (sample: PatientSample) => {
    setConfirmAction({
      type: 'reject',
      sample
    })
    setShowConfirmDialog(true)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    try {
      if (confirmAction.type === 'update_status') {
        // In real implementation, call API to update status
        // await patientSamplesApi.updateStatus(parseInt(confirmAction.sample.id), statusToNumber(confirmAction.newStatus))
        toast.success(`Cập nhật trạng thái thành công cho mẫu ${confirmAction.sample.sampleCode}`)
      } else if (confirmAction.type === 'reject') {
        // In real implementation, call API to reject sample
        // await patientSamplesApi.updateStatus(parseInt(confirmAction.sample.id), 5) // 5 = rejected
        toast.success(`Từ chối mẫu ${confirmAction.sample.sampleCode} thành công`)
      }
      
      // Refresh data
      fetchSamples()
    } catch (error) {
      console.error('Error performing action:', error)
      toast.error('Có lỗi xảy ra khi thực hiện thao tác')
    } finally {
      setShowConfirmDialog(false)
      setConfirmAction(null)
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    fetchSamples()
  }

  const stats = {
    pending: samples.filter(s => s.status === 'pending').length,
    collected: samples.filter(s => s.status === 'collected').length,
    processing: samples.filter(s => s.status === 'processing').length,
    completed: samples.filter(s => s.status === 'completed').length,
    rejected: samples.filter(s => s.status === 'rejected').length,
    urgent: samples.filter(s => s.priority === 'urgent' || s.priority === 'stat').length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <TestTube size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trạng thái mẫu</h1>
            <p className="text-blue-100">Theo dõi và quản lý trạng thái mẫu xét nghiệm</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Chờ lấy mẫu</p>
                <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đã lấy mẫu</p>
                <p className="text-lg font-bold text-blue-600">{stats.collected}</p>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đang xử lý</p>
                <p className="text-lg font-bold text-purple-600">{stats.processing}</p>
              </div>
              <Microscope className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Hoàn thành</p>
                <p className="text-lg font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Từ chối</p>
                <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Ưu tiên</p>
                <p className="text-lg font-bold text-orange-600">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter - Compact */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo mã mẫu, tên BN, dịch vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ lấy mẫu</option>
              <option value="collected">Đã lấy mẫu</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
            >
              <option value="">Tất cả mức độ</option>
              <option value="normal">Bình thường</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="stat">CITO</option>
            </select>

            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
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
              <Button variant="outline" size="sm" onClick={fetchSamples}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample List - Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách mẫu ({filteredSamples.length})</span>
            <div className="flex items-center space-x-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              <Button size="sm" onClick={fetchSamples} disabled={loading}>
                <RefreshCw size={14} className="mr-1" />
                Làm mới
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && filteredSamples.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : filteredSamples.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy mẫu phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Mã mẫu</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Bệnh nhân</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Xét nghiệm</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Giá tiền</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Ưu tiên</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thời gian</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSamples.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(sample => (
                    <tr key={sample.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{sample.sampleCode}</div>
                        <div className="text-xs text-gray-500">{sample.containerType}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{sample.patientName}</div>
                        <div className="text-xs text-gray-500">{sample.patientCode}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{sample.testService}</div>
                        <div className="text-xs text-gray-500">{sample.serviceCode}</div>
                        <div className="text-xs text-gray-500">{sample.sampleType}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-emerald-600">{sample.price.toLocaleString('vi-VN')} VND</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(sample.status)}`}>
                          {getStatusIcon(sample.status)}
                          <span className="ml-1">{getStatusLabel(sample.status)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getPriorityColor(sample.priority)}`}>
                          {getPriorityLabel(sample.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-gray-900">
                          {sample.collectedAt && formatDateTime(sample.collectedAt)}
                        </div>
                        {sample.collectedBy && (
                          <div className="text-xs text-gray-500">
                            {sample.collectedBy}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(sample)}
                            className="text-xs"
                          >
                            <Eye size={12} className="mr-1" />
                            Chi tiết
                          </Button>
                          
                          {sample.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(sample, 'collected')}
                              className="text-xs"
                            >
                              <Package size={12} className="mr-1" />
                              Lấy mẫu
                            </Button>
                          )}
                          
                          {sample.status === 'collected' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(sample, 'processing')}
                              className="text-xs"
                            >
                              <Microscope size={12} className="mr-1" />
                              Xử lý
                            </Button>
                          )}
                          
                          {sample.status === 'processing' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(sample, 'completed')}
                              className="text-xs"
                            >
                              <CheckCircle size={12} className="mr-1" />
                              Hoàn thành
                            </Button>
                          )}
                          
                          {sample.status !== 'completed' && sample.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(sample)}
                              className="text-xs"
                            >
                              <XCircle size={12} className="mr-1" />
                              Từ chối
                            </Button>
                          )}
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

      {/* Pagination - Simple version for filtered samples */}
      {filteredSamples.length > 20 && (
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
            Trang {currentPage + 1} / {Math.ceil(filteredSamples.length / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredSamples.length / pageSize) - 1, currentPage + 1))}
            disabled={currentPage >= Math.ceil(filteredSamples.length / pageSize) - 1 || loading}
          >
            Sau
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && selectedSample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Chi tiết mẫu xét nghiệm</h2>
                <Button size="sm" variant="outline" onClick={() => setShowDetailDialog(false)}>
                  <X size={14} />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Thông tin mẫu</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã mẫu:</span>
                        <span className="font-medium">{selectedSample.sampleCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loại mẫu:</span>
                        <span className="font-medium">{selectedSample.sampleType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Container:</span>
                        <span className="font-medium">{selectedSample.containerType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vị trí lưu:</span>
                        <span className="font-medium">{selectedSample.storageLocation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Thông tin bệnh nhân</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tên BN:</span>
                        <span className="font-medium">{selectedSample.patientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã BN:</span>
                        <span className="font-medium">{selectedSample.patientCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ưu tiên:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedSample.priority)}`}>
                          {getPriorityLabel(selectedSample.priority)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Service Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Microscope size={16} className="mr-2" />
                    Dịch vụ xét nghiệm
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên dịch vụ:</span>
                      <span className="font-medium">{selectedSample.testService}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã dịch vụ:</span>
                      <span className="font-medium">{selectedSample.serviceCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá tiền:</span>
                      <span className="font-medium text-emerald-600">
                        <DollarSign size={12} className="inline mr-1" />
                        {selectedSample.price.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Timeline */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Clock size={16} className="mr-2" />
                    Trạng thái & Tiến trình
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Trạng thái hiện tại:</span>
                      <span className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${getStatusColor(selectedSample.status)}`}>
                        {getStatusIcon(selectedSample.status)}
                        <span className="ml-1">{getStatusLabel(selectedSample.status)}</span>
                      </span>
                    </div>
                    
                    {selectedSample.collectedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Thời gian lấy mẫu:</span>
                        <span className="font-medium">
                          <Calendar size={12} className="inline mr-1" />
                          {formatDateTime(selectedSample.collectedAt)}
                        </span>
                      </div>
                    )}
                    
                    {selectedSample.collectedBy && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Người lấy mẫu:</span>
                        <span className="font-medium">
                          <User size={12} className="inline mr-1" />
                          {selectedSample.collectedBy}
                        </span>
                      </div>
                    )}

                    {selectedSample.processedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Thời gian xử lý:</span>
                        <span className="font-medium">
                          <Calendar size={12} className="inline mr-1" />
                          {formatDateTime(selectedSample.processedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedSample.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FileText size={16} className="mr-2" />
                      Ghi chú
                    </h3>
                    <p className="text-sm text-gray-700">{selectedSample.notes}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedSample.status === 'rejected' && selectedSample.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-red-800 flex items-center">
                      <XCircle size={16} className="mr-2" />
                      Lý do từ chối
                    </h3>
                    <p className="text-sm text-red-700">{selectedSample.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Đóng
                </Button>
                {selectedSample.status !== 'completed' && selectedSample.status !== 'rejected' && (
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setShowDetailDialog(false)
                      handleReject(selectedSample)
                    }}
                  >
                    <XCircle size={14} className="mr-1" />
                    Từ chối mẫu
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
                <h3 className="text-lg font-medium">Xác nhận thao tác</h3>
              </div>
              
              <div className="mb-4">
                {confirmAction.type === 'update_status' ? (
                  <p className="text-gray-600">
                    Bạn có chắc chắn muốn cập nhật trạng thái mẫu <strong>{confirmAction.sample.sampleCode}</strong> 
                    thành <strong>{getStatusLabel(confirmAction.newStatus!)}</strong>?
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Bạn có chắc chắn muốn từ chối mẫu <strong>{confirmAction.sample.sampleCode}</strong>?
                    <br />
                    <span className="text-red-600 text-sm">Hành động này không thể hoàn tác.</span>
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowConfirmDialog(false)
                    setConfirmAction(null)
                  }}
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleConfirmAction}
                  className={confirmAction.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {confirmAction.type === 'update_status' ? 'Cập nhật' : 'Từ chối'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SampleStatus 