"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const TOKEN_KEY = "icu_access_token";
const DOCTOR_KEY = "icu_doctor_name";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
      .trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        detail?: string | { msg?: string }[];
        access_token?: string;
        doctor_name?: string;
      };

      if (!res.ok) {
        const msg =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((d) => d.msg).filter(Boolean).join(", ") ||
                "Login failed"
              : "Invalid email or password";
        setError(msg);
        return;
      }

      if (!data.access_token) {
        setError("Unexpected response from server");
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);
      if (data.doctor_name) {
        localStorage.setItem(DOCTOR_KEY, data.doctor_name);
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Cannot reach the API. Is the backend running on port 8000? Check NEXT_PUBLIC_API_URL."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      {error ? <p className="login-form-error">{error}</p> : null}
      <label className="login-form-label">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="login-form-input"
          placeholder="doctor@example.com"
          defaultValue="doctor@example.com"
        />
      </label>
      <label className="login-form-label">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="login-form-input"
          placeholder="doctor123"
        />
      </label>
      <button
        type="submit"
        className="dashboard-search-btn login-form-submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
