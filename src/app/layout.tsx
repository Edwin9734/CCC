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
    <html lang="es">
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}