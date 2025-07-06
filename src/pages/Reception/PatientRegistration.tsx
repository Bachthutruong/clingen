import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Phone, Mail, MapPin, Calendar, Users, Plus, Search, Loader2, TestTube, X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'
import { patientsApi, referralSourcesApi, testTypesApi, testSamplesApi } from '@/services'
import { getGenderLabel } from '@/types/api'
import type { ReferralSourceAPI, PatientAPI, TestType, TestSample, PatientTestDTO } from '@/types/api'

const patientSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  birthYear: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.number({
    required_error: 'Vui lòng chọn giới tính',
    invalid_type_error: 'Vui lòng chọn giới tính',
  }).min(0).max(2),
  phoneNumber: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
  email: z.string().optional().refine(
    (val) => !val || val === '' || z.string().email().safeParse(val).success,
    { message: 'Email không hợp lệ' }
  ),
  address: z.string().optional(),
  reasonForVisit: z.string().optional(),
  referralSourceId: z.number().optional(),
  guardianName: z.string().optional(),
  guardianPhoneNumber: z.string().optional(),
  guardianRelationship: z.string().optional(),
  selectedTestTypes: z.array(z.object({
    testType: z.object({
      id: z.number().optional(),
      name: z.string(),
      code: z.string(),
      price: z.number().optional()
    }),
    selectedSampleId: z.number(),
    selectedSampleName: z.string()
  })).optional()
})

type PatientForm = z.infer<typeof patientSchema>

interface SelectedTestType {
  testType: TestType
  selectedSampleId: number
  selectedSampleName: string
}

// Define steps
enum RegistrationStep {
  PATIENT_INFO = 1,
  SERVICE_SELECTION = 2,
  CONFIRMATION = 3
}

const PatientRegistration: React.FC = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(RegistrationStep.PATIENT_INFO)
  const [completedSteps, setCompletedSteps] = useState<Set<RegistrationStep>>(new Set())
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PatientAPI[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [referralSources, setReferralSources] = useState<ReferralSourceAPI[]>([])
  const [loadingReferralSources, setLoadingReferralSources] = useState(true)
  
  // Test types and samples state
  const [testTypes, setTestTypes] = useState<TestType[]>([])
  const [testSamples, setTestSamples] = useState<TestSample[]>([])
  const [loadingTestTypes, setLoadingTestTypes] = useState(true)
  // const [loadingTestSamples, setLoadingTestSamples] = useState(true)
  const [searchTestQuery, setSearchTestQuery] = useState('')
  const [selectedTestTypes, setSelectedTestTypes] = useState<SelectedTestType[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger,
    // getValues
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: '',
      birthYear: '',
      phoneNumber: '',
      email: '',
      address: '',
      reasonForVisit: '',
      guardianName: '',
      guardianPhoneNumber: '',
      guardianRelationship: '',
      selectedTestTypes: []
    }
  })

  // Fetch referral sources on component mount
  useEffect(() => {
    const fetchReferralSources = async () => {
      try {
        setLoadingReferralSources(true)
        const response = await referralSourcesApi.getAll({
          keyword: '',
          status: 1, // Active only
          pageIndex: 0,
          pageSize: 100,
          // orderCol: 'name',
          isDesc: false
        })
        
        console.log('Referral sources API response:', response)
        console.log('Referral sources content:', response.content)
        console.log('Type of response.content:', typeof response.content)
        console.log('Is response.content array?', Array.isArray(response.content))
        
        // Handle nested structure: response.content.content
        let actualArray = null
        const responseAny = response as any
        if (responseAny?.content?.content && Array.isArray(responseAny.content.content)) {
          actualArray = responseAny.content.content
          console.log('Found nested array at response.content.content:', actualArray)
        } else if (responseAny?.content && Array.isArray(responseAny.content)) {
          actualArray = responseAny.content
          console.log('Found array at response.content:', actualArray)
        }
        
        if (actualArray && Array.isArray(actualArray)) {
          console.log('Setting referral sources to:', actualArray)
          setReferralSources(actualArray)
        } else {
          console.warn('No valid array found, setting empty array')
          setReferralSources([])
        }
      } catch (error) {
        console.error('Error fetching referral sources:', error)
        setReferralSources([]) // Set empty array on error
      } finally {
        setLoadingReferralSources(false)
      }
    }

    fetchReferralSources()
  }, [])

  // Fetch test types and samples
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoadingTestTypes(true)
        // setLoadingTestSamples(true)
        
        // Fetch test types
        const testTypesResponse = await testTypesApi.getAllSimple()
        setTestTypes(testTypesResponse || [])
        
        // Fetch test samples  
        const testSamplesResponse = await testSamplesApi.getAllSimple()
        setTestSamples(testSamplesResponse || [])
        
      } catch (error) {
        console.error('Error fetching test data:', error)
        toast.error('Có lỗi khi tải dữ liệu xét nghiệm')
        setTestTypes([])
        setTestSamples([])
      } finally {
        setLoadingTestTypes(false)
        // setLoadingTestSamples(false)
      }
    }

    fetchTestData()
  }, [])

  // Update form when selectedTestTypes changes
  useEffect(() => {
    setValue('selectedTestTypes', selectedTestTypes)
  }, [selectedTestTypes, setValue])

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < RegistrationStep.CONFIRMATION) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > RegistrationStep.PATIENT_INFO) {
      setCurrentStep(currentStep - 1)
    }
  }

  const markStepCompleted = (step: RegistrationStep) => {
    setCompletedSteps(prev => new Set([...prev, step]))
  }

  // Validate patient info step
  const validatePatientInfo = async () => {
    const values = watch()
    const errors = await trigger(['fullName', 'birthYear', 'gender', 'phoneNumber'])
    
    if (!values.fullName || !values.birthYear || values.gender === undefined || !values.phoneNumber) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc!')
      return false
    }
    
    if (!errors) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập!')
      return false
    }
    
    return true
  }

  // Validate service selection step
  const validateServiceSelection = () => {
    if (!selectedTestTypes || selectedTestTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ xét nghiệm!')
      return false
    }
    
    const invalidTestTypes = selectedTestTypes.filter(selected => !selected.testType.id)
    if (invalidTestTypes.length > 0) {
      toast.error('Có lỗi với dịch vụ xét nghiệm được chọn. Vui lòng thử lại!')
      return false
    }
    
    return true
  }

  // Handle step-specific actions
  const handleStepAction = async () => {
    if (currentStep === RegistrationStep.PATIENT_INFO) {
      const isValid = await validatePatientInfo()
      if (isValid) {
        markStepCompleted(RegistrationStep.PATIENT_INFO)
        goToNextStep()
      }
    } else if (currentStep === RegistrationStep.SERVICE_SELECTION) {
      const isValid = validateServiceSelection()
      if (isValid) {
        markStepCompleted(RegistrationStep.SERVICE_SELECTION)
        goToNextStep()
      }
    } else if (currentStep === RegistrationStep.CONFIRMATION) {
      await handleSubmit(onSubmit, onError)()
    }
  }

  const onSubmit = async (data: PatientForm) => {
    console.log('Form data being submitted:', data)
    setIsSubmitting(true)
    
    try {
      // Final validation
      if (!selectedTestTypes || selectedTestTypes.length === 0) {
        toast.error('Vui lòng chọn ít nhất một dịch vụ xét nghiệm!')
        return
      }

      // Create typeTests array for API
      const typeTests: PatientTestDTO[] = selectedTestTypes.map(selected => ({
        testId: selected.testType.id!,
        testSampleId: selected.selectedSampleId,
        testSampleName: selected.selectedSampleName
      }))

      // Create patient data in the format expected by API
      const patientData = {
        fullName: data.fullName.trim(),
        birthYear: data.birthYear, // YYYY-MM-DD format from date input
        gender: Number(data.gender), // Ensure it's a number
        address: data.address?.trim() || "",
        phoneNumber: data.phoneNumber.trim(),
        reasonForVisit: data.reasonForVisit?.trim() || "",
        referralSourceId: data.referralSourceId || 0,
        email: data.email?.trim() || "",
        guardianName: data.guardianName?.trim() || "",
        guardianRelationship: data.guardianRelationship?.trim() || "",
        guardianPhoneNumber: data.guardianPhoneNumber?.trim() || "",
        typeTests: typeTests
      }
      
      console.log('Patient data being sent to API:', patientData)
      console.log('TypeTests structure:', JSON.stringify(typeTests, null, 2))
      console.log('Full payload structure check:', {
        ...patientData,
        typeTestsCount: typeTests.length,
        samplePayloadExample: typeTests[0] || 'No tests selected'
      })
      const response = await patientsApi.create(patientData)
      console.log('API response:', response)
      toast.success(`Đã đăng ký bệnh nhân thành công!`)
      reset()
      setSelectedTestTypes([])
      setCurrentStep(RegistrationStep.PATIENT_INFO)
      setCompletedSteps(new Set())
    } catch (error: any) {
      console.error('Error creating patient:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error message:', error.message)
      
      // Show specific error from API if available
      if (error.response?.data?.message) {
        toast.error(`Lỗi: ${error.response.data.message}`)
      } else if (error.response?.data?.error) {
        toast.error(`Lỗi: ${error.response.data.error}`)
      } else {
        toast.error('Có lỗi xảy ra khi đăng ký bệnh nhân. Vui lòng thử lại!')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onError = (errors: any) => {
    console.log('Form validation errors:', errors)
    
    // Debug: Log specific errors
    Object.keys(errors).forEach(fieldName => {
      console.log(`Field ${fieldName} error:`, errors[fieldName].message)
    })
    
    // Show specific error messages
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error(firstError.message)
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập!')
    }
  }

  const handleSearchExistingPatient = async () => {
    if (!searchQuery.trim()) return

    try {
      setIsSearching(true)
      const response = await patientsApi.getAll({
        keyword: searchQuery,
        status: 1, // Active patients only
        pageIndex: 0,
        pageSize: 10,
        // orderCol: 'fullName',
        isDesc: false
      })
      
      setSearchResults(response.content)
    } catch (error) {
      console.error('Error searching patients:', error)
      toast.error('Có lỗi xảy ra khi tìm kiếm bệnh nhân')
    } finally {
      setIsSearching(false)
    }
  }

  const fillPatientData = (patient: PatientAPI) => {
    setValue('fullName', patient.fullName)
    setValue('birthYear', patient.birthYear)
    setValue('gender', patient.gender)
    setValue('phoneNumber', patient.phoneNumber)
    setValue('email', patient.email || '')
    setValue('address', patient.address || '')
    setValue('reasonForVisit', patient.reasonForVisit || '')
    setValue('referralSourceId', patient.referralSourceId || undefined)
    setValue('guardianName', patient.guardianName || '')
    setValue('guardianPhoneNumber', patient.guardianPhoneNumber || '')
    setValue('guardianRelationship', patient.guardianRelationship || '')
    setSearchResults([])
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ''
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return (age - 1).toString()
    }
    return age.toString()
  }

  // Filter test types based on search
  const filteredTestTypes = testTypes.filter(testType => 
    testType.name.toLowerCase().includes(searchTestQuery.toLowerCase()) ||
    testType.code.toLowerCase().includes(searchTestQuery.toLowerCase())
  )

  // Add test type to selection
  const addTestType = (testType: TestType) => {
    // Check if already selected
    if (selectedTestTypes.some(selected => selected.testType.id === testType.id)) {
      toast.error('Dịch vụ xét nghiệm này đã được chọn!')
      return
    }

    // Get available samples for this test type
    const availableSamples = testType.testSamples || []
    
    if (availableSamples.length === 0) {
      // If no predefined samples, use all available samples
      if (testSamples.length === 0) {
        toast.error('Hệ thống chưa có mẫu xét nghiệm nào!')
        return
      }
      
      // Use first available sample as default
      const defaultSample = testSamples[0]
      const newSelection: SelectedTestType = {
        testType,
        selectedSampleId: defaultSample.id!,
        selectedSampleName: defaultSample.name
      }
      setSelectedTestTypes(prev => [...prev, newSelection])
    } else {
      // Use first predefined sample
      const defaultSample = availableSamples[0]
      const newSelection: SelectedTestType = {
        testType,
        selectedSampleId: defaultSample.id,
        selectedSampleName: defaultSample.sampleName
      }
      setSelectedTestTypes(prev => [...prev, newSelection])
    }
    
    toast.success(`Đã thêm ${testType.name}`)
  }

  // Remove test type from selection
  const removeTestType = (testTypeId: number) => {
    setSelectedTestTypes(prev => prev.filter(selected => selected.testType.id !== testTypeId))
  }

  // Update sample selection for a test type
  const updateSampleSelection = (testTypeId: number, sampleId: number, sampleName: string) => {
    setSelectedTestTypes(prev => prev.map(selected => 
      selected.testType.id === testTypeId 
        ? { ...selected, selectedSampleId: sampleId, selectedSampleName: sampleName }
        : selected
    ))
  }

  const birthYear = watch('birthYear')

  // Get step title and description
  const getStepInfo = () => {
    switch (currentStep) {
      case RegistrationStep.PATIENT_INFO:
        return {
          title: 'Thông tin bệnh nhân',
          description: 'Nhập thông tin hành chính của bệnh nhân',
          icon: User
        }
      case RegistrationStep.SERVICE_SELECTION:
        return {
          title: 'Chọn dịch vụ xét nghiệm',
          description: 'Chọn các dịch vụ xét nghiệm cho bệnh nhân',
          icon: TestTube
        }
      case RegistrationStep.CONFIRMATION:
        return {
          title: 'Xác nhận đăng ký',
          description: 'Kiểm tra lại thông tin và hoàn tất đăng ký',
          icon: CheckCircle
        }
      default:
        return {
          title: 'Tiếp đón bệnh nhân',
          description: 'Đăng ký bệnh nhân mới',
          icon: User
        }
    }
  }

  const stepInfo = getStepInfo()
  const StepIcon = stepInfo.icon

  return (
    <div className="space-y-6">
      {/* Page Header with Steps */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <StepIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{stepInfo.title}</h1>
              <p className="text-blue-100">{stepInfo.description}</p>
            </div>
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep 
                      ? 'bg-white text-blue-600' 
                      : completedSteps.has(step) 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/20 text-white'
                  }`}>
                    {completedSteps.has(step) ? <CheckCircle size={16} /> : step}
                  </div>
                  {step < 3 && <ChevronRight size={16} className="mx-2 text-white/60" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Bước {currentStep} / 3</span>
          <span>{Math.round((currentStep / 3) * 100)}% hoàn thành</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Patient Information */}
      {currentStep === RegistrationStep.PATIENT_INFO && (
        <>
          {/* Search Existing Patient */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search size={20} className="text-blue-600" />
                <span>Tìm kiếm bệnh nhân đã có</span>
              </CardTitle>
              <CardDescription>
                Tìm kiếm theo tên, số điện thoại
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Nhập thông tin tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchExistingPatient()}
                      className="text-lg"
                    />
                  </div>
                  <Button 
                    onClick={handleSearchExistingPatient}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6"
                  >
                    {isSearching ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Search size={16} className="mr-2" />
                    )}
                    Tìm kiếm
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <div className="p-3 bg-gray-50 border-b font-medium">
                      Kết quả tìm kiếm ({searchResults.length})
                    </div>
                    {searchResults.map(patient => (
                      <div 
                        key={patient.id}
                        className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => fillPatientData(patient)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{patient.fullName}</div>
                            <div className="text-sm text-gray-600">
                              SĐT: {patient.phoneNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              Sinh: {new Date(patient.birthYear).toLocaleDateString('vi-VN')} • 
                              Giới tính: {getGenderLabel(patient.gender)}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Chọn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patient Registration Form */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User size={20} className="text-green-600" />
                <span>Thông tin bệnh nhân</span>
              </CardTitle>
              <CardDescription>
                Điền đầy đủ thông tin hành chính của bệnh nhân
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center space-x-2">
                      <User size={16} />
                      <span>Họ và tên *</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Nguyễn Văn A"
                      {...register('fullName')}
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthYear" className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>Ngày sinh *</span>
                    </Label>
                    <Input
                      id="birthYear"
                      type="date"
                      {...register('birthYear')}
                      className={errors.birthYear ? 'border-red-500' : ''}
                    />
                    {birthYear && (
                      <p className="text-sm text-green-600">
                        Tuổi: {calculateAge(birthYear)}
                      </p>
                    )}
                    {errors.birthYear && (
                      <p className="text-sm text-red-500">{errors.birthYear.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="flex items-center space-x-2">
                      <Users size={16} />
                      <span>Giới tính *</span>
                    </Label>
                    <select
                      id="gender"
                      {...register('gender', { 
                        setValueAs: (value) => value === '' ? undefined : Number(value)
                      })}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.gender ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value={0}>Nữ</option>
                      <option value={1}>Nam</option>
                      <option value={2}>Khác</option>
                    </select>
                    {errors.gender && (
                      <p className="text-sm text-red-500">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center space-x-2">
                      <Phone size={16} />
                      <span>Số điện thoại *</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      placeholder="0123456789"
                      {...register('phoneNumber')}
                      className={errors.phoneNumber ? 'border-red-500' : ''}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail size={16} />
                      <span>Email</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Address and Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center space-x-2">
                      <MapPin size={16} />
                      <span>Địa chỉ</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                      {...register('address')}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reasonForVisit">Lý do khám</Label>
                    <Input
                      id="reasonForVisit"
                      placeholder="Lý do đến khám..."
                      {...register('reasonForVisit')}
                    />
                  </div>
                </div>

                {/* Referral Source */}
                <div className="space-y-2">
                  <Label htmlFor="referralSourceId">Nguồn gửi</Label>
                  <select
                    id="referralSourceId"
                    {...register('referralSourceId', { 
                      setValueAs: (value) => {
                        if (value === '' || value === null || value === undefined) {
                          return undefined
                        }
                        const numValue = Number(value)
                        return isNaN(numValue) ? undefined : numValue
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={loadingReferralSources}
                  >
                    <option value="">Chọn nguồn gửi</option>
                    {(() => {
                      // Handle case where referralSources might be the whole response object
                      let sources = referralSources
                      const refSourcesAny = referralSources as any
                      
                      // Try nested structure first: referralSources.content.content
                      if (refSourcesAny?.content?.content && Array.isArray(refSourcesAny.content.content)) {
                        sources = refSourcesAny.content.content
                      }
                      // Then try single nested: referralSources.content
                      else if (refSourcesAny?.content && Array.isArray(refSourcesAny.content)) {
                        sources = refSourcesAny.content
                      }
                      
                      if (Array.isArray(sources)) {
                        return sources.map((source: any) => (
                          <option key={source.id} value={source.id}>
                            {source.name} ({source.code})
                          </option>
                        ))
                      }
                      return null
                    })()}
                  </select>
                  {loadingReferralSources && (
                    <p className="text-sm text-gray-500">Đang tải nguồn gửi...</p>
                  )}
                </div>

                {/* Guardian Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Thông tin người giám hộ (nếu có)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Họ tên người giám hộ</Label>
                      <Input
                        id="guardianName"
                        placeholder="Nguyễn Thị B"
                        {...register('guardianName')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guardianPhoneNumber">Số điện thoại</Label>
                      <Input
                        id="guardianPhoneNumber"
                        placeholder="0987654321"
                        {...register('guardianPhoneNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guardianRelationship">Mối quan hệ</Label>
                      <Input
                        id="guardianRelationship"
                        placeholder="Cha/mẹ, vợ/chồng..."
                        {...register('guardianRelationship')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 2: Service Selection */}
      {currentStep === RegistrationStep.SERVICE_SELECTION && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube size={20} className="text-green-600" />
              <span>Chọn dịch vụ xét nghiệm *</span>
            </CardTitle>
            <CardDescription>
              Chọn các dịch vụ xét nghiệm cho bệnh nhân
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Test Types */}
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Tìm kiếm dịch vụ xét nghiệm..."
                    value={searchTestQuery}
                    onChange={(e) => setSearchTestQuery(e.target.value)}
                    className="text-lg"
                  />
                </div>
              </div>

              {/* Available Test Types */}
              <div className="border rounded-lg">
                <div className="p-3 bg-gray-50 border-b font-medium">
                  Dịch vụ xét nghiệm có sẵn
                  {loadingTestTypes && <span className="ml-2 text-sm text-gray-500">(Đang tải...)</span>}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredTestTypes.map(testType => (
                    <div 
                      key={testType.id}
                      className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => addTestType(testType)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{testType.name}</div>
                          <div className="text-sm text-gray-600">
                            Mã: {testType.code} • Giá: {testType.price?.toLocaleString('vi-VN')} VNĐ
                          </div>
                          {testType.description && (
                            <div className="text-sm text-gray-500">{testType.description}</div>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          <Plus size={16} className="mr-1" />
                          Thêm
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!loadingTestTypes && filteredTestTypes.length === 0 && (
                    <div className="p-3 text-center text-gray-500">
                      Không tìm thấy dịch vụ xét nghiệm phù hợp
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Test Types */}
              {selectedTestTypes.length > 0 && (
                <div className="border rounded-lg">
                  <div className="p-3 bg-green-50 border-b font-medium text-green-800">
                    Dịch vụ đã chọn ({selectedTestTypes.length})
                  </div>
                  <div className="space-y-2 p-3">
                    {selectedTestTypes.map((selected, index) => (
                      <div key={`${selected.testType.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{selected.testType.name}</div>
                          <div className="text-sm text-gray-600">
                            Mã: {selected.testType.code} • Giá: {selected.testType.price?.toLocaleString('vi-VN')} VNĐ
                          </div>
                          <div className="mt-2">
                            <Label className="text-sm font-medium">Mẫu xét nghiệm:</Label>
                            <select
                              value={selected.selectedSampleId}
                              onChange={(e) => {
                                const sampleId = Number(e.target.value)
                                const sample = testSamples.find(s => s.id === sampleId) || 
                                             selected.testType.testSamples?.find(s => s.id === sampleId)
                                const sampleName = sample ? (sample as any).name || (sample as any).sampleName : ''
                                updateSampleSelection(selected.testType.id!, sampleId, sampleName)
                              }}
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              {/* Predefined samples for this test type */}
                              {selected.testType.testSamples?.map(sample => (
                                <option key={sample.id} value={sample.id}>
                                  {sample.sampleName}
                                </option>
                              ))}
                              {/* All available samples if no predefined samples */}
                              {(!selected.testType.testSamples || selected.testType.testSamples.length === 0) && 
                                testSamples.map(sample => (
                                  <option key={sample.id} value={sample.id}>
                                    {sample.name}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeTestType(selected.testType.id!)}
                          className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="font-semibold text-lg">
                        Tổng cộng: {selectedTestTypes.reduce((sum, selected) => sum + (selected.testType.price || 0), 0).toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTestTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TestTube size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Chưa chọn dịch vụ xét nghiệm nào</p>
                  <p className="text-sm">Vui lòng chọn ít nhất một dịch vụ để tiếp tục</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === RegistrationStep.CONFIRMATION && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle size={20} className="text-green-600" />
              <span>Xác nhận đăng ký</span>
            </CardTitle>
            <CardDescription>
              Kiểm tra lại thông tin và hoàn tất đăng ký
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Patient Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Thông tin bệnh nhân</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Họ tên:</span> {watch('fullName')}</div>
                  <div><span className="font-medium">Ngày sinh:</span> {watch('birthYear') ? new Date(watch('birthYear')).toLocaleDateString('vi-VN') : ''}</div>
                  <div><span className="font-medium">Giới tính:</span> {watch('gender') !== undefined ? getGenderLabel(watch('gender')) : ''}</div>
                  <div><span className="font-medium">Số điện thoại:</span> {watch('phoneNumber')}</div>
                  {watch('email') && <div><span className="font-medium">Email:</span> {watch('email')}</div>}
                  {watch('address') && <div><span className="font-medium">Địa chỉ:</span> {watch('address')}</div>}
                </div>
              </div>

              {/* Services Summary */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">Dịch vụ xét nghiệm đã chọn</h3>
                <div className="space-y-2">
                  {selectedTestTypes.map((selected, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-green-200 last:border-b-0">
                      <div>
                        <div className="font-medium">{selected.testType.name}</div>
                        <div className="text-sm text-gray-600">
                          Mẫu: {selected.selectedSampleName} • Mã: {selected.testType.code}
                        </div>
                      </div>
                      <div className="font-medium">
                        {selected.testType.price?.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-green-300 flex justify-between items-center font-bold text-lg">
                    <span>Tổng cộng:</span>
                    <span>{selectedTestTypes.reduce((sum, selected) => sum + (selected.testType.price || 0), 0).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === RegistrationStep.PATIENT_INFO}
          className="flex items-center space-x-2"
        >
          <ChevronLeft size={16} />
          <span>Quay lại</span>
        </Button>

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              setSelectedTestTypes([])
              setCurrentStep(RegistrationStep.PATIENT_INFO)
              setCompletedSteps(new Set())
            }}
            disabled={isSubmitting}
          >
            Xóa form
          </Button>

          <Button
            type="button"
            onClick={handleStepAction}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : currentStep === RegistrationStep.CONFIRMATION ? (
              <>
                <CheckCircle size={16} />
                <span>Hoàn tất đăng ký</span>
              </>
            ) : (
              <>
                <span>Tiếp tục</span>
                <ChevronRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PatientRegistration 