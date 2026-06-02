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

const firebaseConfig = {
  apiKey: "AIzaSyBZNpGv5Yk54JFB_5U6Qr6iNx2PaPrhIFo",
  authDomain: "party-hub-90183.firebaseapp.com",
  databaseURL: "https://party-hub-90183-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "party-hub-90183"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let name = "";
let roomId = "";
let replyMessage = null;
let lastMessageTime = 0;

const adminUsers = ["ttkesma"];
let isAdmin = false;

/* ---------------- JOIN ---------------- */
window.joinRoom = function () {

  name = document.getElementById("name").value.trim();
  roomId = document.getElementById("roomId").value.trim();

  if (!name || !roomId) return alert("Eksik");

  isAdmin = adminUsers.includes(name);

  document.getElementById("login").style.display = "none";
  document.getElementById("chatApp").style.display = "flex";

  document.getElementById("roomText").innerText = roomId;

  setOnline();
  listenMessages();
  listenUsers();
  listenTyping();

  if (isAdmin) showAdminPanel();
};

/* ---------------- SEND ---------------- */
window.sendMessage = function () {

  const msg = document.getElementById("msg").value;
  if (!msg) return;

const now = Date.now();

if(now - lastMessageTime < 1500){
  alert("Çok hızlı mesaj gönderiyorsun");
  return;
}

if(msg.length > 500){
  alert("Mesaj en fazla 500 karakter olabilir");
  return;
}

lastMessageTime = now;

  push(ref(db, `rooms/${roomId}/messages`), {
    name,
    text: msg,
    time: Date.now(),
    reply: replyMessage
  });

  document.getElementById("msg").value = "";
  replyMessage = null;
};

/* ---------------- MESSAGES ---------------- */
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
      div.setAttribute("data-id", id);

      let startX = 0;
      let pressTimer;

      /* LONG PRESS */
      div.addEventListener("touchstart", (e) => {

        startX = e.touches[0].clientX;

        pressTimer = setTimeout(() => {
          showMsgMenu(id, m);
        }, 500);

      });

      div.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
      });

      /* SWIPE REPLY */
      div.addEventListener("touchmove", (e) => {

        let diff = e.touches[0].clientX - startX;

        if (diff > 80) {
          replyMsg(id, m);
        }
      });

      div.innerHTML = `
  
      <b>${m.name}</b><br>
      ${m.text}

      ${m.reaction ? `
        <div class="reaction">
          ${m.reaction}
        </div>
      ` : ""}

  ${(m.name === name || isAdmin) ? `
    <button onclick="deleteMsg('${id}')">🗑</button>
  ` : ""}

`;
        ${m.edited ? "<br><small>(düzenlendi)</small>" : ""}
      `;

      box.appendChild(div);
    }

    box.scrollTop = box.scrollHeight;
  });
}

/* ---------------- USERS ---------------- */
function setOnline() {
  const r = ref(db, `rooms/${roomId}/users/${name}`);
  set(r, { name, online: true });
  onDisconnect(r).set({ name, online: false });
}

function listenUsers() {
  onValue(ref(db, `rooms/${roomId}/users`), (snap) => {

    const box = document.getElementById("users");
    box.innerHTML = "";

    const data = snap.val();
    if (!data) return;

    for (let u in data) {
      box.innerHTML += data[u].online ? "🟢 " + u + " " : "⚫ " + u + " ";
    }
  });
}

/* ---------------- TYPING ---------------- */
function listenTyping() {

  const input = document.getElementById("msg");

  input.addEventListener("input", () => {

    set(ref(db, `rooms/${roomId}/typing/${name}`), { typing: true });

    setTimeout(() => {
      set(ref(db, `rooms/${roomId}/typing/${name}`), { typing: false });
    }, 1000);
  });
}

/* ---------------- REPLY ---------------- */
  window.replyMsg = function(id,m){

  replyMessage = {
    sender:m.name,
    text:m.text
  };

  document.getElementById("replyBar").innerHTML = `
    <span>
      ↩ ${m.name}: ${m.text}
    </span>

    <button onclick="cancelReply()">
      ❌
    </button>
  `;
    window.cancelReply = function(){

  replyMessage = null;

  document.getElementById("replyBar").innerHTML = "";
};
};

/* ---------------- DELETE ---------------- */
window.deleteMsg = function(id){

  get(ref(db, `rooms/${roomId}/messages/${id}`)).then(snap => {

    const m = snap.val();

    if(!m) return;

    // sadece mesaj sahibi veya admin silebilir
    if(m.name !== name && !isAdmin){
      alert("Bu mesajı silemezsin");
      return;
    }

    set(ref(db, `rooms/${roomId}/messages/${id}`), null);
  });
};


/* ---------------- HIDE ---------------- */
window.hideMsg = function (id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.style.display = "none";
};

window.reactMsg = function(id,emoji){

  const reactionRef =
    ref(db,`rooms/${roomId}/messages/${id}/reaction`);

  get(reactionRef).then(s=>{

    const current = s.val();

    if(current === emoji){
      set(reactionRef,null);
    }else{
      set(reactionRef,emoji);
    }

  });

};

/* ---------------- SWIPE MENU ---------------- */
window.showMsgMenu = function (id, m) {

  const menu = document.createElement("div");

  menu.style = `
    position:fixed;
    bottom:0;
    left:0;
    width:100%;
    background:#111827;
    padding:10px;
    display:flex;
    gap:10px;
    z-index:9999;
  `;

  menu.innerHTML = `
  <button onclick="replyMsg('${id}',msgObj)">↩</button>
  <button onclick="hideMsg('${id}')">👁</button>

  <button onclick="reactMsg('${id}','❤️')">❤️</button>
  <button onclick="reactMsg('${id}','😂')">😂</button>
  <button onclick="reactMsg('${id}','🔥')">🔥</button>

${isAdmin ? `
<button onclick="deleteMsg('${id}')">🗑</button>
` : ""}
`;

  document.body.appendChild(menu);

  setTimeout(() => menu.remove(), 3000);
};

/* ---------------- ADMIN PANEL ---------------- */
function showAdminPanel() {

  let panel = document.getElementById("adminPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "adminPanel";

    panel.style = `
      position:fixed;
      right:0;
      top:0;
      width:280px;
      height:100vh;
      background:#111827;
      color:white;
      overflow:auto;
      padding:10px;
      z-index:9999;
    `;

    document.body.appendChild(panel);
  }

  onValue(ref(db, "rooms"), (snap) => {

    const data = snap.val();
    panel.innerHTML = "<h3>ADMIN</h3>";

    if (!data) return;

    for (let room in data) {

      const messages = data[room].messages;

if(messages){

  for(let id in messages){

    const m = messages[id];

    panel.innerHTML += `
      <div style="
      border:1px solid #333;
      margin:5px;
      padding:5px;
      ">
        <b>${m.name}</b><br>
        ${m.text}<br>

        <button onclick="
        adminDelete('${room}','${id}')
        ">
        🗑
        </button>
      </div>
    `;
  }
}

      panel.innerHTML += `
        <h4>${room}</h4>
        <button onclick="closeRoom('${room}')">❌ Kapat</button>
        <hr>
      `;
    }
  });
}

/* ---------------- ROOM CLOSE ---------------- */
window.closeRoom = function (room) {
  if (!confirm("Oda kapatılsın mı?")) return;
  set(ref(db, `rooms/${room}`), null);
};
window.adminDelete = function(room,id){

  set(
    ref(db,`rooms/${room}/messages/${id}`),
    null
  );

};

