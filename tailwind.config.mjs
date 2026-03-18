/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                beige: {
                    DEFAULT: '#F5F3E9', // The warm, light background
                },
                sage: {
                    100: '#E2E6D8', // Very light sage for inactive states
                    300: '#C2CDB4', // Lighter sage for borders/cards
                    500: '#8E9D7B', // The primary widget color from your screenshot
                    700: '#4A533E', // Dark sage for highly readable text
                    900: '#2D3325', // Deepest sage for headings
                }
            },
            borderRadius: {
                '3xl': '1.75rem', // Extra rounded corners to match the iOS aesthetic
            }
        },
    },
    plugins: [],
}