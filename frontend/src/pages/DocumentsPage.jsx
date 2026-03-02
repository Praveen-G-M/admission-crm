import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileCheck, Search } from 'lucide-react'
import { applicantApi } from '../api'
import { Table, StatusBadge, EmptyState, PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

export default function DocumentsPage() {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await applicantApi.getAll()
      setApplicants(data)
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  const filtered = applicants.filter(a => {
    const q = search.toLowerCase()
    return !q || `${a.firstName} ${a.lastName} ${a.applicationNumber}`.toLowerCase().includes(q)
  })

  const getDocProgress = (docs) => {
    const verified = docs.filter(d => d.status === 'Verified').length
    return { verified, total: docs.length }
  }

  return (
    <div>
      <PageHeader title="Document Verification" subtitle="Track and verify applicant documents" />

      <div className="card mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <Table headers={['Applicant', 'Program', 'Status', 'Doc Progress', 'Pending Docs', 'Action']} loading={loading}>
          {filtered.length === 0 && !loading ? (
            <tr><td colSpan={6}><EmptyState message="No applicants found" icon={FileCheck} /></td></tr>
          ) : filtered.map(a => {
            const { verified, total } = getDocProgress(a.documents)
            const pendingDocs = a.documents.filter(d => d.status === 'Pending' || d.status === 'Submitted')
            return (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div className="font-medium text-gray-900">{a.firstName} {a.lastName}</div>
                  <div className="text-xs text-gray-400">{a.applicationNumber}</div>
                </td>
                <td className="table-cell text-xs text-gray-600">{a.programName}</td>
                <td className="table-cell"><StatusBadge status={a.status} /></td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${total > 0 ? (verified/total)*100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">{verified}/{total}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-1">
                    {pendingDocs.slice(0, 2).map(d => (
                      <span key={d.id} className="badge bg-yellow-100 text-yellow-700 text-xs">{d.documentName.split(' ')[0]}</span>
                    ))}
                    {pendingDocs.length > 2 && <span className="badge bg-gray-100 text-gray-600 text-xs">+{pendingDocs.length - 2}</span>}
                    {pendingDocs.length === 0 && <span className="text-green-600 text-xs">All done</span>}
                  </div>
                </td>
                <td className="table-cell">
                  <button className="text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                    onClick={() => navigate(`/applicants/${a.id}`)}>
                    Verify
                  </button>
                </td>
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
