<script lang="ts">
	import { Stone } from './stone.svelte';
	import Square from './square.svelte';
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';

	// Constants
	const gridSize = 19;
	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/';
	const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3000';

	// Game states
	let grid: Array<Array<number>> = createEmptyGrid();
	let turn = Stone.Black;
	let winner = Stone.None;
	let stonesPlaced = 0;
	let stoneLimit = 1;
	let movesThisTurn: Array<Array<number>> = [];
	let gameId: string = '';

	// Connection states
	let socket: WebSocket;
	let connected = false;

	// Popup states
	let popupVisible = true;
	let joinGameSelected = false;
	let joinGameId = '';

	// Helper functions
	function createEmptyGrid() {
		return Array(gridSize)
			.fill()
			.map(() => Array(gridSize).fill(Stone.None));
	}

	function fetchAction(action: string, params?: string) {
		return fetch(backendUrl + action + (params ?? ''));
	}

	async function updateGrid(action: string, params?: string) {
		grid = createEmptyGrid();
		await fetchAction(action, params);
	}

	// Click actions
	async function onSquareClick(i: number, j: number) {
		if (grid[i][j] !== Stone.None || stonesPlaced === stoneLimit) {
			return;
		}
		grid[i][j] = turn;
		stonesPlaced++;
		movesThisTurn.push([i, j]);
		movesThisTurn = movesThisTurn;
		await fetchAction('placeStone', `?i=${i}&j=${j}&gameId=${gameId}`);
	}

	// Game actions
	async function undoTurn() {
		movesThisTurn.forEach((move) => (grid[move[0]][move[1]] = Stone.None));
		stonesPlaced = 0;
		movesThisTurn = [];
		await fetchAction('undoTurn', `?gameId=${gameId}`);
	}

	async function resetGame() {
		await updateGrid('resetGame', `?gameId=${gameId}`);
	}

	async function confirm() {
		if (stonesPlaced !== stoneLimit) {
			return;
		}
		await fetchAction('confirm', `?gameId=${gameId}`);
	}

	// Undo and Redo actions
	async function undoMove() {
		await fetchAction('undoMove', `?gameId=${gameId}`);
	}

	async function redoMove() {
		await fetchAction('redoMove', `?gameId=${gameId}`);
	}

	async function createGame() {
		try {
			const response = await axios.post(backendUrl + 'createGame');
			gameId = response.data.gameId;
			connectToGame(gameId);
			popupVisible = false;
		} catch (err) {
			alert('Failed to create game, please try again');
		}
	}

	async function joinGame() {
		joinGameSelected = true;
		try {
			const response = await axios.post(backendUrl + 'joinGame', { joinGameId });
			if (response.data.success) {
				connectToGame(joinGameId);
				gameId = joinGameId;
				popupVisible = false;
			} else {
				alert('Could not join game');
			}
		} catch (err) {
			alert('Could not join game');
		}
	}

	let ws: WebSocket;

	function connectToGame(gameId: string) {
		socket = new WebSocket(socketUrl);

		socket.onopen = () => {
			console.log(`Connected to game ${gameId}`);
			socket.send(JSON.stringify({ action: 'joinGame', gameId }));
		};

		socket.onmessage = (message) => {
			console.log(`Received message: ${message.data}`);
			const { gameState } = JSON.parse(message.data);
			// update local game state based on server state
			({ grid, turn, stoneLimit, stonesPlaced, winner, movesThisTurn } = gameState);
		};

		socket.onclose = () => {
			console.log('Disconnected from server');
		};
	}

	// Initialize WebSocket
	onMount(() => {
		if (typeof window !== 'undefined') {
			socket = new WebSocket(socketUrl);

			socket.addEventListener('open', () => (connected = true));
			socket.addEventListener('close', () => {
				connected = false;
			});

			window.addEventListener('keypress', (event) => {
				switch (event.key) {
					case 'c':
					case 'Enter':
						if (popupVisible && joinGameSelected) {
							joinGame();
						} else {
							confirm();
						}
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
				}
			});
		}
	});

	onDestroy(() => {
		socket?.close();
	});
</script>

{#if popupVisible}
	<div class="popup">
		<div class="popup-container">
			{#if !joinGameSelected}
				<button class="setup" on:click={createGame}> Create game </button>
				<button class="setup" on:click={() => (joinGameSelected = true)}> Join game </button>
			{/if}
			{#if joinGameSelected}
				<input
					type="text"
					bind:value={joinGameId}
					placeholder="Enter game ID"
					inputmode="numeric"
					pattern="\d*"
					maxlength="4"
				/>
				<button class="setup" on:click={joinGame}> Confirm </button>
			{/if}
		</div>
	</div>
{/if}

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
		{#if winner !== Stone.None}
			{#if winner === Stone.Black}
				<p class="win">Black Wins!</p>
			{:else}
				<p class="win">White Wins!</p>
			{/if}
		{/if}
		{#if gameId}
			<p>Game ID: {gameId}</p>
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

	.reset {
		margin: 8px;
	}

	.undo {
		margin: 4px 4px 8px 0px;
	}

	.confirm {
		margin: 4px 8px 8px 0px;
	}

	.popup {
		display: flex;
		justify-content: center;
		align-items: center;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9999;
	}

	.popup-container {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		background-color: #f5f5f5; /* Off-white */
		padding: 3rem;
		border-radius: 0.5rem;
		z-index: 10000;
	}

	.popup-container input[type='text'] {
		padding: 0.5rem;
		font-family: -apple-system, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;
		font-size: 16px;
		font-weight: 600;
		text-align: center;
		margin-bottom: 1rem;
		color: black;
	}

	.setup {
		align-items: center;
		background-clip: padding-box;
		background-color: #405cf5;
		border: 1px solid transparent;
		border-radius: 2rem;
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
		width: 200px;
	}
</style>
