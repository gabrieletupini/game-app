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

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

export default function LoginScreen() {
    const { login, loginWithGoogle, error } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)

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

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true)
        try {
            await loginWithGoogle()
        } catch {
            // error is handled by AuthContext
        } finally {
            setIsGoogleLoading(false)
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

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-400 font-medium">or</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Google SSO */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading || isLoading}
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                    >
                        {isGoogleLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                Connecting...
                            </span>
                        ) : (
                            <>
                                <GoogleIcon className="w-5 h-5" />
                                Continue with Google
                            </>
                        )}
                    </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    🔒 Protected access only
                </p>
            </div>
        </div>
    )
}
