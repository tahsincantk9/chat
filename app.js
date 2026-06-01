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
let replyMessage = null;

/* JOIN */
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
  initTyping();
};

/* SEND */
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

/* MESSAGES */
function listenMessages() {

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
        <div>
          <button onclick="react('${id}','❤️')">❤️</button>
          <button onclick="react('${id}','😂')">😂</button>
          <button onclick="reply('${id}')">↩</button>
          <button onclick="del('${id}')">🗑</button>
        </div>
      `;

      box.appendChild(div);
    }

    box.scrollTop = box.scrollHeight;
  });
}

/* USERS */
function setOnline() {
  const r = ref(db, `rooms/${roomId}/users/${name}`);
  set(r, { name, online: true });
  onDisconnect(r).set({ name, online: false });
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

/* TYPING */
function initTyping() {
  const input = document.getElementById("msg");

  input.addEventListener("input", () => {
    set(ref(db, `rooms/${roomId}/typing/${name}`), { typing: true });

    setTimeout(() => {
      set(ref(db, `rooms/${roomId}/typing/${name}`), { typing: false });
    }, 1000);
  });
}

function listenTyping() {
  onValue(ref(db, `rooms/${roomId}/typing`), (snap) => {
    const data = snap.val();
    const box = document.getElementById("typing");

    let arr = [];

    for (let u in data) {
      if (data[u].typing && u !== name) arr.push(u);
    }

    box.innerText = arr.length ? "✍ " + arr.join(", ") : "";
  });
}

/* REACT */
window.react = function (id, emoji) {
  const path = ref(db, `rooms/${roomId}/messages/${id}/reaction`);

  onValue(path, (snap) => {
    set(path, snap.val() === emoji ? null : emoji);
  }, { onlyOnce: true });
};

/* REPLY */
window.reply = function (id) {

  get(ref(db, `rooms/${roomId}/messages/${id}`)).then(snap => {
    const m = snap.val();

    replyMessage = {
      sender: m.name,
      text: m.text
    };

    document.getElementById("replyBar").style.display = "block";
    document.getElementById("replyBar").innerText =
      "↩ " + m.name + ": " + m.text;
  });
};

/* DELETE */
window.del = function (id) {
  set(ref(db, `rooms/${roomId}/messages/${id}`), null);
};

/* EMOJI */
window.toggleEmoji = function () {
  const box = document.getElementById("emojiBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
};

window.addEmoji = function (e) {
  document.getElementById("msg").value += e;
};
