import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
//   Users,
  TestTube,
  Clock,
  CheckCircle,
  AlertTriangle,
//   Calendar,
  FileText,
  Download,
  RefreshCw,
  Filter,
  PieChart,
  Activity
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface StatisticData {
  period: string
  totalTests: number
  completedTests: number
  pendingTests: number
  rejectedTests: number
  revenue: number
  averageTime: number // in minutes
}

interface TestServiceStats {
  serviceCode: string
  serviceName: string
  count: number
  percentage: number
  revenue: number
}

interface QualityMetrics {
  totalSamples: number
  acceptedSamples: number
  rejectedSamples: number
  rejectionRate: number
  commonRejectionReasons: { reason: string; count: number }[]
}

const Statistics: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState('2024-01-31')
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Mock data cho thống kê
  const [statisticsData] = useState<StatisticData[]>([
    {
      period: '2024-01-25',
      totalTests: 45,
      completedTests: 42,
      pendingTests: 2,
      rejectedTests: 1,
      revenue: 15750000,
      averageTime: 125
    },
    {
      period: '2024-01-24',
      totalTests: 38,
      completedTests: 37,
      pendingTests: 1,
      rejectedTests: 0,
      revenue: 12450000,
      averageTime: 110
    },
    {
      period: '2024-01-23',
      totalTests: 52,
      completedTests: 50,
      pendingTests: 1,
      rejectedTests: 1,
      revenue: 18200000,
      averageTime: 135
    },
    {
      period: '2024-01-22',
      totalTests: 41,
      completedTests: 40,
      pendingTests: 0,
      rejectedTests: 1,
      revenue: 14300000,
      averageTime: 120
    },
    {
      period: '2024-01-21',
      totalTests: 35,
      completedTests: 34,
      pendingTests: 1,
      rejectedTests: 0,
      revenue: 11800000,
      averageTime: 105
    }
  ])

  const [testServiceStats] = useState<TestServiceStats[]>([
    {
      serviceCode: 'CBC',
      serviceName: 'Công thức máu toàn phần',
      count: 85,
      percentage: 32.1,
      revenue: 12750000
    },
    {
      serviceCode: 'GLU',
      serviceName: 'Glucose máu đói',
      count: 67,
      percentage: 25.3,
      revenue: 5360000
    },
    {
      serviceCode: 'CHOL',
      serviceName: 'Cholesterol toàn phần',
      count: 45,
      percentage: 17.0,
      revenue: 5400000
    },
    {
      serviceCode: 'TSH',
      serviceName: 'Hormone kích thích tuyến giáp',
      count: 38,
      percentage: 14.4,
      revenue: 7600000
    },
    {
      serviceCode: 'UPRO',
      serviceName: 'Protein niệu',
      count: 30,
      percentage: 11.3,
      revenue: 2400000
    }
  ])

  const [qualityMetrics] = useState<QualityMetrics>({
    totalSamples: 285,
    acceptedSamples: 278,
    rejectedSamples: 7,
    rejectionRate: 2.46,
    commonRejectionReasons: [
      { reason: 'Mẫu đông', count: 3 },
      { reason: 'Mẫu bị nhiễm khuẩn', count: 2 },
      { reason: 'Không đủ lượng mẫu', count: 1 },
      { reason: 'Mẫu quá loãng', count: 1 }
    ]
  })

  // Tính toán tổng hợp
  const totalStats = statisticsData.reduce((acc, curr) => ({
    totalTests: acc.totalTests + curr.totalTests,
    completedTests: acc.completedTests + curr.completedTests,
    pendingTests: acc.pendingTests + curr.pendingTests,
    rejectedTests: acc.rejectedTests + curr.rejectedTests,
    revenue: acc.revenue + curr.revenue,
    averageTime: acc.averageTime + curr.averageTime
  }), {
    totalTests: 0,
    completedTests: 0,
    pendingTests: 0,
    rejectedTests: 0,
    revenue: 0,
    averageTime: 0
  })

  const avgTime = Math.round(totalStats.averageTime / statisticsData.length)
  const completionRate = Math.round((totalStats.completedTests / totalStats.totalTests) * 100)
//   const rejectionRate = Math.round((totalStats.rejectedTests / totalStats.totalTests) * 100)

  const handleExportReport = () => {
    toast.success('Xuất báo cáo thống kê thành công!')
  }

  const handleRefreshData = () => {
    toast.success('Làm mới dữ liệu thành công!')
  }

  const getPerformanceColor = (value: number, good: number, excellent: number) => {
    if (value >= excellent) return 'text-green-600'
    if (value >= good) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp size={16} className="text-green-600" />
    if (current < previous) return <TrendingDown size={16} className="text-red-600" />
    return <Activity size={16} className="text-gray-600" />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Thống kê Lab</h1>
              <p className="text-indigo-100">Báo cáo hiệu suất và chất lượng phòng Lab</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleRefreshData}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              <RefreshCw size={16} className="mr-2" />
              Làm mới
            </Button>
            <Button 
              onClick={handleExportReport}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              <Download size={16} className="mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Từ ngày</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Đến ngày</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Loại thống kê</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="daily">Theo ngày</option>
                <option value="weekly">Theo tuần</option>
                <option value="monthly">Theo tháng</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Filter size={16} className="mr-2" />
                Áp dụng
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số XN</p>
                <p className="text-3xl font-bold text-blue-600">{totalStats.totalTests}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(45, 38)}
                  <span className="text-sm text-gray-600 ml-1">+18.4% so với hôm qua</span>
                </div>
              </div>
              <TestTube className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(completionRate, 90, 95)}`}>
                  {completionRate}%
                </p>
                <div className="flex items-center mt-1">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm text-gray-600 ml-1">Mục tiêu: 95%</span>
                </div>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Thời gian TB</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(120 - avgTime, 30, 60)}`}>
                  {avgTime} phút
                </p>
                <div className="flex items-center mt-1">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-600 ml-1">Mục tiêu: 60 phút</span>
                </div>
              </div>
              <Clock className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doanh thu</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalStats.revenue)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp size={16} className="text-green-600" />
                  <span className="text-sm text-gray-600 ml-1">+12.5% so với T1</span>
                </div>
              </div>
              <BarChart3 className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Statistics */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2" size={20} />
              Thống kê theo ngày
            </CardTitle>
            <CardDescription>Số lượng xét nghiệm và trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statisticsData.slice().reverse().map((stat) => (
                <div key={stat.period} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{formatDate(stat.period)}</span>
                    <span className="text-sm text-gray-600">
                      Tổng: {stat.totalTests} XN
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="font-bold text-green-600">{stat.completedTests}</p>
                      <p className="text-xs text-gray-600">Hoàn thành</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="font-bold text-yellow-600">{stat.pendingTests}</p>
                      <p className="text-xs text-gray-600">Đang chờ</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="font-bold text-red-600">{stat.rejectedTests}</p>
                      <p className="text-xs text-gray-600">Từ chối</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="font-bold text-blue-600">{stat.averageTime}</p>
                      <p className="text-xs text-gray-600">Phút TB</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2" size={20} />
              Dịch vụ phổ biến
            </CardTitle>
            <CardDescription>Xét nghiệm được thực hiện nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testServiceStats.map((service, index) => (
                <div key={service.serviceCode} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-gray-600">{service.serviceCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{service.count} lần</p>
                    <p className="text-sm text-gray-600">{service.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng doanh thu:</span>
                <span className="font-bold">
                  {formatCurrency(testServiceStats.reduce((sum, s) => sum + s.revenue, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics and Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Metrics */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              Chỉ số chất lượng
            </CardTitle>
            <CardDescription>Đánh giá chất lượng mẫu và quy trình</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Quality */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Tổng quan chất lượng</span>
                  <span className={`font-bold ${qualityMetrics.rejectionRate < 3 ? 'text-green-600' : 'text-red-600'}`}>
                    {qualityMetrics.rejectionRate.toFixed(2)}% từ chối
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Tổng mẫu: {qualityMetrics.totalSamples}</p>
                  <p>Chấp nhận: {qualityMetrics.acceptedSamples}</p>
                  <p>Từ chối: {qualityMetrics.rejectedSamples}</p>
                </div>
              </div>

              {/* Rejection Reasons */}
              <div>
                <h4 className="font-semibold mb-3">Lý do từ chối mẫu</h4>
                <div className="space-y-2">
                  {qualityMetrics.commonRejectionReasons.map((reason) => (
                    <div key={reason.reason} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm">{reason.reason}</span>
                      <span className="font-bold text-red-600">{reason.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="text-lg font-bold text-green-600">
                    {((qualityMetrics.acceptedSamples / qualityMetrics.totalSamples) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">Tỷ lệ chấp nhận</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <p className="text-lg font-bold text-blue-600">A+</p>
                  <p className="text-xs text-gray-600">Xếp hạng chất lượng</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2" size={20} />
              Xu hướng hiệu suất
            </CardTitle>
            <CardDescription>Phân tích xu hướng và so sánh</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Performance Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tuần này</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xl font-bold">211 XN</p>
                  <p className="text-sm text-green-600">+15.2% so với tuần trước</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tháng này</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xl font-bold">892 XN</p>
                  <p className="text-sm text-green-600">+22.1% so với tháng trước</p>
                </div>
              </div>

              {/* Peak Hours */}
              <div>
                <h4 className="font-semibold mb-3">Giờ cao điểm</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm">8:00 - 10:00</span>
                    <span className="font-bold text-blue-600">35% tổng số XN</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">14:00 - 16:00</span>
                    <span className="font-bold text-green-600">28% tổng số XN</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span className="text-sm">10:00 - 12:00</span>
                    <span className="font-bold text-yellow-600">22% tổng số XN</span>
                  </div>
                </div>
              </div>

              {/* Efficiency Metrics */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2">Hiệu suất tổng thể</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Thời gian xử lý TB</p>
                    <p className="font-bold text-indigo-600">{avgTime} phút</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Độ chính xác</p>
                    <p className="font-bold text-green-600">99.2%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tỷ lệ tái làm</p>
                    <p className="font-bold text-yellow-600">1.8%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Hài lòng KH</p>
                    <p className="font-bold text-green-600">4.7/5</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" size={20} />
            Khuyến nghị cải thiện
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h4 className="font-semibold text-yellow-800">Cải thiện thời gian</h4>
              </div>
              <p className="text-sm text-yellow-700">
                Thời gian xử lý trung bình {avgTime} phút vượt mục tiêu. Cần tối ưu quy trình.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-center mb-2">
                <TestTube className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Tăng công suất</h4>
              </div>
              <p className="text-sm text-blue-700">
                Nhu cầu tăng 18.4%. Cân nhắc mở rộng giờ làm việc hoặc tăng nhân lực.
              </p>
            </div>

            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-green-800">Duy trì chất lượng</h4>
              </div>
              <p className="text-sm text-green-700">
                Tỷ lệ từ chối mẫu {qualityMetrics.rejectionRate.toFixed(1)}% trong mức tốt. Tiếp tục duy trì.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Statistics 