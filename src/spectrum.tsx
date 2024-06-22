import * as culori from "culori";
import { distributeIntegers, mod } from "./util";
import { CSSProperties, useCallback, useEffect, useReducer, useRef, useState } from "react";

export type SpectrumAnalysis = {
	hues: {
		hue: number,
		lightnessDistribution: { lightness: number, weight: number, chromas: number[] }[],
		weight: number,
	}[],
};

export function analyzeSpectrum(imageData: ImageData, strength = 1): SpectrumAnalysis {
	const colors = [];
	for (let i = 0; i < imageData.data.length; i += 4) {
		const red = imageData.data[i + 0];
		const green = imageData.data[i + 1];
		const blue = imageData.data[i + 2];
		const alpha = imageData.data[i + 3];
		const color: culori.Rgb = {
			mode: "rgb",
			r: red / 255,
			g: green / 255,
			b: blue / 255,
			alpha: alpha / 255,
		};
		colors.push(color);
	}

	const HUE_BUCKET_COUNT = 36;
	const HUE_BUCKET_SIZE = 360 / HUE_BUCKET_COUNT;

	const LIGHTNESS_BUCKET_COUNT = 7;
	const LIGHTNESS_BUCKET_SIZE = 1 / LIGHTNESS_BUCKET_COUNT;

	const colorWeight = (c: culori.Oklch): number => {
		const a = c.alpha === undefined
			? 1
			: c.alpha;
		return Math.pow(Math.max(0, c.c), strength) * a;
	};

	const byHue = new Histogram<number, culori.Rgb>(rgb => {
		const oklch = culori.oklch(rgb);
		const weight = colorWeight(oklch);
		return {
			key: (Math.floor(mod(oklch.h || 0, 360) / HUE_BUCKET_SIZE) + 0.5) * HUE_BUCKET_SIZE,
			weight,
		};
	});

	for (const color of colors) {
		byHue.add(color);
	}

	const out = [];
	for (const [hue, bucket] of byHue.buckets) {
		const byLightness = new Histogram<number, culori.Rgb>(rgb => {
			const oklch = culori.oklch(rgb);
			const weight = colorWeight(oklch);
			return {
				key: (Math.floor(oklch.l / LIGHTNESS_BUCKET_SIZE) + 0.5) * LIGHTNESS_BUCKET_SIZE,
				weight,
			};
		});
		for (const e of bucket.elements) {
			byLightness.add(e.value);
		}

		const lightnessDistribution = [];
		for (const [lightness, bucket] of byLightness.buckets) {
			lightnessDistribution.push({
				lightness,
				chromas: bucket.elements.map(x => culori.oklch(x.value).c).sort((a, b) => a - b),
				weight: bucket.totalWeight / byLightness.totalWeight,
			});
		}

		out.push({
			hue,
			lightnessDistribution: lightnessDistribution.sort((a, b) => a.lightness - b.lightness),
			weight: bucket.totalWeight / byHue.totalWeight,
		});
	}
	return { hues: out.sort((a, b) => a.hue - b.hue) };
}

type HistogramElement<T> = {
	value: T,
	weight: number,
};

type HistogramBucket<T> = {
	totalWeight: number,
	elements: HistogramElement<T>[],
};

class Histogram<K, T> {
	buckets = new Map<K, HistogramBucket<T>>();
	constructor(private toBucket: (t: T) => { weight: number, key: K }) { }
	public totalWeight: number = 0;

	add(element: T) {
		const { key, weight } = this.toBucket(element);
		if (weight <= 0) {
			return;
		}

		const bucket = this.buckets.get(key) || { totalWeight: 0, elements: [] };
		bucket.elements.push({ weight, value: element });
		bucket.totalWeight += weight;
		this.totalWeight += weight;
		this.buckets.set(key, bucket);
	}
}

{
	const h = new Histogram<string, string>(s => {
		return {
			weight: s.length,
			key: s[0],
		};
	});

	h.add("hello");
	h.add("cat");
	h.add("");
	h.add("coral");
	const buckets = [...h.buckets];
	if (buckets.length !== 2) {
		throw new Error(
			"expected 2 buckets but got " + buckets.length + ": " + JSON.stringify(buckets.map(x => x[0]))
		);
	}
	if (buckets[0][0] !== "h") {
		throw new Error("expected first bucket to be for h");
	}
	if (buckets[1][0] !== "c") {
		throw new Error("expected second bucket to be for c");
	}
}

let recentAnalysis: null | SpectrumAnalysis = null;
const recentAnalysisSubscriptions = new Set<(analysis: SpectrumAnalysis | null) => void>();
export function subscribeToAnalysis(f: (analysis: SpectrumAnalysis | null) => void) {
	recentAnalysisSubscriptions.add(f);
	f(recentAnalysis);
}

export function updateLatestAnalysis(analysis: SpectrumAnalysis | null) {
	recentAnalysis = analysis;
	for (const f of recentAnalysisSubscriptions) {
		try {
			f(recentAnalysis);
		} catch (e) {
			console.error("error updating", f, ":", e);
		}
	}
}

export function useLatestAnalysis(): SpectrumAnalysis | null {
	const [latest, setLatest] = useState(recentAnalysis);
	useEffect(() => {
		const f = (x: SpectrumAnalysis | null) => setLatest(x);
		recentAnalysisSubscriptions.add(f);
		return () => {
			recentAnalysisSubscriptions.delete(f);
		};
	}, []);
	return latest;
}

export function SpectrumRender(props: {}) {
	const analysis = useLatestAnalysis();

	const canvasClientWidth = useState(640);
	const canvasClientHeight = useState(480);

	const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
		canvasClientWidth[1](canvas.clientWidth);
		canvasClientHeight[1](canvas.clientHeight);

		ctx.reset();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (!analysis) {
			return;
		}

		const widths = distributeIntegers(canvas.width - analysis.hues.length - 1, analysis.hues.map(x => x.weight));

		ctx.translate(1, 0);

		const middleElement = (array: number[]): number => {
			return array[Math.floor(array.length / 2)];
		};

		analysis.hues.forEach((hueBucket, i) => {
			const width = widths[i];
			const heights = distributeIntegers(canvas.height - hueBucket.lightnessDistribution.length - 1, hueBucket.lightnessDistribution.map(x => x.weight));
			ctx.save();
			ctx.translate(0, 1);
			hueBucket.lightnessDistribution.forEach((lightness, j) => {
				const color: culori.Oklch = culori.clampChroma({
					mode: "oklch",
					h: hueBucket.hue,
					c: middleElement(lightness.chromas),
					l: lightness.lightness,
				}, "oklch", "rgb");

				const height = heights[j];
				ctx.fillStyle = culori.formatHex(color);
				ctx.fillRect(0, 0, width, height);
				ctx.translate(0, height);
				ctx.translate(0, 1);
			});
			ctx.restore();
			ctx.translate(width, 0);
			ctx.translate(1, 0);
		});
	};

	return <div>
		<div className="shadow round-slight" style={{
			position: "relative",
			aspectRatio: 64 / 9,
			background: "var(--color-dark)",
		}}>
			<Canvas
				width={canvasClientWidth[0]}
				height={canvasClientHeight[0]}
				draw={useCallback(render, [analysis, canvasClientWidth[0], canvasClientHeight[0]])}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
				}}
			/>
		</div>
	</div>
}

export type CanvasProps = {
	width: number,
	height: number,
	draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
	style?: CSSProperties,
};
export function Canvas(props: CanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const canvas = canvasRef.current;
	const context = canvas?.getContext("2d");
	useEffect(() => {
		if (context) {
			props.draw(context, canvas!);
		}
	}, [props.draw]);
	return <canvas ref={canvasRef} width={props.width} height={props.height} style={props.style}></canvas>
}
