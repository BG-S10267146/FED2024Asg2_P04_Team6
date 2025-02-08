import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getFirestore, collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc 
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

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsContainer = document.getElementById("resultsContainer");
const requestsContainer = document.getElementById("requestsContainer");
const friendsContainer = document.getElementById("friendsContainer");

// Function to get username from UID
const getUsernameById = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().username : "Unknown User";
  } catch (error) {
    console.error("Error fetching username:", error);
    return "Unknown User";
  }
};

// 🔍 Search users by username
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

// 📩 Send friend request (with friend check)
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


// ❌ Decline friend request
window.declineFriendRequest = async (requestId) => {
  try {
    await deleteDoc(doc(db, "friend_requests", requestId)); // Delete the request from Firestore
    alert("Friend request declined.");
    fetchFriendRequests(); // Refresh requests list
  } catch (error) {
    console.error("Error declining friend request:", error);
    alert("Failed to decline friend request.");
  }
};

// ✅ Fetch friend requests (updated to include decline button)
const fetchFriendRequests = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  requestsContainer.innerHTML = "Loading friend requests...";

  try {
    const requestsRef = collection(db, "friend_requests");
    const q = query(requestsRef, where("to", "==", currentUser.uid), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);

    requestsContainer.innerHTML = ""; // Clear previous content

    if (querySnapshot.empty) {
      requestsContainer.innerHTML = "<p>No pending friend requests.</p>";
      return;
    }

    querySnapshot.forEach(async (doc) => {
      const requestData = doc.data();
      const requestId = doc.id;
      const senderId = requestData.from;

      const senderUsername = await getUsernameById(senderId);

      const requestItem = document.createElement("div");
      requestItem.classList.add("request-item");
      requestItem.innerHTML = `
        <span>Friend request from ${senderUsername}</span>
        <button onclick="acceptFriendRequest('${requestId}', '${senderId}')">Accept</button>
        <button onclick="declineFriendRequest('${requestId}')" style="background-color: #dc3545;">Decline</button>
      `;
      requestsContainer.appendChild(requestItem);
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    alert("Error fetching friend requests.");
  }
};


// 👥 Fetch friends list
const fetchFriendsList = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  friendsContainer.innerHTML = "Loading friends...";

  try {
    const friendsRef = collection(db, "friends");
    const q = query(friendsRef, where("user1", "==", currentUser.uid));
    const q2 = query(friendsRef, where("user2", "==", currentUser.uid));

    const [querySnapshot1, querySnapshot2] = await Promise.all([getDocs(q), getDocs(q2)]);

    friendsContainer.innerHTML = ""; // Clear previous content

    if (querySnapshot1.empty && querySnapshot2.empty) {
      friendsContainer.innerHTML = "<p>You have no friends yet.</p>";
      return;
    }

    const friendsSet = new Set();

    querySnapshot1.forEach((doc) => {
      const friendData = doc.data();
      friendsSet.add(friendData.user2);
    });

    querySnapshot2.forEach((doc) => {
      const friendData = doc.data();
      friendsSet.add(friendData.user1);
    });

    for (const friendId of friendsSet) {
      const friendUsername = await getUsernameById(friendId);

      const friendItem = document.createElement("div");
      friendItem.classList.add("friend-item");
      friendItem.innerHTML = `<span>${friendUsername}</span>`;
      friendsContainer.appendChild(friendItem);
    }
  } catch (error) {
    console.error("Error fetching friends list:", error);
    alert("Failed to fetch friends list.");
  }
};

// 🤝 Accept friend request
window.acceptFriendRequest = async (requestId, senderId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const friendshipId = `${currentUser.uid}_${senderId}`;
  const friendsRef = doc(db, "friends", friendshipId);

  try {
    await setDoc(friendsRef, {
      user1: currentUser.uid,
      user2: senderId,
      timestamp: new Date()
    });

    await deleteDoc(doc(db, "friend_requests", requestId)); // Remove friend request after accepting

    alert("Friend request accepted!");
    fetchFriendRequests(); // Refresh requests list
    fetchFriendsList(); // Refresh friends list
  } catch (error) {
    console.error("Error accepting friend request:", error);
    alert("Failed to accept friend request.");
  }
};

// 🚀 Initialize fetching functions
auth.onAuthStateChanged((user) => {
  if (user) {
    fetchFriendRequests();
    fetchFriendsList();
  }
});
