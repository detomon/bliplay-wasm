class BlipKitController {
	constructor(module) {
		const numFrames = 1024;
		const numChannels = 2;

		this.module = module;
		this.context = new (window.AudioContext || window.webkitAudioContext)();
		this.source = this.context.createBufferSource();
		this.generatorNode = this.context.createScriptProcessor(numFrames, numChannels, numChannels);

		this.generatorNode.onaudioprocess = (audioProcessingEvent) => {
			const audioBuffer = this.module._getBuffer();
			const inputBuffer = audioProcessingEvent.inputBuffer;
			const outputBuffer = audioProcessingEvent.outputBuffer;

			this.generate(inputBuffer.length);

			for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
				const outputData = outputBuffer.getChannelData(channel);
				const channelData = this.heapFloat32Array(audioBuffer, inputBuffer.length * channel, inputBuffer.length);

				outputData.set(channelData);
			}
		};

		this.editor = null;
		this.widgets = [];
	}

	connectNode() {
		this.source.connect(this.generatorNode);
		this.generatorNode.connect(this.context.destination);
	}

	disconnectNode() {
		this.source.disconnect(this.generatorNode);
		this.generatorNode.disconnect(this.context.destination);
	}

	generate(length) {
		return this.module._generate(length);
	}

	heapFloat32Array(array, offset, length) {
		const memory = this.module.HEAPF32;
		const offsetStart = array / memory.BYTES_PER_ELEMENT + offset;
		const offsetEnd = offsetStart + length;

		return memory.subarray(offsetStart, offsetEnd);
	}

	init() {
		const module = this.module;

		/*setTimeout(() => {
			this.connectNode();
		}, 10);*/

		document.querySelector('#start').addEventListener('click', function () {
			controller.run();
		});

		document.querySelector('#stop').addEventListener('click', function () {
			controller.stop();
		});
	}

	clearErrors() {
		const widgets = this.widgets;

		widgets.forEach((widget) => {
			widget.clear();
		});

		widgets.length = 0;
	}

	setLineError(error, line, column) {
		const editor = this.editor;
		const widgets = this.widgets;
		const offsetString = createOffsetIndicator(column);

		let msg = document.createElement('div');
		msg.appendChild(document.createTextNode(offsetString));
		msg.appendChild(document.createElement('br'));
		msg.appendChild(document.createTextNode(error));
		msg.className = 'line-error';
		widgets.push(editor.addLineWidget(line - 1, msg, {coverGutter: false, noHScroll: true}));

		editor.scrollIntoView({line: line - 1, char: 0}, 100);
	}

	setError(line) {
		let match;

		if ((match = /^(.+) on line (\d+)\:(\d+)$/.exec(line))) {
			this.setLineError(match[1], match[2], match[3]);

			return true;
		}
		else if (!(match = /^User error:/.exec(line))) {
			this.setLineError(line, 1, 1);

			return true;
		}

		return false;
	}

	run() {
		this.clearErrors();

		const source = this.editor.getValue();
		let result = this.module.ccall('compileSource', null, ['string'], [source]);

		if (result === 0) {
			this.module._startContext();

			setTimeout(() => {
				this.connectNode();
			}, 100);

		}
	}

	stop() {
		this.module._stopContext();

		setTimeout(() => {
			this.disconnectNode();
		}, 100);
	}

}

function createOffsetIndicator(column) {
	function spliceSplit(str, index, count, add) {
		var ar = str.split('');
		ar.splice(index, count, add);
		return ar.join('');
	}

	let offsetString = '';

	for (let i = 0; i < column - 1; i++) {
		offsetString += ' ';
	}

	offsetString += '^';

	if (column > 3) {
		offsetString = spliceSplit(offsetString, column - 4, 3, '~~~');
	}
	else {
		offsetString = spliceSplit(offsetString, column, 3, '~~~');
	}

	return offsetString;
}

var BlipKit = {
	ready: () => {
		controller.init();
	},
	printErr: (line) => {
		if (!controller.setError(line)) {
			console.error(line);
		}
	},
};

let controller = new BlipKitController(BlipKit);

window.addEventListener('load', () => {
	document.documentElement.classList.add('loaded');
});

const sourceElement = document.querySelector('#source');
const fileSelect = document.querySelector('#file-select');
const fileTitle = document.querySelector('#file-title');

controller.editor = CodeMirror.fromTextArea(sourceElement, {
	mode: 'blip',
	lineNumbers: true,
	matchBrackets: true,
    foldGutter: true,
	theme: 'base16-ocean-dark',
    gutters: ['note-gutter', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
});

let files = [{
	title: 'Power On',
	path: 'files/power-on.blip',
}, {
	title: 'Fully Dimmable',
	path: 'files/fully-dimmable-v3.blip',
}];

files.forEach((file) => {
	let option = new Option(file.title, file.path);
	option.file = file;
	fileSelect.appendChild(option);
});

function changeFile(target) {
	const option = target.options[target.selectedIndex];
	const file = option.file;

	target.disabled = true;

	fetch(file.path).then((response) => {
		return response.text();
	}).then((source) => {
		controller.editor.setValue(source);
		fileTitle.textContent = file.title;
	}).then(() => {
		target.disabled = false;
	});
}

fileSelect.addEventListener('change', (e) => {
	changeFile(fileSelect);
});

fileSelect.selectedIndex = 1;
changeFile(fileSelect);
