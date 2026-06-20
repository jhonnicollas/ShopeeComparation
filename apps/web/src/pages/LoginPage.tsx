import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { login, type LoginRequest } from "../lib/auth.js";
import { ApiClientError } from "../lib/api.js";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["research", "list"] });
      void navigate({ to: "/" });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    mutation.mutate({ email, password });
  };

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Account</p>
        <h1>Sign In</h1>
        <p className="lede">Access your research workspace and continue comparing products.</p>
      </div>
      <form className="formPanel" onSubmit={handleSubmit} noValidate>
        <div className="formField">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={mutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={mutation.isPending}
          />
        </div>
        {error ? (
          <div className="formError" role="alert">
            {error}
          </div>
        ) : null}
        <button type="submit" className="primaryButton" disabled={mutation.isPending}>
          {mutation.isPending ? "Signing in..." : "Sign In"}
        </button>
        <p className="formFootnote">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </section>
  );
}
