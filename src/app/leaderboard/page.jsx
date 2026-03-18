'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function LeaderboardPage() {
    const router = useRouter()
    const [rankings, setRankings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAndCalculateScores = async () => {
            // 1. THE BOUNCER: Check for logged-in user
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                window.location.href = '/' // Kick unauthenticated users to home
                return
            }

            // 2. Fetch all topics and ratings
            const { data: topicsData, error } = await supabase
                .from('topics')
                .select(`
          id,
          title,
          profiles (display_name),
          ratings (locked_in_score, cooked_score, rewatch_score)
        `)

            if (error) {
                console.error("Error fetching leaderboard data:", error)
                setLoading(false)
                return
            }

            // 3. Calculate Averages
            const calculatedRankings = topicsData
                .filter(topic => topic.ratings && topic.ratings.length > 0)
                .map(topic => {
                    const totalRatings = topic.ratings.length
                    const sumLockedIn = topic.ratings.reduce((acc, curr) => acc + curr.locked_in_score, 0)
                    const sumCooked = topic.ratings.reduce((acc, curr) => acc + curr.cooked_score, 0)
                    const sumRewatch = topic.ratings.reduce((acc, curr) => acc + curr.rewatch_score, 0)

                    const avgLockedIn = sumLockedIn / totalRatings
                    const avgCooked = sumCooked / totalRatings
                    const avgRewatch = sumRewatch / totalRatings
                    const overallScore = ((avgLockedIn + avgCooked + avgRewatch) / 3)

                    return {
                        id: topic.id,
                        presenterName: topic.profiles?.display_name || 'Unknown',
                        title: topic.title,
                        votes: totalRatings,
                        scores: {
                            lockedIn: avgLockedIn.toFixed(1),
                            cooked: avgCooked.toFixed(1),
                            rewatch: avgRewatch.toFixed(1),
                            overall: overallScore.toFixed(2)
                        }
                    }
                })

            // 4. Sort from highest to lowest overall score
            calculatedRankings.sort((a, b) => b.scores.overall - a.scores.overall)

            setRankings(calculatedRankings)
            setLoading(false)
        }

        fetchAndCalculateScores()

        const channel = supabase.channel('public:ratings')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ratings' }, () => {
                fetchAndCalculateScores()
            })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#1A1E16]">
                <div className="w-12 h-12 border-4 border-[#C2CDB4] border-t-[#8E9D7B] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1A1E16] text-[#F5F3E9] p-4 md:p-6 pt-24 pb-20 font-sans selection:bg-[#8E9D7B] selection:text-[#1A1E16]">
            <div className="max-w-3xl mx-auto">

                <div className="text-center mb-10 md:mb-16 animate-fade-in">
                    <h1 className="text-4xl md:text-6xl font-black mb-3 md:mb-4 tracking-tight text-white drop-shadow-sm">
                        Hall of Fame
                    </h1>
                    <p className="text-[#C2CDB4] text-sm md:text-lg font-medium">
                        The final verdicts, calculated by the audience.
                    </p>
                </div>

                {rankings.length === 0 ? (
                    <div className="text-center p-8 md:p-12 bg-[#2D3325] rounded-[2rem] border border-[#4A533E] mx-2">
                        <span className="text-4xl block mb-4">📊</span>
                        <p className="text-[#8E9D7B] font-bold text-lg md:text-xl uppercase tracking-widest">No ratings yet.</p>
                        <p className="text-[#C2CDB4] mt-2 text-sm md:text-base">The board will update automatically once the votes roll in.</p>
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-6">
                        {rankings.map((rank, index) => {
                            const isFirst = index === 0
                            const isSecond = index === 1
                            const isThird = index === 2

                            let medal = null
                            let cardBg = 'bg-[#2D3325] border-transparent'
                            let rankColor = 'text-[#4A533E]'

                            if (isFirst) {
                                medal = '🥇'
                                cardBg = 'bg-gradient-to-br from-[#8E9D7B] to-[#4A533E] border-[#C2CDB4] shadow-[0_0_30px_rgba(142,157,123,0.3)] transform md:scale-[1.02]'
                                rankColor = 'text-[#1A1E16]'
                            } else if (isSecond) {
                                medal = '🥈'
                                cardBg = 'bg-[#2D3325] border-[#C2CDB4]'
                                rankColor = 'text-[#C2CDB4]'
                            } else if (isThird) {
                                medal = '🥉'
                                cardBg = 'bg-[#2D3325] border-[#8E9D7B]'
                                rankColor = 'text-[#8E9D7B]'
                            }

                            return (
                                <div
                                    key={rank.id}
                                    // RESPONSIVE UPGRADE: Stacks vertically on mobile (flex-col), horizontal on desktop (md:flex-row)
                                    className={`flex flex-col md:flex-row items-center gap-4 md:gap-6 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all duration-500 animate-fade-in ${cardBg}`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >

                                    {/* Top Header (Mobile) / Left Side (Desktop) */}
                                    <div className="flex items-center w-full md:w-auto md:flex-1 gap-4">
                                        <div className={`text-4xl md:text-5xl font-black w-12 md:w-16 text-center shrink-0 ${rankColor}`}>
                                            {medal ? medal : `#${index + 1}`}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h2 className={`text-2xl md:text-3xl font-black mb-1 truncate ${isFirst ? 'text-white' : 'text-[#F5F3E9]'}`}>
                                                {rank.presenterName}
                                            </h2>
                                            <p className={`text-xs md:text-sm font-medium line-clamp-1 ${isFirst ? 'text-[#1A1E16] opacity-80' : 'text-[#8E9D7B]'}`}>
                                                "{rank.title}"
                                            </p>
                                            <div className={`text-[10px] md:text-xs mt-1 md:mt-3 uppercase tracking-widest font-bold ${isFirst ? 'text-[#1A1E16] opacity-70' : 'text-[#4A533E]'}`}>
                                                Based on {rank.votes} {rank.votes === 1 ? 'vote' : 'votes'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* The Score Breakdown - Grid on Mobile, Flex on Desktop */}
                                    <div className="grid grid-cols-4 md:flex w-full md:w-auto gap-2 md:gap-6 shrink-0 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#4A533E] md:border-none">
                                        <ScoreColumn label="Lock In" score={rank.scores.lockedIn} isFirst={isFirst} />
                                        <ScoreColumn label="Cooked" score={rank.scores.cooked} isFirst={isFirst} />
                                        <ScoreColumn label="Rewatch" score={rank.scores.rewatch} isFirst={isFirst} />

                                        {/* Overall Score */}
                                        <div className={`flex flex-col items-center justify-center border-l-2 ${isFirst ? 'border-[#1A1E16]/20' : 'border-[#4A533E]'} pl-2 md:pl-6`}>
                                            <div className={`text-xl md:text-4xl font-black ${isFirst ? 'text-white' : 'text-[#C2CDB4]'}`}>
                                                {rank.scores.overall}
                                            </div>
                                            <div className={`text-[8px] md:text-[10px] uppercase tracking-widest font-bold mt-1 ${isFirst ? 'text-[#1A1E16]' : 'text-[#8E9D7B]'}`}>
                                                Overall
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function ScoreColumn({ label, score, isFirst }) {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className={`text-base md:text-xl font-bold ${isFirst ? 'text-[#1A1E16]' : 'text-[#F5F3E9]'}`}>
                {score}
            </div>
            <div className={`text-[8px] md:text-[9px] uppercase tracking-widest font-bold mt-1 text-center ${isFirst ? 'text-[#1A1E16] opacity-70' : 'text-[#4A533E]'}`}>
                {label}
            </div>
        </div>
    )
}