// Variables
const GM_API_K      = `AIzaSyAl8ZMbjDz9QTCbTkGwCR_7NmZcd0XZMOo`;
const $form         = document.querySelector('.cep-consult');
const $cepInput     = $form.querySelector('.cep-consult__cep-input');
const $cepError     = document.querySelector('.cep-consult__error');
const $map          = document.querySelector('.map');
const $mapClose     = document.querySelector('.map-close');
const $addressFound = document.querySelector('.address-found');
let map;
let marker;

// Helpers
const showMap = () => $map.parentNode.setAttribute('class', 'card');

const hideMap = () => $map.parentNode.setAttribute('class', 'card hide');

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

// Get information from viaCEP
const getAddress = cep => {
	const apiUrl = `https://viacep.com.br/ws/${cep}/json/`;

	return getDataFromApi(apiUrl);
};

// Get information from Google Maps
const getGeoLocation = address => {
	const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GM_API_K}`;

	return getDataFromApi(apiUrl);
};

// Start the map with the information
const initMap = (location, zoom = 10) => {
	map = new google.maps.Map($map, {
		center: location,
		zoom: zoom
	});

	marker = new google.maps.Marker({
		position: location,
		map: map,
		animation: google.maps.Animation.DROP,
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

// Handle submit form
$form.addEventListener('submit', e => {
	e.preventDefault();
	const cep = $form.cep.value;

	// If has no CEP, render an error and stop the execution of the code
	if (!cep) {
		renderError('Por favor, informe um CEP');
		return;
	}

	// If the cep to search is equal to the prev searched cep, stop the execution of the code
	if ($map.getAttribute('data-researched') === cep) {
		showMap();
		return;
	}

	getAddress(cep).then(viaCEPData => {
		if (viaCEPData.erro) {
			renderError(`Nenhuma informação encontrada.`);
			hideMap();
			return;
		}

		$map.setAttribute('data-researched', cep);

		getGeoLocation(viaCEPData.logradouro).then(mapLocationData => {
			if (mapLocationData && mapLocationData.results[0]) {
				let geoLocation = mapLocationData.results[0].geometry.location;

				initMap(geoLocation, 14);
				renderAddressInfo(viaCEPData);
				showMap();

				return;
			}

			renderError(`Nenhum resultado encontrado para o CEP: ${cep}`);
		});
	});
});

const handleInputValue = (event) => {
	let inputValue = event.target.value;
	inputValue = inputValue.replace(/\D/gmi, '');
	inputValue = inputValue.replace(/(\d{5})(\d{1,3})/gmi, '$1-$2');

	$cepInput.value = inputValue;
};

$cepInput.addEventListener('input', handleInputValue);
$mapClose.addEventListener('click', resetForm);
