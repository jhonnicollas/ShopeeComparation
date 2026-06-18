import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAiModel,
  deleteAiProvider,
  deleteAppConfig,
  deleteScoringConfig,
  deleteSearchProvider,
  listAiModels,
  listAiProviders,
  listAppConfigs,
  listScoringConfigs,
  listSearchProviders,
  testAiModel,
  type ModelTestResult,
} from "../lib/config.js";
import { ApiClientError } from "../lib/api.js";

type TabKey = "apps" | "ai-providers" | "ai-models" | "search-providers" | "scoring-configs";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "apps", label: "App Configs" },
  { key: "ai-providers", label: "AI Providers" },
  { key: "ai-models", label: "AI Models" },
  { key: "search-providers", label: "Search Providers" },
  { key: "scoring-configs", label: "Scoring Configs" },
];

export function ConfigPage() {
  const [tab, setTab] = useState<TabKey>("apps");
  const queryClient = useQueryClient();

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Admin</p>
        <h1>Runtime Configuration</h1>
        <p className="lede">
          Manage app settings, AI providers, models, search providers, and scoring configs.
        </p>
      </div>
      <div className="configTabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`configTab ${tab === t.key ? "configTabActive" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "apps" && (
        <AppConfigsTab
          onDelete={() => queryClient.invalidateQueries({ queryKey: ["config", "apps"] })}
        />
      )}
      {tab === "ai-providers" && (
        <AiProvidersTab
          onDelete={() => queryClient.invalidateQueries({ queryKey: ["config", "ai-providers"] })}
        />
      )}
      {tab === "ai-models" && (
        <AiModelsTab
          onDelete={() => queryClient.invalidateQueries({ queryKey: ["config", "ai-models"] })}
        />
      )}
      {tab === "search-providers" && (
        <SearchProvidersTab
          onDelete={() =>
            queryClient.invalidateQueries({ queryKey: ["config", "search-providers"] })
          }
        />
      )}
      {tab === "scoring-configs" && (
        <ScoringConfigsTab
          onDelete={() =>
            queryClient.invalidateQueries({ queryKey: ["config", "scoring-configs"] })
          }
        />
      )}
    </section>
  );
}

function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  if (error instanceof ApiClientError) return <div className="formError">{error.message}</div>;
  if (error instanceof Error) return <div className="formError">{error.message}</div>;
  return <div className="formError">An error occurred</div>;
}

function AppConfigsTab({ onDelete }: { onDelete: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["config", "apps"],
    queryFn: listAppConfigs,
  });
  const mutation = useMutation({
    mutationFn: (id: string) => deleteAppConfig(id),
    onSuccess: onDelete,
  });

  return (
    <div className="configPanel">
      {isLoading ? (
        <div className="loadingState">Loading...</div>
      ) : (
        <>
          <ErrorMessage error={error} />
          <table className="configTable">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Category</th>
                <th>Enabled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.configs.map((c) => (
                <tr key={c.id}>
                  <td>{c.key}</td>
                  <td>{c.value ?? "—"}</td>
                  <td>{c.category}</td>
                  <td>{c.isEnabled === 1 ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="dangerButton"
                      onClick={() => mutation.mutate(c.id)}
                      disabled={mutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function AiProvidersTab({ onDelete }: { onDelete: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["config", "ai-providers"],
    queryFn: listAiProviders,
  });
  const mutation = useMutation({
    mutationFn: (id: string) => deleteAiProvider(id),
    onSuccess: onDelete,
  });

  return (
    <div className="configPanel">
      {isLoading ? (
        <div className="loadingState">Loading...</div>
      ) : (
        <>
          <ErrorMessage error={error} />
          <table className="configTable">
            <thead>
              <tr>
                <th>Key</th>
                <th>Name</th>
                <th>Auth</th>
                <th>Enabled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.providerKey}</td>
                  <td>{p.displayName}</td>
                  <td>{p.authType}</td>
                  <td>{p.isEnabled === 1 ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="dangerButton"
                      onClick={() => mutation.mutate(p.id)}
                      disabled={mutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function AiModelsTab({ onDelete }: { onDelete: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["config", "ai-models"],
    queryFn: () => listAiModels(),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAiModel(id),
    onSuccess: onDelete,
  });
  const [testResult, setTestResult] = useState<Record<string, ModelTestResult> | null>(null);
  const testMutation = useMutation({
    mutationFn: (id: string) => testAiModel(id),
    onSuccess: (result, id) => {
      setTestResult((prev) => ({ ...(prev ?? {}), [id]: result }));
      onDelete();
    },
  });

  return (
    <div className="configPanel">
      {isLoading ? (
        <div className="loadingState">Loading...</div>
      ) : (
        <>
          <ErrorMessage error={error} />
          <table className="configTable">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Model Key</th>
                <th>Usage</th>
                <th>Default</th>
                <th>Enabled</th>
                <th>Test</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.models.map((m) => (
                <tr key={m.id}>
                  <td>{m.providerKey}</td>
                  <td>{m.modelKey}</td>
                  <td>{m.usageType}</td>
                  <td>{m.isDefault === 1 ? "Yes" : "No"}</td>
                  <td>{m.isEnabled === 1 ? "Yes" : "No"}</td>
                  <td>
                    {testResult?.[m.id] ? (
                      <span
                        className={
                          testResult[m.id]?.status === "success"
                            ? "testBadgeSuccess"
                            : "testBadgeFailed"
                        }
                      >
                        {testResult[m.id]?.status} ({testResult[m.id]?.latencyMs}ms)
                      </span>
                    ) : (
                      <span className="testBadgeNone">not tested</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondaryButton"
                      onClick={() => testMutation.mutate(m.id)}
                      disabled={testMutation.isPending}
                    >
                      Test
                    </button>
                    <button
                      type="button"
                      className="dangerButton"
                      onClick={() => deleteMutation.mutate(m.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function SearchProvidersTab({ onDelete }: { onDelete: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["config", "search-providers"],
    queryFn: listSearchProviders,
  });
  const mutation = useMutation({
    mutationFn: (id: string) => deleteSearchProvider(id),
    onSuccess: onDelete,
  });

  return (
    <div className="configPanel">
      {isLoading ? (
        <div className="loadingState">Loading...</div>
      ) : (
        <>
          <ErrorMessage error={error} />
          <table className="configTable">
            <thead>
              <tr>
                <th>Key</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Enabled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.providerKey}</td>
                  <td>{p.providerType}</td>
                  <td>{p.priority}</td>
                  <td>{p.isEnabled === 1 ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="dangerButton"
                      onClick={() => mutation.mutate(p.id)}
                      disabled={mutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function ScoringConfigsTab({ onDelete }: { onDelete: () => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["config", "scoring-configs"],
    queryFn: listScoringConfigs,
  });
  const mutation = useMutation({
    mutationFn: (id: string) => deleteScoringConfig(id),
    onSuccess: onDelete,
  });

  return (
    <div className="configPanel">
      {isLoading ? (
        <div className="loadingState">Loading...</div>
      ) : (
        <>
          <ErrorMessage error={error} />
          <table className="configTable">
            <thead>
              <tr>
                <th>Key</th>
                <th>Name</th>
                <th>Category</th>
                <th>Default</th>
                <th>Enabled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.configs.map((c) => (
                <tr key={c.id}>
                  <td>{c.configKey}</td>
                  <td>{c.displayName}</td>
                  <td>{c.category}</td>
                  <td>{c.isDefault === 1 ? "Yes" : "No"}</td>
                  <td>{c.isEnabled === 1 ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="dangerButton"
                      onClick={() => mutation.mutate(c.id)}
                      disabled={mutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
