'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)

  // Auth Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [authMessage, setAuthMessage] = useState(null)

  // Check if they are already logged in when the page loads
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAuthMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        setAuthMessage('Success! Check your email to confirm your account.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/') // Triggers the session to update
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#1A1E16] text-[#F5F3E9] font-sans selection:bg-[#8E9D7B] selection:text-[#1A1E16] overflow-hidden flex flex-col md:flex-row">

      {/* LEFT SIDE: The Pitch & Animations */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#8E9D7B]/10 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C2CDB4]/5 rounded-full blur-[100px] -z-10"></div>

        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="inline-block bg-[#2D3325] border border-[#4A533E] text-[#C2CDB4] font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] mb-6 shadow-md">
            The Main Event
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-white drop-shadow-md tracking-tight">
            Presentation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E9D7B] to-[#C2CDB4]">
              Night.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#8E9D7B] max-w-md leading-relaxed mb-12">
            No boring meetings. No corporate jargon. Just 15 minutes to prove you know what you're talking about.
          </p>
        </div>

        {/* Feature Cards (Staggered Animation) */}
        <div className="space-y-4 max-w-md">
          <FeatureCard
            icon="🎯"
            title="Claim Your Topic"
            desc="Lock in your subject before anyone else takes it."
            delay="300ms"
          />
          <FeatureCard
            icon="⏱️"
            title="Take the Stage"
            desc="Time and track all presentations on the Clock!"
            delay="500ms"
          />
          <FeatureCard
            icon="🔥"
            title="Get Rated"
            desc="The audience decides if you 'Cooked' or if you flopped."
            delay="700ms"
          />
        </div>
      </div>

      {/* RIGHT SIDE: The Auth Portal */}
      <div className="w-full md:w-[450px] lg:w-[500px] bg-[#2D3325] border-l border-[#4A533E] p-8 md:p-12 flex flex-col justify-center relative shadow-2xl z-10">

        {session ? (
          // IF LOGGED IN
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 bg-[#8E9D7B] text-[#1A1E16] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-[0_0_30px_rgba(142,157,123,0.3)]">
              👋
            </div>
            <h2 className="text-3xl font-black text-white mb-2">You're In.</h2>
            <p className="text-[#C2CDB4] mb-8">Ready to lock in your topic?</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-4 bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] font-black rounded-xl transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(142,157,123,0.2)]"
            >
              ENTER DASHBOARD &rarr;
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="mt-6 text-xs text-[#8E9D7B] hover:text-white uppercase tracking-widest font-bold transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          // IF NOT LOGGED IN
          <div className="animate-fade-in" style={{ animationDelay: '900ms' }}>
            <h2 className="text-3xl font-black text-white mb-2">
              {isSignUp ? 'Claim Your Spot' : 'Welcome Back'}
            </h2>
            <p className="text-[#8E9D7B] text-sm mb-8">
              {isSignUp ? 'Create an account to join the roster.' : 'Sign in to access your dashboard.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1E16] border border-[#4A533E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#8E9D7B] transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C2CDB4] uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A1E16] border border-[#4A533E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#8E9D7B] transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <div className="text-red-400 text-sm font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}
              {authMessage && <div className="text-[#8E9D7B] text-sm font-bold bg-[#8E9D7B]/10 p-3 rounded-lg border border-[#8E9D7B]/20">{authMessage}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 bg-[#8E9D7B] hover:bg-[#C2CDB4] text-[#1A1E16] font-black rounded-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isSignUp ? 'SIGN UP' : 'LOG IN')}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-[#4A533E] pt-6">
              <p className="text-[#8E9D7B] text-sm">
                {isSignUp ? "Already have an account?" : "Don't have an account yet?"}
              </p>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setAuthMessage(null)
                }}
                className="mt-2 text-white font-bold hover:text-[#C2CDB4] transition-colors uppercase tracking-wider text-sm"
              >
                {isSignUp ? 'Log in instead' : 'Create an account'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// A reusable component for the little animated info cards on the left
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-2xl border border-[#4A533E] bg-[#2D3325]/50 backdrop-blur-sm animate-fade-in hover:border-[#8E9D7B] transition-colors duration-300"
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-xl bg-[#1A1E16] border border-[#4A533E] flex items-center justify-center text-2xl shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-bold text-lg">{title}</h3>
        <p className="text-[#C2CDB4] text-sm mt-1">{desc}</p>
      </div>
    </div>
  )
}