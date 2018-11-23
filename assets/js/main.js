function playAction() {
	let textarea = document.querySelector('.code-editor');
	let editor = textarea.editorInstance;
	let source = editor.getValue();

	textarea.sourceEditor.reset();

	document.documentElement.classList.add('playing');
	document.documentElement.classList.remove('loaded');

	// TODO: wait for readyEvent
	window.Bliplay.runSource(textarea.sourceEditor, source).finally(() => {
		document.documentElement.classList.add('loaded');
	});
}

function stopAction() {
	document.documentElement.classList.remove('playing');
	window.Bliplay.stopAudio();
}

window.addEventListener('load', () => {
	document.documentElement.classList.add('loaded');
});

document.querySelector('#start').addEventListener('click', function () {
	playAction();
});

document.querySelector('#stop').addEventListener('click', function () {
	stopAction();
});

function uintToString(uintArray) {
	let encodedString = String.fromCharCode.apply(null, uintArray);
	let decodedString = decodeURIComponent(escape(encodedString));

	return decodedString;
}

document.querySelector('#source-link').addEventListener('click', function () {
	let textarea = document.querySelector('.code-editor');
	let editor = textarea.editorInstance;
	let source = editor.getValue();

	source = pako.deflate(source);
	source = String.fromCharCode.apply(null, source);
	source = btoa(source);
	source = location.protocol + '//' + location.host + location.pathname + '#s=' + source;

	window.prompt('This URL contains the current editor content:', source);
});

window.Bliplay = new BliplayController({
	doneEvent: () => {
		document.documentElement.classList.remove('playing');
	},
});

function addURLDataOptions(fileSelect, source) {
	let optGroup = document.createElement('optgroup');
	optGroup.label = 'Other';
	fileSelect.appendChild(optGroup);

	let option = new Option('URL Data', '');
	option.data = source;
	optGroup.appendChild(option);

	fileSelect.selectedIndex = fileSelect.options.length - 1;
}

const sourceRaw = /^#s=(.*)$/.exec(window.location.hash);

if (sourceRaw) {
	source = atob(sourceRaw[1]);
	source = pako.inflate(source);
	source = uintToString(source);

	if (source) {
		setSource(source);
		addURLDataOptions(fileSelect, source);
	}
	else {
		window.alert('Failed to decode URL data');
	}
}
else {
	fileSelect.selectedIndex = 0;
	changeFile(fileSelect);
}
