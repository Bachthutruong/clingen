# API Usage Guide

## Configuration
API base URL: `http://pk.caduceus.vn/api/pk/v1`

## Available APIs

### 1. Authentication API
```typescript
import { authApi } from '@/services'

const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
})
```

### 2. Packaging API (Quy cách đóng gói)
```typescript
import { packagingApi } from '@/services'

const response = await packagingApi.getAll({
  page: 0,
  size: 20,
  isActive: true
})
```

### 3. Test Types API (Loại xét nghiệm)
```typescript
import { testTypesApi } from '@/services'

const response = await testTypesApi.getAll({
  page: 0,
  size: 50,
  category: 'blood'
})
```

### 4. Referral Sources API (Nguồn gửi)
```typescript
import { referralSourcesApi } from '@/services'

const response = await referralSourcesApi.getAll({
  page: 0,
  size: 20,
  type: 'hospital'
})
```

### 5. Patients API (Quản lý bệnh nhân)
```typescript
import { patientsApi } from '@/services'

// Tìm kiếm bệnh nhân với phân trang
const response = await patientsApi.getAll({
  pageIndex: 0,
  pageSize: 20,
  keyword: 'Nguyễn',
  status: 1 // Active patients only
})

// Lấy tất cả bệnh nhân (không phân trang)
const allPatients = await patientsApi.getAllWithoutPaging()

// Lấy bệnh nhân theo ID
const patient = await patientsApi.getById(123)

// Tạo bệnh nhân mới
const newPatient = await patientsApi.create({
  fullName: 'Nguyễn Văn A',
  birthYear: '1990-01-15',
  gender: 0, // 0: male, 1: female, 2: other
  phoneNumber: '0123456789',
  address: '123 Đường ABC',
  typeTests: []
})

// Cập nhật thông tin bệnh nhân
const updatedPatient = await patientsApi.update(123, {
  fullName: 'Nguyễn Văn B'
})

// Lấy lịch sử xét nghiệm
const history = await patientsApi.getHistory(123)

// Lấy danh sách xét nghiệm
const tests = await patientsApi.getTests(123)

// Lấy danh sách đăng ký
const registrations = await patientsApi.getRegistrations(123)
```

## Error Handling
All API calls automatically handle authentication and errors. Use try-catch blocks for error handling.

### 6. Materials API (Quản lý vật tư/hóa chất)
```typescript
import { materialsApi } from '@/services'

const response = await materialsApi.getAll({
  pageIndex: 0,
  pageSize: 20,
  keyword: 'thuốc thử'
})

// Tạo vật tư mới
const newMaterial = await materialsApi.create({
  name: 'Thuốc thử ABC',
  code: 'TT001',
  quantity: 100,
  packagingId: 1,
  importTime: '2024-01-01T00:00:00',
  type: 0 // 0: reagent, 1: equipment, etc.
})
```

### 7. Inventory API (Quản lý kho)
```typescript
import { inventoryApi } from '@/services'

// Nhập kho
await inventoryApi.importMaterials({
  materialId: 123,
  quantity: 50,
  expiryDate: '2025-01-01',
  note: 'Nhập kho đợt 1'
})

// Xuất kho
await inventoryApi.exportMaterials({
  materialId: 123,
  quantity: 10,
  note: 'Xuất cho lab'
})
```

### 8. Test Samples & Patient Samples API
```typescript
import { testSamplesApi, patientSamplesApi } from '@/services'

// Tạo mẫu xét nghiệm
const sample = await testSamplesApi.create({
  name: 'Nước tiểu'
})

// Tạo mẫu cho bệnh nhân
await patientSamplesApi.createSamplesForPatient({
  patientId: 123,
  testTypes: [
    { testTypeId: 1, selectedSampleId: 1 },
    { testTypeId: 2, selectedSampleId: 2 }
  ]
})
```

## React Component Example
```typescript
import React, { useState, useEffect } from 'react'
import { patientsApi } from '@/services'

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState(null)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientsApi.getAll({ 
          pageIndex: 0, 
          pageSize: 20,
          status: 1
        })
        setPatients(response)
      } catch (error) {
        console.error('Failed to fetch patients:', error)
      }
    }
    fetchPatients()
  }, [])

  return <div>Patient List Component</div>
}
``` 