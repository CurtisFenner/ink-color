import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React from "react";
import { SwatchButtonRow } from "./components/swatch";
import { ColorChip } from "./components/color-chip";

function generateChromaDiscrepancies(): {
	chromaErrorRatio: number;
	a: culori.Color,
	b: culori.Color,
}[] {
	const pairs = [];

	for (const chroma of [0.15, 0.18, 0.22]) {
		for (const lightness of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
			const spectrum = [];
			for (let hue = 15; hue < 360; hue += 30) {
				const oklch: culori.Oklch = {
					mode: "oklch",
					c: chroma,
					l: lightness,
					h: hue,
				};
				if (culori.displayable(oklch)) {
					spectrum.push(oklch);
				}
			}

			for (let i = 0; i < spectrum.length; i++) {
				for (let j = 0; j < i; j++) {
					const a = spectrum[i];
					const b = spectrum[j];
					const hslRatio = culori.hsl(a).s / culori.hsl(b).s;
					pairs.push({
						chromaErrorRatio: hslRatio - 1,
						a,
						b,
					});
				}
			}
		}
	}

	pairs.sort((a, b) => Math.abs(b.chromaErrorRatio) - Math.abs(a.chromaErrorRatio));
	return pairs;
}

const lessMoreSame = (a: number, b: number, ful: string): React.ReactNode => {
	const percent = (a / b - 1) * 100;
	if (Math.abs(percent) < 0.5) {
		return <>
			<b>exactly as</b> {ful} as
		</>;
	} else if (Math.abs(percent) < 10) {
		return <>
			<b>about as</b> {ful} ({(a / b).toFixed(2)}x)
		</>;
	}
	return <>
		<b>{(a / b).toFixed(1)}x</b> as {ful} as
	</>
};

function HslChromaDiscrepancies() {
	const pairs = [];
	const seen = new Set<string>();
	for (const pair of generateChromaDiscrepancies()) {
		const ha = culori.formatHex(pair.a);
		const hb = culori.formatHex(pair.b);
		if (seen.has(ha) || seen.has(hb)) {
			continue;
		}
		pairs.push(pair);
		seen.add(ha);
		seen.add(hb);

		if (pairs.length >= 8) {
			break;
		}
	}

	return <section>
		<h2>Colorfulness</h2>
		{pairs.map((pair, i) => {
			return <div key={i}>
				The HSL color model says
				that <ColorChip color={pair.a} /> (saturation={(culori.hsl(pair.a).s * 100).toFixed(0)}%)
				is {lessMoreSame(culori.hsl(pair.a).s, culori.hsl(pair.b).s, "colorful")}
				<> </><ColorChip color={pair.b} /> (saturation={(culori.hsl(pair.b).s * 100).toFixed(0)}%).
				<center>
					<div style={{
						width: "10rem",
						display: "inline-block",
					}}>
						<SwatchButtonRow
							elements={[
								{ color: pair.a, flexBasis: 1 },
								{ color: pair.b, flexBasis: 1 },
							]}
							aspectRatio={1}
							onClick={(i, element) => { }} />
					</div>
				</center>
				But OKLCH says
				that <ColorChip color={pair.a} /> (chroma={(culori.oklch(pair.a).c).toFixed(2)})
				is {lessMoreSame(culori.oklch(pair.a).c, culori.oklch(pair.b).c, "colorful")}
				<> </><ColorChip color={pair.b} /> (chroma={(culori.oklch(pair.b).c).toFixed(2)}).
				<hr />
			</div>
		})}
	</section>
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		Why use OKLCH?<br />
		OKLCH makes it easier to <b>find</b> and <b>describe</b> the colors you
		want.
		<hr />
		<HslChromaDiscrepancies />
	</React.StrictMode>
);
