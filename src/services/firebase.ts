// Firebase configuration and initialization

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyD_U4reTfc_6eeBv_z_gWn_YFQ7YcbP30I",
    authDomain: "dateflow-db.firebaseapp.com",
    projectId: "dateflow-db",
    storageBucket: "dateflow-db.firebasestorage.app",
    messagingSenderId: "976090864",
    appId: "1:976090864:web:d95a3dfe8e862cadd2f435",
    measurementId: "G-X7720XY6GB"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
