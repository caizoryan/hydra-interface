import { reactive } from "./chowk.js";
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
	["scale", "() => Math.sin(time)*4"],
	["modulate", ["noise", 2, 0]],
	// ["modulate", ['noise', 2, 0]],
	["rotate", 0.1, 0.9],
	["out", "o0"],
];

let compile = (data) => {
	let str = "const h = new Hydra().synth";
	str += "\n";

	for (let i = 0; i < data.length; i++) {
		str += func(data[i]);
		if (i != data.length - 1) str += ".";
	}

	return str;
};

let func = (args) => {
	// if args is an array then treat is as a function
	return args[0] + "(" +
		args.slice(1).reduce((str, argument) => str + arg(argument) + ",", "") +
		")";
};

let arg = (a) => typeof a == "number" ? a + "" : Array.isArray(a) ? func(a) : a;

function updateUI(data) {
	let d = [".dawg"];

	data.forEach((fn, fnI) => {
		d.push(defaultrenderer(fn, fnI, []));
	});

	interfaceEl.innerHTML = "";
	interfaceEl.appendChild(dom(d));
}

let defaultrenderer = (el, i, a) => {
	if (Array.isArray(el)) return arrayui(el, a.concat([i]));
	else if (typeof el == "string") return ["span.string", selected(a, i), el];
	else if (typeof el == "number") {
		return ["span.number", selected(a, i), el + ""];
	} else console.error(el);
};

let selected = (address, i) => {
	let addy = [...address];
	if (i != undefined) addy.push(i);
	let addy_str = addy.join("-");
	return {
		address: addy_str,
		selected: addy_str == cursor.value().join("-"),
		onclick: (e) => {
			e.stopImmediatePropagation();
			e.stopPropagation();
			cursor.next([...addy]);
		},
	};
};

let arrayui = (item, addy) => {
	let stuff = [".fn", selected(addy), ["p", selected(addy, 0), item[0]]];
	item.slice(1).forEach((item, i) => {
		stuff.push(defaultrenderer(item, i + 1, addy));
	});
	return stuff;
};

let cursor = reactive([0]);

cursor.subscribe((v) => {
	let selected = document.querySelector("*[selected='true']");
	if (selected) selected.setAttribute("selected", "false");

	selected = document.querySelector(`*[address='${v.join("-")}']`);
	if (selected) {
		selected.setAttribute("selected", "true");
		selected.scrollIntoView({ block: "center", behavior: "smooth" });
	}
});

cursor.goNext = (out = false) => {
	let [ref, refindex] = getcurrentref();
	if (refindex < ref.length - 1) {
		cursor.next((e) => (e[e.length - 1] += 1, e));
		let [ref, refindex] = getcurrentref();
		if (out && Array.isArray(ref[refindex])) {
			let notdone = true;
			while (notdone) {
				cursor.next((e) => (e.push(0), e));
				ref = getcurrentref()[0];
				refindex = getcurrentref()[1];

				if (!Array.isArray(ref[refindex])) notdone = false;
			}
		}
	} else if (out) (cursor.goUp(), cursor.goNext(true));
};
cursor.goPrev = (out = false) => {
	let [_, refindex] = getcurrentref();
	if (refindex != 0) {
		cursor.next((e) => (e[e.length - 1] -= 1, e));

		let [ref, refindex] = getcurrentref();
		if (out && Array.isArray(ref[refindex])) {
			let notdone = true;

			while (notdone) {
				cursor.next((e) => (e.push(ref[refindex].length - 1), e));
				ref = getcurrentref()[0];
				refindex = getcurrentref()[1];

				if (!Array.isArray(ref[refindex])) notdone = false;
			}
		}
	} else if (out) (cursor.goUp(), cursor.goPrev(true));
	else cursor.goUp();
};

cursor.goUp = () => {
	if (cursor.value().length > 1) cursor.next((e) => (e.pop(), e));
};

let getcurrentref = () => {
	let curse = cursor.value();
	if (curse.length == 1) return [codeData, curse[0]];

	let refaddress = curse.slice(0, -1);
	let refindex = cursor.value()[cursor.value().length - 1];
	let ref = getref(refaddress, codeData);
	return [ref, refindex];
};
let getref = (address, arr) => {
	let copy = [...address];
	let index = copy.shift();
	if (copy.length == 0) return arr[index];
	return getref(copy, arr[index]);
};

document.onkeydown = (e) => {
	if (e.key == "ArrowDown") {
		// have strategy functions for what next means in different contexts
		cursor.goNext();
	}
	if (e.key == "ArrowUp") {
		cursor.goPrev();
	}

	if (e.key == "Enter") {
		let [ref, refindex] = getcurrentref();
		if (Array.isArray(ref[refindex])) {
			cursor.next((e) => (e.push(0), e));
		}
	}

	if (e.key == "Escape") {
		cursor.goUp();
	}

	if (e.key == "ArrowRight") {
		let [cur, curI] = getcurrentref();
		if (typeof cur[curI] == "number") {
			if (e.shiftKey) cur[curI] += .4;
			else cur[curI] += .1;
			update_page();
		}
	}

	if (e.key == "ArrowLeft") {
		let [cur, curI] = getcurrentref();
		if (typeof cur[curI] == "number") {
			if (e.shiftKey) cur[curI] -= .4;
			else cur[curI] -= .1;
			update_page();
		}
	}

	if (e.key == "N") {
		let [cur, curI] = getcurrentref();
		if (Array.isArray(cur)) {
			cur.splice(curI + 1, 0, 0);
			update_page();
		}
	}

	if (e.key == "Backspace") {
		let [cur, curI] = getcurrentref();
		if (Array.isArray(cur)) {
			cur.splice(curI, 1);
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
}

update_page();
