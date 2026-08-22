import { isNeonAuthConfigured } from "@/lib/auth-constants";
import { getNeonAuth } from "@/lib/neon-auth";

function notConfigured() {
  return Response.json(
    { error: "Neon Auth is not configured." },
    { status: 501 },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!isNeonAuthConfigured()) return notConfigured();
  return getNeonAuth().handler().GET(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!isNeonAuthConfigured()) return notConfigured();
  return getNeonAuth().handler().POST(request, context);
}
