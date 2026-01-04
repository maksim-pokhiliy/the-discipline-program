import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Discipline Program - API",
  description: "API Server",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
