import React, { useState, useEffect } from 'react'
import { X, Save, Calendar, DollarSign, FileText, Building, Receipt } from 'lucide-react'
import { monthlyCostsApi } from '@/services'
import type { MonthlyCost, CreateMonthlyCostRequest } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/services/api'

interface MonthlyCostFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cost: MonthlyCost) => void
  cost?: MonthlyCost | null
  month?: number
  year?: number
}

export const MonthlyCostForm: React.FC<MonthlyCostFormProps> = ({
  isOpen,
  onClose,
  onSave,
  cost,
  month,
  year
}) => {
  const [formData, setFormData] = useState<CreateMonthlyCostRequest>({
    month: month || new Date().getMonth() + 1,
    year: year || new Date().getFullYear(),
    category: 1,
    costName: '',
    description: '',
    amount: 0,
    isRecurring: false,
    vendorName: '',
    invoiceNumber: '',
    paymentDate: '',
    dueDate: '',
    notes: '',
    validMonthYear: true,
    dueDateValid: true
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Expense categories
  const categories = [
    { value: 1, label: 'Thuê phòng', short: 'RENT' },
    { value: 2, label: 'Hóa chất', short: 'CHEMICAL' },
    { value: 3, label: 'Vật tư tiêu hao', short: 'CONSUMABLE' },
    { value: 4, label: 'Lương nhân viên', short: 'STAFF_SALARY' },
    { value: 5, label: 'Chi phí quản lý', short: 'ADMIN' },
    { value: 6, label: 'Thiết bị', short: 'EQUIPMENT' },
    { value: 7, label: 'Bảo trì', short: 'MAINTENANCE' },
    { value: 8, label: 'Tiện ích (điện, nước, internet)', short: 'UTILITY' },
    { value: 9, label: 'Marketing', short: 'MARKETING' },
    { value: 10, label: 'Bảo hiểm', short: 'INSURANCE' },
    { value: 11, label: 'Đào tạo', short: 'TRAINING' },
    { value: 12, label: 'Khác', short: 'OTHER' }
  ]

  useEffect(() => {
    if (cost) {
      setFormData({
        month: cost.month,
        year: cost.year,
        category: cost.category,
        costName: cost.costName,
        description: cost.description || '',
        amount: cost.amount,
        isRecurring: cost.isRecurring,
        vendorName: cost.vendorName || '',
        invoiceNumber: cost.invoiceNumber || '',
        paymentDate: cost.paymentDate || '',
        dueDate: cost.dueDate,
        notes: cost.notes || '',
        validMonthYear: true,
        dueDateValid: true
      })
    } else {
      setFormData({
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
        category: 1,
        costName: '',
        description: '',
        amount: 0,
        isRecurring: false,
        vendorName: '',
        invoiceNumber: '',
        paymentDate: '',
        dueDate: '',
        notes: '',
        validMonthYear: true,
        dueDateValid: true
      })
    }
    setErrors({})
  }, [cost, month, year, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.costName.trim()) {
      newErrors.costName = 'Tên chi phí là bắt buộc'
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Ngày đến hạn là bắt buộc'
    }

    if (formData.invoiceNumber && formData.invoiceNumber.trim()) {
      // Validate invoice number uniqueness
      monthlyCostsApi.validateInvoiceNumber(formData.invoiceNumber)
        .then(isValid => {
          if (!isValid) {
            newErrors.invoiceNumber = 'Số hóa đơn đã tồn tại'
          }
        })
        .catch(() => {
          // Ignore validation error for now
        })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      let savedCost: MonthlyCost
      
      if (cost) {
        // Update existing cost
        // @ts-ignore
        savedCost = await monthlyCostsApi.update(cost.id, formData)
      } else {
        // Create new cost
        // @ts-ignore
        savedCost = await monthlyCostsApi.create(formData)
      }
      
      onSave(savedCost)
      onClose()
    } catch (error) {
      console.error('Error saving monthly cost:', error)
      setErrors({ submit: getApiErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateMonthlyCostRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {cost ? 'Chỉnh sửa chi phí' : 'Thêm chi phí mới'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tháng
              </label>
              <select
                value={formData.month}
                onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Năm
              </label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại chi phí
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên chi phí *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nhập tên chi phí..."
                value={formData.costName}
                onChange={(e) => handleInputChange('costName', e.target.value)}
                className="pl-10"
              />
            </div>
            {errors.costName && (
              <p className="text-red-500 text-sm mt-1">{errors.costName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết về chi phí..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className="pl-10"
                min="0"
                step="1000"
              />
            </div>
            {formData.amount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(formData.amount)}
              </p>
            )}
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Vendor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhà cung cấp
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tên nhà cung cấp..."
                  value={formData.vendorName}
                  onChange={(e) => handleInputChange('vendorName', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số hóa đơn
              </label>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Số hóa đơn..."
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.invoiceNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.invoiceNumber}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày đến hạn *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.dueDate && (
                <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày thanh toán
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Chi phí định kỳ</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú thêm..."
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {cost ? 'Cập nhật' : 'Lưu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
