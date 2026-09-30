/**
 * AuraCMS API Client
 * Connects frontend to the FastAPI + PostgreSQL backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  user_id: number;
  full_name: string;
  doctor_id?: number | null;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  doctor_id?: number | null;
}

export interface DashboardStats {
  total_patients: number;
  appointments_today: number;
  waiting_in_queue: number;
  completed_consultations_today: number;
  revenue_today: number;
  pending_bills_amount: number;
  active_doctors: number;
}

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auracms_access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      // If 401 and we have a refresh token, attempt refresh
      if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry original request
          const retryHeaders = { ...this.getHeaders(), ...(options.headers || {}) };
          const retryRes = await fetch(url, { ...options, headers: retryHeaders });
          if (retryRes.ok) {
            return retryRes.json();
          }
        }
      }

      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('auracms_refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (res.ok) {
        const data: AuthTokens = await res.json();
        localStorage.setItem('auracms_access_token', data.access_token);
        localStorage.setItem('auracms_refresh_token', data.refresh_token);
        return true;
      }
    } catch {
      // Refresh failed
    }
    return false;
  }

  // ─── AUTH ────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<AuthTokens> {
    const data = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('auracms_access_token', data.access_token);
    localStorage.setItem('auracms_refresh_token', data.refresh_token);
    localStorage.setItem('auracms_auth_role', data.role.toLowerCase());
    localStorage.setItem('auracms_user_id', String(data.user_id));
    localStorage.setItem('auracms_user_name', data.full_name);
    if (data.doctor_id) {
      localStorage.setItem('auracms_doctor_id', String(data.doctor_id));
    } else {
      localStorage.removeItem('auracms_doctor_id');
    }

    return data;
  }

  logout(): void {
    localStorage.removeItem('auracms_access_token');
    localStorage.removeItem('auracms_refresh_token');
    localStorage.removeItem('auracms_auth_role');
    localStorage.removeItem('auracms_user_id');
    localStorage.removeItem('auracms_user_name');
    localStorage.removeItem('auracms_doctor_id');
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  // ─── PATIENTS ────────────────────────────────────────────────────────────
  async listPatients(params: { search?: string; skip?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    return this.request<{ total: number; patients: any[] }>(`/patients?${query.toString()}`);
  }

  async getPatient(id: number | string) {
    return this.request<any>(`/patients/${id}`);
  }

  async createPatient(patientData: any) {
    return this.request<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id: number | string, patientData: any) {
    return this.request<any>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async getPatientHistory(id: number | string) {
    return this.request<any>(`/patients/${id}/history`);
  }

  // ─── DOCTORS ─────────────────────────────────────────────────────────────
  async listDoctors(params: { specialization?: string; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.specialization) query.append('specialization', params.specialization);
    if (params.status) query.append('status', params.status);
    return this.request<any[]>(`/doctors?${query.toString()}`);
  }

  async getDoctor(id: number | string) {
    return this.request<any>(`/doctors/${id}`);
  }

  async updateDoctorStatus(id: number | string, status: string) {
    return this.request<any>(`/doctors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getDoctorQueue(id: number | string) {
    return this.request<any[]>(`/doctors/${id}/queue`);
  }

  // ─── APPOINTMENTS ────────────────────────────────────────────────────────
  async listAppointments(params: { date?: string; doctor_id?: number; patient_id?: number; status?: string; skip?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.date) query.append('appointment_date', params.date);
    if (params.doctor_id) query.append('doctor_id', String(params.doctor_id));
    if (params.patient_id) query.append('patient_id', String(params.patient_id));
    if (params.status) query.append('status', params.status);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    return this.request<{ total: number; appointments: any[] }>(`/appointments?${query.toString()}`);
  }

  async createAppointment(data: any) {
    return this.request<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkInAppointment(id: number | string, fee?: number) {
    const qs = fee !== undefined ? `?fee=${fee}` : '';
    return this.request<any>(`/appointments/${id}/check-in${qs}`, {
      method: 'POST',
    });
  }

  async cancelAppointment(id: number | string, reason?: string) {
    return this.request<any>(`/appointments/${id}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ''}`, {
      method: 'POST',
    });
  }

  // ─── QUEUE ───────────────────────────────────────────────────────────────
  async listQueue(params: { queue_date?: string; doctor_id?: number; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.queue_date) query.append('queue_date', params.queue_date);
    if (params.doctor_id) query.append('doctor_id', String(params.doctor_id));
    if (params.status) query.append('status', params.status);
    return this.request<{ total: number; entries: any[] }>(`/queue?${query.toString()}`);
  }

  async checkInToQueue(appointmentId: number, priority = 'NORMAL', fee?: number) {
    return this.request<any>('/queue/check-in', {
      method: 'POST',
      body: JSON.stringify({ appointment_id: appointmentId, priority, fee }),
    });
  }

  async updateQueueStatus(entryId: number, status: string) {
    return this.request<any>(`/queue/${entryId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async callNextPatient(doctorId: number) {
    return this.request<any>(`/queue/call-next/${doctorId}`, {
      method: 'POST',
    });
  }

  // ─── VITALS ──────────────────────────────────────────────────────────────
  async getPatientVitals(patientId: number | string) {
    return this.request<any[]>(`/vitals/patient/${patientId}`);
  }

  async recordVitals(vitalsData: any) {
    return this.request<any>('/vitals', {
      method: 'POST',
      body: JSON.stringify(vitalsData),
    });
  }

  // ─── CONSULTATIONS ───────────────────────────────────────────────────────
  async listConsultations(params: { patient_id?: number; doctor_id?: number; appointment_id?: number; status?: string; skip?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.patient_id) query.append('patient_id', String(params.patient_id));
    if (params.doctor_id) query.append('doctor_id', String(params.doctor_id));
    if (params.appointment_id) query.append('appointment_id', String(params.appointment_id));
    if (params.status) query.append('status', params.status);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    return this.request<any[]>(`/consultations?${query.toString()}`);
  }

  async createConsultation(consultationData: any) {
    return this.request<any>('/consultations', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  }

  async getConsultation(id: number | string) {
    return this.request<any>(`/consultations/${id}`);
  }

  async updateConsultation(id: number | string, data: any) {
    return this.request<any>(`/consultations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeConsultation(id: number | string) {
    return this.request<any>(`/consultations/${id}/complete`, {
      method: 'POST',
    });
  }

  // ─── PRESCRIPTIONS ───────────────────────────────────────────────────────
  async listPrescriptions(params: { patient_id?: number; doctor_id?: number; consultation_id?: number; status?: string; skip?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.patient_id) query.append('patient_id', String(params.patient_id));
    if (params.doctor_id) query.append('doctor_id', String(params.doctor_id));
    if (params.consultation_id) query.append('consultation_id', String(params.consultation_id));
    if (params.status) query.append('status', params.status);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    return this.request<{ total: number; prescriptions: any[] }>(`/prescriptions?${query.toString()}`);
  }

  async createPrescription(prescriptionData: any) {
    return this.request<any>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  }

  async getPrescription(id: number | string) {
    return this.request<any>(`/prescriptions/${id}`);
  }

  async updatePrescription(id: number | string, data: any) {
    return this.request<any>(`/prescriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async dispensePrescription(id: number | string) {
    return this.request<any>(`/prescriptions/${id}/dispense`, {
      method: 'POST',
    });
  }

  // ─── FOLLOW-UPS ──────────────────────────────────────────────────────────
  async listFollowUps(params: { patient_id?: number; doctor_id?: number; status?: string; skip?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.patient_id) query.append('patient_id', String(params.patient_id));
    if (params.doctor_id) query.append('doctor_id', String(params.doctor_id));
    if (params.status) query.append('status', params.status);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    return this.request<{ total: number; follow_ups: any[] }>(`/follow-ups?${query.toString()}`);
  }

  async createFollowUp(data: any) {
    return this.request<any>('/follow-ups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFollowUp(id: number | string, data: any) {
    return this.request<any>(`/follow-ups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }


  // ─── BILLING & PAYMENTS ──────────────────────────────────────────────────
  async listBills(params: { patient_id?: number; status?: string; skip?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.patient_id) query.append('patient_id', String(params.patient_id));
    if (params.status) query.append('status', params.status);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    return this.request<{ total: number; bills: any[] }>(`/billing?${query.toString()}`);
  }

  async createBill(billData: any) {
    return this.request<any>('/billing', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  }

  async getBill(id: number | string) {
    return this.request<any>(`/billing/${id}`);
  }

  async updateBill(id: number | string, billData: any) {
    return this.request<any>(`/billing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData),
    });
  }

  async recordPayment(billId: number | string, paymentData: any) {
    return this.request<any>(`/billing/${billId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // ─── REPORTS & ANALYTICS ─────────────────────────────────────────────────
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/reports/dashboard');
  }

  async getAnalytics() {
    return this.request<any>('/reports/analytics');
  }

  async getOperationalReport(period?: string) {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request<any>(`/reports/operational${qs}`);
  }

  async getDoctorReport(doctorId?: number | string) {
    const qs = doctorId ? `?doctor_id=${encodeURIComponent(doctorId)}` : '';
    return this.request<any>(`/reports/doctor${qs}`);
  }

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
  async listNotifications() {
    return this.request<any>('/notifications');
  }

  async markNotificationRead(id: number | string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request<any>(`/notifications/read-all`, {
      method: 'PUT',
    });
  }

  async createNotification(data: { user_id?: number; title: string; message: string; type?: string; link_route?: string }) {
    return this.request<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
