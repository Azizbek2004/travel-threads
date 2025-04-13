import { auth, db } from "../firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with display name
    await updateProfile(user, { displayName })

    // Create user document in Firestore
    await createUserProfile(user, { displayName })

    return userCredential
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password)

export const logOut = () => signOut(auth)

// Create user profile in Firestore
const createUserProfile = async (user: User, additionalData?: { displayName?: string }) => {
  if (!user) return

  const userRef = doc(db, "users", user.uid)

  try {
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email,
        displayName: additionalData?.displayName || user.displayName || user.email?.split("@")[0] || "User",
        photoURL: user.photoURL || "",
        bio: "",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        followers: [],
        following: [],
        threadCount: 0,
      },
      { merge: true },
    )
  } catch (error) {
    console.error("Error creating user profile:", error)
  }
}
