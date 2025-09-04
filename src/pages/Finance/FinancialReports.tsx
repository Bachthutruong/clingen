import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
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
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { financialReportsApi } from '@/services/api'
import type { 
  FinancialReport, 
  RevenueByService, 
  ExpenseBreakdown 
} from '@/types/api'

const FinancialReports: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState('2024-01-31')
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [selectedPeriod, setSelectedPeriod] = useState<FinancialReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [financialData, setFinancialData] = useState<FinancialReport[]>([])
  const [revenueByService, setRevenueByService] = useState<RevenueByService[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseBreakdown[]>([])

  // Load financial data from API
  const loadFinancialData = async () => {
    setLoading(true)
    try {
      // Load financial reports for the selected period
      const period = `${dateFrom.split('-')[0]}-${dateFrom.split('-')[1]}`
      console.log('Loading financial data for period:', period)
      console.log('Date from:', dateFrom, 'Date to:', dateTo)
      
      const report = await financialReportsApi.getReport(period)
      console.log('Financial report loaded:', report)
      
      // Load revenue by service
      const revenueByServiceData = await financialReportsApi.getRevenueByService(period)
      console.log('Revenue by service loaded:', revenueByServiceData)
      
      // Load expense breakdown
      const expenseBreakdownData = await financialReportsApi.getExpenseBreakdown(period)
      console.log('Expense breakdown loaded:', expenseBreakdownData)
      
      // Load trend data for multiple periods
      const trendData = await financialReportsApi.getTrend(period)
      console.log('Trend data loaded:', trendData)
      
      setFinancialData(trendData)
      setRevenueByService(revenueByServiceData)
      setExpenseCategories(expenseBreakdownData)
      
      toast.success('Dữ liệu tài chính đã được tải thành công')
    } catch (error: any) {
      console.error('Error loading financial data:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
      toast.error('Không thể tải dữ liệu tài chính')
      
      // Fallback to empty data
      setFinancialData([])
      setRevenueByService([])
      setExpenseCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinancialData()
  }, [dateFrom, dateTo, reportType])

  const handleApplyFilter = () => {
    loadFinancialData()
  }

  // Test API endpoint directly
  // const testAPIEndpoint = async () => {
  //   try {
  //     console.log('Testing API endpoint directly...')
  //     const period = `${dateFrom.split('-')[0]}-${dateFrom.split('-')[1]}`
  //     console.log('Testing period:', period)
      
  //     // Test with fetch to see raw response
  //     const token = localStorage.getItem('token')
  //     const response = await fetch(`https://pk.caduceus.vn/api/pk/v1/financial-reports/${period}`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Accept': 'application/json'
  //       }
  //     })
      
  //     console.log('Raw fetch response status:', response.status)
  //     console.log('Raw fetch response headers:', response.headers)
      
  //     if (response.ok) {
  //       const data = await response.json()
  //       console.log('Raw fetch response data:', data)
  //     } else {
  //       console.error('Raw fetch response error:', response.statusText)
  //     }
  //   } catch (error) {
  //     console.error('Error testing API endpoint:', error)
  //   }
  // }

  const handleExportReport = (format: 'pdf' | 'excel') => {
    toast.success(`Xuất báo cáo ${format.toUpperCase()} thành công!`)
  }

  const handlePrintReport = () => {
    toast.success('In báo cáo thành công!')
  }

  const handleViewDetails = (data: FinancialReport) => {
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
                <Button 
                  className="w-full" 
                  onClick={handleApplyFilter}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Filter size={16} className="mr-2" />
                  )}
                  {loading ? 'Đang tải...' : 'Áp dụng'}
                </Button>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-emerald-600" />
            <p className="text-lg text-gray-600">Đang tải dữ liệu tài chính...</p>
          </CardContent>
        </Card>
      )}

      {/* Key Financial Metrics */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Doanh thu tháng</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(financialData[0]?.revenue || 0)}
                </p>
                <div className={`flex items-center mt-1 ${getGrowthColor(financialData[1]?.revenue ? ((financialData[0]?.revenue - financialData[1]?.revenue) / financialData[1]?.revenue) * 100 : 0)}`}>
                  {getGrowthIcon(financialData[1]?.revenue ? ((financialData[0]?.revenue - financialData[1]?.revenue) / financialData[1]?.revenue) * 100 : 0)}
                  <span className="text-xs ml-1">
                    {financialData[1]?.revenue ? ((financialData[0]?.revenue - financialData[1]?.revenue) / financialData[1]?.revenue * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Chi phí tháng</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(financialData[0]?.expenses || 0)}
                </p>
                <div className="flex items-center mt-1 text-gray-600">
                  <span className="text-xs">
                    {financialData[0]?.revenue ? ((financialData[0]?.expenses / financialData[0]?.revenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Lợi nhuận tháng</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(financialData[0]?.profit || 0)}
                </p>
                <div className={`flex items-center mt-1 ${getGrowthColor(financialData[1]?.profit ? ((financialData[0]?.profit - financialData[1]?.profit) / financialData[1]?.profit) * 100 : 0)}`}>
                  {getGrowthIcon(financialData[1]?.profit ? ((financialData[0]?.profit - financialData[1]?.profit) / financialData[1]?.profit) * 100 : 0)}
                  <span className="text-xs ml-1">
                    {financialData[1]?.profit ? ((financialData[0]?.profit - financialData[1]?.profit) / financialData[1]?.profit * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Lãi ròng</p>
                <p className="text-xl font-bold text-indigo-600">
                  {formatCurrency(financialData[0]?.profit * 0.8 || 0)}
                </p>
                <div className="flex items-center mt-1 text-gray-600">
                  <span className="text-xs">
                    {financialData[0]?.revenue ? ((financialData[0]?.profit * 0.8 / financialData[0]?.revenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Biên lợi nhuận</p>
                <p className="text-xl font-bold text-purple-600">
                  {financialData[0]?.revenue ? ((financialData[0]?.profit / financialData[0]?.revenue) * 100).toFixed(1) : 0}%
                </p>
                <div className="flex items-center mt-1 text-gray-600">
                  <span className="text-xs">
                    Mục tiêu: 65%
                  </span>
                </div>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      )}

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
              {/* Line Chart */}
              <div className="h-64 w-full">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="400" height="200" fill="url(#grid)" />
                  
                  {/* Chart data */}
                  {(() => {
                    const maxRevenue = Math.max(...financialData.map(d => d.revenue))
                    const maxProfit = Math.max(...financialData.map(d => d.profit))
                    const maxValue = Math.max(maxRevenue, maxProfit)
                    
                    const revenuePoints = financialData.map((data, index) => {
                      const x = 50 + (index * 80)
                      const y = 180 - (data.revenue / maxValue * 150)
                      return { x, y, value: data.revenue }
                    }).reverse()
                    
                    const profitPoints = financialData.map((data, index) => {
                      const x = 50 + (index * 80)
                      const y = 180 - (data.profit / maxValue * 150)
                      return { x, y, value: data.profit }
                    }).reverse()
                    
                    return (
                      <>
                        {/* Revenue line */}
                        <polyline
                          points={revenuePoints.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Profit line */}
                        <polyline
                          points={profitPoints.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Revenue dots */}
                        {revenuePoints.map((point, index) => (
                          <circle
                            key={`revenue-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#10b981"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        ))}
                        
                        {/* Profit dots */}
                        {profitPoints.map((point, index) => (
                          <circle
                            key={`profit-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#3b82f6"
                            stroke="#fff"
                            strokeWidth="2"
                          />
                        ))}
                        
                        {/* X-axis labels */}
                        {financialData.map((data, index) => (
                          <text
                            key={`label-${index}`}
                            x={50 + (index * 80)}
                            y={195}
                            textAnchor="middle"
                            fontSize="12"
                            fill="#6b7280"
                          >
                            T{data.period.split('-')[1]}
                          </text>
                        )).reverse()}
                      </>
                    )
                  })()}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-0.5 bg-emerald-500 mr-2"></div>
                  <span className="text-gray-600">Doanh thu</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
                  <span className="text-gray-600">Lợi nhuận</span>
                </div>
              </div>
              
              {/* Summary data */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {financialData.slice(0, 2).map((data) => (
                  <div 
                    key={data.period} 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => handleViewDetails(data)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">Tháng {data.period.split('-')[1]}/2024</span>
                      <span className="text-xs text-gray-500">{data.testCount} XN</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-600">Doanh thu:</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(data.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-blue-600">Lợi nhuận:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(data.profit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <p className="text-xl font-bold text-emerald-600">{financialData[0]?.patientCount || 0}</p>
                  <div className={`flex items-center mt-1 ${getGrowthColor(financialData[1]?.patientCount ? ((financialData[0]?.patientCount - financialData[1]?.patientCount) / financialData[1]?.patientCount) * 100 : 0)}`}>
                    <span className="text-xs">
                      {financialData[1]?.patientCount ? ((financialData[0]?.patientCount - financialData[1]?.patientCount) / financialData[1]?.patientCount * 100).toFixed(1) : 0}% vs tháng trước
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Số xét nghiệm</p>
                  <p className="text-xl font-bold text-blue-600">{financialData[0]?.testCount || 0}</p>
                  <div className={`flex items-center mt-1 ${getGrowthColor(financialData[1]?.testCount ? ((financialData[0]?.testCount - financialData[1]?.testCount) / financialData[1]?.testCount) * 100 : 0)}`}>
                    <span className="text-xs">
                      {financialData[1]?.testCount ? ((financialData[0]?.testCount - financialData[1]?.testCount) / financialData[1]?.testCount * 100).toFixed(1) : 0}% vs tháng trước
                    </span>
                  </div>
                </div>
              </div>

              {/* Average Values */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Giá trị đơn hàng TB</span>
                  <span className="font-bold">{formatCurrency(financialData[0]?.averageOrderValue || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">XN/Bệnh nhân TB</span>
                                      <span className="font-bold">{financialData[0]?.patientCount ? (financialData[0]?.testCount / financialData[0]?.patientCount).toFixed(1) : 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Doanh thu/XN TB</span>
                                      <span className="font-bold">{formatCurrency(financialData[0]?.testCount ? financialData[0]?.revenue / financialData[0]?.testCount : 0)}</span>
                </div>
              </div>

              {/* Growth Summary */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Tóm tắt tăng trưởng</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Doanh thu:</span>
                    <span className={getGrowthColor(financialData[1]?.revenue ? ((financialData[0]?.revenue - financialData[1]?.revenue) / financialData[1]?.revenue) * 100 : 0)}>
                      {financialData[1]?.revenue ? ((financialData[0]?.revenue - financialData[1]?.revenue) / financialData[1]?.revenue * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lợi nhuận:</span>
                    <span className={getGrowthColor(financialData[1]?.profit ? ((financialData[0]?.profit - financialData[1]?.profit) / financialData[1]?.profit) * 100 : 0)}>
                      {financialData[1]?.profit ? ((financialData[0]?.profit - financialData[1]?.profit) / financialData[1]?.profit * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số XN:</span>
                    <span className={getGrowthColor(financialData[1]?.testCount ? ((financialData[0]?.testCount - financialData[1]?.testCount) / financialData[1]?.testCount) * 100 : 0)}>
                      {financialData[1]?.testCount ? ((financialData[0]?.testCount - financialData[1]?.testCount) / financialData[1]?.testCount * 100).toFixed(1) : 0}%
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
                    <span className="font-medium">{formatCurrency(selectedPeriod.testCount ? selectedPeriod.revenue / selectedPeriod.testCount : 0)}</span>
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
                    <span className="font-medium">{formatCurrency(selectedPeriod.testCount ? selectedPeriod.expenses / selectedPeriod.testCount : 0)}</span>
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
                    <span className="font-medium">{formatCurrency(selectedPeriod.testCount ? selectedPeriod.profit / selectedPeriod.testCount : 0)}</span>
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