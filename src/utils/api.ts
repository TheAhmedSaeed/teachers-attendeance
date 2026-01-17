// API helper for Vercel KV
const API_URL = '/api/kv';

async function apiCall<T>(action: string, data?: any): Promise<T> {
  const response = await fetch(`${API_URL}?action=${action}`, {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// ============ AUTH API ============
export async function apiLogin(email: string, password: string) {
  return apiCall<{ success: boolean; user?: any; error?: string }>('login', { email, password });
}

export async function apiGetUsers() {
  return apiCall<{ email: string; user: any }[]>('getUsers');
}

export async function apiAddUser(email: string, password: string, name: string, role: 'admin' | 'user') {
  return apiCall<{ success: boolean; error?: string }>('addUser', { email, password, name, role });
}

export async function apiDeleteUser(email: string) {
  return apiCall<{ success: boolean; error?: string }>('deleteUser', { email });
}

export async function apiUpdatePassword(email: string, newPassword: string) {
  return apiCall<{ success: boolean; error?: string }>('updatePassword', { email, newPassword });
}

// ============ CONFIG API ============
export async function apiGetConfig() {
  return apiCall<any>('getConfig');
}

export async function apiSaveConfig(config: any) {
  return apiCall<{ success: boolean }>('saveConfig', config);
}

// ============ ABSENCE API ============
export async function apiGetAbsences() {
  return apiCall<any[]>('getAbsences');
}

export async function apiSaveAbsence(absence: any) {
  return apiCall<{ success: boolean }>('saveAbsence', absence);
}

// ============ TARDINESS API ============
export async function apiGetTardiness() {
  return apiCall<any[]>('getTardiness');
}

export async function apiSaveTardiness(record: any) {
  return apiCall<{ success: boolean }>('saveTardiness', record);
}
