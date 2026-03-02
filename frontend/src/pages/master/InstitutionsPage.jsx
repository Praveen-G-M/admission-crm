import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { institutionApi } from '../../api'
import { Modal, Table, StatusBadge, EmptyState, PageHeader, FormField } from '../../components/ui'
import toast from 'react-hot-toast'

const EMPTY = { name: '', code: '', address: '', phone: '', email: '' }

export default function InstitutionsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await institutionApi.getAll()
      setItems(data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (item) => { setForm({ name: item.name, code: item.code, address: item.address || '', phone: item.phone || '', email: item.email || '' }); setEditId(item.id); setModal(true) }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) await institutionApi.update(editId, form)
      else await institutionApi.create(form)
      toast.success(`Institution ${editId ? 'updated' : 'created'} successfully`)
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this institution?')) return
    try {
      await institutionApi.delete(id)
      toast.success('Institution deactivated')
      load()
    } catch { toast.error('Failed') }
  }

  return (
    <div>
      <PageHeader
        title="Institutions"
        subtitle="Manage your educational institutions"
        action={<button className="btn-primary flex items-center gap-2" onClick={openCreate}><Plus size={16} />Add Institution</button>}
      />

      <div className="card">
        <Table headers={['Name', 'Code', 'Phone', 'Email', 'Actions']} loading={loading}>
          {items.length === 0 && !loading ? (
            <tr><td colSpan={5}><EmptyState message="No institutions yet" icon={Building2} /></td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{item.name}</td>
              <td className="table-cell"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.code}</span></td>
              <td className="table-cell text-gray-500">{item.phone || '—'}</td>
              <td className="table-cell text-gray-500">{item.email || '—'}</td>
              <td className="table-cell">
                <div className="flex gap-2">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Institution' : 'Add Institution'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Institution Name" required>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </FormField>
            <FormField label="Code" required>
              <input className="input uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required maxLength={10} />
            </FormField>
          </div>
          <FormField label="Address">
            <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone">
              <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </FormField>
            <FormField label="Email">
              <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
