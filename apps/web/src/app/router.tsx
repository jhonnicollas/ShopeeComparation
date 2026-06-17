import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { ComparePage } from "../pages/ComparePage";
import { HomePage } from "../pages/HomePage";
import { KeywordSearchPage } from "../pages/KeywordSearchPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";

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

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  component: ComparePage,
});

const keywordSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/keyword-search",
  component: KeywordSearchPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  compareRoute,
  keywordSearchRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppShell() {
  return (
    <div className="appShell">
      <header className="topBar">
        <Link className="brand" to="/">
          Shopee Product Research AI
        </Link>
        <nav className="navLinks" aria-label="Primary navigation">
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
      </header>
      <main className="mainContent">
        <Outlet />
      </main>
    </div>
  );
}
