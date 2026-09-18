import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard de Finanzas Personales",
  description:
    "Prototipo académico — Proyectos VII, UDG Virtual. Procesa el estado de cuenta de un broker mexicano para analizar rendimiento, comisiones y diversificación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
