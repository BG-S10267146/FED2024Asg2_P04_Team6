import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getFirestore, collection, query, where, onSnapshot, doc, getDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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

const offersContainer = document.getElementById("offersList");
const noOffersPlaceholder = document.getElementById("noOffersPlaceholder");

// Accept offer (update listing price and delete the offer)
const acceptOffer = async (listingId, offerId, newPrice) => {
  try {
    // Update listing price
    await updateDoc(doc(db, "listings", listingId), { itemPrice: newPrice });

    // Remove accepted offer
    await deleteDoc(doc(db, "listings", listingId, "offers", offerId));

    alert("Offer accepted! Listing price updated.");
    location.reload(); // Auto reloads the page
  } catch (error) {
    console.error("Error accepting offer: ", error);
    alert("Failed to accept the offer. Please try again.");
  }
};

// Decline offer (simply delete the offer)
const declineOffer = async (listingId, offerId) => {
  try {
    await deleteDoc(doc(db, "listings", listingId, "offers", offerId));
    alert("Offer declined.");
    location.reload(); // Auto reloads the page
  } catch (error) {
    console.error("Error declining offer: ", error);
    alert("Failed to decline the offer. Please try again.");
  }
};

// Fetch received offers for the logged-in user
const fetchReceivedOffers = async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      offersContainer.innerHTML = "<p>Please log in to see your offers.</p>";
      return;
    }

    // Query listings created by the logged-in user
    const listingsQuery = query(collection(db, "listings"), where("userId", "==", user.uid));

    onSnapshot(listingsQuery, async (listingsSnapshot) => {
      offersContainer.innerHTML = ""; // Clear previous offers
      noOffersPlaceholder.style.display = "none"; // Hide placeholder when offers are found

      if (listingsSnapshot.empty) {
        offersContainer.innerHTML = "<p>You have no listings yet.</p>";
        return;
      }

      listingsSnapshot.forEach(async (listingDoc) => {
        const listingId = listingDoc.id;
        const listingData = listingDoc.data();

        const offersRef = collection(db, "listings", listingId, "offers");
        onSnapshot(offersRef, async (offersSnapshot) => {
          if (offersSnapshot.empty) {
            return;
          }

          offersSnapshot.forEach(async (offerDoc) => {
            const offerId = offerDoc.id;
            const offerData = offerDoc.data();
            const buyerId = offerData.buyerId;
            const offerPrice = offerData.offerPrice;
            const timestamp = offerData.timestamp.toDate().toLocaleString();

            // Fetch buyer username
            const buyerDoc = await getDoc(doc(db, "users", buyerId));
            const buyerName = buyerDoc.exists() ? buyerDoc.data().username : "Unknown Buyer";

            const offerElement = document.createElement("div");
            offerElement.classList.add("offer");
            offerElement.innerHTML = `
              <p><strong>Listing:</strong> ${listingData.itemName}</p>
              <p><strong>Buyer:</strong> ${buyerName} (${buyerId})</p>
              <p><strong>Offered Price:</strong> $${offerPrice.toFixed(2)}</p>
              <p><strong>Timestamp:</strong> ${timestamp}</p>
              <button onclick="acceptOffer('${listingId}', '${offerId}', ${offerPrice})">✅ Accept</button>
              <button onclick="declineOffer('${listingId}', '${offerId}')">❌ Decline</button>
              <hr>
            `;
            offersContainer.appendChild(offerElement);
          });
        });
      });
    });
  });
};

// Expose functions globally for onclick buttons
window.acceptOffer = acceptOffer;
window.declineOffer = declineOffer;

// Load offers
fetchReceivedOffers();