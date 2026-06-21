import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/api.js";

interface AdminJob {
  id: string;
  userId: string;
  researchSessionId: string | null;
  type: string;
  status: string;
  progressCurrent: number;
  progressTotal: number;
  currentStep: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminJobLog {
  id: string;
  jobId: string;
  level: string;
  message: string;
  metadataJson: string | null;
  createdAt: string;
}

type TabKey = "failed" | "processing" | "completed" | "logs";

export function AdminDashboardPage() {
  const [tab, setTab] = useState<TabKey>("failed");
  const [expanded, setExpanded] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["admin", "jobs", tab],
    queryFn: () =>
      apiRequest<{ items: AdminJob[] }>(
        `/research/admin/jobs?status=${tab}&limit=100`
      ),
    refetchInterval: 5000,
  });

  const logsQuery = useQuery({
    queryKey: ["admin", "logs"],
    queryFn: () =>
      apiRequest<{ items: AdminJobLog[] }>(
        `/research/admin/logs?limit=200`
      ),
    enabled: tab === "logs",
    refetchInterval: 5000,
  });

  const failed = jobsQuery.data?.items?.filter((j) => j.errorMessage) ?? [];
  const total = jobsQuery.data?.items?.length ?? 0;

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Admin</p>
        <h1>Job Monitoring</h1>
        <p className="lede">
          Pantau job ekstraksi Shopee real-time. Klik baris untuk melihat log detail.
        </p>
      </div>

      <div className="configTabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "failed"}
          className={`configTab ${tab === "failed" ? "configTabActive" : ""}`}
          onClick={() => setTab("failed")}
        >
          Failed Jobs
        </button>
        <button
          role="tab"
          aria-selected={tab === "processing"}
          className={`configTab ${tab === "processing" ? "configTabActive" : ""}`}
          onClick={() => setTab("processing")}
        >
          Processing
        </button>
        <button
          role="tab"
          aria-selected={tab === "completed"}
          className={`configTab ${tab === "completed" ? "configTabActive" : ""}`}
          onClick={() => setTab("completed")}
        >
          Completed
        </button>
        <button
          role="tab"
          aria-selected={tab === "logs"}
          className={`configTab ${tab === "logs" ? "configTabActive" : ""}`}
          onClick={() => setTab("logs")}
        >
          All Logs
        </button>
      </div>

      {tab === "logs" ? (
        <LogsPanel logs={logsQuery.data?.items ?? []} loading={logsQuery.isLoading} error={logsQuery.error} />
      ) : (
        <JobsPanel
          jobs={jobsQuery.data?.items ?? []}
          loading={jobsQuery.isLoading}
          error={jobsQuery.error}
          failedCount={failed.length}
          totalCount={total}
          expanded={expanded}
          onToggle={(id) => setExpanded((prev) => (prev === id ? null : id))}
        />
      )}
    </section>
  );
}

function JobsPanel({
  jobs,
  loading,
  error,
  failedCount,
  totalCount,
  expanded,
  onToggle,
}: {
  jobs: AdminJob[];
  loading: boolean;
  error: unknown;
  failedCount: number;
  totalCount: number;
  expanded: string | null;
  onToggle: (id: string) => void;
}) {
  if (loading) {
    return <div className="loadingState">Memuat job...</div>;
  }
  if (error) {
    return (
      <div className="formError" role="alert">
        Gagal memuat job: {error instanceof Error ? error.message : "Unknown"}
      </div>
    );
  }
  if (jobs.length === 0) {
    return (
      <div className="placeholderPanel">
        Tidak ada job dengan status ini.{" "}
        {totalCount > 0 && <span>({totalCount} dimuat)</span>}
      </div>
    );
  }
  return (
    <>
      <div className="formPanel">
        <p>
          Menampilkan {jobs.length} job. Failed dengan pesan error: <strong>{failedCount}</strong>.
        </p>
      </div>
      <div className="tableScroll">
        <table className="dataTable">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Step</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <JobRow
                key={j.id}
                job={j}
                expanded={expanded === j.id}
                onToggle={() => onToggle(j.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function JobRow({
  job,
  expanded,
  onToggle,
}: {
  job: AdminJob;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: logs } = useQuery({
    queryKey: ["admin", "job", "logs", job.id],
    queryFn: () =>
      apiRequest<{ items: AdminJobLog[] }>(`/research/jobs/${job.id}/logs`),
    enabled: expanded,
  });

  return (
    <>
      <tr
        onClick={onToggle}
        style={{ cursor: "pointer" }}
        className={job.status === "failed" ? "bestRow" : ""}
      >
        <td>
          <code>{job.id}</code>
        </td>
        <td>{job.type}</td>
        <td>
          <span className={`riskBadge riskBadge${job.status.toUpperCase()}`}>
            {job.status}
          </span>
        </td>
        <td>
          {job.progressCurrent} / {job.progressTotal}
        </td>
        <td>{job.currentStep ?? "-"}</td>
        <td>{new Date(job.updatedAt).toLocaleString("id-ID")}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6}>
            <div className="formPanel" style={{ margin: 0 }}>
              <h3>Detail Job {job.id}</h3>
              <p>
                <strong>User:</strong> <code>{job.userId}</code>
              </p>
              <p>
                <strong>Session:</strong> <code>{job.researchSessionId ?? "-"}</code>
              </p>
              {job.errorMessage && (
                <div className="formError" role="alert">
                  <strong>Error:</strong> {job.errorMessage}
                </div>
              )}
              <h4>Logs</h4>
              {logs?.items?.length ? (
                <ul>
                  {logs.items.map((l) => (
                    <li key={l.id}>
                      <code>[{l.level}]</code> {l.message}
                      <br />
                      <small>{new Date(l.createdAt).toLocaleString("id-ID")}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Tidak ada log.</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function LogsPanel({
  logs,
  loading,
  error,
}: {
  logs: AdminJobLog[];
  loading: boolean;
  error: unknown;
}) {
  if (loading) return <div className="loadingState">Memuat log...</div>;
  if (error) {
    return (
      <div className="formError" role="alert">
        Gagal memuat log: {error instanceof Error ? error.message : "Unknown"}
      </div>
    );
  }
  if (logs.length === 0) {
    return <div className="placeholderPanel">Belum ada log.</div>;
  }
  return (
    <div className="tableScroll">
      <table className="dataTable">
        <thead>
          <tr>
            <th>Level</th>
            <th>Job</th>
            <th>Message</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>
                <span className={`riskBadge riskBadge${l.level.toUpperCase()}`}>
                  {l.level}
                </span>
              </td>
              <td>
                <code>{l.jobId}</code>
              </td>
              <td>{l.message}</td>
              <td>{new Date(l.createdAt).toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
