import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { apiRequest } from "../lib/api.js";

interface ResearchSessionItem {
  id: string;
  mode: "compareLinks" | "keywordSearch";
  keyword: string | null;
  status: string;
  bestProductId: string | null;
  createdAt: string;
}

interface ResearchListResponse {
  items: ResearchSessionItem[];
}

interface StatusStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  partialSuccess: number;
}

function computeStats(items: ResearchSessionItem[]): StatusStats {
  const stats: StatusStats = {
    total: items.length,
    completed: 0,
    failed: 0,
    pending: 0,
    partialSuccess: 0,
  };
  for (const item of items) {
    if (item.status === "completed") stats.completed++;
    else if (item.status === "failed") stats.failed++;
    else if (item.status === "pending" || item.status === "processing") stats.pending++;
    else if (item.status === "partialSuccess") stats.partialSuccess++;
  }
  return stats;
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString();
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const cls = `statusBadge statusBadge${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  return <span className={cls}>{status}</span>;
}

export function DashboardPage() {
  const query = useQuery({
    queryKey: ["research", "list"],
    queryFn: () => apiRequest<ResearchListResponse>("/research"),
  });

  if (query.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading dashboard...</div>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="pageStack">
        <div className="formError">Failed to load dashboard</div>
      </section>
    );
  }

  const items = query.data?.items ?? [];
  const stats = computeStats(items);
  const recent = items.slice(0, 5);

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1>Research Overview</h1>
        <p className="lede">Your Shopee product research activity at a glance.</p>
      </div>
      <div className="statsGrid">
        <div className="statCard">
          <span className="statLabel">Total</span>
          <span className="statValue">{stats.total}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Completed</span>
          <span className="statValue">{stats.completed}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Partial Success</span>
          <span className="statValue">{stats.partialSuccess}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Failed</span>
          <span className="statValue">{stats.failed}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Pending</span>
          <span className="statValue">{stats.pending}</span>
        </div>
      </div>
      <div className="formPanel">
        <h2>Quick Actions</h2>
        <div className="quickActions">
          <Link to="/compare" className="secondaryButton">
            Compare Links
          </Link>
          <Link to="/keyword-search" className="secondaryButton">
            Keyword Search
          </Link>
          <Link to="/settings/config" className="secondaryButton">
            Settings
          </Link>
        </div>
      </div>
      <div className="formPanel">
        <h2>Recent Research</h2>
        {recent.length === 0 ? (
          <div className="placeholderPanel">No research sessions yet. Start one above.</div>
        ) : (
          <table className="dataTable">
            <thead>
              <tr>
                <th>Mode</th>
                <th>Keyword</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((item) => (
                <tr key={item.id}>
                  <td>{item.mode}</td>
                  <td>{item.keyword ?? "-"}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    {item.status === "completed" || item.status === "partialSuccess" ? (
                      <Link
                        to="/results/$researchSessionId"
                        params={{ researchSessionId: item.id }}
                        className="secondaryButton"
                      >
                        View
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {items.length > 5 && (
          <p className="moreNote">Showing 5 of {items.length} sessions</p>
        )}
      </div>
    </section>
  );
}
