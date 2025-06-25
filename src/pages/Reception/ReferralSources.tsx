import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Percent
} from 'lucide-react'
import type { ReferralSource } from '@/types/patient'

interface ReferralSourceForm {
  name: string
  type: 'hospital' | 'clinic' | 'doctor' | 'self' | 'other'
  contactPerson: string
  phone: string
  email: string
  address: string
  priceModifier: number
}

const ReferralSources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<ReferralSource | null>(null)
  const [formData, setFormData] = useState<ReferralSourceForm>({
    name: '',
    type: 'self',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    priceModifier: 0
  })

  // Mock data
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([
    {
      id: '1',
      name: 'Tự đến',
      type: 'self',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      priceModifier: 0,
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Bệnh viện Chợ Rẫy',
      type: 'hospital',
      contactPerson: 'BS. Nguyễn Văn A',
      phone: '028-12345678',
      email: 'choray@hospital.com',
      address: '201B Nguyễn Chí Thanh, Q.5, TP.HCM',
      priceModifier: -10,
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      name: 'Phòng khám Đa khoa ABC',
      type: 'clinic',
      contactPerson: 'BS. Trần Thị B',
      phone: '028-87654321',
      email: 'abc@clinic.com',
      address: '123 Đường ABC, Q.1, TP.HCM',
      priceModifier: -5,
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      name: 'BS. Lê Văn C - Tim mạch',
      type: 'doctor',
      contactPerson: 'BS. Lê Văn C',
      phone: '0909123456',
      email: 'levanc@doctor.com',
      address: '456 Đường XYZ, Q.3, TP.HCM',
      priceModifier: -15,
      createdAt: '2024-01-01'
    },
  ])

  const filteredSources = referralSources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (source.phone || '').includes(searchQuery)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSource) {
      // Update existing source
      setReferralSources(prev =>
        prev.map(source =>
          source.id === editingSource.id
            ? { ...source, ...formData }
            : source
        )
      )
    } else {
      // Add new source
      const newSource: ReferralSource = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      }
      setReferralSources(prev => [...prev, newSource])
    }

    // Reset form
    setFormData({
      name: '',
      type: 'self',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      priceModifier: 0
    })
    setIsFormOpen(false)
    setEditingSource(null)
  }

  const handleEdit = (source: ReferralSource) => {
    setEditingSource(source)
    setFormData({
      name: source.name,
      type: source.type,
      contactPerson: source.contactPerson || '',
      phone: source.phone || '',
      email: source.email || '',
      address: source.address || '',
      priceModifier: source.priceModifier || 0
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nguồn gửi này?')) {
      setReferralSources(prev => prev.filter(source => source.id !== id))
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'self': return 'Tự đến'
      case 'hospital': return 'Bệnh viện'
      case 'clinic': return 'Phòng khám'
      case 'doctor': return 'Bác sĩ'
      case 'other': return 'Khác'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'self': return 'bg-gray-100 text-gray-800'
      case 'hospital': return 'bg-blue-100 text-blue-800'
      case 'clinic': return 'bg-green-100 text-green-800'
      case 'doctor': return 'bg-purple-100 text-purple-800'
      case 'other': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý nguồn gửi</h1>
              <p className="text-purple-100">Danh sách các nguồn gửi bệnh nhân</p>
            </div>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-white text-purple-700 hover:bg-gray-100"
          >
            <Plus size={16} className="mr-2" />
            Thêm nguồn gửi
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nguồn gửi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Sources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSources.map(source => (
          <Card key={source.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{source.name}</CardTitle>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getTypeColor(source.type)}`}>
                    {getTypeLabel(source.type)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(source)}
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(source.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {source.contactPerson && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User size={14} />
                  <span>{source.contactPerson}</span>
                </div>
              )}
              
              {source.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone size={14} />
                  <span>{source.phone}</span>
                </div>
              )}
              
              {source.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail size={14} />
                  <span>{source.email}</span>
                </div>
              )}
              
              {source.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span className="line-clamp-2">{source.address}</span>
                </div>
              )}

              {(source.priceModifier || 0) !== 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Percent size={14} />
                  <span className={(source.priceModifier || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                    {(source.priceModifier || 0) > 0 ? '+' : ''}{source.priceModifier || 0}% giá
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredSources.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchQuery ? 'Không tìm thấy nguồn gửi phù hợp' : 'Chưa có nguồn gửi nào'}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingSource ? 'Sửa nguồn gửi' : 'Thêm nguồn gửi mới'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingSource(null)
                    setFormData({
                      name: '',
                      type: 'self',
                      contactPerson: '',
                      phone: '',
                      email: '',
                      address: '',
                      priceModifier: 0
                    })
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên nguồn gửi *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Bệnh viện ABC"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Loại nguồn gửi *</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="self">Tự đến</option>
                      <option value="hospital">Bệnh viện</option>
                      <option value="clinic">Phòng khám</option>
                      <option value="doctor">Bác sĩ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Người liên hệ</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="VD: BS. Nguyễn Văn A"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="VD: 028-12345678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="VD: contact@hospital.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceModifier">Điều chỉnh giá (%)</Label>
                  <Input
                    id="priceModifier"
                    type="number"
                    value={formData.priceModifier}
                    onChange={(e) => setFormData({ ...formData, priceModifier: parseFloat(e.target.value) || 0 })}
                    placeholder="VD: -10 (giảm 10%), 5 (tăng 5%)"
                  />
                  <p className="text-sm text-gray-500">
                    Số âm để giảm giá, số dương để tăng giá. VD: -10 = giảm 10%
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false)
                      setEditingSource(null)
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    <Save size={16} className="mr-2" />
                    {editingSource ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ReferralSources 