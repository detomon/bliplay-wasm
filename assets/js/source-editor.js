class SourceEditor {
	constructor(textarea, options) {
		this.widgets = [];
		this.editor = CodeMirror.fromTextArea(textarea, options);
		textarea.editorInstance = this.editor;
	}

	clearErrors() {
		const widgets = this.widgets;

		widgets.forEach((widget) => {
			widget.clear();
		});

		widgets.length = 0;
	}

	createOffsetIndicator(column) {
		function spliceSplit(str, index, count, add) {
			var ar = str.split('');
			ar.splice(index, count, add);
			return ar.join('');
		}

		let offsetString = '';

		for (let i = 0; i < column - 1; i++) {
			offsetString += ' ';
		}

		offsetString += '^';

		if (column > 3) {
			offsetString = spliceSplit(offsetString, column - 4, 3, '~~~');
		}
		else {
			offsetString = spliceSplit(offsetString, column, 3, '~~~');
		}

		return offsetString;
	}

	setLineError(error, line, column) {
		const editor = this.editor;
		const widgets = this.widgets;
		const offsetString = this.createOffsetIndicator(column);

		let msg = document.createElement('div');
		msg.appendChild(document.createTextNode(offsetString));
		msg.appendChild(document.createElement('br'));
		msg.appendChild(document.createTextNode(error));
		msg.className = 'line-error';
		widgets.push(editor.addLineWidget(line - 1, msg, {coverGutter: false, noHScroll: true}));

		editor.scrollIntoView({line: line - 1, char: 0}, 100);
	}

	setError(line) {
		let match;

		if ((match = /^(.+) on line (\d+)\:(\d+)$/.exec(line))) {
			this.setLineError(match[1], match[2], match[3]);

			return true;
		}
		else if (!(match = /^User error:/.exec(line))) {
			this.setLineError(line, 1, 1);

			return true;
		}

		return false;
	}
}
