import { Gem } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const configured = isSupabaseConfigured();
  return (
    <div className="flex min-h-screen items-center justify-center bg-royal p-4">
      <div className="card w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <Gem className="mx-auto h-8 w-8 text-gold" />
          <h1 className="mt-3 font-heading text-2xl text-gold-gradient">Madras Sparkle CMS</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500">
            Super Administrator · Administrator · Content Editor
          </p>
        </div>
        {configured ? (
          <LoginForm
            next={searchParams.next ?? "/admin"}
            initialError={searchParams.error === "unauthorized" ? "This account does not have CMS access." : undefined}
          />
        ) : (
          <p className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm text-neutral-300">
            Supabase is not configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>SUPABASE_ANON_KEY</code> to enable the admin CMS.
          </p>
        )}
      </div>
    </div>
  );
}
