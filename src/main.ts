import * as culori from "culori";

function main() {
	const oklab = culori.converter("oklab");
	const orange = oklab("orange");
	console.log(orange);
}

main();
