window.Bliplay = new BliplayController({
	doneEvent: () => {
		document.documentElement.classList.remove('playing');
	},
}, {
	paths: app.dirs,
});

app.addInit(function (app) {

const textarea = document.querySelector('.code-editor');
const editor = textarea.editorInstance;

app.editorInstance = editor;
app.sourceEditor = textarea.sourceEditor;

app.setSource = (source) => {
	app.sourceEditor.reset();
	app.editorInstance.setValue(source);
}

app.playAction = () => {
	const textarea = document.querySelector('.code-editor');
	const editor = textarea.editorInstance;
	const source = editor.getValue();

	textarea.sourceEditor.reset();

	app.setPlaying(true);
	app.setLoading(true);

	window.Bliplay.readyPromise.then(() => {
		window.Bliplay.runSource(textarea.sourceEditor, source).catch(() => {
			app.setPlaying(false);
		}).finally(() => {
			app.setLoading(false);
		});
	})
}

app.stopAction = () => {
	app.setPlaying(false);
	window.Bliplay.stopAudio();
}

app.editorSource = () => {
	return app.editorInstance.getValue();
};

document.querySelector('#start').addEventListener('click', () => {
	app.playAction();
});

document.querySelector('#stop').addEventListener('click', () => {
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

document.querySelector('#source-link').addEventListener('click', () => {
	let data = app.encodeURLdata(app.editorSource());
	let url = location.protocol + '//' + location.host + location.pathname + '#s=' + data;

	app.prompt('This URL contains the current editor content:', url);
});

});

app.addRun(function () {

function addURLDataOptions(fileSelect, source) {
	let optGroup = document.createElement('optgroup');
	optGroup.label = 'Other';
	fileSelect.appendChild(optGroup);

	let option = new Option('URL Data', '');
	option.data = source;
	optGroup.appendChild(option);

	fileSelect.selectedIndex = fileSelect.options.length - 1;
}

function urlHashContent(hash) {
	const data = /^#s=(.*)$/.exec(hash);

	if (data) {
		return data[1];
	}
}

function parseURLData() {
	return new Promise((resolve, reject) => {
		const fileSelect = app.fileSelect;
		const data = urlHashContent(window.location.hash);

		if (data) {
			const source = app.decodeURLData(data);

			if (source) {
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

const parsePromise = parseURLData().then((source) => {
	return app.fileIndexPromise.then(() => {
		if (source) {
			addURLDataOptions(app.fileSelect, source);
			app.setSource(source);
		}
		else {
			app.fileSelect.selectedIndex = 0;
			app.changeFile();
		}
	});
}).then((source)=> {
}).catch((message) => {
	app.error(message);
});

app.addLoadPromise(parsePromise);

});
