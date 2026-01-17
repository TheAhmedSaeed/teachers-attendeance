import { kv } from '@vercel/kv';

// Keys
const KEYS = {
  USERS: 'presence:users',
  CONFIG: 'presence:config',
  ABSENCES: 'presence:absences',
  TARDINESS: 'presence:tardiness',
};

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface UserRecord {
  email: string;
  passwordHash: string;
  user: User;
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'presence_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize default admin if no users exist
async function ensureDefaultAdmin(): Promise<void> {
  const users = await kv.get<UserRecord[]>(KEYS.USERS);
  if (!users || users.length === 0) {
    const passwordHash = await hashPassword('admin123');
    const defaultAdmin: UserRecord = {
      email: 'admin@presence.app',
      passwordHash,
      user: {
        id: 'admin-1',
        email: 'admin@presence.app',
        name: 'مدير النظام',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    };
    await kv.set(KEYS.USERS, [defaultAdmin]);
  }
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Ensure default admin exists
    await ensureDefaultAdmin();

    // ============ AUTH ACTIONS ============
    if (action === 'login') {
      const { email, password } = await req.json();
      const users = await kv.get<UserRecord[]>(KEYS.USERS) || [];
      const passwordHash = await hashPassword(password);
      const found = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === passwordHash
      );

      if (!found) {
        return new Response(JSON.stringify({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }), { headers });
      }
      return new Response(JSON.stringify({ success: true, user: found.user }), { headers });
    }

    if (action === 'getUsers') {
      const users = await kv.get<UserRecord[]>(KEYS.USERS) || [];
      return new Response(JSON.stringify(users.map(u => ({ email: u.email, user: u.user }))), { headers });
    }

    if (action === 'addUser') {
      const { email, password, name, role } = await req.json();
      const users = await kv.get<UserRecord[]>(KEYS.USERS) || [];

      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return new Response(JSON.stringify({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' }), { headers });
      }

      const passwordHash = await hashPassword(password);
      const newUser: UserRecord = {
        email: email.toLowerCase(),
        passwordHash,
        user: {
          id: `user-${Date.now()}`,
          email: email.toLowerCase(),
          name,
          role,
          createdAt: new Date().toISOString()
        }
      };
      users.push(newUser);
      await kv.set(KEYS.USERS, users);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === 'deleteUser') {
      const { email } = await req.json();
      const users = await kv.get<UserRecord[]>(KEYS.USERS) || [];
      const filtered = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
      if (filtered.length === users.length) {
        return new Response(JSON.stringify({ success: false, error: 'المستخدم غير موجود' }), { headers });
      }
      await kv.set(KEYS.USERS, filtered);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === 'updatePassword') {
      const { email, newPassword } = await req.json();
      const users = await kv.get<UserRecord[]>(KEYS.USERS) || [];
      const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (index === -1) {
        return new Response(JSON.stringify({ success: false, error: 'المستخدم غير موجود' }), { headers });
      }
      users[index].passwordHash = await hashPassword(newPassword);
      await kv.set(KEYS.USERS, users);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ============ CONFIG ACTIONS ============
    if (action === 'getConfig') {
      const config = await kv.get(KEYS.CONFIG);
      return new Response(JSON.stringify(config || null), { headers });
    }

    if (action === 'saveConfig') {
      const config = await req.json();
      await kv.set(KEYS.CONFIG, config);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ============ ABSENCE ACTIONS ============
    if (action === 'getAbsences') {
      const absences = await kv.get(KEYS.ABSENCES) || [];
      return new Response(JSON.stringify(absences), { headers });
    }

    if (action === 'saveAbsence') {
      const absence = await req.json();
      const absences = await kv.get<any[]>(KEYS.ABSENCES) || [];
      absences.push(absence);
      await kv.set(KEYS.ABSENCES, absences);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ============ TARDINESS ACTIONS ============
    if (action === 'getTardiness') {
      const tardiness = await kv.get(KEYS.TARDINESS) || [];
      return new Response(JSON.stringify(tardiness), { headers });
    }

    if (action === 'saveTardiness') {
      const record = await req.json();
      const tardiness = await kv.get<any[]>(KEYS.TARDINESS) || [];
      tardiness.push(record);
      await kv.set(KEYS.TARDINESS, tardiness);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
  }
}

export const config = {
  runtime: 'edge',
};
