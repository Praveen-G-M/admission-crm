import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:54393/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

// ─── Master Setup ─────────────────────────────────────────────
export const institutionApi = {
  getAll: () => api.get('/institutions'),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id) => api.delete(`/institutions/${id}`),
}

export const campusApi = {
  getAll: (institutionId) => api.get('/campuses', { params: { institutionId } }),
  create: (data) => api.post('/campuses', data),
  update: (id, data) => api.put(`/campuses/${id}`, data),
}

export const departmentApi = {
  getAll: (campusId) => api.get('/departments', { params: { campusId } }),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
}

export const programApi = {
  getAll: (departmentId) => api.get('/programs', { params: { departmentId } }),
  create: (data) => api.post('/programs', data),
  update: (id, data) => api.put(`/programs/${id}`, data),
}

export const academicYearApi = {
  getAll: (institutionId) => api.get('/academicyears', { params: { institutionId } }),
  create: (data) => api.post('/academicyears', data),
}

// ─── Seat Matrix ──────────────────────────────────────────────
export const seatMatrixApi = {
  getAll: (params) => api.get('/seatmatrices', { params }),
  get: (id) => api.get(`/seatmatrices/${id}`),
  create: (data) => api.post('/seatmatrices', data),
  getCounters: (id) => api.get(`/seatmatrices/${id}/counters`),
}

// ─── Applicants ───────────────────────────────────────────────
export const applicantApi = {
  getAll: (params) => api.get('/applicants', { params }),
  get: (id) => api.get(`/applicants/${id}`),
  create: (data) => api.post('/applicants', data),
  update: (id, data) => api.put(`/applicants/${id}`, data),
  updateDocument: (id, data) => api.patch(`/applicants/${id}/documents`, data),
}

// ─── Admissions ───────────────────────────────────────────────
export const admissionApi = {
  getAll: () => api.get('/admissions'),
  get: (id) => api.get(`/admissions/${id}`),
  allocate: (data) => api.post('/admissions/allocate', data),
  updateFee: (id, data) => api.patch(`/admissions/${id}/fee`, data),
  confirm: (id) => api.post(`/admissions/${id}/confirm`),
}

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  get: (academicYearId) => api.get('/dashboard', { params: { academicYearId } }),
  seatAvailability: (academicYearId) => api.get('/dashboard/seat-availability', { params: { academicYearId } }),
  pendingActions: () => api.get('/dashboard/pending-actions'),
}

export const documentTypeApi = {
  getAll: () => api.get('/documenttypes'),
}
