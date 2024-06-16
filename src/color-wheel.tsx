import * as culori from "culori";

import ReactDOM from "react-dom/client";
import React, { useState } from "react";
import { ColorRangeInput } from "./color-range";
import { Chromatic, binarySearchNearest, hueDistance, mod, wrappingInterpolate } from "./util";
import { SwatchButtonRow } from "./components/swatch";

abstract class ChromaticPalette<C extends Chromatic> {
	/**
	 * @param parameter between 0 and 1, enumerating the full hue space.
	 */
	abstract fromParameter(parameter: number): C;

	findParameterForF(f: (color: C) => number, v: number): number {
		return binarySearchNearest(
			0.5,
			guess => {
				const p = mod(guess, 1);
				const color = this.fromParameter(p);
				return hueDistance(f(color), v);
			},
			0.5
		);
	}

	findParameterForHue(hue: number): number {
		return this.findParameterForF(x => x.h, hue);
	}
}

const hslSimplePalette = new class HslSimplePalette extends ChromaticPalette<culori.Hsl & Chromatic> {
	fromParameter(parameter: number): culori.Hsl & Chromatic {
		return {
			mode: "hsl",
			h: parameter * 360,
			s: 0.8,
			l: 0.5,
		};
	}
};

const oklchSimpleMaxChromaPalette = new class OklchSimplePalette extends ChromaticPalette<culori.Oklch & Chromatic> {
	fromParameter(parameter: number): culori.Oklch & Chromatic {
		return culori.clampChroma({
			mode: "oklch",
			l: 0.5,
			c: 0.4,
			h: parameter * 360,
		}, "oklch", "rgb");
	}
}

abstract class ColorWheel<C extends Chromatic> {
	/**
	 * Convert from a "geometric" angle to a color described by this color
	 * wheel.
	 */
	abstract fromAngleDegrees(degrees: number): C;

	abstract toAngleDegrees(color: C): number;

	fromHue(hue: number): C {
		const bestAngle = binarySearchNearest(
			hue,
			angleGuess => {
				const color = this.fromAngleDegrees(angleGuess);
				return hueDistance(color.h, hue);
			},
			180
		);
		return this.fromAngleDegrees(bestAngle);
	}
}

class ColorWheelFromPaletteGeometry<C extends Chromatic> extends ColorWheel<C> {
	constructor(
		private palette: ChromaticPalette<C>,
		private angleToParameter: (angleDegrees: number) => number,
	) { super(); }

	fromAngleDegrees(degrees: number): C {
		return this.palette.fromParameter(this.angleToParameter(degrees));
	}

	toAngleDegrees(color: C): number {
		const parameter = this.palette.findParameterForHue(color.h);
		return binarySearchNearest(parameter * 360, guessAngle => {
			const guessColor = this.fromAngleDegrees(guessAngle);
			return hueDistance(guessColor.h, color.h);
		}, 180);
	}
}

class PaintersHSLWheel extends ColorWheelFromPaletteGeometry<culori.Hsl & Chromatic> {
	static hueFromAngle = wrappingInterpolate([
		// Red
		0,
		// Yellow
		60,
		// Blue (halfway between cyan and pure blue)
		210,
	], 360);

	constructor(palette: ChromaticPalette<culori.Hsl & Chromatic> = hslSimplePalette) {
		super(
			palette,
			angle => {
				const hue = PaintersHSLWheel.hueFromAngle(angle);
				const parameter = hue / 360;
				return parameter;
			}
		);
	}
}

class AdobeColorHSLWheel extends ColorWheelFromPaletteGeometry<culori.Hsl & Chromatic> {
	static hueFromAngle = wrappingInterpolate([
		0,
		8,
		17,
		26,
		34,
		41,
		48,
		54,
		60,
		81,
		103,
		123,
		138,
		155,
		171,
		187,
		204,
		219,
		234,
		251,
		267,
		282,
		298,
		329,
	], 360);

	constructor(palette: ChromaticPalette<culori.Hsl & Chromatic> = hslSimplePalette) {
		super(
			palette,
			angle => {
				const hue = AdobeColorHSLWheel.hueFromAngle(angle);
				const parameter = hue / 360;
				return parameter;
			}
		);
	}
}

function impreciseFormatOklch(color: culori.Color) {
	const oklch = culori.oklch(color);
	return `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(3)} ${mod(oklch.h || 0, 360).toFixed(1)})`;
}

function Triad() {
	const [paletteParameter, setPaletteParameter] = useState(0);

	const updateHueWithColorFromPalette = (newColor: culori.Color) => {
		const newParameter = hslSimplePalette.findParameterForHue(culori.hsl(newColor).h || 0);
		setPaletteParameter(mod(newParameter, 1));
	};

	const wheels = [
		{
			title: "HSL",
			wheel: new ColorWheelFromPaletteGeometry(hslSimplePalette, angle => angle / 360),
		},
		{
			title: "OKLCH",
			wheel: new ColorWheelFromPaletteGeometry(
				hslSimplePalette,
				angle => hslSimplePalette.findParameterForF(color => {
					return culori.oklch(color).h || 0;
				},
					angle)
			),
		},
		{
			title: "Painter's HSL",
			wheel: new PaintersHSLWheel(hslSimplePalette),
		},
	];

	const buttonContent = (color: culori.Color, i: number) => {
		const hsl = culori.hsl(color);
		hsl.h = mod(hsl.h || 0, 360);
		return <div style={{ fontSize: "80%", lineHeight: "120%" }}>
			{culori.formatHex(color)}<br />
			{culori.formatHsl(hsl)}<br />
			{impreciseFormatOklch(color)}
		</div>
	};

	const angles = [0, 120, 240, 180];

	return <div className="section">
		{
			wheels.map(({ title, wheel }, wheelI) => {
				const zero = wheel.toAngleDegrees(hslSimplePalette.fromParameter(0));
				const currentWheelAngle = mod(wheel.toAngleDegrees(hslSimplePalette.fromParameter(paletteParameter)), 360);
				return <React.Fragment key={wheelI}>
					<b>{title} Hue:</b> {currentWheelAngle.toFixed(1)}&deg;<br /><br />
					<ColorRangeInput range={{ low: zero || 0, high: (zero || 0) + 360 }}
						colorF={x => wheel.fromAngleDegrees(x)}
						value={currentWheelAngle}
						changeValue={function (newValue: number, newColor: culori.Color): void {
							updateHueWithColorFromPalette(newColor);
						}}
						clampMode="wrap" />
					<br />
					<SwatchButtonRow
						elements={angles.map(angle => {
							return {
								color: wheel.fromAngleDegrees(currentWheelAngle + angle),
								flexBasis: 1,
							};
						})}
						aspectRatio={0.5}
						onClick={() => { }}
						buttonContent={buttonContent}
					/>
					<hr />
				</React.Fragment>;
			})
		}
	</div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Triad />
	</React.StrictMode>
);
