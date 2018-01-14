const sourceElement = document.querySelector('#source');
const fileTitle = document.querySelector('#file-title');

controller.editor = CodeMirror.fromTextArea(sourceElement, {
	mode: 'blip',
	lineNumbers: true,
	matchBrackets: true,
    foldGutter: true,
	theme: 'base16-ocean-dark',
    gutters: ['note-gutter', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
});
