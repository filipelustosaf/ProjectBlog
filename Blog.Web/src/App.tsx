import { Link, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Posts from "./pages/Posts";
import Users from "./pages/Users";
import { RequireAuth } from "./auth/RequireAuth";
import { useContext } from "react";
import { AuthContext } from "./auth/AuthContext";

export default function App() {
  const ctx = useContext(AuthContext);
  const logged = !!ctx?.token;

  return (
    <div>
      <header className="topbar">
        <div className="container">
          <nav className="nav">
            <div className="brand">
              <span>Blog</span>
              <span className="badge">Fullstack</span>
            </div>

            {logged && (
              <>
                <Link to="/posts" className="pill">Posts</Link>
                {ctx?.isAdmin && <Link to="/users" className="pill">Users</Link>}
              </>
            )}

            <div className="spacer">
              {logged ? (
                <>
                  <span className="pill">
                    {ctx?.user?.email ?? "user"}{" "}
                    <span className="badge">{ctx?.isAdmin ? "ADMIN" : "USER"}</span>
                  </span>
                  <button className="btn btnGhost" onClick={ctx?.logout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="pill" to="/login">Login</Link>
                  <Link className="pill" to="/register">Register</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to={logged ? "/posts" : "/login"} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/posts"
              element={
                <RequireAuth>
                  <Posts />
                </RequireAuth>
              }
            />

            <Route
              path="/users"
              element={
                <RequireAuth adminOnly>
                  <Users />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
