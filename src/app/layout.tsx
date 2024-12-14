'use client';

import "./globals.css";
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
    <header className="border-b border-earth-200 dark:border-earth-800">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ExplainAI</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign Out
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
    <html lang="en">
      <head>
        <Script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className="font-palatino antialiased bg-earth-50 text-earth-900 dark:bg-earth-900 dark:text-earth-50">
        <AuthProvider>
          <AuthInitializer />
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
