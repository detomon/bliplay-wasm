window.BlipKit = new BlipKitController();

window.addEventListener('load', () => {
	document.documentElement.classList.add('loaded');
});

document.querySelector('#start').addEventListener('click', function () {
	let textarea = document.querySelector('.code-editor');
	let editor = textarea.editorInstance;
	let source = editor.getValue();

	textarea.sourceEditor.reset();

	window.BlipKit.runSource(textarea.sourceEditor, source);
});

document.querySelector('#stop').addEventListener('click', function () {
	window.BlipKit.stop();
});
