import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  onDisconnect
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
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const adminUsers = ["admin", "ghost", "root"];
let isAdmin = false;

/* STATE */
let roomId = "";
let name = "";
let replyMessage = null;

/* 🚪 JOIN */
window.joinRoom = function () {

  roomId = document.getElementById("roomId").value.trim();
  name = document.getElementById("name").value.trim();
  if (adminUsers.includes(name)) {
  isAdmin = true;
  setTimeout(showAdminPanel, 500);
} else {
  isAdmin = false;
}

  if (!roomId || !name) return alert("Eksik bilgi");

  document.getElementById("login").style.display = "none";
  document.getElementById("chatApp").style.display = "flex";

  document.getElementById("roomText").innerText = "🏠 " + roomId;

  setOnline();
  listenMessages();
  listenUsers();
  listenTyping();
  initTyping();
};

/* 💬 SEND */
window.sendMessage = function () {

  const msg = document.getElementById("msg").value;
  if (!msg) return;

  push(ref(db,
"rooms/" + roomId + "/messages"), {

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

if (!box) {
  console.log("chatBox yok, chat açılmamış");
  return;
}

  onValue(ref(db, "rooms/" + roomId + "/messages"), (snap) => {

    const data = snap.val();
    const box = document.getElementById("chatBox");

    box.innerHTML = "";

    if (!data) return;

    for (let id in data) {

      const m = data[id];

      const div = document.createElement("div");

      div.classList.add("message");
      div.setAttribute("data-id", id);

      if (m.name === name) {
        div.classList.add("message", "right");
          } else {
        div.classList.add("message", "left");
      }

      // 📱 SWIPE REPLY (TEMİZ)
      let startX = 0;

      div.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
      });

      div.addEventListener("touchmove", (e) => {

        const diff = e.touches[0].clientX - startX;

        if (diff > 70) {

          replyMessage = {
            id,
            sender: m.name,
            text: m.text
          };

          showReplyBar();

          div.style.transform = "translateX(50px)";
        }
      });

      div.addEventListener("touchend", () => {
        div.style.transform = "";
      });

      // 🧹 LONG PRESS
      let pressTimer;

const startPress = () => {
  pressTimer = setTimeout(() => {
    showMessageOptions(id, m);
  }, 600);
};

const cancelPress = () => {
  clearTimeout(pressTimer);
};

div.addEventListener("mousedown", startPress);
div.addEventListener("mouseup", cancelPress);
div.addEventListener("mouseleave", cancelPress);

div.addEventListener("touchstart", startPress);
div.addEventListener("touchend", cancelPress);
div.addEventListener("touchcancel", cancelPress);

      // 💬 MESSAGE UI
      div.innerHTML = `
  ${
    m.reply
      ? `
        <div style="
          font-size:12px;
          opacity:.7;
          border-left:3px solid #3b82f6;
          padding-left:5px;
          margin-bottom:5px;
        ">
          ↩ ${m.reply.sender}<br>
          ${m.reply.text}
        </div>
      `
      : ""
  }

  <b>${m.name}</b><br>
  ${m.text}

  ${m.edited ? `<small style="opacity:0.6;">(düzenlendi)</small>` : ""}

  ${
    m.reaction
      ? `
        <div class="reaction" style="
          margin-top:4px;
          font-size:16px;
        ">
          👍 ${m.reaction}
        </div>
      `
      : ""
  }
`;

box.appendChild(div);
}
});
}

/* 👤 USERS */
function setOnline() {

  const userRef = ref(db, "rooms/" + roomId + "/users/" + name);

  set(userRef, { name, online: true });

  onDisconnect(userRef).set({ name, online: false });
}

function listenUsers() {

  onValue(ref(db, "rooms/" + roomId + "/users"), (snap) => {

    const data = snap.val();
    const box = document.getElementById("users");

    box.innerHTML = "";

    for (let id in data) {
      const u = data[id];

      box.innerHTML += u.online
        ? "🟢 " + u.name + " "
        : "⚫ " + u.name + " ";
    }
  });
}

/* ✍ TYPING */
function initTyping() {

  const input = document.getElementById("msg");

  input.addEventListener("input", () => {
    setTyping(true);

    setTimeout(() => setTyping(false), 1000);
  });
}

function setTyping(state) {

  set(ref(db, "rooms/" + roomId + "/typing/" + name), {
    typing: state
  });
}

function listenTyping() {

  onValue(ref(db, "rooms/" + roomId + "/typing"), (snap) => {

    const data = snap.val();
    const box = document.getElementById("typing");

    let arr = [];

    for (let id in data) {
      if (data[id].typing && id !== name) {
        arr.push(id);
      }
    }

    box.innerText = arr.length
      ? "✍ " + arr.join(", ") + " yazıyor..."
      : "";
  });
}

/* 😀 EMOJI */
window.toggleEmoji = function () {
  const box = document.getElementById("emojiBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
};

window.addEmoji = function (e) {
  const input = document.getElementById("msg");
  input.value += e;
  input.focus();
};

/* 🧹 CLEANUP */
function cleanupMessages() {

  const msgRef = ref(db, "rooms/" + roomId + "/messages");

  onValue(msgRef, (snap) => {

    const data = snap.val();
    if (!data) return;

    const keys = Object.keys(data);

    if (keys.length <= 100) return;

    const sorted = keys.sort((a, b) => data[a].time - data[b].time);

    const toDelete = sorted.slice(0, keys.length - 100);

    let i = 0;

    function del() {

      if (i >= toDelete.length) return;

      const key = toDelete[i];

      setTimeout(() => {
        set(ref(db, "rooms/" + roomId + "/messages/" + key), null);
        i++;
        del();
      }, 300);
    }

    del();

  }, { onlyOnce: true });
}

/* OPTIONS MENU */
window.showMessageOptions = function (id, msg) {
 

  const menu = document.createElement("div");

  menu.style.position = "fixed";
  menu.style.top = "50%";
  menu.style.left = "50%";
  menu.style.transform = "translate(-50%, -50%)";
  menu.style.background = "#111827";
  menu.style.padding = "10px";
  menu.style.borderRadius = "10px";
  menu.style.zIndex = "9999";

  let options = [];

  if (msg.name === name) {
    options = [
      { t: "✏️ Düzenle", a: () => editMessage(id, msg) },
      { t: "🗑 Sil", a: () => del(id, msg) },
      { t: "❌ Gizle", a: () => hide(id) }
    ];
  } else {
    options = [
      { t: "❌ Gizle", a: () => hide(id) }
    ];
  }
   options.unshift(
  { t: "❤️", a: () => react(id,"❤️") },
  { t: "😂", a: () => react(id,"😂") },
  { t: "🔥", a: () => react(id,"🔥") }
);
  options.forEach(o => {
    const b = document.createElement("button");
    b.innerText = o.t;
    b.style.margin = "5px";
    b.onclick = () => {
      o.a();
      menu.remove();
    };
    menu.appendChild(b);
  });

  document.body.appendChild(menu);

  setTimeout(() => menu.remove(), 4000);
};

/* DELETE */
function del(id, msg) {

  const isOwner = msg.name === name;

  if (isOwner || isAdmin) {
    set(ref(db, "rooms/" + roomId + "/messages/" + id), null);
  } else {
    alert("Yetkin yok");
  }
}
function react(id, emoji){

  const path = ref(
    db,
    "rooms/" + roomId + "/messages/" + id + "/reaction"
  );

  onValue(path, (snap) => {

    const current = snap.val();

    // aynı emojiye tekrar basıldıysa sil
    if(current === emoji){
      set(path, null);
    } else {
      set(path, emoji);
    }

  }, { onlyOnce: true });

}

function editMessage(id, msg){

  const newText = prompt(
    "Mesajı düzenle:",
    msg.text
  );

  if(!newText) return;

  set(
    ref(
      db,
      "rooms/" + roomId + "/messages/" + id + "/text"
    ),
    newText
  );

  set(
    ref(
      db,
      "rooms/" + roomId + "/messages/" + id + "/edited"
    ),
    true
  );

}

/* HIDE */
function hide(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.style.display = "none";
}

function showReplyBar(){

  const bar =
    document.getElementById("replyBar");

  bar.style.display = "block";

  bar.innerHTML = `
    ↩ ${replyMessage.sender}<br>
    ${replyMessage.text}
    <button onclick="cancelReply()">❌</button>
  `;
}

window.cancelReply = function(){

  replyMessage = null;

  document.getElementById("replyBar")
    .style.display = "none";
}



