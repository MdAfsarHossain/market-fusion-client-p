"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { Alert, Button, Field, Input } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";

export const LoginForm = ({ redirectTo }: { redirectTo: string }) => {
  const router = useRouter();
  const { login, user, ready } = useAuth();
  const { refresh } = useCart();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedExistingSession, setCheckedExistingSession] = useState(false);

  // Bounce visitors who are already signed in. This deliberately runs only on
  // the first resolved auth state: letting it react to every `user` change
  // would fire again straight after a fresh login and override the
  // role-specific redirect below.
  useEffect(() => {
    if (!ready || checkedExistingSession) return;

    setCheckedExistingSession(true);

    if (user) {
      router.replace(redirectTo);
    }
  }, [ready, user, checkedExistingSession, router, redirectTo]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const loggedIn = await login(email.trim(), password);
      await refresh();

      // Vendors and admins land where they actually work
      if (redirectTo !== "/") {
        router.push(redirectTo);
      } else if (loggedIn.role === "VENDOR") {
        router.push("/vendor");
      } else if (loggedIn.role === "ADMIN" || loggedIn.role === "SUPERADMIN") {
        router.push("/admin/stores");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log you in.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <Field label="Email" required>
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Password" required>
        <PasswordInput
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={submitting}>
        Log in
      </Button>
    </form>
  );
};
