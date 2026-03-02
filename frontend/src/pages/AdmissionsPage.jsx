import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, CheckCircle, CreditCard } from 'lucide-react'
import { admissionApi } from '../api'
import { Table, StatusBadge, EmptyState, PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

export default function AdmissionsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { const { data } = await admissionApi.getAll(); setItems(data) }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }

  const updateFee = async (id, status) => {
    try { await admissionApi.updateFee(id, { feeStatus: status }); toast.success('Fee updated'); load() }
    catch { toast.error('Failed') }
  }

  const confirm = async (id) => {
    try { await admissionApi.confirm(id); toast.success('Admission confirmed!'); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div>
      <PageHeader title="Admissions" subtitle={`${items.length} total admissions`} />
      <div className="card">
        <Table
          headers={['Admission No.', 'Applicant', 'Program', 'Quota', 'Fee Status', 'Confirmed', 'Actions']}
          loading={loading}
        >
          {items.length === 0 && !loading ? (
            <tr><td colSpan={7}><EmptyState message="No admissions yet" icon={GraduationCap} /></td></tr>
          ) : items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="table-cell font-mono text-xs text-primary-700 font-semibold">{item.admissionNumber}</td>
              <td className="table-cell">
                <div className="font-medium text-gray-900">{item.applicantName}</div>
                <div className="text-xs text-gray-400">{item.applicationNumber}</div>
              </td>
              <td className="table-cell text-xs text-gray-600">{item.program}</td>
              <td className="table-cell"><span className="badge bg-indigo-100 text-indigo-700">{item.quotaType}</span></td>
              <td className="table-cell"><StatusBadge status={item.feeStatus} /></td>
              <td className="table-cell">
                {item.isConfirmed
                  ? <span className="badge bg-green-100 text-green-700">✓ Yes</span>
                  : <span className="badge bg-gray-100 text-gray-600">No</span>}
              </td>
              <td className="table-cell">
                <div className="flex gap-1">
                  {item.feeStatus === 'Pending' && (
                    <button className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                      onClick={() => updateFee(item.id, 'Paid')}>
                      <CreditCard size={10} /> Pay
                    </button>
                  )}
                  {item.feeStatus === 'Paid' && !item.isConfirmed && (
                    <button className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 flex items-center gap-1"
                      onClick={() => confirm(item.id)}>
                      <CheckCircle size={10} /> Confirm
                    </button>
                  )}
                  <button className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    onClick={() => navigate(`/applicants/${item.applicantId}`)}>
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
