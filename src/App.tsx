import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

// Reception pages
import PatientRegistration from '@/pages/Reception/PatientRegistration'
import ServiceSelection from '@/pages/Reception/ServiceSelection'
import ReferralSources from '@/pages/Reception/ReferralSources'
import PatientList from '@/pages/Reception/PatientList'

// Lab pages
import PatientInfo from '@/pages/Lab/PatientInfo'
import SampleStatus from '@/pages/Lab/SampleStatus'
import TestResults from '@/pages/Lab/TestResults'
import SupplyManagement from '@/pages/Lab/SupplyManagement'
import SampleManagement from '@/pages/Lab/SampleManagement'
import LabStatistics from '@/pages/Lab/Statistics'

// Finance pages
import FinancialReports from '@/pages/Finance/FinancialReports'
import InvoicePayments from '@/pages/Finance/InvoicePayments'
import SupplierManagement from '@/pages/Finance/SupplierManagement'

// Admin pages
import UserManagement from '@/pages/Admin/UserManagement'
import SystemHistory from '@/pages/Admin/SystemHistory'

// Other pages (placeholder for now)
// import Lab from '@/pages/Lab'
// import Accounting from '@/pages/Accounting'
// import Services from '@/pages/Services'
// import Reports from '@/pages/Reports'
// import Settings from '@/pages/Settings'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            
            {/* Reception routes */}
            <Route path="reception">
              <Route 
                index
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <PatientRegistration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="patient-registration"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <PatientRegistration />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="service-selection"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <ServiceSelection />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="referral-sources"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                    <ReferralSources />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Patients routes */}
            <Route 
              path="patients" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist', 'lab_technician']}>
                  <PatientList />
                </ProtectedRoute>
              } 
            />
            
            {/* Lab routes */}
            <Route path="lab">
              <Route 
                index
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician']}>
                    <PatientInfo />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="patient-info"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician']}>
                    <PatientInfo />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="sample-status"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician']}>
                    <SampleStatus />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="test-results"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician']}>
                    <TestResults />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="supply-management"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician']}>
                    <SupplyManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="sample-management"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician']}>
                    <SampleManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="statistics"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'lab_technician']}>
                    <LabStatistics />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Finance routes */}
            <Route path="finance">
              <Route 
                index
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                    <FinancialReports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="financial-reports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                    <FinancialReports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="invoice-payments"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                    <InvoicePayments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="supplier-management"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                    <SupplierManagement />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Services routes */}
            <Route 
              path="services" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Dịch vụ xét nghiệm</h1>
                    <p className="text-gray-600 mt-2">Trang này đang được phát triển...</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            {/* Reports routes */}
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Báo cáo & Thống kê</h1>
                    <p className="text-gray-600 mt-2">Trang này đang được phát triển...</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route path="admin">
              <Route 
                index
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="user-management"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="system-history"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SystemHistory />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  )
}

export default App
