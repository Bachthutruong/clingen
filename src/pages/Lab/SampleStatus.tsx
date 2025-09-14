import React, { useState, useEffect, useRef } from 'react'
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
  FileText,
  Save
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { patientSamplesApi } from '@/services'
import type { PatientTestSearchDTO } from '@/types/api'

// Import images
import anhnenImg from '@/assets/Anhnen.png'
import headerImg from '@/assets/header.png'
import watermaskImg from '@/assets/watermask.png'
import logoClinicImg from '@/assets/logo_clinic.jpg'
import logoSvgClinicImg from '@/assets/logo_svg_clinic.svg'
import reactImg from '@/assets/react.svg'

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
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // API state
  const [responseData, setResponseData] = useState<SampleTestResponse | null>(null)
  console.log(responseData)
  const [samples, setSamples] = useState<PatientSample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [selectedSample, setSelectedSample] = useState<PatientSample | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Result upload states
  const [showResultUploadDialog, setShowResultUploadDialog] = useState(false)
  const [uploadedHtml, setUploadedHtml] = useState<string>('')
  const [isEditingHtml, setIsEditingHtml] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showCodeView, setShowCodeView] = useState(false)
  const codeRef = useRef<HTMLElement | null>(null)
  const [hljsReady, setHljsReady] = useState(false)

  // Load highlight.js (CDN) once for pretty HTML code view
  useEffect(() => {
    if (hljsReady) return
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/common.min.js'
    script.async = true
    script.onload = () => setHljsReady(true)
    document.head.appendChild(script)

    const style = document.createElement('link')
    style.rel = 'stylesheet'
    style.href = 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css'
    document.head.appendChild(style)
  }, [hljsReady])

  // Highlight when code view toggled or html changes
  useEffect(() => {
    try {
      if (showCodeView && hljsReady && (window as any).hljs && codeRef.current) {
        ;(window as any).hljs.highlightElement(codeRef.current)
      }
    } catch {}
  }, [showCodeView, hljsReady, uploadedHtml])

  const escapeHtmlForCode = (html: string) =>
    html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;')

  // Helper function to fix image paths
  const fixImagePaths = (html: string) => {
    return html.replace(/<img[^>]+>/g, (match) => {
      return match.replace(/src="([^"]*)"/g, (srcMatch, src) => {
        console.log('Processing image src:', src) // Debug log
        
        // If src is data URL, keep it
        if (src.startsWith('data:')) {
          return srcMatch
        }
        
        // Map API server paths to local assets
        const imageMap: { [key: string]: string } = {
          'Anhnen.png': anhnenImg,
          'header.png': headerImg, 
          'watermask.png': watermaskImg,
          'logo_clinic.jpg': logoClinicImg,
          'logo_svg_clinic.svg': logoSvgClinicImg,
          'react.svg': reactImg
        }
        
        // Check if it's an API server path
        if (src.includes('/api/pk/v1/static/')) {
          const fileName = src.split('/').pop() || src
          if (imageMap[fileName]) {
            console.log('Mapping API path to local asset:', src, '->', imageMap[fileName])
            return `src="${imageMap[fileName]}"`
          }
        }
        
        // Check if it's a known image name (for direct file names)
        const fileName = src.split('/').pop() || src
        if (imageMap[fileName]) {
          console.log('Mapping file name to local asset:', fileName, '->', imageMap[fileName])
          return `src="${imageMap[fileName]}"`
        }
        
        // For other paths, keep as is
        return srcMatch
      }).replace(/<img/g, '<img style="max-width: 100%; height: auto; display: block; margin: 10px 0;"')
    })
  }

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
          
          // Set pagination info for custom API structure
          setTotalElements(response.totalRecord || response.data.length)
          setTotalPages(Math.ceil((response.totalRecord || response.data.length) / pageSize))
          
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
          
          // Set pagination info for standard pagination structure
          setTotalElements(response.totalElements || response.content.length)
          setTotalPages(response.totalPages || Math.ceil((response.totalElements || response.content.length) / pageSize))
          
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
          
          // Set pagination info for direct array
          setTotalElements(response.length)
          setTotalPages(Math.ceil(response.length / pageSize))
          
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
          setTotalElements(0)
          setTotalPages(0)
        }
      } else {
        console.error('❌ Invalid response:', response)
        setSamples([])
        setTotalElements(0)
        setTotalPages(0)
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

  // Removed status mapping; we don't update status via API here

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchSamples()
  }, [currentPage, pageSize, searchQuery, statusFilter])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, statusFilter, priorityFilter, pageSize])

  // Client-side filtering removed - using server-side pagination and filtering

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
      case 'pending': return 'Đang tiếp nhận'
      case 'collected': return 'Đang phân tích'
      case 'processing': return 'Đang phân tích'
      case 'completed': return 'Đã có kết quả'
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
    // Bỏ xác nhận: mở trực tiếp dialog nhập kết quả khi bắt đầu phân tích
    if (newStatus === 'collected') {
      setSelectedSample(sample)
      setShowResultUploadDialog(true)
    }
  }

  const handleViewDetails = (sample: PatientSample) => {
    setSelectedSample(sample)
    setShowDetailDialog(true)
  }

  // const handleReject = async (sample: PatientSample) => {
  //   setConfirmAction({
  //     type: 'reject',
  //     sample
  //   })
  //   setShowConfirmDialog(true)
  // }

  // Load existing result from API
  const loadExistingResult = async (sampleId: number) => {
    try {
      setIsUploading(true)
      
      // Try to get result from patient-test API first
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pk.caduceus.vn/api/pk/v1'}/patient-test/${sampleId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.html) {
            setUploadedHtml(result.html)
            toast.success('Đã tải kết quả từ hệ thống!')
            return
          }
        }
      } catch (error) {
        console.log('No result found in patient-test API, trying result API...')
      }
      
      // Fallback: Try the result API with empty file parameter
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pk.caduceus.vn/api/pk/v1'}/patient-test/result/${sampleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          file: '' // Empty file parameter to get existing result
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status && result.data) {
          setUploadedHtml(result.data)
          toast.success('Đã tải kết quả từ hệ thống!')
        } else {
          setUploadedHtml('<div class="result-placeholder">Chưa có kết quả xét nghiệm</div>')
        }
      } else {
        setUploadedHtml('<div class="result-placeholder">Không thể tải kết quả từ hệ thống</div>')
      }
    } catch (error) {
      console.error('Error loading existing result:', error)
      setUploadedHtml('<div class="result-placeholder">Lỗi khi tải kết quả</div>')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle file upload for results
  const handleFileUpload = async (file: File, sampleId: number) => {
    try {
      setIsUploading(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Call API to upload file and get HTML result
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pk.caduceus.vn/api/pk/v1'}/patient-test/result/${sampleId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.status && result.data) {
          setUploadedHtml(result.data)
          setShowResultUploadDialog(true)
          toast.success('Upload file thành công!')
        } else {
          toast.error('Lỗi khi xử lý file')
        }
      } else {
        toast.error('Lỗi khi upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Có lỗi xảy ra khi upload file')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent, sampleId: number) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    )
    
    if (excelFile) {
      handleFileUpload(excelFile, sampleId)
    } else {
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
    }
    // Clear drag data to avoid stuck state
    try { e.dataTransfer.clearData() } catch {}
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Save edited HTML
  const handleSaveHtml = async (sampleId: number) => {
    try {
      setIsUploading(true)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pk.caduceus.vn/api/pk/v1'}/patient-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          patientTestId: sampleId,
          html: uploadedHtml
        })
      })
      
      if (response.ok) {
        toast.success('Lưu kết quả thành công!')
        setShowResultUploadDialog(false)
        setUploadedHtml('')
        setIsEditingHtml(false)
        await fetchSamples() // Refresh data
      } else {
        toast.error('Lỗi khi lưu kết quả')
      }
    } catch (error) {
      console.error('Error saving HTML:', error)
      toast.error('Có lỗi xảy ra khi lưu kết quả')
    } finally {
      setIsUploading(false)
    }
  }

  // Approve result - call API to approve the test result
  const handleApproveResult = async (sampleId: number) => {
    try {
      setIsUploading(true)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pk.caduceus.vn/api/pk/v1'}/patient-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          patientTestId: sampleId,
          html: uploadedHtml
        })
      })
      
      if (response.ok) {
        toast.success('Phê duyệt kết quả thành công!')
        setShowResultUploadDialog(false)
        setUploadedHtml('')
        setIsEditingHtml(false)
        setShowCodeView(false)
        await fetchSamples() // Refresh data
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Lỗi khi phê duyệt kết quả')
      }
    } catch (error) {
      console.error('Error approving result:', error)
      toast.error('Có lỗi xảy ra khi phê duyệt kết quả')
    } finally {
      setIsUploading(false)
    }
  }

  // Removed confirm handler and modal

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
                <p className="text-xs text-gray-600">Đang tiếp nhận</p>
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
                <p className="text-xs text-gray-600">Đang phân tích</p>
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
                <p className="text-xs text-gray-600">Đang phân tích</p>
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
                <p className="text-xs text-gray-600">Đã có kết quả</p>
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
          <div className="flex flex-col lg:flex-row gap-4 items-center">
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
            
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Đang tiếp nhận</option>
                <option value="collected">Đang phân tích</option>
                <option value="processing">Đang phân tích</option>
                <option value="completed">Đã có kết quả</option>
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

              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>

              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>
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
            <span>Danh sách mẫu ({totalElements} mẫu)</span>
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
          {loading && samples.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto animate-spin text-gray-400" />
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : samples.length === 0 ? (
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
                  {samples.map(sample => (
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
                              <Microscope size={12} className="mr-1" />
                              Bắt đầu phân tích
                            </Button>
                          )}
                          
                          {sample.status === 'collected' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(sample, 'processing')}
                              className="text-xs"
                            >
                              <CheckCircle size={12} className="mr-1" />
                              Hoàn thành phân tích
                            </Button>
                          )}
                          
                          {sample.status === 'processing' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedSample(sample)
                                setShowResultUploadDialog(true)
                              }}
                              className="text-xs"
                            >
                              <FileText size={12} className="mr-1" />
                              Nhập kết quả
                            </Button>
                          )}
                          
                          {sample.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                setSelectedSample(sample)
                                setShowResultUploadDialog(true)
                                await loadExistingResult(parseInt(sample.id))
                              }}
                              className="text-xs"
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <Loader2 size={12} className="mr-1 animate-spin" />
                              ) : (
                                <Eye size={12} className="mr-1" />
                              )}
                              Xem kết quả
                            </Button>
                          )}
                          
                          {/* {sample.status !== 'completed' && sample.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(sample)}
                              className="text-xs"
                            >
                              <XCircle size={12} className="mr-1" />
                              Từ chối
                            </Button>
                          )} */}
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

      {/* Pagination - Server-side pagination */}
      {totalPages > 1 && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} mẫu
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0 || loading}
                >
                  <ChevronLeft size={16} />
                  Trước
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 5
                    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1)
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(0, endPage - maxVisiblePages + 1)
                    }
                    
                    // First page
                    if (startPage > 0) {
                      pages.push(
                        <Button
                          key={0}
                          variant={currentPage === 0 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(0)}
                          disabled={loading}
                        >
                          1
                        </Button>
                      )
                      if (startPage > 1) {
                        pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>)
                      }
                    }
                    
                    // Page numbers
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          disabled={loading}
                        >
                          {i + 1}
                        </Button>
                      )
                    }
                    
                    // Last page
                    if (endPage < totalPages - 1) {
                      if (endPage < totalPages - 2) {
                        pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>)
                      }
                      pages.push(
                        <Button
                          key={totalPages - 1}
                          variant={currentPage === totalPages - 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages - 1)}
                          disabled={loading}
                        >
                          {totalPages}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1 || loading}
                >
                  Sau
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
                {/* {selectedSample.status !== 'completed' && selectedSample.status !== 'rejected' && (
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
                )} */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed Confirm Dialog */}

      {/* Result Upload Dialog - Expanded and Improved */}
      {showResultUploadDialog && selectedSample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-lg w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h3 className="text-xl font-semibold">Nhập kết quả xét nghiệm - {selectedSample.sampleCode}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResultUploadDialog(false)
                  setUploadedHtml('')
                  setIsEditingHtml(false)
                  setShowCodeView(false)
                }}
              >
                <X size={16} />
              </Button>
            </div>
            
            <div className="flex-1 p-6 space-y-4 overflow-hidden">
              {!uploadedHtml ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors h-full flex flex-col items-center justify-center"
                  onDrop={(e) => handleDrop(e, parseInt(selectedSample.id))}
                  onDragOver={handleDragOver}
                >
                  <FileText size={64} className="mx-auto text-gray-400 mb-6" />
                  <p className="text-xl font-medium text-gray-600 mb-3">
                    Kéo thả file Excel vào đây
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Hoặc click để chọn file (.xlsx, .xls)
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file, parseInt(selectedSample.id))
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    size="lg"
                    onClick={() => {
                      const el = document.getElementById('file-upload') as HTMLInputElement | null
                      if (el) el.value = ''
                      el?.click()
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={20} className="mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Chọn file Excel'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-lg">
                      {selectedSample?.status === 'completed' ? 'Kết quả xét nghiệm (Đã phê duyệt)' : 'Kết quả xét nghiệm:'}
                    </h4>
                    <div className="flex gap-3">
                      {selectedSample?.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingHtml(!isEditingHtml)}
                        >
                          {isEditingHtml ? 'Xem kết quả' : 'Chỉnh sửa Word'}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setShowCodeView(!showCodeView)}>
                        {showCodeView ? 'Ẩn mã HTML' : 'Xem mã HTML'}
                      </Button>
                      {selectedSample?.status !== 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveHtml(parseInt(selectedSample.id))}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 size={14} className="mr-1 animate-spin" />
                                Đang lưu...
                              </>
                            ) : (
                              <>
                                <Save size={14} className="mr-1" />
                                Lưu kết quả
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveResult(parseInt(selectedSample.id))}
                            disabled={isUploading || !uploadedHtml}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Phê duyệt
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    {showCodeView ? (
                      <pre className="h-full overflow-auto border rounded-md p-4 bg-gray-50 text-sm">
                        <code ref={codeRef as any} className="language-xml">
                          {escapeHtmlForCode(uploadedHtml)}
                        </code>
                      </pre>
                    ) : (isEditingHtml && selectedSample?.status !== 'completed') ? (
                      <div className="h-full flex flex-col">
                        <div className="mb-2 text-sm text-gray-600">
                          Chỉnh sửa nội dung như Word (HTML sẽ được cập nhật tự động):
                        </div>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          className="flex-1 p-4 border border-gray-300 rounded-md overflow-y-auto bg-white"
                          style={{ 
                            minHeight: '500px',
                            fontFamily: 'Times New Roman, serif',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word'
                          }}
                          dangerouslySetInnerHTML={{ __html: fixImagePaths(uploadedHtml) }}
                          onInput={(e) => {
                            // Debounce input to prevent jumping
                            clearTimeout((window as any).htmlEditTimeout)
                            ;(window as any).htmlEditTimeout = setTimeout(() => {
                              const newContent = e.currentTarget.innerHTML
                              setUploadedHtml(newContent)
                            }, 100)
                          }}
                          onKeyDown={(e) => {
                            // Prevent default behavior for certain keys that cause jumping
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              document.execCommand('insertHTML', false, '<br>')
                            }
                          }}
                          onCompositionStart={(e) => {
                            // Prevent input handling during composition (Vietnamese typing)
                            e.currentTarget.setAttribute('data-composing', 'true')
                          }}
                          onCompositionEnd={(e) => {
                            // Re-enable input handling after composition
                            e.currentTarget.removeAttribute('data-composing')
                            const newContent = e.currentTarget.innerHTML
                            setUploadedHtml(newContent)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        {selectedSample?.status === 'completed' && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center text-green-800">
                              <CheckCircle size={16} className="mr-2" />
                              <span className="font-medium">Kết quả đã được phê duyệt</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                              Kết quả này đã được phê duyệt và không thể chỉnh sửa
                            </p>
                          </div>
                        )}
                        <div 
                          className="flex-1 overflow-y-auto border border-gray-300 rounded-md p-6 bg-white"
                          style={{
                            fontFamily: 'Times New Roman, serif',
                            fontSize: '14px',
                            lineHeight: '1.6'
                          }}
                          dangerouslySetInnerHTML={{ __html: fixImagePaths(uploadedHtml) }}
                        />
                      </div>
                    )}
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

export default SampleStatus 