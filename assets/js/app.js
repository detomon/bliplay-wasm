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
	loadPromises: [],

	init: function () {
		this.initFuncs.forEach((func) => {
			func(this);
		});

		this.runFuncs.forEach((func) => {
			func(this);
		});

		Promise.all(this.loadPromises).finally(() => {
			app.setLoading(false);
		});
	},

	addInit: function (func) {
		this.initFuncs.push(func);
	},

	addLoadPromise: function (func) {
		this.loadPromises.push(func);
	},

	addRun: function (func) {
		this.runFuncs.push(func);
	},

	error: function (message) {
		return window.alert(message);
	},

	prompt: function (message, content) {
		return window.prompt(message, content);
	},

	setLoading: function (loading) {
		document.documentElement.classList.toggle('loaded', !loading);
	},

	setPlaying: function (playing) {
		document.documentElement.classList.toggle('playing', playing);
	},
};

window.addEventListener('load', () => {
	app.init();
});

}());
