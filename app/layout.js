import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Case Records",
  description: "True crime case panel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} bg-neutral-950 text-neutral-200 font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}