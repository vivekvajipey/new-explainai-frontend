import { GOOGLE_CLIENT_ID } from '../constants';

export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
        };
      };
    };
    handleCredentialResponse?: (response: GoogleCredentialResponse) => void;
  }
}

export function initializeGoogleAuth(onLogin: (token: string) => void) {
  if (!window.google) return;

  window.handleCredentialResponse = (response) => {
    const token = response.credential;
    onLogin(token);
  };

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: window.handleCredentialResponse,
  });

  // Find the sign-in container and render the button
  const signInContainer = document.getElementById('g_id_signin');
  if (signInContainer) {
    window.google.accounts.id.renderButton(signInContainer, {
      theme: 'outline',
      size: 'large',
    });
  }
}
