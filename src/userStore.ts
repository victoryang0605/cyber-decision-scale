/**
 * 用户存储 + 会话令牌（仅用于 Node/Express 端；Cloudflare Pages Function 不引用本模块）
 *
 * - users.csv    用户信息（openid、昵称、手机号、余额、免费次数等）
 * - recharges.csv 充值记录（人工确认后由管理员写入）
 *
 * CSV 使用标准转义：含逗号/引号/换行的字段用双引号包裹，内部引号双写。
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface UserRecord {
  openid: string;
  nickname: string;
  phone: string;
  balance: number; // 付费余额（次数）
  freeUsed: number; // 已用免费次数
  freeLimit: number; // 免费次数上限
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface RechargeRecord {
  id: string;
  openid: string;
  amount: number;
  note: string;
  createdAt: string;
}

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

// ---------- 用户存储（CSV） ----------

export class CsvUserStore {
  private usersPath: string;
  private rechargesPath: string;
  private users = new Map<string, UserRecord>();
  private recharges: RechargeRecord[] = [];

  constructor(dir: string = path.join(process.cwd(), 'data')) {
    fs.mkdirSync(dir, { recursive: true });
    this.usersPath = path.join(dir, 'users.csv');
    this.rechargesPath = path.join(dir, 'recharges.csv');
    this.ensureHeader(this.usersPath, [
      'openid',
      'nickname',
      'phone',
      'balance',
      'free_used',
      'free_limit',
      'avatar',
      'created_at',
      'updated_at',
    ]);
    this.ensureHeader(this.rechargesPath, ['id', 'openid', 'amount', 'note', 'created_at']);
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
    this.loadUsers();
    this.loadRecharges();
  }

  private loadUsers(): void {
    const raw = fs.readFileSync(this.usersPath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    for (let i = 1; i < lines.length; i++) {
      const c = parseCsvLine(lines[i]);
      if (c.length < 9) continue;
      const [openid, nickname, phone, balance, freeUsed, freeLimit, avatar, createdAt, updatedAt] = c;
      this.users.set(openid, {
        openid,
        nickname,
        phone,
        balance: Number(balance) || 0,
        freeUsed: Number(freeUsed) || 0,
        freeLimit: Number(freeLimit) || 3,
        avatar,
        createdAt,
        updatedAt,
      });
    }
  }

  private loadRecharges(): void {
    const raw = fs.readFileSync(this.rechargesPath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    for (let i = 1; i < lines.length; i++) {
      const c = parseCsvLine(lines[i]);
      if (c.length < 5) continue;
      const [id, openid, amount, note, createdAt] = c;
      this.recharges.push({ id, openid, amount: Number(amount) || 0, note, createdAt });
    }
  }

  private persistUsers(): void {
    const rows: (string | number)[][] = [
      ['openid', 'nickname', 'phone', 'balance', 'free_used', 'free_limit', 'avatar', 'created_at', 'updated_at'],
    ];
    for (const u of this.users.values()) {
      rows.push([u.openid, u.nickname, u.phone, u.balance, u.freeUsed, u.freeLimit, u.avatar, u.createdAt, u.updatedAt]);
    }
    fs.writeFileSync(this.usersPath, rows.map(toCsvRow).join('\n') + '\n', 'utf-8');
  }

  private persistRecharges(): void {
    const rows: (string | number)[][] = [['id', 'openid', 'amount', 'note', 'created_at']];
    for (const r of this.recharges) {
      rows.push([r.id, r.openid, r.amount, r.note, r.createdAt]);
    }
    fs.writeFileSync(this.rechargesPath, rows.map(toCsvRow).join('\n') + '\n', 'utf-8');
  }

  /** 微信授权后获取或创建用户 */
  getOrCreate(openid: string, nickname: string, avatar = '', freeLimit: number): UserRecord {
    const now = new Date().toISOString();
    let user = this.users.get(openid);
    if (!user) {
      user = {
        openid,
        nickname: nickname || '微信用户',
        phone: '',
        balance: 0,
        freeUsed: 0,
        freeLimit,
        avatar,
        createdAt: now,
        updatedAt: now,
      };
      this.users.set(openid, user);
      this.persistUsers();
    } else {
      // 昵称/头像有更新则同步
      if (nickname && user.nickname !== nickname) user.nickname = nickname;
      if (avatar && user.avatar !== avatar) user.avatar = avatar;
      user.updatedAt = now;
      this.persistUsers();
    }
    return user;
  }

  get(openid: string): UserRecord | undefined {
    return this.users.get(openid);
  }

  updatePhone(openid: string, phone: string): UserRecord | undefined {
    const user = this.users.get(openid);
    if (!user) return undefined;
    user.phone = phone.trim();
    user.updatedAt = new Date().toISOString();
    this.persistUsers();
    return user;
  }

  /** 消耗一次：付费余额优先，其次免费额度。返回 true 表示允许 */
  consume(openid: string): boolean {
    const user = this.users.get(openid);
    if (!user) return false;
    if (user.balance > 0) {
      user.balance -= 1;
    } else if (user.freeUsed < user.freeLimit) {
      user.freeUsed += 1;
    } else {
      return false;
    }
    user.updatedAt = new Date().toISOString();
    this.persistUsers();
    return true;
  }

  /** 是否有可用次数（不消耗） */
  canUse(openid: string): boolean {
    const user = this.users.get(openid);
    if (!user) return false;
    return user.balance > 0 || user.freeUsed < user.freeLimit;
  }

  /** 管理员发放余额并记录充值流水 */
  addCredits(openid: string, amount: number, note = ''): number {
    const user = this.users.get(openid);
    if (!user) return 0;
    const amt = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
    user.balance += amt;
    user.updatedAt = new Date().toISOString();
    this.recharges.push({
      id: crypto.randomUUID(),
      openid,
      amount: amt,
      note: note || 'manual',
      createdAt: new Date().toISOString(),
    });
    this.persistUsers();
    this.persistRecharges();
    return user.balance;
  }

  /** 注销账号：删除用户与充值记录 */
  removeUser(openid: string): boolean {
    const existed = this.users.delete(openid);
    if (existed) {
      this.recharges = this.recharges.filter((r) => r.openid !== openid);
      this.persistUsers();
      this.persistRecharges();
    }
    return existed;
  }

  listUsers(): UserRecord[] {
    return [...this.users.values()];
  }
}

// ---------- 会话令牌（HMAC 签名，防伪造） ----------

export function signSessionToken(openid: string, secret: string, ttlMs = 7 * 24 * 3600 * 1000): string {
  const payload = Buffer.from(JSON.stringify({ o: openid, exp: Date.now() + ttlMs })).toString('base64url');
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { o?: string; exp?: number };
    if (!data.o || !data.exp || data.exp < Date.now()) return null;
    return data.o;
  } catch {
    return null;
  }
}
