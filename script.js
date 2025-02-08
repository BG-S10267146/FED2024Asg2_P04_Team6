import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAXnfwNKbDcyuWbRo0GoDKvCiOpkOYN6Jg",
  authDomain: "react-firechat-8920e.firebaseapp.com",
  projectId: "react-firechat-8920e",
  storageBucket: "react-firechat-8920e.appspot.com",
  messagingSenderId: "788922160242",
  appId: "1:788922160242:web:d52e5905ee8015ccac1eeb",
  measurementId: "G-RY892H28CH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const usernameInput = document.getElementById("usernameInput");
const loginButton = document.getElementById("loginButton");
const createAccountButton = document.getElementById("createAccountButton");

// Save username and password to Firestore (not recommended for production)
const saveUserCredentials = async (userId, username, password) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { username, password }, { merge: true });
};

// Handle user login
if (loginButton) {
  loginButton.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "home.html"; // Redirect to home page
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  });
}

// Handle user sign-up
if (createAccountButton) {
  createAccountButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const username = usernameInput.value.trim();

    if (!username) {
      alert("Please enter a username before signing up.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please try again.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      await saveUserCredentials(userId, username, password); // Saving username & password
      window.location.href = "home.html"; // Redirect to choice page
    } catch (error) {
      console.error("Sign-up error:", error);
      alert("Sign-up failed: " + error.message);
    }
  });
}
//-------------------------------------------------------------------------------------------------//