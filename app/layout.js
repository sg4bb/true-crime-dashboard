import "./globals.css";

export const metadata = {
  title: "Case Records",
  description: "Panel de casos true crime",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-neutral-950 text-neutral-200 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
