'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()

    // Hide the navbar completely if we are on the big-screen Live view
    if (pathname === '/live') return null

    // The restored Sign Out logic
    const handleSignOut = async () => {
        await supabase.auth.signOut()
        // Force a hard browser reload to clear all React state and kick them to the home page
        window.location.href = '/'
    }

    return (
        <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-md border border-[#C2CDB4] shadow-sm rounded-full px-2 py-2 flex flex-wrap justify-center gap-1 sm:gap-2 items-center">
                <NavLink href="/" current={pathname}>Dashboard</NavLink>
                <NavLink href="/topics" current={pathname}>Topics</NavLink>
                <NavLink href="/live" current={pathname}>
                    <span className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live Stage
                    </span>
                </NavLink>
                <NavLink href="/leaderboard" current={pathname}>Leaderboard</NavLink>

                {/* The Restored Sign Out Button */}
                <div className="w-px h-6 bg-[#C2CDB4] mx-1 sm:mx-2 hidden sm:block"></div>
                <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-full text-xs sm:text-sm font-bold text-[#4A533E] hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                >
                    Sign Out
                </button>
            </div>
        </nav>
    )
}

function NavLink({ href, current, children }) {
    const isActive = current === href
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${isActive
                    ? 'bg-[#8E9D7B] text-white shadow-md'
                    : 'text-[#4A533E] hover:bg-[#E2E6D8]/50'
                }`}
        >
            {children}
        </Link>
    )
}