import { NextResponse } from "next/server";
import { currentActor, currentUserName } from "@/lib/session";

export const dynamic = "force-dynamic";

const noStore = { headers: { "Cache-Control": "no-store" } };

// A display name and a role, nothing else. The staff bar is the only caller and needs no more.
export async function GET() {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ signedIn: false }, noStore);

  const name = await currentUserName();
  return NextResponse.json({ signedIn: true, name: name ?? "Signed in", role: actor.role }, noStore);
}
