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
  apiKey: "AIzaSyDqpzbGP9NIEpqt19ZD8F63Hb9U81XNmj4",
  authDomain: "chat-1fcbc.firebaseapp.com",
  databaseURL: "https://chat-1fcbc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chat-1fcbc",
  storageBucket: "chat-1fcbc.firebasestorage.app",
  messagingSenderId: "1052129961309",
  appId: "1:1052129961309:web:557082ecbc6bae0e69f4b4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* STATE */
const name = localStorage.getItem("name");
const roomId = localStorage.getItem("roomId");

let replyData = null;

/* ONLINE */
function setOnline() {
  const r = ref(db, `rooms/${roomId}/users/${name}`);
  set(r, { name, online: true });
  onDisconnect(r).set({ name, online: false });
}

/* SEND */
window.sendMessage = function () {

  const input = document.getElementById("msg");
  const text = input.value.trim();
  if (!text) return;

  push(ref(db, `rooms/${roomId}/messages`), {
    name,
    text,
    time: Date.now(),
    reply: replyData
  });

  input.value = "";
  replyData = null;
};

/* LISTEN */
onValue(ref(db, `rooms/${roomId}/messages`), (snap) => {

  const box = document.getElementById("chatBox");
  box.innerHTML = "";

  const data = snap.val();
  if (!data) return;

  for (let id in data) {

    const m = data[id];

    const div = document.createElement("div");
    div.className = m.name === name ? "msg right" : "msg left";

    div.innerHTML = `
      ${m.reply ? `<div class="reply">↩ ${m.reply.sender}: ${m.reply.text}</div>` : ""}

      <b>${m.name}</b><br>
      ${m.text}

      <div class="actions">
        <button onclick="react('${id}','❤️')">❤️</button>
        <button onclick="react('${id}','😂')">😂</button>
        <button onclick="reply('${id}')">↩</button>
      </div>
    `;

    box.appendChild(div);
  }

  box.scrollTop = box.scrollHeight;
});

/* REACT */
window.react = function (id, emoji) {

  const r = ref(db, `rooms/${roomId}/messages/${id}/reaction`);

  onValue(r, (snap) => {
    set(r, snap.val() === emoji ? null : emoji);
  }, { onlyOnce: true });
};

/* REPLY */
window.reply = function (id) {

  onValue(ref(db, `rooms/${roomId}/messages/${id}`), (snap) => {

    const m = snap.val();

    replyData = {
      sender: m.name,
      text: m.text
    };

    document.getElementById("replyBar").innerText =
      "↩ " + m.name + ": " + m.text;

  }, { onlyOnce: true });
};

/* USERS */
onValue(ref(db, `rooms/${roomId}/users`), (snap) => {

  const box = document.getElementById("users");
  box.innerHTML = "";

  const data = snap.val();
  if (!data) return;

  for (let u in data) {
    box.innerHTML += data[u].online
      ? `🟢 ${data[u].name} `
      : `⚫ ${data[u].name} `;
  }
});

/* INIT */
setOnline();
