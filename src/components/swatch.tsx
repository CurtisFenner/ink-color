import * as culori from "culori";
import { contrastCSS } from "../util";
import { useCallback } from "react";

export type SwatchButtonProps = {
	color: culori.Color,
	flexBasis: number,
	aspectRatio: number,
	onClick: () => void,
	highlight?: boolean,
};

export function SwatchButton(props: SwatchButtonProps) {
	return <button className={
		["round-slight outline-dark shadow"]
			.concat(["highlighted"].filter(_ => props.highlight))
			.join(" ")
	}
		onClick={() => props.onClick()}
		style={{
			border: "none",
			"--palette": culori.formatHex(props.color),
			background: "var(--palette)",
			textAlign: "center",
			alignItems: "center",
			justifyContent: "center",
			fontWeight: "bold",
			display: "flex",
			flex: `${props.flexBasis} 0`,
			padding: 0,
			"--color-contrast": contrastCSS(props.color),
			color: "var(--color-contrast)",
			aspectRatio: 1 / (props.aspectRatio / props.flexBasis),
		}}>
		{culori.formatHex(props.color)}
	</button>
}

export type SwatchButtonRowProps = {
	elements: { color: culori.Color, flexBasis: number }[],
	aspectRatio: number,
	onClick: (i: number, element: { color: culori.Color, flexBasis: number }) => void,
	highlighting?: Set<number>,
};

export function SwatchButtonRow(props: SwatchButtonRowProps) {
	return <div
		style={{
			display: "flex",
			justifyContent: "space-between",
			gap: "1rem",
		}}>
		{
			props.elements.map((element, i) => {
				return <SwatchButton
					onClick={useCallback(() => props.onClick(i, element), [])}
					key={i}
					color={element.color}
					flexBasis={element.flexBasis}
					aspectRatio={props.aspectRatio}
					highlight={props.highlighting?.has(i)} />
			})
		}
	</div>;
}
