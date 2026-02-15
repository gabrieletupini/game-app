// Authentication context — Firebase Auth with email/password + Google SSO
// Currently single-user (admin), structured for future multi-user support

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

    // Listen for auth state changes (persisted across sessions by Firebase)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const login = async (email: string, password: string) => {
        setError(null)
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed'
            // Friendly error messages
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
            await signInWithPopup(auth, googleProvider)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Google sign-in failed'
            if (msg.includes('popup-closed-by-user')) {
                // User closed the popup — not an error
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
