import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

interface JobDetail {
  jobId: string;
  researchSessionId: string;
  type: string;
  status: string;
  progressCurrent: number;
  progressTotal: number;
  currentStep: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const cls = `statusBadge statusBadge${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  return <span className={cls}>{status}</span>;
}

export function JobLogsPage({ jobId }: { jobId: string }) {
  const query = useQuery({
    queryKey: ["research", "job", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/research/jobs/${jobId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return (await res.json()) as JobDetail;
    },
  });

  if (query.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading job logs...</div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="pageStack">
        <div className="formError">Failed to load job logs</div>
      </section>
    );
  }

  const job = query.data;
  const progressPct = job.progressTotal > 0 ? Math.round((job.progressCurrent / job.progressTotal) * 100) : 0;

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Job Logs</p>
        <h1>Job {job.type}</h1>
        <div className="detailMeta">
          <StatusBadge status={job.status} />
          <span>{formatDate(job.createdAt)}</span>
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <span className="statLabel">Job ID</span>
          <span className="statValue statValueSmall">{job.jobId}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Progress</span>
          <span className="statValue">{progressPct}%</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Step</span>
          <span className="statValue statValueSmall">{job.progressCurrent}/{job.progressTotal}</span>
        </div>
      </div>

      {job.currentStep && (
        <div className="formPanel">
          <h2>Current Step</h2>
          <p>{job.currentStep}</p>
        </div>
      )}

      {job.errorMessage && (
        <div className="formError">
          <strong>Error:</strong> {job.errorMessage}
        </div>
      )}

      <div className="formPanel">
        <h2>Timestamps</h2>
        <table className="dataTable">
          <tbody>
            <tr><td>Created</td><td>{formatDate(job.createdAt)}</td></tr>
            <tr><td>Updated</td><td>{formatDate(job.updatedAt)}</td></tr>
          </tbody>
        </table>
      </div>

      <div>
        <Link
          to="/research/$researchSessionId"
          params={{ researchSessionId: job.researchSessionId }}
          className="secondaryButton"
        >
          View Research Session
        </Link>
      </div>
    </section>
  );
}
