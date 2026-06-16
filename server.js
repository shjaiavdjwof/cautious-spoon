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
roles.push("Doctor");
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
 phase: "Lobby",
actions: {},
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
room.phase = "Day 1";

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

  socket.on(
    "next-phase",
    roomCode => {

        const room =
            rooms[roomCode];

        if (!room) return;

        if (
            room.host !== socket.id
        ) return;

        if (
            room.phase.startsWith("Day")
        ) {

            const day =
                parseInt(
                    room.phase.split(" ")[1]
                );

            room.phase =
                "Night " + day;

        } else {

            const night =
                parseInt(
                    room.phase.split(" ")[1]
                );

          resolveNight(roomCode);

room.phase =
    "Day " + (night + 1);
        }

        io.to(roomCode).emit(
            "room-update",
            room
        );
    }
);
socket.on(
    "vote",
    ({
        roomCode,
        target
    }) => {

        const room =
            rooms[roomCode];

        if (!room) return;

        const player =
            room.players.find(
                p => p.id === target
            );

        if (!player) return;

        player.dead = true;

        io.to(roomCode).emit(
            "room-update",
            room
        );

        checkWin(roomCode);
    }
);
  socket.on(
    "night-action",
    ({
        roomCode,
        target
    }) => {

        const room =
            rooms[roomCode];

        if (!room) return;

        const player =
            room.players.find(
                p => p.id === socket.id
            );

        if (!player) return;

        room.actions[
            socket.id
        ] = target;

        socket.emit(
            "ability-result",
            "Action submitted."
        );
    }
);
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

function resolveNight(roomCode) {

    const room =
        rooms[roomCode];

    if (!room) return;

    let protectedPlayer =
        null;

    let wolfTarget =
        null;

    room.players.forEach(player => {

        const target =
            room.actions[player.id];

        if (!target) return;

        if (
            player.role === "Doctor"
        ) {

            protectedPlayer =
                target;
        }

        if (
            player.role === "Werewolf"
        ) {

            wolfTarget =
                target;
        }

        if (
            player.role === "Seer"
        ) {

            const investigated =
                room.players.find(
                    p => p.id === target
                );

            if (investigated) {

                io.to(player.id).emit(
                    "ability-result",
                    investigated.name +
                    " is " +
                    investigated.role
                );
            }
        }
    });

    if (
        wolfTarget &&
        wolfTarget !== protectedPlayer
    ) {

        const victim =
            room.players.find(
                p =>
                    p.id === wolfTarget
            );

        if (victim) {

            victim.dead = true;

            io.to(roomCode).emit(
                "chat",
                victim.name +
                " died during the night."
            );
        }
    }

    room.actions = {};

    checkWin(roomCode);
}
function checkWin(roomCode) {

    const room =
        rooms[roomCode];

    if (!room) return;

    const wolves =
        room.players.filter(
            p =>
                !p.dead &&
                p.role === "Werewolf"
        ).length;

    const villagers =
        room.players.filter(
            p =>
                !p.dead &&
                p.role !== "Werewolf"
        ).length;

    if (wolves === 0) {

        io.to(roomCode).emit(
            "chat",
            "🏆 Villagers Win!"
        );
    }

    if (wolves >= villagers) {

        io.to(roomCode).emit(
            "chat",
            "🐺 Werewolves Win!"
        );
    }
}
server.listen(3000, () => {
  console.log("Server running");
});
