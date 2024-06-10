import * as culori from "culori";
import { ColorSlidersInput } from "../color-range";
import { SwatchButtonRow } from "./swatch";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { maintainScroll } from "../util";

export type EditorProps = {
	initialColors: culori.Oklch[],
};

type HistoryEntry = {
	at: number,
	colors: culori.Oklch[],
	changedIndex: null | number,
};

type History = {
	entries: HistoryEntry[],
	commitableAfter: number,
};

function colorsToKey(colors: culori.Oklch[]): string {
	return colors.map(c => culori.formatHex(c)).join("/");
}

const STABLE_AFTER_MS = 5000;

export function Editor(props: EditorProps) {
	const [history, setHistory] = useState<History>({ entries: [], commitableAfter: 0 });

	const containerRef = useRef<HTMLDivElement>(null);

	const markHistoryCommitable = () => {
		setHistory(oldHistory => {
			return {
				entries: oldHistory.entries,
				commitableAfter: 0,
			};
		});
	};

	useEffect(() => {
		const x = containerRef.current;
		if (x === null) {
			return;
		}
		const ro = new ResizeObserver((a, b) => {
			console.log("ResizeObserver:", a, b);
		});
		ro.observe(x, {});
	}, [containerRef.current]);

	const appendHistoryIfFresh = (colors: culori.Oklch[], changedIndex: number | null) => {
		setHistory(oldHistory => {
			const topKey = colorsToKey(oldHistory.entries[oldHistory.entries.length - 1]?.colors || []);
			const colorKey = colorsToKey(colors);
			if (colorKey !== topKey) {
				if (Date.now() > oldHistory.commitableAfter) {
					const newEntry: HistoryEntry = {
						at: Date.now(),
						colors,
						changedIndex,
					};

					// Append a new history.
					const currentContainer = containerRef.current;
					if (currentContainer !== null) {
						maintainScroll(currentContainer)
					};
					const newEntries = [...oldHistory.entries, newEntry];
					return {
						entries: newEntries,
						commitableAfter: Date.now() + STABLE_AFTER_MS,
					};
				} else {
					// Don't add a history row, but note that it is being
					// continuously updated
					return {
						entries: oldHistory.entries,
						commitableAfter: Date.now() + STABLE_AFTER_MS,
					};
				}
			}
			return oldHistory;
		});
	};

	const [swatch, setSwatchInternal] = useState(props.initialColors);
	const [highlighted, setHighlightedInternal] = useState(0);

	const setHighlighted = (newHighlighted: number) => {
		setHighlightedInternal(oldHighlighted => {
			if (oldHighlighted !== newHighlighted) {
				markHistoryCommitable();
			}
			return newHighlighted;
		});
	};

	const setSwatch = (index: number, newColor: culori.Oklch) => {
		setSwatchInternal(oldSwatch => {
			const out = [...oldSwatch];
			const oldColor = oldSwatch[index];
			if (colorsToKey([oldColor]) !== colorsToKey([newColor])) {
				appendHistoryIfFresh(oldSwatch, index);
			}
			out[index] = newColor;
			return out;
		});
	};

	return <>
		{
			history.entries.map((entry, i) => <Fragment key={i}>
				<SwatchButtonRow
					key={i}
					elements={entry.colors.map(color => ({ color, flexBasis: 1 }))}
					aspectRatio={0.25}
					onClick={() => { }}
				/>
				<br />
			</Fragment>)
		}
		<SwatchButtonRow
			elements={swatch.map(x => ({ color: x, flexBasis: 1 }))}
			aspectRatio={1}
			onClick={(i) => setHighlighted(i)}
			highlighting={new Set([highlighted])}
		/>
		<br />
		<div style={{
			height: "35vh",
		}}
			ref={containerRef}>
			<ColorSlidersInput
				key={highlighted}
				initialColor={swatch[highlighted]}
				onChange={useCallback(newColor => setSwatch(highlighted, newColor), [highlighted])} />
		</div>
	</>;
}
