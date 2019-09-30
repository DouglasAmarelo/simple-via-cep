(() => {
	'use strict';

	// Variables
	const GM_API_K      = `AIzaSyAl8ZMbjDz9QTCbTkGwCR_7NmZcd0XZMOo`;
	const SPLocation    = { lat: -23.6536633, lng: -46.7066927 };
	const $form         = document.querySelector('.cep-consult');
	const $cepInput     = $form.querySelector('.cep-consult__cep-input');
	const $cepError     = document.querySelector('.cep-consult__error');
	const $map          = document.querySelector('.map');
	const $mapClose     = document.querySelector('.map-close');
	const $addressFound = document.querySelector('.address-found');
	let map;
	let marker;
	let inputValue;

	// Helpers
	const showMap = () => $map.parentNode.classList.remove('hide');

	const hideMap = () => $map.parentNode.classList.add('hide');

	const getDataFromApi = async (apiUrl) => {
		try {
			const response = await fetch(apiUrl);
			const data = await response.json();

			return data;
		}
		catch (err) {
			return console.error('Error: ', err);
		}
	};

	// Get information from ViaCEP
	const getAddress = cep => getDataFromApi(`https://viacep.com.br/ws/${cep}/json/`);

	// Get information from Google Maps
	const getGeoLocation = address => getDataFromApi(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GM_API_K}`);

	// Start the map with the information
	const renderMap = (location = SPLocation, zoom = 10) => {
		map = new google.maps.Map($map, {
			center: location,
			zoom
		});

		marker = new google.maps.Marker({
			position: location,
			animation: google.maps.Animation.DROP,
			map
		});
	};

	// Render the address information
	const renderAddressInfo = ({ bairro, cep, localidade, uf, logradouro }) => {
		const template = `
			<div class="address">
				<h2 class="address__title">${logradouro}</h2>
				<p class="address__text">${bairro}</p>
				<p class="address__text">${localidade} - ${uf}</p>
				<p class="address__text">${cep}</p>
			</div>
		`;

		$addressFound.innerHTML = template;
	};

	// Render an error message in to the form
	const renderError = message => {
		$cepError.textContent = message;

		setTimeout(() => {
			$cepError.textContent = '';
		}, 2000);
	};

	// Reset form input and hide the map
	const resetForm = () => {
		$cepInput.value = '';

		hideMap();
	};

	// Handle input data
	const handleInputValue = (event) => {
		inputValue = event.target.value;
		inputValue = inputValue.replace(/\D/gmi, '');
		inputValue = inputValue.replace(/(\d{5})(\d{1,3})/gmi, '$1-$2');

		$cepInput.value = inputValue;
	};

	// Listeners
	$cepInput.addEventListener('input', handleInputValue);
	$mapClose.addEventListener('click', resetForm);

	// Handle submit form
	$form.addEventListener('submit', event => {
		event.preventDefault();
		const cep = $form.cep.value;

		// If it has no zip code, renders the error and stops code execution
		if (!cep) {
			renderError('Por favor, informe um CEP');

			return;
		}

		// If the current zip code is the same as the previously searched zip code,
		// it does not call the API, it just displays the map with the previous data
		if ($map.getAttribute('zipCode-searched') === cep) {
			showMap();

			return;
		}

		// Get the address informarion from the ViaCEP Api
		getAddress(cep).then(viaCEPData => {
			if (viaCEPData.erro) {
				renderError(`Nenhuma informação encontrada.`);
				hideMap();

				return;
			}

			getGeoLocation(viaCEPData.logradouro).then(mapLocationData => {
				if (mapLocationData && mapLocationData.results[0]) {
					let geoLocation = mapLocationData.results[0].geometry.location;
					let mapZoom = 14;

					renderMap(geoLocation, mapZoom);
					renderAddressInfo(viaCEPData);
					showMap();

					return;
				}

				renderError(`Nenhum resultado encontrado para o CEP: ${cep}`);
			});

			// Set the current zip code to the map
			$map.setAttribute('zipCode-searched', cep);
		});
	});
})();