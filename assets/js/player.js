app.addInit(function () {

const editors = document.querySelectorAll('.code-editor');

[].forEach.call(editors, (editor) => {
	editor.sourceEditor = new SourceEditor(editor, {
		mode: 'blip',
		lineNumbers: true,
		matchBrackets: true,
		foldGutter: true,
		tabSize: 4,
		indentUnit: 4,
		indentWithTabs: true,
		theme: 'base16-ocean-dark',
		gutters: ['note-gutter', 'breakpoints', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
	});
});

});
