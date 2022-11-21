window.Bliplay = new BliplayController({
	doneEvent: () => {
		document.documentElement.classList.remove('playing');
	},
}, {
	paths: app.dirs,
	version: app.version,
});

app.addInit(function (app) {

const textarea = app.$('.code-editor');
const editor = textarea.editorInstance;

app.editorInstance = editor;
app.sourceEditor = textarea.sourceEditor;

app.getSource = () => {
	return app.editorInstance.getValue();
};

app.setSource = (source) => {
	app.sourceEditor.reset();
	app.editorInstance.setValue(source);
};

app.playAction = () => {
	const textarea = app.$('.code-editor');
	const editor = textarea.editorInstance;
	const source = editor.getValue();

	textarea.sourceEditor.reset();

	app.setState('playing', true);
	app.setState('loading', true);

	window.Bliplay.readyPromise.then(() => {
		window.Bliplay.runSource(textarea.sourceEditor, source).catch(() => {
			app.setState('playing', false);
		}).finally(() => {
			app.setState('loading', false);
		});
	})
};

app.stopAction = () => {
	app.setState('playing', false);
	window.Bliplay.stopAudio();
};

app.editorSource = () => {
	return app.editorInstance.getValue();
};

app.$('#start').addEventListener('click', () => {
	app.playAction();
});

app.$('#stop').addEventListener('click', () => {
	app.stopAction();
});

app.addLoadPromise(window.Bliplay.readyPromise);

function uintToString(uintArray) {
	const encodedString = String.fromCharCode.apply(null, uintArray);
	const decodedString = decodeURIComponent(escape(encodedString));

	return decodedString;
}

app.decodeURLData = function (data) {
	let source = atob(data);
	source = pako.inflate(source);
	source = uintToString(source);

	return source;
};

app.encodeURLdata = function (source) {
	source = pako.deflate(source);
	source = String.fromCharCode.apply(null, source);
	source = btoa(source);

	return source;
};

app.$('#source-link').addEventListener('click', () => {
	let data = app.encodeURLdata(app.editorSource());
	let url = location.protocol + '//' + location.host + location.pathname + '#s=' + data;

	app.prompt('This URL contains the current editor content:', url);
});

});

app.addRun(function () {

function setURLDataOption(fileSelect, source) {
	let optGroup = fileSelect.querySelector('optgroup.other');

	if (!optGroup) {
		optGroup = document.createElement('optgroup');
		optGroup.label = 'Other';
		optGroup.classList.add('other');
		fileSelect.appendChild(optGroup);

		let option = new Option('URL Data', '');
		optGroup.appendChild(option);
	}

	let option = optGroup.querySelector('option');
	option.data = source;

	fileSelect.selectedIndex = fileSelect.options.length - 1;
}

function urlHashContent(hash) {
	const data = /^#s=(.*)$/.exec(hash);

	if (data) {
		return data[1];
	}
}

function parseURLData() {
	const hash = window.location.hash;

	return new Promise((resolve, reject) => {
		const fileSelect = app.fileSelect;
		const data = urlHashContent(hash);

		if (data) {
			const source = app.decodeURLData(data);

			if (source) {
				app.trackEvent({ category: 'source', action: 'url', name: 'data', value: data });
				resolve(source);
			}
			else {
				reject('Failed to decode URL data');
			}
		}
		else {
			resolve(null);
		}
	});
}

function updateFromURLData() {
	return parseURLData().then((source) => {
		if (source) {
			setURLDataOption(app.fileSelect, source);
			app.setSource(source);
		}
		else {
			app.fileSelect.selectedIndex = 0;
			app.updateFile();
		}
	});
}

/*const parsePromise = parseURLData().then((source) => {
	return app.fileIndexPromise.then(() => {
		if (source) {
			addURLDataOptions(app.fileSelect, source);
			app.setSource(source);
			app.trackEvent({ category: 'source', action: 'url', name: 'data', value: 'source' });
		}
		else {
			app.fileSelect.selectedIndex = 0;
			app.updateFile();
		}
	});
});*/

const parsePromise = app.fileIndexPromise.then(() => {
	return updateFromURLData();
});

app.addLoadPromise(parsePromise);

window.addEventListener('hashchange', () => {
	updateFromURLData();
});

});
