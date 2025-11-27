import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Abalvi Barber Shop",
  description: "Reserva tu cita en Avalbi Barber Shop de manera fácil y rápida.",
  icons: {
    icon: "/Logo.png",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  generator: "Next.js",
  applicationName: "Abalvi Barber Shop",
  authors: [{ name: "Eyver Vergara", url: "https://www.linkedin.com/in/evelo00/" }],
  keywords: [
    "Barbería",
    "Citas de barbería",
    "Reservas de barbería",
    "Cortes de cabello",
    "Afeitado",
    "Estilo de barba",
    "Servicios de barbería",
    "Barberos profesionales",
    "Salón de barbería",
    "Citas en línea",
  ],
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
