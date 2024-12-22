import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

// Configuración de Firebase
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
const database = getDatabase(app);

document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // Autenticar usuario
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtener información adicional del usuario desde Realtime Database
        const userSnapshot = await get(ref(database, `users/${user.uid}`));
        if (userSnapshot.exists()) {
            console.log("Datos del usuario:", userSnapshot.val());
        } else {
            console.log("No hay datos adicionales para este usuario.");
        }

        alert("Inicio de sesión exitoso.");
        window.location.href = "/";
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("Credenciales inválidas.");
    }
});
