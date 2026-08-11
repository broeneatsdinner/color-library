const table = document.querySelector("table");
const body = table?.querySelector("tbody");
const headers = [...(table?.querySelectorAll("th") ?? [])];

const state = {
	key: null,
	direction: "ascending",
};

function hexToHsv(hex) {
	const value = Number.parseInt(hex.slice(1), 16);
	const red = ((value >> 16) & 255) / 255;
	const green = ((value >> 8) & 255) / 255;
	const blue = (value & 255) / 255;
	const maximum = Math.max(red, green, blue);
	const minimum = Math.min(red, green, blue);
	const delta = maximum - minimum;

	return {
		brightness: maximum,
		saturation: maximum === 0 ? 0 : delta / maximum,
		lightness: (maximum + minimum) / 2,
	};
}

function valueFor(row, key) {
	const cells = row.cells;

	if (key === "color") {
		const hex = cells[4].textContent.trim();
		const hsv = hexToHsv(hex);
		return [hsv.brightness, hsv.saturation, hsv.lightness];
	}

	const column = {
		phrase: 1,
		interpretation: 2,
		shortname: 3,
		hex: 4,
	}[key];

	return cells[column].textContent.trim().toLocaleLowerCase();
}

function compareValues(first, second) {
	if (Array.isArray(first)) {
		for (let index = 0; index < first.length; index += 1) {
			if (first[index] !== second[index]) return first[index] - second[index];
		}
		return 0;
	}

	return first.localeCompare(second);
}

function sortRows(key) {
	if (state.key === key) {
		state.direction = state.direction === "ascending"
			? "descending"
			: "ascending";
	} else {
		state.direction = key === "color" ? "descending" : "ascending";
	}
	state.key = key;

	const multiplier = state.direction === "ascending" ? 1 : -1;

	[...body.rows]
		.map((row, index) => ({ row, index, value: valueFor(row, key) }))
		.sort((first, second) => {
			const comparison = compareValues(first.value, second.value);
			return comparison ? comparison * multiplier : first.index - second.index;
		})
		.forEach(({ row }) => body.append(row));

	headers.forEach((header) => {
		header.setAttribute(
			"aria-sort",
			header.querySelector("[data-sort]")?.dataset.sort === key
				? state.direction
				: "none",
		);
	});
}

table?.querySelectorAll("[data-sort]").forEach((button) => {
	button.addEventListener("click", () => sortRows(button.dataset.sort));
});
