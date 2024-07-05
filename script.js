let weatherKey = '9b8092713c6e3023812133e1a717045c'; // Weather API key
let geocodingKey = 'bc5929cff3d647338e56a95d657190a8'; // OpenCage API key
let unsplashKey = '9t0bIcJeXY5qyxDgUnD2nKPnO63uqnkOQU2bWS_6jZk'; // Unsplash API key

let map;
let marker;

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the map
  map = L.map('map').setView([23.1815, 79.9864], 13); // Default view set to Jabalpur

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  marker = L.marker([23.1815, 79.9864], {
    icon: L.icon({
      iconUrl: '/pointer.svg',
      iconSize: [40, 50],
      iconAnchor: [23, 55]
    })
  }).addTo(map);

  // Initial call to fetch and display weather for Jabalpur
  getWeatherReport('Jabalpur');
  getCityCoordinates('Jabalpur');

  // Event listener for Enter key press in search input
  let searchInputBox = document.getElementById('input-box');
  let searchButton = document.getElementById('search-button');

  searchInputBox.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
      let city = searchInputBox.value;
      await getWeatherReport(city);
      await getCityCoordinates(city);
    }
  });

  searchButton.addEventListener('click', async () => {
    let city = searchInputBox.value;
    await getWeatherReport(city);
    await getCityCoordinates(city);
  });

  // Add click event listener to the map
  map.on('click', async (e) => {
    let lat = e.latlng.lat;
    let lng = e.latlng.lng;
    console.log('Map clicked at:', lat, lng); // Debug log
    await getCityName(lat, lng);
    await getWeatherReportByCoords(lat, lng);
  });
});

// Function to fetch weather report based on city name or coordinates
async function getWeatherReport(query) {
  let url;
  if (typeof query === 'string') {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${weatherKey}&units=metric`;
  } else {
    let [lat, lng] = query;
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherKey}&units=metric`;
  }

  try {
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error('City not found');
    }
    let weather = await response.json();
    showWeatherReport(weather);
  } catch (error) {
    swal("Error", error.message, "error");
    reset();
  }
}

// Function to fetch weather report based on coordinates
async function getWeatherReportByCoords(lat, lng) {
  await getWeatherReport([lat, lng]);
}

// Function to display weather report on the webpage
function showWeatherReport(weather) {
  let weatherBody = document.getElementById('weather-body');
  weatherBody.style.display = 'block';

  let todayDate = new Date();
  let countryFullName = getCountryFullName(weather.sys.country);

  let weatherHTML = `
    <div class="location-deatils">
      <div class="city">${weather.name}, ${countryFullName}</div>
      <div class="date">${dateManage(todayDate)}</div>
    </div>
    <div class="weather-status">
      <div class="temp">${Math.round(weather.main.temp)}&deg;C</div>
      <div class="weather">${weather.weather[0].main} <i class="${getIconClass(weather.weather[0].main)}"></i></div>
      <div class="min-max">${Math.floor(weather.main.temp_min)}&deg;C (min) / ${Math.ceil(weather.main.temp_max)}&deg;C (max)</div>
      <div id="updated_on">Updated as of ${getTime(todayDate)}</div>
    </div>
    <hr>
    <div class="day-details">
      <div class="basic">Feels like ${weather.main.feels_like}&deg;C | Humidity ${weather.main.humidity}%<br> Pressure ${weather.main.pressure} mb | Wind ${weather.wind.speed} KMPH</div>
    </div>
  `;
  weatherBody.innerHTML = weatherHTML;

  changeBg(weather.weather[0].main);
  reset();
}

// Function to get full country name from country code
function getCountryFullName(countryCode) {
  // const countries = {
  //   'US': 'United States',
  //   'IN': 'India',
  //   'CA': 'Canada',
  //   // Add more country codes and names as needed
  // };
  return countries[countryCode] || countryCode;
}

// Function to get coordinates for a city name
async function getCityCoordinates(city) {
  try {
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${city}&key=${geocodingKey}`);
    const data = await response.json();

    if (data.results.length > 0) {
      let { lat, lng } = data.results[0].geometry;
      updateMap(lat, lng);
    } else {
      console.error('No results found for the given city');
    }
  } catch (error) {
    console.error('Error fetching city coordinates:', error);
  }
}

// Function to get city name for given coordinates
async function getCityName(lat, lng) {
  try {
    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${geocodingKey}`);
    const data = await response.json();

    if (data.results.length > 0) {
      let city = data.results[0].components.city || data.results[0].components.town || data.results[0].components.village;
      if (city) {
        document.querySelector('.city').innerText = city;
      }
      updateMap(lat, lng);
    } else {
      console.error('No results found for the given coordinates');
    }
  } catch (error) {
    console.error('Error fetching city name:', error);
  }
}

// Function to update map based on coordinates
function updateMap(lat, lng) {
  map.setView([lat, lng], 13);
  marker.setLatLng([lat, lng]);
}

// Function to fetch and change background image based on weather status
function changeBg(status) {
  let body = document.body;
  let query = '';

  switch (status) {
    case 'Clouds':
      query = 'cloudy sky';
      break;
    case 'Rain':
      query = 'rainy';
      break;
    case 'Clear':
      query = 'clear sky';
      break;
    case 'Snow':
      query = 'snowy';
      break;
    case 'Sunny':
      query = 'sunny day';
      break;
    case 'Thunderstorm':
      query = 'thunderstorm';
      break;
    case 'Drizzle':
      query = 'drizzle';
      break;
    case 'Mist':
    case 'Haze':
    case 'Fog':
      query = 'misty';
      break;
    default:
      query = 'weather';
      break;
  }

  fetch(`https://api.unsplash.com/search/photos?query=${query}&client_id=${unsplashKey}`)
    .then(response => response.json())
    .then(data => {
      if (data.results.length > 0) {
        let imageUrl = data.results[0].urls.regular;
        body.style.backgroundImage = `url(${imageUrl})`;
      }
    })
    .catch(error => console.error('Error fetching image from Unsplash:', error));
}

// Function to get class name for weather icon
function getIconClass(weatherType) {
  switch (weatherType) {
    case 'Rain':
      return 'fas fa-cloud-showers-heavy';
    case 'Clouds':
      return 'fas fa-cloud';
    case 'Clear':
      return 'fas fa-sun';
    case 'Snow':
      return 'fas fa-snowflake';
    case 'Sunny':
      return 'fas fa-sun';
    case 'Thunderstorm':
      return 'fas fa-bolt';
    case 'Drizzle':
      return 'fas fa-cloud-drizzle';
    case 'Mist':
    case 'Haze':
    case 'Fog':
      return 'fas fa-smog';
    default:
      return 'fas fa-cloud-sun';
  }
}

function reset() {
  document.getElementById('input-box').value = '';
}

function addZero(i) {
  return i < 10 ? '0' + i : i;
}

function getTime(date) {
  return `${addZero(date.getHours())}:${addZero(date.getMinutes())}`;
}

function dateManage(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return `${date.getDate()} ${months[date.getMonth()]} (${days[date.getDay()]}) , ${date.getFullYear()}`;
}






const countries = {
  'AF': 'Afghanistan',
  'AL': 'Albania',
  'DZ': 'Algeria',
  'AS': 'American Samoa',
  'AD': 'Andorra',
  'AO': 'Angola',
  'AI': 'Anguilla',
  'AQ': 'Antarctica',
  'AG': 'Antigua and Barbuda',
  'AR': 'Argentina',
  'AM': 'Armenia',
  'AW': 'Aruba',
  'AU': 'Australia',
  'AT': 'Austria',
  'AZ': 'Azerbaijan',
  'BS': 'Bahamas',
  'BH': 'Bahrain',
  'BD': 'Bangladesh',
  'BB': 'Barbados',
  'BY': 'Belarus',
  'BE': 'Belgium',
  'BZ': 'Belize',
  'BJ': 'Benin',
  'BM': 'Bermuda',
  'BT': 'Bhutan',
  'BO': 'Bolivia (Plurinational State of)',
  'BQ': 'Bonaire, Sint Eustatius and Saba',
  'BA': 'Bosnia and Herzegovina',
  'BW': 'Botswana',
  'BV': 'Bouvet Island',
  'BR': 'Brazil',
  'IO': 'British Indian Ocean Territory',
  'BN': 'Brunei Darussalam',
  'BG': 'Bulgaria',
  'BF': 'Burkina Faso',
  'BI': 'Burundi',
  'CV': 'Cabo Verde',
  'KH': 'Cambodia',
  'CM': 'Cameroon',
  'CA': 'Canada',
  'KY': 'Cayman Islands',
  'CF': 'Central African Republic',
  'TD': 'Chad',
  'CL': 'Chile',
  'CN': 'China',
  'CX': 'Christmas Island',
  'CC': 'Cocos (Keeling) Islands',
  'CO': 'Colombia',
  'KM': 'Comoros',
  'CD': 'Congo (Democratic Republic of the)',
  'CG': 'Congo',
  'CK': 'Cook Islands',
  'CR': 'Costa Rica',
  'HR': 'Croatia',
  'CU': 'Cuba',
  'CW': 'Curaçao',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'CI': "Côte d'Ivoire",
  'DK': 'Denmark',
  'DJ': 'Djibouti',
  'DM': 'Dominica',
  'DO': 'Dominican Republic',
  'EC': 'Ecuador',
  'EG': 'Egypt',
  'SV': 'El Salvador',
  'GQ': 'Equatorial Guinea',
  'ER': 'Eritrea',
  'EE': 'Estonia',
  'SZ': 'Eswatini',
  'ET': 'Ethiopia',
  'FK': 'Falkland Islands (Malvinas)',
  'FO': 'Faroe Islands',
  'FJ': 'Fiji',
  'FI': 'Finland',
  'FR': 'France',
  'GF': 'French Guiana',
  'PF': 'French Polynesia',
  'TF': 'French Southern Territories',
  'GA': 'Gabon',
  'GM': 'Gambia',
  'GE': 'Georgia',
  'DE': 'Germany',
  'GH': 'Ghana',
  'GI': 'Gibraltar',
  'GR': 'Greece',
  'GL': 'Greenland',
  'GD': 'Grenada',
  'GP': 'Guadeloupe',
  'GU': 'Guam',
  'GT': 'Guatemala',
  'GG': 'Guernsey',
  'GN': 'Guinea',
  'GW': 'Guinea-Bissau',
  'GY': 'Guyana',
  'HT': 'Haiti',
  'HM': 'Heard Island and McDonald Islands',
  'VA': 'Holy See',
  'HN': 'Honduras',
  'HK': 'Hong Kong',
  'HU': 'Hungary',
  'IS': 'Iceland',
  'IN': 'India',
  'ID': 'Indonesia',
  'IR': 'Iran (Islamic Republic of)',
  'IQ': 'Iraq',
  'IE': 'Ireland',
  'IM': 'Isle of Man',
  'IL': 'Israel',
  'IT': 'Italy',
  'JM': 'Jamaica',
  'JP': 'Japan',
  'JE': 'Jersey',
  'JO': 'Jordan',
  'KZ': 'Kazakhstan',
  'KE': 'Kenya',
  'KI': 'Kiribati',
  'KW': 'Kuwait',
  'KG': 'Kyrgyzstan',
  'LA': "Lao People's Democratic Republic",
  'LV': 'Latvia',
  'LB': 'Lebanon',
  'LS': 'Lesotho',
  'LR': 'Liberia',
  'LY': 'Libya',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MO': 'Macao',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'MY': 'Malaysia',
  'MV': 'Maldives',
  'ML': 'Mali',
  'MT': 'Malta',
  'MH': 'Marshall Islands',
  'MQ': 'Martinique',
  'MR': 'Mauritania',
  'MU': 'Mauritius',
  'YT': 'Mayotte',
  'MX': 'Mexico',
  'FM': 'Micronesia (Federated States of)',
  'MC': 'Monaco',
  'MN': 'Mongolia',
  'ME': 'Montenegro',
  'MS': 'Montserrat',
  'MA': 'Morocco',
  'MZ': 'Mozambique',
  'MM': 'Myanmar',
  'NA': 'Namibia',
  'NR': 'Nauru',
  'NP': 'Nepal',
  'NL': 'Netherlands',
  'NC': 'New Caledonia',
  'NZ': 'New Zealand',
  'NI': 'Nicaragua',
  'NE': 'Niger',
  'NG': 'Nigeria',
  'NU': 'Niue',
  'NF': 'Norfolk Island',
  'KP': "Korea (Democratic People's Republic of)",
  'MP': 'Northern Mariana Islands',
  'NO': 'Norway',
  'OM': 'Oman',
  'PK': 'Pakistan',
  'PW': 'Palau',
  'PS': 'Palestine, State of',
  'PA': 'Panama',
  'PG': 'Papua New Guinea',
  'PY': 'Paraguay',
  'PE': 'Peru',
  'PH': 'Philippines',
  'PN': 'Pitcairn',
  'PL': 'Poland',
  'PT': 'Portugal',
  'PR': 'Puerto Rico',
  'QA': 'Qatar',
  'KR': 'Korea (Republic of)',
  'XK': 'Republic of Kosovo',
  'MD': 'Moldova (Republic of)',
  'RO': 'Romania',
  'RU': 'Russian Federation',
  'RW': 'Rwanda',
  'RE': 'Réunion',
  'BL': 'Saint Barthélemy',
  'SH': 'Saint Helena, Ascension and Tristan da Cunha',
  'KN': 'Saint Kitts and Nevis',
  'LC': 'Saint Lucia',
  'MF': 'Saint Martin (French part)',
  'PM': 'Saint Pierre and Miquelon',
  'VC': 'Saint Vincent and the Grenadines',
  'WS': 'Samoa',
  'SM': 'San Marino',
  'ST': 'Sao Tome and Principe',
  'SA': 'Saudi Arabia',
  'SN': 'Senegal',
  'RS': 'Serbia',
  'SC': 'Seychelles',
  'SL': 'Sierra Leone',
  'SG': 'Singapore',
  'SX': 'Sint Maarten (Dutch part)',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'SB': 'Solomon Islands',
  'SO': 'Somalia',
  'ZA': 'South Africa',
  'GS': 'South Georgia and the South Sandwich Islands',
  'SS': 'South Sudan',
  'ES': 'Spain',
  'LK': 'Sri Lanka',
  'SD': 'Sudan',
  'SR': 'Suriname',
  'SJ': 'Svalbard and Jan Mayen',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'SY': 'Syrian Arab Republic',
  'TW': 'Taiwan (Province of China)',
  'TJ': 'Tajikistan',
  'TZ': 'Tanzania, United Republic of',
  'TH': 'Thailand',
  'TL': 'Timor-Leste',
  'TG': 'Togo',
  'TK': 'Tokelau',
  'TO': 'Tonga',
  'TT': 'Trinidad and Tobago',
  'TN': 'Tunisia',
  'TR': 'Turkey',
  'TM': 'Turkmenistan',
  'TC': 'Turks and Caicos Islands',
  'TV': 'Tuvalu',
  'UG': 'Uganda',
  'UA': 'Ukraine',
  'AE': 'United Arab Emirates',
  'GB': 'United Kingdom of Great Britain and Northern Ireland',
  'UM': 'United States Minor Outlying Islands',
  'UY': 'Uruguay',
  'UZ': 'Uzbekistan',
  'VU': 'Vanuatu',
  'VE': 'Venezuela (Bolivarian Republic of)',
  'VN': 'Viet Nam',
  'WF': 'Wallis and Futuna',
  'EH': 'Western Sahara',
  'YE': 'Yemen',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
};