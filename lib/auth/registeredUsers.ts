import { RoleKey } from "@prisma/client";
import { verifyPassword, hashPassword } from "./password";
import fs from "fs";
import path from "path";

export interface RegisteredUserRecord {
  id: string;
  email: string;
  name: string;
  role: RoleKey;
  phone?: string;
  title?: string;
  passwordHash: string;
  mustChangePw?: boolean;
  failedLogins?: number;
  lockedUntil?: number | null;
  active: boolean;
}

// Bcrypt hash for "ChangeMe!2026" (cost factor 12)
export const DEFAULT_PASSWORD_HASH =
  "$2a$12$X569Od6uBk2fu33jGbks1OwCCVDddtSu.NdA8fj/BuOx1LII25hvG";

export const INITIAL_REGISTERED_USERS: RegisteredUserRecord[] = [
  {
    id: "u_sri",
    name: "Sri",
    email: "sri@smru.in",
    role: RoleKey.ADMIN,
    phone: "+919876543210",
    title: "IT Manager",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_hari",
    name: "Hari",
    email: "hari@smru.in",
    role: RoleKey.LEAD,
    phone: "+919876543211",
    title: "IT Coordinator",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_janardhan",
    name: "Janardhan",
    email: "janardhan@smru.in",
    role: RoleKey.MEMBER,
    phone: "+919876543212",
    title: "Senior Faculty & IT Member",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_dev_web",
    name: "Dev Web",
    email: "dev.web@smru.in",
    role: RoleKey.DEVELOPER,
    phone: "+919876543213",
    title: "Frontend Developer",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_dev_backend",
    name: "Dev Backend",
    email: "dev.backend@smru.in",
    role: RoleKey.DEVELOPER,
    phone: "+919876543214",
    title: "Backend Developer",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_dev_backend_api",
    name: "Dev Backend",
    email: "dev.api@smru.in",
    role: RoleKey.DEVELOPER,
    phone: "+919876543215",
    title: "Backend Developer",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_intern_a",
    name: "Intern Web A",
    email: "intern.a@smru.in",
    role: RoleKey.INTERN,
    phone: "+919876543216",
    title: "Web Intern",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_intern_b",
    name: "Intern Web B",
    email: "intern.b@smru.in",
    role: RoleKey.INTERN,
    phone: "+919876543217",
    title: "Web Intern",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_vc_office",
    name: "VC Office",
    email: "vc.office@smru.in",
    role: RoleKey.GUEST,
    phone: "+919876543218",
    title: "Vice Chancellor's Office",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_coo_office",
    name: "COO Office",
    email: "coo.office@smru.in",
    role: RoleKey.GUEST,
    phone: "+919876543219",
    title: "Chief Operating Officer's Office",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
  {
    id: "u_ceo_office",
    name: "CEO Office",
    email: "ceo.office@smru.in",
    role: RoleKey.GUEST,
    phone: "+919876543220",
    title: "Chief Executive Officer's Office",
    passwordHash: DEFAULT_PASSWORD_HASH,
    mustChangePw: false,
    failedLogins: 0,
    lockedUntil: null,
    active: true,
  },
];

// Persistent state storage path
const DATA_FILE = path.join(process.cwd(), "data", "auth_users.json");

function loadUsers(): Map<string, RegisteredUserRecord> {
  const map = new Map<string, RegisteredUserRecord>();
  for (const u of INITIAL_REGISTERED_USERS) {
    map.set(u.email.toLowerCase(), { ...u });
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const list = JSON.parse(raw) as RegisteredUserRecord[];
      for (const item of list) {
        const existing = map.get(item.email.toLowerCase());
        map.set(item.email.toLowerCase(), { ...existing, ...item });
      }
    }
  } catch {
    // If reading fails, default map is retained
  }

  return map;
}

function persistUsers(map: Map<string, RegisteredUserRecord>): void {
  try {
    const list = Array.from(map.values());
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // In-memory fallback if file system write fails
  }
}

// In-memory cache synced with file
let usersCache: Map<string, RegisteredUserRecord> | null = null;

function getUsersMap(): Map<string, RegisteredUserRecord> {
  if (!usersCache) {
    usersCache = loadUsers();
  }
  return usersCache;
}

export function findRegisteredUserByEmail(email: string): RegisteredUserRecord | null {
  const normalized = email.trim().toLowerCase();
  const map = getUsersMap();
  return map.get(normalized) || null;
}

export function findRegisteredUserById(id: string): RegisteredUserRecord | null {
  const map = getUsersMap();
  for (const user of map.values()) {
    if (user.id === id) return user;
  }
  return null;
}

export function isRegisteredEmail(email: string): boolean {
  return findRegisteredUserByEmail(email) !== null;
}

export function normalizeMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (phone.startsWith("+")) {
    return `+${digits}`;
  }
  return digits;
}

export function findRegisteredUserByMobile(phone: string): RegisteredUserRecord | null {
  const cleanDigits = phone.replace(/\D/g, "");
  if (cleanDigits.length < 10) return null;
  const last10 = cleanDigits.slice(-10);

  const map = getUsersMap();
  for (const user of map.values()) {
    if (user.phone) {
      const userDigits = user.phone.replace(/\D/g, "");
      if (userDigits.slice(-10) === last10) {
        return user;
      }
    }
  }
  return null;
}

export async function verifyRegisteredUserCredentials(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const map = getUsersMap();
  const user = map.get(normalized);

  // Generic secure error message
  const genericError = "Invalid email or password.";

  if (!user || !user.active) {
    return { success: false, error: genericError };
  }

  const now = Date.now();

  // Check lockout (15 minutes after 5 failed attempts)
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutesLeft = Math.ceil((user.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`,
    };
  }

  // Strictly verify password using bcrypt
  const isMatch = await verifyPassword(password, user.passwordHash).catch(() => false);

  if (!isMatch) {
    const failedLogins = (user.failedLogins || 0) + 1;
    if (failedLogins >= 5) {
      user.lockedUntil = now + 15 * 60 * 1000;
      user.failedLogins = 0;
      persistUsers(map);
      return {
        success: false,
        error: "Account is locked due to 5 failed attempts. Please try again in 15 minutes.",
      };
    } else {
      user.failedLogins = failedLogins;
      persistUsers(map);
      return { success: false, error: genericError };
    }
  }

  // Reset failed logins on success
  user.failedLogins = 0;
  user.lockedUntil = null;
  persistUsers(map);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePw: user.mustChangePw ?? false,
    },
  };
}

export async function updateRegisteredUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  const map = getUsersMap();
  let targetUser: RegisteredUserRecord | null = null;
  for (const user of map.values()) {
    if (user.id === userId) {
      targetUser = user;
      break;
    }
  }

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  const isOldCorrect = await verifyPassword(oldPassword, targetUser.passwordHash).catch(() => false);
  if (!isOldCorrect) {
    return { success: false, error: "Old password is wrong" };
  }

  const newHash = await hashPassword(newPassword);
  targetUser.passwordHash = newHash;
  targetUser.mustChangePw = false;
  persistUsers(map);

  return { success: true };
}

export async function resetRegisteredUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const map = getUsersMap();
  let targetUser: RegisteredUserRecord | null = null;
  for (const user of map.values()) {
    if (user.id === userId) {
      targetUser = user;
      break;
    }
  }

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  const newHash = await hashPassword(newPassword);
  targetUser.passwordHash = newHash;
  targetUser.mustChangePw = false;
  targetUser.failedLogins = 0;
  targetUser.lockedUntil = null;
  persistUsers(map);

  return { success: true };
}
