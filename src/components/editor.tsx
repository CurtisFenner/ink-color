import * as culori from "culori";
import { ColorSlidersInput } from "../color-range";
import { SwatchButtonRow } from "./swatch";
import { useCallback, useEffect, useRef, useState } from "react";

export type EditorProps = {
	initialColors: culori.Oklch[],
};

export function Editor(props: EditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const x = containerRef.current;
		if (x === null) {
			return;
		}
	}, [containerRef.current]);

	const [swatch, setSwatchInternal] = useState(props.initialColors);
	const [highlighted, setHighlightedInternal] = useState(0);

	const setHighlighted = (newHighlighted: number) => {
		setHighlightedInternal(oldHighlighted => {
			return newHighlighted;
		});
	};

	const setSwatch = (index: number, newColor: culori.Oklch) => {
		setSwatchInternal(oldSwatch => {
			const out = [...oldSwatch];
			out[index] = newColor;
			return out;
		});
	};

	return <>
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
