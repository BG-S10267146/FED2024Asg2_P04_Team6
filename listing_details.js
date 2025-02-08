import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
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
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get('listingId');

// Fetch and display listing details
const fetchListingDetails = async () => {
  const listingDocRef = doc(db, "listings", listingId);
  const listingSnapShot = await getDoc(listingDocRef);

  if (listingSnapShot.exists()) {
    const listingData = listingSnapShot.data();
    document.getElementById("uniqueListingTitle").textContent = listingData.itemName;
    document.getElementById("uniqueListingPrice").textContent = `$${listingData.itemPrice.toFixed(2)}`;
    document.getElementById("uniqueListingDescription").textContent = listingData.itemDescription;
    document.getElementById("uniqueListingCondition").textContent = listingData.condition || "No condition specified";
    document.getElementById("uniqueListingCustomAttribute").textContent = listingData.customAttribute || "No additional details";
    document.getElementById("uniqueListingUsername").textContent = listingData.username || "Unknown User";
    document.getElementById("uniqueListingImage").src = listingData.imageUrl;

    // Add event listener to chat button
    document.getElementById("uniqueChatButton").addEventListener("click", async () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const sellerId = listingData.userId;
          const buyerId = user.uid;

          // Fetch the username from Firestore if displayName is null
          let buyerUsername = user.displayName;
          if (!buyerUsername) {
            const userDocRef = await getDoc(doc(db, "users", buyerId));
            buyerUsername = userDocRef.exists() ? userDocRef.data().username : "Buyer";
          }

          // Generate a unique chat ID
          const chatId = `${sellerId}_${buyerId}`;

          // Check if chat already exists
          const chatDocRef = doc(db, "chats", chatId);
          const chatSnapShot = await getDoc(chatDocRef);

          if (!chatSnapShot.exists()) {
            // Create chat document with participants
            await setDoc(chatDocRef, {
              participants: {
                seller: {
                  userId: sellerId,
                  username: listingData.username,
                },
                buyer: {
                  userId: buyerId,
                  username: buyerUsername,
                },
              },
            });
          }

          // Redirect to chat page
          window.location.href = `chats.html?chatId=${chatId}`;
        } else {
          alert("You need to be logged in to start a chat.");
        }
      });
    });
  } else {
    alert("Listing not found.");
  }
};

// Back Button Functionality
document.getElementById("uniqueBackButton").addEventListener("click", () => {
  window.history.back();
});

// Load listing details on page load
fetchListingDetails();
