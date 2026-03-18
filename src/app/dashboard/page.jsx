'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ⏳ CHANGE THIS TO YOUR ACTUAL EVENT START TIME!
const EVENT_START_TIME = new Date('2026-03-21T19:00:00').getTime()

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

    // Countdown State
    const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 })

    // --- 1. The Countdown Timer Logic ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime()
            const distance = EVENT_START_TIME - now

            if (distance < 0) {
                clearInterval(interval)
                setCountdown({ d: 0, h: 0, m: 0, s: 0 })
                return
            }

            setCountdown({
                d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                s: Math.floor((distance % (1000 * 60)) / 1000)
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    // --- 2. Data Initialization ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                window.location.href = '/'
                return
            }

            const currentUser = session.user
            setUser(currentUser)

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setDisplayName(profileData.display_name || '')
            }

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
    }, [])

    // --- 3. Save Logic ---
    const handleSaveProfileAndTopic = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        await supabase
            .from('profiles')
            .upsert({ id: user.id, display_name: displayName })

        const { data } = await supabase
            .from('topics')
            .insert([{ title: topicTitle, claimed_by: user.id }])
            .select()
            .single()

        if (data) setMyTopic(data)

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

    // Format helper to always show two digits (e.g., "05" instead of "5")
    const formatTime = (time) => time.toString().padStart(2, '0')
    const isEventLive = countdown.d === 0 && countdown.h === 0 && countdown.m === 0 && countdown.s === 0

    return (
        <div className="min-h-screen bg-[#1A1E16] text-[#F5F3E9] pt-24 pb-12 px-4 md:px-6 font-sans">
            <div className="max-w-4xl mx-auto animate-fade-in">

                {/* Header & The Countdown Banner */}
                <div className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-4">
                        Welcome to the Green Room.
                    </h1>
                    <p className="text-[#8E9D7B] text-sm md:text-lg mb-8">
                        Manage your presentation details before you hit the stage.
                    </p>

                    {/* THE COUNTDOWN WIDGET */}
                    <div className={`p-6 md:p-8 rounded-[2rem] border-2 shadow-2xl relative overflow-hidden transition-colors duration-500 ${isEventLive ? 'bg-gradient-to-br from-[#8E9D7B] to-[#4A533E] border-[#C2CDB4]' : 'bg-[#2D3325] border-[#4A533E]'}`}>
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                        <div className="text-center relative z-10">
                            <h2 className={`text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-4 ${isEventLive ? 'text-[#1A1E16]' : 'text-[#C2CDB4]'}`}>
                                {isEventLive ? 'THE EVENT IS LIVE' : 'TIME UNTIL SHOWTIME'}
                            </h2>

                            <div className="flex justify-center gap-4 md:gap-8">
                                {/* Days (Only show if more than 0) */}
                                {countdown.d > 0 && (
                                    <TimeBlock value={formatTime(countdown.d)} label="Days" isLive={isEventLive} />
                                )}
                                <TimeBlock value={formatTime(countdown.h)} label="Hours" isLive={isEventLive} />
                                <span className={`text-3xl md:text-5xl font-black mt-2 ${isEventLive ? 'text-white' : 'text-[#8E9D7B]'}`}>:</span>
                                <TimeBlock value={formatTime(countdown.m)} label="Mins" isLive={isEventLive} />
                                <span className={`text-3xl md:text-5xl font-black mt-2 ${isEventLive ? 'text-white' : 'text-[#8E9D7B]'}`}>:</span>
                                <TimeBlock value={formatTime(countdown.s)} label="Secs" isLive={isEventLive} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

                    {/* LEFT COLUMN: Setup Form / Status */}
                    <div className="bg-[#2D3325] p-6 md:p-8 rounded-[2rem] border border-[#4A533E] shadow-xl relative overflow-hidden">
                        <h2 className="text-xl md:text-2xl font-black text-white mb-6">Your Status</h2>

                        {myTopic && profile?.display_name ? (
                            // THEY ARE READY TO GO
                            <div className="space-y-6">
                                <div className="bg-[#1A1E16] p-5 md:p-6 rounded-2xl border border-[#8E9D7B]/30">
                                    <div className="text-[10px] md:text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-1">Display Name</div>
                                    <div className="text-lg md:text-xl font-bold text-white mb-4">{profile.display_name}</div>

                                    <div className="text-[10px] md:text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-1">Locked-In Topic</div>
                                    <div className="text-lg md:text-xl font-bold text-[#8E9D7B]">"{myTopic.title}"</div>
                                </div>

                                <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-[#C2CDB4] bg-[#8E9D7B]/10 p-4 rounded-xl border border-[#8E9D7B]/20">
                                    <span>✅</span> Your topic is permanently locked in for tonight.
                                </div>
                            </div>
                        ) : (
                            // THEY NEED TO SETUP
                            <form onSubmit={handleSaveProfileAndTopic} className="space-y-4 md:space-y-5">
                                <div className="mb-4 text-xs text-[#8E9D7B] font-bold uppercase tracking-widest border-b border-[#4A533E] pb-2">
                                    ⚠️ Note: Topics cannot be changed once submitted.
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-2">
                                        Your Name (For the Big Screen)
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-[#1A1E16] border border-[#4A533E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#8E9D7B] transition-colors text-sm md:text-base"
                                        placeholder="e.g. David"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-2">
                                        What are you presenting on?
                                    </label>
                                    <input
                                        type="text"
                                        value={topicTitle}
                                        onChange={(e) => setTopicTitle(e.target.value)}
                                        className="w-full bg-[#1A1E16] border border-[#4A533E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#8E9D7B] transition-colors text-sm md:text-base"
                                        placeholder="e.g. The Secret Nepo Baby Theory"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] font-black rounded-xl transition-all duration-300 disabled:opacity-50 mt-4 text-sm md:text-base"
                                >
                                    {submitting ? 'Locking it in...' : 'LOCK IN TOPIC'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Event Hub */}
                    <div className="space-y-4 md:space-y-6 flex flex-col justify-center">

                        <Link href="/live" className="group block p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-[#1A1E16] to-[#2D3325] border border-[#4A533E] hover:border-[#8E9D7B] transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                            <div className="flex items-center gap-3 md:gap-4 mb-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-[#8E9D7B] transition-colors">Enter Live Stage</h3>
                            </div>
                            <p className="text-[#C2CDB4] text-xs md:text-sm">Control your timer or watch others present in real-time.</p>
                        </Link>

                        <Link href="/leaderboard" className="group block p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-[#1A1E16] to-[#2D3325] border border-[#4A533E] hover:border-[#8E9D7B] transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                            <div className="flex items-center gap-3 md:gap-4 mb-2">
                                <span className="text-xl md:text-2xl">🏆</span>
                                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-[#8E9D7B] transition-colors">View Leaderboard</h3>
                            </div>
                            <p className="text-[#C2CDB4] text-xs md:text-sm">See who is currently winning the night based on audience votes.</p>
                        </Link>

                    </div>

                </div>
            </div>
        </div>
    )
}

// Helper component for the countdown numbers
function TimeBlock({ value, label, isLive }) {
    return (
        <div className="flex flex-col items-center">
            <div className={`text-4xl md:text-6xl font-mono font-black tracking-tighter ${isLive ? 'text-white drop-shadow-md' : 'text-white'}`}>
                {value}
            </div>
            <div className={`text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold mt-1 md:mt-2 ${isLive ? 'text-[#1A1E16]' : 'text-[#8E9D7B]'}`}>
                {label}
            </div>
        </div>
    )
}