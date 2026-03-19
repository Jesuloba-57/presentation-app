'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function Navbar() {
    const pathname = usePathname()

    // Hide on the big-screen Live view
    if (pathname === '/live') return null

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <nav className="fixed top-4 left-2 right-2 sm:left-0 sm:right-0 z-50 flex justify-center animate-fade-in pointer-events-none">
            {/* 
        The Fix: flex-nowrap, overflow-x-auto, and hidden scrollbar classes.
        This creates a native-feeling swipeable row on small screens!
      */}
            <div className="bg-white/90 backdrop-blur-md border border-[#C2CDB4] shadow-sm rounded-full p-1.5 sm:px-4 sm:py-2 flex flex-nowrap overflow-x-auto justify-start sm:justify-center items-center w-full max-w-fit pointer-events-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                <NavLink href="/" current={pathname}>Dashboard</NavLink>
                <NavLink href="/topics" current={pathname}>Topics</NavLink>

                <NavLink href="/live" current={pathname}>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live Stage
                    </span>
                </NavLink>

                <NavLink href="/leaderboard" current={pathname}>Leaderboard</NavLink>

                <div className="w-px h-5 bg-[#C2CDB4] mx-1 sm:mx-2 shrink-0"></div>

                <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-[#4A533E] hover:text-red-600 hover:bg-red-50 transition-all duration-300 shrink-0 whitespace-nowrap"
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
            // shrink-0 prevents the buttons from squishing, whitespace-nowrap keeps text on one line
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 shrink-0 whitespace-nowrap ${isActive
                    ? 'bg-[#8E9D7B] text-white shadow-md'
                    : 'text-[#4A533E] hover:bg-[#E2E6D8]/50'
                }`}
        >
            {children}
        </Link>
    )
}