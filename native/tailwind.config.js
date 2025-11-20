/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E3A8A", // Deep Trust Blue
          light: "#3b82f6",
          dark: "#172554",
        },
        accent: {
          DEFAULT: "#F97316", // Energy Orange
          hover: "#ea580c",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F8FAFC", // Light gray surface
        },
        text: {
          primary: "#0F172A", // Dark Text
          secondary: "#64748B", // Muted Text
          muted: "#94a3b8",
        },
        success: "#16A34A",
        error: "#DC2626",
        warning: "#EAB308",
      },
      borderRadius: {
        'xl': '16px', // radius-md
        '2xl': '24px', // radius-lg
        '3xl': '32px', // radius-xl
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.1)',
        'md': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px rgba(0,0,0,0.12)',
        'xl': '0 20px 25px rgba(0,0,0,0.15)',
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'System', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
