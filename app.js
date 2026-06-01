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

import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const auth = getAuth(app);

let uid = "";
let name = "";
let roomId = "";
let isAdmin = false;
let replyMessage = null;

window.login = function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (user) => {

      uid = user.user.uid;
      name = user.user.email;

      await checkAdmin();

      document.getElementById("login").style.display = "none";
      document.getElementById("chatApp").style.display = "flex";

      listenMessages();
      setOnline();
      listenTyping();

    })
    .catch(e => alert(e.message));
};

async function checkAdmin() {
  const snap = await get(ref(db, "admins/" + uid));
  isAdmin = snap.exists();
}

window.joinRoom = function () {
  roomId = document.getElementById("roomId").value.trim();

  document.getElementById("login").style.display = "none";
  document.getElementById("chatApp").style.display = "flex";

  listenMessages();
  setOnline();
};

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

function listenMessages() {

  const box = document.getElementById("chatBox");

  onValue(ref(db, `rooms/${roomId}/messages`), (snap) => {

    box.innerHTML = "";

    const data = snap.val();
    if (!data) return;

    for (let id in data) {

      const m = data[id];

      const div = document.createElement("div");
      div.className = m.name === name ? "right" : "left";

      let html = "";

      if (m.reply) {
        html += `
          <div style="font-size:12px;opacity:.7;border-left:3px solid #3b82f6;padding-left:5px;margin-bottom:5px">
            ↩ ${m.reply.sender}<br>${m.reply.text}
          </div>
        `;
      }

      html += `
        <b>${m.name}</b><br>
        ${m.text}
      `;

      if (m.edited) html += `<small>(düzenlendi)</small>`;

      if (m.reaction) {
        html += `<div>👍 ${m.reaction}</div>`;
      }

      html += `
        <div style="margin-top:5px">
          <button onclick="react('${id}','❤️')">❤️</button>
          <button onclick="react('${id}','😂')">😂</button>
          <button onclick="reply('${id}')">↩</button>
          ${isAdmin ? `<button onclick="delMsg('${id}')">🗑</button>` : ""}
        </div>
      `;

      div.innerHTML = html;

      box.appendChild(div);
    }

    box.scrollTop = box.scrollHeight;
  });
}

window.react = function (id, emoji) {

  const path = ref(db, `rooms/${roomId}/messages/${id}/reaction`);

  onValue(path, (snap) => {
    set(path, snap.val() === emoji ? null : emoji);
  }, { onlyOnce: true });
};

window.reply = function (id) {

  const msgRef = ref(db, `rooms/${roomId}/messages/${id}`);

  get(msgRef).then(snap => {

    const m = snap.val();

    replyMessage = {
      sender: m.name,
      text: m.text
    };

    document.getElementById("replyBar").innerText =
      "↩ " + m.name + ": " + m.text;
  });
};

function listenTyping() {

  const input = document.getElementById("msg");

  input.addEventListener("input", () => {

    set(ref(db, `rooms/${roomId}/typing/${name}`), {
      typing: true
    });

    setTimeout(() => {
      set(ref(db, `rooms/${roomId}/typing/${name}`), {
        typing: false
      });
    }, 1000);

  });
}

function setOnline() {

  const r = ref(db, `rooms/${roomId}/users/${name}`);

  set(r, { name, online: true });

  onDisconnect(r).set({ name, online: false });
}

window.delMsg = function (id) {
  set(ref(db, `rooms/${roomId}/messages/${id}`), null);
};
