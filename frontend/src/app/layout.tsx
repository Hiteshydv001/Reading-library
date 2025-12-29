import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My E-Library - Personal Reading Collection",
  description: "Your personal reading library powered by WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
