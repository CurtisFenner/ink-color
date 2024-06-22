import * as culori from "culori"
import { contrastCSS } from "../util";

export type ColorChipProps = {
	color: culori.Color,
};

export function ColorChip(props: ColorChipProps) {
	const contrast = contrastCSS(props.color);
	return <div
		style={{
			display: "inline-block",
			color: contrast,
			border: `1px solid ${contrast}`,
			padding: "0.125em",
			fontWeight: "bold",
			backgroundColor: culori.formatHex(props.color),
		}}
		className="round-slight"
	>{culori.formatHex(props.color)}</div>;
}
