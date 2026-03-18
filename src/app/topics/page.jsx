'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function TopicsPage() {
    const [topics, setTopics] = useState([])
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [isMounted, setIsMounted] = useState(false) // Controls the entry animation

    // Custom Topic Form State
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newDesc, setNewDesc] = useState('')

    // Filter State
    const [filter, setFilter] = useState('all')

    const router = useRouter()

    useEffect(() => {
        fetchData()
        // Trigger the slide-up animation shortly after component mounts
        setTimeout(() => setIsMounted(true), 100)
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setFetchError(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        setUser(session.user)

        const { data: topicsData, error } = await supabase
            .from('topics')
            .select('*, profiles(display_name)')

        if (error) {
            setFetchError(error.message)
        } else if (topicsData) {
            setTopics(topicsData)
        }
        setLoading(false)
    }

    const handleClaim = async (topicId) => {
        setLoading(true)
        await supabase.from('topics').update({ claimed_by: null }).eq('claimed_by', user.id)
        const { error } = await supabase.from('topics').update({ claimed_by: user.id }).eq('id', topicId).is('claimed_by', null)
        if (error) alert("Oops! Someone might have just grabbed that one.")
        await fetchData()
    }

    const handleCreateTopic = async (e) => {
        e.preventDefault()
        if (!newTitle.trim()) return
        setLoading(true)

        await supabase.from('topics').update({ claimed_by: null }).eq('claimed_by', user.id)

        const { error } = await supabase.from('topics').insert([
            {
                title: newTitle.trim(),
                description: newDesc.trim() || 'A custom topic created by the presenter.',
                claimed_by: user.id
            }
        ])

        if (error) {
            alert("Error creating topic. Check console.")
            console.error(error)
            setLoading(false)
            return
        }

        setNewTitle('')
        setNewDesc('')
        setIsCreating(false)
        await fetchData()
    }

    const processedTopics = topics
        .filter(topic => {
            if (filter === 'available') return topic.claimed_by === null
            if (filter === 'claimed') return topic.claimed_by !== null
            return true
        })
        .sort((a, b) => {
            const isMineA = a.claimed_by === user?.id
            const isMineB = b.claimed_by === user?.id

            if (isMineA && !isMineB) return -1
            if (!isMineA && isMineB) return 1
            return 0
        })

    if (loading && !topics.length) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#F5F3E9] to-[#E2E6D8]">
                <div className="w-8 h-8 border-4 border-[#C2CDB4] border-t-[#8E9D7B] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F5F3E9] to-[#E2E6D8] p-6 pb-20 overflow-hidden">

            {/* Wrapper to control the entry animation */}
            <div className={`transform transition-all duration-1000 ease-out ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                }`}
            >
                <div className="max-w-2xl mx-auto pt-4 mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-[#2D3325] tracking-tight">Topics</h1>
                    <Link href="/" className="text-[#8E9D7B] font-semibold hover:text-[#4A533E] transition-colors bg-white/50 px-4 py-2 rounded-full shadow-sm hover:shadow active:scale-95">
                        ← Back
                    </Link>
                </div>

                {fetchError && (
                    <div className="max-w-2xl mx-auto p-4 mb-6 bg-red-100 text-red-700 rounded-2xl border border-red-200">
                        Database Error: {fetchError}
                    </div>
                )}

                {/* Create Topic Section with soft fade */}
                <div className="max-w-2xl mx-auto mb-8 transition-all duration-500">
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-4 bg-white/50 backdrop-blur-sm border-2 border-dashed border-[#C2CDB4] text-[#8E9D7B] font-bold rounded-[2rem] hover:bg-white hover:border-[#8E9D7B] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                        >
                            + Pitch Your Own Topic
                        </button>
                    ) : (
                        <form onSubmit={handleCreateTopic} className="p-6 bg-white/80 backdrop-blur-md rounded-[2rem] border border-[#C2CDB4] shadow-md animate-fade-in">
                            <h2 className="text-xl font-bold text-[#2D3325] mb-4">Create Custom Topic</h2>
                            <input
                                type="text"
                                placeholder="Topic Title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full mb-3 p-3 bg-[#F5F3E9] border border-[#C2CDB4] rounded-xl text-[#2D3325] focus:outline-none focus:ring-2 focus:ring-[#8E9D7B] transition-shadow"
                                required
                            />
                            <textarea
                                placeholder="Short Description (Optional)"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                className="w-full mb-4 p-3 bg-[#F5F3E9] border border-[#C2CDB4] rounded-xl text-[#2D3325] h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#8E9D7B] transition-shadow"
                            />
                            <div className="flex gap-3">
                                <button type="submit" disabled={loading} className="flex-1 bg-[#8E9D7B] text-white font-bold py-3 rounded-xl hover:bg-[#4A533E] hover:shadow-md active:scale-95 transition-all duration-300">
                                    Create & Claim
                                </button>
                                <button type="button" onClick={() => setIsCreating(false)} className="px-6 bg-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-300 hover:shadow-md active:scale-95 transition-all duration-300">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Filter Bar */}
                <div className="max-w-2xl mx-auto mb-6 flex bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-[#C2CDB4] shadow-sm">
                    {['all', 'available', 'claimed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-2.5 px-4 rounded-full text-sm font-bold capitalize transition-all duration-500 ease-out ${filter === f
                                    ? 'bg-[#8E9D7B] text-white shadow-md transform scale-[1.02]'
                                    : 'text-[#4A533E] hover:bg-[#E2E6D8]/80'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Empty State */}
                {processedTopics.length === 0 && !fetchError && (
                    <div className="max-w-2xl mx-auto p-10 text-center bg-white/50 rounded-[2rem] border border-[#C2CDB4] transition-opacity duration-500">
                        <p className="text-[#4A533E] font-medium">No topics found for this filter.</p>
                    </div>
                )}

                {/* Topic Cards */}
                <div className="grid gap-5 max-w-2xl mx-auto">
                    {processedTopics.map((topic) => {
                        const isMine = topic.claimed_by === user?.id
                        const isClaimedByOther = topic.claimed_by !== null && !isMine
                        const claimerName = topic.profiles?.display_name || 'Someone'

                        return (
                            <div key={topic.id} className={`p-6 rounded-[2rem] backdrop-blur-md transition-all duration-500 ease-out transform ${isMine
                                    ? 'bg-[#E2E6D8] border-2 border-[#8E9D7B] shadow-md'
                                    : 'bg-white/70 border border-white hover:border-[#C2CDB4] shadow-sm hover:shadow-lg hover:-translate-y-1'
                                }`}>
                                <h2 className="text-xl font-bold text-[#2D3325] mb-2">{topic.title}</h2>
                                <p className="text-[#4A533E] text-sm mb-6 leading-relaxed">{topic.description}</p>

                                {isMine ? (
                                    <button disabled className="w-full py-3 bg-[#C2CDB4] text-[#2D3325] rounded-[1.5rem] font-bold cursor-not-allowed transition-colors duration-500">
                                        ✅ Locked in by you
                                    </button>
                                ) : isClaimedByOther ? (
                                    <button disabled className="w-full py-3 bg-gray-200/50 text-gray-500 rounded-[1.5rem] font-bold cursor-not-allowed transition-colors duration-500">
                                        🔒 Claimed by {claimerName}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleClaim(topic.id)}
                                        disabled={loading}
                                        className="w-full py-3 bg-[#8E9D7B] text-white rounded-[1.5rem] font-bold hover:bg-[#4A533E] hover:shadow-md transition-all duration-300 active:scale-95"
                                    >
                                        Claim Topic
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}