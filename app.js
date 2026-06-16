const socket = io("http://localhost:3000");

let roomCode = "";
let playerName = "";

function joinRoom() {
    playerName = document.getElementById("name").value;
    roomCode = document.getElementById("room").value;

    socket.emit("join-room", {
        roomCode,
        playerName
    });
}

socket.on("room-update", room => {

    const players =
    document.getElementById("players");

    players.innerHTML = "";

    room.players.forEach(player => {

        const div =
        document.createElement("div");

        div.textContent = player.name;

        players.appendChild(div);
    });
});

socket.on("role", role => {

    document.getElementById("role")
    .textContent =
    "Your role: " + role;
});

function sendMessage() {

    const input =
    document.getElementById("message");

    socket.emit("chat", {
        roomCode,
        message: input.value
    });

    input.value = "";
}

socket.on("chat", msg => {

    const chat =
    document.getElementById("chat");

    chat.innerHTML +=
    `<div>${msg}</div>`;
});
