import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
apiKey: "AIzaSyBZNpGv5Yk54JFB_5U6Qr6iNx2PaPrhIFo",
  authDomain:  "party-hub-90183.firebaseapp.com",
  databaseURL: "https://party-hub-90183-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "party-hub-90183",
  storageBucket:  "party-hub-90183.firebasestorage.app",
  messagingSenderId: "230836884321",
  appId: "1:230836884321:web:81b3eb36d650c18d0d6b20"
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

  localStorage.setItem("name", name);

  document.getElementById("login").style.display = "none";
  document.getElementById("chatApp").style.display = "block";

  document.getElementById("roomText").innerText = "🏠 " + roomId;

  setOnline();
  listenMessages();
  listenUsers();
};

/* 💬 SEND MESSAGE */
window.sendMessage = function () {

  const msg = document.getElementById("msg").value;
  if (!msg) return;

  push(ref(db, "rooms/" + roomId + "/messages"), {
    name,
    text: msg,
    time: Date.now()
  });

  document.getElementById("msg").value = "";
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
      div.innerHTML = `<b>${m.name}:</b> ${m.text}`;

      box.appendChild(div);
    }

    box.scrollTop = box.scrollHeight;
  });
}

/* 👥 ONLINE SYSTEM */
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
      div.innerHTML = u.online ? "🟢 " + u.name : "⚫ " + u.name;

      box.appendChild(div);
    }
  });
}