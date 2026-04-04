/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: 'tw-',
	important: false,
	content: [
		"./index.html",
		"./index.js",
		"./scripts/**/*.js",
		"./content/**/*.{html,md}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"-apple-system",
					"BlinkMacSystemFont",
					'"Segoe UI"',
					"Helvetica",
					'"Apple Color Emoji"',
					"Arial",
					"sans-serif",
					'"Segoe UI Emoji"',
					'"Segoe UI Symbol"',
				],
			},
			colors: {
				primary: '#fff',
				secondary: "#f7f7f5",
				hoverColor: "#efefed",
				textColor: "#1F2123"
			}
		},
	},
	plugins: [],
}

