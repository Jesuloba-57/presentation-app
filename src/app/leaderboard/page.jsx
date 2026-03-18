'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export default function LeaderboardPage() {
    const [rankings, setRankings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAndCalculateScores = async () => {
            // 1. Fetch all topics, their owners, and every single rating attached to them
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

            // 2. The Math: Calculate averages for everyone who has at least 1 rating
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

                    // Overall score is the average of the three category averages
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
                            overall: overallScore.toFixed(2) // 2 decimal places for tie-breakers
                        }
                    }
                })

            // 3. Sort them from highest overall score to lowest
            calculatedRankings.sort((a, b) => b.scores.overall - a.scores.overall)

            setRankings(calculatedRankings)
            setLoading(false)
        }

        fetchAndCalculateScores()

        // Optional: Subscribe to real-time rating updates so the board shifts live!
        const channel = supabase.channel('public:ratings')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ratings' }, () => {
                fetchAndCalculateScores() // Re-run the math if a new vote comes in
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
        <div className="min-h-screen bg-[#1A1E16] text-[#F5F3E9] p-6 pt-24 pb-20 font-sans selection:bg-[#8E9D7B] selection:text-[#1A1E16]">
            <div className="max-w-3xl mx-auto">

                <div className="text-center mb-16 animate-fade-in">
                    <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight text-white drop-shadow-sm">
                        The Hall of Fame
                    </h1>
                    <p className="text-[#C2CDB4] text-lg font-medium">
                        The final verdicts, calculated by the audience.
                    </p>
                </div>

                {rankings.length === 0 ? (
                    <div className="text-center p-12 bg-[#2D3325] rounded-[2rem] border border-[#4A533E]">
                        <span className="text-4xl block mb-4">📊</span>
                        <p className="text-[#8E9D7B] font-bold text-xl uppercase tracking-widest">No ratings yet.</p>
                        <p className="text-[#C2CDB4] mt-2">The board will update automatically once the votes roll in.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rankings.map((rank, index) => {
                            // Styling logic for 1st, 2nd, and 3rd place
                            const isFirst = index === 0
                            const isSecond = index === 1
                            const isThird = index === 2

                            let medal = null
                            let cardBg = 'bg-[#2D3325] border-transparent'
                            let rankColor = 'text-[#4A533E]'

                            if (isFirst) {
                                medal = '🥇'
                                cardBg = 'bg-gradient-to-br from-[#8E9D7B] to-[#4A533E] border-[#C2CDB4] shadow-[0_0_30px_rgba(142,157,123,0.3)] transform scale-[1.02]'
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
                                    className={`flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-500 animate-fade-in ${cardBg}`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >

                                    {/* Rank Number / Medal */}
                                    <div className={`text-5xl font-black w-16 text-center shrink-0 ${rankColor}`}>
                                        {medal ? medal : `#${index + 1}`}
                                    </div>

                                    {/* Presenter Info */}
                                    <div className="flex-1 text-center md:text-left w-full">
                                        <h2 className={`text-3xl font-black mb-1 ${isFirst ? 'text-white' : 'text-[#F5F3E9]'}`}>
                                            {rank.presenterName}
                                        </h2>
                                        <p className={`text-sm font-medium ${isFirst ? 'text-[#1A1E16] opacity-80' : 'text-[#8E9D7B]'}`}>
                                            "{rank.title}"
                                        </p>
                                        <div className={`text-xs mt-3 uppercase tracking-widest font-bold ${isFirst ? 'text-[#1A1E16] opacity-70' : 'text-[#4A533E]'}`}>
                                            Based on {rank.votes} {rank.votes === 1 ? 'vote' : 'votes'}
                                        </div>
                                    </div>

                                    {/* The Score Breakdown */}
                                    <div className="flex gap-4 md:gap-6 shrink-0 mt-4 md:mt-0">
                                        <ScoreColumn label="Locked In" score={rank.scores.lockedIn} isFirst={isFirst} />
                                        <ScoreColumn label="Cooked" score={rank.scores.cooked} isFirst={isFirst} />
                                        <ScoreColumn label="Rewatch" score={rank.scores.rewatch} isFirst={isFirst} />

                                        {/* Overall Score */}
                                        <div className={`flex flex-col items-center justify-center pl-4 md:pl-6 border-l-2 ${isFirst ? 'border-[#1A1E16]/20' : 'border-[#4A533E]'}`}>
                                            <div className={`text-4xl font-black ${isFirst ? 'text-white' : 'text-[#C2CDB4]'}`}>
                                                {rank.scores.overall}
                                            </div>
                                            <div className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${isFirst ? 'text-[#1A1E16]' : 'text-[#8E9D7B]'}`}>
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

// Helper component for the tiny score columns
function ScoreColumn({ label, score, isFirst }) {
    return (
        <div className="flex flex-col items-center">
            <div className={`text-xl font-bold ${isFirst ? 'text-[#1A1E16]' : 'text-[#F5F3E9]'}`}>
                {score}
            </div>
            <div className={`text-[9px] uppercase tracking-widest font-bold mt-1 ${isFirst ? 'text-[#1A1E16] opacity-70' : 'text-[#4A533E]'}`}>
                {label}
            </div>
        </div>
    )
}