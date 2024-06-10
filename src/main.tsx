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
		<h1>Big</h1>
		<h1>Big2</h1>
		<h1>Big3</h1>
		<h1>Big4</h1>
		<h1>Big5</h1>
		<h1>Big6</h1>
		<h1>Big7</h1>
		<h1>Big8</h1>
		<h1>Big9</h1>
		<h1>Big10</h1>
		<h1>Big11</h1>
		Hello!
		<br />
		<Editor initialColors={initialColors} />
	</React.StrictMode>
);
