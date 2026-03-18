'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [myTopic, setMyTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false })
  const router = useRouter()

  // --- COUNTDOWN LOGIC ---
  useEffect(() => {
    // Target date: March 21, 2026 at 7:00 PM
    const targetDate = new Date('2026-03-21T19:00:00').getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true })
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
          isLive: false
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // --- DATA FETCHING LOGIC ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single()

      if (!profileData || !profileData.display_name) {
        router.push('/setup-profile')
        return
      }

      setUser({ ...session.user, customName: profileData.display_name })

      const { data: topicData } = await supabase
        .from('topics')
        .select('*')
        .eq('claimed_by', session.user.id)
        .single()

      if (topicData) {
        setMyTopic(topicData)
      }

      setLoading(false)
      setTimeout(() => setIsMounted(true), 100)
    }

    fetchDashboardData()
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#F5F3E9] to-[#E2E6D8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#C2CDB4] border-t-[#8E9D7B] rounded-full animate-spin"></div>
          <p className="text-[#4A533E] text-sm font-medium tracking-widest uppercase">Syncing...</p>
        </div>
      </div>
    )
  }

  const displayName = user?.customName || 'Presenter'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#F5F3E9] to-[#E2E6D8] p-6 overflow-hidden">

      <div
        className={`max-w-md w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-lg p-8 text-center border border-white transform transition-all duration-1000 ease-out ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-extrabold text-[#2D3325] tracking-tight">
            Welcome, {displayName}
          </h1>
          <span className="relative flex h-3 w-3 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8E9D7B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4A533E]"></span>
          </span>
        </div>

        {/* COUNTDOWN WIDGET */}
        <div className="my-6 p-4 bg-white/50 border border-[#C2CDB4] rounded-3xl shadow-sm">
          {timeLeft.isLive ? (
            <div className="text-[#8E9D7B] font-black text-xl tracking-widest uppercase animate-pulse">
              🎤 We are Live!
            </div>
          ) : (
            <div className="flex justify-center gap-3 md:gap-4">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds }
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center w-14 md:w-16">
                  <div className="w-full bg-[#E2E6D8] text-[#2D3325] font-mono text-xl md:text-2xl font-bold py-2 rounded-xl shadow-inner border border-[#C2CDB4]">
                    {isMounted ? unit.value.toString().padStart(2, '0') : '00'}
                  </div>
                  <span className="text-[#4A533E] text-[9px] md:text-[10px] uppercase font-bold tracking-widest mt-2">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOPIC SECTION */}
        {myTopic ? (
          <div className="mt-4 relative bg-gradient-to-br from-[#E2E6D8] to-[#C2CDB4]/30 border-2 border-dashed border-[#8E9D7B] rounded-[2rem] text-left shadow-sm overflow-hidden group">
            <div className="absolute -left-4 top-1/2 w-8 h-8 bg-[#F5F3E9] rounded-full transform -translate-y-1/2 border-r-2 border-dashed border-[#8E9D7B]"></div>
            <div className="absolute -right-4 top-1/2 w-8 h-8 bg-[#F5F3E9] rounded-full transform -translate-y-1/2 border-l-2 border-dashed border-[#8E9D7B]"></div>

            <div className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#2D3325] text-[#F5F3E9] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                  Official Selection
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#2D3325] leading-tight mb-3 group-hover:text-[#4A533E] transition-colors">
                {myTopic.title}
              </h2>
              <p className="text-[#4A533E] text-sm leading-relaxed mb-6 font-medium">
                {myTopic.description}
              </p>

              <div className="text-center pt-5 border-t border-[#8E9D7B]/30">
                <Link href="/topics" className="text-xs font-bold uppercase tracking-wider text-[#4A533E] hover:text-[#2D3325] transition-colors">
                  Swap Topic →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-base text-[#4A533E] mb-8 leading-relaxed font-medium">
              The stage is yours. Secure your subject before someone else claims the best ones.
            </p>
            <Link
              href="/topics"
              className="block w-full bg-[#8E9D7B] hover:bg-[#4A533E] text-white font-bold py-4 px-8 rounded-[1.5rem] transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 transform"
            >
              Select Your Topic
            </Link>
          </div>
        )}

        {/* --- NEW: THE STAKES WARNING --- */}
        <div className="mt-8 p-5 bg-[#F5F3E9]/80 border border-[#C2CDB4] rounded-[1.5rem] text-left flex gap-4 items-start shadow-inner">
          <span className="text-2xl mt-1">🔥</span>
          <p className="text-[#4A533E] text-sm font-medium leading-relaxed">
            <strong className="text-[#2D3325] block mb-1">The Stakes</strong>
            Have your slides ready! Keep it interactive, controversial, and exciting—because your fellow presenters will be rating you live.
          </p>
        </div>

      </div>
    </div>
  )
}