(function () {

window.app = {
	dirs: {
		files: 'files/',
		assets: 'assets/',
		scripts: 'assets/js/',
		wasm: 'assets/wasm/',
		sounds:'assets/sound/',
	},

	initFuncs: [],
	runFuncs: [],

	init: function () {
		this.initFuncs.forEach((func) => {
			func(this);
		});

		this.runFuncs.forEach((func) => {
			func(this);
		});

		document.documentElement.classList.add('loaded');
	},

	addInit: function (func) {
		this.initFuncs.push(func);
	},

	addRun: function (func) {
		this.runFuncs.push(func);
	},

	alert: function (message) {
		return window.alert(message);
	},

	prompt: function (message, content) {
		return window.prompt(message, content);
	},
};

window.addEventListener('load', () => {
	app.init();
});

}());
