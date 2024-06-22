import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React from "react";
import { SwatchButtonRow } from "./components/swatch";
import { ColorChip } from "./components/color-chip";

function generateChromaDiscrepancies(): {
	error: number;
	a: culori.Hsl,
	b: culori.Hsl,
}[] {
	const colors = [];
	for (let saturation = 20; saturation < 100; saturation += 30) {
		for (let h = 0; h < 360; h += 30) {
			const hsl: culori.Hsl = {
				mode: "hsl",
				h,
				s: saturation / 100,
				l: 0.5,
			}
			const oklch = culori.oklch(hsl);
			colors.push({ hsl, oklch });
		}
	}

	const pairs = [];
	for (let i = 0; i < colors.length; i++) {
		for (let j = 0; j < i; j++) {
			const a = colors[i];
			const b = colors[j];

			const hslRatio = b.hsl.s / a.hsl.s;
			const oklchRatio = b.oklch.c / a.oklch.c;
			const error = hslRatio - oklchRatio;
			pairs.push({
				error,
				a: a.hsl,
				b: b.hsl,
			});
		}
	}

	pairs.sort((a, b) => Math.abs(b.error) - Math.abs(a.error));
	return pairs;
}

const lessMoreSame = (a: number, b: number, ful: string): React.ReactNode => {
	const percent = (b / a - 1) * 100;
	if (Math.abs(percent) < 0.5) {
		return <>
			<b>exactly as {ful} as</b>
		</>;
	} else if (Math.abs(percent) < 10) {
		return <>
			<b>about as</b> {ful} ({Math.abs(percent).toFixed(0)}
			% {percent < 0 ? "more" : "less"} than)
		</>;
	}
	return <>
		<b>
			{Math.abs(percent).toFixed(0)}% {percent < 0 ? "more" : "less"}
		</b> {ful} than
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
