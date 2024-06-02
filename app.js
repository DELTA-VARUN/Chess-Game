const express = require("express");
const socket = require("socket.io");

const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express(); //Routing and middleware setup are done by express ////app has an instance of express
const server = http.createServer(app);
const io = socket(server); //socket is used to connect in real time

const chess = new Chess(); //now all the rules of chess is stored in chess variable
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
// app.use(
//   express.static(__dirname + "/public", {
//     setHeaders: function (res, path, stat) {
//       if (path.endsWith(".js")) {
//         res.set("content-type", "application/javascript");
//       }
//     },
//   })
// ); //by this we files from public folder

app.get("/public/js/chessGame.js", (req, res) => {
  res.type("text/javascript"); // Set the correct MIME type
  res.sendFile(path.join(__dirname, "public/js/chessGame.js"));
});

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return; //uniquesocket.on("move", (move) => {} isse  move event record hoga
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move); //idhar move event(jo bhi pawn move hua hai wo) valid hai ki nahi  evaluate hoga

      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: ", move); ////consoling in browser
        uniquesocket.emit("invalidMove", move); ////informing the player that the move is invalid
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("Invalid move: ", move); ////const result = chess.move(move);if this line fails then catch is executed///////timestamp:1:06:06
    }
  });
});

server.listen(3000, function () {
  console.log("Listening");
});
//3 types of server method
//server sends the message to the sender itself also, so only the sender can be able to know that the message is sent to  other/s
//server sends the message to only particular person
//server send the message to all except sender , this is called broadcasting. Eg:When you are typing in whatsapp, it shows typing to others except the typer
