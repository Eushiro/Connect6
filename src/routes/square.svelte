<script lang="ts">
	import { Stone } from './stone.svelte';
	export let stone: Object;
	export let onClick: any;
	export let i: number;
	export let j: number;

	// Determine if the square is a star point
	let starPoint = (i === 3 || i === 9 || i === 15) && (j === 3 || j === 9 || j === 15);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="container" on:click={onClick}>
	<div class="inner">
		<div class="line horizontal" class:top={i === 0} class:bottom={i === 18} />
		<div class="line vertical" class:left={j === 0} class:right={j === 18} />
		<div class:white={stone === Stone.White} class:black={stone === Stone.Black} />
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

	.horizontal.top {
		left: 50%;
		width: 100%;
	}

	.horizontal.bottom {
		left: 10%;
		width: 100%;
	}

	.vertical {
		left: 50%;
		top: 0;
		width: 1px;
		height: 100%;
	}

	.vertical.left {
		top: 50%;
		height: 100%;
	}

	.vertical.right {
		top: 50%;
		height: 100%;
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
	}
</style>
