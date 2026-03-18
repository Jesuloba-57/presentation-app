'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [myTopic, setMyTopic] = useState(null)
    const [loading, setLoading] = useState(true)

    // Form States
    const [topicTitle, setTopicTitle] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const fetchDashboardData = async () => {
            // 1. Auth Check
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/')
                return
            }

            const currentUser = session.user
            setUser(currentUser)

            // 2. Fetch their Profile (for their display name)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setDisplayName(profileData.display_name || '')
            }

            // 3. Check if they already have a topic claimed
            const { data: topicData } = await supabase
                .from('topics')
                .select('*')
                .eq('claimed_by', currentUser.id)
                .single()

            if (topicData) {
                setMyTopic(topicData)
            }

            setLoading(false)
        }

        fetchDashboardData()
    }, [router])

    // Handle saving their Display Name and Topic
    const handleSaveProfileAndTopic = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        // Update Profile Name
        await supabase
            .from('profiles')
            .upsert({ id: user.id, display_name: displayName })

        // Insert New Topic (Update logic removed to prevent duplicates)
        const { data } = await supabase
            .from('topics')
            .insert([{ title: topicTitle, claimed_by: user.id }])
            .select()
            .single()

        if (data) setMyTopic(data)

        // Refresh profile state
        setProfile({ ...profile, display_name: displayName })
        setSubmitting(false)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#1A1E16]">
                <div className="w-12 h-12 border-4 border-[#C2CDB4] border-t-[#8E9D7B] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1A1E16] text-[#F5F3E9] pt-28 pb-12 px-6 font-sans">
            <div className="max-w-4xl mx-auto animate-fade-in">

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                        Welcome to the Green Room.
                    </h1>
                    <p className="text-[#8E9D7B] text-lg">
                        Manage your presentation details before you hit the stage.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN: Setup Form / Status */}
                    <div className="bg-[#2D3325] p-8 rounded-[2rem] border border-[#4A533E] shadow-xl relative overflow-hidden">
                        {/* Ambient glow */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#8E9D7B]/10 rounded-full blur-3xl pointer-events-none"></div>

                        <h2 className="text-2xl font-black text-white mb-6">Your Status</h2>

                        {myTopic && profile?.display_name ? (
                            // THEY ARE READY TO GO (Edit Button Removed)
                            <div className="space-y-6">
                                <div className="bg-[#1A1E16] p-6 rounded-2xl border border-[#8E9D7B]/30">
                                    <div className="text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-1">Display Name</div>
                                    <div className="text-xl font-bold text-white mb-4">{profile.display_name}</div>

                                    <div className="text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-1">Locked-In Topic</div>
                                    <div className="text-xl font-bold text-[#8E9D7B]">"{myTopic.title}"</div>
                                </div>

                                <div className="flex items-center gap-3 text-sm font-bold text-[#C2CDB4] bg-[#8E9D7B]/10 p-4 rounded-xl border border-[#8E9D7B]/20">
                                    <span>✅</span> Get your slides ready!
                                </div>
                            </div>
                        ) : (
                            // THEY NEED TO SETUP
                            <form onSubmit={handleSaveProfileAndTopic} className="space-y-5">
                                <div className="mb-4 text-sm text-[#8E9D7B] font-bold uppercase tracking-widest border-b border-[#4A533E] pb-2">
                                    ⚠️ Note: Topics cannot be changed once submitted.
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-2">
                                        Your Name (For the Big Screen)
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-[#1A1E16] border border-[#4A533E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#8E9D7B] transition-colors"
                                        placeholder="e.g. David"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-2">
                                        What are you presenting on?
                                    </label>
                                    <input
                                        type="text"
                                        value={topicTitle}
                                        onChange={(e) => setTopicTitle(e.target.value)}
                                        className="w-full bg-[#1A1E16] border border-[#4A533E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#8E9D7B] transition-colors"
                                        placeholder="e.g. The Secret Nepo Baby Theory"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] font-black rounded-xl transition-all duration-300 disabled:opacity-50 mt-4"
                                >
                                    {submitting ? 'Locking it in...' : 'LOCK IN TOPIC'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Event Hub */}
                    <div className="space-y-6 flex flex-col justify-center">

                        <Link href="/live" className="group block p-8 rounded-[2rem] bg-gradient-to-br from-[#1A1E16] to-[#2D3325] border border-[#4A533E] hover:border-[#8E9D7B] transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <h3 className="text-2xl font-black text-white group-hover:text-[#8E9D7B] transition-colors">Enter Live Stage</h3>
                            </div>
                            <p className="text-[#C2CDB4] text-sm">Control your timer or watch others present in real-time.</p>
                        </Link>

                        <Link href="/leaderboard" className="group block p-8 rounded-[2rem] bg-gradient-to-br from-[#1A1E16] to-[#2D3325] border border-[#4A533E] hover:border-[#8E9D7B] transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-2xl">🏆</span>
                                <h3 className="text-2xl font-black text-white group-hover:text-[#8E9D7B] transition-colors">View Leaderboard</h3>
                            </div>
                            <p className="text-[#C2CDB4] text-sm">See who is currently winning the night based on audience votes.</p>
                        </Link>

                    </div>

                </div>
            </div>
        </div>
    )
}