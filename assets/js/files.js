app.addInit(function () {

let paths = {};

function fetchFileIndex() {
	const url = app.dirs.files + 'index.json';

	return fetch(url).then((response) => {
		return response.json();
	});
}

function updateFile() {
	app.stopAction();

	const option = selectedOption(app.fileSelect);
	const path = option.value;
	const data = option.data;
	let dataPromise;

	if (paths[path]) {
		dataPromise = paths[path];
	}
	else if (path) {
		dataPromise = fetch(path).then((response) => {
			return response.text();
		});

		paths[path] = dataPromise;
	}
	else if (data) {
		dataPromise = Promise.resolve(data);
	}

	dataPromise.then((source) => {
		app.setSource(source);
		});
}

function initFileSelect(select, files) {
	select.addEventListener('change', (e) => {
		updateFile();
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

app.fileSelect = app.$('#file-select');
app.updateFile = updateFile;

app.fileIndexPromise = fetchFileIndex().then((files) => {
	initFileSelect(app.fileSelect, files);
});

app.addLoadPromise(app.fileIndexPromise);

function selectedOption(select) {
	return select.options[select.selectedIndex];
}

});
