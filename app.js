import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  onDisconnect,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* 🔥 FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyDqpzbGP9NIEpqt19ZD8F63Hb9U81XNmj4",
  authDomain: "chat-1fcbc.firebaseapp.com",
  databaseURL: "https://chat-1fcbc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chat-1fcbc",
  storageBucket: "chat-1fcbc.firebasestorage.app",
  messagingSenderId: "1052129961309",
  appId: "1:1052129961309:web:557082ecbc6bae0e69f4b4"
  
import { getAuth, signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { get } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const auth = getAuth(app);

let uid = "";
let isAdmin = false;
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ADMIN */
const adminUsers = ["eliftahsin"];
let isAdmin = false;

/* STATE */
let roomId = "";
let name = "";
let replyMessage = null;

/* 🚪 JOIN */
window.joinRoom = function () {

  roomId = document.getElementById("roomId").value.trim();
  name = document.getElementById("name").value.trim();

  name = document.getElementById("name").value.trim();
roomId = document.getElementById("roomId").value.trim();

/* 👇 BURAYA EKLE */
window.login = function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {

      const user = userCredential.user;

      uid = user.uid;
      name = user.email;

      await checkAdmin(); // admin kontrol

      document.getElementById("login").style.display = "none";
      document.getElementById("chatApp").style.display = "flex";

      setOnline();
      listenMessages();
      listenUsers();
      listenTyping();
      initTyping();
    })
    .catch(err => {
      alert("Hata: " + err.message);
    });
};
/* 💬 SEND */
window.sendMessage = async function () {

  const msg = document.getElementById("msg").value;

  if (!msg) return;

  /* 🔇 MUTE CONTROL */
  const muteSnap = await get(ref(db, `rooms/${roomId}/mutedUsers/${name}`));
  if (muteSnap.exists()) {
    alert("Sessize alındın ❌");
    return;
  }

  push(ref(db, `rooms/${roomId}/messages`), {
    name,
    text: msg,
    time: Date.now(),
    reply: replyMessage
      ? {
          sender: replyMessage.sender,
          text: replyMessage.text
        }
      : null
  });

  document.getElementById("msg").value = "";
  setTyping(false);
  cleanupMessages();
};

/* 📥 MESSAGES */
function listenMessages() {

  const box = document.getElementById("chatBox");
  if (!box) return;

  onValue(ref(db, `rooms/${roomId}/messages`), (snap) => {

    const data = snap.val();
    box.innerHTML = "";

    if (!data) return;

    for (let id in data) {

      const m = data[id];

      const div = document.createElement("div");
      div.classList.add("message");

      div.classList.add(m.name === name ? "right" : "left");
      div.setAttribute("data-id", id);

      let startX = 0;

      div.addEventListener("touchstart", e => startX = e.touches[0].clientX);

      div.addEventListener("touchmove", e => {

        const diff = e.touches[0].clientX - startX;

        if (diff > 70) {
          replyMessage = {
            id,
            sender: m.name,
            text: m.text
          };
          showReplyBar();
        }
      });

      let pressTimer;

      const startPress = () => {
        pressTimer = setTimeout(() => showMessageOptions(id, m), 600);
      };

      const cancelPress = () => clearTimeout(pressTimer);

      div.addEventListener("mousedown", startPress);
      div.addEventListener("mouseup", cancelPress);
      div.addEventListener("mouseleave", cancelPress);

      div.addEventListener("touchstart", startPress);
      div.addEventListener("touchend", cancelPress);

      div.innerHTML = `
        ${m.reply ? `
          <div style="font-size:12px;opacity:.7;border-left:3px solid #3b82f6;padding-left:5px;margin-bottom:5px;">
            ↩ ${m.reply.sender}<br>${m.reply.text}
          </div>` : ""}

        <b>${m.name}</b><br>
        ${m.text}

        ${m.edited ? `<small>(düzenlendi)</small>` : ""}

        ${m.reaction ? `<div style="margin-top:5px">👍 ${m.reaction}</div>` : ""}
      `;

      box.appendChild(div);
    }

    box.scrollTop = box.scrollHeight;
  });
}

/* USERS */
function setOnline() {
  const userRef = ref(db, `rooms/${roomId}/users/${name}`);
  set(userRef, { name, online: true });
  onDisconnect(userRef).set({ name, online: false });
}

function listenUsers() {
  onValue(ref(db, `rooms/${roomId}/users`), (snap) => {
    const data = snap.val();
    const box = document.getElementById("users");
    box.innerHTML = "";

    for (let id in data) {
      const u = data[id];
      box.innerHTML += u.online ? "🟢 " + u.name + " " : "⚫ " + u.name + " ";
    }
  });
}

/* TYPING */
function initTyping() {
  const input = document.getElementById("msg");
  input.addEventListener("input", () => {
    setTyping(true);
    setTimeout(() => setTyping(false), 1000);
  });
}

function setTyping(state) {
  set(ref(db, `rooms/${roomId}/typing/${name}`), { typing: state });
}

function listenTyping() {
  onValue(ref(db, `rooms/${roomId}/typing`), (snap) => {
    const data = snap.val();
    const box = document.getElementById("typing");

    let arr = [];

    for (let id in data) {
      if (data[id].typing && id !== name) arr.push(id);
    }

    box.innerText = arr.length ? "✍ " + arr.join(", ") : "";
  });
}

/* REACT */
window.react = function (id, emoji) {

  const path = ref(db, `rooms/${roomId}/messages/${id}/reaction`);

  onValue(path, (snap) => {
    const current = snap.val();
    set(path, current === emoji ? null : emoji);
  }, { onlyOnce: true });
};

/* EDIT */
window.editMessage = function (id, msg) {
  const newText = prompt("Düzenle:", msg.text);
  if (!newText) return;

  set(ref(db, `rooms/${roomId}/messages/${id}/text`), newText);
  set(ref(db, `rooms/${roomId}/messages/${id}/edited`), true);
};

/* DELETE */
window.del = function (id, msg) {
  if (msg.name === name || isAdmin) {
    set(ref(db, `rooms/${roomId}/messages/${id}`), null);
  } else {
    alert("Yetkin yok");
  }
};

/* HIDE */
window.hide = function (id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.style.display = "none";
};

/* ADMIN PANEL */
function showAdminPanel() {
  if(!isAdmin) return;

  let panel = document.getElementById("adminPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "adminPanel";

    panel.style.position = "fixed";
    panel.style.right = "0";
    panel.style.top = "0";
    panel.style.width = "300px";
    panel.style.height = "100vh";
    panel.style.background = "#111827";
    panel.style.color = "white";
    panel.style.overflow = "auto";
    panel.style.padding = "10px";
    panel.style.zIndex = "9999";

    document.body.appendChild(panel);
  }

  onValue(ref(db, "rooms"), (snap) => {

    const data = snap.val();
    panel.innerHTML = "<h3>ADMIN PANEL</h3>";

    if (!data) return;

    for (let room in data) {

      panel.innerHTML += `<h4>🏠 ${room}</h4>`;

      const messages = data[room].messages;
      if (!messages) continue;

      for (let id in messages) {

        const m = messages[id];

        panel.innerHTML += `
          <div style="border-bottom:1px solid #333;padding:5px">
            <b>${m.name}</b><br>
            ${m.text}
            <button onclick="adminDelete('${room}','${id}')">🗑</button>
          </div>
        `;
      }

      panel.innerHTML += `
        <button onclick="closeRoom('${room}')" style="background:red;color:white;margin:5px">
          ❌ Odayı Kapat
        </button>
      `;
    }
  });
}

/* ADMIN ACTIONS */
window.adminDelete = function (room, id) {
  set(ref(db, `rooms/${room}/messages/${id}`), null);
};

window.closeRoom = function (room) {
  if (!confirm("Oda kapatılsın mı?")) return;
  set(ref(db, `rooms/${room}`), null);
};

/* REPLY UI */
window.cancelReply = function () {
  replyMessage = null;
};

/* CLEANUP */
function cleanupMessages() {
  const msgRef = ref(db, `rooms/${roomId}/messages`);
  onValue(msgRef, () => {}, { onlyOnce: true });
}

  async function checkAdmin(){

  const snap = await get(ref(db, "admins/" + uid));

  isAdmin = snap.exists();
}
