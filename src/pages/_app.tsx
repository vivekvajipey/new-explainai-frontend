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
import React, { useEffect, useState } from "react";
import type { AppProps } from 'next/app';
import { useRouter } from "next/router";
import Head from 'next/head';
import { CostLimitProvider } from "@/contexts/CostLimitContext";
import { EXAMPLE_DOCUMENT_IDS } from "@/lib/constants";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

function Header() {
  const router = useRouter();
  const { user, logout, token } = useAuth();
  const { documentSocket } = useSocket();
  const [userCost, setUserCost] = React.useState<string | null>(null);
  const [demoMessagesUsed, setDemoMessagesUsed] = useState<number | null>(null);
  const isDemoDoc = router.query.id && EXAMPLE_DOCUMENT_IDS.includes(router.query.id as string);
  
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

  useEffect(() => {
    function updateDemoCount() {
      if (isDemoDoc) {
        const count = parseInt(localStorage.getItem('total_demo_messages') || '0');
        setDemoMessagesUsed(count);
      } else {
        setDemoMessagesUsed(null);
      }
    }

    updateDemoCount();
    const intervalId = setInterval(updateDemoCount, 1000);
    return () => clearInterval(intervalId);
  }, [isDemoDoc]);

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
          {!user && isDemoDoc && (
          <div className="relative flex items-center gap-1 text-xs text-header-text opacity-70 px-3 py-1 bg-header-user-bg rounded-lg group">
            <span>Messages: {demoMessagesUsed} of 5</span>
            <div className="relative">
              <svg 
                className="w-3.5 h-3.5 text-header-text opacity-70 cursor-help" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mt-1 border-4 border-transparent border-b-gray-900"></div>
                Number of free messages used as demo user. Sign in to get unlimited messages!
              </div>
            </div>
          </div>
        )}
          {user && (
  <>
      {userCost && (
        <div className="relative flex items-center gap-1 text-xs text-header-text opacity-70 px-3 py-1 bg-header-user-bg rounded-lg group">
          <span>Cost: {userCost}</span>
          <div className="relative">
            <svg 
              className="w-3.5 h-3.5 text-header-text opacity-70 cursor-help" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mt-1 border-4 border-transparent border-b-gray-900"></div>
              The amount your account has cost us to run. We provide up to $3 free. We are self-funded (broke).
            </div>
          </div>
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
  useGoogleAnalytics();
  
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script>
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
        <CostLimitProvider>
          <AuthProvider>
            <AuthInitializer />
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Component {...pageProps} />
            </main>
          </AuthProvider>
        </CostLimitProvider>
      </ThemeProvider>
    </>
  );
}