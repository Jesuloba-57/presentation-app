'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
    const router = useRouter()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                router.push('/')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3E9] p-6">
            <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-sm border border-white">
                <h1 className="mb-2 text-3xl font-extrabold text-[#2D3325] text-center tracking-tight">Presentation Night</h1>
                <p className="mb-8 text-sm text-center text-[#4A533E]">Sign in or create an account to secure your topic.</p>

                {/* We leave the Auth UI as default to save time, but the container matches the aesthetic */}
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={[]}
                />
            </div>
        </div>
    )
}