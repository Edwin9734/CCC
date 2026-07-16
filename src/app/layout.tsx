import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });
const headingFont = Fraunces({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Control de Colesterol",
  description: "Sistema web en español para adultos mayores con seguimiento de colesterol, alertas y reportes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Agregamos el atributo aquí para que Next.js maneje bien las transiciones de página
    <html lang="es" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}