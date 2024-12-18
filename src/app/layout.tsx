// app/layout.tsx
'use client';

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Script from "next/script";
import { useAuth } from "@/lib/auth/AuthContext";
import { initializeGoogleAuth } from "@/lib/auth/google";
import { useEffect } from "react";

function AuthInitializer() {
  const { login } = useAuth();

  useEffect(() => {
    initializeGoogleAuth((token) => {
      login(token).catch((error) => {
        console.error('Login failed:', error);
      });
    });
  }, [login]);

  return null;
}

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-earth-200 dark:border-earth-800 bg-earth-50/50 dark:bg-earth-900/50 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-earth-900 dark:text-earth-50">ExplainAI</h1>
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-earth-100 dark:bg-earth-800 rounded-lg">
              <svg 
                className="w-4 h-4 text-earth-600 dark:text-earth-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span className="text-sm font-medium text-earth-700 dark:text-earth-300">
                {user.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-earth-600 dark:text-earth-400 hover:text-earth-900 dark:hover:text-earth-50 hover:bg-earth-100 dark:hover:bg-earth-800 rounded-lg transition-all inline-flex items-center gap-2"
            >
              <span>Sign Out</span>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className="font-palatino antialiased bg-earth-50 text-earth-900 dark:bg-earth-900 dark:text-earth-50">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthInitializer />
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}