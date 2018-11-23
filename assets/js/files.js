const fileSelect = document.querySelector('#file-select');

const files = [{
	title: 'Tutorial',
	files: [{
		title: 'Power On',
		path: 'files/tutorial/power-on.blip',
	}, {
		title: 'Waveforms',
		path: 'files/tutorial/waveforms.blip',
	}, {
		title: 'Instruments',
		path: 'files/tutorial/instruments.blip',
	}, {
		title: 'Samples',
		path: 'files/tutorial/samples.blip',
	}],
}, {
	title: 'Loops',
	files: [{
		title: 'Loop #1',
		path: 'files/loops/loop-1.blip',
	}],
}, {
	title: 'Tracks',
	files: [{
		title: 'Don\'t Eat Flashcards',
		path: 'files/dont-eat-flashcards.blip',
	}, {
		title: 'Short-Fused Bombs',
		path: 'files/short-fused-bombs.blip',
	}, {
		title: 'Ghost Bouncer',
		path: 'files/ghost-bouncer.blip',
	}, {
		title: 'Hyperion Star Racer',
		path: 'files/hyperion-star-racer.blip',
	}, {
		title: 'Killer Squid',
		path: 'files/killer-squid.blip',
	}, {
		title: 'WYSIWYG',
		path: 'files/wysiwyg.blip',
	}, {
		title: 'Cave XII',
		path: 'files/cave-xii.blip',
	}, {
		title: 'Monster Carousel',
		path: 'files/monster-carousel.blip',
	}, {
		title: 'Dirt Planet',
		path: 'files/dirt-planet.blip',
	}],
}];

files.forEach((group) => {
	let optGroup = document.createElement('optgroup');
	optGroup.label = group.title;
	fileSelect.appendChild(optGroup);

	group.files.forEach((file) => {
		let option = new Option(file.title, file.path);
		option.file = file;
		optGroup.appendChild(option);
	});
});

function setSource(source) {
	let textarea = document.querySelector('.code-editor');
	let editor = textarea.editorInstance;

	editor.setValue(source);
}

function changeFile(target) {
	const option = target.options[target.selectedIndex];
	const file = option.file;
	const data = option.data;

	if (file) {
		fetch(file.path).then((response) => {
			return response.text();
		}).then((source) => {
			setSource(source);
		});
	}
	else if (data) {
		setSource(data);
	}
}

fileSelect.addEventListener('change', (e) => {
	changeFile(fileSelect);
	window.stopAction();
});
