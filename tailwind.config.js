/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// BebaX Brand Colors
				bebax: {
					green: {
						DEFAULT: 'hsl(142, 76%, 36%)',
						dark: 'hsl(142, 76%, 28%)',
						light: 'hsl(142, 76%, 96%)',
					},
					gold: 'hsl(45, 100%, 51%)',
					black: 'hsl(0, 0%, 10%)',
					red: 'hsl(0, 65%, 51%)',
				},
				// Shadcn colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				'bebax-h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
				'bebax-h2': ['2rem', { lineHeight: '1.3', fontWeight: '700' }],
				'bebax-h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
				'bebax-body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
				'bebax-small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
			},
			boxShadow: {
				'bebax-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
				'bebax-md': '0 4px 16px rgba(0, 0, 0, 0.12)',
				'bebax-lg': '0 8px 24px rgba(0, 0, 0, 0.16)',
				'bebax-xl': '0 12px 32px rgba(0, 0, 0, 0.20)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'slide-up': {
					from: { transform: 'translateY(100%)' },
					to: { transform: 'translateY(0)' }
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'pulse-green': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'pulse-green': 'pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}