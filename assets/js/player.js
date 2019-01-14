app.addInit(function () {

const editorConfig = {
	mode: 'blip',
	lineNumbers: true,
	matchBrackets: true,
	foldGutter: true,
	tabSize: 4,
	indentUnit: 4,
	indentWithTabs: true,
	theme: 'base16-ocean-dark',
	gutters: ['note-gutter', 'breakpoints', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
};

app.$$('.code-editor').forEach((editor) => {
	editor.sourceEditor = new SourceEditor(editor, editorConfig);
});

});
