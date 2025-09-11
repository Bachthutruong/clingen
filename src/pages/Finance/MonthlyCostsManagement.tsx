import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { monthlyCostsApi } from '@/services'
import type { MonthlyCostSummary, MonthlyCostTrend, MonthlyCostBreakdown } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MonthlyCostList } from '@/components/MonthlyCostList'
import { toast } from 'react-hot-toast'

const MonthlyCostsManagement: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<MonthlyCostSummary | null>(null)
  const [trend, setTrend] = useState<MonthlyCostTrend[]>([])
  const [breakdown, setBreakdown] = useState<MonthlyCostBreakdown[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'summary' | 'trend'>('list')

  // Load summary data
  const loadSummary = async (month: number, year: number) => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading summary for month:', month, 'year:', year)
      const summaryData = await monthlyCostsApi.getSummaryByMonth(month, year)
      console.log('Summary data loaded:', summaryData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading summary:', error)
      setError('Không thể tải dữ liệu tổng hợp. Vui lòng thử lại.')
      toast.error('Lỗi khi tải dữ liệu tổng hợp')
    } finally {
      setLoading(false)
    }
  }

  // Load trend data
  const loadTrend = async (year: number) => {
    try {
      console.log('Loading trend for year:', year)
      const trendData = await monthlyCostsApi.getTrendByYear(year)
      console.log('Trend data loaded:', trendData)
      setTrend(trendData)
    } catch (error) {
      console.error('Error loading trend:', error)
      toast.error('Lỗi khi tải dữ liệu xu hướng')
    }
  }

  // Load breakdown data
  const loadBreakdown = async (month: number, year: number) => {
    try {
      console.log('Loading breakdown for month:', month, 'year:', year)
      const breakdownData = await monthlyCostsApi.getBreakdownByMonth(month, year)
      console.log('Breakdown data loaded:', breakdownData)
      setBreakdown(breakdownData)
    } catch (error) {
      console.error('Error loading breakdown:', error)
      toast.error('Lỗi khi tải dữ liệu phân tích')
    }
  }

  useEffect(() => {
    loadSummary(currentMonth, currentYear)
    loadTrend(currentYear)
    loadBreakdown(currentMonth, currentYear)
  }, [currentMonth, currentYear])

  // Handle month/year change
  const handleMonthYearChange = (month: number, year: number) => {
    setCurrentMonth(month)
    setCurrentYear(year)
  }

  // Export functions
  const handleExportExcel = async () => {
    try {
      setLoading(true)
      // TODO: Implement export functionality when API is ready
      toast.success('Chức năng xuất Excel sẽ được triển khai sớm!')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Lỗi khi xuất file Excel')
    } finally {
      setLoading(false)
    }
  }

  const handleExportSummary = async () => {
    try {
      setLoading(true)
      // TODO: Implement export functionality when API is ready
      toast.success('Chức năng xuất báo cáo sẽ được triển khai sớm!')
    } catch (error) {
      console.error('Error exporting summary:', error)
      toast.error('Lỗi khi xuất báo cáo tổng hợp')
    } finally {
      setLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get month name
  const getMonthName = (month: number): string => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ]
    return months[month - 1] || 'Không xác định'
  }

  // Get category name
  const getCategoryName = (categoryCode: number): string => {
    const categories: Record<number, string> = {
      1: 'Thuê phòng',
      2: 'Hóa chất',
      3: 'Vật tư tiêu hao',
      4: 'Lương nhân viên',
      5: 'Chi phí quản lý',
      6: 'Thiết bị',
      7: 'Bảo trì',
      8: 'Tiện ích',
      9: 'Marketing',
      10: 'Bảo hiểm',
      11: 'Đào tạo',
      12: 'Khác'
    }
    return categories[categoryCode] || 'Không xác định'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Quản lý chi phí hàng tháng</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadSummary(currentMonth, currentYear)
              loadTrend(currentYear)
              loadBreakdown(currentMonth, currentYear)
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportSummary}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Báo cáo năm
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle size={20} />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => {
                loadSummary(currentMonth, currentYear)
                loadTrend(currentYear)
                loadBreakdown(currentMonth, currentYear)
              }}>
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month/Year Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Thời gian:</span>
          </div>
          
          <select
            value={currentMonth}
            onChange={(e) => handleMonthYearChange(parseInt(e.target.value), currentYear)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>
          
          <select
            value={currentYear}
            onChange={(e) => handleMonthYearChange(currentMonth, parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              )
            })}
          </select>
        </div>
      </Card>

      {/* Summary Cards */}
      {loading && !summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng chi phí</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.formattedTotalCost || formatCurrency(summary.totalCost)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã thanh toán</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalPaidAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.paidItems} / {summary.totalCostItems} khoản
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chưa thanh toán</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary.totalUnpaidAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.unpaidItems} khoản
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quá hạn</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.overdueItems}
                </p>
                <p className="text-xs text-gray-500">khoản</p>
              </div>
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Danh sách chi phí
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tổng hợp
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Xu hướng
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && (
        <MonthlyCostList
          month={currentMonth}
          year={currentYear}
          onCostUpdate={() => loadSummary(currentMonth, currentYear)}
        />
      )}

      {activeTab === 'summary' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : summary ? (
            <>
              {/* Top Categories */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Chi phí theo loại
                </h3>
                <div className="space-y-3">
                  {summary.topCategories && summary.topCategories.length > 0 ? (
                    summary.topCategories.map((category) => (
                      <div key={category.categoryCode} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <span className="font-medium">
                            {category.categoryName || getCategoryName(category.categoryCode)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({category.itemCount} khoản)
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {category.formattedAmount || formatCurrency(category.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {category.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Không có dữ liệu chi phí theo loại
                    </div>
                  )}
                </div>
              </Card>

              {/* Monthly Trend */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Xu hướng theo tháng
                </h3>
                <div className="space-y-2">
                  {summary.monthlyTrend && summary.monthlyTrend.length > 0 ? (
                    summary.monthlyTrend.map((monthData) => (
                      <div key={monthData.month} className="flex items-center justify-between">
                        <span className="font-medium">{monthData.monthName}</span>
                        <span className="font-semibold">
                          {monthData.formattedAmount || formatCurrency(monthData.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Không có dữ liệu xu hướng
                    </div>
                  )}
                </div>
              </Card>

              {/* Breakdown by Category */}
              {breakdown && breakdown.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Phân tích chi tiết theo loại
                  </h3>
                  <div className="space-y-3">
                    {breakdown.map((item) => (
                      <div key={item.categoryCode} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-green-500"></div>
                          <span className="font-medium">{item.categoryName}</span>
                          <span className="text-sm text-gray-500">
                            ({item.itemCount} khoản)
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {item.formattedAmount || formatCurrency(item.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu tổng hợp
            </div>
          )}
        </div>
      )}

      {activeTab === 'trend' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Xu hướng chi phí năm {currentYear}
          </h3>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : trend && trend.length > 0 ? (
            <div className="space-y-2">
              {trend.map((monthData) => (
                <div key={monthData.month} className="flex items-center justify-between">
                  <span className="font-medium">{monthData.monthName}</span>
                  <span className="font-semibold">
                    {monthData.formattedAmount || formatCurrency(monthData.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu xu hướng cho năm {currentYear}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export { MonthlyCostsManagement }
