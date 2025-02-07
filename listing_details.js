// listing_details.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
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

// Get listing ID from URL
// Get listing ID from URL
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get('listingId');

// Fetch and display listing details
const fetchListingDetails = async () => {
  const listingDoc = doc(db, "listings", listingId);
  const listingSnap = await getDoc(listingDoc);

  if (listingSnap.exists()) {
    const listingData = listingSnap.data();
    document.getElementById("listingTitle").textContent = listingData.itemName;
    document.getElementById("listingPrice").textContent = `$${listingData.itemPrice.toFixed(2)}`;
    document.getElementById("listingDescription").textContent = listingData.itemDescription;
    document.getElementById("listingCondition").textContent = listingData.condition || "No condition specified";
    document.getElementById("listingCustomAttribute").textContent = listingData.customAttribute || "No additional details";
    document.getElementById("listingUsername").textContent = listingData.username || "Unknown User";
    document.getElementById("listingImage").src = listingData.imageUrl;

    // Add event listener to chat button
    document.getElementById("chatWithSeller").addEventListener("click", async () => {
      const sellerId = listingData.userId;
      const buyerId = auth.currentUser.uid;

      // Generate a unique chat ID
      const chatId = `${sellerId}_${buyerId}`;

      // Check if chat already exists
      const chatDoc = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatDoc);

      if (!chatSnap.exists()) {
        // Create chat document with participants
        await setDoc(chatDoc, {
          participants: {
            seller: {
              userId: sellerId,
              username: listingData.username,
            },
            buyer: {
              userId: buyerId,
              username: auth.currentUser.displayName || "Buyer",
            },
          },
        });
      }

      // Redirect to chat page
      window.location.href = `chat.html?chatId=${chatId}`;
    });
  } else {
    alert("Listing not found.");
  }
};
// Back Button Functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.history.back();
});


// Load listing details on page load
fetchListingDetails();
