import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React from "react";
import { SwatchButtonRow } from "./components/swatch";
import { ColorChip } from "./components/color-chip";
import { binarySearchNearest } from "./util";

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

type ColorBar = {
	name: string,
	percent: (c: culori.Color) => number,
	label: (n: number) => string,
};

const oklchColorBar: ColorBar = {
	name: "OKLCH",
	percent: c => culori.oklch(c).c,
	label: x => x.toFixed(2),
};
const hslColorBar: ColorBar = {
	name: "HSL",
	percent: c => culori.hsl(c).s * 100,
	label: x => (x * 100).toFixed(0) + "%",
};

function TheColors(props: {
	palette: culori.Color[],
	bars: ColorBar[],
}) {
	const palette = props.palette;
	const bars = props.bars;

	const barMaxes = bars.map(bar => Math.max(...palette.map(color => bar.percent(color))));

	return <table style={{ width: "100%" }}>
		<tbody>
			<tr>
				{palette.map(color => {
					return bars.map((bar, barI) => {
						return <td key={barI} style={{ position: "relative", height: "4rem" }}>
							<div style={{
								position: "relative",
								left: 0,
								top: 0,
								width: "100%",
								height: "100%",
							}}>
								<div style={{
									position: "absolute",
									backgroundColor: culori.formatHex(color),
									bottom: 0,
									width: "100%",
									height: (bar.percent(color) / barMaxes[barI] * 100).toFixed(1) + "%",
								}}></div>
								<div style={{
									position: "absolute",
									fontSize: "80%",
									left: "50%",
									top: "50%",
									transform: "translate(-50%, -50%)",
									textAlign: "right",
								}}>{bar.name}</div>
							</div>
						</td>
					});
				})}
			</tr>
			<tr>
				{palette.map((color, paletteI) => {
					return <td key={paletteI} colSpan={bars.length}
						style={{
							background: culori.formatRgb(color),
						}}>
						<div style={{
							width: "5em",
							height: "2em",
							lineHeight: "2em",
							textAlign: "center",
							position: "relative",
						}}>
							{culori.formatHex(color)}
						</div>
					</td>
				})}
			</tr>
		</tbody>
	</table >
}

const consistentChromaPalette: culori.Oklch[] = [];
const darkConsistentChromaPalette: culori.Oklch[] = [];
for (let hue = 0; hue < 360; hue += 40) {
	consistentChromaPalette.push({
		mode: "oklch",
		h: hue + 23,
		c: 0.1229,
		l: 0.7285,
	});

	darkConsistentChromaPalette.push({
		mode: "oklch",
		h: hue + 23,
		c: 0.08,
		l: 0.47,
	});
}

const consistentSaturationPalette: culori.Color[] = consistentChromaPalette.map(base => {
	const targetSaturation = 0.45;
	// Vary the chroma to get the desired HSL saturation.
	const bestChroma = binarySearchNearest(base.c, guessChroma => {
		if (guessChroma < 0 || guessChroma > 1) return Infinity;
		const withNewChroma = culori.clampChroma({ ...base, c: guessChroma }, "oklch", "rgb");
		return Math.abs(culori.hsl(withNewChroma).s - targetSaturation);
	}, 1);
	const actual = culori.clampChroma({ ...base, c: bestChroma }, "oklch", "rgb");
	return actual;
});

const darkConsistentSaturationPalette: culori.Color[] = darkConsistentChromaPalette.map(base => {
	const targetSaturation = 0.7;
	// Vary the chroma to get the desired HSL saturation.
	const bestChroma = binarySearchNearest(base.c, guessChroma => {
		if (guessChroma < 0 || guessChroma > 1) return Infinity;
		const withNewChroma = culori.clampChroma({ ...base, c: guessChroma }, "oklch", "rgb");
		return Math.abs(culori.hsl(withNewChroma).s - targetSaturation);
	}, 1);
	const actual = culori.clampChroma({ ...base, c: bestChroma }, "oklch", "rgb");
	return actual;
});

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		Why use OKLCH?<br />
		OKLCH makes it easier to <b>find</b> and <b>describe</b> the colors you
		want.
		<hr />
		These colors have a consistent <b>saturation</b> in HSL. The size of the
		bars indicates each color's relative <em>chroma</em> in OKLCH.
		<TheColors palette={consistentSaturationPalette} bars={[oklchColorBar]} />
		<TheColors palette={darkConsistentSaturationPalette} bars={[oklchColorBar]} />
		<hr />
		These colors have a consistent <b>chroma</b> in OKLCH. The size of the
		bars indicates each color's relative <em>saturation</em> in HSL.
		<TheColors palette={consistentChromaPalette} bars={[hslColorBar]} />
		<TheColors palette={darkConsistentChromaPalette} bars={[hslColorBar]} />
		<hr />
		<HslChromaDiscrepancies />
	</React.StrictMode>
);
