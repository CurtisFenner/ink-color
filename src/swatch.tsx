import * as culori from "culori";
import { MouseEventLike, UseClickDrag, contrastCSS, useWindowEvent } from "./util";
import { useCallback, useState } from "react";

export type ColorRangeInputProps = {
	range: { low: number, high: number },
	colorF: (value: number) => culori.Color,
	value: number,
	changeValue: (newValue: number) => void,
	classNames?: string[],
};

export function ColorRangeInput(
	props: ColorRangeInputProps,
) {
	const valueToProportion = (x: number) => (x - props.range.low) / (props.range.high - props.range.low);

	const updateFromDx = useCallback((e: MouseEventLike, base: HTMLElement) => {
		const dx = e.clientX - base.getBoundingClientRect().left;
		const dp = dx / base.clientWidth;
		const newValue = dp * (props.range.high - props.range.low) + props.range.low;
		const clamped = Math.max(props.range.low, Math.min(newValue, props.range.high));
		props.changeValue(clamped);
	}, [props.changeValue]);

	const useClickDrag = new UseClickDrag<HTMLElement>(updateFromDx);

	const colorStops = makeLinearStops(props.range, 32, e => ({ color: props.colorF(e) }));

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
			}} />
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
			}} />
	</>
}
