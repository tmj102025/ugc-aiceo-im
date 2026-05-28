const KEY = 'ugc.openrouter.key.v1';
const PAID_KEY = 'ugc.openrouter.allowPaid.v1';

export function saveApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, key);
  } catch {}
}

export function loadApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

export function saveAllowPaid(v: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PAID_KEY, v ? '1' : '0');
  } catch {}
}

export function loadAllowPaid(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PAID_KEY) === '1';
  } catch {
    return false;
  }
}

const HISTORY_KEY = 'ugc.history.v1';
export interface HistoryItem {
  id: string;
  ts: number;
  type: 'image' | 'video';
  templateId: string;
  productName: string;
  prompt: string;
}

export function pushHistory(item: HistoryItem): void {
  if (typeof window === 'undefined') return;
  try {
    const cur = loadHistory();
    const next = [item, ...cur].slice(0, 30);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}

export function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
