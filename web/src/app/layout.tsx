import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkedBridge — Secure LinkedIn Integration",
  description:
    "LinkedBridge is a secure bridge between LinkedIn and your portfolio website. Manage your API keys and sync your professional content effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
