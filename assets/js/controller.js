class BlipKitController {
	constructor(module) {
		const numFrames = 1024;
		const numChannels = 2;

		this.module = module;
		this.context = new (window.AudioContext || window.webkitAudioContext)();
		this.source = this.context.createBufferSource();
		this.generatorNode = this.context.createScriptProcessor(numFrames, numChannels, numChannels);

		this.generatorNode.onaudioprocess = (audioProcessingEvent) => {
			const audioBuffer = this._getBuffer();
			const inputBuffer = audioProcessingEvent.inputBuffer;
			const outputBuffer = audioProcessingEvent.outputBuffer;

			this.generate(inputBuffer.length);

			for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
				const outputData = outputBuffer.getChannelData(channel);
				const channelData = this.heapFloat32Array(audioBuffer, inputBuffer.length * channel, inputBuffer.length);

				outputData.set(channelData);
			}
		};

		this.currentEditor = null;

		this.printErr = (line) => {
			if (!this.currentEditor.setError(line)) {
				console.error(line);
			}
		};
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
		return this._generate(length);
	}

	heapFloat32Array(array, offset, length) {
		const memory = this.HEAPF32;
		const offsetStart = array / memory.BYTES_PER_ELEMENT + offset;
		const offsetEnd = offsetStart + length;

		return memory.subarray(offsetStart, offsetEnd);
	}

	startContext() {
		this._startContext();
		this.connectNode();
	}

	stopContext() {
		this._stopContext();

		// empty remaining audio buffers
		setTimeout(() => {
			this.disconnectNode();
		}, 100);
	}

	init() {
	}

	runSource(editor, sourceCode) {
		this.currentEditor = editor;

		let result = this.ccall('compileSource', null, ['string'], [sourceCode]);

		if (result === 0) {
			this.startContext();
		}
	}

	stop() {
		this.stopContext();
	}

	readyEvent() {
		this.init();
		console.log('ready');
	}

	doneEvent() {
		this.stop();
		console.log('stop');
	}

	emitEvent(name, args) {
		const eventName = name + 'Event';

		if (this[eventName]) {
			this[eventName](args);
		}
	}
}
