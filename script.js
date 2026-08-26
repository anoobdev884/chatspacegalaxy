import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyBM5LxpgmwSBpMAPQWIToLgV_JgkI7RBUg",
    authDomain: "chatspacegalaxy.firebaseapp.com",
    projectId: "chatspacegalaxy",
    storageBucket: "chatspacegalaxy.firebasestorage.app",
    messagingSenderId: "235628522554",
    appId: "1:235628522554:web:9a72631bc8fcff340d1903",
    measurementId: "G-096X98RFDE"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentRoom = "general";
let authMode = "login";
let currentUser = localStorage.getItem("chatspace_current") || "";

const $ = id => document.getElementById(id);

function initials(s) {
  return (s || "?").trim().slice(0, 1).toUpperCase();
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function showAuth() {
  $("authScreen").classList.remove("hidden");
  $("app").classList.add("hidden");
}

function showApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  renderUser();
  loadRooms();
  loadMembers();
}

function renderUser() {
  $("currentUser").textContent = currentUser;
  $("userAvatar").textContent = initials(currentUser);
}

async function loadRooms() {
  const roomList = $("roomList");

  try {
    const snapshot = await getDocs(collection(db, "rooms"));

    if (snapshot.empty) {
      await setDoc(doc(db, "rooms", "general"), {
        topic: "Welcome to the community!"
      });

      await setDoc(doc(db, "rooms", "gaming"), {
        topic: "Talk games, consoles and everything gaming."
      });

      await setDoc(doc(db, "rooms", "memes"), {
        topic: "Drop your best memes 😂"
      });
    }

    const updated = await getDocs(collection(db, "rooms"));

    roomList.innerHTML = "";

    updated.forEach(room => {
      const name = room.id;

      const button = document.createElement("button");
      button.className = "room" + (name === currentRoom ? " active" : "");
      button.textContent = "# " + name;

      button.onclick = () => {
        currentRoom = name;
        renderRooms();
        loadMessages();
      };

      roomList.appendChild(button);
    });

    loadMessages();

  } catch (error) {
    console.error(error);
  }
}

async function renderRooms() {
  await loadRooms();
}

function loadMessages() {
  const messages = $("messages");

  const q = query(
    collection(db, "rooms", currentRoom, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    messages.innerHTML = "";

    snapshot.forEach(message => {
      const data = message.data();

      const article = document.createElement("article");
      article.className = "message";

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = initials(data.user);

      const content = document.createElement("div");
      content.className = "message-content";

      const meta = document.createElement("div");
      meta.className = "message-meta";

      const name = document.createElement("strong");
      name.textContent = data.user || "Anonymous";

      const time = document.createElement("span");

      if (data.createdAt) {
        time.textContent = new Date(
          data.createdAt.toMillis()
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });
      }

      const text = document.createElement("p");
      text.textContent = data.text || "";

      meta.append(name, time);
      content.append(meta, text);
      article.append(avatar, content);
      messages.appendChild(article);
    });

    messages.scrollTop = messages.scrollHeight;
  });
}

async function loadMembers() {
  try {
    const snapshot = await getDocs(collection(db, "users"));

    $("memberList").innerHTML = "";

    let count = 0;

    snapshot.forEach(user => {
      count++;

      const data = user.data();

      const member = document.createElement("div");
      member.className = "member";

      member.innerHTML = `
        <span class="dot"></span>
        <div class="avatar small">${initials(data.username)}</div>
        <span>${esc(data.username)}</span>
      `;

      $("memberList").appendChild(member);
    });

    $("memberCount").textContent = Math.max(1, count);

  } catch (error) {
    console.error(error);
  }
}

function setMode(mode) {
  authMode = mode;

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === mode);
  });

  $("authSubmit").textContent =
    mode === "login" ? "Login" : "Create account";

  $("authError").textContent = "";
}

document.querySelectorAll(".tab").forEach(button => {
  button.onclick = () => setMode(button.dataset.tab);
});

$("authForm").onsubmit = async event => {
  event.preventDefault();

  const username = $("authUser").value.trim();
  const password = $("authPass").value;

  if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) {
    $("authError").textContent =
      "Username: 3–20 letters, numbers, _ or -.";
    return;
  }

  if (password.length < 6) {
    $("authError").textContent =
      "Password must be at least 6 characters.";
    return;
  }

  try {
    const userRef = doc(db, "users", username);

    const existing = await getDocs(
      query(collection(db, "users"))
    );

    let found = null;

    existing.forEach(user => {
      if (user.id === username) found = user.data();
    });

    if (authMode === "register") {

      if (found) {
        $("authError").textContent =
          "That username already exists.";
        return;
      }

      await setDoc(userRef, {
        username: username,
        password: password
      });

      currentUser = username;
      localStorage.setItem("chatspace_current", username);

      showApp();

    } else {

      if (!found || found.password !== password) {
        $("authError").textContent =
          "Wrong username or password.";
        return;
      }

      currentUser = username;
      localStorage.setItem("chatspace_current", username);

      showApp();
    }

  } catch (error) {
    console.error(error);
    $("authError").textContent =
      "Something went wrong connecting to Firebase.";
  }
};

$("messageForm").onsubmit = async event => {
  event.preventDefault();

  const input = $("messageInput");
  const text = input.value.trim();

  if (!text || !currentUser) return;

  input.disabled = true;

  try {
    await addDoc(
      collection(db, "rooms", currentRoom, "messages"),
      {
        user: currentUser,
        text: text,
        createdAt: serverTimestamp()
      }
    );

    input.value = "";

  } catch (error) {
    console.error(error);
    alert("Message could not be sent.");

  } finally {
    input.disabled = false;
    input.focus();
  }
};

$("newRoomBtn").onclick = () => {
  $("modal").classList.remove("hidden");
  $("roomInput").focus();
  $("roomError").textContent = "";
};

$("closeModal").onclick = () => {
  $("modal").classList.add("hidden");
};

$("createRoomBtn").onclick = async () => {

  let name = $("roomInput").value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!name) {
    $("roomError").textContent =
      "Enter a room name.";
    return;
  }

  try {

    const roomRef = doc(db, "rooms", name);

    await setDoc(roomRef, {
      topic: "A new ChatSpace room."
    });

    currentRoom = name;

    $("roomInput").value = "";
    $("modal").classList.add("hidden");

    await loadRooms();

  } catch (error) {
    console.error(error);
    $("roomError").textContent =
      "Could not create the room.";
  }
};

$("logoutBtn").onclick = () => {
  currentUser = "";
  localStorage.removeItem("chatspace_current");

  showAuth();

  $("authForm").reset();
  setMode("login");
};

$("membersBtn").onclick = () => {
  $("membersPanel").classList.toggle("mobile-open");
};

if (currentUser) {
  showApp();
} else {
  showAuth();
}
