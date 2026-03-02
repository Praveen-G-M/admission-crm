import React, { useState, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { programApi, departmentApi } from '../../api'
import { Modal, Table, EmptyState, PageHeader, FormField } from '../../components/ui'
import toast from 'react-hot-toast'

export default function ProgramsPage() {
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ departmentId: '', name: '', code: '', courseType: 'UG', entryType: 'Regular', durationYears: 4 })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { departmentApi.getAll().then(r => setDepartments(r.data)); load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await programApi.getAll(); setItems(data) }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, durationYears: Number(form.durationYears) }
      if (editId) await programApi.update(editId, payload)
      else await programApi.create(payload)
      toast.success('Saved'); setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  const openCreate = () => {
    setForm({ departmentId: '', name: '', code: '', courseType: 'UG', entryType: 'Regular', durationYears: 4 })
    setEditId(null); setModal(true)
  }

  return (
    <div>
      <PageHeader title="Programs / Branches" action={<button className="btn-primary flex items-center gap-2" onClick={openCreate}><Plus size={16} />Add Program</button>} />
      <div className="card">
        <Table headers={['Program', 'Code', 'Department', 'Type', 'Entry', 'Duration', 'Actions']} loading={loading}>
          {items.length === 0 && !loading ? (
            <tr><td colSpan={7}><EmptyState message="No programs yet" /></td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{item.name}</td>
              <td className="table-cell"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.code}</span></td>
              <td className="table-cell text-gray-500">{item.departmentName}</td>
              <td className="table-cell"><span className="badge bg-blue-100 text-blue-700">{item.courseType}</span></td>
              <td className="table-cell"><span className="badge bg-purple-100 text-purple-700">{item.entryType}</span></td>
              <td className="table-cell text-gray-500">{item.durationYears}Y</td>
              <td className="table-cell">
                <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                  onClick={() => { setForm({ departmentId: item.departmentId, name: item.name, code: item.code, courseType: item.courseType, entryType: item.entryType, durationYears: item.durationYears }); setEditId(item.id); setModal(true) }}>
                  <Pencil size={14} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Program' : 'Add Program'}>
        <form onSubmit={save} className="space-y-4">
          <FormField label="Department" required>
            <select className="input" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} required>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Program Name" required>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </FormField>
            <FormField label="Code" required>
              <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Course Type" required>
              <select className="input" value={form.courseType} onChange={e => setForm(f => ({ ...f, courseType: e.target.value }))}>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </select>
            </FormField>
            <FormField label="Entry Type" required>
              <select className="input" value={form.entryType} onChange={e => setForm(f => ({ ...f, entryType: e.target.value }))}>
                <option value="Regular">Regular</option>
                <option value="Lateral">Lateral</option>
              </select>
            </FormField>
            <FormField label="Duration (Years)" required>
              <input type="number" className="input" min={1} max={6} value={form.durationYears} onChange={e => setForm(f => ({ ...f, durationYears: e.target.value }))} required />
            </FormField>
          </div>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
