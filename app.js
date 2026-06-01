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
  authDomain:  "party-hub-90183.firebaseapp.com",
  databaseURL: "https://party-hub-90183-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "party-hub-90183"
  

};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let name = "";
let roomId = "";
let replyMessage = null;

const adminUsers = ["admin"];
let isAdmin = false;

/* JOIN */
window.joinRoom = function () {

name = document.getElementById("name").value.trim();
roomId = document.getElementById("roomId").value.trim();

if(!name || !roomId) return alert("Eksik");

isAdmin = adminUsers.includes(name);

document.getElementById("login").style.display="none";
document.getElementById("chatApp").style.display="block";

document.getElementById("roomText").innerText = roomId;

setOnline();
listenMessages();
listenUsers();
listenTyping();
};

/* SEND */
window.sendMessage = function () {

const msg = document.getElementById("msg").value;
if(!msg) return;

push(ref(db, `rooms/${roomId}/messages`), {
name,
text: msg,
time: Date.now(),
reply: replyMessage
});

document.getElementById("msg").value="";
replyMessage=null;
};

/* MESSAGES */
function listenMessages() {

onValue(ref(db, `rooms/${roomId}/messages`), (snap)=>{

const box=document.getElementById("chatBox");
box.innerHTML="";

const data=snap.val();
if(!data) return;

for(let id in data){

const m=data[id];

const div=document.createElement("div");
div.className="message "+(m.name===name?"right":"left");

div.addEventListener("touchend", () => clearTimeout(pressTimer));

div.setAttribute("data-id",id);

let startX = 0;
let pressTimer;

// LONG PRESS
div.addEventListener("touchstart", () => {
  pressTimer = setTimeout(() => {
    showMsgMenu(id, m);
  }, 500);
});

// LONG PRESS CANCEL
div.addEventListener("touchend", () => {
  clearTimeout(pressTimer);
});

// SWIPE RIGHT REPLY
div.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

div.addEventListener("touchmove", (e) => {
  let diff = e.touches[0].clientX - startX;

  if (diff > 80) {
    replyMsg(id);
  }
});

div.innerHTML=`

${m.reply?`↩ ${m.reply.sender}: ${m.reply.text}<br>`:""}
<b>${m.name}</b><br>
${m.text}

<br>

${isAdmin?`
<button onclick="deleteMsg('${id}')">🗑</button>
<button onclick="hideMsg('${id}')">👁</button>
<button onclick="kickUser('${m.name}')">🚫</button>
`: ""}

<button onclick="replyMsg('${id}')">↩</button>
<button onclick="editMsg('${id}')">✏</button>

`;

box.appendChild(div);
}

});
}

/* USERS */
function setOnline(){
set(ref(db,`rooms/${roomId}/users/${name}`),{name,online:true});
onDisconnect(ref(db,`rooms/${roomId}/users/${name}`)).set({name,online:false});
}

function listenUsers(){
onValue(ref(db,`rooms/${roomId}/users`),(snap)=>{
const box=document.getElementById("users");
box.innerHTML="";
const data=snap.val();
if(!data) return;

for(let u in data){
box.innerHTML += data[u].online?"🟢 "+u+" ":"⚫ "+u+" ";
}
});
}

/* TYPING */
function listenTyping(){
const input=document.getElementById("msg");

input.addEventListener("input",()=>{
set(ref(db,`rooms/${roomId}/typing/${name}`),{typing:true});

setTimeout(()=>{
set(ref(db,`rooms/${roomId}/typing/${name}`),{typing:false});
},1000);

});
}

/* REPLY */
window.replyMsg = function(id) {

  get(ref(db, `rooms/${roomId}/messages/${id}`)).then(snap => {

    const m = snap.val();

    replyMessage = {
      sender: m.name,
      text: m.text
    };

    document.getElementById("replyBar").innerText =
      "↩ " + m.name + ": " + m.text;
  });
};

/* EDIT */
window.editMsg = function(id) {

  get(ref(db, `rooms/${roomId}/messages/${id}`)).then(snap => {

    const m = snap.val();

    if (!canEdit(m)) return alert("Yetkin yok");

    const newText = prompt("Edit:");

    if (!newText) return;

    set(ref(db, `rooms/${roomId}/messages/${id}/text`), newText);
    set(ref(db, `rooms/${roomId}/messages/${id}/edited`), true);
  });
};

/* DELETE */
window.deleteMsg = function(id) {

  get(ref(db, `rooms/${roomId}/messages/${id}`)).then(snap => {

    const m = snap.val();

    if (!canEdit(m)) return alert("Yetkin yok");

    set(ref(db, `rooms/${roomId}/messages/${id}`), null);
  });
};

/* HIDE */
window.hideMsg=function(id){
const el=document.querySelector(`[data-id="${id}"]`);
if(el) el.style.display="none";
};

/* KICK */
window.kickUser=function(user){
set(ref(db,`rooms/${roomId}/users/${user}`),null);
};

function canEdit(m) {
  return m.name === name || isAdmin;
}

window.showMsgMenu = function(id, m, el) {

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
    <button onclick="deleteMsg('${id}')">🗑 Sil</button>
    <button onclick="hideMsg('${id}')">👁 Gizle</button>
    <button onclick="replyMsg('${id}')">↩ Yanıtla</button>
  `;

  document.body.appendChild(menu);

  setTimeout(() => menu.remove(), 4000);
};


