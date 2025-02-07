import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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
const messageContainer = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");

let currentUsername = "";
let currentUserId = "";
let chatId = "";

// Get chat ID from URL
const urlParams = new URLSearchParams(window.location.search);
chatId = urlParams.get('chatId');

// Upload image to Cloudinary
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "chat_uploads");

  try {
    const response = await fetch("https://api.cloudinary.com/v1_1/dogiqggzn/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};

// Send message
const sendMessage = async (message, imageFile) => {
  try {
    let imageUrl = null;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const messagesRef = collection(db, `chats/${chatId}/messages`);
    await addDoc(messagesRef, {
      senderId: currentUserId,
      message,
      timestamp: serverTimestamp(),
      username: currentUsername,
      imageUrl,
    });
    console.log("Message sent!");
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

// Listen for messages
const listenForMessages = () => {
  const messagesRef = collection(db, `chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    renderMessages(messages);
  });
};

// Render messages
const renderMessages = (messages) => {
  messageContainer.innerHTML = "";
  messages.forEach((msg) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    const sender = msg.senderId === currentUserId ? currentUsername : msg.username || "Other User";
    messageElement.innerHTML = `
      <p><strong>${sender}:</strong> ${msg.message}</p>
      ${msg.imageUrl ? `<img src="${msg.imageUrl}" alt="Uploaded Image" style="max-width: 200px; border-radius: 8px;"/>` : ""}
      <small>${msg.timestamp?.toDate() ? new Date(msg.timestamp.toDate()).toLocaleString() : "Sending..."}</small>
    `;
    messageContainer.appendChild(messageElement);
  });
  messageContainer.scrollTop = messageContainer.scrollHeight;
};

// Detect auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserId = user.uid;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    currentUsername = userSnap.exists() ? userSnap.data().username : "Unknown User";
    listenForMessages();
  } else {
    window.location.href = "login.html"; // Redirect to login page if not authenticated
  }
});

// Send message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const imageFile = imageInput.files[0];
  sendMessage(message, imageFile);
  messageInput.value = "";
  imageInput.value = "";
});
