const fileSelect = document.querySelector('#file-select');

const files = [{
	title: 'Power On',
	path: 'files/power-on.blip',
}, {
	title: 'Fully Dimmable',
	path: 'files/fully-dimmable-v3.blip',
}, {
	title: 'Dirt Planet',
	path: 'files/dirt-planet.blip',
}];

files.forEach((file) => {
	let option = new Option(file.title, file.path);
	option.file = file;
	fileSelect.appendChild(option);
});

function setSource(source) {
	let textarea = document.querySelector('.code-editor');
	let editor = textarea.editorInstance;

	editor.setValue(source);
}

function setTitle(title) {
	let fileTitle = document.querySelector('#file-title');

	fileTitle.textContent = title;
}

function changeFile(target) {
	const option = target.options[target.selectedIndex];
	const file = option.file;

	target.disabled = true;

	fetch(file.path).then((response) => {
		return response.text();
	}).then((source) => {
		setSource(source);
		setTitle(file.title);
	}).then(() => {
		target.disabled = false;
	});
}

fileSelect.addEventListener('change', (e) => {
	changeFile(fileSelect);
});
