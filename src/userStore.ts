/**
 * 账号/设备存储（仅用于 Node/Express 端；Cloudflare Pages Function 不引用本模块）
 *
 * 三个 CSV 文件（位于 data/ 目录，已 gitignore）：
 * - users.csv     注册用户：id, username, phone, password_hash, balance, free_remaining, created_at, updated_at
 * - recharges.csv 充值流水：id, username, package_id, amount_yuan, credits, note, created_at
 * - devices.csv   匿名设备限额：fingerprint, used_count, username, first_seen, last_seen
 *
 * 规则：
 * - 注册用户：付费余额优先扣减，其次扣「注册赠送的免费次数」；额度跟随账号，换设备登录依然受限
 * - 匿名用户：按设备指纹（浏览器指纹）每设备限 3 次
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface AccountRecord {
  username: string;
  phone: string;
  passwordHash: string;
  balance: number; // 付费余额（次数）
  freeRemaining: number; // 注册赠送的免费剩余次数
  createdAt: string;
  updatedAt: string;
}

export interface RechargeRecord {
  id: string;
  username: string;
  packageId: string;
  amountYuan: number;
  credits: number;
  note: string;
  createdAt: string;
}

export interface DeviceRecord {
  fingerprint: string;
  usedCount: number;
  username: string;
  firstSeen: string;
  lastSeen: string;
}

// 充值套餐（与前端展示一致）
export const RECHARGE_PACKAGES = [
  { id: 'p5', price: 5, credits: 20, label: '¥5 / 20 次' },
  { id: 'p10', price: 10, credits: 50, label: '¥10 / 50 次' },
  { id: 'p100', price: 100, credits: 500, label: '¥100 / 500 次' },
] as const;

export type PackageId = (typeof RECHARGE_PACKAGES)[number]['id'];

export const ANONYMOUS_DEVICE_LIMIT = 3; // 匿名设备免费次数上限
export const REGISTER_FREE_GIFT = 3; // 注册赠送免费次数

// ---------- CSV 工具 ----------

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function toCsvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(',');
}

// ---------- 密码哈希（scrypt，无第三方依赖） ----------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ---------- 账号/设备存储 ----------

export class CsvStore {
  private usersPath: string;
  private rechargesPath: string;
  private devicesPath: string;
  private users = new Map<string, AccountRecord>();
  private recharges: RechargeRecord[] = [];
  private devices = new Map<string, DeviceRecord>();

  constructor(dir: string = path.join(process.cwd(), 'data')) {
    fs.mkdirSync(dir, { recursive: true });
    this.usersPath = path.join(dir, 'users.csv');
    this.rechargesPath = path.join(dir, 'recharges.csv');
    this.devicesPath = path.join(dir, 'devices.csv');
    this.ensureHeader(this.usersPath, ['username', 'phone', 'password_hash', 'balance', 'free_remaining', 'created_at', 'updated_at']);
    this.ensureHeader(this.rechargesPath, ['id', 'username', 'package_id', 'amount_yuan', 'credits', 'note', 'created_at']);
    this.ensureHeader(this.devicesPath, ['fingerprint', 'used_count', 'username', 'first_seen', 'last_seen']);
    this.load();
  }

  private ensureHeader(filePath: string, headers: string[]): void {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, toCsvRow(headers) + '\n', 'utf-8');
    }
  }

  private load(): void {
    this.users.clear();
    this.recharges = [];
    this.devices.clear();

    const userLines = fs.readFileSync(this.usersPath, 'utf-8').split(/\r?\n/).filter((l) => l.trim());
    for (let i = 1; i < userLines.length; i++) {
      const c = parseCsvLine(userLines[i]);
      if (c.length < 7) continue;
      const [username, phone, passwordHash, balance, freeRemaining, createdAt, updatedAt] = c;
      this.users.set(username, {
        username,
        phone,
        passwordHash,
        balance: Number(balance) || 0,
        freeRemaining: Number(freeRemaining) || 0,
        createdAt,
        updatedAt,
      });
    }

    const recLines = fs.readFileSync(this.rechargesPath, 'utf-8').split(/\r?\n/).filter((l) => l.trim());
    for (let i = 1; i < recLines.length; i++) {
      const c = parseCsvLine(recLines[i]);
      if (c.length < 7) continue;
      const [id, username, packageId, amountYuan, credits, note, createdAt] = c;
      this.recharges.push({ id, username, packageId, amountYuan: Number(amountYuan) || 0, credits: Number(credits) || 0, note, createdAt });
    }

    const devLines = fs.readFileSync(this.devicesPath, 'utf-8').split(/\r?\n/).filter((l) => l.trim());
    for (let i = 1; i < devLines.length; i++) {
      const c = parseCsvLine(devLines[i]);
      if (c.length < 5) continue;
      const [fingerprint, usedCount, username, firstSeen, lastSeen] = c;
      this.devices.set(fingerprint, { fingerprint, usedCount: Number(usedCount) || 0, username, firstSeen, lastSeen });
    }
  }

  private persistUsers(): void {
    const rows: (string | number)[][] = [['username', 'phone', 'password_hash', 'balance', 'free_remaining', 'created_at', 'updated_at']];
    for (const u of this.users.values()) {
      rows.push([u.username, u.phone, u.passwordHash, u.balance, u.freeRemaining, u.createdAt, u.updatedAt]);
    }
    fs.writeFileSync(this.usersPath, rows.map(toCsvRow).join('\n') + '\n', 'utf-8');
  }

  private persistRecharges(): void {
    const rows: (string | number)[][] = [['id', 'username', 'package_id', 'amount_yuan', 'credits', 'note', 'created_at']];
    for (const r of this.recharges) {
      rows.push([r.id, r.username, r.packageId, r.amountYuan, r.credits, r.note, r.createdAt]);
    }
    fs.writeFileSync(this.rechargesPath, rows.map(toCsvRow).join('\n') + '\n', 'utf-8');
  }

  private persistDevices(): void {
    const rows: (string | number)[][] = [['fingerprint', 'used_count', 'username', 'first_seen', 'last_seen']];
    for (const d of this.devices.values()) {
      rows.push([d.fingerprint, d.usedCount, d.username, d.firstSeen, d.lastSeen]);
    }
    fs.writeFileSync(this.devicesPath, rows.map(toCsvRow).join('\n') + '\n', 'utf-8');
  }

  // ---- 账号 ----

  findByUsername(username: string): AccountRecord | undefined {
    return this.users.get(username);
  }

  findByPhone(phone: string): AccountRecord | undefined {
    for (const u of this.users.values()) {
      if (u.phone === phone) return u;
    }
    return undefined;
  }

  /** 注册新用户：用户名+手机号唯一；注册即赠送 freeGift 次免费使用 */
  register(username: string, phone: string, password: string, freeGift = REGISTER_FREE_GIFT): { ok: true; user: AccountRecord } | { ok: false; error: string } {
    if (this.users.has(username)) return { ok: false, error: '用户名已被注册' };
    if (this.findByPhone(phone)) return { ok: false, error: '手机号已被注册' };
    const now = new Date().toISOString();
    const user: AccountRecord = {
      username,
      phone,
      passwordHash: hashPassword(password),
      balance: 0,
      freeRemaining: freeGift,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(username, user);
    this.persistUsers();
    return { ok: true, user };
  }

  updatePhone(username: string, phone: string): AccountRecord | undefined {
    const user = this.users.get(username);
    if (!user) return undefined;
    if (this.findByPhone(phone) && this.findByPhone(phone)!.username !== username) return undefined;
    user.phone = phone.trim();
    user.updatedAt = new Date().toISOString();
    this.persistUsers();
    return user;
  }

  /** 账号是否还有可用次数（余额或注册赠送） */
  canUseAccount(username: string): boolean {
    const u = this.users.get(username);
    if (!u) return false;
    return u.balance > 0 || u.freeRemaining > 0;
  }

  /** 消耗一次账号次数：付费余额优先，其次注册赠送 */
  consumeAccount(username: string): boolean {
    const u = this.users.get(username);
    if (!u) return false;
    if (u.balance > 0) {
      u.balance -= 1;
    } else if (u.freeRemaining > 0) {
      u.freeRemaining -= 1;
    } else {
      return false;
    }
    u.updatedAt = new Date().toISOString();
    this.persistUsers();
    return true;
  }

  accountStatus(username: string) {
    const u = this.users.get(username);
    if (!u) return null;
    return { username: u.username, phone: u.phone, balance: u.balance, freeRemaining: u.freeRemaining };
  }

  /** 管理员发放余额 + 记录充值流水（按套餐或自定义） */
  addCredits(username: string, packageId: string, amountYuan: number, credits: number, note = ''): number {
    const u = this.users.get(username);
    if (!u) return 0;
    const amt = Number.isFinite(credits) ? Math.max(0, Math.floor(credits)) : 0;
    u.balance += amt;
    u.updatedAt = new Date().toISOString();
    this.recharges.push({
      id: crypto.randomUUID(),
      username,
      packageId: packageId || 'custom',
      amountYuan: Number.isFinite(amountYuan) ? Math.max(0, amountYuan) : 0,
      credits: amt,
      note: note || 'manual',
      createdAt: new Date().toISOString(),
    });
    this.persistUsers();
    this.persistRecharges();
    return u.balance;
  }

  listRecharges(username?: string): RechargeRecord[] {
    if (username) return this.recharges.filter((r) => r.username === username);
    return [...this.recharges];
  }

  removeUser(username: string): boolean {
    const existed = this.users.delete(username);
    if (existed) {
      this.recharges = this.recharges.filter((r) => r.username !== username);
      this.persistUsers();
      this.persistRecharges();
    }
    return existed;
  }

  // ---- 匿名设备 ----

  deviceStatus(fingerprint: string) {
    const d = this.devices.get(fingerprint);
    return d ? { used: d.usedCount, limit: ANONYMOUS_DEVICE_LIMIT } : { used: 0, limit: ANONYMOUS_DEVICE_LIMIT };
  }

  canUseDevice(fingerprint: string): boolean {
    const d = this.devices.get(fingerprint);
    return !d || d.usedCount < ANONYMOUS_DEVICE_LIMIT;
  }

  /** 消耗一次匿名设备次数；达到上限返回 false */
  consumeDevice(fingerprint: string): boolean {
    const now = new Date().toISOString();
    let d = this.devices.get(fingerprint);
    if (!d) {
      d = { fingerprint, usedCount: 0, username: '', firstSeen: now, lastSeen: now };
      this.devices.set(fingerprint, d);
    }
    if (d.usedCount >= ANONYMOUS_DEVICE_LIMIT) return false;
    d.usedCount += 1;
    d.lastSeen = now;
    this.persistDevices();
    return true;
  }

  /** 登录成功时把设备关联到账号（记录设备曾被该用户使用） */
  linkDeviceToUser(fingerprint: string, username: string): void {
    if (!fingerprint) return;
    const now = new Date().toISOString();
    let d = this.devices.get(fingerprint);
    if (!d) {
      d = { fingerprint, usedCount: 0, username, firstSeen: now, lastSeen: now };
      this.devices.set(fingerprint, d);
    } else {
      d.username = username;
      d.lastSeen = now;
    }
    this.persistDevices();
  }
}

// ---------- 会话令牌（HMAC 签名，防伪造） ----------

export function signSessionToken(username: string, secret: string, ttlMs = 30 * 24 * 3600 * 1000): string {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + ttlMs })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string, secret: string): string | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { u?: string; exp?: number };
    if (!data.u || !data.exp || data.exp < Date.now()) return null;
    return data.u;
  } catch {
    return null;
  }
}
