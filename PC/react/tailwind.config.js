/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.jsx",
    ],
    theme: {
        extend: {
            animation: {
                'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
            },
            keyframes: {
                'pulse-slow': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.05)', opacity: '0.8' },
                }
            }
        },
    },
    plugins: [],
}
