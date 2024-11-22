import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCe3fnD0__HPXH8VFYjMQ-YPfl5iq55k-E",
  authDomain: "hostel-management-bc53f.firebaseapp.com",
  projectId: "hostel-management-bc53f",
  storageBucket: "hostel-management-bc53f.appspot.com",
  messagingSenderId: "807790748423",
  appId: "1:807790748423:web:bf1ac231c4cb6dfaae1ba2",
  measurementId: "G-BKVME2TWFY"
};




const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage };
