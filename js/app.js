// Variables
const GM_API_K      = `AIzaSyAl8ZMbjDz9QTCbTkGwCR_7NmZcd0XZMOo`;
const SPLoLocation  = { lat: -23.6536633, lng: -46.7066927 };
const $form         = document.querySelector('.cep-consult');
const $cepInput     = $form.querySelector('.cep-consult__cep-input');
const $cepError     = document.querySelector('.cep-consult__error');
const $map          = document.querySelector('.map');
const $mapClose     = document.querySelector('.map-close');
const $addressFound = document.querySelector('.address-found');
let map;
let marker;

function initMap(location = SPLoLocation, zoom = 10) {
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

const mapVisibilityToggle = () => $map.parentNode.classList.toggle('hide');

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

const getAddress = cep => {
	const apiUrl = `https://viacep.com.br/ws/${cep}/json/`;

	return getDataFromApi(apiUrl);
};

const getGeoLocation = address => {
	const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GM_API_K}`;

	return getDataFromApi(apiUrl);
};

const renderMapInfo = ({ bairro, cep, localidade, uf, logradouro }) => {
	if (!cep) {
		renderError(`Nenhuma informação encontrada.`);
		return;
	}

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

const renderError = message => $cepError.textContent = message;

$form.addEventListener('submit', e => {
	e.preventDefault();
	const cep = $form.cep.value;

	if (!cep) {
		renderError('Por favor, informe um CEP');
		return;
	}

	const cepInformation = getAddress(cep);
	cepInformation.then(data => {
		renderMapInfo(data);
		mapVisibilityToggle();
		getGeoLocation(data.logradouro).then(data => {
			if (data && data.results[0]) {
				let geoLocation = data.results[0].geometry.location;
				initMap(geoLocation, 14);
			}
			else {
				renderError(`Nenhum resultado encontrado para o CEP: ${cep}`);
			}
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

$mapClose.addEventListener('click', mapVisibilityToggle);
