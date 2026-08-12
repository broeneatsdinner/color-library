const table = document.querySelector("table");
const body = table?.querySelector("tbody");
const headers = [...(table?.querySelectorAll("th") ?? [])];

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
		label: "Light: brightest to muted",
		ariaSort: "descending",
		direction: "descending",
	},
	{
		id: "dim",
		label: "Light: muted to brightest",
		ariaSort: "ascending",
		direction: "ascending",
	},
	{
		id: "spectrum",
		label: "Light: spectrum order",
		ariaSort: "other",
		direction: "ascending",
	},
	{
		id: "creation",
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
		const phrase = phraseCell.textContent.trim().toLocaleLowerCase();
		const tooltip = formatClassification(classifyPhrase(phrase));
		const hex = row.cells[4].textContent.trim();

		phraseCell.append(createAssessment(classifyPhrase(phrase), hex));
		phraseCell.setAttribute(
			"aria-label",
			`${phrase}. Color assessment: ${tooltip.replaceAll("\n", ". ")}.`,
		);
	});
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

function valueFor(row, key, colorMode = null) {
	const cells = row.cells;

	if (key === "color") {
		const hex = cells[4].textContent.trim();
		const hsv = hexToHsv(hex);

		if (colorMode === "creation") return originalRowIndex.get(row);

		if (colorMode === "spectrum") {
			const hueFamily = Math.floor(
				((hsv.hue + 22.5) % 360) / 45,
			);
			const spectrumFamily = (hueFamily - 6 + 8) % 8;

			return [
				hsv.saturation === 0 ? 1 : 0,
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

	headers.forEach((header) => {
		const button = header.querySelector("[data-sort]");
		const isActive = button?.dataset.sort === key;

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

body?.addEventListener("click", (event) => {
	const row = event.target.closest("tr");
	if (!row || !body.contains(row)) return;

	selectBackdrop(row.cells[4].textContent.trim());
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") clearBackdrop();
});

if (body) attachClassifications();
