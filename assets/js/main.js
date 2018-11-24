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

	document.documentElement.classList.add('playing');
	document.documentElement.classList.remove('loaded');


	// TODO: wait for readyEvent
	window.Bliplay.runSource(textarea.sourceEditor, source).finally(() => {
		document.documentElement.classList.add('loaded');
	});
}

app.stopAction = () => {
	document.documentElement.classList.remove('playing');
	window.Bliplay.stopAudio();
}

app.editorSource = () => {
	return app.sourceEditor.getValue();
};

document.querySelector('#start').addEventListener('click', () => {
	app.playAction();
});

document.querySelector('#stop').addEventListener('click', () => {
	app.stopAction();
});

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
	const fileSelect = app.fileSelect;
	const data = urlHashContent(window.location.hash);

	if (data) {
		const source = app.decodeURLData(data);

		if (source) {
			app.setSource(source);
			addURLDataOptions(fileSelect, source);

			return true;
		}
		else {
			app.alert('Failed to decode URL data');
		}
	}

	return false;
}

if (!parseURLData()) {
	app.fileSelect.selectedIndex = 0;
	app.changeFile();
}

});
