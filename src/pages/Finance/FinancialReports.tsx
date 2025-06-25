import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, 
  TrendingUp,
//   TrendingDown,
  DollarSign,
  FileText,
  Download,
  Printer,
//   Calendar,
  PieChart,
  Activity,
  Users,
//   ShoppingCart,
  CreditCard,
  Filter,
//   RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FinancialData {
  period: string
  revenue: number
  expenses: number
  profit: number
  testCount: number
  patientCount: number
  averageOrderValue: number
}

interface RevenueByService {
  serviceName: string
  serviceCode: string
  revenue: number
  testCount: number
  percentage: number
}

interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
  description: string
}

const FinancialReports: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState('2024-01-31')
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [selectedPeriod, setSelectedPeriod] = useState<FinancialData | null>(null)

  // Mock data cho báo cáo tài chính
  const [financialData] = useState<FinancialData[]>([
    {
      period: '2024-01',
      revenue: 892500000,
      expenses: 245600000,
      profit: 646900000,
      testCount: 2840,
      patientCount: 1250,
      averageOrderValue: 314300
    },
    {
      period: '2023-12',
      revenue: 756800000,
      expenses: 232100000,
      profit: 524700000,
      testCount: 2456,
      patientCount: 1120,
      averageOrderValue: 308200
    },
    {
      period: '2023-11',
      revenue: 698400000,
      expenses: 228500000,
      profit: 469900000,
      testCount: 2234,
      patientCount: 1035,
      averageOrderValue: 312600
    },
    {
      period: '2023-10',
      revenue: 712300000,
      expenses: 241200000,
      profit: 471100000,
      testCount: 2367,
      patientCount: 1089,
      averageOrderValue: 300800
    }
  ])

  const [revenueByService] = useState<RevenueByService[]>([
    {
      serviceName: 'Công thức máu toàn phần',
      serviceCode: 'CBC',
      revenue: 127500000,
      testCount: 850,
      percentage: 14.3
    },
    {
      serviceName: 'Sinh hóa máu cơ bản',
      serviceCode: 'CHEM',
      revenue: 178400000,
      testCount: 672,
      percentage: 20.0
    },
    {
      serviceName: 'Xét nghiệm hormone',
      serviceCode: 'HORMONE',
      revenue: 156700000,
      testCount: 423,
      percentage: 17.6
    },
    {
      serviceName: 'Vi sinh vật',
      serviceCode: 'MICRO',
      revenue: 89200000,
      testCount: 298,
      percentage: 10.0
    },
    {
      serviceName: 'Huyết học',
      serviceCode: 'HEMA',
      revenue: 98600000,
      testCount: 387,
      percentage: 11.0
    }
  ])

  const [expenseCategories] = useState<ExpenseCategory[]>([
    {
      category: 'Vật tư y tế',
      amount: 125400000,
      percentage: 51.1,
      description: 'Thuốc thử, ống nghiệm, vật tư tiêu hao'
    },
    {
      category: 'Nhân sự',
      amount: 78200000,
      percentage: 31.8,
      description: 'Lương, thưởng, BHXH'
    },
    {
      category: 'Thiết bị',
      amount: 24600000,
      percentage: 10.0,
      description: 'Bảo trì, khấu hao thiết bị'
    },
    {
      category: 'Vận hành',
      amount: 17400000,
      percentage: 7.1,
      description: 'Điện, nước, internet, văn phòng phẩm'
    }
  ])

  const currentMonth = financialData[0]
  const previousMonth = financialData[1]
  
  const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
  const profitGrowth = ((currentMonth.profit - previousMonth.profit) / previousMonth.profit) * 100
  const testCountGrowth = ((currentMonth.testCount - previousMonth.testCount) / previousMonth.testCount) * 100

  const handleExportReport = (format: 'pdf' | 'excel') => {
    alert(`Xuất báo cáo ${format.toUpperCase()} thành công!`)
  }

  const handlePrintReport = () => {
    alert('In báo cáo thành công!')
  }

  const handleViewDetails = (data: FinancialData) => {
    setSelectedPeriod(data)
  }

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? <ArrowUpRight size={16} /> : growth < 0 ? <ArrowDownRight size={16} /> : null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Báo cáo tài chính</h1>
              <p className="text-emerald-100">Phân tích doanh thu, chi phí và lợi nhuận</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleExportReport('excel')}
              className="bg-white text-emerald-600 hover:bg-gray-100"
            >
              <Download size={16} className="mr-2" />
              Excel
            </Button>
            <Button 
              onClick={() => handleExportReport('pdf')}
              className="bg-white text-emerald-600 hover:bg-gray-100"
            >
              <FileText size={16} className="mr-2" />
              PDF
            </Button>
            <Button 
              onClick={handlePrintReport}
              className="bg-white text-emerald-600 hover:bg-gray-100"
            >
              <Printer size={16} className="mr-2" />
              In
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
              <label className="text-sm text-gray-600 mb-1 block">Loại báo cáo</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
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

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Doanh thu tháng</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(currentMonth.revenue)}
                </p>
                <div className={`flex items-center mt-1 ${getGrowthColor(revenueGrowth)}`}>
                  {getGrowthIcon(revenueGrowth)}
                  <span className="text-sm ml-1">
                    {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% so với tháng trước
                  </span>
                </div>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chi phí tháng</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(currentMonth.expenses)}
                </p>
                <div className="flex items-center mt-1 text-gray-600">
                  <span className="text-sm">
                    {((currentMonth.expenses / currentMonth.revenue) * 100).toFixed(1)}% doanh thu
                  </span>
                </div>
              </div>
              <CreditCard className="h-12 w-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lợi nhuận tháng</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(currentMonth.profit)}
                </p>
                <div className={`flex items-center mt-1 ${getGrowthColor(profitGrowth)}`}>
                  {getGrowthIcon(profitGrowth)}
                  <span className="text-sm ml-1">
                    {profitGrowth > 0 ? '+' : ''}{profitGrowth.toFixed(1)}% so với tháng trước
                  </span>
                </div>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Biên lợi nhuận</p>
                <p className="text-3xl font-bold text-purple-600">
                  {((currentMonth.profit / currentMonth.revenue) * 100).toFixed(1)}%
                </p>
                <div className="flex items-center mt-1 text-gray-600">
                  <span className="text-sm">
                    Mục tiêu: 65%
                  </span>
                </div>
              </div>
              <PieChart className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2" size={20} />
              Xu hướng doanh thu
            </CardTitle>
            <CardDescription>Theo dõi doanh thu và lợi nhuận theo thời gian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {financialData.map((data) => (
                <div 
                  key={data.period} 
                  className="border-b pb-3 last:border-b-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => handleViewDetails(data)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Tháng {data.period.split('-')[1]}/2024</span>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(data.revenue)}</p>
                      <p className="text-sm text-gray-600">{data.testCount} XN</p>
                    </div>
                  </div>
                  
                  {/* Revenue vs Expense Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Doanh thu</span>
                      <span>{formatCurrency(data.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Chi phí</span>
                      <span>{formatCurrency(data.expenses)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(data.expenses / data.revenue) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-blue-600">Lợi nhuận</span>
                      <span className="text-blue-600">{formatCurrency(data.profit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2" size={20} />
              Doanh thu theo dịch vụ
            </CardTitle>
            <CardDescription>Phân bổ doanh thu theo từng loại xét nghiệm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByService.map((service, index) => (
                <div key={service.serviceCode} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-gray-600">{service.serviceCode} • {service.testCount} lần</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{formatCurrency(service.revenue)}</p>
                    <p className="text-sm text-gray-600">{service.percentage}%</p>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Tổng doanh thu:</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(revenueByService.reduce((sum, s) => sum + s.revenue, 0))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Analysis and Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Phân tích chi phí
            </CardTitle>
            <CardDescription>Cơ cấu chi phí theo danh mục</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseCategories.map((expense) => (
                <div key={expense.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{expense.category}</span>
                    <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full flex items-center justify-end pr-2" 
                      style={{ width: `${expense.percentage}%` }}
                    >
                      <span className="text-xs text-white font-medium">{expense.percentage}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{expense.description}</p>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Tổng chi phí:</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(expenseCategories.reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" size={20} />
              Chỉ số hiệu suất
            </CardTitle>
            <CardDescription>Các chỉ số đánh giá hiệu quả hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-600">Số bệnh nhân</p>
                  <p className="text-xl font-bold text-emerald-600">{currentMonth.patientCount}</p>
                  <div className={`flex items-center mt-1 ${getGrowthColor(((currentMonth.patientCount - previousMonth.patientCount) / previousMonth.patientCount) * 100)}`}>
                    <span className="text-xs">
                      {((currentMonth.patientCount - previousMonth.patientCount) / previousMonth.patientCount * 100).toFixed(1)}% vs tháng trước
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Số xét nghiệm</p>
                  <p className="text-xl font-bold text-blue-600">{currentMonth.testCount}</p>
                  <div className={`flex items-center mt-1 ${getGrowthColor(testCountGrowth)}`}>
                    <span className="text-xs">
                      {testCountGrowth > 0 ? '+' : ''}{testCountGrowth.toFixed(1)}% vs tháng trước
                    </span>
                  </div>
                </div>
              </div>

              {/* Average Values */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Giá trị đơn hàng TB</span>
                  <span className="font-bold">{formatCurrency(currentMonth.averageOrderValue)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">XN/Bệnh nhân TB</span>
                  <span className="font-bold">{(currentMonth.testCount / currentMonth.patientCount).toFixed(1)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Doanh thu/XN TB</span>
                  <span className="font-bold">{formatCurrency(currentMonth.revenue / currentMonth.testCount)}</span>
                </div>
              </div>

              {/* Growth Summary */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Tóm tắt tăng trưởng</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Doanh thu:</span>
                    <span className={getGrowthColor(revenueGrowth)}>
                      {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lợi nhuận:</span>
                    <span className={getGrowthColor(profitGrowth)}>
                      {profitGrowth > 0 ? '+' : ''}{profitGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số XN:</span>
                    <span className={getGrowthColor(testCountGrowth)}>
                      {testCountGrowth > 0 ? '+' : ''}{testCountGrowth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Details Modal */}
      {selectedPeriod && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Chi tiết tháng {selectedPeriod.period}</span>
              <Button size="sm" variant="outline" onClick={() => setSelectedPeriod(null)}>
                Đóng
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Doanh thu</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tổng doanh thu:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(selectedPeriod.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Doanh thu/ngày TB:</span>
                    <span className="font-medium">{formatCurrency(selectedPeriod.revenue / 31)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Doanh thu/XN TB:</span>
                    <span className="font-medium">{formatCurrency(selectedPeriod.revenue / selectedPeriod.testCount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Chi phí</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tổng chi phí:</span>
                    <span className="font-bold text-red-600">{formatCurrency(selectedPeriod.expenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Chi phí/doanh thu:</span>
                    <span className="font-medium">{((selectedPeriod.expenses / selectedPeriod.revenue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Chi phí/XN TB:</span>
                    <span className="font-medium">{formatCurrency(selectedPeriod.expenses / selectedPeriod.testCount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Lợi nhuận</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tổng lợi nhuận:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(selectedPeriod.profit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Biên lợi nhuận:</span>
                    <span className="font-medium">{((selectedPeriod.profit / selectedPeriod.revenue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lợi nhuận/XN TB:</span>
                    <span className="font-medium">{formatCurrency(selectedPeriod.profit / selectedPeriod.testCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FinancialReports 