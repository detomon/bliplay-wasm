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

	createOffsetIndicator(column) {
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

	setLineError(error, line, column) {
		const editor = this.editor;
		const widgets = this.widgets;
		const offsetString = this.createOffsetIndicator(column);

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
