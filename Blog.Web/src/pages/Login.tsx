import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import * as authApi from "../api/auth";
import { getErrorMessage } from "../utils/erros";

export default function Login() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider not found.");

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await authApi.login(email, password);
      await ctx.login(res.token);
      navigate("/posts");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "48px auto" }}>
      <div className="card">
        <div className="cardHeader">
          <h2 className="h2">Welcome back</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Sign in to access your account
          </p>
        </div>

        <div className="cardBody">
          {error && (
            <div className="alert alertError" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="btn btnPrimary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="muted" style={{ marginTop: 16, textAlign: "center" }}>
            Don’t have an account?{" "}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
