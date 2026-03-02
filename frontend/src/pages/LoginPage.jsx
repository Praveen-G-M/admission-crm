import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      login(data.token, { fullName: data.fullName, role: data.role, userId: data.userId })
      toast.success(`Welcome back, ${data.fullName}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (role) => {
    const creds = { Admin: 'admin', AdmissionOfficer: 'officer1', Management: 'mgmt1' }
    setForm({ username: creds[role], password: 'Admin@123' })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 to-primary-900 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AdmissionCRM</h1>
              <p className="text-primary-200 text-sm">Edumerge Platform</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">Admission Management System</h2>
          <p className="text-primary-200 text-lg leading-relaxed">
            Streamline college admissions with quota-wise seat control, real-time tracking, and automated admission numbering.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Quota Control', desc: 'KCET / COMEDK / Management' },
              { label: 'Real-time Seats', desc: 'Live counter per quota' },
              { label: 'Auto Numbering', desc: 'Unique admission IDs' },
              { label: 'Document Tracking', desc: 'Full verification flow' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold">{f.label}</p>
                <p className="text-primary-200 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">Access the admission management portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPwd(!showPwd)}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-center text-gray-500 mb-3">Quick demo access</p>
              <div className="grid grid-cols-3 gap-2">
                {['Admin', 'AdmissionOfficer', 'Management'].map(role => (
                  <button
                    key={role}
                    onClick={() => demoLogin(role)}
                    className="text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    {role === 'AdmissionOfficer' ? 'Officer' : role}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">Password: Admin@123</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}
