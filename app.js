console.log("JS çalışıyor");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZNpGv5Yk54JFB_5U6Qr6iNx2PaPrhIFo",
  authDomain:  "party-hub-90183.firebaseapp.com",
  databaseURL: "https://party-hub-90183-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "party-hub-90183",
  
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let name = "";
let roomId = "";
let replyMessage = null;

const adminUsers = ["TAHSİNESMA"];
let isAdmin = false;

/* 🚪 JOIN */
window.joinRoom = function () {

  name = document.getElementById("name").value.trim();
  roomId = document.getElementById("roomId").value.trim();

  if (!name || !roomId) return alert("Eksik bilgi");

  isAdmin = adminUsers.includes(name);

  document.getElementById("login").style.display = "none";
  document.getElementById("chatApp").style.display = "block";

  document.getElementById("roomText").innerText = roomId;

  setOnline();
  listenMessages();
  listenUsers();
  listenTyping();

  if (isAdmin) showAdminPanel();
};

/* 💬 SEND */
window.sendMessage = function () {

  const msg = document.getElementById("msg").value;
  if (!msg) return;

  push(ref(db, `rooms/${roomId}/messages`), {
    name,
    text: msg,
    time: Date.now(),
    reply: replyMessage
  });

  document.getElementById("msg").value = "";
  replyMessage = null;
};

/* 📩 MESSAGES */
function listenMessages() {
  ${isAdmin ? `<button onclick="deleteMsg('${id}')">🗑</button>` : ""}

  const box = document.getElementById("chatBox");

  onValue(ref(db, `rooms/${roomId}/messages`), (snap) => {

    box.innerHTML = "";

    const data = snap.val();
    if (!data) return;

    for (let id in data) {

      const m = data[id];

      const div = document.createElement("div");
      div.className = "message " + (m.name === name ? "right" : "left");

      div.innerHTML = `
        ${m.reply ? `<small>↩ ${m.reply.sender}: ${m.reply.text}</small><br>` : ""}
        <b>${m.name}</b><br>
        ${m.text}
      `;

      box.appendChild(div);
    }
  });
}

/* 👤 USERS */
function setOnline() {
  const r = ref(db, `rooms/${roomId}/users/${name}`);
  set(r, { name, online: true });
  onDisconnect(r).set({ name, online: false });
  <button onclick="kickUser('${user}')">🚫 At</button>
}

function listenUsers() {
  onValue(ref(db, `rooms/${roomId}/users`), (snap) => {
    const data = snap.val();
    const box = document.getElementById("users");

    box.innerHTML = "";

    for (let u in data) {
      box.innerHTML += data[u].online
        ? "🟢 " + data[u].name + " "
        : "⚫ " + data[u].name + " ";
    }
  });
}

/* ✍ typing */
function listenTyping() {
  const input = document.getElementById("msg");

  input.addEventListener("input", () => {
    set(ref(db, `rooms/${roomId}/typing/${name}`), { typing: true });

    setTimeout(() => {
      set(ref(db, `rooms/${roomId}/typing/${name}`), { typing: false });
    }, 1000);
  });
}

/* 😀 emoji */
window.toggleEmoji = function () {
  const box = document.getElementById("emojiBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
};

window.addEmoji = function (e) {
  document.getElementById("msg").value += e;
};

/* 🛡 ADMIN PANEL */
function showAdminPanel() {

  let panel = document.getElementById("adminPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "adminPanel";

    panel.style = `
      position:fixed;
      right:0;
      top:0;
      width:250px;
      height:100vh;
      background:#111;
      color:white;
      overflow:auto;
      padding:10px;
    `;
    <button onclick="deleteMsg('${id}')">🗑 Sil</button>
    <button onclick="hideMsg('${id}')">👁 Gizle</button>

    document.body.appendChild(panel);
  }

  onValue(ref(db, "rooms"), (snap) => {

    const data = snap.val();
    panel.innerHTML = "<h3>ADMIN</h3>";

    for (let room in data) {
      panel.innerHTML += `<h4>${room}</h4>`;

      <button onclick="closeRoom('${room}')">
    ❌ Odayı Kapat
      </button>
    }
  });
}

window.deleteMsg = function(id) {
  set(ref(db, `rooms/${roomId}/messages/${id}`), null);
};
window.hideMsg = function(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.style.display = "none";
};
window.react = function(id, emoji) {

  const path = ref(db, `rooms/${roomId}/messages/${id}/reaction`);

  onValue(path, (snap) => {
    set(path, snap.val() === emoji ? null : emoji);
  }, { onlyOnce: true });
};
window.closeRoom = function(room) {

  if (!confirm("Oda kapatılsın mı?")) return;

  set(ref(db, `rooms/${room}`), null);
};
window.kickUser = function(user) {

  set(ref(db, `rooms/${roomId}/users/${user}`), null);
};
