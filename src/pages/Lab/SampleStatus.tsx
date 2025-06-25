import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  TestTube, 
  Search, 
//   Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Microscope,
  RefreshCw,
  Eye,
//   FileText,
//   Calendar,
//   User,
  Package,
//   BarChart3
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Sample {
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
}

const SampleStatus: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Mock data cho mẫu xét nghiệm
  const [samples] = useState<Sample[]>([
    {
      id: 'S001',
      sampleCode: 'SM240125001',
      patientName: 'Nguyễn Văn A',
      patientCode: 'BN001',
      testService: 'Công thức máu toàn phần',
      serviceCode: 'CBC',
      sampleType: 'Máu tĩnh mạch',
      containerType: 'Ống EDTA tím',
      collectedAt: '2024-01-25T08:30:00',
      collectedBy: 'Nguyễn Thu Thảo',
      status: 'processing',
      priority: 'normal',
      storageLocation: 'Tủ lạnh A1',
      processedAt: '2024-01-25T09:15:00',
      processedBy: 'Lê Văn Hùng',
      notes: 'Mẫu đạt chất lượng'
    },
    {
      id: 'S002',
      sampleCode: 'SM240125002',
      patientName: 'Trần Thị B',
      patientCode: 'BN002',
      testService: 'Glucose máu đói',
      serviceCode: 'GLU',
      sampleType: 'Máu tĩnh mạch',
      containerType: 'Ống Fluoride xám',
      collectedAt: '2024-01-25T07:45:00',
      collectedBy: 'Nguyễn Thu Thảo',
      status: 'completed',
      priority: 'normal',
      storageLocation: 'Tủ lạnh A2',
      processedAt: '2024-01-25T10:30:00',
      processedBy: 'Phạm Thị Mai',
      notes: 'Hoàn thành xét nghiệm'
    },
    {
      id: 'S003',
      sampleCode: 'SM240125003',
      patientName: 'Lê Văn C',
      patientCode: 'BN003',
      testService: 'Cholesterol toàn phần',
      serviceCode: 'CHOL',
      sampleType: 'Máu tĩnh mạch',
      containerType: 'Ống gel vàng',
      collectedAt: '2024-01-25T09:00:00',
      collectedBy: 'Trần Văn Đức',
      status: 'collected',
      priority: 'urgent',
      storageLocation: 'Tủ lạnh B1',
      notes: 'Ưu tiên xử lý'
    },
    {
      id: 'S004',
      sampleCode: 'SM240125004',
      patientName: 'Phạm Thị D',
      patientCode: 'BN004',
      testService: 'Hormone TSH',
      serviceCode: 'TSH',
      sampleType: 'Máu tĩnh mạch',
      containerType: 'Ống gel vàng',
      status: 'pending',
      priority: 'normal',
      notes: 'Chờ lấy mẫu'
    },
    {
      id: 'S005',
      sampleCode: 'SM240124005',
      patientName: 'Hoàng Văn E',
      patientCode: 'BN005',
      testService: 'Protein niệu',
      serviceCode: 'UPRO',
      sampleType: 'Nước tiểu',
      containerType: 'Cốc nhựa vô trùng',
      collectedAt: '2024-01-24T14:20:00',
      collectedBy: 'Nguyễn Thu Thảo',
      status: 'rejected',
      priority: 'normal',
      rejectionReason: 'Mẫu bị nhiễm khuẩn',
      notes: 'Cần lấy mẫu lại'
    }
  ])

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = 
      sample.sampleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.testService.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || sample.status === statusFilter
    const matchesPriority = !priorityFilter || sample.priority === priorityFilter
    
    let matchesDate = true
    if (dateFilter && sample.collectedAt) {
      const sampleDate = new Date(sample.collectedAt).toDateString()
      const filterDate = new Date(dateFilter).toDateString()
      matchesDate = sampleDate === filterDate
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesDate
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

  const handleUpdateStatus = (sampleId: string, newStatus: string) => {
    alert(`Cập nhật trạng thái ${newStatus} cho mẫu ${sampleId}`)
  }

  const handleViewDetails = (sample: Sample) => {
    alert(`Xem chi tiết mẫu: ${sample.sampleCode}`)
  }

  const handleReject = (sample: Sample) => {
    const reason = prompt('Nhập lý do từ chối mẫu:')
    if (reason) {
      alert(`Từ chối mẫu ${sample.sampleCode} với lý do: ${reason}`)
    }
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

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo mã mẫu, tên BN, dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <option value="pending">Chờ lấy mẫu</option>
              <option value="collected">Đã lấy mẫu</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả mức độ</option>
              <option value="normal">Bình thường</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="stat">CITO</option>
            </select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Ngày lấy mẫu"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sample List */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách mẫu ({filteredSamples.length})</span>
            <Button size="sm" onClick={() => window.location.reload()}>
              <RefreshCw size={14} className="mr-1" />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSamples.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy mẫu phù hợp
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSamples.map(sample => (
                <Card key={sample.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{sample.sampleCode}</h3>
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(sample.status)}`}>
                            {getStatusIcon(sample.status)}
                            <span className="ml-1">{getStatusLabel(sample.status)}</span>
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getPriorityColor(sample.priority)}`}>
                            {getPriorityLabel(sample.priority)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Bệnh nhân:</p>
                            <p className="font-medium">{sample.patientName} ({sample.patientCode})</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Xét nghiệm:</p>
                            <p className="font-medium">{sample.testService} ({sample.serviceCode})</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Loại mẫu:</p>
                            <p className="font-medium">{sample.sampleType}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ống chứa:</p>
                            <p className="font-medium">{sample.containerType}</p>
                          </div>
                          {sample.collectedAt && (
                            <div>
                              <p className="text-gray-600">Thời gian lấy:</p>
                              <p className="font-medium">{formatDateTime(sample.collectedAt)}</p>
                            </div>
                          )}
                          {sample.storageLocation && (
                            <div>
                              <p className="text-gray-600">Vị trí lưu trữ:</p>
                              <p className="font-medium">{sample.storageLocation}</p>
                            </div>
                          )}
                        </div>

                        {sample.collectedBy && (
                          <div className="mt-3 text-sm">
                            <p className="text-gray-600">Người lấy mẫu: <span className="font-medium">{sample.collectedBy}</span></p>
                          </div>
                        )}

                        {sample.processedBy && (
                          <div className="text-sm">
                            <p className="text-gray-600">Người xử lý: <span className="font-medium">{sample.processedBy}</span></p>
                          </div>
                        )}

                        {sample.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-50 rounded">
                            <p className="text-sm text-red-800">
                              <span className="font-medium">Lý do từ chối:</span> {sample.rejectionReason}
                            </p>
                          </div>
                        )}

                        {sample.notes && (
                          <div className="mt-3 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Ghi chú:</span> {sample.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(sample)}
                        >
                          <Eye size={14} className="mr-1" />
                          Chi tiết
                        </Button>
                        
                        {sample.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(sample.id, 'collected')}
                          >
                            <Package size={14} className="mr-1" />
                            Lấy mẫu
                          </Button>
                        )}
                        
                        {sample.status === 'collected' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(sample.id, 'processing')}
                          >
                            <Microscope size={14} className="mr-1" />
                            Xử lý
                          </Button>
                        )}
                        
                        {sample.status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(sample.id, 'completed')}
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Hoàn thành
                          </Button>
                        )}
                        
                        {sample.status !== 'completed' && sample.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(sample)}
                          >
                            <XCircle size={14} className="mr-1" />
                            Từ chối
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SampleStatus 