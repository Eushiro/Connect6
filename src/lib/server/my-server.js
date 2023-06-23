import { handler } from '../../../build/handler.js';
import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import cors from 'cors'

const Stone = {
  None: 0,
  Black: 1,
  White: 2
};

const app = express()
app.use(cors());
const wss = new WebSocketServer({ port: 8080 });


let gridSize = 19;
let grid = [];
for (let i = 0; i < gridSize; i++) {
  let arr = [];
  for (let j = 0; j < gridSize; j++) {
    arr.push(Stone.None);
  }
  grid.push(arr);
}

let turn = Stone.Black;
let stonesPlaced = 0;
let stoneLimit = 1;
let win = false;

let movesThisTurn = [];
function undoTurn() {
  for (let i = 0; i < movesThisTurn.length; i++) {
    grid[movesThisTurn[i][0]][movesThisTurn[i][1]] = Stone.None;
  }
  stonesPlaced = 0;
  movesThisTurn = [];
}

function resetGame() {
  for (let i = 0; i < gridSize; i++) {
    let arr = [];
    for (let j = 0; j < gridSize; j++) {
      arr.push(Stone.None);
    }
    grid[i] = arr;
  }
  turn = Stone.Black;
  stonesPlaced = 0;
  stoneLimit = 1;
  movesThisTurn = [];
  win = false;
}

function confirm() {
  if (stonesPlaced !== stoneLimit) {
    return;
  }

  if (stonesPlaced === stoneLimit && turn === Stone.Black) {
    turn = Stone.White;
    stonesPlaced = 0;
    movesThisTurn = [];
  }

  stoneLimit = 2;

  if (stonesPlaced === stoneLimit && turn === Stone.White) {
    turn = Stone.Black;
    stonesPlaced = 0;
    movesThisTurn = [];
  }
}

function checkWin(row, col) {
  const directions = [
    [
      [0, 1],
      [0, -1]
    ],
    [
      [1, 0],
      [-1, 0]
    ],
    [
      [1, 1],
      [-1, -1]
    ],
    [
      [-1, 1],
      [1, -1]
    ]
  ];

  for (let i = 0; i < directions.length; i++) {
    let dx1 = directions[i][0][0],
      dy1 = directions[i][0][1];
    let dx2 = directions[i][1][0],
      dy2 = directions[i][1][1];
    let total = 1;

    // Check in the first direction
    let mult = 1;
    while (
      0 <= row + dx1 * mult &&
      row + dx1 * mult < gridSize &&
      0 <= col + dy1 * mult &&
      col + dy1 * mult < gridSize &&
      grid[row + dx1 * mult][col + dy1 * mult] === turn
    ) {
      total += 1;
      mult += 1;
    }

    // Check in the second direction
    mult = 1;
    while (
      0 <= row + dx2 * mult &&
      row + dx2 * mult < gridSize &&
      0 <= col + dy2 * mult &&
      col + dy2 * mult < gridSize &&
      grid[row + dx2 * mult][col + dy2 * mult] === turn
    ) {
      total += 1;
      mult += 1;
    }

    // Check if we have a win
    if (total >= 6) {
      return true;
    }
  }
  return false;
}

// WebSocket connection
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`);
  });

  broadcastGameState();
});

app.get('/confirm', (req, res) => {
  confirm();
  broadcastGameState();
  res.end();
});

app.get('/undoTurn', (req, res) => {
  undoTurn();
  broadcastGameState();
  res.end();
});

app.get('/resetGame', (req, res) => {
  resetGame();
  broadcastGameState();
  res.end();
});

app.get('/placeStone', (req, res) => {
  const i = parseInt(req.query.i);
  const j = parseInt(req.query.j);
  if (grid[i][j] !== Stone.None || stonesPlaced === stoneLimit) {
    res.end();
    return;
  }
  grid[i][j] = turn;
  movesThisTurn.push([i, j])
  stonesPlaced++;
  win = checkWin(i, j)
  broadcastGameState();
  res.end();
});

function broadcastGameState() {
  const gameState = {
    grid,
    turn,
    stonesPlaced,
    stoneLimit,
    win
  };
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(gameState));
    }
  });
}

app.use(handler);

const server = app.listen(3000, () => {
  console.log('listening on port 3000');
});