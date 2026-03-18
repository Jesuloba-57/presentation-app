'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function SetupProfilePage() {
    const [displayName, setDisplayName] = useState('')
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState(null)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push('/login')
            } else {
                setUser(session.user)
            }
        })
    }, [router])

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        if (!displayName.trim()) return
        setLoading(true)

        // Upsert safely inserts or updates the row based on the user's ID
        const { error } = await supabase
            .from('profiles')
            .upsert([
                { id: user.id, display_name: displayName.trim() }
            ])

        if (error) {
            alert("Error saving profile. Check console for details.")
            console.error(error)
            setLoading(false)
            return
        }

        // Success! Send them to the dashboard
        router.push('/')
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3E9] p-6">
            <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm p-8 border border-white">
                <h1 className="text-2xl font-extrabold text-[#2D3325] mb-2 text-center tracking-tight">
                    Finish Setting Up
                </h1>
                <p className="text-[#4A533E] text-sm mb-6 text-center leading-relaxed">
                    What should we call you on the leaderboard and in the comments?
                </p>

                <form onSubmit={handleSaveProfile}>
                    <input
                        type="text"
                        placeholder="e.g., Jesuloba, J-Dog, etc."
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full mb-6 p-4 bg-[#F5F3E9] border border-[#C2CDB4] rounded-2xl text-[#2D3325] focus:outline-none focus:ring-2 focus:ring-[#8E9D7B] font-medium"
                        required
                        maxLength={20}
                    />
                    <button
                        type="submit"
                        disabled={loading || !displayName.trim()}
                        className="w-full bg-[#8E9D7B] text-white font-bold py-4 rounded-2xl hover:bg-[#4A533E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save & Continue'}
                    </button>
                </form>
            </div>
        </div>
    )
}