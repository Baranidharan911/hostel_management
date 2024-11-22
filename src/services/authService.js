import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase/firebaseConfig';
import { useState, useEffect } from 'react';

const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

const getUserRole = async (uid) => {
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    if (userDoc.exists()) {
        return userDoc.data().role;
    } else {
        throw new Error('No such document!');
    }
};

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthenticated(true);
                try {
                    const role = await getUserRole(user.uid);
                    setUserRole(role);
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            } else {
                setIsAuthenticated(false);
                setUserRole(null);
            }
        });
        return () => unsubscribe();
    }, []);

    return { isAuthenticated, userRole };
};

export { signIn, getUserRole, useAuth };
