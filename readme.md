// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtkuPoAQm_uEejRWWPNFD4wwFdA9DAa3A",
  authDomain: "vizetasker.firebaseapp.com",
  projectId: "vizetasker",
  storageBucket: "vizetasker.firebasestorage.app",
  messagingSenderId: "344208181309",
  appId: "1:344208181309:web:85fb4c960735929fe80254",
  measurementId: "G-8SJL1QCDM5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);