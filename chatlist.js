// chats.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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
const chatList = document.getElementById("chats");

// Fetch and display user's chats
const fetchUserChats = async () => {
  const userId = auth.currentUser.uid;
  const chatsQuery = query(collection(db, "chats"), where(`participants.seller.userId`, "==", userId));
  const chatsSnapshot = await getDocs(chatsQuery);

  chatsSnapshot.forEach((doc) => {
    const chatData = doc.data();
    const chatId = doc.id;
    const otherUser = chatData.participants.buyer.username;

    const chatItem = document.createElement("li");
    chatItem.innerHTML = `
      <a href="chat.html?chatId=${chatId}">Chat with ${otherUser}</a>
      <button class="delete-chat" data-chat-id="${chatId}">Delete</button>
    `;
    chatList.appendChild(chatItem);

    // Add event listener to the delete button
    const deleteButton = chatItem.querySelector(".delete-chat");
    deleteButton.addEventListener("click", () => deleteChat(chatId));
  });
};

// Delete a chat
const deleteChat = async (chatId) => {
  const chatRef = doc(db, "chats", chatId);
  
  try {
    await deleteDoc(chatRef);
    alert("Chat deleted successfully!");
    // Refresh chat list after deletion
    chatList.innerHTML = '';
    fetchUserChats();
  } catch (error) {
    console.error("Error deleting chat: ", error);
    alert("Error deleting chat.");
  }
};

// Detect auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    fetchUserChats();
  } else {
    window.location.href = "login.html"; // Redirect to login page if not authenticated
  }
});
