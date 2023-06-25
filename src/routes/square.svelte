<script lang="ts">
	import { Stone } from './stone.svelte';
	export let stone: Object;
	export let onClick: any;
	export let i: number;
	export let j: number;
	export let newlyPlaced: boolean; // newly added

	// Determine if the square is a star point
	let starPoint = (i === 3 || i === 9 || i === 15) && (j === 3 || j === 9 || j === 15);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="container" on:click={onClick}>
	<div class="inner">
		<div class="line horizontal" class:left={j === 0} class:right={j === 18} />
		<div class="line vertical" class:top={i === 0} class:bottom={i === 18} />
		<div
			class:glow={newlyPlaced && stone !== Stone.None}
			class:white={stone === Stone.White}
			class:black={stone === Stone.Black}
		/>
		{#if starPoint}
			<div class="star-point" />
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0;
		background-color: #dda15e; /* Change to a wooden color */
	}

	.inner {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.line {
		position: absolute;
		background-color: #000;
	}

	.horizontal {
		top: 50%;
		left: 0;
		width: 100%;
		height: 1px;
	}

	.horizontal.left {
		left: 50%;
		width: 50%;
	}

	.horizontal.right {
		right: 50%;
		width: 50%;
	}

	.vertical {
		left: 50%;
		top: 0;
		width: 1px;
		height: 100%;
	}

	.vertical.top {
		top: 50%;
		height: 50%;
	}

	.vertical.bottom {
		bottom: 50%;
		height: 50%;
	}

	.white,
	.black {
		height: 80%;
		width: 80%;
		position: absolute;
		top: 50%;
		left: 50%;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.75);
		z-index: 3;
	}

	.white {
		background-color: #f3f3f3; /* Lighter color for white stone */
	}

	.black {
		background-color: #111; /* Darker color for black stone */
	}

	.star-point {
		height: 10px;
		width: 10px;
		position: absolute;
		top: 50%;
		left: 50%;
		background-color: #000;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
	}

	.glow {
		-webkit-box-shadow: 0px 0px 5px 4px rgba(123, 252, 220, 0.76);
		-moz-box-shadow: 0px 0px 5px 4px rgba(123, 252, 220, 0.76);
		box-shadow: 0px 0px 5px 4px rgba(123, 252, 220, 0.76);
	}
</style>
