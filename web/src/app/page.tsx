"use client";

import { OAUTH_LOGIN_URL } from "@/lib/api";

export default function HomePage() {
  const handleLogin = () => {
    window.location.href = OAUTH_LOGIN_URL;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-border), transparent)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* Logo / Brand */}
        <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-primary)" }} />
          <span className="text-sm font-medium tracking-wide" style={{ color: "var(--color-text-muted)" }}>
            LinkedBridge SaaS
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Conecta o teu{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover), #a78bfa)",
            }}
          >
            LinkedIn
          </span>{" "}
          ao teu
          <br />
          Portfólio
        </h1>

        <p
          className="text-lg md:text-xl mb-10 mx-auto max-w-lg leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Sincroniza automaticamente as tuas publicações profissionais com uma
          API segura para o teu site pessoal.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleLogin}
          className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), #4f46e5)",
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)",
          }}
        >
          {/* LinkedIn Icon */}
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Conectar com LinkedIn
        </button>

        {/* Trust indicators */}
        <div
          className="mt-12 flex items-center justify-center gap-6 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Encriptação AES-256-GCM
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            OAuth 2.0 Seguro
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            API de Alta Performance
          </div>
        </div>
      </div>
    </main>
  );
}
