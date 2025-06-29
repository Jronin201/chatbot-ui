import { createClient } from "@/lib/supabase/middleware";
import { i18nRouter } from "next-i18n-router";
import { NextResponse, type NextRequest } from "next/server";
import i18nConfig from "./i18nConfig";

export async function middleware(request: NextRequest) {
  /* ── 1. DEBUG: log the two headers Next.js compares ───────────── */
  const xfHost = request.headers.get("x-forwarded-host");
  const origin  = request.headers.get("origin");
  console.log("[MW] host,origin →", xfHost, origin);

  /* ── 2. PATCH: if running in Codespaces (origin is localhost) ─── */
  if (xfHost && origin?.includes("localhost")) {
    request.headers.set("origin", `https://${xfHost}`);
  }

  /* ── 3. Existing i18n & Supabase logic (unchanged) ────────────── */
  const i18nResult = i18nRouter(request, i18nConfig);
  if (i18nResult) return i18nResult;

  try {
    const { supabase, response } = createClient(request);

    const session = await supabase.auth.getSession();

    const redirectToChat = session && request.nextUrl.pathname === "/";

    if (redirectToChat) {
      const { data: homeWorkspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session.data.session?.user.id)
        .eq("is_home", true)
        .single();

      if (!homeWorkspace) throw new Error(error?.message);

      return NextResponse.redirect(
        new URL(`/${homeWorkspace.id}/chat`, request.url)
      );
    }

    return response;
  } catch {
    /* fall through to normal Next.js handling on error */
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth).*)",
};
