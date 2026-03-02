import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InstitutionsPage from './pages/master/InstitutionsPage'
import CampusesPage from './pages/master/CampusesPage'
import DepartmentsPage from './pages/master/DepartmentsPage'
import ProgramsPage from './pages/master/ProgramsPage'
import AcademicYearsPage from './pages/master/AcademicYearsPage'
import SeatMatrixPage from './pages/SeatMatrixPage'
import ApplicantsPage from './pages/ApplicantsPage'
import ApplicantDetailPage from './pages/ApplicantDetailPage'
import AdmissionsPage from './pages/AdmissionsPage'
import AllocationPage from './pages/AllocationPage'
import DocumentsPage from './pages/DocumentsPage'

function ProtectedLayout({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/master/institutions" element={<ProtectedLayout allowedRoles={['Admin']}><InstitutionsPage /></ProtectedLayout>} />
      <Route path="/master/campuses" element={<ProtectedLayout allowedRoles={['Admin']}><CampusesPage /></ProtectedLayout>} />
      <Route path="/master/departments" element={<ProtectedLayout allowedRoles={['Admin']}><DepartmentsPage /></ProtectedLayout>} />
      <Route path="/master/programs" element={<ProtectedLayout allowedRoles={['Admin']}><ProgramsPage /></ProtectedLayout>} />
      <Route path="/master/academic-years" element={<ProtectedLayout allowedRoles={['Admin']}><AcademicYearsPage /></ProtectedLayout>} />
      <Route path="/seat-matrix" element={<ProtectedLayout allowedRoles={['Admin','AdmissionOfficer']}><SeatMatrixPage /></ProtectedLayout>} />
      <Route path="/applicants" element={<ProtectedLayout allowedRoles={['Admin','AdmissionOfficer']}><ApplicantsPage /></ProtectedLayout>} />
      <Route path="/applicants/:id" element={<ProtectedLayout allowedRoles={['Admin','AdmissionOfficer']}><ApplicantDetailPage /></ProtectedLayout>} />
      <Route path="/admissions" element={<ProtectedLayout allowedRoles={['Admin','AdmissionOfficer']}><AdmissionsPage /></ProtectedLayout>} />
      <Route path="/allocation" element={<ProtectedLayout allowedRoles={['Admin','AdmissionOfficer']}><AllocationPage /></ProtectedLayout>} />
      <Route path="/documents" element={<ProtectedLayout allowedRoles={['Admin','AdmissionOfficer']}><DocumentsPage /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
