import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { testSamplesApi, testTypesApi, patientsApi, patientSamplesApi } from '@/services/api'
import type { TestSample, TestType, PatientAPI } from '@/types/api'

interface PatientTestSelection {
  patientId: number
  testTypes: {
    testTypeId: number
    testTypeName: string
    availableSamples: TestSample[]
    selectedSampleId: number
    priority: string
  }[]
}

const SampleManagement: React.FC = () => {
  const [testSamples, setTestSamples] = useState<TestSample[]>([])
  const [testTypes, setTestTypes] = useState<TestType[]>([])
  const [patients, setPatients] = useState<PatientAPI[]>([])
  const [patientSamples, setPatientSamples] = useState<PatientAPI[]>([])
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Form states for creating test samples
  const [newSampleName, setNewSampleName] = useState('')
  
  // Form states for creating test types
  const [newTestTypeName, setNewTestTypeName] = useState('')
  const [newTestTypePrice, setNewTestTypePrice] = useState(0)
  const [selectedSamplesForTestType, setSelectedSamplesForTestType] = useState<number[]>([])
  
  // Patient selection state
  const [selectedPatient, setSelectedPatient] = useState<number>(0)
  const [patientTestSelections, setPatientTestSelections] = useState<PatientTestSelection[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [samplesData, testTypesData, patientsData, patientSamplesData] = await Promise.all([
        testSamplesApi.getAll({ pageIndex: 0, pageSize: 100 }),
        testTypesApi.getAll({ pageIndex: 0, pageSize: 100 }),
        patientsApi.getAll({ pageIndex: 0, pageSize: 100 }),
        patientSamplesApi.getAll({ pageIndex: 0, pageSize: 100 })
      ])
      
      setTestSamples(samplesData.content)
      setTestTypes(testTypesData.content)
      setPatients(patientsData.content)
      setPatientSamples(patientSamplesData.content)
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage('Lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  // Tạo mẫu xét nghiệm mặc định
  const createDefaultSamples = async () => {
    try {
      setLoading(true)
      const defaultSamples = [
        { name: 'Nước tiểu' },
        { name: 'Máu' },
        { name: 'MXN1' },
        { name: 'MXN2' }
      ]
      
      for (const sample of defaultSamples) {
        await testSamplesApi.create({
          name: sample.name
        })
      }
      
      setMessage('Đã tạo thành công các mẫu xét nghiệm mặc định!')
      await loadInitialData()
    } catch (error) {
      console.error('Error creating default samples:', error)
      setMessage('Lỗi khi tạo mẫu xét nghiệm mặc định')
    } finally {
      setLoading(false)
    }
  }

  // Tạo loại xét nghiệm mặc định
  const createDefaultTestTypes = async () => {
    try {
      setLoading(true)
      
      // Tìm các mẫu đã tạo
      const urineS = testSamples.find(s => s.name === 'Nước tiểu')
      const bloodS = testSamples.find(s => s.name === 'Máu')
      const mxn1S = testSamples.find(s => s.name === 'MXN1')
      const mxn2S = testSamples.find(s => s.name === 'MXN2')
      
      if (!urineS || !bloodS || !mxn1S || !mxn2S) {
        setMessage('Cần tạo mẫu xét nghiệm trước')
        return
      }
      
      // Tạo XN1: (MXN1, MXN2)
      await testTypesApi.create({
        code: 'XN1',
        name: 'Xét nghiệm 1',
        description: 'Loại xét nghiệm 1 - sử dụng MXN1 hoặc MXN2',
        price: 200000,
        status: 1, // Active
        testSampleIds: [mxn1S.id!, mxn2S.id!]
      })
      
      // Tạo XN2: (Nước tiểu, Máu, MXN1)
      await testTypesApi.create({
        code: 'XN2',
        name: 'Xét nghiệm 2',
        description: 'Loại xét nghiệm 2 - sử dụng Nước tiểu, Máu hoặc MXN1',
        price: 150000,
        status: 1, // Active
        testSampleIds: [urineS.id!, bloodS.id!, mxn1S.id!]
      })
      
      setMessage('Đã tạo thành công các loại xét nghiệm mặc định!')
      await loadInitialData()
    } catch (error) {
      console.error('Error creating default test types:', error)
      setMessage('Lỗi khi tạo loại xét nghiệm mặc định')
    } finally {
      setLoading(false)
    }
  }

  // Tạo mẫu xét nghiệm mới
  const createTestSample = async () => {
    if (!newSampleName) {
      setMessage('Vui lòng nhập tên mẫu')
      return
    }
    
    try {
      setLoading(true)
      await testSamplesApi.create({
        name: newSampleName
      })
      
      setNewSampleName('')
      setMessage('Đã tạo mẫu xét nghiệm thành công!')
      await loadInitialData()
    } catch (error) {
      console.error('Error creating test sample:', error)
      setMessage('Lỗi khi tạo mẫu xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  // Tạo loại xét nghiệm mới
  const createTestType = async () => {
    if (!newTestTypeName || selectedSamplesForTestType.length === 0) {
      setMessage('Vui lòng nhập tên loại xét nghiệm và chọn ít nhất 1 mẫu')
      return
    }
    
    try {
      setLoading(true)
      
      await testTypesApi.create({
        code: newTestTypeName.toUpperCase().replace(/\s/g, '_'),
        name: newTestTypeName,
        description: `Loại xét nghiệm ${newTestTypeName}`,
        price: newTestTypePrice,
        status: 1, // Active
        testSampleIds: selectedSamplesForTestType
      })
      
      setNewTestTypeName('')
      setNewTestTypePrice(0)
      setSelectedSamplesForTestType([])
      setMessage('Đã tạo loại xét nghiệm thành công!')
      await loadInitialData()
    } catch (error) {
      console.error('Error creating test type:', error)
      setMessage('Lỗi khi tạo loại xét nghiệm')
    } finally {
      setLoading(false)
    }
  }

  // Thêm lựa chọn xét nghiệm cho bệnh nhân
  const addTestSelectionForPatient = () => {
    if (!selectedPatient) {
      setMessage('Vui lòng chọn bệnh nhân')
      return
    }
    
    const patient = patients.find(p => p.id === selectedPatient)
    if (!patient) return
    
    const existing = patientTestSelections.find(pts => pts.patientId === selectedPatient)
    if (existing) {
      setMessage('Bệnh nhân này đã có trong danh sách')
      return
    }
    
    setPatientTestSelections(prev => [...prev, {
      patientId: selectedPatient,
      testTypes: []
    }])
    
    setSelectedPatient(0)
  }

  // Thêm loại xét nghiệm cho bệnh nhân
  const addTestTypeToPatient = (patientId: number, testTypeId: number) => {
    const testType = testTypes.find(tt => tt.id === testTypeId)
    if (!testType || !testType.testSampleIds || testType.testSampleIds.length === 0) {
      setMessage('Loại xét nghiệm không hợp lệ hoặc không có mẫu')
      return
    }
    
    // Get available samples for this test type
    const availableSamples = testSamples.filter(s => testType.testSampleIds.includes(s.id!))
    
    setPatientTestSelections(prev => prev.map(pts => {
      if (pts.patientId === patientId) {
        const existing = pts.testTypes.find(tt => tt.testTypeId === testTypeId)
        if (existing) {
          setMessage('Loại xét nghiệm này đã được thêm cho bệnh nhân')
          return pts
        }
        
        return {
          ...pts,
          testTypes: [...pts.testTypes, {
            testTypeId,
            testTypeName: testType.name,
            availableSamples,
            selectedSampleId: 0,
            priority: 'NORMAL'
          }]
        }
      }
      return pts
    }))
  }

  // Cập nhật lựa chọn mẫu cho loại xét nghiệm
  const updateSampleSelection = (patientId: number, testTypeId: number, sampleId: number) => {
    setPatientTestSelections(prev => prev.map(pts => {
      if (pts.patientId === patientId) {
        return {
          ...pts,
          testTypes: pts.testTypes.map(tt => {
            if (tt.testTypeId === testTypeId) {
              return { ...tt, selectedSampleId: sampleId }
            }
            return tt
          })
        }
      }
      return pts
    }))
  }

  // Tạo mẫu cho bệnh nhân
  const createSamplesForPatients = async () => {
    try {
      setLoading(true)
      
      for (const pts of patientTestSelections) {
        const validTestTypes = pts.testTypes.filter(tt => tt.selectedSampleId)
        
        if (validTestTypes.length === 0) {
          setMessage(`Bệnh nhân ${patients.find(p => p.id === pts.patientId)?.fullName} chưa chọn mẫu cho bất kỳ loại xét nghiệm nào`)
          return
        }
        
        const sampleData = {
          patientId: pts.patientId,
          testTypes: validTestTypes.map(tt => ({
            testTypeId: tt.testTypeId,
            selectedSampleId: tt.selectedSampleId,
            priority: tt.priority
          }))
        }
        
        await patientSamplesApi.createSamplesForPatient(sampleData)
      }
      
      setMessage('Đã tạo mẫu cho tất cả bệnh nhân thành công!')
      setPatientTestSelections([])
      await loadInitialData()
    } catch (error) {
      console.error('Error creating patient samples:', error)
      setMessage('Lỗi khi tạo mẫu cho bệnh nhân')
    } finally {
      setLoading(false)
    }
  }

  const removePatientSelection = (patientId: number) => {
    setPatientTestSelections(prev => prev.filter(pts => pts.patientId !== patientId))
  }

  const removeTestTypeFromPatient = (patientId: number, testTypeId: number) => {
    setPatientTestSelections(prev => prev.map(pts => {
      if (pts.patientId === patientId) {
        return {
          ...pts,
          testTypes: pts.testTypes.filter(tt => tt.testTypeId !== testTypeId)
        }
      }
      return pts
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý mẫu xét nghiệm</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Thiết lập nhanh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={createDefaultSamples}
              disabled={loading}
              variant="outline"
            >
              Tạo mẫu xét nghiệm mặc định
            </Button>
            <Button 
              onClick={createDefaultTestTypes}
              disabled={loading}
              variant="outline"
            >
              Tạo loại xét nghiệm mặc định
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Tạo nhanh: Nước tiểu, Máu, MXN1, MXN2 và 2 loại xét nghiệm XN1, XN2
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tạo mẫu xét nghiệm */}
        <Card>
          <CardHeader>
            <CardTitle>Tạo mẫu xét nghiệm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sampleName">Tên mẫu</Label>
              <Input
                id="sampleName"
                value={newSampleName}
                onChange={(e) => setNewSampleName(e.target.value)}
                placeholder="Nhập tên mẫu xét nghiệm"
              />
            </div>
            <Button onClick={createTestSample} disabled={loading}>
              Tạo mẫu
            </Button>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Danh sách mẫu hiện có ({testSamples.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {testSamples.map(sample => (
                  <div key={sample.id} className="text-sm p-2 bg-gray-50 rounded">
                    <span className="font-medium">{sample.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tạo loại xét nghiệm */}
        <Card>
          <CardHeader>
            <CardTitle>Tạo loại xét nghiệm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testTypeName">Tên loại xét nghiệm</Label>
              <Input
                id="testTypeName"
                value={newTestTypeName}
                onChange={(e) => setNewTestTypeName(e.target.value)}
                placeholder="Nhập tên loại xét nghiệm"
              />
            </div>
            <div>
              <Label htmlFor="testTypePrice">Giá</Label>
              <Input
                id="testTypePrice"
                type="number"
                value={newTestTypePrice}
                onChange={(e) => setNewTestTypePrice(Number(e.target.value))}
                placeholder="Nhập giá xét nghiệm"
              />
            </div>
            <div>
              <Label>Chọn mẫu xét nghiệm</Label>
              <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
                {testSamples.map(sample => (
                  <label key={sample.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedSamplesForTestType.includes(sample.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSamplesForTestType(prev => [...prev, sample.id!])
                        } else {
                          setSelectedSamplesForTestType(prev => prev.filter(id => id !== sample.id))
                        }
                      }}
                    />
                    <span className="text-sm">{sample.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={createTestType} disabled={loading}>
              Tạo loại xét nghiệm
            </Button>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Danh sách loại xét nghiệm ({testTypes.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {testTypes.map(testType => (
                  <div key={testType.id} className="text-sm p-2 bg-gray-50 rounded">
                    <span className="font-medium">{testType.name}</span> - {testType.price?.toLocaleString('vi-VN')} VND
                    <div className="text-xs text-gray-600 mt-1">
                      Mẫu: {testType.testSampleIds?.map(sampleId => 
                        testSamples.find(s => s.id === sampleId)?.name
                      ).filter(Boolean).join(', ') || 'Chưa có mẫu'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tạo bệnh nhân xét nghiệm */}
      <Card>
        <CardHeader>
          <CardTitle>Đăng ký xét nghiệm cho bệnh nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <select
              value={selectedPatient || ''}
              onChange={(e) => setSelectedPatient(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn bệnh nhân</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName} - {patient.phoneNumber}
                </option>
              ))}
            </select>
            <Button onClick={addTestSelectionForPatient} disabled={loading}>
              Thêm bệnh nhân
            </Button>
          </div>

          {/* Danh sách bệnh nhân đã chọn */}
          {patientTestSelections.map((pts) => {
            const patient = patients.find(p => p.id === pts.patientId)
            return (
              <div key={pts.patientId} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{patient?.fullName}</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removePatientSelection(pts.patientId)}
                  >
                    Xóa
                  </Button>
                </div>
                
                {/* Thêm loại xét nghiệm */}
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    onChange={(e) => {
                      if (e.target.value) {
                        addTestTypeToPatient(pts.patientId, Number(e.target.value))
                        e.target.value = '' // Reset selection
                      }
                    }}
                  >
                    <option value="">Chọn loại xét nghiệm</option>
                    {testTypes.map(testType => (
                      <option key={testType.id} value={testType.id}>
                        {testType.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Danh sách xét nghiệm đã chọn */}
                {pts.testTypes.map((tt) => (
                  <div key={tt.testTypeId} className="bg-gray-50 p-3 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{tt.testTypeName}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeTestTypeFromPatient(pts.patientId, tt.testTypeId)}
                      >
                        Xóa
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Chọn mẫu (chỉ chọn 1)</Label>
                      <select
                        value={tt.selectedSampleId || ''}
                        onChange={(e) => updateSampleSelection(pts.patientId, tt.testTypeId, Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Chọn mẫu</option>
                        {tt.availableSamples.map(sample => (
                          <option key={sample.id} value={sample.id}>
                            {sample.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {patientTestSelections.length > 0 && (
            <Button onClick={createSamplesForPatients} disabled={loading} className="w-full">
              Tạo mẫu cho tất cả bệnh nhân
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Danh sách mẫu bệnh nhân */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mẫu bệnh nhân ({patientSamples.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            {patientSamples.map(patientSample => (
              <div key={patientSample.id} className="border-b py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{patientSample.fullName}</span>
                    <div className="text-sm text-gray-600 mt-1">
                      Tests: {patientSample.typeTests?.length || 0}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    Đã đăng ký
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SampleManagement 