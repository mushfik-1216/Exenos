import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui/ToastContainer";

export const metadata: Metadata = {
  title: "EXENOS | Market Intelligence & Risk Analysis Platform",
  description: "Private AI-assisted market analysis platform for disciplined traders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] text-neutral-100 min-h-screen antialiased selection:bg-neutral-800 selection:text-white">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
