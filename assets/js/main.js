window.BlipKit = {
	readyEvent: () => {
		controller.init();
	},
	doneEvent: () => {
		controller.stop();
	},
	emitEvent: (name, args) => {
		const eventName = name + 'Event';

		if (BlipKit[eventName]) {
			BlipKit[eventName](args);
		}
	},
	printErr: (line) => {
		if (!controller.setError(line)) {
			console.error(line);
		}
	},
};

window.controller = new BlipKitController(BlipKit);

window.addEventListener('load', () => {
	document.documentElement.classList.add('loaded');
});
