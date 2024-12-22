import { initializeGoogleAuth } from "@/lib/auth/google";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export function AuthInitializer() {
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