import React, { useState, useEffect } from 'react'
import { Plus, Star } from 'lucide-react'
import { academicYearApi, institutionApi } from '../../api'
import { Modal, Table, EmptyState, PageHeader, FormField } from '../../components/ui'
import toast from 'react-hot-toast'

export default function AcademicYearsPage() {
  const [items, setItems] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ institutionId: '', name: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, isCurrent: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => { institutionApi.getAll().then(r => setInstitutions(r.data)); load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await academicYearApi.getAll(); setItems(data) }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await academicYearApi.create({ ...form, startYear: Number(form.startYear), endYear: Number(form.endYear) })
      toast.success('Academic year created'); setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  const autoName = (start, end) => `${start}-${String(end).slice(-2)}`

  return (
    <div>
      <PageHeader title="Academic Years" action={
        <button className="btn-primary flex items-center gap-2" onClick={() => { setForm({ institutionId: '', name: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, isCurrent: false }); setModal(true) }}>
          <Plus size={16} />Add Academic Year
        </button>
      } />
      <div className="card">
        <Table headers={['Name', 'Start Year', 'End Year', 'Institution', 'Status']} loading={loading}>
          {items.length === 0 && !loading ? (
            <tr><td colSpan={5}><EmptyState message="No academic years yet" /></td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="table-cell font-medium flex items-center gap-2">
                {item.isCurrent && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                {item.name}
              </td>
              <td className="table-cell">{item.startYear}</td>
              <td className="table-cell">{item.endYear}</td>
              <td className="table-cell text-gray-500">{institutions.find(i => i.id === item.institutionId)?.name || '—'}</td>
              <td className="table-cell">
                {item.isCurrent ? <span className="badge bg-green-100 text-green-700">Current</span> : <span className="badge bg-gray-100 text-gray-600">Inactive</span>}
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Academic Year">
        <form onSubmit={save} className="space-y-4">
          <FormField label="Institution" required>
            <select className="input" value={form.institutionId} onChange={e => setForm(f => ({ ...f, institutionId: e.target.value }))} required>
              <option value="">Select institution</option>
              {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Year" required>
              <input type="number" className="input" value={form.startYear}
                onChange={e => { const s = Number(e.target.value); setForm(f => ({ ...f, startYear: s, endYear: s + 1, name: autoName(s, s + 1) })) }} required />
            </FormField>
            <FormField label="End Year" required>
              <input type="number" className="input" value={form.endYear}
                onChange={e => { const en = Number(e.target.value); setForm(f => ({ ...f, endYear: en, name: autoName(f.startYear, en) })) }} required />
            </FormField>
          </div>
          <FormField label="Display Name" required>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. 2025-26" />
          </FormField>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isCurrent} onChange={e => setForm(f => ({ ...f, isCurrent: e.target.checked }))} className="rounded" />
            <span className="text-sm font-medium text-gray-700">Set as current year</span>
          </label>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
