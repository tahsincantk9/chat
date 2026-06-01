window.joinRoom = function () {

  const name = document.getElementById("name").value.trim();
  const roomId = document.getElementById("roomId").value.trim();

  if(!name) return alert("İsim gir");
  if(!roomId) return alert("Oda gir");

  localStorage.setItem("name", name);
  localStorage.setItem("roomId", roomId);

  window.location.href = "chat.html";
};
