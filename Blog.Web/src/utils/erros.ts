import axios from "axios";

export function getErrorMessage(err: unknown, fallback = "Ocorreu um erro.") {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;

    if (typeof data === "string") return data;

    if (data && typeof data === "object") {
      // tenta capturar padrões comuns
      const anyData = data as Record<string, unknown>;

      if (typeof anyData.message === "string") return anyData.message;

      // Identity errors: { errors: [ { code, description } ] }
      const errors = anyData.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0] as any;
        if (first?.description) return String(first.description);
      }
    }

    if (err.response?.status === 401) return "Não autorizado. Faça login novamente.";
    if (err.response?.status === 403) return "Acesso negado.";
    return err.message || fallback;
  }

  if (err instanceof Error) return err.message;
  return fallback;
}
