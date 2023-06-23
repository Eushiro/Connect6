<script lang="ts">
	import { Stone } from './stone.svelte';
	export let stone: Object;
	export let onClick: any;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="container" on:click={onClick}>
	<div class="inner">
		<div class="line horizontal" />
		<div class="line vertical" />
		<div class:white={stone === Stone.White} class:black={stone === Stone.Black} />
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0;
		background-color: bisque;
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

	.vertical {
		left: 50%;
		top: 0;
		width: 1px;
		height: 100%;
	}

	.white {
		height: 95%;
		width: 95%;
		position: absolute;
		top: 50%;
		left: 50%;
		background-color: white;
		border-radius: 50%;
		transform: translate(-50%, -50%);
	}

	.black {
		height: 95%;
		width: 95%;
		position: absolute;
		top: 50%;
		left: 50%;
		background-color: black;
		border-radius: 50%;
		transform: translate(-50%, -50%);
	}
</style>
