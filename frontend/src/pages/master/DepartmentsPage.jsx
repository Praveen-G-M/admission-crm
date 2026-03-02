import React, { useState, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { departmentApi, campusApi } from '../../api'
import { Modal, Table, EmptyState, PageHeader, FormField } from '../../components/ui'
import toast from 'react-hot-toast'

export default function DepartmentsPage() {
  const [items, setItems] = useState([])
  const [campuses, setCampuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ campusId: '', name: '', code: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { campusApi.getAll().then(r => setCampuses(r.data)); load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await departmentApi.getAll(); setItems(data) }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) await departmentApi.update(editId, form)
      else await departmentApi.create(form)
      toast.success('Saved'); setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="Departments" action={
        <button className="btn-primary flex items-center gap-2" onClick={() => { setForm({ campusId: '', name: '', code: '' }); setEditId(null); setModal(true) }}>
          <Plus size={16} />Add Department
        </button>
      } />
      <div className="card">
        <Table headers={['Department', 'Code', 'Campus', 'Actions']} loading={loading}>
          {items.length === 0 && !loading ? (
            <tr><td colSpan={4}><EmptyState message="No departments yet" /></td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{item.name}</td>
              <td className="table-cell"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.code}</span></td>
              <td className="table-cell text-gray-500">{item.campusName}</td>
              <td className="table-cell">
                <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                  onClick={() => { setForm({ campusId: item.campusId, name: item.name, code: item.code }); setEditId(item.id); setModal(true) }}>
                  <Pencil size={14} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={save} className="space-y-4">
          <FormField label="Campus" required>
            <select className="input" value={form.campusId} onChange={e => setForm(f => ({ ...f, campusId: e.target.value }))} required>
              <option value="">Select campus</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department Name" required>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </FormField>
            <FormField label="Code" required>
              <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            </FormField>
          </div>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
