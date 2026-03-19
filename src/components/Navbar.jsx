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
        <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md border border-[#C2CDB4] shadow-sm rounded-full px-2 sm:px-4 py-2 flex justify-center items-center gap-1 sm:gap-2 max-w-fit pointer-events-auto">

                {/* The links now take an 'icon' prop for the mobile view */}
                <NavLink href="/" current={pathname} icon="🏠">Dashboard</NavLink>
                <NavLink href="/topics" current={pathname} icon="🎯">Topics</NavLink>

                {/* Live Stage uses the glowing red dot as its mobile icon */}
                <NavLink href="/live" current={pathname} icon={
                    <span className="relative flex h-3 w-3 justify-center items-center mx-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                }>
                    <span className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live Stage
                    </span>
                </NavLink>

                <NavLink href="/leaderboard" current={pathname} icon="🏆">Leaderboard</NavLink>

                <div className="w-px h-6 bg-[#C2CDB4] mx-1 sm:mx-2 shrink-0"></div>

                {/* Sign Out Button */}
                <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-full font-bold text-[#4A533E] hover:text-red-600 hover:bg-red-50 transition-all duration-300 flex items-center justify-center"
                    title="Sign Out"
                >
                    {/* Mobile view: Door Emoji */}
                    <span className="sm:hidden text-lg leading-none">🚪</span>
                    {/* Desktop view: Text */}
                    <span className="hidden sm:inline text-sm">Sign Out</span>
                </button>

            </div>
        </nav>
    )
}

function NavLink({ href, current, icon, children }) {
    const isActive = current === href
    return (
        <Link
            href={href}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full font-bold transition-all duration-300 flex items-center justify-center ${isActive
                    ? 'bg-[#8E9D7B] text-white shadow-md'
                    : 'text-[#4A533E] hover:bg-[#E2E6D8]/50'
                }`}
        >
            {/* Mobile view: Shows the emoji/icon */}
            <span className="sm:hidden text-lg leading-none flex items-center justify-center min-w-[20px]">
                {icon}
            </span>
            {/* Desktop view: Shows the text words */}
            <span className="hidden sm:inline text-sm whitespace-nowrap">
                {children}
            </span>
        </Link>
    )
}