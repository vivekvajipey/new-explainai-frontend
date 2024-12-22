import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Base UI colors
  			background: 'var(--color-background)',
  			foreground: 'var(--color-foreground)',
			border: 'var(--color-border)',
  			
  			// Navigation
  			nav: {
  				bg: 'var(--color-nav-bg)',
  				text: 'var(--color-nav-text)',
  				hover: 'var(--color-nav-hover)',
  			},
  			
  			// Sidebar
  			sidebar: {
  				bg: 'var(--color-sidebar-bg)',
  				text: 'var(--color-sidebar-text)',
  				hover: 'var(--color-sidebar-hover)',
  			},
  			
  			// Cards
  			card: {
  				bg: 'var(--color-card-bg)',
  				border: 'var(--color-card-border)',
  				hover: 'var(--color-card-hover)',
  			},
  			
  			// Buttons
  			button: {
  				primary: {
  					bg: 'var(--color-button-primary-bg)',
  					text: 'var(--color-button-primary-text)',
  					hover: 'var(--color-button-primary-hover)',
  				},
  				secondary: {
  					bg: 'var(--color-button-secondary-bg)',
  					text: 'var(--color-button-secondary-text)',
  					hover: 'var(--color-button-secondary-hover)',
  				},
				upload: {
					bg: 'var(--color-button-upload-bg)',
					text: 'var(--color-button-upload-text)',
					hover: 'var(--color-button-upload-hover)',
				},
				analyze: {
					bg: 'var(--color-button-analyze-bg)',
					text: 'var(--color-button-analyze-text)',
					hover: 'var(--color-button-analyze-hover)',
				},
  			},
  			
  			// Form inputs
  			input: {
  				bg: 'var(--color-input-bg)',
  				text: 'var(--color-input-text)',
  				border: 'var(--color-input-border)',
  				focus: 'var(--color-input-focus)',
  			},
  			
  			// Messages
  			message: {
  				user: {
  					bg: 'var(--color-message-user-bg)',
  					text: 'var(--color-message-user-text)',
  				},
  				ai: {
  					bg: 'var(--color-message-ai-bg)',
  					text: 'var(--color-message-ai-text)',
  				},
  			},
  			
  			// Tooltips
  			tooltip: {
  				bg: 'var(--color-tooltip-bg)',
  				text: 'var(--color-tooltip-text)',
  				border: 'var(--color-tooltip-border)',
  			},
  			
  			// Status colors
  			accent: 'var(--color-accent)',
  			success: 'var(--color-success)',
  			error: 'var(--color-error)',
  			
  			// Document colors (flattened)
            'doc-bg': 'var(--color-doc-content-bg)',
            'doc-text': 'var(--color-doc-content-text)',
            'doc-border': 'var(--color-doc-content-border)',
            'doc-highlight-bg': 'var(--color-doc-highlight-bg)',
            'doc-highlight-border': 'var(--color-doc-highlight-border)',
            'doc-highlight-text': 'var(--color-doc-content-text)',
            'tab-active-bg': 'var(--color-tab-active-bg)',
            'tab-active-text': 'var(--color-tab-active-text)',
            'tab-inactive-bg': 'var(--color-tab-inactive-bg)',
            'tab-inactive-text': 'var(--color-tab-inactive-text)',
            'tab-hover-bg': 'var(--color-tab-hover-bg)',
  		},
  		fontFamily: {
  			palatino: [
  				'Palatino',
  				'serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--border-radius-lg)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }: { addUtilities: Function }) {
      const newUtilities = {
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      }
      addUtilities(newUtilities);
    },
      require("tailwindcss-animate")
],
} satisfies Config;
