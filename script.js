import { dom } from "./dom.js";

const frame = document.querySelector("iframe");
const codeEl = document.querySelector("#code");
const interfaceEl = document.querySelector("#interface");
export const round = (n, r) => Math.ceil(n / r) * r;

let code = `
	osc(4, 0.1, 1.2).scrollX(0.1, 0.1).out()
`;

let codeData = [
	["shape", 20, 0.1, 0.02],
	["scale", .3],
	["repeat", .1],
	["modulateRotate", "o0"],
	["scale", "() => Math.sin(time)*2"],
	["modulate", "noise(2,0)"],
	// ["modulate", ['noise', 2, 0]],
	["rotate", 0.1, 0.9],
	["out", "o0"],
];

// shape(20,0.1,0.01)
//   .scale(.3)
//   .repeat(.1*10)
//   .modulateRotate(o0)
//   .scale(() => Math.sin(time)*2)
//   .modulate(noise(2,0))
//   .rotate(0.1, 0.9)
// .out(o0)

let compile = (data) => {
	let str = "const h = new Hydra().synth";
	str += "\n";

	for (let i = 0; i < data.length; i++) {
		str += func(data[i]);
		if (i != data.length - 1) str += ".";
	}

	console.log(str);
	return str;
};

let func = (args) =>
	args[0] + "(" + args.slice(1).reduce((str, argument) =>
		str + argument + ",", "") +
	")";

function updateUI(data) {
	let d = [".dawg"];

	data.forEach((fn, fnI) => {
		let stuff = [".fn", { address: fnI }, ["p", fn[0]]];
		fn.slice(1).forEach((item, i) => {
			stuff.push(["button", item + ", "]);
		});
		d.push(stuff);
	});
	interfaceEl.innerHTML = "";
	interfaceEl.appendChild(dom(d));
}

let cursor = 0;

let updateCursor = () => {
	document.querySelectorAll('*[selected="true"]').forEach((el) =>
		el.setAttribute("selected", "false")
	);

	document.querySelectorAll('*[address="' + cursor + '"]').forEach((el) =>
		el.setAttribute("selected", "true")
	);
};

document.onkeydown = (e) => {
	if (e.key == "ArrowDown") {
		if (cursor < codeData.length - 1) cursor++;
		updateCursor();
	}

	if (e.key == "ArrowUp") {
		if (cursor != 0) cursor--;
		updateCursor();
	}

	if (e.key.toLowerCase() == "a") {
		let cur = codeData[cursor];
		if (typeof cur[1] == "number") {
			if (e.shiftKey) cur[1] -= .1;
			else cur[1] += .1;
			update_page();
		}
	}

	if (e.key.toLowerCase() == "s") {
		let cur = codeData[cursor];
		if (typeof cur[2] == "number") {
			if (e.shiftKey) cur[2] -= .1;
			else cur[2] += .1;
			update_page();
		}
	}

	if (e.key.toLowerCase() == "d") {
		let cur = codeData[cursor];
		if (typeof cur[3] == "number") {
			if (e.shiftKey) cur[3] -= .1;
			else cur[3] += .1;
			update_page();
		}
	}
};

function update_page() {
	let code = compile(codeData);
	frame.srcdoc = `
		<style>
	* {
		padding: 0;
		margin: 0;
		overflow: hidden;
	}

	html,
	body {
		height: 100vw;
		width: 100vh;
	}
		</style>

		<body>
		</body>
		<script src="./lib/hydra.js"></script>
		<script>
			${code}
		</script>
		`;

	updateUI(codeData);
	codeEl.innerHTML = `<pre>${code}</pre>`;
	updateCursor();
}

update_page();
