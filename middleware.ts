import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

const STAFF = ["SUPER_ADMINISTRATOR", "ADMINISTRATOR", "CONTENT_EDITOR"];
const MANAGERS = ["SUPER_ADMINISTRATOR", "ADMINISTRATOR"];
const MANAGER_ONLY = ["/admin/settings", "/admin/audit", "/admin/users"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname.startsWith("/admin/login");

  if (!isSupabaseConfigured()) {
    if (isAdmin && !isLogin) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdmin || isLogin) return response;

  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!user || user.is_anonymous) return redirectTo(`/admin/login?next=${encodeURIComponent(pathname)}`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !STAFF.includes(profile.role)) return redirectTo("/admin/login?error=unauthorized");

  if (MANAGER_ONLY.some((p) => pathname.startsWith(p)) && !MANAGERS.includes(profile.role)) {
    return redirectTo("/admin?denied=1");
  }

  return response;
}

// Public storefront pages read only public data, so they skip the per-request
// Supabase auth round trip; the browser client refreshes visitor sessions itself.
export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
