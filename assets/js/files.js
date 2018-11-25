app.addInit(function () {

function fetchFileIndex() {
	const url = app.dirs.files + 'index.json';

	return fetch(url).then((response) => {
		return response.json();
	});
}

function initFileSelect(select, files) {
	select.addEventListener('change', (e) => {
		app.changeFile();
		app.stopAction();
	});

	files.forEach((group) => {
		const subdir = group.subdir || '';
		const optGroup = document.createElement('optgroup');

		optGroup.label = group.title;
		select.appendChild(optGroup);

		group.files.forEach((file) => {
			const path = app.dirs.files + subdir + file.path;
			const option = new Option(file.title, path);

			option.file = file;
			optGroup.appendChild(option);
		});
	});
}

app.fileSelect = document.querySelector('#file-select');

app.fileIndexPromise = fetchFileIndex().then((files) => {
	initFileSelect(app.fileSelect, files);
});

app.addLoadPromise(app.fileIndexPromise);

function selectedOption(select) {
	return select.options[select.selectedIndex];
}

app.changeFile = function () {
	const option = selectedOption(app.fileSelect);
	const path = option.value;
	const data = option.data;
	let dataPromise;

	if (path) {
		dataPromise = fetch(path).then((response) => {
			return response.text();
		});
	}
	else if (data) {
		dataPromise = Promise.resolve(data);
	}

	dataPromise.then((source) => {
		app.setSource(source);
	});
}

});
