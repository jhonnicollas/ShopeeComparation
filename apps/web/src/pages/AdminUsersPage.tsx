import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/api.js";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  activeSessionCount: number;
  researchSessionCount: number;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminUsersPage() {
  const qc = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiRequest<{ items: AdminUser[] }>("/admin/users"),
  });

  const setStatus = useMutation({
    mutationFn: async (input: { id: string; status: "active" | "disabled" }) => {
      const action = input.status === "active" ? "enable" : "disable";
      return apiRequest<{ success: boolean }>(`/admin/users/${input.id}/${action}`, {
        method: "POST",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const revokeSessions = useMutation({
    mutationFn: async (userId: string) =>
      apiRequest<{ success: boolean; revoked: number }>(
        `/admin/users/${userId}/revoke-sessions`,
        { method: "POST" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  if (usersQuery.isLoading) {
    return (
      <section className="pageStack">
        <div className="loadingState">Loading users...</div>
      </section>
    );
  }

  if (usersQuery.isError) {
    return (
      <section className="pageStack">
        <div className="formError">
          Gagal memuat data user. Pastikan Anda login sebagai admin.
        </div>
      </section>
    );
  }

  const users = usersQuery.data?.items ?? [];

  return (
    <section className="pageStack">
      <div>
        <p className="eyebrow">Admin</p>
        <h1>User Management</h1>
        <p className="lede">
          Daftar semua user. Anda bisa disable/enable user atau revoke semua session
          aktif (force logout semua device).
        </p>
      </div>

      <div className="formPanel">
        <h2>{users.length} user terdaftar</h2>
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Active Sessions</th>
                <th>Research Sessions</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} data-testid={`admin-user-row-${u.id}`}>
                  <td>{u.email}</td>
                  <td>{u.name ?? "-"}</td>
                  <td>
                    <span className={`statusBadge ${u.role === "admin" ? "statusBadgeMALL" : ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`statusBadge ${u.status === "active" ? "statusBadgeSTAR" : "statusBadgeREGULAR"}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>{u.activeSessionCount}</td>
                  <td>{u.researchSessionCount}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {u.status === "active" ? (
                        <button
                          type="button"
                          className="secondaryButton"
                          onClick={() => setStatus.mutate({ id: u.id, status: "disabled" })}
                          disabled={setStatus.isPending}
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="secondaryButton"
                          onClick={() => setStatus.mutate({ id: u.id, status: "active" })}
                          disabled={setStatus.isPending}
                        >
                          Enable
                        </button>
                      )}
                      <button
                        type="button"
                        className="secondaryButton"
                        onClick={() => {
                          if (confirm(`Revoke all sessions for ${u.email}? (force logout semua device)`)) {
                            revokeSessions.mutate(u.id);
                          }
                        }}
                        disabled={revokeSessions.isPending}
                      >
                        Force Logout
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {revokeSessions.data && (
          <p className="formSuccess" style={{ marginTop: "12px" }}>
            ✓ Revoked {revokeSessions.data.revoked} session(s).
          </p>
        )}
      </div>
    </section>
  );
}
