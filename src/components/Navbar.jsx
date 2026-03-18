'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
    const pathname = usePathname()

    // Hide the navbar completely if we are on the big-screen Live view
    if (pathname === '/live') return null

    return (
        <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-md border border-[#C2CDB4] shadow-sm rounded-full px-2 py-2 flex gap-2 sm:gap-4 items-center">
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
            </div>
        </nav>
    )
}

function NavLink({ href, current, children }) {
    const isActive = current === href
    return (
        <Link
            href={href}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${isActive
                    ? 'bg-[#8E9D7B] text-white shadow-md'
                    : 'text-[#4A533E] hover:bg-[#E2E6D8]/50'
                }`}
        >
            {children}
        </Link>
    )
}