import * as culori from "culori";
import { MouseEventLike, UseClickDrag, contrastCSS, useWindowEvent } from "./util";
import { useCallback, useEffect, useState } from "react";

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

	const wrapIfWrap = (x: number) => {
		if (props.clampMode !== "wrap") {
			return x;
		}
		const rangeSize = props.range.high - props.range.low;
		const fromLow = x - props.range.low;
		return props.range.low + (((fromLow % rangeSize) + rangeSize) % rangeSize);
	};

	const updateFromDx = useCallback((e: MouseEventLike, base: HTMLElement) => {
		const rangeSize = props.range.high - props.range.low;
		const dx = e.clientX - base.getBoundingClientRect().left;
		const dp = dx / base.clientWidth;
		const newValue = dp * rangeSize + props.range.low;
		const fromLow = newValue - props.range.low;

		const finished = props.clampMode === "wrap"
			? wrapIfWrap(newValue)
			: Math.max(0, Math.min(fromLow, rangeSize)) + props.range.low;
		props.changeValue(finished);
	}, [props.changeValue]);

	const useClickDrag = new UseClickDrag<HTMLElement>(updateFromDx);

	const colorStops = makeLinearStops(props.range, 36, e => ({ color: props.colorF(e) }));

	const gradientStops = colorStops.map(stop => {
		return culori.formatHex(stop.color) + " " + (valueToProportion(stop.value) * 100).toFixed(1) + "%";
	});
	const background = `linear-gradient(to right in oklab, ${gradientStops.join(", ")})`;

	const wrappedValue = props.clampMode === "wrap"
		? wrapIfWrap(props.value)
		: props.value;

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
							"--color-contrast": contrastCSS(props.colorF(wrappedValue)),
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
					background: culori.formatHex(props.colorF(wrappedValue)),
					"--color-contrast": contrastCSS(props.colorF(wrappedValue)),
					left: (valueToProportion(wrappedValue) * 100).toFixed(3) + "%",
				}}
				className="handle outline-contrast round-slight shadow"></div>
		</div>
	</>
}

export type ColorSlidersInput = {
	initialColor: culori.Oklch,
	onChange: (newColor: culori.Oklch) => void,
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
	const [currentLCH, updateLCHInternal] = useState(culori.oklch(props.initialColor));

	const updateLCH = (colorF: (old: culori.Oklch) => culori.Oklch) => {
		updateLCHInternal(colorF);
	};
	useEffect(() => props.onChange(currentLCH), [JSON.stringify(currentLCH)]);

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
