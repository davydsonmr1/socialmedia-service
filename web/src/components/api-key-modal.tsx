"use client";

import { useState, useCallback } from "react";

interface ApiKeyModalProps {
  plainKey: string;
  keyHint: string;
  onClose: () => void;
}

export function ApiKeyModal({ plainKey, keyHint, onClose }: ApiKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = plainKey;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [plainKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl border p-6 md:p-8 animate-in fade-in zoom-in duration-200"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Nova API Key Gerada</h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Identificador: <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--color-bg)" }}>{keyHint}</code>
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(34, 197, 94, 0.15)" }}
          >
            <svg className="w-5 h-5" style={{ color: "var(--color-success)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        {/* ⚠️ Security Warning */}
        <div
          className="rounded-lg border px-4 py-3 mb-5 flex items-start gap-3"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            borderColor: "rgba(239, 68, 68, 0.25)",
          }}
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "var(--color-danger)" }}>
            Copie esta chave agora. Por motivos de segurança, ela{" "}
            <strong>nunca mais será exibida</strong>.
          </p>
        </div>

        {/* Key Display */}
        <div
          className="rounded-lg p-4 mb-6 font-mono text-sm break-all select-all leading-relaxed border"
          style={{
            background: "var(--color-bg)",
            borderColor: "var(--color-border)",
          }}
        >
          {plainKey}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all duration-200 cursor-pointer text-white hover:scale-[1.02] active:scale-95"
            style={{
              background: copied
                ? "var(--color-success)"
                : "linear-gradient(135deg, var(--color-primary), #4f46e5)",
            }}
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiada!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar para a Área de Transferência
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-3 font-semibold rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
              background: "var(--color-surface-hover)",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
