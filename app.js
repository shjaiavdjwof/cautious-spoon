const socket = io("https://miniwolves-server.onrender.com");
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

    const voteSelect =
        document.getElementById("voteTarget");

    const actionSelect =
        document.getElementById("actionTarget");

    voteSelect.innerHTML = "";
    actionSelect.innerHTML = "";

    room.players.forEach(player => {

        const div =
            document.createElement("div");

        div.textContent =
            player.name +
            (player.dead ? " ☠" : "");

        players.appendChild(div);

        if (!player.dead) {

            const voteOption =
                document.createElement("option");

            voteOption.value =
                player.id;

            voteOption.textContent =
                player.name;

            voteSelect.appendChild(
                voteOption
            );

            const actionOption =
                document.createElement("option");

            actionOption.value =
                player.id;

            actionOption.textContent =
                player.name;

            actionSelect.appendChild(
                actionOption
            );
        }
    });

    document
        .getElementById("phase")
        .textContent =
        room.phase || "Lobby";
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
function nextPhase() {

    socket.emit(
        "next-phase",
        roomCode
    );
}

function votePlayer() {

    const target =
        document.getElementById(
            "voteTarget"
        ).value;

    socket.emit(
        "vote",
        {
            roomCode,
            target
        }  );
  function performAction() {

    const target =
        document.getElementById(
            "actionTarget"
        ).value;

    socket.emit(
        "night-action",
        {
            roomCode,
            target
        }
    );
}

socket.on(
    "ability-result",
    result => {

        document
            .getElementById(
                "abilityResult"
            )
            .textContent =
            result;
    }
);
}
