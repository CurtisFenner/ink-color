import * as culori from "culori";
import { contrastCSS } from "../util";
import React, { useCallback } from "react";

export type SwatchButtonProps = {
	color: culori.Color,
	flexBasis: number,
	aspectRatio: number,
	onClick: () => void,
	highlight?: boolean,
	children?: React.ReactNode,
};

export function SwatchButton(props: SwatchButtonProps) {
	return <div tabIndex={0} className={
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
		{props.children}
	</div>
}

export type SwatchButtonRowProps = {
	elements: { color: culori.Color, flexBasis: number }[],
	aspectRatio: number,
	onClick: (i: number, element: { color: culori.Color, flexBasis: number }) => void,
	highlighting?: Set<number>,
	buttonContent?: (color: culori.Color, i: number) => React.ReactNode,
};

export function defaultButtonContent(color: culori.Color): React.ReactNode {
	return culori.formatHex(color);
}

export function SwatchButtonRow(props: SwatchButtonRowProps) {
	return <div
		style={{
			display: "flex",
			justifyContent: "space-between",
			gap: "0.5rem",
		}}>
		{
			props.elements.map((element, i) => {
				return <SwatchButton
					onClick={useCallback(() => props.onClick(i, element), [])}
					key={i}
					color={element.color}
					flexBasis={element.flexBasis}
					aspectRatio={props.aspectRatio}
					highlight={props.highlighting?.has(i)}>
					{(props.buttonContent || defaultButtonContent)(element.color, i)}
				</SwatchButton>
			})
		}
	</div>;
}
