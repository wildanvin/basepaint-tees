import { getAuthenticatedUser, syncUserProfile } from "@/lib/supabase-auth";

type SyncInput = {
  walletAddress?: string;
};

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return Response.json({ error: "Not signed in." }, { status: 401 });
    }

    const input = (await request.json().catch(() => ({}))) as SyncInput;
    const walletAddress = await syncUserProfile({
      user,
      walletAddress: input.walletAddress,
    });

    return Response.json({ ok: true, walletAddress });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync account.";

    return Response.json({ error: message }, { status: 500 });
  }
}
