import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../lib/auth.js";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
      return;
    }
    if (user && user.role !== "admin") {
      void navigate({ to: "/" });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Checking authentication...</div>
      </section>
    );
  }

  if (!isAuthenticated) return null;
  if (user && user.role !== "admin") {
    return (
      <section className="pageStack">
        <div className="formError" role="alert">
          Anda tidak punya akses ke halaman admin. Hanya akun dengan role <code>admin</code> yang diizinkan.
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
