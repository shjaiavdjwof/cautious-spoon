const socket = io("YOUR_RENDER_URL_HERE");

let roomCode = "";

function joinRoom() {

  const playerName =
    document.getElementById("name").value;

  roomCode =
    document.getElementById("room").value;

  socket.emit(
    "join-room",
    {
      roomCode,
      playerName
    }
  );
}

socket.on("room-update", room => {

  const players =
    document.getElementById("players");

  players.innerHTML = "";

  room.players.forEach(player => {

    const div =
      document.createElement("div");

    div.textContent =
      player.name;

    players.appendChild(div);
  });
});

socket.on("host-status", isHost => {

  if (isHost) {

    document
      .getElementById("hostControls")
      .style.display = "block";
  }
});

function startGame() {

  socket.emit(
    "start-game",
    roomCode
  );
}

socket.on("role", role => {

  document
    .getElementById("role")
    .textContent =
    "Your role: " + role;
});

socket.on("game-started", () => {

  document
    .getElementById("status")
    .textContent =
    "Game Started";
});

function sendMessage() {

  const input =
    document.getElementById("message");

  socket.emit(
    "chat",
    {
      roomCode,
      message: input.value
    }
  );

  input.value = "";
}

socket.on("chat", msg => {

  document
    .getElementById("chat")
    .innerHTML +=
    `<div>${msg}</div>`;
});
