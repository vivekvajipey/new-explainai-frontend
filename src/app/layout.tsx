// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "ExplainAI - Intelligent Document Analysis",
  description: "AI-powered document analysis and conversation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-palatino antialiased bg-earth-50 text-earth-900 dark:bg-earth-900 dark:text-earth-50">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-b border-earth-200 dark:border-earth-800">
            <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">ExplainAI</h1>
            </nav>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}