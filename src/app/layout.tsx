import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECHO. - Journal émotionnel artistique",
  description: "Transformez vos émotions en visualisations artistiques via IA. Un journal émotionnel qui sculpte vos ressentis en mosaïque vivante.",
  manifest: "/manifest.json",
  openGraph: {
    title: "ECHO. - Journal émotionnel artistique",
    description: "Transformez vos émotions en visualisations artistiques via IA.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
