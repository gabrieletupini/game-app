// Authentication context — Firebase Auth with email/password + Google SSO
// Access restricted to allowed emails only

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    type User,
} from 'firebase/auth'
import { auth } from '../services/firebase'

const googleProvider = new GoogleAuthProvider()

// ── Allowed emails (only these accounts can access the app) ──
const ALLOWED_EMAILS: string[] = [
    'gabritupini@gmail.com',
    // Add more emails here to grant access to other people
]

function isEmailAllowed(email: string | null): boolean {
    if (!email) return false
    return ALLOWED_EMAILS.includes(email.toLowerCase())
}

interface AuthContextType {
    user: User | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    loginWithGoogle: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Listen for auth state changes — reject unauthorized emails
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && !isEmailAllowed(firebaseUser.email)) {
                // Unauthorized user — sign them out immediately
                await signOut(auth)
                setUser(null)
                setError('Access denied — your account is not authorized')
            } else {
                setUser(firebaseUser)
                setError(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const login = async (email: string, password: string) => {
        setError(null)
        // Check email before even attempting Firebase auth
        if (!isEmailAllowed(email)) {
            setError('Access denied — your account is not authorized')
            throw new Error('unauthorized')
        }
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed'
            if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
                setError('Invalid email or password')
            } else if (msg.includes('too-many-requests')) {
                setError('Too many attempts — try again later')
            } else {
                setError(msg)
            }
            throw err
        }
    }

    const loginWithGoogle = async () => {
        setError(null)
        try {
            const result = await signInWithPopup(auth, googleProvider)
            // Check if the Google account is allowed
            if (!isEmailAllowed(result.user.email)) {
                await signOut(auth)
                setError('Access denied — your Google account is not authorized')
                return
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Google sign-in failed'
            if (msg.includes('popup-closed-by-user')) {
                return
            } else if (msg.includes('account-exists-with-different-credential')) {
                setError('An account already exists with this email')
            } else {
                setError(msg)
            }
            throw err
        }
    }

    const logout = async () => {
        await signOut(auth)
    }

    return (
        <AuthContext.Provider value={{ user, loading, error, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
