import * as culori from "culori";
import { MouseEventLike, UseClickDrag, contrastCSS, useWindowEvent } from "./util";
import { useCallback, useState } from "react";

export type ColorRangeInputProps = {
	range: { low: number, high: number },
	invalidRanges?: { low: number, high: number }[],
	colorF: (value: number) => culori.Color,
	value: number,
	changeValue: (newValue: number) => void,
	classNames?: string[],
	clampMode?: "clamp" | "wrap",
};

export function ColorRangeInput(
	props: ColorRangeInputProps,
) {
	const valueToProportion = (x: number) => (x - props.range.low) / (props.range.high - props.range.low);

	const updateFromDx = useCallback((e: MouseEventLike, base: HTMLElement) => {
		const rangeSize = props.range.high - props.range.low;
		const dx = e.clientX - base.getBoundingClientRect().left;
		const dp = dx / base.clientWidth;
		const newValue = dp * rangeSize + props.range.low;
		const fromLow = newValue - props.range.low;
		const clampedFromLow = props.clampMode === "wrap"
			? ((fromLow % rangeSize) + rangeSize) % rangeSize
			: Math.max(0, Math.min(fromLow, rangeSize));
		props.changeValue(clampedFromLow + props.range.low);
	}, [props.changeValue]);

	const useClickDrag = new UseClickDrag<HTMLElement>(updateFromDx);

	const colorStops = makeLinearStops(props.range, 16, e => ({ color: props.colorF(e) }));

	const gradientStops = colorStops.map(stop => {
		return culori.formatCss(stop.color) + " " + (valueToProportion(stop.value) * 100).toFixed(1) + "%";
	});
	const background = `linear-gradient(to right in oklab, ${gradientStops.join(", ")})`;
	return <>
		<div
			tabIndex={0}
			onMouseDown={e => {
				useClickDrag.startClick(e, e.currentTarget);
				e.preventDefault();
			}}
			className={["color-range-input", ...(props.classNames || [])].join(" ")}
			style={{
				background,
			}}>
			{
				(props.invalidRanges || [])
					.filter(range => range.low < props.range.high && range.high > props.range.low && range.low < range.high)
					.map(range => ({ low: Math.max(props.range.low, range.low), high: Math.min(props.range.high, range.high) }))
					.map((invalidRange, i) => {
						return <div key={i} className="outline-contrast" style={{
							"--color-contrast": contrastCSS(props.colorF(props.value)),
							position: "absolute",
							opacity: 0.75,
							top: 0,
							height: "100%",
							left: (valueToProportion(invalidRange.low) * 100).toFixed(1) + "%",
							right: (100 - valueToProportion(invalidRange.high) * 100).toFixed(1) + "%",
						}}>
							<div className="background-hatch" style={{
								position: "absolute",
								background: "var(--color-contrast)",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
							}}></div>
						</div>
					})
			}
			<div
				style={{
					background: culori.formatCss(props.colorF(props.value)),
					"--color-contrast": contrastCSS(props.colorF(props.value)),
					left: (valueToProportion(props.value) * 100).toFixed(3) + "%",
				}}
				className="handle outline-contrast round-slight shadow"></div>
		</div>
	</>
}

export type ColorSlidersInput = {
	initialColor: culori.Oklab,
};

function makeLinearStops<O extends object>(
	range: { low: number, high: number },
	count: number,
	f: (value: number) => O,
): (O & { value: number })[] {
	const out = [];
	for (let i = 0; i < count; i++) {
		const t = i / (count - 1);
		const value = (range.high - range.low) * t + range.low;
		out.push({
			...f(value),
			value,
		});
	}
	return out;
}

export function ColorSlidersInput(
	props: ColorSlidersInput,
) {
	// Lightness: [0, 1]
	// Chroma: [0, 0.4]
	// Hue: [0, 360]

	const [currentLCH, updateLCH] = useState(culori.oklch(props.initialColor));

	const clampChromaLow = culori.clampChroma({ ...currentLCH, c: 0 }, "oklch", "rgb");
	const clampChromaHigh = culori.clampChroma({ ...currentLCH, c: 1 }, "oklch", "rgb");

	return <>
		<ColorRangeInput
			classNames={["outline-dark", "shadow"]}
			value={currentLCH.l}
			range={{ low: 0, high: 1 }}
			changeValue={newL => updateLCH(c => ({ ...c, l: newL }))}
			colorF={l => {
				return {
					mode: "oklch",
					l,
					c: currentLCH.c,
					h: currentLCH.h,
				};
			}} />
		<br />
		<ColorRangeInput
			classNames={["outline-dark", "shadow"]}
			value={currentLCH.c}
			changeValue={newC => updateLCH(c => ({ ...c, c: newC }))}
			range={{ low: 0, high: 0.4 }}
			colorF={c => {
				return {
					mode: "oklch",
					l: currentLCH.l,
					c,
					h: currentLCH.h,
				};
			}}
			invalidRanges={[
				{ low: 0, high: clampChromaLow.c },
				{ low: clampChromaHigh.c, high: 1 },
			]} />
		<br />
		<ColorRangeInput
			classNames={["outline-dark", "shadow"]}
			value={currentLCH.h || 0}
			changeValue={newH => updateLCH(c => ({ ...c, h: newH }))}
			range={{ low: 0, high: 360 }}
			colorF={h => {
				return {
					mode: "oklch",
					l: currentLCH.l,
					c: currentLCH.c,
					h,
				};
			}}
			clampMode="wrap" />
	</>
}