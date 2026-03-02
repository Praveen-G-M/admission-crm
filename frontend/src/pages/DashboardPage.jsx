import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Users, GraduationCap, FileCheck, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { dashboardApi, academicYearApi, institutionApi } from '../api'
import { StatCard, ProgressBar, Spinner, PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

const QUOTA_COLORS = { KCET: '#3b82f6', COMEDK: '#8b5cf6', Management: '#10b981', Supernumerary: '#f59e0b' }

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [seatData, setSeatData] = useState([])
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(true)
  const [academicYears, setAcademicYears] = useState([])
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    loadAcademicYears()
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [selectedYear])

  const loadAcademicYears = async () => {
    try {
      const [instRes] = await Promise.all([institutionApi.getAll()])
      if (instRes.data.length > 0) {
        const ayRes = await academicYearApi.getAll(instRes.data[0].id)
        setAcademicYears(ayRes.data)
        const current = ayRes.data.find(y => y.isCurrent)
        if (current) setSelectedYear(current.id)
      }
    } catch (err) {}
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [dashRes, seatRes, pendingRes] = await Promise.all([
        dashboardApi.get(selectedYear || undefined),
        dashboardApi.seatAvailability(selectedYear || undefined),
        dashboardApi.pendingActions()
      ])
      setData(dashRes.data)
      setSeatData(seatRes.data)
      setPending(pendingRes.data)
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  const pieData = data?.quotaSummaries?.map(q => ({
    name: q.quotaType, value: q.allocated, fill: QUOTA_COLORS[q.quotaType] || '#gray'
  })) || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Real-time admission overview"
        action={
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="input w-40"
          >
            <option value="">All Years</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Intake" value={data?.totalIntake || 0} icon={TrendingUp} color="blue" />
        <StatCard title="Admitted" value={data?.totalAdmitted || 0} icon={GraduationCap} color="purple" />
        <StatCard title="Confirmed" value={data?.totalConfirmed || 0} icon={FileCheck} color="green" />
        <StatCard title="Pending Docs" value={data?.pendingDocuments || 0} icon={AlertCircle} color="yellow" />
        <StatCard title="Fee Pending" value={data?.feePending || 0} icon={DollarSign} color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program-wise bar chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Program-wise Admission Status</h3>
          {data?.programSummaries?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.programSummaries} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="programCode" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="intake" name="Intake" fill="#dbeafe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="admitted" name="Admitted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Quota Pie */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quota Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No allocations yet</div>
          )}
        </div>
      </div>

      {/* Seat Availability */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quota-wise Seat Availability</h3>
        {data?.quotaSummaries?.length > 0 ? (
          <div className="space-y-4">
            {data.quotaSummaries.map(q => (
              <div key={q.quotaType}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{q.quotaType}</span>
                  <span className="text-gray-500">{q.allocated} / {q.total} filled ({q.available} remaining)</span>
                </div>
                <ProgressBar
                  value={q.allocated}
                  max={q.total}
                  color={q.available === 0 ? 'red' : q.allocated / q.total > 0.8 ? 'yellow' : 'blue'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">No seat matrix configured yet</p>
        )}
      </div>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-red-500" /> Fee Pending ({pending?.pendingFee?.length || 0})
          </h3>
          {pending?.pendingFee?.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pending.pendingFee.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.applicantName}</p>
                    <p className="text-xs text-gray-500">{p.admissionNumber} · {p.program}</p>
                  </div>
                  <span className="badge bg-red-100 text-red-700">Fee Due</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">All fees cleared</p>}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileCheck size={16} className="text-yellow-500" /> Document Pending ({pending?.pendingDocuments?.length || 0})
          </h3>
          {pending?.pendingDocuments?.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pending.pendingDocuments.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.applicantName}</p>
                    <p className="text-xs text-gray-500">{p.applicationNumber} · {p.program}</p>
                  </div>
                  <span className="badge bg-yellow-100 text-yellow-700">{p.status}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">All documents verified</p>}
        </div>
      </div>
    </div>
  )
}
