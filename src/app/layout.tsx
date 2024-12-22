// app/layout.tsx
'use client';

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Script from "next/script";
import { useAuth } from "@/lib/auth/AuthContext";
import { initializeGoogleAuth } from "@/lib/auth/google";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import { useConversationStore } from "@/stores/conversationStores";
import Link from 'next/link';

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-14 h-7 rounded-full p-1 relative bg-button-secondary-bg 
                transition-colors duration-200"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-1 left-1 w-5 h-5 rounded-full 
                   transform transition-transform duration-200 ease-in-out
                   flex items-center justify-center
                   ${isDark ? "translate-x-7 bg-gray-800" : "translate-x-0 bg-yellow-400"}`}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-gray-200" />
        ) : (
          <Sun className="w-3 h-3 text-yellow-800" />
        )}
      </div>
    </button>
  );
}

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
  const router = useRouter();
  const { user, logout } = useAuth();
  const { documentSocket } = useSocket();

  const handleSignOut = () => {
    // Close WebSocket connections
    if (documentSocket) {
      documentSocket.close();
    }
    
    // Clear conversation store
    useConversationStore.getState().clearAll();
    
    // Log out (clears auth state and localStorage)
    logout();
    
    // Redirect to home page
    router.push('/');
  };

  return (
    <header className="border-b border-header-border bg-header-bg/50 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold text-header-text">
            ExplainAI
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-header-user-bg rounded-lg">
                <svg 
                  className="w-4 h-4 text-header-user-icon" 
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
                <span className="text-sm font-medium text-header-user-text">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-header-text 
                         hover:text-header-text-hover hover:bg-header-button-hover 
                         rounded-lg transition-all inline-flex items-center gap-2"
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
            </>
          )}
        </div>
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
      <body className="font-palatino antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
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