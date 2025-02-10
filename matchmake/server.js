const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let queue = [];

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "joinQueue") {
            queue.push(ws);
            matchPlayers();
        }

        if (data.type === "acceptMatch") {
            ws.accepted = true;
            checkMatchStatus();
        }
    });

    ws.on("close", () => {
        queue = queue.filter(player => player !== ws);
    });
});

function matchPlayers() {
    if (queue.length >= 2) {
        const player1 = queue.shift();
        const player2 = queue.shift();

        player1.matching = player2;
        player2.matching = player1;

        player1.send(JSON.stringify({ type: "matchFound" }));
        player2.send(JSON.stringify({ type: "matchFound" }));

        setTimeout(() => {
            if (!player1.accepted || !player2.accepted) {
                if (player1.accepted) queue.push(player1);
                if (player2.accepted) queue.push(player2);
            } else {
                player1.send(JSON.stringify({ type: "redirect" }));
                player2.send(JSON.stringify({ type: "redirect" }));
            }
        }, 10000);
    }
}

function checkMatchStatus() {
    queue.forEach(player => {
        if (player.matching?.accepted) {
            player.send(JSON.stringify({ type: "redirect" }));
        }
    });
}

app.use(express.static("public"));

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
