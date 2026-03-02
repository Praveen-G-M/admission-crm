import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react'
import { applicantApi, seatMatrixApi, admissionApi } from '../api'
import { StatusBadge, ProgressBar, PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

export default function AllocationPage() {
  const [search, setSearch] = useState('')
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [seatMatrices, setSeatMatrices] = useState([])
  const [selectedCounter, setSelectedCounter] = useState(null)
  const [allocating, setAllocating] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const searchApplicants = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const { data } = await applicantApi.getAll({ search, status: 'DocumentVerified' })
      setApplicants(data)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  const selectApplicant = async (applicant) => {
    setSelectedApplicant(applicant)
    setSelectedCounter(null)
    setResult(null)
    try {
      const { data } = await seatMatrixApi.getAll({ programId: applicant.programId, academicYearId: applicant.academicYearId })
      setSeatMatrices(data)
    } catch { toast.error('Failed to load seat data') }
  }

  const allocate = async () => {
    if (!selectedCounter) { toast.error('Select a quota counter'); return }
    setAllocating(true)
    try {
      const { data } = await admissionApi.allocate({ applicantId: selectedApplicant.id, seatCounterId: selectedCounter.id })
      setResult(data)
      if (data.success) toast.success('Seat allocated!')
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Allocation failed') }
    finally { setAllocating(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Seat Allocation" subtitle="Allocate seats to applicants with document verification" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Search Applicant */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Find Applicant</h3>
            <p className="text-xs text-gray-500 mb-3">Search for applicants with status: Document Verified</p>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-9" placeholder="Search name, email, app no..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchApplicants()} />
              </div>
              <button className="btn-primary" onClick={searchApplicants} disabled={loading}>
                {loading ? '...' : 'Search'}
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {applicants.length === 0 && !loading && (
                <p className="text-center text-gray-400 text-sm py-6">Search for verified applicants</p>
              )}
              {applicants.map(a => (
                <button key={a.id}
                  onClick={() => selectApplicant(a)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedApplicant?.id === a.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-gray-500">{a.applicationNumber} · {a.programName}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-1 flex gap-2">
                    <span className="badge bg-indigo-100 text-indigo-700 text-xs">{a.quotaType}</span>
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{a.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Seat Selection */}
        <div className="space-y-4">
          {selectedApplicant ? (
            <>
              <div className="card">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Applicant Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{selectedApplicant.firstName} {selectedApplicant.lastName}</p></div>
                  <div><p className="text-xs text-gray-500">Program</p><p className="font-medium">{selectedApplicant.programName}</p></div>
                  <div><p className="text-xs text-gray-500">Quota</p><p className="font-medium">{selectedApplicant.quotaType}</p></div>
                  <div><p className="text-xs text-gray-500">Allotment No.</p><p className="font-medium">{selectedApplicant.allotmentNumber || '—'}</p></div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Available Seat Counters</h3>
                {seatMatrices.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">No seat matrix configured for this program</div>
                ) : seatMatrices.map(sm => (
                  <div key={sm.id} className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">{sm.admissionMode} Seats</p>
                    <div className="space-y-2">
                      {sm.counters.map(c => (
                        <button
                          key={c.id}
                          onClick={() => c.availableSeats > 0 && setSelectedCounter(c)}
                          disabled={c.availableSeats === 0}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${c.availableSeats === 0 ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' : selectedCounter?.id === c.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">{c.quotaType}</span>
                            <span className={`text-sm font-bold ${c.availableSeats === 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {c.availableSeats === 0 ? 'FULL' : `${c.availableSeats} available`}
                            </span>
                          </div>
                          <ProgressBar value={c.allocatedSeats} max={c.totalSeats} color={c.availableSeats === 0 ? 'red' : 'blue'} />
                          <p className="text-xs text-gray-500 mt-1">{c.allocatedSeats} / {c.totalSeats} filled</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedCounter && !result && (
                <div className="card bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Allocating <strong>{selectedCounter.quotaType}</strong> seat to <strong>{selectedApplicant.firstName} {selectedApplicant.lastName}</strong>
                    </p>
                  </div>
                  <button className="btn-primary mt-4 w-full" onClick={allocate} disabled={allocating}>
                    {allocating ? 'Allocating...' : 'Confirm Seat Allocation'}
                  </button>
                </div>
              )}

              {result && (
                <div className={`card ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    {result.success
                      ? <CheckCircle size={20} className="text-green-600" />
                      : <AlertTriangle size={20} className="text-red-600" />}
                    <div>
                      <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.success ? 'Seat Allocated Successfully!' : 'Allocation Failed'}
                      </p>
                      {result.admissionNumber && (
                        <p className="text-green-700 text-sm font-mono mt-1">{result.admissionNumber}</p>
                      )}
                      {!result.success && <p className="text-red-700 text-sm mt-1">{result.message}</p>}
                    </div>
                  </div>
                  {result.success && (
                    <button className="btn-success mt-3 text-sm" onClick={() => navigate(`/applicants/${selectedApplicant.id}`)}>
                      View Applicant &amp; Complete Admission
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="card border-dashed border-2 flex flex-col items-center justify-center py-16">
              <UserCheck size={40} className="text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Search and select an applicant to allocate a seat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
