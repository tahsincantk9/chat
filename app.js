import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "XXX",
  authDomain: "XXX",
  databaseURL: "XXX",
  projectId: "XXX",
  storageBucket: "XXX",
  messagingSenderId: "XXX",
  appId: "XXX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* STATE */
let roomId = "";
let name = "";

/* 🚪 JOIN */
window.joinRoom = function () {

  roomId = document.getElementById("roomId").value.trim();
  name = document.getElementById("name").value.trim();

  if (!roomId || !name) return alert("Eksik bilgi");

  document.getElementById("login").style.display = "none";
  document.getElementById("chatApp").style.display = "block";

  document.getElementById("roomText").innerText = "🏠 " + roomId;

  setOnline();
  listenMessages();
  listenUsers();
  listenTyping();
};

/* 💬 SEND */
window.sendMessage = function () {

  const msg = document.getElementById("msg").value;
  if (!msg) return;

  push(ref(db, "rooms/" + roomId + "/messages"), {
    name,
    text: msg,
    time: Date.now()
  });

  document.getElementById("msg").value = "";

  setTyping(false);
  cleanupMessages();
};

/* 📥 MESSAGES */
function listenMessages() {

  onValue(ref(db, "rooms/" + roomId + "/messages"), (snap) => {

    const data = snap.val();
    const box = document.getElementById("chatBox");

    box.innerHTML = "";

    for (let id in data) {

      const m = data[id];

      const div = document.createElement("div");

      div.classList.add("message");

      /* SAĞ-SOL MESAJ */
      if (m.name === name) {
        div.style.marginLeft = "auto";
        div.style.background = "#3b82f6";
      }

      div.innerHTML = `<b>${m.name}</b><br>${m.text}`;

      box.appendChild(div);
    }

    box.scrollTop = box.scrollHeight;
  });
}

/* 👥 ONLINE */
function setOnline() {

  const userRef = ref(db, "rooms/" + roomId + "/users/" + name);

  set(userRef, {
    name,
    online: true
  });

  onDisconnect(userRef).set({
    name,
    online: false
  });
}

/* 👀 USERS */
function listenUsers() {

  onValue(ref(db, "rooms/" + roomId + "/users"), (snap) => {

    const data = snap.val();
    const box = document.getElementById("users");

    box.innerHTML = "";

    for (let id in data) {

      const u = data[id];

      const div = document.createElement("div");

      div.innerHTML = u.online
        ? "🟢 " + u.name
        : "⚫ " + u.name;

      box.appendChild(div);
    }
  });
}

/* ✍ TYPING */
document.getElementById("msg").addEventListener("input", () => {
  setTyping(true);

  setTimeout(() => {
    setTyping(false);
  }, 1500);
});

function setTyping(state) {
  set(ref(db, "rooms/" + roomId + "/typing/" + name), {
    typing: state
  });
}

function listenTyping() {

  onValue(ref(db, "rooms/" + roomId + "/typing"), (snap) => {

    const data = snap.val();
    const typingBox = document.getElementById("typing");

    if (!typingBox) return;

    let typingUsers = [];

    for (let id in data) {
      if (data[id].typing && id !== name) {
        typingUsers.push(id);
      }
    }

    typingBox.innerText =
      typingUsers.length > 0
        ? "✍ " + typingUsers.join(", ") + " yazıyor..."
        : "";
  });
}

/* 🧹 CLEANUP (100 MESAJ LIMIT) */
function cleanupMessages() {

  const msgRef = ref(db, "rooms/" + roomId + "/messages");

  onValue(msgRef, (snap) => {

    const data = snap.val();
    if (!data) return;

    const keys = Object.keys(data);

    if (keys.length <= 100) return;

    const sorted = keys.sort((a, b) => data[a].time - data[b].time);

    const toDelete = sorted.slice(0, keys.length - 100);

    toDelete.forEach(key => {
      set(ref(db, "rooms/" + roomId + "/messages/" + key), null);
    });

  }, { onlyOnce: true });
}
