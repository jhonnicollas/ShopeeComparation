import { useQuery } from "@tanstack/react-query";
import { resolveShopeeUrl, type ResolveUrlApiResult } from "../lib/shopee.js";

interface ResolverDiagnosticsProps {
  url: string;
}

function sanitizeError(msg: string | undefined): string {
  if (!msg) return "";
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*\S+/gi,
    /token\s*[:=]\s*\S+/gi,
    /secret\s*[:=]\s*\S+/gi,
    /bearer\s+\S+/gi,
    /authorization\s*:\s*\S+/gi,
  ];
  let sanitized = msg;
  for (const pattern of secretPatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }
  if (sanitized.length > 200) {
    sanitized = sanitized.slice(0, 200) + "...";
  }
  return sanitized;
}

function ResolverDisplay({ result }: { result: ResolveUrlApiResult }) {
  const { status, diagnostics, shopId, itemId, finalUrl, canonicalUrl, errorMessage } = result;
  return (
    <div className="resolverDiagnostics">
      <div className="resolverStatus">
        <span className={`statusBadge statusBadge${status === "resolved" ? "Ok" : "Failed"}`}>
          {status === "resolved" ? "Resolved" : "Failed"}
        </span>
        {status === "resolved" && (
          <span className="resolverAdapter">
            via <strong>{diagnostics.adapterUsed}</strong>
          </span>
        )}
      </div>
      {status === "resolved" ? (
        <div className="resolverDetails">
          {shopId && (
            <div className="resolverField">
              <span className="resolverLabel">Shop ID:</span>
              <span className="resolverValue">{shopId}</span>
            </div>
          )}
          {itemId && (
            <div className="resolverField">
              <span className="resolverLabel">Item ID:</span>
              <span className="resolverValue">{itemId}</span>
            </div>
          )}
          {canonicalUrl && (
            <div className="resolverField">
              <span className="resolverLabel">Canonical URL:</span>
              <span className="resolverValue resolverUrl">{canonicalUrl}</span>
            </div>
          )}
          {finalUrl && finalUrl !== canonicalUrl && (
            <div className="resolverField">
              <span className="resolverLabel">Final URL:</span>
              <span className="resolverValue resolverUrl">{finalUrl}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="resolverError">
          {errorMessage && <p className="resolverErrorMessage">{sanitizeError(errorMessage)}</p>}
        </div>
      )}
      <details className="resolverAttempts">
        <summary>{diagnostics.attempts.length} adapter attempts</summary>
        <ol className="resolverAttemptList">
          {diagnostics.attempts.map((attempt, i) => (
            <li key={i} className="resolverAttempt">
              <span className={`resolverAttemptStatus statusBadge${attempt.status === "resolved" ? "Ok" : "Failed"}`}>
                {attempt.status}
              </span>
              <span className="resolverAttemptAdapter">{attempt.adapter}</span>
              <span className="resolverAttemptMethod">{attempt.resolveMethod}</span>
              {attempt.durationMs !== undefined && (
                <span className="resolverAttemptDuration">{attempt.durationMs}ms</span>
              )}
              {attempt.errorMessage && (
                <span className="resolverAttemptError">{sanitizeError(attempt.errorMessage)}</span>
              )}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export function ResolverDiagnostics({ url }: ResolverDiagnosticsProps) {
  const query = useQuery({
    queryKey: ["resolve-url", url],
    queryFn: () => resolveShopeeUrl(url),
    enabled: !!url,
    retry: false,
  });

  if (!url) {
    return null;
  }

  if (query.isLoading) {
    return <div className="resolverLoading">Resolving URL...</div>;
  }

  if (query.isError) {
    return (
      <div className="resolverError">
        <p>Failed to resolve URL: {query.error instanceof Error ? query.error.message : "Unknown error"}</p>
      </div>
    );
  }

  if (!query.data) {
    return null;
  }

  return <ResolverDisplay result={query.data} />;
}
