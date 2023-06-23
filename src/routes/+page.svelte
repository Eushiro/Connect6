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

	let movesThisTurn: Array<Array<number>> = [];
	function undoTurn() {
		for (let i = 0; i < movesThisTurn.length; i++) {
			grid[movesThisTurn[i][0]][movesThisTurn[i][1]] = Stone.None;
		}
		stonesPlaced = 0;
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
	}
	function confirm() {
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

	function checkWin(row: number, col: number) {
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
				alert(turn === Stone.Black ? 'Black wins' : 'White wins');
				break;
			}
		}
	}

	function onSquareClick(i: number, j: number) {
		if (grid[i][j] !== Stone.None || stonesPlaced === stoneLimit) {
			return;
		}

		console.log(turn, stonesPlaced);

		stonesPlaced += 1;
		grid[i][j] = turn;
		movesThisTurn.push([i, j]);

		checkWin(i, j);
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
	</div>
	<div class="grid">
		{#each grid as line, i}
			{#each line as square, j}
				<Square stone={square} onClick={() => onSquareClick(i, j)} />
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
	.grid {
		width: min(93vw, 93vh);
		height: min(93vw, 93vh);
		display: grid;
		grid-template-columns: repeat(19, 1fr);
		grid-template-rows: repeat(19, 1fr);
	}
</style>
