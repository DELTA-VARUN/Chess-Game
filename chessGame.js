const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  console.log(board);
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareindex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.column = squareindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black" //   piece.type
        );
        pieceElement.innerText = getPieceUnicode(square); ///this one has empty string at 1:26:38
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareindex };
            e.dataTransfer.setData("text/plain", ""); ////to makesure that it runs in cross platforms
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });
        squareElement.appendChild(pieceElement);
      } //if anything goes wrong check from above till here

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  // Convert source and target coordinates into chess notation
  const sourceSquare = `${String.fromCharCode(97 + source.col)}${
    8 - source.row
  }`;
  const targetSquare = `${String.fromCharCode(97 + target.col)}${
    8 - target.row
  }`;

  // Create the move object
  const move = {
    from: sourceSquare,
    to: targetSquare,
    //promotion: "q", // Assuming promotion to queen for now
  };

  // Emit the move to the backend
  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♟", // BLACK CHESS PAWN
    r: "♜", // BLACK CHESS ROOK
    n: "♞", // BLACK CHESS KNIGHT
    b: "♝", // BLACK CHESS BISHOP
    q: "♛", // BLACK CHESS QUEEN
    k: "♚", // BLACK CHESS KING
    P: "♙", // WHITE CHESS PAWN
    R: "♖", // WHITE CHESS ROOK
    N: "♘", // WHITE CHESS KNIGHT
    B: "♗", // WHITE CHESS BISHOP
    Q: "♕", // WHITE CHESS QUEEN
    K: "♔", // WHITE CHESS KING
  };
  return unicodePieces[piece.type] || "";
};
socket.on("playerRole", function (role) {
  //at 14602 at 95
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});
socket.on("boardState", function (fen) {
  //the new fen equation formed will be loaded freshly by chess.load and then the board is rendered with new equations
  chess.load(fen);
  renderBoard();
});
socket.on("move", function (move) {
  //jo bhi move hua hoga use hum receive karke chaladenge, aur boardRender kardenge
  chess.move(move);
  renderBoard();
});
renderBoard();
