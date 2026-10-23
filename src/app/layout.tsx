import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { TEXT_SIZE_INIT_SCRIPT } from "@/lib/text-size";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });
const headingFont = Fraunces({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Control de Colesterol",
  description: "Sistema web en español para adultos mayores con seguimiento de colesterol, alertas y reportes.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#F4EFE7",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Aplica el tamaño de letra guardado antes de pintar la página (evita parpadeos) */}
        <script dangerouslySetInnerHTML={{ __html: TEXT_SIZE_INIT_SCRIPT }} />
      </head>
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}