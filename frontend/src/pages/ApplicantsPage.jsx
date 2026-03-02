import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Users } from 'lucide-react'
import { applicantApi, programApi, academicYearApi } from '../api'
import { Modal, Table, StatusBadge, EmptyState, PageHeader, FormField } from '../components/ui'
import toast from 'react-hot-toast'

const CATEGORIES = ['GM', 'SC', 'ST', 'OBC', 'EWS', 'Other']
const QUOTAS = ['KCET', 'COMEDK', 'Management', 'Supernumerary']

const EMPTY = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'Male',
  email: '', phone: '', category: 'GM', entryType: 'Regular',
  quotaType: 'Management', qualifyingExam: '', qualifyingMarks: '',
  allotmentNumber: '', programId: '', academicYearId: '', isJnkCandidate: false
}

export default function ApplicantsPage() {
  const [items, setItems] = useState([])
  const [programs, setPrograms] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([programApi.getAll(), academicYearApi.getAll()]).then(([p, ay]) => {
      setPrograms(p.data); setAcademicYears(ay.data)
      const curr = ay.data.find(y => y.isCurrent)
      if (curr) setForm(f => ({ ...f, academicYearId: String(curr.id) }))
    })
    load()
  }, [])

  useEffect(() => { load() }, [statusFilter])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await applicantApi.getAll({ status: statusFilter || undefined, search: search || undefined })
      setItems(data)
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        ...form, programId: Number(form.programId), academicYearId: Number(form.academicYearId),
        qualifyingMarks: form.qualifyingMarks ? Number(form.qualifyingMarks) : null,
        allotmentNumber: form.allotmentNumber || null
      }
      await applicantApi.create(payload)
      toast.success('Applicant created successfully'); setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const filtered = items.filter(a =>
    !search || [a.firstName, a.lastName, a.email, a.applicationNumber].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applicants"
        subtitle={`${items.length} total applicants`}
        action={<button className="btn-primary flex items-center gap-2" onClick={() => { setForm(EMPTY); setModal(true) }}><Plus size={16} />New Applicant</button>}
      />

      {/* Filters */}
      <div className="card">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name, email, app no..." value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          </div>
          <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['Applied', 'DocumentPending', 'DocumentVerified', 'SeatAllocated', 'Confirmed', 'Rejected'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          <button className="btn-secondary" onClick={load}>Search</button>
        </div>
      </div>

      <div className="card">
        <Table headers={['App No.', 'Name', 'Program', 'Quota', 'Category', 'Status', 'Actions']} loading={loading}>
          {filtered.length === 0 && !loading ? (
            <tr><td colSpan={7}><EmptyState message="No applicants found" icon={Users} /></td></tr>
          ) : filtered.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="table-cell font-mono text-xs text-gray-600">{item.applicationNumber}</td>
              <td className="table-cell">
                <div className="font-medium text-gray-900">{item.firstName} {item.lastName}</div>
                <div className="text-xs text-gray-500">{item.email}</div>
              </td>
              <td className="table-cell text-gray-600 text-xs">{item.programName}</td>
              <td className="table-cell"><span className="badge bg-indigo-100 text-indigo-700">{item.quotaType}</span></td>
              <td className="table-cell"><span className="badge bg-gray-100 text-gray-700">{item.category}</span></td>
              <td className="table-cell"><StatusBadge status={item.status} /></td>
              <td className="table-cell">
                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => navigate(`/applicants/${item.id}`)}>
                  <Eye size={14} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Applicant" size="xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required><input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required /></FormField>
            <FormField label="Last Name" required><input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required /></FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Date of Birth" required><input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} required /></FormField>
            <FormField label="Gender" required>
              <select className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </FormField>
            <FormField label="Category" required>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></FormField>
            <FormField label="Phone" required><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required /></FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Entry Type" required>
              <select className="input" value={form.entryType} onChange={e => setForm(f => ({ ...f, entryType: e.target.value }))}>
                <option>Regular</option><option>Lateral</option>
              </select>
            </FormField>
            <FormField label="Quota Type" required>
              <select className="input" value={form.quotaType} onChange={e => setForm(f => ({ ...f, quotaType: e.target.value }))}>
                {QUOTAS.map(q => <option key={q}>{q}</option>)}
              </select>
            </FormField>
            <FormField label="Allotment No. (Govt)">
              <input className="input" value={form.allotmentNumber} onChange={e => setForm(f => ({ ...f, allotmentNumber: e.target.value }))} placeholder="For KCET/COMEDK" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Qualifying Exam">
              <input className="input" value={form.qualifyingExam} onChange={e => setForm(f => ({ ...f, qualifyingExam: e.target.value }))} placeholder="e.g. KCET 2026" />
            </FormField>
            <FormField label="Qualifying Marks (%)">
              <input type="number" className="input" min={0} max={100} step={0.01} value={form.qualifyingMarks} onChange={e => setForm(f => ({ ...f, qualifyingMarks: e.target.value }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Program" required>
              <select className="input" value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))} required>
                <option value="">Select program</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormField>
            <FormField label="Academic Year" required>
              <select className="input" value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))} required>
                <option value="">Select year</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </FormField>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isJnkCandidate} onChange={e => setForm(f => ({ ...f, isJnkCandidate: e.target.checked }))} className="rounded" />
            <span className="text-sm text-gray-700">J&K Candidate</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Applicant'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
