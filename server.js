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

io.on("connection", (socket) => {

    console.log("Player connected");

    socket.on("join-room", ({ roomCode, playerName }) => {

        if (!rooms[roomCode]) {
            rooms[roomCode] = {
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

        console.log(playerName + " joined " + roomCode);
    });

    socket.on("chat", ({ roomCode, message }) => {

        const player =
            rooms[roomCode]?.players.find(
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

        console.log("Player disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
