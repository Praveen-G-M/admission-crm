// Campuses Page
import React, { useState, useEffect } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { campusApi, institutionApi } from '../../api'
import { Modal, Table, EmptyState, PageHeader, FormField } from '../../components/ui'
import toast from 'react-hot-toast'

const EMPTY_CAMPUS = { institutionId: '', name: '', code: '', location: '' }

export function CampusesPage() {
  const [items, setItems] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_CAMPUS)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    institutionApi.getAll().then(r => setInstitutions(r.data))
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await campusApi.getAll(); setItems(data) }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setForm(EMPTY_CAMPUS); setEditId(null); setModal(true) }
  const openEdit = (item) => { setForm({ institutionId: item.institutionId, name: item.name, code: item.code, location: item.location || '' }); setEditId(item.id); setModal(true) }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) await campusApi.update(editId, form)
      else await campusApi.create(form)
      toast.success('Saved'); setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="Campuses" action={<button className="btn-primary flex items-center gap-2" onClick={openCreate}><Plus size={16} />Add Campus</button>} />
      <div className="card">
        <Table headers={['Campus', 'Code', 'Institution', 'Location', 'Actions']} loading={loading}>
          {items.length === 0 && !loading ? (
            <tr><td colSpan={5}><EmptyState message="No campuses yet" /></td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{item.name}</td>
              <td className="table-cell"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.code}</span></td>
              <td className="table-cell text-gray-500">{item.institutionName}</td>
              <td className="table-cell text-gray-500">{item.location || '—'}</td>
              <td className="table-cell"><button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg" onClick={() => openEdit(item)}><Pencil size={14} /></button></td>
            </tr>
          ))}
        </Table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Campus' : 'Add Campus'}>
        <form onSubmit={save} className="space-y-4">
          <FormField label="Institution" required>
            <select className="input" value={form.institutionId} onChange={e => setForm(f => ({ ...f, institutionId: e.target.value }))} required>
              <option value="">Select institution</option>
              {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Campus Name" required>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </FormField>
            <FormField label="Code" required>
              <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            </FormField>
          </div>
          <FormField label="Location">
            <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </Modal>
    </div>
  )
}

export default CampusesPage
