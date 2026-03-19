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

    // Form States (Only for Display Name now)
    const [displayName, setDisplayName] = useState('')
    const [submittingName, setSubmittingName] = useState(false)
    const [nameSaved, setNameSaved] = useState(false)

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

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setDisplayName(profileData.display_name || '')
            }

            // Fetch Claimed Topic
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

    // --- 3. Save Display Name Logic ---
    const handleUpdateName = async (e) => {
        e.preventDefault()
        if (!displayName.trim()) return

        setSubmittingName(true)
        setNameSaved(false)

        await supabase
            .from('profiles')
            .upsert({ id: user.id, display_name: displayName.trim() })

        setProfile({ ...profile, display_name: displayName.trim() })
        setSubmittingName(false)
        setNameSaved(true)

        // Hide the "Saved!" text after 3 seconds
        setTimeout(() => setNameSaved(false), 3000)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#1A1E16]">
                <div className="w-12 h-12 border-4 border-[#C2CDB4] border-t-[#8E9D7B] rounded-full animate-spin"></div>
            </div>
        )
    }

    const formatTime = (time) => time.toString().padStart(2, '0')
    const isEventLive = countdown.d === 0 && countdown.h === 0 && countdown.m === 0 && countdown.s === 0

    return (
        <div className="min-h-screen bg-[#1A1E16] text-[#F5F3E9] pt-28 md:pt-32 pb-12 px-4 md:px-6 font-sans">
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
                                {countdown.d > 0 && <TimeBlock value={formatTime(countdown.d)} label="Days" isLive={isEventLive} />}
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
                    <div className="bg-[#2D3325] p-6 md:p-8 rounded-[2rem] border border-[#4A533E] shadow-xl relative overflow-hidden flex flex-col">
                        <h2 className="text-xl md:text-2xl font-black text-white mb-6">Your Status</h2>

                        <div className="space-y-6 flex-1">

                            {/* DISPLAY NAME SECTION (Always visible so they can update their name) */}
                            <form onSubmit={handleUpdateName} className="bg-[#1A1E16] p-5 rounded-2xl border border-[#4A533E]">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[10px] md:text-xs font-bold text-[#C2CDB4] uppercase tracking-widest">
                                        Your Name (For the Big Screen)
                                    </label>
                                    {nameSaved && <span className="text-[#8E9D7B] text-[10px] font-bold uppercase tracking-widest animate-pulse">Saved!</span>}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="flex-1 w-full bg-[#2D3325] border border-[#4A533E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#8E9D7B] transition-colors text-sm md:text-base"
                                        placeholder="e.g. David"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingName}
                                        className="bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] px-5 py-3 rounded-xl font-black transition-all duration-300 disabled:opacity-50 text-sm md:text-base"
                                    >
                                        {submittingName ? '...' : 'SAVE'}
                                    </button>
                                </div>
                            </form>

                            {/* TOPIC STATUS SECTION */}
                            {myTopic ? (
                                // IF THEY HAVE A TOPIC
                                <div className="bg-[#1A1E16] p-5 md:p-6 rounded-2xl border border-[#8E9D7B]/30 flex flex-col h-[calc(100%-110px)] justify-center">
                                    <div className="text-[10px] md:text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-1">Locked-In Topic</div>
                                    <div className="text-lg md:text-xl font-bold text-[#8E9D7B] mb-4">"{myTopic.title}"</div>

                                    <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-[#C2CDB4] bg-[#8E9D7B]/10 p-4 rounded-xl border border-[#8E9D7B]/20">
                                        <span>✅</span> Ready for the stage.
                                    </div>
                                </div>
                            ) : (
                                // IF THEY DON'T HAVE A TOPIC
                                <div className="bg-[#1A1E16] p-5 md:p-6 rounded-2xl border border-dashed border-[#4A533E] text-center flex flex-col justify-center items-center h-[calc(100%-110px)]">
                                    <div className="text-4xl mb-3">🎯</div>
                                    <h3 className="text-white font-bold text-lg mb-1">No Topic Claimed</h3>
                                    <p className="text-[#8E9D7B] text-xs md:text-sm mb-6">You need to lock in a topic before you can take the stage tonight.</p>

                                    <Link href="/topics" className="w-full py-4 bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] font-black rounded-xl transition-all duration-300 transform hover:scale-[1.02]">
                                        BROWSE TOPICS
                                    </Link>
                                </div>
                            )}

                        </div>
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