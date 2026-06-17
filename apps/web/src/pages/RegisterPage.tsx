import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { register, type RegisterRequest } from "../lib/auth.js";
import { ApiClientError } from "../lib/api.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: () => {
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    mutation.mutate({
      email,
      password,
      name: name || undefined,
    });
  };

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Account</p>
        <h1>Create Account</h1>
        <p className="lede">Get started with structured Shopee product research.</p>
      </div>
      <form className="formPanel" onSubmit={handleSubmit} noValidate>
        <div className="formField">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={mutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="register-name">Name (optional)</label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={mutation.isPending}
          />
        </div>
        <div className="formField">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={mutation.isPending}
          />
          <small className="formHint">At least 8 characters.</small>
        </div>
        {error ? (
          <div className="formError" role="alert">
            {error}
          </div>
        ) : null}
        <button type="submit" className="primaryButton" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account..." : "Create Account"}
        </button>
        <p className="formFootnote">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
