import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React from "react";
import { Editor } from "./components/editor";
import { SpectrumRender, analyzeSpectrum, updateLatestAnalysis } from "./spectrum";

const oklch = culori.converter("oklch");

const initialColors = [
	oklch("#485B73")!,
	oklch("#95A7BF")!,
	oklch("#BFCAD9")!,
	oklch("#5F7343")!,
	oklch("#F2E6D8")!,
];

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<SpectrumRender />
		<br />
		<Editor initialColors={initialColors} />
	</React.StrictMode>
);

function getDropEventFile(e: DragEvent): DataTransferItem | undefined {
	return [...e.dataTransfer?.items || []].filter(x => x.kind === "file")[0];
}

let dragDepth = 0;
window.addEventListener("drop", async e => {
	dragDepth = Math.max(0, dragDepth - 1);
	if (dragDepth <= 0) {
		document.body.classList.remove("dropping");
	}

	let lastFile = null;
	for (const file of e.dataTransfer?.files || []) {
		lastFile = file;
	}

	if (getDropEventFile(e)) {
		e.preventDefault();
	}

	if (lastFile !== null) {
		try {
			const bitmap = await createImageBitmap(lastFile);
			const canvas = document.createElement("canvas");
			canvas.width = 400;
			canvas.height = 400;
			const ctx = canvas.getContext("2d")!;
			ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height, { colorSpace: "srgb" });
			const analysis = analyzeSpectrum(imageData, 1.5);
			updateLatestAnalysis(analysis);
		} catch (e) {
			console.error("could not process dropped file:", e);
		}
	}
});

window.addEventListener("dragenter", e => {
	if (getDropEventFile(e)) {
		dragDepth += 1;
		document.body.classList.add("dropping");
	}
});

window.addEventListener("dragleave", e => {
	if (getDropEventFile(e)) {
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth <= 0) {
			document.body.classList.remove("dropping");
		}
	}
});

window.addEventListener("dragover", e => {
	if (getDropEventFile(e)) {
		// Allow drop events to be collected.
		e.preventDefault();
	}
});
