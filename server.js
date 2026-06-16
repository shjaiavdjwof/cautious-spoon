const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {};

function assignRoles(players) {

  const roles = [];

  roles.push("Werewolf");
  roles.push("Seer");

  while (roles.length < players.length) {
    roles.push("Villager");
  }

  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  players.forEach((player, index) => {
    player.role = roles[index];
  });
}

io.on("connection", socket => {

  socket.on("join-room", ({ roomCode, playerName }) => {

    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        host: socket.id,
        started: false,
        players: []
      };
    }

    rooms[roomCode].players.push({
      id: socket.id,
      name: playerName
    });

    socket.join(roomCode);

    io.to(roomCode).emit(
      "room-update",
      rooms[roomCode]
    );

    socket.emit(
      "host-status",
      rooms[roomCode].host === socket.id
    );
  });

  socket.on("start-game", roomCode => {

    const room = rooms[roomCode];

    if (!room) return;

    if (room.host !== socket.id) return;

    assignRoles(room.players);

    room.started = true;

    room.players.forEach(player => {

      io.to(player.id).emit(
        "role",
        player.role
      );
    });

    io.to(roomCode).emit(
      "game-started"
    );
  });

  socket.on("chat", ({ roomCode, message }) => {

    const room = rooms[roomCode];

    if (!room) return;

    const player =
      room.players.find(
        p => p.id === socket.id
      );

    if (!player) return;

    io.to(roomCode).emit(
      "chat",
      `${player.name}: ${message}`
    );
  });

  socket.on("disconnect", () => {

    for (const roomCode in rooms) {

      rooms[roomCode].players =
        rooms[roomCode].players.filter(
          p => p.id !== socket.id
        );

      io.to(roomCode).emit(
        "room-update",
        rooms[roomCode]
      );
    }
  });
});

server.listen(3000, () => {
  console.log("Server running");
});
