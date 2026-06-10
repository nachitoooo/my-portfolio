import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ignacio Aristegui · Software Developer",
  description: "Software Developer with 3+ years of experience — Python, TypeScript, FastAPI, Django, React, Next.js, Azure.",
  keywords: "Ignacio Aristegui, software developer, fullstack, Python, TypeScript, FastAPI, Next.js, React, Argentina",
  authors: [{ name: "Ignacio Aristegui" }],
  icons: {
    icon: "/.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
