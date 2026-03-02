import React, { useState, useEffect } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { seatMatrixApi, programApi, academicYearApi } from '../api'
import { Modal, Table, EmptyState, PageHeader, FormField, ProgressBar, StatCard } from '../components/ui'
import toast from 'react-hot-toast'

const EMPTY = { programId: '', academicYearId: '', admissionMode: 'Government', totalIntake: '', kcetSeats: '0', cometkSeats: '0', managementSeats: '0', snSeats: '0', jnkLimit: '0' }

export default function SeatMatrixPage() {
  const [items, setItems] = useState([])
  const [programs, setPrograms] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([programApi.getAll(), academicYearApi.getAll()]).then(([p, ay]) => {
      setPrograms(p.data); setAcademicYears(ay.data)
    })
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await seatMatrixApi.getAll(); setItems(data) }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const total = Number(form.kcetSeats || 0) + Number(form.cometkSeats || 0) + Number(form.managementSeats || 0)
  const isValid = total === Number(form.totalIntake || 0) && Number(form.totalIntake) > 0

  const save = async (e) => {
    e.preventDefault()
    if (!isValid) { toast.error('Quota totals must equal Total Intake'); return }
    setSaving(true)
    try {
      await seatMatrixApi.create({
        programId: Number(form.programId), academicYearId: Number(form.academicYearId),
        admissionMode: form.admissionMode, totalIntake: Number(form.totalIntake),
        kcetSeats: Number(form.kcetSeats), cometkSeats: Number(form.cometkSeats),
        managementSeats: Number(form.managementSeats), snSeats: Number(form.snSeats),
        jnkLimit: Number(form.jnkLimit)
      })
      toast.success('Seat matrix created'); setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seat Matrix"
        subtitle="Configure program intake and quota distribution"
        action={<button className="btn-primary flex items-center gap-2" onClick={() => { setForm(EMPTY); setModal(true) }}><Plus size={16} />Create Matrix</button>}
      />

      {items.length === 0 && !loading ? (
        <div className="card"><EmptyState message="No seat matrices configured yet" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map(sm => (
            <div key={sm.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{sm.programName}</h3>
                  <p className="text-sm text-gray-500">{sm.academicYearName} · {sm.admissionMode}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">{sm.totalIntake}</p>
                  <p className="text-xs text-gray-500">Total Intake</p>
                </div>
              </div>
              <div className="space-y-3">
                {sm.counters.map(c => (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-600">{c.quotaType}</span>
                      <span className="text-gray-500">{c.allocatedSeats}/{c.totalSeats} · <span className={c.availableSeats === 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{c.availableSeats} left</span></span>
                    </div>
                    <ProgressBar value={c.allocatedSeats} max={c.totalSeats} color={c.availableSeats === 0 ? 'red' : 'blue'} />
                  </div>
                ))}
              </div>
              {sm.jnkLimit > 0 && (
                <div className="mt-3 p-2 bg-orange-50 rounded-lg flex items-center gap-2 text-xs text-orange-700">
                  <AlertCircle size={12} /> J&K Limit: {sm.jnkLimit}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Seat Matrix" size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Program" required>
              <select className="input" value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))} required>
                <option value="">Select program</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </select>
            </FormField>
            <FormField label="Academic Year" required>
              <select className="input" value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))} required>
                <option value="">Select year</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Admission Mode" required>
              <select className="input" value={form.admissionMode} onChange={e => setForm(f => ({ ...f, admissionMode: e.target.value }))}>
                <option value="Government">Government</option>
                <option value="Management">Management</option>
              </select>
            </FormField>
            <FormField label="Total Intake" required>
              <input type="number" className="input" min={1} value={form.totalIntake} onChange={e => setForm(f => ({ ...f, totalIntake: e.target.value }))} required />
            </FormField>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Quota Distribution</h4>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="KCET Seats">
                <input type="number" className="input" min={0} value={form.kcetSeats} onChange={e => setForm(f => ({ ...f, kcetSeats: e.target.value }))} />
              </FormField>
              <FormField label="COMEDK Seats">
                <input type="number" className="input" min={0} value={form.cometkSeats} onChange={e => setForm(f => ({ ...f, cometkSeats: e.target.value }))} />
              </FormField>
              <FormField label="Management Seats">
                <input type="number" className="input" min={0} value={form.managementSeats} onChange={e => setForm(f => ({ ...f, managementSeats: e.target.value }))} />
              </FormField>
            </div>
            <div className={`text-sm font-medium flex justify-between ${isValid ? 'text-green-600' : 'text-red-500'}`}>
              <span>Sum: {total} / {form.totalIntake || 0}</span>
              <span>{isValid ? '✓ Valid' : '✗ Must equal Total Intake'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Supernumerary Seats (Optional)">
              <input type="number" className="input" min={0} value={form.snSeats} onChange={e => setForm(f => ({ ...f, snSeats: e.target.value }))} />
            </FormField>
            <FormField label="J&K Limit (0 = No limit)">
              <input type="number" className="input" min={0} value={form.jnkLimit} onChange={e => setForm(f => ({ ...f, jnkLimit: e.target.value }))} />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" disabled={saving || !isValid} className="btn-primary">{saving ? 'Creating...' : 'Create Matrix'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
