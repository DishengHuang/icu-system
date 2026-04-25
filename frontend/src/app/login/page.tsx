import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="card login-page">
      <h1 className="section-title">Doctor Login</h1>
      <p className="muted">Use doctor@example.com / doctor123 to sign in.</p>
      <LoginForm />
    </main>
  );
}
