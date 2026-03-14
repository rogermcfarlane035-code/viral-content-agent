import './globals.css'
export const metadata = { title: 'Viral Content Agent', description: 'AI-powered viral content agent' }
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet" /></head>
      <body>{children}</body>
    </html>
  )
}
