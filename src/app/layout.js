import './globals.css'
import Navbar from '@/components/Navbar' // Make sure this path matches where you saved it

export const metadata = {
  title: 'Presentation Night',
  description: 'Lock in your topic for presentation night.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <Navbar />
        {/* The main tag ensures the content takes up the remaining screen height */}
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  )
}