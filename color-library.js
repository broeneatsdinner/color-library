const table = document.querySelector("table");
const body = table?.querySelector("tbody");
const headers = [...(table?.querySelectorAll("th") ?? [])];
const tableWrap = document.querySelector(".table-wrap");
const swatchGrid = document.querySelector(".swatch-grid");
const viewButtons = [...document.querySelectorAll("[data-view]")];

const state = {
	key: null,
	direction: "ascending",
	colorModeIndex: -1,
};

const originalRowIndex = new Map(
	body ? [...body.rows].map((row, index) => [row, index]) : [],
);

const colorModes = [
	{
		id: "bright",
		headerLabel: "Vivid",
		label: "Light: brightest to muted",
		ariaSort: "descending",
		direction: "descending",
	},
	{
		id: "dim",
		headerLabel: "Muted",
		label: "Light: muted to brightest",
		ariaSort: "ascending",
		direction: "ascending",
	},
	{
		id: "spectrum",
		headerLabel: "Prism",
		label: "Light: spectrum order",
		ariaSort: "other",
		direction: "ascending",
	},
	{
		id: "creation",
		headerLabel: "Order",
		label: "Light: creation order",
		ariaSort: "other",
		direction: "ascending",
	},
];

let activeBackdropHex = null;

const assessmentCopy = {
	accuracy: [
		"Emotionally exact",
		"Factually inadmissible",
		"Peer-reviewed by vibes",
		"Disputed by one uncle",
		"Strangely canonical",
		"Not wrong, merely sideways",
		"Approximately psychic",
		"Ranked #1 in a very small field",
		"Too specific to dismiss",
		"Reliable after 9 p.m.",
		"Legally a feeling",
		"Unlicensed but persuasive",
		"Made of evidence, somehow",
		"Cartographically suspect",
		"Foundational nonsense",
		"Rigorous in a dream",
		"A triumphant reach",
		"Not yet contradicted by science",
		"Extremely caller-dependent",
		"Certified adjacent",
	],
	but: [
		"the color showed up immediately",
		"nobody can prove you wrong in this room",
		"it has excellent posture",
		"the swatch is taking it very seriously",
		"a tiny committee agrees",
		"the vibes have notarized it",
		"it remembers being summer",
		"the hex is frankly undeniable",
		"it possesses a minor weather system",
		"it looks expensive in low light",
		"a mall in 1998 would understand",
		"this is how colors get tenure",
		"it brought references, somehow",
		"the argument has a satisfying crunch",
		"it would win a debate against beige",
		"the lamp is now on your side",
		"this has been seen in the wild",
		"the universe left the door unlocked",
		"it has one very good story",
		"the color is doing most of the work",
	],
	funeral: [
		"Only if the deceased was hilarious",
		"Ask the family. Then ask again.",
		"Better as a private thought",
		"Absolutely not near the program",
		"Maybe in a very good hat",
		"Technically, but with consequences",
		"For a jazz funeral, perhaps",
		"Bring flowers instead",
		"A brave choice for the bereaved",
		"If the casket has cup holders",
		"Only after the wake gets weird",
		"Respectfully, no",
		"High risk, unforgettable",
		"In a tiny pocket square only",
		"Useful to someone, somewhere",
		"If everyone signed a waiver",
		"Reserved for the after-afterparty",
		"Not during the first act",
		"Potentially iconic, definitely risky",
		"Keep this one out of the church",
	],
	wedding: [
		"Front row, somehow",
		"At the reception with conviction",
		"Only if there is a fog machine",
		"The bridesmaids would gossip for years",
		"Yes, but not before dinner",
		"In the photo booth, absolutely",
		"One champagne in, perfect",
		"It has best-man energy",
		"For the couple who eloped emotionally",
		"A bold plus-one",
		"Useful during the first dance remix",
		"Better than another mason jar",
		"It understands the dress code spiritually",
		"At a beach wedding, dangerous",
		"The DJ would approve",
		"Throw it instead of rice",
		"For vows written on a napkin",
		"It could catch the bouquet",
		"Very, very reception",
		"Only if the cake is also this color",
	],
};

function phraseSeed(phrase, salt) {
	return [...phrase].reduce(
		(hash, character, index) => ((hash * 31) + character.charCodeAt(0) + salt + index) >>> 0,
		2166136261,
	);
}

function pickAssessment(copy, phrase, salt) {
	return copy[phraseSeed(phrase, salt) % copy.length];
}

function classifyPhrase(phrase) {
	return {
		accuracy: pickAssessment(assessmentCopy.accuracy, phrase, 11),
		but: pickAssessment(assessmentCopy.but, phrase, 23),
		funeral: pickAssessment(assessmentCopy.funeral, phrase, 37),
		wedding: pickAssessment(assessmentCopy.wedding, phrase, 53),
	};
}

function formatClassification(classification) {
	return [
		`Accuracy: ${classification.accuracy}`,
		`But: ${classification.but}`,
		`Useful at a funeral: ${classification.funeral}`,
		`Useful at a wedding: ${classification.wedding}`,
	].join("\n");
}

function createAssessment(classification, hex) {
	const assessment = document.createElement("span");
	assessment.className = "color-assessment";
	assessment.style.setProperty("--assessment-color", hex);

	[
		["Accuracy", classification.accuracy],
		["But", classification.but],
		["Useful at a funeral", classification.funeral],
		["Useful at a wedding", classification.wedding],
	].forEach(([label, value]) => {
		const line = document.createElement("span");
		const labelElement = document.createElement("strong");

		labelElement.textContent = `${label}:`;
		line.append(labelElement, ` ${value}`);
		assessment.append(line);
	});

	return assessment;
}

function attachClassifications() {
	[...body.rows].forEach((row) => {
		const phraseCell = row.cells[1];
		const phrase = phraseCell.querySelector("code")?.textContent.trim().toLocaleLowerCase() ?? "";
		const tooltip = formatClassification(classifyPhrase(phrase));

		phraseCell.setAttribute(
			"aria-label",
			`${phrase}. Color assessment: ${tooltip.replaceAll("\n", ". ")}.`,
		);
	});
}

const assessmentFollower = document.createElement("div");
assessmentFollower.className = "color-assessment-follower";
assessmentFollower.setAttribute("aria-hidden", "true");
document.body.append(assessmentFollower);

let tooltipFrame = null;
let tooltipCurrent = null;
let tooltipTarget = null;
let activePhraseCell = null;

function hideTooltipFollower() {
	activePhraseCell = null;
	tooltipCurrent = null;
	tooltipTarget = null;
	assessmentFollower.classList.remove("is-visible");
	if (tooltipFrame) cancelAnimationFrame(tooltipFrame);
	tooltipFrame = null;
}

function paintTooltipPosition() {
	if (!activePhraseCell || !tooltipCurrent || !tooltipTarget) return;

	tooltipCurrent.x += (tooltipTarget.x - tooltipCurrent.x) * 0.16;
	tooltipCurrent.y += (tooltipTarget.y - tooltipCurrent.y) * 0.16;
	assessmentFollower.style.setProperty("--tooltip-x", `${tooltipCurrent.x}px`);
	assessmentFollower.style.setProperty("--tooltip-y", `${tooltipCurrent.y}px`);

	if (
		Math.abs(tooltipTarget.x - tooltipCurrent.x) > 0.25
		|| Math.abs(tooltipTarget.y - tooltipCurrent.y) > 0.25
	) {
		tooltipFrame = requestAnimationFrame(paintTooltipPosition);
		return;
	}

	tooltipCurrent = { ...tooltipTarget };
	tooltipFrame = null;
}

function followTooltip(cell, event) {
	const phrase = cell.querySelector("code")?.textContent.trim().toLocaleLowerCase() ?? "";
	const hex = cell.closest("tr")?.cells[4].textContent.trim() ?? "#9eb4d5";

	if (activePhraseCell !== cell) {
		assessmentFollower.replaceChildren(
			createAssessment(classifyPhrase(phrase), hex),
		);
		assessmentFollower.style.setProperty("--assessment-color", hex);
		assessmentFollower.classList.add("is-visible");
		activePhraseCell = cell;
	}

	const target = {
		x: event.clientX + 22,
		y: event.clientY - 36,
	};

	tooltipTarget = target;
	if (!tooltipCurrent) tooltipCurrent = { ...target };

	if (!tooltipFrame) tooltipFrame = requestAnimationFrame(paintTooltipPosition);
}

function attachTooltipFollowers() {
	body.addEventListener("pointermove", (event) => {
		if (event.pointerType !== "mouse") return;

		const phraseCell = document
			.elementFromPoint(event.clientX, event.clientY)
			?.closest("td:nth-child(2)");
		if (!phraseCell || !body.contains(phraseCell)) {
			hideTooltipFollower();
			return;
		}

		followTooltip(phraseCell, event);
	});

	body.addEventListener("pointerleave", hideTooltipFollower);
}

function hexToHsv(hex) {
	const value = Number.parseInt(hex.slice(1), 16);
	const red = ((value >> 16) & 255) / 255;
	const green = ((value >> 8) & 255) / 255;
	const blue = (value & 255) / 255;
	const maximum = Math.max(red, green, blue);
	const minimum = Math.min(red, green, blue);
	const delta = maximum - minimum;
	let hue = 0;

	if (delta !== 0) {
		if (maximum === red) hue = ((green - blue) / delta) % 6;
		if (maximum === green) hue = ((blue - red) / delta) + 2;
		if (maximum === blue) hue = ((red - green) / delta) + 4;
		hue *= 60;
		if (hue < 0) hue += 360;
	}

	return {
		hue,
		brightness: maximum,
		saturation: maximum === 0 ? 0 : delta / maximum,
		lightness: (maximum + minimum) / 2,
	};
}

function spectrumFamilyForHue(hue) {
	// Deliberately perceptual, not mathematically even: this keeps the
	// colors people call orange (and the colors people call pink) together.
	if (hue >= 250 && hue < 300) return 0; // purple
	if (hue >= 300) return 1; // pink
	if (hue < 40) return 2; // red / orange
	if (hue < 75) return 3; // yellow
	if (hue < 165) return 4; // green
	if (hue < 195) return 5; // teal
	return 6; // blue
}

function valueFor(row, key, colorMode = null) {
	const cells = row.cells;

	if (key === "color") {
		const hex = cells[4].textContent.trim();
		const hsv = hexToHsv(hex);

		if (colorMode === "creation") return originalRowIndex.get(row);

		if (colorMode === "spectrum") {
			const spectrumFamily = spectrumFamilyForHue(hsv.hue);
			const isNeutral = hsv.saturation < 0.22;

			return [
				isNeutral ? 1 : 0,
				spectrumFamily,
				-hsv.brightness,
				-hsv.saturation,
				hsv.hue,
			];
		}

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

	if (typeof first === "number") return first - second;

	return first.localeCompare(second);
}

function refreshSortHeaders(activeColorMode = null) {
	headers.forEach((header) => {
		const button = header.querySelector("[data-sort]");
		const isActive = button?.dataset.sort === state.key;

		header.setAttribute(
			"aria-sort",
			isActive
				? activeColorMode?.ariaSort ?? state.direction
				: "none",
		);

		if (!button) return;

		if (isActive && activeColorMode) {
			button.dataset.sortMode = activeColorMode.id;
			button.setAttribute("aria-label", activeColorMode.label);
		} else {
			delete button.dataset.sortMode;
			button.removeAttribute("aria-label");
		}
	});
}

function refreshLightLabel(activeColorMode) {
	const label = table?.querySelector('[data-sort="color"] .sort-label');
	if (label && activeColorMode) label.textContent = activeColorMode.headerLabel;
}

function contrastColor(hex) {
	const channels = hex.match(/[A-Fa-f0-9]{2}/g)?.map((channel) => Number.parseInt(channel, 16));
	if (!channels) return "#111722";
	const [red, green, blue] = channels.map((channel) => {
		const value = channel / 255;
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue) > 0.36
		? "#111722"
		: "#f7f9ff";
}

function refreshSwatchGrid() {
	if (!body || !swatchGrid) return;

	swatchGrid.replaceChildren(
		...[...body.rows].map((row) => {
			const cells = row.cells;
			const hex = cells[4].textContent.trim();
			const phrase = cells[1].querySelector("code")?.textContent.trim() ?? "";
			const card = document.createElement("button");
			card.type = "button";
			card.className = "swatch-card";
			card.style.setProperty("--color", hex);
			card.style.setProperty("--card-ink", contrastColor(hex));
			card.setAttribute("aria-label", `${phrase}, ${hex}`);
			card.innerHTML = `
				<span class="swatch-card__shortname">${cells[3].textContent.trim()}</span>
				<span class="swatch-card__hex">${hex}</span>
				<span class="swatch-card__phrase">${phrase}</span>
				<span class="swatch-card__interpretation">${cells[2].textContent.trim()}</span>
			`;
			card.addEventListener("click", () => selectBackdrop(hex));
			return card;
		}),
	);
}

function setView(view) {
	const showSwatches = view === "swatches";
	if (showSwatches) refreshSwatchGrid();
	if (tableWrap) tableWrap.hidden = showSwatches;
	if (swatchGrid) swatchGrid.hidden = !showSwatches;

	viewButtons.forEach((button) => {
		const isActive = button.dataset.view === view;
		button.classList.toggle("is-active", isActive);
		button.setAttribute("aria-pressed", String(isActive));
	});
}

function sortRows(key) {
	let colorMode = null;
	let activeColorMode = null;

	if (key === "color") {
		state.colorModeIndex = state.key === "color"
			? (state.colorModeIndex + 1) % colorModes.length
			: 0;
		activeColorMode = colorModes[state.colorModeIndex];
		colorMode = activeColorMode.id;
		state.direction = activeColorMode.direction;
	} else if (state.key === key) {
		state.direction = state.direction === "ascending"
			? "descending"
			: "ascending";
	} else {
		state.direction = "ascending";
		state.colorModeIndex = -1;
	}
	state.key = key;

	const multiplier = state.direction === "ascending" ? 1 : -1;

	[...body.rows]
		.map((row, index) => ({ row, index, value: valueFor(row, key, colorMode) }))
		.sort((first, second) => {
			const comparison = compareValues(first.value, second.value);
			return comparison ? comparison * multiplier : first.index - second.index;
		})
		.forEach(({ row }) => body.append(row));

	refreshSortHeaders(activeColorMode);
	if (activeColorMode) refreshLightLabel(activeColorMode);
	refreshSwatchGrid();
}

function clearBackdrop() {
	activeBackdropHex = null;
	document.body.classList.remove("backdrop-full", "backdrop-muted");
}

function setBackdrop(hex, mode) {
	activeBackdropHex = hex;
	document.body.style.setProperty("--selected-color", hex);
	document.body.classList.remove("backdrop-full", "backdrop-muted");
	document.body.classList.add(`backdrop-${mode}`);
}

function selectBackdrop(hex) {
	if (activeBackdropHex !== hex) {
		setBackdrop(hex, "muted");
		return;
	}

	if (document.body.classList.contains("backdrop-muted")) {
		setBackdrop(hex, "full");
		return;
	}

	clearBackdrop();
}

table?.querySelectorAll("[data-sort]").forEach((button) => {
	button.addEventListener("click", () => sortRows(button.dataset.sort));
});

viewButtons.forEach((button) => {
	button.addEventListener("click", () => setView(button.dataset.view));
});

let draggedRow = null;
let dragPointerId = null;
let dragStart = null;
let dragMoved = false;
let suppressNextClick = false;

function clearTextSelection() {
	document.getSelection()?.removeAllRanges();
}

function rememberManualOrder() {
	[...body.rows].forEach((row, index) => originalRowIndex.set(row, index));

	state.key = "color";
	state.colorModeIndex = colorModes.findIndex(({ id }) => id === "creation");
	state.direction = "ascending";
	refreshSortHeaders(colorModes[state.colorModeIndex]);
	refreshLightLabel(colorModes[state.colorModeIndex]);
	refreshSwatchGrid();
}

function settleDraggedRow() {
	if (!draggedRow) return;

	const row = draggedRow;
	row.classList.remove("row-dragging");
	row.classList.add("row-settle");
	row.addEventListener(
		"animationend",
		() => row.classList.remove("row-settle"),
		{ once: true },
	);

	draggedRow = null;
	dragPointerId = null;
	dragStart = null;
	dragMoved = false;
	document.body.classList.remove("reordering");
}

function animateRowsIntoPlace(previousPositions) {
	[...body.rows].forEach((row) => {
		if (row === draggedRow) return;

		const previous = previousPositions.get(row);
		const current = row.getBoundingClientRect();
		const offset = previous ? previous.top - current.top : 0;

		if (Math.abs(offset) < 1) return;

		row.animate(
			[
				{ transform: `translateY(${offset}px)` },
				{ transform: "translateY(0)" },
			],
			{
				duration: 180,
				easing: "cubic-bezier(0.22, 1, 0.36, 1)",
			},
		);
	});
}

function moveDraggedRow(event) {
	const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("tr");
	if (!target || target === draggedRow || !body.contains(target)) return;

	const previousPositions = new Map(
		[...body.rows].map((row) => [row, row.getBoundingClientRect()]),
	);
	const midpoint = target.getBoundingClientRect().top
		+ (target.getBoundingClientRect().height / 2);

	body.insertBefore(
		draggedRow,
		event.clientY < midpoint ? target : target.nextElementSibling,
	);
	animateRowsIntoPlace(previousPositions);
}

body?.addEventListener("pointerdown", (event) => {
	if (event.button !== 0) return;

	const row = event.target.closest("tr");
	if (!row || !body.contains(row)) return;

	draggedRow = row;
	dragPointerId = event.pointerId;
	dragStart = { x: event.clientX, y: event.clientY };
	dragMoved = false;
	row.setPointerCapture(event.pointerId);
});

body?.addEventListener("pointermove", (event) => {
	if (event.pointerId !== dragPointerId || !draggedRow || !dragStart) return;

	const distance = Math.hypot(
		event.clientX - dragStart.x,
		event.clientY - dragStart.y,
	);

	if (!dragMoved && distance < 6) return;

	if (!dragMoved) {
		dragMoved = true;
		clearTextSelection();
		draggedRow.classList.add("row-dragging");
		document.body.classList.add("reordering");
	}

	event.preventDefault();
	moveDraggedRow(event);
});

body?.addEventListener("pointerup", (event) => {
	if (event.pointerId !== dragPointerId || !draggedRow) return;

	if (dragMoved) {
		rememberManualOrder();
		suppressNextClick = true;
	}
	if (draggedRow.hasPointerCapture(event.pointerId)) {
		draggedRow.releasePointerCapture(event.pointerId);
	}
	settleDraggedRow();
});

body?.addEventListener("pointercancel", settleDraggedRow);

body?.addEventListener("selectstart", (event) => {
	if (!dragMoved) return;

	event.preventDefault();
});

document.addEventListener("selectionchange", () => {
	if (dragMoved) clearTextSelection();
});

body?.addEventListener("click", (event) => {
	if (suppressNextClick) {
		suppressNextClick = false;
		return;
	}

	const row = event.target.closest("tr");
	if (!row || !body.contains(row)) return;

	selectBackdrop(row.cells[4].textContent.trim());
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") clearBackdrop();
});

if (body) {
	attachClassifications();
	attachTooltipFollowers();
	refreshSwatchGrid();
}
