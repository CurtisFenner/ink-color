import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React from "react";
import { ColorRangeInput, ColorSlidersInput } from "./color-range";
import { contrastCSS } from "./util";

const oklab = culori.converter("oklab");
const rgb = culori.converter("rgb");
const oklch = culori.converter("oklch");

type SwatchElement = {
	size: 1 | 2 | 3 | 4 | 5,
	color: culori.Oklab,
};

type Swatch = {
	elements: SwatchElement[],
};

let currentSwatch: Swatch = {
	elements: [
		{
			size: 2,
			color: oklab("#485B73")!,
		},
		{
			size: 2,
			color: oklab("#95A7BF")!,
		},
		{
			size: 2,
			color: oklab("#BFCAD9")!,
		},
		{
			size: 2,
			color: oklab("#5F7343")!,
		},
		{
			size: 2,
			color: oklab("#F2E6D8")!,
		},
	],
};

function createSwatchRow(count: number, ratio: number) {
	const container = document.createElement("div");
	container.style.display = "flex";
	container.style.justifyContent = "space-between";
	container.style.gap = "1rem";
	const cells = [];
	for (let i = 0; i < count; i++) {
		const cell = document.createElement("div");
		cell.classList.add("round-slight", "outline-dark", "shadow");
		cell.style.background = "var(--palette)";
		cell.style.textAlign = "center";
		cell.style.alignItems = "center";
		cell.style.justifyContent = "center";
		cell.style.fontWeight = "bold";
		cell.style.display = "flex";
		cell.style.padding = "0";
		cell.style.flex = "1 0";
		cell.style.color = "var(--color-contrast)";
		cell.style.setProperty("--height-ratio", (ratio * 2).toString());
		container.appendChild(cell);
		cells.push(cell);
	}
	return { container, cells };
}

function applySwatchElementToDiv(element: SwatchElement, div: HTMLElement) {
	const inOklch = oklch(element.color);
	div.style.setProperty(
		"--color-contrast",
		contrastCSS(inOklch),
	);
	const css = culori.formatCss(element.color);
	div.style.setProperty("--palette", css);
	div.textContent = culori.formatHex(element.color);
	div.style.aspectRatio = `${element.size} / var(--height-ratio)`;
}

for (const ratio of [1 / 4, 1 / 4, 1 / 4, 1 / 3, 1 / 3, 1 / 3, 1]) {
	const swatchRow = createSwatchRow(currentSwatch.elements.length, ratio);
	document.body.appendChild(swatchRow.container);
	for (let i = 0; i < currentSwatch.elements.length; i++) {
		applySwatchElementToDiv(currentSwatch.elements[i], swatchRow.cells[i]);
	}
	document.body.appendChild(document.createElement("br"));
}

const controlsDiv = document.getElementById("controls") as HTMLDivElement;

controlsDiv.style.backgroundColor = culori.formatHex(currentSwatch.elements[0].color);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		Hello!
		<br />
		<ColorSlidersInput initialColor={currentSwatch.elements[0].color} />
		<br />
		<br />
	</React.StrictMode>
);
