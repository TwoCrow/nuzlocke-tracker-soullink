if (location.protocol === 'https:' && 'serviceWorker' in navigator) {
	try {
		navigator.serviceWorker.register('/nuzlocke-tracker/serviceworker.js', {scope: '/nuzlocke-tracker/'});
	} catch (e) {
		console.error(e);
	}
}

if (!localStorage.getItem('selectedGame')) {
	localStorage.setItem('selectedGame', 'rby');
}

let selectedGame = games[localStorage.getItem('selectedGame')] ? localStorage.getItem('selectedGame') : 'rby';

function escapeHTML(str, jsContext) {
	const string = new Option(str).innerHTML;

	if (jsContext) {
		string.replace(/"/g, '&quot;').replace(/'/g, "&#039;").replace(/\n/g, '\\n').replace(/\/r/g, '\\r');
	} else {
		string.replace(/"/g, '&quot;');
	}

	return string;
}

function isSoulLinkMode(game) {
	return localStorage.getItem(game + '-soullink-mode') === 'true';
}

function renderOverview(game) {
	const soulLink = isSoulLinkMode(game);
	const playerAName = localStorage.getItem(game + '-player-a-name') || 'Player A';
	const playerBName = localStorage.getItem(game + '-player-b-name') || 'Player B';
	const storageTab = localStorage.getItem(game + '-storage-tab') || 'box';

	const partyA = [], partyB = [], boxA = [], boxB = [], deadA = [], deadB = [];

	games[game].locations.forEach(function(location) {
		const status = localStorage.getItem(game + location.value + '-status');
		const encounterA = localStorage.getItem(game + location.value + '-encounterA');
		const nameA = localStorage.getItem(game + location.value + '-nameA');
		const nicknameA = localStorage.getItem(game + location.value + '-nicknameA');

		if (encounterA) {
			const p = { loc: location.value, encounter: encounterA, name: nameA || encounterA, nickname: nicknameA };
			if (status === 'inparty') partyA.push(p);
			else if (status === 'stored') boxA.push(p);
			else if (status === 'deceased') deadA.push(p);
		}

		if (soulLink) {
			const encounterB = localStorage.getItem(game + location.value + '-encounterB');
			const nameB = localStorage.getItem(game + location.value + '-nameB');
			const nicknameB = localStorage.getItem(game + location.value + '-nicknameB');

			if (encounterB) {
				const p = { loc: location.value, encounter: encounterB, name: nameB || encounterB, nickname: nicknameB };
				if (status === 'inparty') partyB.push(p);
				else if (status === 'stored') boxB.push(p);
				else if (status === 'deceased') deadB.push(p);
			}
		}
	});

	function makeIcon(pkmn, side, cls) {
		const label = pkmn.nickname ? pkmn.nickname + ' (' + pkmn.name + ')' : pkmn.name;
		return '<div class="overview-pkmn ' + cls + '" data-game="' + game + '" data-loc="' + pkmn.loc + '" data-side="' + side + '" title="' + escapeHTML(label) + '">' +
			'<i class="pkmn ' + escapeHTML(pkmn.encounter) + '"></i>' +
			'</div>';
	}

	function partySlots(pokemons, side) {
		let html = '';
		const total = Math.max(6, pokemons.length);
		for (let i = 0; i < total; i++) {
			html += i < pokemons.length
				? makeIcon(pokemons[i], side, 'overview-party-pkmn')
				: '<div class="overview-slot-empty"></div>';
		}
		return '<div class="overview-party-slots">' + html + '</div>';
	}

	function storageIcons(pokemons, side, cls) {
		return pokemons.length
			? pokemons.map(function(p) { return makeIcon(p, side, cls); }).join('')
			: '<span class="overview-empty-text">None</span>';
	}

	function storageSection(pokemons, side, label, cls) {
		const icons = storageIcons(pokemons, side, cls);
		return soulLink
			? '<div class="overview-player-storage"><span class="overview-player-name">' + escapeHTML(label) + '</span><div class="overview-storage-icons">' + icons + '</div></div>'
			: '<div class="overview-storage-icons">' + icons + '</div>';
	}

	// Party — in SoulLink two players side by side each with "Name's Party" label; in Nuzlocke centered with "Party" header
	let partyHtml = '<div class="overview-party' + (soulLink ? ' overview-party--soullink' : '') + '">';
	if (soulLink) {
		partyHtml += '<div class="overview-player-section"><span class="overview-player-name">' + escapeHTML(playerAName) + "'s Party</span>" + partySlots(partyA, 'A') + '</div>';
		partyHtml += '<div class="overview-player-section"><span class="overview-player-name">' + escapeHTML(playerBName) + "'s Party</span>" + partySlots(partyB, 'B') + '</div>';
	} else {
		partyHtml += '<div class="overview-party-header">Party</div>';
		partyHtml += partySlots(partyA, 'A');
	}
	partyHtml += '</div>';

	// Storage — always visible, two tabs
	const boxActive = storageTab === 'box';
	let boxContent, cemeteryContent;
	if (soulLink) {
		boxContent = '<div class="overview-storage-grid">' + storageSection(boxA, 'A', playerAName, 'overview-box-pkmn') + storageSection(boxB, 'B', playerBName, 'overview-box-pkmn') + '</div>';
		cemeteryContent = '<div class="overview-storage-grid">' + storageSection(deadA, 'A', playerAName, 'overview-dead-pkmn') + storageSection(deadB, 'B', playerBName, 'overview-dead-pkmn') + '</div>';
	} else {
		boxContent = storageSection(boxA, 'A', '', 'overview-box-pkmn');
		cemeteryContent = storageSection(deadA, 'A', '', 'overview-dead-pkmn');
	}

	const storageHtml = '<div class="overview-storage">' +
		'<div class="overview-tabs">' +
			'<button class="overview-tab' + (boxActive ? ' active' : '') + '" data-game="' + game + '" data-storage-tab="box">Box</button>' +
			'<button class="overview-tab' + (!boxActive ? ' active' : '') + '" data-game="' + game + '" data-storage-tab="cemetery">Cemetery</button>' +
		'</div>' +
		'<div class="overview-tab-panel' + (boxActive ? '' : ' overview-tab-hidden') + '">' + boxContent + '</div>' +
		'<div class="overview-tab-panel' + (!boxActive ? '' : ' overview-tab-hidden') + '">' + cemeteryContent + '</div>' +
	'</div>';

	return partyHtml + storageHtml;
}

function updateOverview(game) {
	$('#' + game + '-overview').html(renderOverview(game));
}

function renderMain() {
	let linksString = '';
	let segmentsString = '';

	for (const game in games) {
		linksString += '<a class="item" data-tab="' + games[game].id + '">' + games[game].title + '</a>';

		segmentsString += '<div class="ui bottom attached segment tab" data-tab="' + games[game].id + '">' +
			'<div class="ui secondary stackable menu">' +
				'<div class="horizontally fitted item">' +
					'<h2 class="ui header">' + games[game].title + '</h2>' +
				'</div>' +
				'<div class="right horizontally fitted item">' +
					'<button class="ui basic icon button gameSettings" title="Game settings"><i class="settings icon"></i></button>' +
				'</div>' +
			'</div>' +
			'<div id="' + games[game].id + '-overview" class="pokemon-overview"></div>' +
			'<div class="filter-bar">' +
				'<span class="filter-label">Show:</span>' +
				'<label class="filter-item"><input type="checkbox" class="filter-checkbox" data-filter="missed" checked> Missed</label>' +
				'<label class="filter-item"><input type="checkbox" class="filter-checkbox" data-filter="deceased" checked> Deceased</label>' +
				'<label class="filter-item"><input type="checkbox" class="filter-checkbox" data-filter="stored" checked> Stored</label>' +
				'<label class="filter-item"><input type="checkbox" class="filter-checkbox" data-filter="blank" checked> Blank Encounters</label>' +
			'</div>' +
			'<table class="ui table sortable selectable">' +
				'<thead>' +
					'<tr>' +
						'<th class="center aligned two wide">Location</th>' +
						'<th id="' + games[game].id + '-th-encounterA" class="center aligned two wide">Encounter A</th>' +
						'<th id="' + games[game].id + '-th-nicknameA" class="center aligned two wide">Nickname A</th>' +
						'<th id="' + games[game].id + '-th-encounterB" class="center aligned two wide soullink-only">Encounter B</th>' +
						'<th id="' + games[game].id + '-th-nicknameB" class="center aligned two wide soullink-only">Nickname B</th>' +
						'<th class="center aligned two wide">Status</th>' +
						'<th class="center aligned no-sort one wide disabled"></th>' +
						'<th class="center aligned no-sort one wide disabled"></th>' +
					'</tr>' +
				'</thead>' +
				'<tbody id="' + games[game].id + '-locations">' +
				'</tbody>' +
			'</table>' +
		'</div>';
	};

	return '<div class="ui stackable top attached borderless menu">' +
		'<div id="gameMenu" class="ui dropdown item">' +
			'<i class="sidebar icon"></i>' +
			'Games' +
			'<i class="dropdown icon"></i>' +
			'<div class="menu">' +
				linksString +
			'</div>' +
		'</div>' +
		'<div class="right horizontally fitted item dataControls">' +
			'<button id="saveData" class="ui green button"><i class="download icon"></i>Export</button>' +
			'<input id="fileLoader" accept=".json, application/json" type="file">' +
			'<label id="loadData" class="ui blue button fileInput" for="fileLoader"><i class="upload icon"></i>Import</label>' +
			'<button id="resetData" class="ui red button"><i class="remove icon"></i>Reset</button>' +
		'</div>' +
	'</div>' +
	segmentsString;
}

function renderLocations(game, darkTheme) {
	string = '';

	game.locations.forEach((location, index) => {
		const locationValue = escapeHTML(location.value);
		const nameA = localStorage.getItem(game.id + location.value + '-nameA');
		const encounterA = localStorage.getItem(game.id + location.value + '-encounterA');
		const nicknameA = localStorage.getItem(game.id + location.value + '-nicknameA');
		const nameB = localStorage.getItem(game.id + location.value + '-nameB');
		const encounterB = localStorage.getItem(game.id + location.value + '-encounterB');
		const nicknameB = localStorage.getItem(game.id + location.value + '-nicknameB');
		const locationStatus = localStorage.getItem(game.id + location.value + '-status');

		const statusClass = locationStatus ? 'status-' + locationStatus : '';
		const customClass = location.order !== undefined ? 'customLocation' : '';
		const trClass = [customClass, statusClass].filter(c => c).join(' ');
		string += '<tr' + (trClass ? ' class="' + trClass + '"' : '') + '>' +
			'<td data-sort-value="' + index + '">' + escapeHTML(location.name) + '</td>' +
			'<td data-sort-value="' + (encounterA ? escapeHTML(encounterA) : '') + '">' +
				'<div data-name="' + (nameA ? escapeHTML(nameA) : '') + '" data-value="' + (encounterA ? escapeHTML(encounterA) : '') + '" data-name-key="' + game.id + locationValue + '-nameA" id="' + game.id + locationValue + '-encounterA" class="ui' + (darkTheme ? ' inverted' : '') + ' fluid search selection long dropdown encounter-picker" aria-label="' + location.name + ' encounter A">' +
					'<input value="' + (encounterA ? escapeHTML(encounterA) : '') + '" aria-label="' + location.name + ' encounter A" name="pokemonA" type="hidden">' +
					'<i class="dropdown icon"></i>' +
					'<div class="default text">Encounter</div>' +
					'<div class="menu"></div>' +
				'</div>' +
			'</td>' +
			'<td data-sort-value="' + (nicknameA ? escapeHTML(nicknameA) : '') + '">' +
				'<div class="ui' + (darkTheme ? ' inverted' : '') + ' fluid input">' +
					'<input autocomplete="off" maxlength="' + game.nameLimit + '" class="nickname-input" value="' + (nicknameA ? escapeHTML(nicknameA) : '') + '" id="' + game.id + locationValue + '-nicknameA" name="nicknameA" placeholder="Nickname" type="text" aria-label="' + location.name + ' nickname A">' +
				'</div>' +
			'</td>' +
			'<td class="soullink-only" data-sort-value="' + (encounterB ? escapeHTML(encounterB) : '') + '">' +
				'<div data-name="' + (nameB ? escapeHTML(nameB) : '') + '" data-value="' + (encounterB ? escapeHTML(encounterB) : '') + '" data-name-key="' + game.id + locationValue + '-nameB" id="' + game.id + locationValue + '-encounterB" class="ui' + (darkTheme ? ' inverted' : '') + ' fluid search selection long dropdown encounter-picker" aria-label="' + location.name + ' encounter B">' +
					'<input value="' + (encounterB ? escapeHTML(encounterB) : '') + '" aria-label="' + location.name + ' encounter B" name="pokemonB" type="hidden">' +
					'<i class="dropdown icon"></i>' +
					'<div class="default text">Encounter</div>' +
					'<div class="menu"></div>' +
				'</div>' +
			'</td>' +
			'<td class="soullink-only" data-sort-value="' + (nicknameB ? escapeHTML(nicknameB) : '') + '">' +
				'<div class="ui' + (darkTheme ? ' inverted' : '') + ' fluid input">' +
					'<input autocomplete="off" maxlength="' + game.nameLimit + '" class="nickname-input" value="' + (nicknameB ? escapeHTML(nicknameB) : '') + '" id="' + game.id + locationValue + '-nicknameB" name="nicknameB" placeholder="Nickname" type="text" aria-label="' + location.name + ' nickname B">' +
				'</div>' +
			'</td>' +
			'<td data-sort-value="' + (locationStatus ? escapeHTML(locationStatus) : '') + '">' +
				'<div id="' + game.id + locationValue + '-status" class="ui' + (darkTheme ? ' inverted' : '') + ' fluid selection long dropdown status-picker" aria-label="' + location.name + ' status">' +
					'<input value="' + (locationStatus ? escapeHTML(locationStatus) : '') + '" name="status" type="hidden">' +
					'<i class="dropdown icon"></i>' +
					'<div class="default text">Status</div>' +
					'<div class="menu">' +
						'<div class="item" data-value="inparty"><i class="check icon"></i>In Party</div>' +
						'<div class="item" data-value="stored"><i class="hdd icon"></i>Stored</div>' +
						'<div class="item" data-value="missed"><i class="ban icon"></i>Missed</div>' +
						'<div class="item" data-value="deceased"><i class="skull icon"></i>Deceased</div>' +
					'</div>' +
				'</div>' +
			'</td>' +
			'<td><div title="Add location" class="ui' + (darkTheme ? ' inverted' : '') + ' basic addLocationRow fluid icon button" data-location-value="' + locationValue + '"><i class="plus icon"></i></div></td>' +
			'<td><div title="Delete" class="ui' + (darkTheme ? ' inverted' : '') + ' basic singleReset fluid icon button" data-location-id="' + locationValue + '"><i class="remove icon"></i></div></td>' +
		'</tr>';
	});

	return string;
}

function resetGame(game, removeLocations) {
	games[selectedGame].locations.forEach(location => {
		clearLocation(selectedGame + location.value);
	});

	if (removeLocations) {
		localStorage.removeItem(selectedGame + '-custom-locations');

		games[selectedGame].locations = games[selectedGame].locations.filter(location => location.value[0] !== 'c');
	}
}

function filterByProperty(array, property) {
	const values = {};

	return array.filter(entry => {
		const value = entry[property];

		if (values[value] !== undefined) {
			return false;
		} else {
			values[value] = true;
			return true;
		}
	});
}

function uploadFile(input) {
	if (input.files && input.files[0]) {
		file = input.files[0];
		fr = new FileReader();

		fr.onload = () => {
			try {
				const data = JSON.parse(fr.result);

				if (data && data.hasOwnProperty('locations')) {
					const locations = filterByProperty(data.locations, 'id');

					resetGame(data.id, true);

					if (data.settings && data.settings.soullinkMode) {
						localStorage.setItem(data.id + '-soullink-mode', 'true');
					} else {
						localStorage.removeItem(data.id + '-soullink-mode');
					}

					const importPlayerA = data.settings && data.settings.playerAName;
					const importPlayerB = data.settings && data.settings.playerBName;
					if (importPlayerA) {
						localStorage.setItem(data.id + '-player-a-name', importPlayerA);
					} else {
						localStorage.removeItem(data.id + '-player-a-name');
					}
					if (importPlayerB) {
						localStorage.setItem(data.id + '-player-b-name', importPlayerB);
					} else {
						localStorage.removeItem(data.id + '-player-b-name');
					}

					if (data.customLocations.length) {
						const customLocations = filterByProperty(data.customLocations, 'value');

						localStorage.setItem(data.id + '-custom-locations', JSON.stringify(customLocations));
					} else {
						localStorage.removeItem(data.id + '-custom-locations');
					}

					locations.forEach(location => {
						populateLocation(data.id, location);
					});

					updateTab(data.id);

					if (localStorage.getItem('selectedGame') !== data.id) {
						$('#gameMenu .menu').find('.item[data-tab="' + data.id + '"]').click();
					}
				} else {
					$('#errorMessage').removeClass('hidden');
					$('#messageHeader').text('Incorrect format');
					$('#messageContent').text('The uploaded file contains invalid data');
				}
			} catch (e) {
				console.error(e);

				$('#errorMessage').removeClass('hidden');
				$('#messageHeader').text('Could not read file');
				$('#messageContent').text('The uploaded file was not recognized as valid JSON');
			}
		};

		fr.readAsText(file);
	}
}

function populateLocation(game, data) {
	const id = game + data.id;
	const encounterAElm = $('#' + id + '-encounterA');
	const nicknameAElm = $('#' + id + '-nicknameA');
	const encounterBElm = $('#' + id + '-encounterB');
	const nicknameBElm = $('#' + id + '-nicknameB');
	const statusElm = $('#' + id + '-status');

	if (data.encounterA) {
		encounterAElm.dropdown('set value', data.encounterA);
		encounterAElm.dropdown('set text', '<i class="pkmn ' + data.encounterA + '"></i>' + data.nameA);
		encounterAElm.data('name', data.nameA);
		localStorage.setItem(id + '-encounterA', data.encounterA);
		localStorage.setItem(id + '-nameA', data.nameA);
	} else {
		encounterAElm.closest('td').data('sortValue', '');
		encounterAElm.dropdown('clear');
		localStorage.removeItem(id + '-encounterA');
		localStorage.removeItem(id + '-nameA');
	}

	if (data.nicknameA) {
		nicknameAElm.val(data.nicknameA);
		localStorage.setItem(id + '-nicknameA', data.nicknameA);
	} else {
		nicknameAElm.val('').closest('td').data('sortValue', '');
		localStorage.removeItem(id + '-nicknameA');
	}

	if (data.encounterB) {
		encounterBElm.dropdown('set value', data.encounterB);
		encounterBElm.dropdown('set text', '<i class="pkmn ' + data.encounterB + '"></i>' + data.nameB);
		encounterBElm.data('name', data.nameB);
		localStorage.setItem(id + '-encounterB', data.encounterB);
		localStorage.setItem(id + '-nameB', data.nameB);
	} else {
		encounterBElm.closest('td').data('sortValue', '');
		encounterBElm.dropdown('clear');
		localStorage.removeItem(id + '-encounterB');
		localStorage.removeItem(id + '-nameB');
	}

	if (data.nicknameB) {
		nicknameBElm.val(data.nicknameB);
		localStorage.setItem(id + '-nicknameB', data.nicknameB);
	} else {
		nicknameBElm.val('').closest('td').data('sortValue', '');
		localStorage.removeItem(id + '-nicknameB');
	}

	if (data.status) {
		statusElm.dropdown('set selected', data.status);
		localStorage.setItem(id + '-status', data.status);
	} else {
		statusElm.closest('td').data('sortValue', '');
		statusElm.dropdown('clear');
		localStorage.removeItem(id + '-status');
	}
}

function clearLocation(id) {
	const encounterA = id + '-encounterA';
	const nicknameA = id + '-nicknameA';
	const nameA = id + '-nameA';
	const encounterB = id + '-encounterB';
	const nicknameB = id + '-nicknameB';
	const nameB = id + '-nameB';
	const status = id + '-status';

	$('#' + encounterA).dropdown('clear');
	$('#' + encounterA).closest('td').data('sortValue', '');
	$('#' + nicknameA).val('').closest('td').data('sortValue', '');
	$('#' + encounterB).dropdown('clear');
	$('#' + encounterB).closest('td').data('sortValue', '');
	$('#' + nicknameB).val('').closest('td').data('sortValue', '');
	$('#' + status).dropdown('clear');
	$('#' + status).closest('td').data('sortValue', '');

	localStorage.removeItem(encounterA);
	localStorage.removeItem(nicknameA);
	localStorage.removeItem(nameA);
	localStorage.removeItem(encounterB);
	localStorage.removeItem(nicknameB);
	localStorage.removeItem(nameB);
	localStorage.removeItem(status);
}

function sortLocations(game) {
	const locations = games[game].locations.filter(location => location.value[0] !== 'c');

	let customLocations = JSON.parse(localStorage.getItem(game + '-custom-locations') || '[]');
	let initialLength = customLocations.length;

	if (initialLength) {
		customLocations.sort((a, b) => a.order < b.order ? -1 : a.order > b.order ? 1 : 0);

		while (customLocations.length !== 0) {
			const locationRemoval = [];
			initialLength = customLocations.length;

			customLocations.forEach((customLocation, index) => {
				const insertIndex = locations.findIndex(e => e.value == customLocation.order);

				if (insertIndex !== -1) {
					locations.splice(insertIndex + 1, 0, customLocations[index]);
					locationRemoval.push(customLocation.value);
				}
			});

			customLocations = customLocations.filter(location => !locationRemoval.includes(location.value));

			if (initialLength === customLocations.length) {
				break;
			}
		}
	}

	games[game].locations = locations;
}

function updateTableMode(game) {
	const soulLink = isSoulLinkMode(game);
	const playerAName = localStorage.getItem(game + '-player-a-name') || '';
	const playerBName = localStorage.getItem(game + '-player-b-name') || '';

	$('#' + game + '-locations').closest('table').toggleClass('table-nuzlocke-mode', !soulLink);

	const thEncA = $('#' + game + '-th-encounterA');
	const thNickA = $('#' + game + '-th-nicknameA');
	const thEncB = $('#' + game + '-th-encounterB');
	const thNickB = $('#' + game + '-th-nicknameB');

	if (!soulLink) {
		thEncA.text('Encounter');
		thNickA.text('Nickname');
	} else if (playerAName) {
		thEncA.text(playerAName + "’s Encounter");
		thNickA.text(playerAName + "’s Nickname");
	} else {
		thEncA.text('Encounter A');
		thNickA.text('Nickname A');
	}

	if (playerBName) {
		thEncB.text(playerBName + "’s Encounter");
		thNickB.text(playerBName + "’s Nickname");
	} else {
		thEncB.text('Encounter B');
		thNickB.text('Nickname B');
	}
}

function applyFilters(game) {
	const tabEl = $('[data-tab="' + game + '"]');
	const showMissed = tabEl.find('.filter-checkbox[data-filter="missed"]').is(':checked');
	const showDeceased = tabEl.find('.filter-checkbox[data-filter="deceased"]').is(':checked');
	const showStored = tabEl.find('.filter-checkbox[data-filter="stored"]').is(':checked');
	const showBlank = tabEl.find('.filter-checkbox[data-filter="blank"]').is(':checked');

	$('#' + game + '-locations tr').each(function() {
		const $row = $(this);
		const hasMissed = $row.hasClass('status-missed');
		const hasDeceased = $row.hasClass('status-deceased');
		const hasStored = $row.hasClass('status-stored');
		const hasInParty = $row.hasClass('status-inparty');
		const isBlank = !hasMissed && !hasDeceased && !hasStored && !hasInParty;

		const show =
			(!hasMissed || showMissed) &&
			(!hasDeceased || showDeceased) &&
			(!hasStored || showStored) &&
			(!isBlank || showBlank);

		$row.toggle(show);
	});
}

function initTab(tab) {
	$('#' + tab + '-locations .ui.dropdown').dropdown({
		onChange: function(value, name) {
			$(this).closest('td').data('sortValue', value);
			localStorage.setItem($(this).prop('id'), value);

			if ($(this).hasClass('status-picker')) {
				const row = $(this).closest('tr');
				row.removeClass('status-inparty status-stored status-missed status-deceased');
				if (value) row.addClass('status-' + value);
				applyFilters(tab);
				updateOverview(tab);
			}
		},
	});

	$('#' + tab + '-locations .encounter-picker').dropdown({
		onChange: function(value, name) {
			const regex = new RegExp(/[^>]*$/, 'i');
			const elm = $(this);

			if (value && name) {
				elm.closest('td').data('sortValue', value);
				elm.data('name', name);
				localStorage.setItem(elm.data('nameKey'), regex.exec(name));
				localStorage.setItem(elm.prop('id'), value);
				updateOverview(tab);
				elm.find('.search').blur();
			}
		},
		onShow: function() {
			const value = $(this).dropdown('get value');
			$(this).dropdown('change values', pkmnData);

			if (value) {
				$(this).dropdown('set selected', value);

				setTimeout(() => {
					this.querySelector('[data-value="' + value + '"]').scrollIntoView({block: 'center'});
				}, 10);
			}

			$(this).find('.search').focus();
		},
		onHide: function() {
			const elm = $(this);
			const value = elm.dropdown('get value');
			const name = elm.data('name');

			elm.find('.search').val('');

			elm.dropdown('change values', []);

			if (value) {
				elm.dropdown('set value', value);
				elm.dropdown('set text', name);
			} else {
				elm.dropdown('restore placeholder text');
			}
		},
		className: {
			icon: 'pkmn'
		},
		forceSelection: false,
		ignoreCase: true,
		ignoreDiacritics: true,
		selectOnKeydown: false
	});

	$('#' + tab + '-locations .encounter-picker[data-name!=""]').each(function() {
		const value = escapeHTML($(this).data('value'));
		$(this).dropdown('set value', value);
		$(this).dropdown('set text', '<i class="pkmn ' + value + '"></i>' + $(this).data('name'));
	});

	$('#' + tab + '-locations').closest('table').tablesort();
	$('#' + tab + '-locations').closest('table').find('th').first().trigger('click');
}

function saveData(game) {
	const blobData = {
		id: game,
		locations: [],
		customLocations: JSON.parse(localStorage.getItem(game + '-custom-locations') || '[]'),
		settings: {}
	};

	if (isSoulLinkMode(game)) {
		blobData.settings.soullinkMode = true;
		const playerAName = localStorage.getItem(game + '-player-a-name');
		const playerBName = localStorage.getItem(game + '-player-b-name');
		if (playerAName) blobData.settings.playerAName = playerAName;
		if (playerBName) blobData.settings.playerBName = playerBName;
	}

	games[game].locations.forEach(location => {
		const encounterA = localStorage.getItem(game + location.value + '-encounterA');
		const nameA = localStorage.getItem(game + location.value + '-nameA');
		const nicknameA = localStorage.getItem(game + location.value + '-nicknameA');
		const encounterB = localStorage.getItem(game + location.value + '-encounterB');
		const nameB = localStorage.getItem(game + location.value + '-nameB');
		const nicknameB = localStorage.getItem(game + location.value + '-nicknameB');
		const status = localStorage.getItem(game + location.value + '-status');

		if (encounterA || nameA || nicknameA || encounterB || nameB || nicknameB || status) {
			blobData.locations.push({
				id: location.value,
				encounterA: encounterA,
				nameA: nameA,
				nicknameA: nicknameA,
				encounterB: encounterB,
				nameB: nameB,
				nicknameB: nicknameB,
				status: status
			});
		}
	});

	const link = document.createElement('a');
	const blob = new Blob([JSON.stringify(blobData)], {type: 'application/json;charset=utf-8'});

	link.setAttribute('href', URL.createObjectURL(blob));
	link.setAttribute('download', game + '.' + new Date().toISOString().slice(0, 10) + '.json');
	link.click();
}

function addLocation(location, game) {
	const customLocations = JSON.parse(localStorage.getItem(game + '-custom-locations') || '[]');

	if (customLocations.length) {
		location.value = 'c' + (parseInt((customLocations[customLocations.length - 1]).value.slice(1)) + 1);
	} else {
		location.value = 'c0';
	}

	const duplicateLocationOrder = customLocations.findIndex(e => e.order == location.order);

	if (duplicateLocationOrder !== -1) {
		customLocations[duplicateLocationOrder].order = location.value;
	}

	customLocations.push(location);

	localStorage.setItem(game + '-custom-locations', JSON.stringify(customLocations));

	updateTab(game);
}

function removeLocation(value, game) {
	const customLocations = JSON.parse(localStorage.getItem(game + '-custom-locations') || '[]');
	const location = customLocations.find(location => location.value == value);
	const dependantLocation = customLocations.findIndex(e => e.order == location.value);

	if (dependantLocation !== -1) {
		customLocations[dependantLocation].order = location.order;
	}

	customLocations.splice(customLocations.findIndex(e => e.value == location.value), 1);

	localStorage.setItem(game + '-custom-locations', JSON.stringify(customLocations));

	updateTab(game);
}

function updateTab(game) {
	sortLocations(game);

	$('#' + game + '-locations').html(renderLocations(games[game], localStorage.getItem('darkTheme') === 'true'));
	initTab(game);
	updateTableMode(game);
	applyFilters(game);
	updateOverview(game);

	games[game].loaded = true;
}

sortLocations(selectedGame);

const darkTheme = localStorage.getItem('darkTheme') === 'true';

$('#dark-theme').prop('checked', darkTheme)
.on('change', function() {
	localStorage.setItem('darkTheme', this.checked);

	document.body.classList.toggle('dark-theme', this.checked);

	if (this.checked) {
		$('.ui:not(.footer)').addClass('inverted');
	} else {
		$('.ui:not(.footer)').removeClass('inverted');
	}
});

document.body.classList.toggle('dark-theme', darkTheme);

if (darkTheme) {
	$('.ui.loading.segment').addClass('inverted');
}

$(() => {
	$(document).on('click', '#saveData', () => {
		saveData(selectedGame);
	}).on('click', '.singleReset.button', function() {
		const id = selectedGame + $(this).data('locationId');

		if ($(this).closest('tr').hasClass('customLocation')) {
			$('#clearModal').data('target', $(this).data('locationId'));
			$('#clearModal').modal('show');
		} else {
			clearLocation(id);
		}
	}).on('change', '.nickname-input', function() {
		const elm = $(this);

		if (elm.val()) {
			elm.closest('td').data('sortValue', elm.val());
			localStorage.setItem(elm.prop('id'), elm.val());
		} else {
			elm.closest('td').data('sortValue', '');
			localStorage.removeItem(elm.prop('id'));
		}
		const nicknameGame = elm.closest('[data-tab]').data('tab');
		if (nicknameGame) updateOverview(nicknameGame);
	}).on('click', '.addLocationRow', function() {
		$('#locationModal').data('sourceLocation', $(this).data('locationValue'));
		$('#locationModal').modal('show');
	}).on('change', 'input[name="gameMode"]', function() {
		const soulLink = $(this).val() === 'soullink';
		localStorage.setItem(selectedGame + '-soullink-mode', String(soulLink));
		$('#playerNamesSection').toggle(soulLink);
		updateTableMode(selectedGame);
		updateOverview(selectedGame);
	}).on('input', '#playerAName', function() {
		const val = $(this).val().trim();
		if (val) {
			localStorage.setItem(selectedGame + '-player-a-name', val);
		} else {
			localStorage.removeItem(selectedGame + '-player-a-name');
		}
		updateTableMode(selectedGame);
		updateOverview(selectedGame);
	}).on('input', '#playerBName', function() {
		const val = $(this).val().trim();
		if (val) {
			localStorage.setItem(selectedGame + '-player-b-name', val);
		} else {
			localStorage.removeItem(selectedGame + '-player-b-name');
		}
		updateTableMode(selectedGame);
		updateOverview(selectedGame);
	}).on('change', '.filter-checkbox', function() {
		const game = $(this).closest('[data-tab]').data('tab');
		applyFilters(game);
	}).on('click', '.overview-tab', function() {
		const game = $(this).data('game');
		const tab = $(this).data('storageTab');
		localStorage.setItem(game + '-storage-tab', tab);
		updateOverview(game);
	}).on('click', '.overview-party-pkmn', function() {
		const game = $(this).data('game');
		const loc = $(this).data('loc');
		$('#' + game + loc + '-status').dropdown('set selected', 'stored');
	}).on('click', '.overview-box-pkmn', function() {
		const game = $(this).data('game');
		const loc = $(this).data('loc');
		const partyCount = games[game].locations.filter(function(location) {
			return localStorage.getItem(game + location.value + '-status') === 'inparty';
		}).length;
		if (partyCount < 6) {
			$('#' + game + loc + '-status').dropdown('set selected', 'inparty');
		}
	});

	$('#resetModal').modal({
		onApprove: e => {
			resetGame(selectedGame, e.data('action') === 'remove');
			updateTab(selectedGame);
		}
	});

	$('#clearModal').modal({
		onApprove: function(e) {
			if (e.data('action') === 'clear') {
				clearLocation(selectedGame + $(this).data('target'));
			} else if (e.data('action') === 'remove') {
				clearLocation(selectedGame + $(this).data('target'));
				removeLocation($(this).data('target'), selectedGame);
			}

			$(this).removeData('target');
		}
	});

	$('#importModal').modal({
		onApprove: () => {
			uploadFile($('#fileLoader')[0]);
		}
	});

	$('#customLocationName').on('input', function() {
		$(this).parent('.field').toggleClass('error', false);
	});

	$('#locationModal').modal({
		onApprove: () => {
			const locationName = $('#customLocationName').val().trim();

			$('#customLocationName').parent().toggleClass('error', locationName == false);

			if (locationName == false) {
				return false;
			}

			const sourceLocationValue = $('#locationModal').data('sourceLocation');
			const placement = $('input[name="locationPlacement"]:checked').val() || 'after';

			let order;
			if (placement === 'before') {
				sortLocations(selectedGame);
				const sortedLocations = games[selectedGame].locations;
				const idx = sortedLocations.findIndex(e => e.value == sourceLocationValue);
				order = idx > 0 ? sortedLocations[idx - 1].value : sourceLocationValue;
			} else {
				order = sourceLocationValue;
			}

			addLocation({name: locationName, order: order}, selectedGame);

			$('#customLocationName').val('');
			$('#locationAfter').prop('checked', true);
		}
	});

	$('#settingsModal').modal({
		onShow: () => {
			const soulLink = isSoulLinkMode(selectedGame);
			$('input[name="gameMode"][value="' + (soulLink ? 'soullink' : 'nuzlocke') + '"]').prop('checked', true);
			$('#playerNamesSection').toggle(soulLink);
			$('#playerAName').val(localStorage.getItem(selectedGame + '-player-a-name') || '');
			$('#playerBName').val(localStorage.getItem(selectedGame + '-player-b-name') || '');
		}
	});

	$('.message .close').on('click', function() {
		$(this).closest('.message').transition('fade');
	});

	$('#mainContent').html(renderMain());

	$('#' + selectedGame + '-locations').html(renderLocations(games[selectedGame], darkTheme));

	$('[data-tab="' + selectedGame + '"]').addClass('active');

	$('#gameMenu .menu .item').tab({
		onFirstLoad: tabPath => {
			if (!games[tabPath].loaded) {
				updateTab(tabPath);
			}
		},
		onLoad: tabPath => {
			selectedGame = tabPath;
			localStorage.setItem('selectedGame', tabPath);
		}
	});

	$('#resetModal').modal('attach events', '#resetData', 'show');

	$('#settingsModal').modal('attach events', '.gameSettings', 'show');

	$('#fileLoader').on('change', () => {
		$('#importModal').modal('show');
	});

	$('#gameMenu').dropdown();

	if (darkTheme) {
		$('.ui:not(.footer)').addClass('inverted');
	}

	initTab(selectedGame);
	updateTableMode(selectedGame);
	applyFilters(selectedGame);
	updateOverview(selectedGame);
});
