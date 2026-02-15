// Login screen — shown when user is not authenticated

import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

function DateFlowLogo({ className = 'w-16 h-16' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="loginLogoGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
            <path d="M16 23s-6.8-4.8-8.2-7.6c-1-1.7-.4-4.2 1.3-5.2 1.7-1 3.6-.3 4.9 1.1l2 2.2 2-2.2c1.3-1.4 3.2-2.1 4.9-1.1 1.7 1 2.3 3.5 1.3 5.2C22.8 18.2 16 23 16 23z"
                fill="url(#loginLogoGrad)" />
            <ellipse cx="16" cy="16" rx="14.5" ry="5.5"
                transform="rotate(-30 16 16)"
                stroke="url(#loginLogoGrad)" strokeWidth="1.2" fill="none" opacity="0.45" />
            <circle cx="23" cy="7.5" r="2.4" fill="url(#loginLogoGrad)" opacity="0.9" />
        </svg>
    )
}

export default function LoginScreen() {
    const { login, error } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) return
        setIsLoading(true)
        try {
            await login(email.trim(), password)
        } catch {
            // error is handled by AuthContext
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo + Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <DateFlowLogo className="w-16 h-16 drop-shadow-lg" />
                    </div>
                    <h1 className="text-2xl font-extrabold">
                        <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                            DateFlow
                        </span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Your Dating Pipeline</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-purple-500/5 border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Welcome back</h2>
                    <p className="text-sm text-slate-400 mb-6">Sign in to access your pipeline</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                autoFocus
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition placeholder-slate-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition placeholder-slate-400"
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    🔒 Protected access only
                </p>
            </div>
        </div>
    )
}
