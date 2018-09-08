class BliplayController {
	constructor(module) {
		this.module = module;
		this.currentEditor = null;
		this.lock = false;

		this.printErr = (line) => {
			if (this.currentEditor) {
				this.currentEditor.setError(line);
			}

			console.error(line);
		};

		this.print = (line) => {
			console.log(line);
		};
	}

	connectNode() {
		this.source.connect(this.generatorNode);
		this.generatorNode.connect(this.context.destination);
		this.context.resume();
	}

	disconnectNode() {
		this.source.disconnect(this.generatorNode);
		this.generatorNode.disconnect(this.context.destination);
	}

	generate(length) {
		return this._generate(length);
	}

	_heapSubarray(array, memory, offset, length) {
		const offsetStart = array / memory.BYTES_PER_ELEMENT + offset;
		const offsetEnd = offsetStart + length;

		return memory.subarray(offsetStart, offsetEnd);
	}

	heapInt8Array(array, offset, length) {
		return this._heapSubarray(array, this.HEAP8, offset, length);
	}

	heapInt16Array(array, offset, length) {
		return this._heapSubarray(array, this.HEAP16, offset, length);
	}

	heapInt32Array(array, offset, length) {
		return this._heapSubarray(array, this.HEAP32, offset, length);
	}

	heapFloat32Array(array, offset, length) {
		return this._heapSubarray(array, this.HEAPF32, offset, length);
	}

	setHeapInt8Array(array, data, offset) {
		offset = offset || 0;
		const memory = this.HEAP8;
		const offsetStart = array / memory.BYTES_PER_ELEMENT + offset;
		//const offsetEnd = offsetStart + length;

		return memory.set(data, offsetStart);
	}

	startAudioContext() {
		this._startAudioContext();
		this.connectNode();
		console.debug('Context start');
	}

	stopAudioContext() {
		console.debug('Context stop');

		return new Promise((resolve, reject) => {
			this._stopAudioContext();

			// empty remaining audio buffers
			setTimeout(() => {
				this.disconnectNode();
				resolve();
			}, 100);
		});
	}

	init() {
		const numFrames = 2048;
		const numChannels = 2;

		this.context = new (window.AudioContext || window.webkitAudioContext)();
		this.source = this.context.createBufferSource();
		this.generatorNode = this.context.createScriptProcessor(numFrames, numChannels, numChannels);

		if (this._initialize(numChannels, this.context.sampleRate) !== 0) {
			console.error('Unable to initialize context');
			return;
		}

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
	}

	locateFile(file) {
		return 'assets/' + file;
	}

	_filePutContents(path, data) {
		return this.ccall('writeFile', null, ['string', 'array', 'number'], [path, data, data.length]);
	}

	_loadSamples(paths) {
		let fetches = paths.map((path) => {
			console.log('Loading sample', path);

			return fetch('assets/sound/' + path).then((result) => {
				return result.arrayBuffer();
			}).then((bytes) => {
				const data = new Uint8Array(bytes);
				const result = this._filePutContents(path, data);

				if (result !== 0) {
					throw 'Could not write file ' + path;
				}
			});
		});

		return Promise.all(fetches);
	}

	runSource(editor, sourceCode) {
		if (this.lock) {
			console.error('runSource has not ended yet');
		}

		this.lock = true;

		this.stopAudio().then(() => {
			let path;
			let paths = [];
			let result = this.ccall('compileSource', null, ['string'], [sourceCode]);

			while ((path = this.ccall('nextSamplePath', null, [], []))) {
				paths.push(this.UTF8ArrayToString(this.HEAP8, path));
			}

			this._loadSamples(paths).then(() => {
				let result = this.ccall('createContext', null, [], []);

				this.currentEditor = editor;

				if (result === 0) {
					this.startAudioContext();
				}
			}).finally(() => {
				this.lock = false;
			});
		});
	}

	stopAudio() {
		return this.stopAudioContext();
	}

	readyEvent() {
		this.init();
		console.debug('Controller ready');
	}

	doneEvent() {
		this.stopAudio();
	}

	lineNumberEvent(trackIdx, lineNumber) {
		this.currentEditor.setActiveLineNumber(trackIdx, lineNumber)
	}

	emitEvent(name) {
		const eventName = name + 'Event';
		const args = [].slice.call(arguments, 1);

		if (this[eventName]) {
			this[eventName].apply(this, args);
		}
		else {
			console.warn('Unable to deliver event', eventName, args);
		}
	}
}
