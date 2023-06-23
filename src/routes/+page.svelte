<script lang="ts">
	import { Stone } from './stone.svelte';
	import Square from './square.svelte';

	// Initialize grid to empty
	let gridSize = 19;
	let grid: Array<Array<number>> = [];
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

	let socket: WebSocket;
	let websocketPort = '8080';

	if (typeof window !== 'undefined') {
		// Create WebSocket connection
		socket = new WebSocket('ws://localhost:' + websocketPort);

		// Connection opened
		socket.addEventListener('open', (event) => {
			socket.send('Hello Server!');
		});

		// Listen for messages
		socket.addEventListener('message', (event) => {
			console.log('Message from server ', event.data);
			const gameState = JSON.parse(event.data);
			grid = gameState.grid;
			turn = gameState.turn;
			stonesPlaced = gameState.stonesPlaced;
			stoneLimit = gameState.stoneLimit;
			win = gameState.win;
		});
	}
	async function undoTurn() {
		await fetch('http://localhost:3000/undoTurn');
	}

	async function resetGame() {
		await fetch('http://localhost:3000/resetGame');
	}

	async function confirm() {
		await fetch('http://localhost:3000/confirm');
	}

	async function onSquareClick(i: number, j: number) {
		await fetch(`http://localhost:3000/placeStone?i=${i}&j=${j}`);
	}
</script>

<div class="screen">
	<div>
		<button class="controls" on:click={undoTurn}>Undo Turn</button>
		<button class="controls" on:click={confirm}>Confirm</button>
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
	</div>
	<div class="grid">
		{#each grid as line, i}
			{#each line as square, j}
				<Square stone={square} {i} {j} onClick={() => onSquareClick(i, j)} />
			{/each}
		{/each}
	</div>
	<button class="controls reset" on:click={resetGame}>Reset Game </button>
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
</style>
