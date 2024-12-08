import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#f6f5f1',
          100: '#e3e0d7',
          200: '#cdc7b9',
          300: '#b3aa96',
          400: '#9c9077',
          500: '#867a61',
          600: '#6b614c',
          700: '#504939',
          800: '#363127',
          900: '#1c1914',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        palatino: ['Palatino', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
