const files = [{
	title: 'Tutorial',
	subdir: 'tutorial/',
	files: [{
		title: 'Power On',
		path: 'power-on.blip',
	}, {
		title: 'Waveforms',
		path: 'waveforms.blip',
	}, {
		title: 'Instruments',
		path: 'instruments.blip',
	}, {
		title: 'Samples',
		path: 'samples.blip',
	}],
}, {
	title: 'Loops',
	subdir: 'loops/',
	files: [{
		title: 'Loop #1',
		path: 'loop-1.blip',
	}, {
		title: 'Loop #2',
		path: 'loop-2.blip',
	}],
}, {
	title: 'Tracks',
	files: [{
		title: 'Don\'t Eat Flashcards',
		path: 'dont-eat-flashcards.blip',
	}, {
		title: 'Short-Fused Bombs',
		path: 'short-fused-bombs.blip',
	}, {
		title: 'Ghost Bouncer',
		path: 'ghost-bouncer.blip',
	}, {
		title: 'Hyperion Star Racer',
		path: 'hyperion-star-racer.blip',
	}, {
		title: 'Killer Squid',
		path: 'killer-squid.blip',
	}, {
		title: 'WYSIWYG',
		path: 'wysiwyg.blip',
	}, {
		title: 'Cave XII',
		path: 'cave-xii.blip',
	}, {
		title: 'Monster Carousel',
		path: 'monster-carousel.blip',
	}, {
		title: 'Dirt Planet',
		path: 'dirt-planet.blip',
	}],
}];

app.addInit(function () {

function initFileSelect(select) {
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

initFileSelect(app.fileSelect);

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
