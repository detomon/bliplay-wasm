class BliplayController {
	constructor(delegate, config) {
		this.delegate = delegate || {};
		this.config = config || { version: '0' };
		this.currentEditor = null;
		this.lock = false;
		this.files = {};
		this.readyResolve = null;
		this.readyReject = null;
		this.progressChanged = null;
		this.running = false;

		this.printErr = (line) => {
			if (this.currentEditor) {
				this.currentEditor.setError(line);
			}

			console.error(line);
		};

		this.print = (line) => {
			console.log(line);
		};

		this.readyPromise = new Promise((resolve, reject) => {
			this.readyResolve = resolve;
			this.readyReject = reject;
		});
	}

	connectNode() {
		//this.source.connect(this.generatorNode);
		this.generatorNode.connect(this.context.destination);
		this.context.resume();
	}

	disconnectNode() {
		//this.source.disconnect(this.generatorNode);
		this.generatorNode.disconnect(this.context.destination);
	}

	generate(length) {
		length = this._generate(length);

		if (this.progressChanged) {
			const progress = this._getTime() / this._getDuration();
			this.progressChanged(progress);
		}

		return length;
	}

	getDuration() {
		return this._getDuration();
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

	heapInt64Array(array, offset, length) {
		return this._heapSubarray(array, this.HEAP64, offset, length);
	}

	heapFloat32Array(array, offset, length) {
		return this._heapSubarray(array, this.HEAPF32, offset, length);
	}

	heapFloat64Array(array, offset, length) {
		return this._heapSubarray(array, this.HEAPF64, offset, length);
	}

	setHeapInt8Array(array, data, offset) {
		offset = offset || 0;
		const memory = this.HEAP8;
		const offsetStart = array / memory.BYTES_PER_ELEMENT + offset;

		return memory.set(data, offsetStart);
	}

	startAudioContext() {
		this._startAudioContext();
		this.connectNode();
		this.running = true;
	}

	stopAudioContext() {
		if (!this.running) {
			return Promise.resolve();
		}

		this.running = false

		return new Promise((resolve, reject) => {
			this._stopAudioContext();

			// empty remaining audio buffers
			setTimeout(() => {
				// prevent exception when node is not connected
				try {
					this.disconnectNode();
				}
				catch (e) {}

				resolve();
			}, 100);
		});
	}

	_createGeneratorNode(numFrames, numChannels) {
		let generatorNode = this.context.createScriptProcessor(numFrames, numChannels, numChannels);

		generatorNode.onaudioprocess = (audioProcessingEvent) => {
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

		return generatorNode;
	}

	init() {
		const numFrames = 2048;
		const numChannels = 2;
		const sampleRate = 44100;

		this.context = new (window.AudioContext || window.webkitAudioContext)({
			sampleRate: sampleRate,
		});
		//this.source = this.context.createBufferSource();
		this.generatorNode = this._createGeneratorNode(numFrames, numChannels);

		if (this._initialize(numChannels, this.context.sampleRate) !== 0) {
			console.error('Unable to initialize context');
			return;
		}
	}

	locateFile(file) {
		return this.config.paths.wasm + file + '?t=' + this.config.version;
	}

	_filePutContents(path, data) {
		const ptr = this._malloc(data.length);
		this.HEAP8.set(data, ptr);

		const result = this.ccall('writeFile', null, ['string', 'number', 'number'], [path, ptr, data.length]);
		this._free(ptr);

		return result;
	}

	_loadSamples(paths) {
		paths.forEach((path) => {
			if (!this.files[path]) {
				this.files[path] = fetch(this.config.paths.sounds + path).then((result) => {
					if (!result.ok) {
						throw 'Failed with status: ' + result.status;
					}

					return result.arrayBuffer();
				}).then((bytes) => {
					const data = new Uint8Array(bytes);
					const result = this._filePutContents(path, data);

					if (result !== 0) {
						throw "Could not write file '" + path + "'";
					}
				});
			}
		});

		return Promise.all(paths.map((path) => {
			return this.files[path];
		}));
	}

	runSource(editor, sourceCode) {
		if (this.lock) {
			console.error('runSource has not ended yet');
		}

		this.lock = true;
		this.currentEditor = editor;

		return this.stopAudio().then(() => {
			let path;
			let paths = [];
			let result = this.ccall('compileSource', null, ['string'], [sourceCode]);

			while ((path = this.ccall('nextSamplePath', null, [], []))) {
				paths.push(this.UTF8ArrayToString(this.HEAP8, path));
			}

			if (result != 0) {
				throw 'Compilation error';
			}

			return paths;
		}).then((paths) => {
			// pre-connect node to ensure audio playback permissions
			this.connectNode();

			return this._loadSamples(paths).then(() => {
				let result = this.ccall('createContext', null, [], []);

				if (result === 0) {
					this.startAudioContext();
				}
			}).catch((error) => {
				this.printErr(error);
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
		this.readyResolve();
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

		if (this.delegate && this.delegate[eventName]) {
			this.delegate[eventName].apply(this.delegate, args);
		}
	}
}
