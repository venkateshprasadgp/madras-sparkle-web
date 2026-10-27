"use client";

import { useFormState, useFormStatus } from "react-dom";
import { LoaderCircle, Lock } from "lucide-react";
import { signIn, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-gold w-full" disabled={pending}>
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
      Sign in
    </button>
  );
}

export default function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action] = useFormState<LoginState, FormData>(signIn, { error: initialError });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
      </div>
      {state.error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
