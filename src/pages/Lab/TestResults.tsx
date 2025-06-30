import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Search, 
  // Download,
  Printer,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  Save,
  X,
//   Calendar,
//   User,
//   TestTube,
//   BarChart3,
  TrendingUp,
  TrendingDown,
  // Plus
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface TestResult {
  id: string
  sampleCode: string
  patientName: string
  patientCode: string
  patientAge: number
  patientGender: string
  testService: string
  serviceCode: string
  parameters: TestParameter[]
  status: 'draft' | 'reviewed' | 'approved' | 'printed'
  testedBy: string
  testedAt: string
  reviewedBy?: string
  reviewedAt?: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  interpretation?: string
}

interface TestParameter {
  id: string
  name: string
  value: string
  unit: string
  normalRange: string
  status: 'normal' | 'high' | 'low' | 'abnormal'
  flag?: string
}

const TestResults: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Mock data cho kết quả xét nghiệm
  const [testResults] = useState<TestResult[]>([
    {
      id: 'TR001',
      sampleCode: 'SM240125001',
      patientName: 'Nguyễn Văn A',
      patientCode: 'BN001',
      patientAge: 34,
      patientGender: 'male',
      testService: 'Công thức máu toàn phần',
      serviceCode: 'CBC',
      parameters: [
        {
          id: 'P001',
          name: 'Hồng cầu (RBC)',
          value: '4.5',
          unit: '10^12/L',
          normalRange: '4.2-5.4',
          status: 'normal'
        },
        {
          id: 'P002',
          name: 'Bạch cầu (WBC)',
          value: '12.5',
          unit: '10^9/L',
          normalRange: '4.0-10.0',
          status: 'high',
          flag: 'H'
        },
        {
          id: 'P003',
          name: 'Tiểu cầu (PLT)',
          value: '250',
          unit: '10^9/L',
          normalRange: '150-450',
          status: 'normal'
        },
        {
          id: 'P004',
          name: 'Hemoglobin (Hb)',
          value: '14.2',
          unit: 'g/dL',
          normalRange: '12.0-16.0',
          status: 'normal'
        }
      ],
      status: 'reviewed',
      testedBy: 'Lê Văn Hùng',
      testedAt: '2024-01-25T10:30:00',
      reviewedBy: 'BS. Trần Thị Mai',
      reviewedAt: '2024-01-25T14:15:00',
      interpretation: 'Tăng bạch cầu nhẹ, có thể do nhiễm trùng. Các chỉ số khác bình thường.',
      notes: 'Khuyến cáo theo dõi và tái khám sau 1 tuần'
    },
    {
      id: 'TR002',
      sampleCode: 'SM240125002',
      patientName: 'Trần Thị B',
      patientCode: 'BN002',
      patientAge: 39,
      patientGender: 'female',
      testService: 'Glucose máu đói',
      serviceCode: 'GLU',
      parameters: [
        {
          id: 'P005',
          name: 'Glucose',
          value: '185',
          unit: 'mg/dL',
          normalRange: '70-100',
          status: 'high',
          flag: 'H'
        }
      ],
      status: 'approved',
      testedBy: 'Phạm Thị Mai',
      testedAt: '2024-01-25T09:45:00',
      reviewedBy: 'BS. Nguyễn Văn Long',
      reviewedAt: '2024-01-25T11:30:00',
      approvedBy: 'PGS.TS. Lê Thị Hoa',
      approvedAt: '2024-01-25T15:00:00',
      interpretation: 'Tăng glucose máu đáng kể. Khuyến cáo kiểm tra tiểu đường.',
      notes: 'Cần tư vấn chế độ ăn uống và theo dõi đường huyết'
    },
    {
      id: 'TR003',
      sampleCode: 'SM240125003',
      patientName: 'Lê Văn C',
      patientCode: 'BN003',
      patientAge: 45,
      patientGender: 'male',
      testService: 'Cholesterol toàn phần',
      serviceCode: 'CHOL',
      parameters: [
        {
          id: 'P006',
          name: 'Cholesterol total',
          value: '220',
          unit: 'mg/dL',
          normalRange: '<200',
          status: 'high',
          flag: 'H'
        },
        {
          id: 'P007',
          name: 'HDL-C',
          value: '35',
          unit: 'mg/dL',
          normalRange: '>40',
          status: 'low',
          flag: 'L'
        },
        {
          id: 'P008',
          name: 'LDL-C',
          value: '160',
          unit: 'mg/dL',
          normalRange: '<100',
          status: 'high',
          flag: 'H'
        }
      ],
      status: 'draft',
      testedBy: 'Nguyễn Thu Thảo',
      testedAt: '2024-01-25T16:20:00',
      notes: 'Cần xem xét lại kết quả HDL-C'
    }
  ])

  const filteredResults = testResults.filter(result => {
    const matchesSearch = 
      result.sampleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.testService.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || result.status === statusFilter
    
    let matchesDate = true
    if (dateFilter) {
      const resultDate = new Date(result.testedAt).toDateString()
      const filterDate = new Date(dateFilter).toDateString()
      matchesDate = resultDate === filterDate
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'printed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản thảo'
      case 'reviewed': return 'Đã duyệt'
      case 'approved': return 'Đã phê duyệt'
      case 'printed': return 'Đã in'
      default: return status
    }
  }

  const getParameterStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600'
      case 'high': return 'text-red-600'
      case 'low': return 'text-blue-600'
      case 'abnormal': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getParameterIcon = (status: string) => {
    switch (status) {
      case 'high': return <TrendingUp size={14} className="text-red-600" />
      case 'low': return <TrendingDown size={14} className="text-blue-600" />
      case 'abnormal': return <AlertTriangle size={14} className="text-orange-600" />
      default: return <CheckCircle size={14} className="text-green-600" />
    }
  }

  const handleViewResult = (result: TestResult) => {
    setSelectedResult(result)
    setIsEditing(false)
  }

  const handleEditResult = () => {
    setIsEditing(true)
  }

  const handleSaveResult = () => {
    toast.success('Lưu kết quả thành công!')
    setIsEditing(false)
  }

  const handlePrintResult = (result: TestResult) => {
    toast(`In kết quả xét nghiệm: ${result.sampleCode}`)
  }

  const handleApproveResult = (result: TestResult) => {
    toast.success(`Phê duyệt kết quả: ${result.sampleCode}`)
  }

  const stats = {
    draft: testResults.filter(r => r.status === 'draft').length,
    reviewed: testResults.filter(r => r.status === 'reviewed').length,
    approved: testResults.filter(r => r.status === 'approved').length,
    printed: testResults.filter(r => r.status === 'printed').length,
    abnormal: testResults.filter(r => 
      r.parameters.some(p => p.status !== 'normal')
    ).length
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mẫu kết quả xét nghiệm</h1>
            <p className="text-green-100">Quản lý và xem kết quả xét nghiệm</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Bản thảo</p>
                <p className="text-lg font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đã duyệt</p>
                <p className="text-lg font-bold text-blue-600">{stats.reviewed}</p>
              </div>
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đã phê duyệt</p>
                <p className="text-lg font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đã in</p>
                <p className="text-lg font-bold text-gray-600">{stats.printed}</p>
              </div>
              <Printer className="h-6 w-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Bất thường</p>
                <p className="text-lg font-bold text-red-600">{stats.abnormal}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
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
              <option value="draft">Bản thảo</option>
              <option value="reviewed">Đã duyệt</option>
              <option value="approved">Đã phê duyệt</option>
              <option value="printed">Đã in</option>
            </select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Ngày xét nghiệm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Danh sách kết quả ({filteredResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy kết quả phù hợp
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredResults.map(result => (
                  <Card key={result.id} className="border hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewResult(result)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{result.sampleCode}</h3>
                          <p className="text-sm text-gray-600">
                            {result.patientName} ({result.patientCode})
                          </p>
                          <p className="text-sm text-gray-600">{result.testService}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                          {getStatusLabel(result.status)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p>Xét nghiệm: {formatDateTime(result.testedAt)}</p>
                        <p>Người thực hiện: {result.testedBy}</p>
                      </div>

                      {/* Abnormal parameters preview */}
                      {result.parameters.some(p => p.status !== 'normal') && (
                        <div className="mt-2 flex items-center text-xs text-red-600">
                          <AlertTriangle size={12} className="mr-1" />
                          Có {result.parameters.filter(p => p.status !== 'normal').length} chỉ số bất thường
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result Details */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chi tiết kết quả</span>
              {selectedResult && (
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <>
                      <Button size="sm" variant="outline" onClick={handleEditResult}>
                        <Edit size={14} className="mr-1" />
                        Sửa
                      </Button>
                      <Button size="sm" onClick={() => handlePrintResult(selectedResult)}>
                        <Printer size={14} className="mr-1" />
                        In
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={handleSaveResult}>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResult ? (
              <div className="space-y-4">
                {/* Patient Info */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg">{selectedResult.patientName}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-gray-600">Mã BN:</span>
                      <span className="ml-2 font-medium">{selectedResult.patientCode}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tuổi:</span>
                      <span className="ml-2 font-medium">{selectedResult.patientAge}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Giới tính:</span>
                      <span className="ml-2 font-medium">
                        {selectedResult.patientGender === 'male' ? 'Nam' : 'Nữ'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mã mẫu:</span>
                      <span className="ml-2 font-medium">{selectedResult.sampleCode}</span>
                    </div>
                  </div>
                </div>

                {/* Test Service */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Dịch vụ xét nghiệm</h4>
                  <p className="font-medium">{selectedResult.testService} ({selectedResult.serviceCode})</p>
                </div>

                {/* Parameters */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-3">Kết quả xét nghiệm</h4>
                  <div className="space-y-3">
                    {selectedResult.parameters.map(param => (
                      <div key={param.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{param.name}</span>
                            {param.flag && (
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                param.flag === 'H' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {param.flag}
                              </span>
                            )}
                            {getParameterIcon(param.status)}
                          </div>
                          <p className="text-sm text-gray-600">Bình thường: {param.normalRange}</p>
                        </div>
                        <div className="text-right">
                                                     <p className={`font-bold ${getParameterStatusColor(param.status)}`}>
                             {isEditing ? (
                               <Input
                                 className="w-20 text-right text-sm"
                                 defaultValue={param.value}
                               />
                             ) : (
                               param.value
                             )} {param.unit}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interpretation */}
                {selectedResult.interpretation && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Nhận xét</h4>
                    {isEditing ? (
                      <textarea
                        className="w-full p-2 border rounded"
                        rows={3}
                        defaultValue={selectedResult.interpretation}
                      />
                    ) : (
                      <p className="text-sm">{selectedResult.interpretation}</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedResult.notes && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-2">Ghi chú</h4>
                    {isEditing ? (
                      <textarea
                        className="w-full p-2 border rounded"
                        rows={2}
                        defaultValue={selectedResult.notes}
                      />
                    ) : (
                      <p className="text-sm">{selectedResult.notes}</p>
                    )}
                  </div>
                )}

                {/* Status History */}
                <div>
                  <h4 className="font-semibold mb-3">Lịch sử xử lý</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Thực hiện xét nghiệm:</span>
                      <span>{selectedResult.testedBy} - {formatDateTime(selectedResult.testedAt)}</span>
                    </div>
                    {selectedResult.reviewedBy && (
                      <div className="flex justify-between">
                        <span>Duyệt kết quả:</span>
                        <span>{selectedResult.reviewedBy} - {formatDateTime(selectedResult.reviewedAt!)}</span>
                      </div>
                    )}
                    {selectedResult.approvedBy && (
                      <div className="flex justify-between">
                        <span>Phê duyệt:</span>
                        <span>{selectedResult.approvedBy} - {formatDateTime(selectedResult.approvedAt!)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedResult.status === 'reviewed' && (
                  <div className="pt-4 border-t">
                    <Button onClick={() => handleApproveResult(selectedResult)} className="w-full">
                      <CheckCircle size={16} className="mr-2" />
                      Phê duyệt kết quả
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Chọn một kết quả để xem chi tiết
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TestResults 