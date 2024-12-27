// src/pages/_app.tsx
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import Script from "next/script";
import { AuthInitializer } from "@/components/header/AuthInitializer";
import "../styles/globals.css"; 
import { ThemeToggle } from "@/components/header/ThemeToggle";
import { useSocket } from "@/contexts/SocketContext";
import { getUserCost } from "@/lib/api";
import Link from 'next/link'; 
import React from "react";
import type { AppProps } from 'next/app';
import { useRouter } from "next/router";
import Head from 'next/head'

function Header() {
  const router = useRouter();
  const { user, logout, token } = useAuth();
  const { documentSocket } = useSocket();
  const [userCost, setUserCost] = React.useState<string | null>(null);

  const handleSignOut = () => {
    // Close WebSocket connections
    if (documentSocket) {
      documentSocket.close();
    }
    
    // Log out (clears auth state and localStorage)
    logout();
    
    // Redirect to home page
    router.push('/');
  };

  // Fetch cost when user logs in
  React.useEffect(() => {
    async function fetchCost() {
      if (user && token) {
        try {
          const costData = await getUserCost(token);
          setUserCost(costData.formatted_cost);
        } catch (error) {
          console.error('Failed to fetch user cost:', error);
        }
      }
    }
    
    fetchCost();
    const intervalId = setInterval(fetchCost, 60000);
    return () => clearInterval(intervalId);
  }, [user, token]);

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
          {!user && (
            <a
              href="/login.html"
              className="px-6 py-3 bg-button-primary-bg text-button-primary-text rounded-lg 
                       hover:bg-button-primary-hover transition-all shadow-sm"
            >
              Sign In
            </a>
          )}
          {user && (
            <>
              {userCost && (
                <div className="text-xs text-header-text opacity-70 px-3 py-1 bg-header-user-bg rounded-lg">
                  Cost: {userCost}
                </div>
              )}
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


export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" async defer />
      <Head>
        <title>ExplainAI - Intelligent Document Analysis</title>
        <meta name="description" content="AI-powered document analysis and conversation platform" />
        <link rel="icon" href="/book_E_logo.png" />
      </Head>
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
            <Component {...pageProps} />
          </main>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}