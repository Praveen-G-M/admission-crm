import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Building2, Users, BookOpen, Settings,
  LogOut, ChevronDown, ChevronRight, GraduationCap, FileCheck,
  ClipboardList, UserCheck, Menu, X
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard', icon: LayoutDashboard, path: '/',
    roles: ['Admin', 'AdmissionOfficer', 'Management']
  },
  {
    label: 'Master Setup', icon: Settings,
    roles: ['Admin'],
    children: [
      { label: 'Institutions', path: '/master/institutions', icon: Building2 },
      { label: 'Campuses', path: '/master/campuses', icon: Building2 },
      { label: 'Departments', path: '/master/departments', icon: Building2 },
      { label: 'Programs', path: '/master/programs', icon: BookOpen },
      { label: 'Academic Years', path: '/master/academic-years', icon: ClipboardList },
    ]
  },
  {
    label: 'Seat Matrix', icon: ClipboardList, path: '/seat-matrix',
    roles: ['Admin', 'AdmissionOfficer']
  },
  {
    label: 'Applicants', icon: Users, path: '/applicants',
    roles: ['Admin', 'AdmissionOfficer']
  },
  {
    label: 'Admissions', icon: GraduationCap, path: '/admissions',
    roles: ['Admin', 'AdmissionOfficer']
  },
  {
    label: 'Seat Allocation', icon: UserCheck, path: '/allocation',
    roles: ['Admin', 'AdmissionOfficer']
  },
  {
    label: 'Documents', icon: FileCheck, path: '/documents',
    roles: ['Admin', 'AdmissionOfficer']
  },
]

function NavItem({ item, userRole, collapsed }) {
  const [open, setOpen] = useState(false)

  if (!item.roles.includes(userRole)) return null

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <item.icon size={18} />
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
          {!collapsed && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>
        {open && !collapsed && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map(child => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <child.icon size={15} />
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <item.icon size={18} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">AdmissionCRM</p>
            <p className="text-xs text-gray-400 truncate">Edumerge</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-400 hover:text-gray-600"
        >
          {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item, i) => (
          <NavItem key={i} item={item} userRole={user?.role} collapsed={collapsed} />
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <div className={`flex items-center gap-3 px-2 py-2 mb-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 text-xs font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  )
}
