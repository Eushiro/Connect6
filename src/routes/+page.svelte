<script lang="ts">
	import { Stone } from './stone.svelte';
	import Square from './square.svelte';
	import { onMount, onDestroy } from 'svelte';

	// Initialize grid to empty
	let gridSize = 19;
	let grid: Array<Array<number>> = Array(gridSize)
		.fill()
		.map(() => Array(gridSize).fill(Stone.None));

	let turn = Stone.Black;
	let win = false;
	let stonesPlaced = 0;
	let stoneLimit = 1;
	// let backendUrl = 'https://connect6-3.onrender.com/';
	let backendUrl = 'http://localhost:3000/';

	let socket: WebSocket;
	let connected = false;
	let movesThisTurn: Array<Array<number>> = [];
	let previousStates: Array<any> = [];
	let futureStates: Array<any>[];

	if (typeof window !== 'undefined') {
		// Create WebSocket connection
		// socket = new WebSocket('wss://connect6-3.onrender.com');
		socket = new WebSocket('ws://localhost:3000');

		// Connection opened
		socket.addEventListener('open', (event) => {
			socket.send('Hello Server!');
			connected = true;
		});

		socket.addEventListener('close', (event) => {
			socket.send('Goodbye Server!');
			connected = false;
		});

		// Listen for messages
		socket.addEventListener('message', (event) => {
			console.log('Message from server ', event.data);
			const gameState = JSON.parse(event.data);
			grid = gameState.grid;
			turn = gameState.turn;
			stoneLimit = gameState.stoneLimit;
			stonesPlaced = gameState.stonesPlaced;
			win = gameState.win;
			movesThisTurn = gameState.movesThisTurn;
			previousStates = gameState.previousStates;
			futureStates = gameState.futureStates;
		});
	}
	async function undoTurn() {
		movesThisTurn.forEach((move) => {
			grid[move[0]][move[1]] = Stone.None;
		});
		stonesPlaced = 0;
		movesThisTurn = [];
		await fetch(backendUrl + 'undoTurn');
	}

	async function resetGame() {
		grid = Array(gridSize)
			.fill()
			.map(() => Array(gridSize).fill(Stone.None));
		await fetch(backendUrl + 'resetGame');
	}

	async function confirm() {
		await fetch(backendUrl + 'confirm');
	}

	async function onSquareClick(i: number, j: number) {
		if (grid[i][j] !== Stone.None || stonesPlaced === stoneLimit) {
			return;
		}
		grid[i][j] = turn;
		stonesPlaced++;
		movesThisTurn.push([i, j]);
		await fetch(backendUrl + `placeStone?i=${i}&j=${j}`);
	}

	async function undoMove() {
		if (previousStates.length === 0) {
			return;
		}

		// Get the last move
		const lastMove = previousStates.pop();

		// Revert the last move
		grid[lastMove.i][lastMove.j] = lastMove.stone; // old stone
		stonesPlaced = lastMove.stonesPlaced;
		turn = lastMove.turn;
		stoneLimit = lastMove.stoneLimit;
		win = lastMove.win;

		// Update movesThisTurn, remove the last move of the current turn
		if (movesThisTurn.length > 0) {
			movesThisTurn.pop();
		}

		// Push last move to futureStates for redo
		futureStates.push(lastMove);
		await fetch(backendUrl + 'undoMove');
	}

	async function redoMove() {
		if (futureStates.length === 0) {
			return;
		}

		// Get the last undone move
		const undoneMove: any = futureStates.pop();

		// Reapply the move
		grid[undoneMove.i][undoneMove.j] = undoneMove.turn; // turn from the undone move
		stonesPlaced = undoneMove.stonesPlaced + 1;
		turn = undoneMove.turn;
		stoneLimit = undoneMove.stoneLimit;
		win = undoneMove.win; // You can re-check for a win here if needed

		// Push the undone move back to previousStates for undo
		previousStates.push(undoneMove);
		await fetch(backendUrl + 'redoMove');
	}

	// Listen for key presses
	onMount(() => {
		window.addEventListener('keypress', (event) => {
			switch (event.key) {
				case 'c':
					confirm();
					break;
				case 'Enter':
					confirm();
					break;
				case 'r':
					resetGame();
					break;
				case 'u':
					undoTurn();
					break;
				case 'd':
					undoMove();
					break;
				case 'f':
					redoMove();
					break;
				default:
					break;
			}
		});
	});

	onDestroy(() => {
		socket?.close();
	});
</script>

<div class="screen">
	<div>
		<button class="controls undo" on:click={undoTurn}>Undo Turn (u)</button>
		<button class="controls confirm" on:click={confirm}>Confirm (c)</button>
		<div class="break" />
		<button class="controls undo" on:click={undoMove}>Undo Move (d)</button>
		<button class="controls undo" on:click={redoMove}>Redo Move (f)</button>
		{#if turn === Stone.Black}
			<p>It's black's turn</p>
		{:else}
			<p>It's white's turn</p>
		{/if}
		{#if win}
			{#if turn === Stone.Black}
				<p class="win">Black Wins!</p>
			{:else}
				<p class="win">White Wins!</p>
			{/if}
		{/if}
		{#if !connected}
			<p class="disconnected">Connecting to server...</p>
		{:else}
			<p class="connected">Connected to server</p>
		{/if}
	</div>
	<div class="break" />
	<div class="grid">
		{#each grid as line, i}
			{#each line as square, j}
				<Square
					stone={square}
					{i}
					{j}
					onClick={() => onSquareClick(i, j)}
					newlyPlaced={movesThisTurn.some((v) => {
						return v[0] == i && v[1] == j;
					})}
				/>
			{/each}
		{/each}
	</div>
	<button class="controls reset" on:click={resetGame}>Reset Game (r) </button>
</div>

<style>
	.screen {
		display: flex;
		height: 95vh;
		width: 95vw;
		justify-content: center;
	}

	.controls {
		height: 3vh;
		width: 6vw;
	}
	p {
		font-family: Arial, Helvetica, sans-serif;
		font-size: larger;
	}

	.disconnected {
		color: lightcoral;
	}

	.connected {
		color: lightgreen;
	}
	.win {
		font-size: xx-large;
	}
	.grid {
		width: min(93vw, 93vh);
		height: min(93vw, 93vh);
		display: grid;
		grid-template-columns: repeat(19, 1fr);
		grid-template-rows: repeat(19, 1fr);
	}

	/* CSS */
	.controls {
		align-items: center;
		background-clip: padding-box;
		background-color: #405cf5;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		box-shadow: rgba(0, 0, 0, 0.02) 0 1px 3px 0;
		box-sizing: border-box;
		color: #fff;
		cursor: pointer;
		display: inline-flex;
		font-family: -apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;
		font-size: 16px;
		font-weight: 500;
		justify-content: center;
		line-height: 1.25;
		margin: 8px;
		min-height: 3rem;
		padding: calc(0.875rem - 1px) calc(1.5rem - 1px);
		position: relative;
		text-decoration: none;
		transition: all 250ms;
		user-select: none;
		-webkit-user-select: none;
		touch-action: manipulation;
		vertical-align: baseline;
		width: 175px;
	}

	.controls:hover,
	.controls:focus {
		background-color: #7e8bf3;
		box-shadow: rgba(0, 0, 0, 0.1) 0 4px 12px;
	}

	.controls:hover {
		transform: translateY(-1px);
	}

	.controls:active {
		background-color: #7e8bf3;
		box-shadow: rgba(0, 0, 0, 0.06) 0 2px 4px;
		transform: translateY(0);
	}

	.break-column {
		flex-basis: 100%;
		width: 0;
	}

	.reset {
		margin: 8px;
	}

	.undo {
		margin: 4px 4px 8px 0px;
	}

	.confirm {
		margin: 4px 8px 8px 0px;
	}
</style>
