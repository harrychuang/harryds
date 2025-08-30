// =============================================================================
// COLOR TOKEN HELPERS
// - 解析 CSS 變數色碼（var(--token)）為實際色值（#rrggbb / rgb/rgba）
// - 對 Three.js 等不支援 CSS 變數的情境非常實用
// =============================================================================

/**
 * 從字串中解析出 var(--token) 的 token 名稱與 fallback
 */
const parseVarFunction = (
  input: string,
): { tokenName: string | null; fallback: string | null } => {
  const regex = /var\(\s*([^,\s)]+)\s*(?:,\s*([^\s)]+)\s*)?\)/i;
  const match = input.match(regex);
  if (!match) return { tokenName: null, fallback: null };
  const tokenName = match[1] || null; // 例如 --hds-sys-color-primary-default
  const fallback = (match[2] || null)?.trim() ?? null; // 可選的 fallback 值
  return { tokenName, fallback };
};

/**
 * 取得指定 CSS 變數的計算後值
 */
export const getCssVarValue = (tokenName: string, fallback?: string): string => {
  if (typeof window === 'undefined' || !tokenName) return fallback ?? '';
  const root = document.documentElement;
  const body = document.body;
  const valueRoot = getComputedStyle(root).getPropertyValue(tokenName).trim();
  if (valueRoot && valueRoot.length > 0) return valueRoot;
  if (body) {
    const valueBody = getComputedStyle(body).getPropertyValue(tokenName).trim();
    if (valueBody && valueBody.length > 0) return valueBody;
  }
  return fallback ?? '';
};

/**
 * 將輸入顏色（可為 #hex/rgb/var(--token)）解析為實際可用的色值字串。
 * - 若為 var(--token) 會讀取 :root 的計算後值
 * - 否則直接回傳原值（維持向後相容）
 */
export const resolveCssColor = (input: string, defaultFallback?: string): string => {
  if (input == null) return defaultFallback ?? '';
  if (typeof input !== 'string') return defaultFallback ?? '';
  const trimmed = input.trim();
  if (!trimmed.toLowerCase().startsWith('var(')) return trimmed;

  const isColorString = (val: string): boolean => {
    const v = val.trim().toLowerCase();
    return v.startsWith('#') || v.startsWith('rgb(') || v.startsWith('rgba(');
  };

  let current = trimmed;
  let iterations = 0;
  const MAX_DEPTH = 6;
  while (iterations < MAX_DEPTH && current.toLowerCase().startsWith('var(')) {
    const { tokenName, fallback } = parseVarFunction(current);
    if (!tokenName) break;
    const next = getCssVarValue(tokenName, fallback ?? defaultFallback);
    if (!next) {
      current = fallback ?? defaultFallback ?? '';
      break;
    }
    current = next.trim();
    iterations += 1;
  }

  if (typeof current === 'string' && isColorString(current)) return current;
  return defaultFallback ?? current;
};

/** 常用 token 名稱常數 */
export const HDS_TOKENS = {
  primary: 'var(--hds-sys-color-primary-default)',
  secondary: 'var(--hds-sys-color-secondary-default)',
  themeSurface: 'var(--hds-sys-color-theme-surface)',
  onThemeSurface: 'var(--on-hds-sys-color-theme-surface)',
  themeMask: 'var(--hds-sys-color-theme-mask)'
} as const;


