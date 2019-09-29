// Variables
const API_KEY_GOOGLEMAPS = `AIzaSyAl8ZMbjDz9QTCbTkGwCR_7NmZcd0XZMOo`;
const $form = document.querySelector('.consulta-cep');
const $cepInput = $form.querySelector('.consulta-cep__cep-input');
const $map = document.querySelector('.map');
const $mapClose = document.querySelector('.close-map');
const $addressFound = document.querySelector('.address-found');
const saoPauloLocation = { lat: -23.6536633, lng: -46.7066927 };
let map;
let marker;

function initMap(location = saoPauloLocation, zoom = 10) {
	map = new google.maps.Map($map, {
		center: location,
		zoom: zoom
	});

	marker = new google.maps.Marker({
		position: location,
		map: map,
		animation: google.maps.Animation.DROP,
	});

	$map.classList.add('is--active');
	mapVisibilityToggle();
};


const mapVisibilityToggle = () => {
	$map.parentNode.classList.toggle('hide');
};

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
	const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${API_KEY_GOOGLEMAPS}`;

	return getDataFromApi(apiUrl);
};

const updateMapInfo = ({ bairro, cep, localidade, uf, logradouro }) => {
	if (!cep) {
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

$form.addEventListener('submit', e => {
	e.preventDefault();

	const cep = $form.cep.value;
	const cepInformation = getAddress(cep);

	cepInformation.then(data => {
		const { logradouro: address } = data;

		updateMapInfo(data)
		getGeoLocation(address).then(data => {
			const geoLocation = data.results[0].geometry.location;

			initMap(geoLocation, 14);
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
