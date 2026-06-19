import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

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

export function HistoryPage() {
  const query = useQuery({
    queryKey: ["research", "list"],
    queryFn: async () => {
      const res = await fetch("/api/research", {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as ResearchListResponse;
    },
  });

  if (query.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading history...</div>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="pageStack">
        <div className="formError">Failed to load history</div>
      </section>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">History</p>
        <h1>Research History</h1>
        <p className="lede">All your Shopee product research sessions.</p>
      </div>
      <div className="formPanel">
        {items.length === 0 ? (
          <div className="placeholderPanel">No research sessions yet.</div>
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
              {items.map((item) => (
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
      </div>
    </section>
  );
}
