import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, CreditCard, GraduationCap } from 'lucide-react'
import { applicantApi, admissionApi, seatMatrixApi } from '../api'
import { StatusBadge, Spinner, Modal, FormField } from '../components/ui'
import toast from 'react-hot-toast'

const DOC_STATUS_COLORS = {
  Pending: 'text-gray-400',
  Submitted: 'text-blue-500',
  Verified: 'text-green-500',
  Rejected: 'text-red-500'
}

const DOC_ICONS = {
  Pending: Clock,
  Submitted: FileText,
  Verified: CheckCircle,
  Rejected: XCircle
}

export default function ApplicantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [applicant, setApplicant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allocModal, setAllocModal] = useState(false)
  const [seatMatrices, setSeatMatrices] = useState([])
  const [selectedCounter, setSelectedCounter] = useState('')
  const [allocating, setAllocating] = useState(false)

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await applicantApi.get(id)
      setApplicant(data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const updateDocument = async (documentTypeId, status) => {
    try {
      await applicantApi.updateDocument(id, { documentTypeId, status, remarks: null })
      toast.success('Document status updated')
      load()
    } catch { toast.error('Failed') }
  }

  const openAllocate = async () => {
    try {
      const { data } = await seatMatrixApi.getAll({ programId: applicant.programId, academicYearId: applicant.academicYearId })
      setSeatMatrices(data)
    } catch { toast.error('Failed to load seat matrices') }
    setAllocModal(true)
  }

  const allocateSeat = async () => {
    if (!selectedCounter) { toast.error('Select a quota counter'); return }
    setAllocating(true)
    try {
      const { data } = await admissionApi.allocate({ applicantId: Number(id), seatCounterId: Number(selectedCounter) })
      if (data.success) {
        toast.success(`Seat allocated! Admission No: ${data.admissionNumber}`)
        setAllocModal(false)
        load()
      } else {
        toast.error(data.message)
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Allocation failed') }
    finally { setAllocating(false) }
  }

  const updateFee = async (feeStatus) => {
    try {
      await admissionApi.updateFee(applicant.admission.id, { feeStatus })
      toast.success('Fee status updated')
      load()
    } catch { toast.error('Failed') }
  }

  const confirmAdmission = async () => {
    try {
      await admissionApi.confirm(applicant.admission.id)
      toast.success('Admission confirmed!')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <Spinner />
  if (!applicant) return <div className="text-center py-12 text-gray-500">Applicant not found</div>

  const allDocsVerified = applicant.documents.every(d => !d.documentName.includes('Score') ? d.status === 'Verified' : true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{applicant.firstName} {applicant.lastName}</h1>
            <StatusBadge status={applicant.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {applicant.applicationNumber} · {applicant.programName} · {applicant.academicYearName}
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-2">
          {applicant.status === 'DocumentVerified' && !applicant.admission && (
            <button className="btn-primary flex items-center gap-2" onClick={openAllocate}>
              <GraduationCap size={16} /> Allocate Seat
            </button>
          )}
          {applicant.status === 'SeatAllocated' && applicant.admission?.feeStatus === 'Pending' && (
            <button className="btn-success flex items-center gap-2" onClick={() => updateFee('Paid')}>
              <CreditCard size={16} /> Mark Fee Paid
            </button>
          )}
          {applicant.status === 'SeatAllocated' && applicant.admission?.feeStatus === 'Paid' && !applicant.admission?.isConfirmed && (
            <button className="btn-primary flex items-center gap-2" onClick={confirmAdmission}>
              <CheckCircle size={16} /> Confirm Admission
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              {[
                ['Date of Birth', new Date(applicant.dateOfBirth).toLocaleDateString('en-IN')],
                ['Gender', applicant.gender],
                ['Email', applicant.email],
                ['Phone', applicant.phone],
                ['Category', applicant.category],
                ['Entry Type', applicant.entryType],
                ['Quota Type', applicant.quotaType],
                ['Allotment No.', applicant.allotmentNumber || '—'],
                ['Qualifying Exam', applicant.qualifyingExam || '—'],
                ['Qualifying Marks', applicant.qualifyingMarks ? `${applicant.qualifyingMarks}%` : '—'],
                ['J&K Candidate', applicant.isJnkCandidate ? 'Yes' : 'No'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Document Checklist</h3>
            <div className="space-y-2">
              {applicant.documents.map(doc => {
                const Icon = DOC_ICONS[doc.status] || Clock
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={DOC_STATUS_COLORS[doc.status]} />
                      <span className="text-sm text-gray-800">{doc.documentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={doc.status} />
                      {doc.status !== 'Verified' && (
                        <div className="flex gap-1">
                          <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            onClick={() => updateDocument(doc.documentTypeId, 'Submitted')}>Submit</button>
                          <button className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            onClick={() => updateDocument(doc.documentTypeId, 'Verified')}>Verify</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Admission Card */}
        <div className="space-y-4">
          {/* Admission Status */}
          {applicant.admission ? (
            <div className="card border-l-4 border-primary-500">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Admission Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Admission Number</p>
                  <p className="text-sm font-bold text-primary-700 font-mono">{applicant.admission.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fee Status</p>
                  <StatusBadge status={applicant.admission.feeStatus} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confirmation</p>
                  {applicant.admission.isConfirmed
                    ? <span className="badge bg-green-100 text-green-700">✓ Confirmed</span>
                    : <span className="badge bg-yellow-100 text-yellow-700">Pending Confirmation</span>}
                </div>
                {applicant.admission.confirmedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Confirmed On</p>
                    <p className="text-sm text-gray-700">{new Date(applicant.admission.confirmedAt).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card border border-dashed border-gray-300 text-center py-8">
              <GraduationCap size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No seat allocated yet</p>
              {applicant.status !== 'DocumentVerified' && (
                <p className="text-xs text-gray-400 mt-1">Documents must be verified first</p>
              )}
            </div>
          )}

          {/* Workflow Timeline */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Admission Journey</h3>
            {[
              { label: 'Application Created', done: true },
              { label: 'Documents Submitted', done: ['DocumentPending', 'DocumentVerified', 'SeatAllocated', 'Confirmed'].includes(applicant.status) },
              { label: 'Documents Verified', done: ['DocumentVerified', 'SeatAllocated', 'Confirmed'].includes(applicant.status) },
              { label: 'Seat Allocated', done: ['SeatAllocated', 'Confirmed'].includes(applicant.status) },
              { label: 'Fee Paid', done: applicant.admission?.feeStatus === 'Paid' },
              { label: 'Admission Confirmed', done: applicant.admission?.isConfirmed },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {step.done && <CheckCircle size={12} className="text-white" />}
                </div>
                <span className={`text-sm ${step.done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seat Allocation Modal */}
      <Modal isOpen={allocModal} onClose={() => setAllocModal(false)} title="Allocate Seat">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            Allocating for: <strong>{applicant.programName}</strong> · Quota: <strong>{applicant.quotaType}</strong>
          </div>
          {seatMatrices.map(sm => (
            <div key={sm.id}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{sm.programName} — {sm.admissionMode}</h4>
              <div className="space-y-2">
                {sm.counters.filter(c => c.availableSeats > 0).map(c => (
                  <label key={c.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedCounter == c.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="counter" value={c.id} checked={selectedCounter == c.id} onChange={e => setSelectedCounter(e.target.value)} />
                      <span className="font-medium text-gray-800">{c.quotaType}</span>
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-green-600 font-bold">{c.availableSeats}</span>
                      <span className="text-gray-400"> / {c.totalSeats} available</span>
                    </div>
                  </label>
                ))}
                {sm.counters.filter(c => c.availableSeats === 0).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 opacity-60">
                    <span className="text-gray-600">{c.quotaType}</span>
                    <span className="text-red-500 text-sm font-medium">FULL</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {seatMatrices.every(sm => sm.counters.every(c => c.availableSeats === 0)) && (
            <div className="text-center py-4 text-red-500 text-sm">All quotas are full for this program</div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setAllocModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={allocateSeat} disabled={!selectedCounter || allocating}>
              {allocating ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
