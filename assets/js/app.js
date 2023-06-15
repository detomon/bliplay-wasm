(function () {

window.app = {
	dirs: {
		files: 'files/',
		assets: 'assets/',
		scripts: 'assets/js/',
		wasm: 'assets/wasm/',
		sounds:'/assets/sound/',
		version: '0.3.1',
	},

	initFuncs: [],
	runFuncs: [],
	loadPromises: [],

	$: function (selector) {
		return document.querySelector(selector);
	},

	$$: function (selector) {
		return document.querySelectorAll(selector);
	},

	$html: document.documentElement,
	$body: document.body,
	track: function () {
		const object = (window._paq || []);
		object.push.apply(object, arguments);
	},

	version: document.body.dataset.version,

	init: function () {
		this.initFuncs.forEach((func) => {
			func(this);
		});

		this.runFuncs.forEach((func) => {
			func(this);
		});

		app.setState('loading', true);

		Promise.all(this.loadPromises).finally(() => {
			app.setState('loading', false);
		}).catch((message) => {
			app.error(message);
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

	alert: function (message) {
		console.log(message);
		return window.alert(message);
	},

	error: function (message) {
		console.error(message);
		return window.alert(message);
	},

	prompt: function (message, content) {
		return window.prompt(message, content);
	},

	setState: function (name, set) {
		this.$html.classList.toggle(name, set);
	},

	trackEvent: function (options) {
		options = Object.assign({
			category: '',
			action: '',
			name: '',
			value: '',
		}, options);

		this.track([
			'trackEvent',
			options.category,
			options.action,
			options.name,
			options.value,
		]);
	},
};

window.addEventListener('load', () => {
	app.init();
});

}());
