import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React, { useState } from "react";
import { ColorRangeInput } from "./color-range";
import { SwatchButtonRow } from "./components/swatch";
import { binarySearchNearest, hueDistance } from "./util";

const oklchSpectrum: culori.Oklch[] = [];
const spectrumResolution = 16;
for (let hi = 0; hi < spectrumResolution; hi++) {
	const hue = 360 * (hi / spectrumResolution);
	const oklch: culori.Oklch = culori.clampChroma({
		mode: "oklch",
		h: hue,
		c: 0.2,
		l: 0.63,
	}, "oklch", "rgb");
	oklchSpectrum.push(oklch);
}

const spectrumByHslHue = oklchSpectrum.map(x => culori.hsl(x)).sort((a, b) => a.h! - b.h!);
spectrumByHslHue.splice(0, 0, (x => ({ ...x, h: x.h! - 360 }))(spectrumByHslHue[spectrumByHslHue.length - 1]));
spectrumByHslHue.push((x => ({ ...x, h: x.h! + 360 }))(spectrumByHslHue[1]));

const hslSpectrum: culori.Hsl[] = [];
for (let i = 0; i < spectrumByHslHue.length && hslSpectrum.length < 360;) {
	const a = spectrumByHslHue[i];
	const bHue = i + 1 < spectrumByHslHue.length
		? spectrumByHslHue[i + 1].h!
		: spectrumByHslHue[(i + 1) % spectrumByHslHue.length].h! + 360;
	const targetHue = hslSpectrum.length;
	if (a.h! > bHue) {
		throw new Error("unexpected HSL hue ordering in OKLCH spectrum!");
	} else if (a.h! <= targetHue && targetHue < bHue) {
		const p = (targetHue - a.h!) / (bHue - a.h!);
		if (!isFinite(p)) {
			continue;
		}
		hslSpectrum.push(
			culori.hsl(
				culori.interpolate([spectrumByHslHue[i], spectrumByHslHue[(i + 1) % spectrumByHslHue.length]], "oklab")(p)
			)
		);
	} else {
		i += 1;
	}
}

function oklchFromHue(hue: number): culori.Oklch {
	hue = ((hue % 360) + 360) % 360;

	const ip = oklchSpectrum.length * hue / 360;
	const i0 = Math.floor(ip);
	const i1 = (i0 + 1) % oklchSpectrum.length;
	const it = ip - i0;
	const out = culori.interpolate([oklchSpectrum[i0], oklchSpectrum[i1]], "oklab")(it);
	return culori.oklch(out);
}

function hslFromHue(hue: number): culori.Hsl {
	hue = ((hue % 360) + 360) % 360;
	const ip = hslSpectrum.length * hue / 360;
	const i0 = Math.floor(ip);
	const i1 = (i0 + 1) % hslSpectrum.length;
	const it = ip - i0;
	const out = culori.interpolate([hslSpectrum[i0], hslSpectrum[i1]], "oklab")(it);
	return culori.hsl(out);
}

const oklchRedHue: number = culori.oklch(hslFromHue(0)).h!;

function HueSelectors() {
	const [hues, setHues] = useState({ oklchHue: oklchRedHue, hslHue: 0 });

	return <>
		<div className="section">
			<b>HSL Hue:</b> {hues.hslHue.toFixed(1)}&deg;<br /><br />
			<ColorRangeInput
				range={{ low: 0, high: 360 }}
				colorF={hslFromHue}
				clampMode="wrap"
				value={hues.hslHue}
				changeValue={newHSLHue => {
					const hsl = hslFromHue(newHSLHue);
					const oklch = culori.oklch(hsl);
					setHues({
						hslHue: hsl.h!,
						oklchHue: oklch.h!,
					});
				}} />
		</div>
		<br />
		<div className="section">
			<b>OKLCH Hue:</b> {hues.oklchHue.toFixed(1)}&deg; (≈ red +  {((hues.oklchHue - oklchRedHue + 360) % 360).toFixed(1)}&deg;)<br /><br />
			<ColorRangeInput
				range={{ low: oklchRedHue, high: oklchRedHue + 360 }}
				clampMode="wrap"
				colorF={oklchFromHue}
				value={hues.oklchHue}
				changeValue={newOKLCHHue => {
					const oklch = oklchFromHue(newOKLCHHue);
					const hsl = culori.hsl(oklch);
					setHues({
						hslHue: hsl.h!,
						oklchHue: oklch.h!,
					});
				}} />
		</div>
	</>
}

function impreciseFormatOklch(color: culori.Color) {
	const oklch = culori.oklch(color);
	return `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(3)} ${(oklch.h || 0).toFixed(1)})`;
}

function setOklchHue(c: culori.Color, hue: number): culori.Color {
	const input = culori.oklch(c);
	const shifted: culori.Oklch = {
		mode: "oklch",
		l: input.l,
		c: input.c,
		h: ((hue % 360) + 360) % 360,
	};
	return culori.clampChroma(shifted, "oklch", "rgb");
}

function setHslNonHue(c: culori.Color, match: culori.Hsl): culori.Hsl {
	const hsl = culori.hsi(c);
	return {
		mode: "hsl",
		h: hsl.h,
		s: match.s,
		l: match.l,
	};
}

function Triad() {
	const [hslHue, hslHueSet] = useState(0);

	const angles = [180, 0, 120, 240];

	const hslTriad: culori.Hsl[] = angles.map(angle => {
		return { mode: "hsl", h: hslHue + angle, s: 0.8, l: 0.5 }
	});

	const oklchHue = culori.oklch(hslTriad[angles.indexOf(0)]).h!;

	const oklchTriad: culori.Color[] = hslTriad.map((color, i) => {
		const bestHue = binarySearchNearest(
			hslHue + angles[i],
			h => {
				const hsl: culori.Hsl = {
					mode: "hsl",
					h,
					s: color.s,
					l: color.l,
				};
				const targetHue = oklchHue + angles[i];
				return hueDistance(culori.oklch(hsl).h!, targetHue);
			},
		);
		return {
			mode: "hsl",
			h: bestHue,
			s: color.s,
			l: color.l,
		};;
	});

	const buttonContent = (color: culori.Color, i: number) => {
		const oklchHueDifference =
			(360 + culori.oklch(color).h! - oklchHue) % 360;
		return <div style={{ fontSize: "80%", lineHeight: "120%" }}>
			{culori.formatHex(color)}<br />
			{culori.formatHsl(color)}<br />
			{impreciseFormatOklch(color)}<br />
			<br />
			<br />
			+{oklchHueDifference.toFixed(1)}&deg; in OKLCH
		</div>
	};

	return <div className="section">
		<b>HSL Hue:</b> {hslHue.toFixed(1)}&deg;<br /><br />
		<ColorRangeInput range={{ low: 0, high: 360 }}
			colorF={function (value: number): culori.Color {
				return {
					mode: "hsl",
					h: value,
					s: 0.8,
					l: 0.5,
				};
			}}
			value={hslHue}
			changeValue={function (newValue: number): void {
				hslHueSet(newValue);
			}}
			clampMode="wrap" />
		<br />
		<b>Simple HSL Complementary + Triad:</b>
		<SwatchButtonRow
			elements={hslTriad.map(color => ({ color, flexBasis: 1 }))}
			aspectRatio={0.5}
			onClick={() => { }}
			buttonContent={buttonContent}
		/>
		<br />
		<b>Adjusted Complementary + Triad using OKLCH Hues:</b>
		<SwatchButtonRow
			elements={oklchTriad.map(color => ({ color, flexBasis: 1 }))}
			aspectRatio={0.5}
			onClick={() => { }}
			buttonContent={buttonContent}
		/>
	</div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<HueSelectors />
		<br />
		<Triad />
	</React.StrictMode>
);
