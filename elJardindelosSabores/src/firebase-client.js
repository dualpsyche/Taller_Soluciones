// firebase-client.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyAKRsSaoCaPVbZPqaoyhcKEFOBk6W6j8N4",
    authDomain: "jardindelos-a7939.firebaseapp.com",
    databaseURL: "https://jardindelos-a7939-default-rtdb.firebaseio.com",
    projectId: "jardindelos-a7939",
    storageBucket: "jardindelos-a7939.firebasestorage.app",
    messagingSenderId: "64813341530",
    appId: "1:64813341530:web:29385cd986b3802b94f163",
    measurementId: "G-V23957JMC8"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth, createUserWithEmailAndPassword };
