'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

// CHANGE THIS: 10 for testing, 900 (15 mins) for the real event!
const START_TIME = 10;

export default function LiveViewPage() {
    const [presenters, setPresenters] = useState([])
    const [activePresenter, setActivePresenter] = useState(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    const [timeLeft, setTimeLeft] = useState(START_TIME)
    const [timerRunning, setTimerRunning] = useState(false)
    const channelRef = useRef(null)

    // Rating State
    const [isRating, setIsRating] = useState(false)
    const [hasRated, setHasRated] = useState(false)
    const [scores, setScores] = useState({ lockedIn: 0, cooked: 0, rewatch: 0 })
    const [submitting, setSubmitting] = useState(false)

    // --- 1. LOCAL STORAGE TIMER RECOVERY ---
    const restoreTimerState = (topicId, currentUserId, topicOwnerId) => {
        if (currentUserId === topicOwnerId) {
            const saved = localStorage.getItem(`timer_${topicId}`)
            if (saved) {
                try {
                    const { timeLeft: savedTime, timerRunning: savedRunning, lastSaved } = JSON.parse(saved)
                    if (savedRunning) {
                        const elapsed = Math.floor((Date.now() - lastSaved) / 1000)
                        const newTime = Math.max(0, savedTime - elapsed)
                        setTimeLeft(newTime)
                        setTimerRunning(newTime > 0)
                        return { time: newTime, running: newTime > 0 }
                    } else {
                        setTimeLeft(savedTime)
                        setTimerRunning(false)
                        return { time: savedTime, running: false }
                    }
                } catch (e) {
                    console.error("Failed to parse saved timer", e)
                }
            }
        }
        setTimeLeft(START_TIME)
        setTimerRunning(false)
        return { time: START_TIME, running: false }
    }

    // --- 2. INITIALIZATION ---
    useEffect(() => {
        const initData = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const currentUser = session?.user || null
            setUser(currentUser)

            const { data } = await supabase
                .from('topics')
                .select('*, profiles(display_name)')
                .not('claimed_by', 'is', null)

            if (data) {
                setPresenters(data)
                if (data.length > 0) {
                    const firstTopic = data[0]
                    setActivePresenter(firstTopic)
                    const { time, running } = restoreTimerState(firstTopic.id, currentUser?.id, firstTopic.claimed_by)

                    if (currentUser?.id === firstTopic.claimed_by && channelRef.current) {
                        channelRef.current.send({
                            type: 'broadcast',
                            event: 'sync',
                            payload: { timeLeft: time, timerRunning: running, presenterId: currentUser.id, activeTopicId: firstTopic.id }
                        })
                    }
                }
            }
            setLoading(false)
        }
        initData()
    }, [])

    // Check if current user already rated this topic
    useEffect(() => {
        const checkExistingRating = async () => {
            if (!user || !activePresenter) return

            const { data } = await supabase
                .from('ratings')
                .select('id')
                .eq('topic_id', activePresenter.id)
                .eq('rater_id', user.id)
                .single()

            setHasRated(!!data)
            setIsRating(false)
            setScores({ lockedIn: 0, cooked: 0, rewatch: 0 })
        }
        checkExistingRating()
    }, [activePresenter, user])

    // --- 3. REALTIME BROADCASTING ---
    useEffect(() => {
        const channel = supabase.channel('live-room')

        channel.on('broadcast', { event: 'sync' }, ({ payload }) => {
            if (user?.id !== payload.presenterId) {
                setTimeLeft(payload.timeLeft)
                setTimerRunning(payload.timerRunning)

                if (payload.activeTopicId && presenters.length > 0) {
                    const newActive = presenters.find(p => p.id === payload.activeTopicId)
                    if (newActive && newActive.id !== activePresenter?.id) {
                        setActivePresenter(newActive)
                    }
                }
            }
        }).subscribe()

        channelRef.current = channel
        return () => supabase.removeChannel(channel)
    }, [user, presenters, activePresenter])

    const broadcastState = (newTime, isRunning, topicId) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'sync',
                payload: { timeLeft: newTime, timerRunning: isRunning, presenterId: user?.id, activeTopicId: topicId }
            })
        }
    }

    // --- 4. THE INTERVAL TIMER (Ticking Only) ---
    useEffect(() => {
        let interval = null
        const isCurrentPresenter = activePresenter && user?.id === activePresenter.claimed_by

        if (isCurrentPresenter && timerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = Math.max(0, prev - 1)
                    broadcastState(newTime, true, activePresenter.id)

                    localStorage.setItem(`timer_${activePresenter.id}`, JSON.stringify({
                        timeLeft: newTime,
                        timerRunning: true,
                        lastSaved: Date.now()
                    }))

                    return newTime
                })
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [timerRunning, activePresenter, user])

    // --- 4.5 THE TRIPWIRE (Hitting Zero & Locking) ---
    useEffect(() => {
        const isCurrentPresenter = activePresenter && user?.id === activePresenter.claimed_by

        if (isCurrentPresenter && timeLeft === 0 && timerRunning) {
            setTimerRunning(false)
            broadcastState(0, false, activePresenter?.id)

            localStorage.setItem(`timer_${activePresenter.id}`, JSON.stringify({
                timeLeft: 0,
                timerRunning: false,
                lastSaved: Date.now()
            }))

            // Database Locking Logic
            if (!activePresenter.has_presented) {
                supabase.from('topics').update({ has_presented: true }).eq('id', activePresenter.id).then(() => {
                    setActivePresenter(prev => ({ ...prev, has_presented: true }))
                    alert("Time is up! Your presentation is officially complete and locked.")
                })
            }
        }
    }, [timeLeft, timerRunning, activePresenter, user])

    // --- 5. CONTROLS ---
    const handleSelectPresenter = (p) => {
        setActivePresenter(p)
        const { time, running } = restoreTimerState(p.id, user?.id, p.claimed_by)

        if (user?.id === p.claimed_by) {
            broadcastState(time, running, p.id)
        }
    }

    const toggleTimer = () => {
        if (activePresenter?.has_presented) return;

        const newRunning = !timerRunning
        setTimerRunning(newRunning)
        broadcastState(timeLeft, newRunning, activePresenter.id)

        localStorage.setItem(`timer_${activePresenter.id}`, JSON.stringify({
            timeLeft: timeLeft,
            timerRunning: newRunning,
            lastSaved: Date.now()
        }))
    }

    const resetTimer = () => {
        if (activePresenter?.has_presented) return;

        setTimerRunning(false)
        setTimeLeft(START_TIME)
        broadcastState(START_TIME, false, activePresenter.id)

        localStorage.setItem(`timer_${activePresenter.id}`, JSON.stringify({
            timeLeft: START_TIME,
            timerRunning: false,
            lastSaved: Date.now()
        }))
    }

    // --- 6. RATING LOGIC ---
    const submitRating = async () => {
        if (scores.lockedIn === 0 || scores.cooked === 0 || scores.rewatch === 0) {
            alert("Please score all 3 categories before submitting!")
            return
        }

        setSubmitting(true)
        const { error } = await supabase.from('ratings').insert([
            {
                topic_id: activePresenter.id,
                rater_id: user.id,
                locked_in_score: scores.lockedIn,
                cooked_score: scores.cooked,
                rewatch_score: scores.rewatch
            }
        ])

        if (error) {
            alert("Error saving rating. Did you already rate this one?")
            console.error(error)
        } else {
            setHasRated(true)
            setIsRating(false)
        }
        setSubmitting(false)
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#2D3325]">
                <div className="w-12 h-12 border-4 border-[#C2CDB4] border-t-[#8E9D7B] rounded-full animate-spin"></div>
            </div>
        )
    }

    const isCurrentPresenter = activePresenter?.claimed_by === user?.id

    // --- NEW: THE ROSTER SORTING LOGIC ---
    // We copy the array and sort it so the logged-in user floats to index 0
    const sortedPresenters = [...presenters].sort((a, b) => {
        const isMineA = a.claimed_by === user?.id
        const isMineB = b.claimed_by === user?.id
        if (isMineA && !isMineB) return -1 // Move mine up
        if (!isMineA && isMineB) return 1  // Move theirs down
        return 0 // Keep everyone else in chronological order
    })

    const RatingRow = ({ label, valueKey }) => (
        <div className="mb-6">
            <div className="text-[#C2CDB4] text-sm font-bold uppercase tracking-widest mb-3 text-left">
                {label}
            </div>
            <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                    <button
                        key={num}
                        onClick={() => setScores(prev => ({ ...prev, [valueKey]: num }))}
                        className={`w-12 h-12 rounded-full font-black text-lg transition-all duration-300 ${scores[valueKey] === num
                                ? 'bg-[#8E9D7B] text-[#1A1E16] shadow-[0_0_15px_rgba(142,157,123,0.5)] transform scale-110'
                                : 'bg-[#1A1E16] text-[#8E9D7B] border border-[#4A533E] hover:border-[#8E9D7B]'
                            }`}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    )

    return (
        <div className="flex h-screen bg-[#2D3325] overflow-hidden text-[#F5F3E9] font-sans">

            {/* LEFT COLUMN: The Roster */}
            <div className="w-1/3 max-w-sm bg-[#1A1E16] border-r border-[#4A533E] p-6 flex flex-col z-10">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black tracking-widest uppercase text-[#C2CDB4]">
                        The Roster
                    </h2>
                    <Link href="/" className="text-xs text-[#8E9D7B] hover:text-white transition-colors">
                        Exit Live
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {sortedPresenters.length === 0 ? (
                        <p className="text-[#8E9D7B] text-center mt-10">No topics claimed yet.</p>
                    ) : (
                        sortedPresenters.map((p, index) => {
                            const isMyTopic = p.claimed_by === user?.id;

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectPresenter(p)}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${activePresenter?.id === p.id
                                            ? 'bg-[#8E9D7B] border-[#C2CDB4] shadow-lg transform scale-[1.02]'
                                            : 'bg-[#2D3325] border-transparent hover:border-[#4A533E] hover:bg-[#3A4230]'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        {/* NEW: Explicitly label their own card */}
                                        <div className="text-xs font-bold uppercase tracking-widest opacity-70">
                                            {isMyTopic ? (
                                                <span className="text-[#C2CDB4]">👋 Your Topic</span>
                                            ) : (
                                                `Presenter ${index + 1}`
                                            )}
                                        </div>

                                        {p.has_presented && (
                                            <div className="bg-[#8E9D7B] text-[#1A1E16] font-black text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md flex items-center gap-1.5 animate-fade-in relative transition-all duration-300">
                                                <span className="text-xs shadow-[0_0_10px_rgba(255,255,255,0.7)]">⭐</span>
                                                <span>Presented!</span>
                                                <span className="absolute inset-0 rounded-full animate-pulse-slow bg-white/10 opacity-70"></span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-black text-lg truncate">{p.profiles?.display_name}</div>
                                    <div className="text-sm truncate opacity-80 mt-1">{p.title}</div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: The Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative bg-gradient-to-br from-[#2D3325] to-[#1A1E16]">
                {activePresenter ? (
                    <div className="w-full max-w-4xl flex flex-col items-center text-center animate-fade-in">

                        <div className="inline-block bg-[#8E9D7B] text-[#1A1E16] font-black px-6 py-2 rounded-full text-sm uppercase tracking-[0.2em] mb-8 shadow-lg">
                            {activePresenter.has_presented ? 'Presentation Concluded' : 'Currently Presenting'}
                        </div>

                        <h1 className="text-7xl font-black mb-6 leading-tight text-white drop-shadow-md">
                            {activePresenter.profiles?.display_name}
                        </h1>

                        <h2 className="text-3xl font-medium text-[#C2CDB4] mb-12 max-w-3xl leading-relaxed">
                            "{activePresenter.title}"
                        </h2>

                        {isRating ? (
                            <div className="bg-[#2D3325] p-8 rounded-[2rem] border border-[#4A533E] shadow-2xl w-full max-w-md animate-fade-in">
                                <RatingRow label="🎯 I was locked in" valueKey="lockedIn" />
                                <RatingRow label="🔥 You cooked" valueKey="cooked" />
                                <RatingRow label="🍿 Would I rewatch this?" valueKey="rewatch" />

                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={() => setIsRating(false)}
                                        className="flex-1 py-4 rounded-xl font-bold text-[#C2CDB4] hover:bg-[#3A4230] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitRating}
                                        disabled={submitting}
                                        className="flex-1 py-4 bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] font-black rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Sending...' : 'Lock It In'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* MASSIVE TIMER */}
                                <div className="relative group">
                                    <div className={`text-[12rem] font-mono font-bold leading-none tracking-tighter transition-colors duration-500 ${timeLeft === 0 ? 'text-red-500 animate-pulse' :
                                            timeLeft <= 60 ? 'text-orange-400' : 'text-white'
                                        }`}>
                                        {formatTime(timeLeft)}
                                    </div>

                                    {/* CONTROLS (Only visible to active presenter before they finish) */}
                                    {isCurrentPresenter && !activePresenter.has_presented && (
                                        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <button onClick={toggleTimer} className="bg-[#4A533E] hover:bg-[#C2CDB4] hover:text-[#1A1E16] text-white font-bold py-3 px-8 rounded-full transition-all">
                                                {timerRunning ? 'PAUSE' : 'START'}
                                            </button>
                                            <button onClick={resetTimer} className="bg-transparent border-2 border-[#4A533E] text-[#C2CDB4] hover:bg-[#4A533E] font-bold py-3 px-8 rounded-full transition-all">
                                                RESET
                                            </button>
                                        </div>
                                    )}

                                    {/* LOCKED BADGE (Visible to active presenter after they finish) */}
                                    {isCurrentPresenter && activePresenter.has_presented && (
                                        <div className="absolute -bottom-16 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="bg-red-500/10 text-red-500 font-bold py-3 px-8 rounded-full border border-red-500/30 uppercase tracking-widest text-sm">
                                                LOCKED
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* THE CONSTANT RATE BUTTON (For Watchers Only) */}
                                {!isCurrentPresenter && !hasRated && timeLeft < START_TIME && (
                                    <div className="mt-16 animate-fade-in">
                                        <button
                                            onClick={() => setIsRating(true)}
                                            className={`font-black text-2xl py-6 px-12 rounded-full transform transition-all duration-300 ${timeLeft === 0
                                                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_40px_rgba(239,68,68,0.6)] hover:shadow-[0_0_60px_rgba(239,68,68,0.8)] scale-110 animate-bounce'
                                                    : 'bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] shadow-[0_0_30px_rgba(142,157,123,0.3)] hover:scale-105'
                                                }`}
                                        >
                                            ⭐ RATE THIS PRESENTATION
                                        </button>
                                    </div>
                                )}

                                {hasRated && (
                                    <div className="mt-16 text-[#8E9D7B] font-bold text-xl uppercase tracking-widest animate-fade-in">
                                        ✅ Rating Locked In
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                ) : (
                    <div className="text-[#8E9D7B] text-2xl font-medium animate-pulse">
                        Waiting for a presenter to take the stage...
                    </div>
                )}
            </div>
        </div>
    )
}