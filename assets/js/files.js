const fileSelect = document.querySelector('#file-select');

const files = [{
	title: 'Power On',
	path: 'files/power-on.blip',
}, {
	title: 'Fully Dimmable',
	path: 'files/fully-dimmable-v3.blip',
}];

files.forEach((file) => {
	let option = new Option(file.title, file.path);
	option.file = file;
	fileSelect.appendChild(option);
});

function changeFile(target) {
	const option = target.options[target.selectedIndex];
	const file = option.file;

	target.disabled = true;

	fetch(file.path).then((response) => {
		return response.text();
	}).then((source) => {
		controller.editor.setValue(source);
		fileTitle.textContent = file.title;
	}).then(() => {
		target.disabled = false;
	});
}

fileSelect.addEventListener('change', (e) => {
	changeFile(fileSelect);
});

fileSelect.selectedIndex = 1;
changeFile(fileSelect);
