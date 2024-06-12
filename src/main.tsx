import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React from "react";
import { Editor } from "./components/editor";

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
		<div className="shadow round-slight" style={{
			aspectRatio: 16 / 9,
			background: "var(--color-dark)",
		}}></div>
		<br />
		<Editor initialColors={initialColors} />
	</React.StrictMode>
);

function getDropEventFile(e: DragEvent): DataTransferItem | undefined {
	return [...e.dataTransfer?.items || []].filter(x => x.kind === "file")[0];
}

let dragDepth = 0;
window.addEventListener("drop", e => {
	dragDepth = Math.max(0, dragDepth - 1);
	if (dragDepth <= 0) {
		document.body.classList.remove("dropping");
	}

	if (getDropEventFile(e)) {
		e.preventDefault();
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
