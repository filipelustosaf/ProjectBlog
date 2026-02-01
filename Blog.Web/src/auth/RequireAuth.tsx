import { useContext, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export function RequireAuth({
  children,
  adminOnly,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext não encontrado. Envolva com <AuthProvider>.");

  if (ctx.loading) return <div style={{ padding: 16 }}>Carregando...</div>;

  if (!ctx.token) return <Navigate to="/login" replace />;

  if (adminOnly && !ctx.isAdmin) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Acesso negado</h3>
        <p>Essa tela é apenas para ADMIN.</p>
      </div>
    );
  }

  return <>{children}</>;
}
