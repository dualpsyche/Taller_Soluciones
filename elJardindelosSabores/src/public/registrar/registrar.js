import { auth, createUserWithEmailAndPassword } from "../../firebase-client.js";

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Usuario registrado:", userCredential.user);
        alert("Registro exitoso.");
    } catch (error) {
        console.error("Error al registrar:", error);
        alert(error.message);
    }
});
