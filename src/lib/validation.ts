/**
 * API入力バリデーション・セキュリティユーティリティ
 *
 * 全APIで共通利用する入力検証関数を集約。
 * 不正な入力によるDB汚染・XSS・インジェクションを防止する。
 */

// UUID v4 形式チェック
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * user_id が有効な UUID v4 形式であるか検証
 * 攻撃者が任意文字列を user_id に指定して DB を汚染するのを防止
 */
export function isValidUserId(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

/**
 * bookmark id が有効な UUID 形式であるか検証
 */
export function isValidBookmarkId(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id);
}

/**
 * tags 配列のバリデーション
 * - 配列であること
 * - 各要素が文字列であること
 * - 各タグが50文字以内であること
 * - 最大20タグまで
 */
export function isValidTags(tags: unknown): tags is string[] {
  if (!Array.isArray(tags)) return false;
  if (tags.length > 20) return false;
  return tags.every(
    (t) => typeof t === "string" && t.length <= 50
  );
}

/**
 * memo のバリデーション
 * - 文字列であること
 * - 2000文字以内
 */
export function isValidMemo(memo: unknown): memo is string {
  return typeof memo === "string" && memo.length <= 2000;
}

/**
 * title のバリデーション
 * - 文字列であること
 * - 500文字以内
 */
export function isValidTitle(title: unknown): title is string {
  return typeof title === "string" && title.length <= 500;
}

/**
 * URL が有効な http/https URL であるか検証
 */
export function isValidHttpUrl(urlStr: unknown): urlStr is string {
  if (typeof urlStr !== "string") return false;
  try {
    const url = new URL(urlStr);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * プライベートIP / localhost へのリクエストをブロック（SSRF対策）
 */
export function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    // localhost / ループバック
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return false;
    if (hostname.endsWith(".local")) return false;
    // プライベートIP範囲
    if (hostname.startsWith("10.")) return false;
    if (hostname.startsWith("192.168.")) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
    // リンクローカル
    if (hostname.startsWith("169.254.")) return false;
    // IPv6 ループバック・リンクローカル
    if (hostname === "::1" || hostname.startsWith("fe80:")) return false;
    // クラウドメタデータ
    if (hostname === "169.254.169.254") return false;
    if (hostname === "metadata.google.internal") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * sort_order が有効な数値であるか検証
 */
export function isValidSortOrder(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
