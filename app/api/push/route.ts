import { NextResponse } from "next/server";
import { registerPushSubscription } from "@/lib/services/notify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, subscription, userAgent } = body;

    if (!userId || !subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    const sub = await registerPushSubscription(userId, subscription, userAgent);
    return NextResponse.json({ ok: true, id: sub.id });
  } catch (error) {
    console.error("Failed to register push subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register push" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "TEST_VAPID_KEY_PROVISIONED",
  });
}
