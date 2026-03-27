import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        emerald: {
          50: "hsl(152, 81%, 96%)",
          100: "hsl(149, 80%, 90%)",
          200: "hsl(152, 76%, 80%)",
          300: "hsl(156, 72%, 67%)",
          400: "hsl(158, 64%, 52%)",
          500: "hsl(161, 84%, 39%)",
          600: "hsl(162, 84%, 30%)",
          700: "hsl(163, 84%, 24%)",
          800: "hsl(163, 84%, 18%)",
          900: "hsl(164, 84%, 12%)",
          950: "hsl(164, 84%, 6%)",
        },
        slate: {
          50: "hsl(210, 40%, 98%)",
          100: "hsl(210, 40%, 96%)",
          200: "hsl(214, 32%, 91%)",
          300: "hsl(213, 27%, 84%)",
          400: "hsl(215, 20%, 65%)",
          500: "hsl(215, 16%, 47%)",
          600: "hsl(215, 19%, 35%)",
          700: "hsl(215, 25%, 27%)",
          800: "hsl(217, 33%, 17%)",
          900: "hsl(222, 47%, 11%)",
          950: "hsl(222, 95%, 4%)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        neon: {
          DEFAULT: "hsl(158, 64%, 52%)",
          glow: "rgba(52, 211, 153, 0.4)",
        },
        electric: {
          DEFAULT: "hsl(258, 91%, 66%)",
          glow: "rgba(139, 92, 246, 0.4)",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-neon": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "pulse 2s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
      },
      boxShadow: {
        glow: "0 0 20px rgba(52, 211, 153, 0.15)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.15)",
        elevated: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
        soft: "0 8px 30px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
