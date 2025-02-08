import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getFirestore, collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, updatePassword, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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

// DOM Elements for Profile
const profileForm = document.getElementById("profileForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const profileImageInput = document.getElementById("profileImageInput");
const profileImagePreview = document.getElementById("profileImagePreview");

// DOM Elements for Friends
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsContainer = document.getElementById("resultsContainer");
const requestsContainer = document.getElementById("requestsContainer");
const friendsContainer = document.getElementById("friendsContainer");

// DOM Element for Spins
/*const spinsContainer = document.getElementById("spinsContainer");

// Function to fetch spins for the current user
const getSpins = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const spinsCount = userData.spins || 0;  // Default to 0 if no spins field exists

      // Display the spins count
      spinsContainer.innerHTML = `You have ${spinsCount} spins!`;
    } else {
      console.log("User document not found");
      spinsContainer.innerHTML = "Error loading spins.";
    }
  } catch (error) {
    console.error("Error fetching spins:", error);
    spinsContainer.innerHTML = "Error loading spins.";
  }
};

// Real-time listener for spins
const listenForSpinsUpdate = (userId) => {
  const userRef = doc(db, "users", userId);
  
  // Listen for real-time updates to the user's document
  onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const userData = doc.data();
      const spinsCount = userData.spins || 0;  // Default to 0 if no spins field exists

      // Update the spins count in the UI
      spinsContainer.innerHTML = `You have ${spinsCount} spins!`;
    }
  });
};*/

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
    return data.secure_url; // Cloudinary returns the image URL here
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};


if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to update your profile.");
      return;
    }

    const newUsername = usernameInput.value.trim();
    const newPassword = passwordInput.value.trim();
    const newProfileImage = profileImageInput.files[0];

    try {
      // Update username in Firestore
      if (newUsername) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { username: newUsername });
        await updateProfile(user, { displayName: newUsername });
      }

      // Update password in Firebase Auth
      if (newPassword) {
        await updatePassword(user, newPassword);
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { password: newPassword });
      }

      // Update profile picture in Firestore and Firebase Auth
      if (newProfileImage) {
        const imageUrl = await uploadImage(newProfileImage);
        if (imageUrl) {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { profileImage: imageUrl });
          await updateProfile(user, { photoURL: imageUrl });
          profileImagePreview.src = imageUrl;
        }
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile: " + error.message);
    }
  });
}

// Friend System Functions
const getUsernameById = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().username : "Unknown User";
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Unknown User";
  }
};

searchButton.addEventListener("click", async () => {
  const searchQuery = searchInput.value.trim().toLowerCase();
  if (!searchQuery) {
    alert("Please enter a username to search.");
    return;
  }

  resultsContainer.innerHTML = "Searching...";

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("You must be logged in to search.");
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", ">=", searchQuery), where("username", "<=", searchQuery + "\uf8ff"));
    const querySnapshot = await getDocs(q);

    resultsContainer.innerHTML = ""; // Clear previous results

    if (querySnapshot.empty) {
      resultsContainer.innerHTML = "<p>No users found.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      const username = userData.username;

      if (userId === currentUser.uid) {
        return; // Prevent adding yourself as a friend
      }

      const userItem = document.createElement("div");
      userItem.classList.add("user-item");
      userItem.innerHTML = `
        <span>${username}</span>
        <button onclick="sendFriendRequest('${userId}', '${username}')">Add Friend</button>
      `;
      resultsContainer.appendChild(userItem);
    });
  } catch (error) {
    console.error("Error searching users:", error);
    alert("Error searching users. Please try again.");
  }
});

window.sendFriendRequest = async (friendId, friendUsername) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("You must be logged in to send friend requests.");
    return;
  }

  if (friendId === currentUser.uid) {
    alert("You cannot send a friend request to yourself.");
    return;
  }

  // Check if they are already friends
  const friendsQuery1 = query(collection(db, "friends"), where("user1", "==", currentUser.uid), where("user2", "==", friendId));
  const friendsQuery2 = query(collection(db, "friends"), where("user1", "==", friendId), where("user2", "==", currentUser.uid));

  const [friendsSnapshot1, friendsSnapshot2] = await Promise.all([getDocs(friendsQuery1), getDocs(friendsQuery2)]);

  if (!friendsSnapshot1.empty || !friendsSnapshot2.empty) {
    alert(`You are already friends with ${friendUsername}!`);
    return;
  }

  // Proceed with sending the request
  const friendRequestRef = doc(db, "friend_requests", `${currentUser.uid}_${friendId}`);

  try {
    await setDoc(friendRequestRef, {
      from: currentUser.uid,
      to: friendId,
      status: "pending",
      timestamp: new Date()
    });

    alert(`Friend request sent to ${friendUsername}`);
  } catch (error) {
    console.error("Error sending friend request:", error);
    alert("Failed to send friend request. Please try again.");
  }
};

// Modify the `onAuthStateChanged` function after the friend request logic
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      usernameInput.value = userData.username || "";
      profileImagePreview.src = userData.profileImage || "";

      // Fetch and display spins
      getSpins(user.uid); // Fetch spins after user is authenticated
      listenForSpinsUpdate(user.uid); // Listen for real-time updates to spins
    }
  } else {
    window.location.href = "login.html"; // Redirect to login page if not authenticated
  }
});

// Load profile data on page load
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      usernameInput.value = userData.username || "";
      profileImagePreview.src = userData.profileImage || "";
    }
  } else {
    window.location.href = "login.html"; // Redirect to login page if not authenticated
  }
});

    // Load Lottie Animation
    const lottieContainer = document.getElementById('lottie-animation-container');
    const lottieAnimation = lottie.loadAnimation({
      container: lottieContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'mp4-videos/Animation - 1738949812929.json' // Path to your Lottie JSON file
    });

  