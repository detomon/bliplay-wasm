const editors = document.querySelectorAll('.code-editor');

[].forEach.call(editors, (editor) => {
	editor.sourceEditor = new SourceEditor(editor, {
		mode: 'blip',
		lineNumbers: true,
		matchBrackets: true,
		foldGutter: true,
		theme: 'monoxid-light',
		gutters: ['note-gutter', 'breakpoints', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
	});
});
