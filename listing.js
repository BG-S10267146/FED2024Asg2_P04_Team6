import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, serverTimestamp, Timestamp, query, orderBy, onSnapshot, doc, getDoc, updateDoc, deleteDoc 
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

// Cloudinary Configuration
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dogiqggzn/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "chat_uploads";

// DOM Elements
const titleInput = document.getElementById("titleInput");
const priceInput = document.getElementById("priceInput");
const descriptionInput = document.getElementById("descriptionInput");
const imageInput = document.getElementById("imageInput");
const customAttributeInput = document.getElementById("customAttributeInput");
const conditionInput = document.getElementById("conditionInput");
const listItemButton = document.getElementById("listItemButton");
const listingsDisplay = document.getElementById("listingsDisplay");

// Upload image to Cloudinary
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
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

// Fetch username by user ID
const getUsernameById = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().username : "Unknown User";
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Unknown User";
  }
};

// Handle item listing
listItemButton.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const price = parseFloat(priceInput.value);
  const description = descriptionInput.value.trim();
  const file = imageInput.files[0];
  const customAttribute = customAttributeInput.value.trim();
  const condition = conditionInput.value; // Get condition value

  if (!title || isNaN(price) || !description || !file) {
    alert("Please fill in all fields and upload an image.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to list an item.");
    return;
  }

  try {
    const username = await getUsernameById(user.uid);
    const imageUrl = await uploadImage(file);
    if (!imageUrl) {
      alert("Image upload failed. Please try again.");
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await addDoc(collection(db, "listings"), {
      itemName: title,
      itemPrice: price,
      itemDescription: description,
      imageUrl,
      userId: user.uid,
      username: username,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiryDate),
      customAttribute: customAttribute || null,
      condition: condition, // Store condition in Firestore
      offers: [], // New field for offers
      viewCount: 0 // Initialize view count
    });

    alert("Item listed successfully!");
    document.getElementById("sellForm").reset();
  } catch (error) {
    console.error("Error listing item: ", error);
    alert("Failed to list the item. Please try again.");
  }
});

// Assuming you want to send an offer to a listing:
const sendOffer = async (listingId, buyerId, offerPrice, listingUserId) => {
  if (listingUserId === buyerId) {
    alert("You cannot make an offer on your own listing.");
    return;
  }

  if (isNaN(offerPrice) || offerPrice <= 0) {
    alert("Please enter a valid offer price.");
    return;
  }

  try {
    const offerRef = collection(db, "listings", listingId, "offers");
    const newOffer = {
      buyerId: buyerId,
      offerPrice: offerPrice,
      timestamp: new Date(),
    };

    // Adding the offer to Firestore
    await addDoc(offerRef, newOffer);
    console.log("Offer sent successfully!");
  } catch (error) {
    console.error("Error sending offer: ", error);
    alert("Failed to send the offer. Please try again.");
  }
};

const fetchListings = (searchQuery = "") => {
  const timeOrder = document.getElementById("sortTime").value;
  const popularityOrder = document.getElementById("sortPopularity").value;

  let listingsQuery = collection(db, "listings");

  // Apply ordering based on selected filters
  if (timeOrder !== "none" && popularityOrder === "none") {
    listingsQuery = query(listingsQuery, orderBy("createdAt", timeOrder));
  } else if (popularityOrder !== "none" && timeOrder === "none") {
    listingsQuery = query(listingsQuery, orderBy("viewCount", popularityOrder));
  } else if (timeOrder !== "none" && popularityOrder !== "none") {
    // Apply multiple orderBy clauses
    listingsQuery = query(listingsQuery, orderBy("createdAt", timeOrder), orderBy("viewCount", popularityOrder));
  }

  onSnapshot(listingsQuery, async (snapshot) => {
    listingsDisplay.innerHTML = "";
    if (snapshot.empty) {
      listingsDisplay.innerHTML = "<p>No listings available.</p>";
      return;
    }

    for (const doc of snapshot.docs) {
      const listing = doc.data();
      const username = await getUsernameById(listing.userId);

      // Convert fields to lowercase for search comparison
      const title = listing.itemName.toLowerCase();
      const description = listing.itemDescription.toLowerCase();
      const category = listing.customAttribute ? listing.customAttribute.toLowerCase() : "";

      // Apply search filter
      if (
        searchQuery &&
        !title.includes(searchQuery) &&
        !description.includes(searchQuery) &&
        !category.includes(searchQuery)
      ) {
        continue; 
      }

      // Inside fetchListings function
      const listingElement = document.createElement("div");
      listingElement.classList.add("listing");
      listingElement.innerHTML = `
        <h3>${listing.itemName}</h3>
        <p><strong>Price:</strong> $${listing.itemPrice.toFixed(2)}</p>
        <p><strong>Condition:</strong> ${listing.condition}</p>
        <p>${listing.itemDescription}</p>
        <p><strong>Listed by:</strong> ${username || "Unknown User"}</p>
        ${listing.customAttribute ? `<p><strong>Category:</strong> ${listing.customAttribute}</p>` : ""}
        <p><strong>Views:</strong> ${listing.viewCount}</p>
        <img src="${listing.imageUrl}" alt="${listing.itemName}" style="width: 100px; height: auto; border-radius: 5px;" />
        <button onclick="viewDetails('${doc.id}')">View Details</button>
        <button onclick="offerPrice('${doc.id}', '${listing.userId}')">Make an Offer</button>
        <button onclick="buyItem('${doc.id}', '${listing.userId}', '${listing.itemPrice}')">Buy</button>
      `;


      listingsDisplay.appendChild(listingElement);
    }
  });
};

// Event Listeners for Filtering
document.getElementById("sortTime").addEventListener("change", () => fetchListings(searchInput.value.trim().toLowerCase()));
document.getElementById("sortPopularity").addEventListener("change", () => fetchListings(searchInput.value.trim().toLowerCase()));


// Redirect to listing details page
window.viewDetails = async (listingId) => {
  const user = auth.currentUser;
  
  // Check if the current user is not the seller
  const listingRef = doc(db, "listings", listingId);
  const listingDoc = await getDoc(listingRef);

  if (listingDoc.exists()) {
    const listingData = listingDoc.data();
    const listingUserId = listingData.userId;

    // If the user is not the seller, increment the view count
    if (user && listingUserId !== user.uid) {
      const currentViewCount = listingData.viewCount || 0;
      await updateDoc(listingRef, {
        viewCount: currentViewCount + 1
      });
    }

    // Redirect to listing details page
    window.location.href = `listing_details.html?listingId=${listingId}`;
  }
};

// Function to handle price offer (show prompt)
window.offerPrice = (listingId, listingUserId) => {
  const offeredPrice = prompt("Enter your offered price:");

  if (offeredPrice && !isNaN(offeredPrice) && offeredPrice > 0) {
    sendOffer(listingId, auth.currentUser.uid, parseFloat(offeredPrice), listingUserId);
  } else {
    alert("Please enter a valid price.");
  }
};

// Function to handle buying an item
window.buyItem = async (listingId, listingUserId, price) => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to buy an item.");
    return;
  }

  if (listingUserId === user.uid) {
    alert("You cannot buy your own listing.");
    return;
  }

  const spins = Math.floor(price / 30); 
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentSpins = userDoc.data().spins || 0;
      
      await updateDoc(userRef, {
        spins: currentSpins + spins, // Add spins to the current spins
      });
    } else {
      await updateDoc(userRef, {
        spins: spins,
      });
    }

    await deleteDoc(doc(db, "listings", listingId));
    alert("Item bought successfully!");
    window.location.href = "slots.html";  

  } catch (error) {
    console.error("Error buying item: ", error);
    alert("Failed to buy the item. Please try again.");
  }
};

// Get the form and toggle button elements
const listingForm = document.querySelector(".listing-container");
const toggleFormButton = document.getElementById("toggleFormButton");

// Set initial state
let isFormVisible = false;

// Add event listener to toggle button
toggleFormButton.addEventListener("click", () => {
  isFormVisible = !isFormVisible;
  listingForm.style.display = isFormVisible ? "block" : "none";
  toggleFormButton.textContent = isFormVisible ? "Hide Form" : "Show Form";
});

// Get search input element
const searchInput = document.getElementById("searchInput");

// Function to filter listings based on search input
searchInput.addEventListener("input", () => {
  fetchListings(searchInput.value.trim().toLowerCase()); 
});

// Load listings on page load
fetchListings();
