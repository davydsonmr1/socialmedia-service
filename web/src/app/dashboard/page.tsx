"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, type ApiKeySummary } from "@/lib/api";
import { ApiKeyModal } from "@/components/api-key-modal";

export default function DashboardPage() {
  const router = useRouter();

  // ─── State ───
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Modal state for one-time key reveal
  const [newKeyData, setNewKeyData] = useState<{
    plainKey: string;
    keyHint: string;
  } | null>(null);

  // ─── Fetch Keys ───
  const fetchKeys = useCallback(async () => {
    try {
      const response = await api.getKeys();
      setKeys(response.data);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 401) {
        router.push("/");
        return;
      }
      console.error("Failed to fetch keys:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  // ─── Create Key ───
  const handleCreateKey = async () => {
    setCreating(true);
    try {
      const response = await api.createKey();
      // Show one-time modal with plaintext key
      setNewKeyData({
        plainKey: response.data.plainKey,
        keyHint: response.data.keyHint,
      });
      // Refresh the list in the background
      await fetchKeys();
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 401) {
        router.push("/");
        return;
      }
      console.error("Failed to create key:", error);
    } finally {
      setCreating(false);
    }
  };

  // ─── Revoke Key ───
  const handleRevokeKey = async (id: string) => {
    if (!confirm("Tem certeza que deseja revogar esta chave? Esta ação não pode ser desfeita.")) {
      return;
    }
    setRevokingId(id);
    try {
      await api.revokeKey(id);
      await fetchKeys();
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 401) {
        router.push("/");
        return;
      }
      console.error("Failed to revoke key:", error);
    } finally {
      setRevokingId(null);
    }
  };

  // ─── Close Modal (Wipe key from state) ───
  const handleCloseModal = () => {
    setNewKeyData(null);
  };

  // ─── Helpers ───
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeKeys = keys.filter((k) => !k.revokedAt);
  const revokedKeys = keys.filter((k) => k.revokedAt);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Header */}
      <header
        className="border-b sticky top-0 z-40"
        style={{
          borderColor: "var(--color-border)",
          background: "rgba(10, 10, 15, 0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), #4f46e5)",
              }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <span className="font-bold text-lg">LinkedBridge</span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="text-sm px-3 py-1 rounded-full"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                color: "var(--color-success)",
              }}
            >
              ● Conectado
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Title + CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">API Keys</h1>
            <p style={{ color: "var(--color-text-muted)" }} className="text-sm">
              Gere e faça a gestão das tuas chaves de API para o portfólio.
            </p>
          </div>

          <button
            onClick={handleCreateKey}
            disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm text-white rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), #4f46e5)",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
            }}
          >
            {creating ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                A gerar...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Gerar Nova API Key
              </>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg
              className="w-8 h-8 animate-spin"
              style={{ color: "var(--color-primary)" }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}

        {/* Empty State */}
        {!loading && keys.length === 0 && (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(99, 102, 241, 0.1)" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "var(--color-primary)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Sem API Keys</h3>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              Gera a tua primeira chave para conectar o teu portfólio.
            </p>
            <button
              onClick={handleCreateKey}
              disabled={creating}
              className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm text-white rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), #4f46e5)",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Gerar Primeira API Key
            </button>
          </div>
        )}

        {/* Keys Table */}
        {!loading && keys.length > 0 && (
          <div className="space-y-6">
            {/* Active Keys */}
            {activeKeys.length > 0 && (
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--color-success)" }}
                    />
                    Chaves Ativas ({activeKeys.length})
                  </h2>
                </div>

                <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {activeKeys.map((key) => (
                    <div
                      key={key.id}
                      className="px-6 py-4 flex items-center justify-between transition-colors duration-150"
                      style={
                        {
                          "--tw-divide-color": "var(--color-border)",
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(34, 197, 94, 0.1)" }}
                        >
                          <svg
                            className="w-5 h-5"
                            style={{ color: "var(--color-success)" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                          </svg>
                        </div>
                        <div>
                          <code
                            className="text-sm font-mono font-medium px-2 py-0.5 rounded"
                            style={{ background: "var(--color-bg)" }}
                          >
                            {key.keyHint}...
                          </code>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            Criada em {formatDate(key.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: "rgba(34, 197, 94, 0.1)",
                            color: "var(--color-success)",
                          }}
                        >
                          Ativa
                        </span>
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          disabled={revokingId === key.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer hover:border-red-500/50 disabled:opacity-50"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-danger)",
                          }}
                        >
                          {revokingId === key.id ? "A revogar..." : "Revogar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revoked Keys */}
            {revokedKeys.length > 0 && (
              <div
                className="rounded-2xl border overflow-hidden opacity-60"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--color-danger)" }}
                    />
                    Chaves Revogadas ({revokedKeys.length})
                  </h2>
                </div>

                <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {revokedKeys.map((key) => (
                    <div
                      key={key.id}
                      className="px-6 py-4 flex items-center justify-between"
                      style={
                        {
                          "--tw-divide-color": "var(--color-border)",
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(239, 68, 68, 0.1)" }}
                        >
                          <svg
                            className="w-5 h-5"
                            style={{ color: "var(--color-danger)" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                        </div>
                        <div>
                          <code
                            className="text-sm font-mono font-medium px-2 py-0.5 rounded line-through"
                            style={{ background: "var(--color-bg)" }}
                          >
                            {key.keyHint}...
                          </code>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            Revogada em {formatDate(key.revokedAt!)}
                          </p>
                        </div>
                      </div>

                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "var(--color-danger)",
                        }}
                      >
                        Revogada
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Guide */}
        {!loading && activeKeys.length > 0 && (
          <div
            className="mt-8 rounded-2xl border p-6"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                style={{ color: "var(--color-primary)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Como usar no teu portfólio
            </h3>
            <div
              className="rounded-lg p-4 font-mono text-sm overflow-x-auto"
              style={{ background: "var(--color-bg)" }}
            >
              <pre style={{ color: "var(--color-text-muted)" }}>
                <span style={{ color: "var(--color-primary)" }}>fetch</span>
                {`(`}
                <span style={{ color: "var(--color-success)" }}>{`"${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}/api/v1/posts"`}</span>
                {`, {\n  `}
                <span style={{ color: "var(--color-primary)" }}>headers</span>
                {`: { `}
                <span style={{ color: "var(--color-success)" }}>{`"X-API-KEY"`}</span>
                {`: `}
                <span style={{ color: "var(--color-success)" }}>{`"a-tua-api-key"`}</span>
                {` }\n})`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* One-Time Reveal Modal */}
      {newKeyData && (
        <ApiKeyModal
          plainKey={newKeyData.plainKey}
          keyHint={newKeyData.keyHint}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
