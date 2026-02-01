import { useEffect, useState, useContext } from "react";
import * as usersApi from "../api/users";
import { getErrorMessage } from "../utils/erros";
import { AuthContext } from "../auth/AuthContext";

type Role = "ADMIN" | "USER";

export default function Users() {
  const ctx = useContext(AuthContext);

  const [items, setItems] = useState<usersApi.UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = ctx?.user?.id ?? null;

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await usersApi.getUsers();
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const hasRole = (u: usersApi.UserDto, role: Role) =>
    (u.roles ?? []).map((r) => r.toUpperCase()).includes(role);

  const toggleRole = async (user: usersApi.UserDto, role: Role) => {
    setError(null);

    const current = (user.roles ?? []).map((r) => r.toUpperCase() as Role);

    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];

    // Rule: the user must have at least USER
    const finalRoles: Role[] = next.length === 0 ? ["USER"] : next;

    try {
      await usersApi.setUserRoles(user.id, finalRoles);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update roles."));
    }
  };

  const deleteUser = async (user: usersApi.UserDto) => {
    setError(null);

    if (currentUserId && user.id === currentUserId) {
      setError("You cannot delete your own user.");
      return;
    }

    const label = user.userName ?? user.email ?? "this user";
    const ok = window.confirm(`Are you sure you want to delete "${label}"?`);
    if (!ok) return;

    try {
      await usersApi.deleteUser(user.id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete user."));
    }
  };

  const chipStyle = (active: boolean) =>
    ({
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid #444",
      cursor: "pointer",
      background: active ? "#2d6cdf" : "#222",
      color: active ? "white" : "#ddd",
      opacity: active ? 1 : 0.9,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      userSelect: "none",
    } as const);

  const dangerBtnStyle =
    {
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid #7a2a2a",
      cursor: "pointer",
      background: "#3a1717",
      color: "#ffd7d7",
    } as const;

  const badgeStyle =
    {
      marginLeft: 10,
      fontSize: 12,
      padding: "2px 8px",
      borderRadius: 999,
      border: "1px solid #444",
      color: "#ddd",
      background: "#222",
      display: "inline-block",
      lineHeight: "18px",
    } as const;

  return (
    <div style={{ maxWidth: 980, margin: "32px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 6 }}>Users</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Manage roles and delete users (admin only).
          </p>
        </div>

        <button className="btn" onClick={load} type="button">
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alertError" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading users...</div>
      ) : items.length === 0 ? (
        <p className="muted">No users found.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((u) => {
            const userActive = hasRole(u, "USER");
            const adminActive = hasRole(u, "ADMIN");
            const isMe = currentUserId && u.id === currentUserId;

            const displayName = u.userName ?? u.email ?? "-";

            return (
              <div key={u.id} className="card">
                <div className="cardBody" style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  {/* Left: identity */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 16 }}>{displayName}</strong>
                      {isMe && <span style={badgeStyle}>you</span>}
                    </div>

                    <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                      ID: <span style={{ opacity: 0.9 }}>{u.id}</span>
                    </div>
                  </div>

                  {/* Middle: roles */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 260 }}>
                    <div className="muted" style={{ fontSize: 13 }}>
                      Roles
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={chipStyle(userActive)}
                        onClick={() => toggleRole(u, "USER")}
                        title="Toggle USER role"
                      >
                        USER {userActive ? "✓" : ""}
                      </button>

                      <button
                        type="button"
                        style={chipStyle(adminActive)}
                        onClick={() => toggleRole(u, "ADMIN")}
                        title="Toggle ADMIN role"
                      >
                        ADMIN {adminActive ? "✓" : ""}
                      </button>
                    </div>

                    <div className="muted" style={{ fontSize: 12 }}>
                      Tip: Users must always have at least one role.
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", minWidth: 140 }}>
                    <button
                      type="button"
                      style={{ ...dangerBtnStyle, opacity: isMe ? 0.5 : 1 }}
                      onClick={() => deleteUser(u)}
                      disabled={!!isMe}
                      title={isMe ? "You cannot delete yourself" : "Delete user"}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
