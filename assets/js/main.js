window.Bliplay = new BliplayController();

window.addEventListener('load', () => {
	document.documentElement.classList.add('loaded');
});

document.querySelector('#start').addEventListener('click', function () {
	let textarea = document.querySelector('.code-editor');
	let editor = textarea.editorInstance;
	let source = editor.getValue();

	textarea.sourceEditor.reset();

	document.documentElement.classList.remove('loaded');

	// TODO: wait for readyEvent
	window.Bliplay.runSource(textarea.sourceEditor, source).finally(() => {
		document.documentElement.classList.add('loaded');
	});
});

document.querySelector('#stop').addEventListener('click', function () {
	window.Bliplay.stopAudio();
});

function uintToString(uintArray) {
	let encodedString = String.fromCharCode.apply(null, uintArray);
	let decodedString = decodeURIComponent(escape(encodedString));

	return decodedString;
}

const sourceRaw = /^#s=(.*)$/.exec(window.location.hash);

if (sourceRaw) {
	source = atob(sourceRaw[1]);
	source = pako.inflate(source);
	source = uintToString(source);

	if (source) {
		setSource(source);
	}
}
else {
	fileSelect.selectedIndex = 1;
	changeFile(fileSelect);
}
