import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ComparePage } from "../pages/ComparePage";
import { ConfigPage } from "../pages/ConfigPage";
import { DashboardPage } from "../pages/DashboardPage";
import { HomePage } from "../pages/HomePage";
import { HistoryPage } from "../pages/HistoryPage";
import { KeywordSearchPage } from "../pages/KeywordSearchPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResultPage } from "../pages/ResultPage";
import { SettingsPage } from "../pages/SettingsPage";
import { RequireAuth } from "../components/RequireAuth.js";
import { logout, useAuth } from "../lib/auth.js";

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: () => (
    <RequireAuth>
      <HistoryPage />
    </RequireAuth>
  ),
});

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  component: () => (
    <RequireAuth>
      <ComparePage />
    </RequireAuth>
  ),
});

const keywordSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/keyword-search",
  component: () => (
    <RequireAuth>
      <KeywordSearchPage />
    </RequireAuth>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

const configRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/config",
  component: () => (
    <RequireAuth>
      <ConfigPage />
    </RequireAuth>
  ),
});

const resultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results/$researchSessionId",
  component: () => (
    <RequireAuth>
      <ResultPage />
    </RequireAuth>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  historyRoute,
  compareRoute,
  keywordSearchRoute,
  settingsRoute,
  configRoute,
  resultRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppShell() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="appShell">
      <header className="topBar">
        <Link className="brand" to="/">
          Shopee Product Research AI
        </Link>
        <nav className="navLinks" aria-label="Primary navigation">
          <Link to="/dashboard" activeProps={{ "aria-current": "page" }}>
            Dashboard
          </Link>
          <Link to="/history" activeProps={{ "aria-current": "page" }}>
            History
          </Link>
          <Link to="/compare" activeProps={{ "aria-current": "page" }}>
            Compare
          </Link>
          <Link to="/keyword-search" activeProps={{ "aria-current": "page" }}>
            Keyword Search
          </Link>
          <Link to="/settings" activeProps={{ "aria-current": "page" }}>
            Settings
          </Link>
        </nav>
        <div className="userArea">
          {isAuthenticated && user ? (
            <>
              <span className="userEmail">{user.email}</span>
              <button
                type="button"
                className="secondaryButton"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </button>
            </>
          ) : (
            <Link to="/login" className="secondaryButton">
              Sign In
            </Link>
          )}
        </div>
      </header>
      <main className="mainContent">
        <Outlet />
      </main>
    </div>
  );
}
