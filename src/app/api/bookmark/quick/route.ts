import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/bookmark/quick?url=...&user_id=...
 * ブックマークレットからのワンクリック保存用エンドポイント
 * CORSヘッダー付きでブラウザの別オリジンからも呼べる
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const userId = searchParams.get("user_id");

  if (!url || !userId) {
    return new NextResponse(
      generateHTML("❌ エラー", "URLまたはユーザーIDが不足しています。"),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    // 内部APIを呼び出して保存
    const baseUrl = new URL(request.url).origin;
    const res = await fetch(`${baseUrl}/api/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, user_id: userId }),
    });

    const data = await res.json();

    if (res.status === 409 && data.duplicate) {
      return new NextResponse(
        generateHTML("⚠️ 既に保存済み", `このURLは登録済みです。<br><small>${escapeHtml(url)}</small>`),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (!res.ok) {
      return new NextResponse(
        generateHTML("❌ 保存失敗", data.error || "不明なエラー"),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const title = data.bookmark?.title || url;
    return new NextResponse(
      generateHTML("✅ 保存しました！", `<strong>${escapeHtml(title)}</strong><br><small>${escapeHtml(url)}</small>`),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch {
    return new NextResponse(
      generateHTML("❌ エラー", "サーバーエラーが発生しました。"),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/** 結果表示用の小さなHTMLページ */
function generateHTML(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} - あの動画どこ？</title>
  <style>
    body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b}
    .card{background:#fff;border-radius:16px;padding:2rem;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center;max-width:400px;width:90%}
    h1{font-size:1.5rem;margin:0 0 .5rem}
    p{color:#64748b;font-size:.875rem;line-height:1.6;word-break:break-all}
    .close{margin-top:1rem;display:inline-block;padding:.5rem 1.5rem;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-size:.875rem}
    .close:hover{background:#4f46e5}
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="javascript:window.close()" class="close">閉じる</a>
  </div>
  <script>setTimeout(()=>window.close(),3000)</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
