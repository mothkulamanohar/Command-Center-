import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl = urlParam;
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "ICC-UptimeMonitor/1.0" },
      });
      // Some servers disallow HEAD
      if (res.status === 405 || res.status === 501) {
        res = await fetch(targetUrl, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: { "User-Agent": "ICC-UptimeMonitor/1.0" },
        });
      }
    } catch {
      // Retry once with GET
      res = await fetch(targetUrl, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "ICC-UptimeMonitor/1.0" },
      });
    } finally {
      clearTimeout(timeout);
    }

    const latencyMs = Math.max(1, Math.round(performance.now() - start));
    const isUp = res.status < 500;

    return NextResponse.json({
      ok: isUp,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return NextResponse.json({
      ok: false,
      status: 0,
      error: err?.message || "Connection refused / timeout",
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  }
}
