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
