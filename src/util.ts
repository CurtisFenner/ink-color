import * as culori from "culori";
import { useCallback, useEffect, useState } from "react";

export function contrastCSS(color: culori.Color): "var(--color-light)" | "var(--color-dark)" {
	return culori.oklch(color).l < 0.6
		? "var(--color-light)"
		: "var(--color-dark)"
}

type WindowEventHandler<Event extends keyof WindowEventMap> =
	(e: WindowEventMap[Event]) => void;

export type MouseEventLike = {
	clientX: number,
	clientY: number,
};

const useWindowEventListeners =
	new Map<string, Map<WindowEventHandler<keyof WindowEventMap>, number>>();

export function useWindowEvent<Event extends keyof WindowEventMap>(event: Event, f: WindowEventHandler<Event>): void {
	let listeners = useWindowEventListeners.get(event);
	if (listeners === undefined) {
		listeners = new Map();
		useWindowEventListeners.set(event, listeners);
		window.addEventListener(event, (e) => {
			for (const [listener, count] of listeners!) {
				if (count > 0) {
					listener(e);
				}
			}
		});
	}

	useEffect(() => {
		const key = f as WindowEventHandler<keyof WindowEventMap>;
		listeners.set(key, (listeners.get(key) || 0) + 1);
		return () => {
			listeners.set(key, (listeners.get(key) || 0) - 1);
			if (listeners.get(key) === 0) {
				listeners.delete(key);
			}
		};
	});
}

export class UseClickDrag<Q> {
	private setDragFrom: (updated: { q: Q } | null) => void;

	constructor(
		private callback: (e: MouseEventLike, q: Q) => void,
	) {
		const [dragFrom, setDragFrom] = useState<null | { q: Q }>(null);
		this.setDragFrom = setDragFrom;

		useWindowEvent("mouseup", useCallback(() => setDragFrom(null), [setDragFrom]));
		useWindowEvent("blur", useCallback(() => setDragFrom(null), [setDragFrom]));
		useWindowEvent("mousemove", useCallback((e) => {
			if (dragFrom === null) {
				return;
			}
			callback(e, dragFrom.q);
		}, [setDragFrom, dragFrom]));
	}

	startClick(e: MouseEventLike, q: Q): void {
		this.setDragFrom({ q });
		this.callback(e, q);
	}
}

export function adjustScrolls(element: Element, targetViewY: number): void {
	let parent = element.parentElement;
	while (parent) {
		const y = element.getBoundingClientRect().top;
		const dy = targetViewY - y;
		if (Math.round(dy) === 0) {
			break;
		}

		parent.scrollTop -= dy;
		parent = parent.parentElement;
	}
}

export function maintainScroll(element: Element) {
	const beforeTop = element.getBoundingClientRect().top;
	let stop = false;

	function frame() {
		adjustScrolls(element, beforeTop);
		if (!stop) {
			requestAnimationFrame(frame);
		}
	}
	requestAnimationFrame(frame);
	setTimeout(() => requestIdleCallback(() => { stop = true; }), 2);
}

export function hueDistance(a: number, b: number) {
	const delta = mod(b - a, 360);
	return Math.min(
		Math.abs(delta),
		Math.abs(delta - 360),
	)
}

export function binarySearchNearest(
	initial: number,
	error: (x: number) => number,
	size: number = 360,
	epsilon = 1e-6,
): number {
	let x = initial;
	let jump = size;
	while (jump > epsilon) {
		for (const guess of [x - jump, x + jump]) {
			const e = error(guess);
			if (e < error(x)) {
				x = guess;
			}
		}

		jump /= 2;
	}
	return x;
}

export function mod(a: number, b: number) {
	return ((a % b) + b) % b;
}

export function distributeIntegers(
	distribute: number,
	weights: number[],
) {
	let total = 0;
	for (const w of weights) {
		total += w;
	}

	distribute -= weights.length;
	const out = [];
	for (const w of weights) {
		const p = w / total;
		const m = Math.round(distribute * p);
		out.push(m + 1);
		distribute -= m;
		total -= w;
	}
	return out;
}

export type Chromatic = culori.Color & { h: number };

export function wrappingInterpolate(array: number[], wrapAt: number): (degrees: number) => number {
	const samples = [...array, array[0] + wrapAt];
	const wedge = wrapAt / (samples.length - 1);
	return (degrees: number) => {
		degrees = mod(degrees, wrapAt);
		const i0 = Math.floor(degrees / wedge);
		const i1 = i0 + 1;
		const p = (degrees - i0 * wedge) / wedge;
		return mod(samples[i0] * (1 - p) + p * samples[i1], wrapAt);
	};
}
