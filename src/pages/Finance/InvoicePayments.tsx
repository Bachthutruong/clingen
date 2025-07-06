import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Receipt, 
  Search, 
  Plus,
  Eye,
  Printer,
//   Download,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Send,
  RefreshCw,
//   Filter,
//   Calendar,
//   User,
//   FileText,
  Banknote,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  patientId: string
  patientName: string
  patientPhone: string
  issueDate: string
  dueDate: string
  services: InvoiceService[]
  subtotal: number
  discount: number
  tax: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'insurance'
  paidAmount: number
  paidDate?: string
  notes?: string
  createdBy: string
}

interface InvoiceService {
  id: string
  serviceCode: string
  serviceName: string
  quantity: number
  unitPrice: number
  total: number
}

interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: 'cash' | 'card' | 'transfer' | 'insurance'
  reference?: string
  paymentDate: string
  processedBy: string
  notes?: string
}

const InvoicePayments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  console.log(isCreatingInvoice)

  // Mock data cho hóa đơn
  const [invoices] = useState<Invoice[]>([
    {
      id: 'INV001',
      invoiceNumber: 'HD-2024-0001',
      patientId: '1',
      patientName: 'Nguyễn Văn A',
      patientPhone: '0123456789',
      issueDate: '2024-01-25T08:00:00',
      dueDate: '2024-02-25T23:59:59',
      services: [
        {
          id: 'IS001',
          serviceCode: 'CBC',
          serviceName: 'Công thức máu toàn phần',
          quantity: 1,
          unitPrice: 150000,
          total: 150000
        },
        {
          id: 'IS002',
          serviceCode: 'GLU',
          serviceName: 'Glucose máu đói',
          quantity: 1,
          unitPrice: 80000,
          total: 80000
        }
      ],
      subtotal: 230000,
      discount: 23000,
      tax: 20700,
      total: 227700,
      status: 'paid',
      paymentMethod: 'card',
      paidAmount: 227700,
      paidDate: '2024-01-25T10:30:00',
      createdBy: 'Nguyễn Thu Thảo'
    },
    {
      id: 'INV002',
      invoiceNumber: 'HD-2024-0002',
      patientId: '2',
      patientName: 'Trần Thị B',
      patientPhone: '0987654321',
      issueDate: '2024-01-24T09:30:00',
      dueDate: '2024-02-24T23:59:59',
      services: [
        {
          id: 'IS003',
          serviceCode: 'TSH',
          serviceName: 'Hormone kích thích tuyến giáp',
          quantity: 1,
          unitPrice: 200000,
          total: 200000
        }
      ],
      subtotal: 200000,
      discount: 0,
      tax: 20000,
      total: 220000,
      status: 'sent',
      paidAmount: 0,
      createdBy: 'Trần Văn Đức'
    },
    {
      id: 'INV003',
      invoiceNumber: 'HD-2024-0003',
      patientId: '3',
      patientName: 'Lê Văn C',
      patientPhone: '0912345678',
      issueDate: '2024-01-23T14:15:00',
      dueDate: '2024-02-23T23:59:59',
      services: [
        {
          id: 'IS004',
          serviceCode: 'CHOL',
          serviceName: 'Cholesterol toàn phần',
          quantity: 1,
          unitPrice: 120000,
          total: 120000
        },
        {
          id: 'IS005',
          serviceCode: 'UPRO',
          serviceName: 'Protein niệu',
          quantity: 1,
          unitPrice: 80000,
          total: 80000
        }
      ],
      subtotal: 200000,
      discount: 10000,
      tax: 19000,
      total: 209000,
      status: 'overdue',
      paidAmount: 100000,
      paidDate: '2024-01-23T16:00:00',
      paymentMethod: 'cash',
      notes: 'Thanh toán một phần',
      createdBy: 'Nguyễn Thu Thảo'
    },
    {
      id: 'INV004',
      invoiceNumber: 'HD-2024-0004',
      patientId: '4',
      patientName: 'Phạm Thị D',
      patientPhone: '0976543210',
      issueDate: '2024-01-22T11:20:00',
      dueDate: '2024-02-22T23:59:59',
      services: [
        {
          id: 'IS006',
          serviceCode: 'CBC',
          serviceName: 'Công thức máu toàn phần',
          quantity: 1,
          unitPrice: 150000,
          total: 150000
        }
      ],
      subtotal: 150000,
      discount: 0,
      tax: 15000,
      total: 165000,
      status: 'draft',
      paidAmount: 0,
      createdBy: 'Trần Văn Đức'
    }
  ])

  // Mock data cho thanh toán
  const [payments] = useState<Payment[]>([
    {
      id: 'PAY001',
      invoiceId: 'INV001',
      amount: 227700,
      method: 'card',
      reference: 'TXN123456789',
      paymentDate: '2024-01-25T10:30:00',
      processedBy: 'Nguyễn Thu Thảo'
    },
    {
      id: 'PAY002',
      invoiceId: 'INV003',
      amount: 100000,
      method: 'cash',
      paymentDate: '2024-01-23T16:00:00',
      processedBy: 'Nguyễn Thu Thảo',
      notes: 'Thanh toán một phần đầu tiên'
    }
  ])

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patientPhone.includes(searchQuery)

    const matchesStatus = !statusFilter || invoice.status === statusFilter
    const matchesPaymentMethod = !paymentMethodFilter || invoice.paymentMethod === paymentMethodFilter
    
    let matchesDate = true
    if (dateFilter) {
      const invoiceDate = new Date(invoice.issueDate).toDateString()
      const filterDate = new Date(dateFilter).toDateString()
      matchesDate = invoiceDate === filterDate
    }

    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit size={14} />
      case 'sent': return <Send size={14} />
      case 'paid': return <CheckCircle size={14} />
      case 'overdue': return <AlertTriangle size={14} />
      case 'cancelled': return <XCircle size={14} />
      default: return <Clock size={14} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản thảo'
      case 'sent': return 'Đã gửi'
      case 'paid': return 'Đã thanh toán'
      case 'overdue': return 'Quá hạn'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt'
      case 'card': return 'Thẻ'
      case 'transfer': return 'Chuyển khoản'
      case 'insurance': return 'Bảo hiểm'
      default: return method
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPayments(false)
    setShowDetailDialog(true)
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    toast(`In hóa đơn ${invoice.invoiceNumber}`)
  }

  const handleSendInvoice = (invoice: Invoice) => {
    toast(`Gửi hóa đơn ${invoice.invoiceNumber} cho khách hàng`)
  }

  const handlePayment = (invoice: Invoice) => {
    const amount = prompt(`Nhập số tiền thanh toán cho hóa đơn ${invoice.invoiceNumber}:`)
    if (amount && !isNaN(Number(amount))) {
      toast.success(`Ghi nhận thanh toán ${formatCurrency(Number(amount))} thành công!`)
    }
  }

  const handleViewPayments = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPayments(true)
    setShowDetailDialog(true)
  }

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pendingAmount: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + (i.total - i.paidAmount), 0)
  }

  const getInvoicePayments = (invoiceId: string) => {
    return payments.filter(p => p.invoiceId === invoiceId)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Receipt size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hóa đơn & Thanh toán</h1>
              <p className="text-teal-100">Quản lý hóa đơn và theo dõi thanh toán</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreatingInvoice(true)}
            className="bg-white text-teal-600 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Tạo hóa đơn
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng HĐ</p>
                <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              </div>
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Bản thảo</p>
                <p className="text-lg font-bold text-gray-600">{stats.draft}</p>
              </div>
              <Edit className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đã gửi</p>
                <p className="text-lg font-bold text-blue-600">{stats.sent}</p>
              </div>
              <Send className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Đã TT</p>
                <p className="text-lg font-bold text-green-600">{stats.paid}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Quá hạn</p>
                <p className="text-lg font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 md:col-span-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Tổng thu</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
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
                  placeholder="Tìm theo mã HĐ, tên BN, SĐT..."
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
              <option value="sent">Đã gửi</option>
              <option value="paid">Đã thanh toán</option>
              <option value="overdue">Quá hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Tất cả PT thanh toán</option>
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="insurance">Bảo hiểm</option>
            </select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Ngày tạo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice List - Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách hóa đơn ({filteredInvoices.length})</span>
            <Button size="sm" onClick={() => window.location.reload()}>
              <RefreshCw size={14} className="mr-1" />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy hóa đơn phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Mã hóa đơn</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Bệnh nhân</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Ngày tạo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Hạn thanh toán</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Tổng tiền</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Đã thanh toán</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-gray-500">{invoice.createdBy}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{invoice.patientName}</div>
                        <div className="text-xs text-gray-500">{invoice.patientPhone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{formatDate(invoice.issueDate)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</div>
                        {invoice.status === 'overdue' && isOverdue(invoice.dueDate) && (
                          <div className="text-xs text-red-600">
                            Quá hạn {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 3600 * 24))} ngày
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-teal-600">{formatCurrency(invoice.total)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-green-600">{formatCurrency(invoice.paidAmount)}</div>
                        {invoice.total > invoice.paidAmount && (
                          <div className="text-xs text-red-600">
                            Còn lại: {formatCurrency(invoice.total - invoice.paidAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{getStatusLabel(invoice.status)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice)}
                            className="text-xs"
                          >
                            <Eye size={12} className="mr-1" />
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintInvoice(invoice)}
                            className="text-xs"
                          >
                            <Printer size={12} />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendInvoice(invoice)}
                              className="text-xs"
                            >
                              <Send size={12} />
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

      {/* Pagination */}
      {filteredInvoices.length > pageSize && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={16} />
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {currentPage + 1} / {Math.ceil(filteredInvoices.length / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredInvoices.length / pageSize) - 1, currentPage + 1))}
            disabled={currentPage >= Math.ceil(filteredInvoices.length / pageSize) - 1}
          >
            Sau
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {showPayments ? 'Lịch sử thanh toán' : 'Chi tiết hóa đơn'}
                </h2>
                <div className="flex items-center space-x-2">
                  {!showPayments ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(selectedInvoice)}>
                        <Printer size={14} className="mr-1" />
                        In
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewPayments(selectedInvoice)}>
                        <CreditCard size={14} className="mr-1" />
                        Thanh toán
                      </Button>
                      {selectedInvoice.status === 'draft' && (
                        <Button size="sm" onClick={() => handleSendInvoice(selectedInvoice)}>
                          <Send size={14} className="mr-1" />
                          Gửi
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setShowPayments(false)}>
                        <Eye size={14} className="mr-1" />
                        Chi tiết HĐ
                      </Button>
                      {selectedInvoice.total > selectedInvoice.paidAmount && (
                        <Button size="sm" onClick={() => handlePayment(selectedInvoice)}>
                          <Banknote size={14} className="mr-1" />
                          Thanh toán
                        </Button>
                      )}
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowDetailDialog(false)}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
              
              {showPayments ? (
                <div className="space-y-4">
                  {/* Payment Summary */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg">{selectedInvoice.invoiceNumber}</h3>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Tổng tiền:</span>
                        <p className="font-bold text-teal-600">{formatCurrency(selectedInvoice.total)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Đã thanh toán:</span>
                        <p className="font-bold text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Còn lại:</span>
                        <p className="font-bold text-red-600">{formatCurrency(selectedInvoice.total - selectedInvoice.paidAmount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div>
                    <h4 className="font-semibold mb-3">Lịch sử thanh toán</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {getInvoicePayments(selectedInvoice.id).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Chưa có thanh toán nào
                        </div>
                      ) : (
                        getInvoicePayments(selectedInvoice.id).map(payment => (
                          <div key={payment.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                <p className="text-sm text-gray-600">
                                  {getPaymentMethodLabel(payment.method)}
                                  {payment.reference && ` • ${payment.reference}`}
                                </p>
                              </div>
                              <div className="text-right text-sm">
                                <p className="text-gray-600">{formatDateTime(payment.paymentDate)}</p>
                                <p className="font-medium">{payment.processedBy}</p>
                              </div>
                            </div>
                            {payment.notes && (
                              <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Invoice Header */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg">{selectedInvoice.invoiceNumber}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Bệnh nhân:</span>
                        <p className="font-medium">{selectedInvoice.patientName}</p>
                        <p className="text-gray-600">{selectedInvoice.patientPhone}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ngày tạo:</span>
                        <p className="font-medium">{formatDate(selectedInvoice.issueDate)}</p>
                        <span className="text-gray-600">Hạn thanh toán:</span>
                        <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Dịch vụ</h4>
                    <div className="space-y-2">
                      {selectedInvoice.services.map(service => (
                        <div key={service.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{service.serviceName}</p>
                            <p className="text-sm text-gray-600">
                              {service.serviceCode} • SL: {service.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(service.total)}</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(service.unitPrice)}/lần
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Tổng kết</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                      </div>
                      {selectedInvoice.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá:</span>
                          <span>-{formatCurrency(selectedInvoice.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Thuế VAT:</span>
                        <span>{formatCurrency(selectedInvoice.tax)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold text-lg">
                        <span>Tổng cộng:</span>
                        <span className="text-teal-600">{formatCurrency(selectedInvoice.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold mb-3">Trạng thái thanh toán</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Đã thanh toán:</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</span>
                      </div>
                      {selectedInvoice.total > selectedInvoice.paidAmount && (
                        <div className="flex justify-between">
                          <span>Còn lại:</span>
                          <span className="font-bold text-red-600">{formatCurrency(selectedInvoice.total - selectedInvoice.paidAmount)}</span>
                        </div>
                      )}
                      {selectedInvoice.paymentMethod && (
                        <div className="flex justify-between">
                          <span>Phương thức:</span>
                          <span>{getPaymentMethodLabel(selectedInvoice.paymentMethod)}</span>
                        </div>
                      )}
                      {selectedInvoice.paidDate && (
                        <div className="flex justify-between">
                          <span>Ngày thanh toán:</span>
                          <span>{formatDateTime(selectedInvoice.paidDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Ghi chú</h4>
                      <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Created By */}
                  <div className="text-sm text-gray-500">
                    <p>Tạo bởi: {selectedInvoice.createdBy}</p>
                    <p>Ngày tạo: {formatDateTime(selectedInvoice.issueDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoicePayments 