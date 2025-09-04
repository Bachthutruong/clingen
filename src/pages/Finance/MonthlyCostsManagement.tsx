import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react'
import { monthlyCostsApi } from '@/services'
import type { MonthlyCostSummary, MonthlyCostTrend } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MonthlyCostList } from '@/components/MonthlyCostList'

const MonthlyCostsManagement: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<MonthlyCostSummary | null>(null)
  const [trend, setTrend] = useState<MonthlyCostTrend[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'summary' | 'trend'>('list')

  // Load summary data
  const loadSummary = async (month: number, year: number) => {
    setLoading(true)
    try {
      const summaryData = await monthlyCostsApi.getSummaryByMonth(month, year)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading summary:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load trend data
  const loadTrend = async (year: number) => {
    try {
      const trendData = await monthlyCostsApi.getTrendByYear(year)
      setTrend(trendData)
    } catch (error) {
      console.error('Error loading trend:', error)
    }
  }

  useEffect(() => {
    loadSummary(currentMonth, currentYear)
    loadTrend(currentYear)
  }, [currentMonth, currentYear])

  // Handle month/year change
  const handleMonthYearChange = (month: number, year: number) => {
    setCurrentMonth(month)
    setCurrentYear(year)
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
            onClick={() => loadSummary(currentMonth, currentYear)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Export to Excel
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

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
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng chi phí</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalCost)}
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
      )}

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

      {activeTab === 'summary' && summary && (
        <div className="space-y-6">
          {/* Top Categories */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Chi phí theo loại
            </h3>
            <div className="space-y-3">
              {summary.topCategories.map((category) => (
                <div key={category.categoryCode} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="font-medium">
                      {getCategoryName(category.categoryCode)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({category.itemCount} khoản)
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(category.amount)}</p>
                    <p className="text-sm text-gray-500">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Xu hướng theo tháng
            </h3>
            <div className="space-y-2">
              {summary.monthlyTrend.map((monthData) => (
                <div key={monthData.month} className="flex items-center justify-between">
                  <span className="font-medium">{monthData.monthName}</span>
                  <span className="font-semibold">{formatCurrency(monthData.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'trend' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Xu hướng chi phí năm {currentYear}
          </h3>
          <div className="space-y-2">
            {trend.map((monthData) => (
              <div key={monthData.month} className="flex items-center justify-between">
                <span className="font-medium">{monthData.monthName}</span>
                <span className="font-semibold">{formatCurrency(monthData.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export { MonthlyCostsManagement }
