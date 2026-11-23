import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable as TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import AppIcon from '../components/AppIcon';
import PrimaryButton from '../components/PrimaryButton';
import FloatingChatButton from '../components/FloatingChatButton';
import CalendarPickerModal from '../components/CalendarPickerModal';
import JourneyRouteMap from '../components/JourneyRouteMap';
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadowSoft, spacing } from '../theme';
import cityFoodMenus from '../data/cityFoodMenus.json';

const natureBg = require('../../assets/splash_nature_bg.jpg');

function getCityFoodMenu(dest) {
  const q = String(dest || '').toLowerCase().trim();
  if (!q) return cityFoodMenus[0];

  // 1. Exact match on cityKey
  const exactKey = cityFoodMenus.find((m) => m.cityKey.toLowerCase() === q);
  if (exactKey) return exactKey;

  // 2. Exact match on any alias
  const exactAlias = cityFoodMenus.find(
    (m) => m.aliases && m.aliases.some((a) => a.toLowerCase() === q)
  );
  if (exactAlias) return exactAlias;

  // 3. Word token or substring match
  for (const m of cityFoodMenus) {
    if (
      q.includes(m.cityKey.toLowerCase()) ||
      (m.aliases && m.aliases.some((a) => q.includes(a.toLowerCase())))
    ) {
      return m;
    }
  }

  // 4. CityName includes query or vice versa
  for (const m of cityFoodMenus) {
    if (m.cityName.toLowerCase().includes(q) || q.includes(m.cityName.toLowerCase())) {
      return m;
    }
  }

  return cityFoodMenus[0];
}

const DEPARTURE_CITIES = [
  'Attock City',
  'Hazro',
  'Gondal',
  'Kamra',
  'Wah Cantt',
  'Hasan Abdal',
  'Taxila',
  'Islamabad / Rawalpindi',
  'Lahore',
  'Karachi',
  'Peshawar',
  'Multan',
  'Faisalabad',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Sukkur',
  'Abbottabad',
  'Muzaffarabad',
  'Bahawalpur',
  'Sargodha',
  'Sahiwal',
  'Jhelum',
  'Mardan',
  'Swat',
  'Gilgit',
  'Skardu',
  'Gwadar',
  'COMSATS Attock',
];

const LOCATION_COORDINATES = {
  // Attock District & Key User Locations
  'attock': [33.7667, 72.3667],
  'attock city': [33.7667, 72.3667],
  'attock cantt': [33.7665, 72.3601],
  'dar-ul-islam colony': [33.7634, 72.3612],
  'peoples colony': [33.7548, 72.3689],
  'model town attock': [33.7712, 72.3735],
  'model town': [33.7712, 72.3735],
  'hazro': [33.9103, 72.4939],
  'hazro, attock': [33.9103, 72.4939],
  'gondal': [33.8647, 72.4132],
  'gondal, attock': [33.8647, 72.4132],
  'kamra': [33.8569, 72.3992],
  'kamra cantt': [33.8569, 72.3992],
  'hasan abdal': [33.8206, 72.6894],
  'wah cantt': [33.7744, 72.7523],
  'taxila': [33.7463, 72.8397],
  'fateh jang': [33.5678, 72.6486],
  'pindi gheb': [33.2408, 72.2689],
  'jand': [33.4286, 72.0192],
  'sanstha': [33.8945, 72.4512],
  'lawrencepur': [33.8421, 72.3489],
  'comsats attock': [33.7788, 72.3582],
  'comsats university attock': [33.7788, 72.3582],

  // Major Departure Cities
  'islamabad / rawalpindi': [33.6844, 73.0479],
  'islamabad': [33.6844, 73.0479],
  'rawalpindi': [33.5989, 73.0441],
  'lahore': [31.5204, 74.3587],
  'karachi': [24.8607, 67.0011],
  'peshawar': [34.0151, 71.5249],
  'multan': [30.1575, 71.5249],
  'faisalabad': [31.4504, 73.1350],
  'quetta': [30.1798, 66.9750],
  'sialkot': [32.4945, 74.5229],
  'gujranwala': [32.1877, 74.1945],
  'hyderabad': [25.3960, 68.3578],
  'sukkur': [27.7052, 68.8574],
  'abbottabad': [34.1688, 73.2215],
  'muzaffarabad': [34.3700, 73.4711],
  'bahawalpur': [29.3544, 71.6911],

  // Northern & Adventure Destinations
  'malam jabba': [34.7994, 72.5725],
  'swat valley': [35.2227, 72.4258],
  'swat': [35.2227, 72.4258],
  'kalam valley': [35.4912, 72.5796],
  'kalam': [35.4912, 72.5796],
  'hunza valley': [36.3167, 74.6500],
  'hunza': [36.3167, 74.6500],
  'skardu': [35.2971, 75.6333],
  'gilgit': [35.9221, 74.3087],
  'fairy meadows': [35.3850, 74.5772],
  'neelum valley': [34.5859, 73.9069],
  'deosai plains': [34.9961, 75.4419],
  'naltar valley': [36.1389, 74.1917],
  'khunjerab pass': [36.8497, 75.4297],
  'astore & rama': [35.3667, 74.8500],
  'khaplu & shigar': [35.1583, 76.3353],
  'ghizer & phander': [36.1772, 72.9556],
  'babusar top': [35.1524, 74.0477],
  'naran & kaghan': [34.9080, 73.6520],
  'naran': [34.9080, 73.6520],
  'kumrat valley': [35.5392, 72.2155],
  'chitral & kalash': [35.8510, 71.7864],
  'murree & galyat': [33.9062, 73.3903],
  'murree': [33.9062, 73.3903],
  'abbottabad & thandiani': [34.1688, 73.2215],
  'rawalakot & banjosa': [33.8584, 73.7610],

  // Coastal Destinations
  'gwadar': [25.1216, 62.3254],
  'kund malir': [25.5000, 65.4500],
  'ormara beach': [25.2088, 64.6357],
  'karachi coast': [24.8607, 67.0011],
  'clifton beach': [24.8138, 67.0305],
  'hawksbay': [24.8530, 66.8652],
  'french beach': [24.8458, 66.8123],
  'manora island': [24.7958, 66.9744],
  'astola island': [25.1167, 63.8333],

  // Cultural & Historical
  'rohtas fort': [32.9664, 73.5786],
  'mohenjo-daro': [27.3292, 68.1367],
  'thatta & makli': [24.7475, 67.9272],
  'harappa': [30.6300, 72.8647],
  'katas raj & khewra': [32.6517, 72.9575],
  'ziarat': [30.3824, 67.7256],
};

function getLocationCoords(name, defaultCoords = [33.6844, 73.0479]) {
  if (!name) return defaultCoords;
  const q = String(name).toLowerCase().trim();
  if (LOCATION_COORDINATES[q]) return LOCATION_COORDINATES[q];
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (q.includes(key) || key.includes(q)) return coords;
  }
  return defaultCoords;
}

const CATEGORIES = [
  'Cultural & Historical',
  'Northern Areas',
  'Adventure & Nature',
  'Coastal Areas',
];

const CATEGORY_CITIES_MAP = {
  'Cultural & Historical': [
    'Lahore', 'Multan', 'Bahawalpur', 'Taxila', 'Peshawar',
    'Rohtas Fort', 'Mohenjo-daro', 'Thatta & Makli', 'Swat Valley',
    'Rawalpindi', 'Faisalabad', 'Sialkot', 'Harappa', 'Katas Raj & Khewra',
    'Hyderabad', 'Sukkur', 'Ziarat'
  ],
  'Northern Areas': [
    'Hunza Valley', 'Skardu', 'Gilgit', 'Fairy Meadows',
    'Neelum Valley', 'Deosai Plains', 'Naltar Valley', 'Khunjerab Pass',
    'Kalam Valley', 'Astore & Rama', 'Khaplu & Shigar', 'Ghizer & Phander', 'Muzaffarabad'
  ],
  'Adventure & Nature': [
    'Islamabad', 'Murree & Galyat', 'Babusar Top', 'Malam Jabba',
    'Naran & Kaghan', 'Kumrat Valley', 'Chitral & Kalash', 'Quetta',
    'Abbottabad & Thandiani', 'Rawalakot & Banjosa'
  ],
  'Coastal Areas': [
    'Karachi Coast', 'Clifton Beach', 'Hawksbay', 'French Beach',
    'Manora Island', 'Kund Malir', 'Ormara Beach', 'Gwadar', 'Astola Island'
  ],
};

const TRAVEL_TYPES = [
  { id: 'Solo', label: 'Solo', icon: 'person-outline', desc: 'Flexible & independent pacing' },
  { id: 'Family', label: 'Family', icon: 'people-outline', desc: 'Kid-friendly, safe & comfortable' },
  { id: 'Group', label: 'Group', icon: 'bus-outline', desc: 'Structured group tour coordination' },
];

const RENTAL_VEHICLES = [
  // Solo & Adventure Touring Bikes (Specially available for Solo Travelers)
  { id: 'Bike-Honda125', name: 'Honda CG 125 / CD 70 Touring Bike', persons: '1 person (Solo)', luggage: '1 Touring Bag / Rucksack', rentPerDay: 1200, fuelPerDay: 800, maxPersons: 1, isBike: true, billingUnit: 'per_day', icon: 'bicycle-outline' },
  { id: 'Bike-YBR125G', name: 'Yamaha YBR 125G / GS 150 Adventure Bike', persons: '1 person (Solo Trail)', luggage: 'Dual Saddlebags & Rucksack', rentPerDay: 1800, fuelPerDay: 1100, maxPersons: 1, isBike: true, billingUnit: 'per_day', icon: 'bicycle-outline' },
  { id: 'Bike-Adventure250', name: 'Adventure Mountain Trail Bike 150-250cc', persons: '1 person (Solo Touring)', luggage: 'Dual Panniers & Top Box', rentPerDay: 2500, fuelPerDay: 1400, maxPersons: 1, isBike: true, billingUnit: 'per_day', icon: 'bicycle-outline' },

  // Cars & Passenger Vehicles
  { id: 'Economy-Alto', name: 'Suzuki Alto 660cc / Mehran', persons: '1-3 persons', luggage: '2 Luggage Bags', rentPerDay: 3000, fuelPerDay: 2000, maxPersons: 3, billingUnit: 'per_day', icon: 'car-outline' },
  { id: 'Economy-Mira', name: 'Daihatsu Mira / Suzuki Every', persons: '1-4 persons', luggage: '3 Luggage Bags', rentPerDay: 3800, fuelPerDay: 2200, maxPersons: 4, billingUnit: 'per_day', icon: 'car-outline' },
  { id: 'Economy-WagonR', name: 'Suzuki Wagon R / Cultus VXL', persons: '1-4 persons', luggage: '3 Luggage Bags', rentPerDay: 4000, fuelPerDay: 2500, maxPersons: 4, billingUnit: 'per_day', icon: 'car-outline' },
  { id: 'Compact-Vitz', name: 'Toyota Vitz / Yaris 1.3L', persons: '1-4 persons', luggage: '3 Luggage Bags', rentPerDay: 4800, fuelPerDay: 2800, maxPersons: 4, billingUnit: 'per_day', icon: 'car-outline' },
  { id: 'Sedan-City', name: 'Honda City 1.3L / 1.5L', persons: '3-5 persons', luggage: '4 Luggage Bags', rentPerDay: 5500, fuelPerDay: 3200, maxPersons: 5, billingUnit: 'per_day', icon: 'car-sport-outline' },
  { id: 'Sedan-Corolla', name: 'Toyota Corolla GLi / Altis', persons: '3-5 persons', luggage: '4 Luggage Bags', rentPerDay: 6500, fuelPerDay: 3600, maxPersons: 5, billingUnit: 'per_day', icon: 'car-sport-outline' },
  { id: 'Sedan-Civic', name: 'Honda Civic Oriel 1.8L', persons: '3-5 persons', luggage: '4 Luggage Bags', rentPerDay: 7500, fuelPerDay: 4000, maxPersons: 5, billingUnit: 'per_day', icon: 'car-sport-outline' },
  { id: 'MPV-Karvaan', name: 'Changan Karvaan Plus MPV', persons: '4-7 persons', luggage: '5 Luggage Bags', rentPerDay: 8000, fuelPerDay: 4200, maxPersons: 7, billingUnit: 'per_day', icon: 'bus-outline' },
  { id: 'Family-BRV', name: 'Honda BR-V 7-Seater MPV', persons: '4-6 persons', luggage: '5 Luggage Bags', rentPerDay: 8800, fuelPerDay: 4600, maxPersons: 6, billingUnit: 'per_day', icon: 'car-sport-outline' },
  { id: 'SUV-Sportage', name: 'KIA Sportage / Tucson AWD', persons: '4-5 persons', luggage: '5 Luggage Bags', rentPerDay: 11000, fuelPerDay: 5200, maxPersons: 5, billingUnit: 'per_day', icon: 'trail-sign-outline' },
  { id: 'SUV-Fortuner', name: 'Toyota Fortuner / Hilux Revo 4x4', persons: '4-7 persons', luggage: '6 Luggage Bags', rentPerDay: 13000, fuelPerDay: 5800, maxPersons: 7, billingUnit: 'per_day', icon: 'trail-sign-outline' },
  { id: 'SUV-Prado', name: 'Toyota Prado / Mountain 4x4 Jeep', persons: '4-6 persons', luggage: '6 Luggage Bags', rentPerDay: 14000, fuelPerDay: 6000, maxPersons: 6, billingUnit: 'per_day', icon: 'trail-sign-outline' },
  { id: 'Van-HiAce', name: 'Toyota HiAce Standard Commuter', persons: '7-11 persons', luggage: '8 Luggage Bags', rentPerDay: 13500, fuelPerDay: 6500, maxPersons: 11, billingUnit: 'per_day', icon: 'bus-outline' },
  { id: 'Grand-Cabin', name: 'Toyota HiAce Grand Cabin VIP', persons: '8-14 persons', luggage: '10 Luggage Bags', rentPerDay: 16000, fuelPerDay: 7500, maxPersons: 14, billingUnit: 'per_day', icon: 'bus-outline' },
  { id: 'Bus-Coaster', name: 'Toyota Coaster Saloon Mini-Bus', persons: '14-24 persons', luggage: '20 Luggage Bags', rentPerDay: 40000, fuelPerDay: 0, maxPersons: 24, billingUnit: 'per_day', icon: 'bus-outline' },
];

const BOOKME_VEHICLES = RENTAL_VEHICLES;

const PERSON_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const BUDGET_PER_PERSON_PRESETS = [25000, 38500, 50000, 75000, 100000];

const TRANSPORT_MODES = [
  { id: 'Private Car', icon: 'car-outline' },
  { id: 'Rental Car', icon: 'key-outline' },
  { id: 'Jeep/4x4', icon: 'trail-sign-outline' },
  { id: 'Bus', icon: 'bus-outline' },
  { id: 'Train', icon: 'train-outline' },
  { id: 'Flight', icon: 'airplane-outline' },
  { id: 'Public Transport', icon: 'navigate-outline' },
];

const ALL_INTERESTS = [
  'Hiking', 'Trekking', 'Nature', 'Food', 'Culture', 'History',
  'Adventure', 'Photography', 'Shopping', 'Beaches', 'Camping',
  'Skiing', 'Sightseeing', 'Relaxation',
];

const DAY_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 14];
const BUDGET_PRESETS = [40000, 75000, 120000, 200000];
const COMFORT_LEVELS = [
  { id: 'Basic', label: 'Budget', badge: 'Economy', desc: 'Budget-friendly hotels & transit' },
  { id: 'Normal', label: 'Standard', badge: 'Standard', desc: 'Comfortable mid-range choices' },
  { id: 'Luxury', label: 'Premium', badge: 'Luxury', desc: '4-5★ resorts & private transit' },
];

function getAccurateRoutesForJourney(startLocation, destination, category) {
  const s = String(startLocation || '').toLowerCase().trim();
  const d = String(destination || '').toLowerCase().trim();

  // 1. Attock <-> Islamabad / Rawalpindi
  if ((s.includes('attock') && (d.includes('islamabad') || d.includes('rawalpindi'))) ||
      ((s.includes('islamabad') || s.includes('rawalpindi')) && d.includes('attock'))) {
    return [
      'Peshawar - Islamabad Motorway (M-1 via Burhan Interchange)',
      'Grand Trunk Road (N-5 / GT Road via Hasan Abdal, Wah Cantt & Taxila)',
      'Fateh Jang - Rawalpindi Road via CPEC Hakla Interchange',
      'Srinagar Highway (Kashmir Highway Direct Expressway Link)',
    ];
  }

  // 2. Attock to other destinations
  if (s.includes('attock')) {
    if (d.includes('swat') || d.includes('kalam') || d.includes('malam jabba') || d.includes('kumrat')) {
      return [
        'Peshawar - Islamabad Motorway (M-1) ➔ Swat Expressway (M-16 via Swabi)',
        'Swat Expressway (M-16) ➔ Chakdara ➔ Mingora & Kalam Valley Road (N-95)',
        'Grand Trunk Road (N-5 via Attock Khurd) ➔ Nowshera ➔ Malakand Pass (N-45)',
      ];
    }
    if (d.includes('babusar') || d.includes('naran') || d.includes('kaghan')) {
      return [
        'M-1 (Burhan Interchange) ➔ Hazara Motorway (M-15) ➔ Naran-Kaghan Highway (N-15)',
        'GT Road (N-5 via Hasan Abdal) ➔ Abbottabad & Mansehra Bypass ➔ N-15 Highway',
        'Karakoram Highway (KKH / N-35) ➔ Chilas ➔ Babusar Pass Route (N-15 North)',
      ];
    }
    if (d.includes('hunza') || d.includes('skardu') || d.includes('gilgit') || d.includes('fairy meadows') || d.includes('khunjerab') || d.includes('deosai')) {
      return [
        'M-1 (Burhan) ➔ Hazara Motorway (M-15) ➔ Karakoram Highway (KKH / N-35 via Chilas)',
        'Hazara Motorway (M-15) ➔ Naran (N-15) ➔ Babusar Pass ➔ KKH (Summer Route)',
        'KKH (N-35) ➔ Jaglot Junction ➔ Skardu Strategic Highway (S-1)',
      ];
    }
    if (d.includes('lahore') || d.includes('faisalabad') || d.includes('multan')) {
      return [
        'Peshawar - Islamabad Motorway (M-1) ➔ Islamabad - Lahore Motorway (M-2)',
        'Grand Trunk Road (N-5 / GT Road via Rawalpindi, Jhelum & Gujranwala)',
        'CPEC Hakla Interchange ➔ Pindi Bhattian (M-2 / M-4 Motorway Network)',
      ];
    }
    if (d.includes('peshawar')) {
      return [
        'Peshawar - Islamabad Motorway (M-1 via Chachh & Rashakai)',
        'Grand Trunk Road (N-5 via Attock Khurd & Nowshera)',
      ];
    }
  }

  // 3. To Babusar Top / Naran / Kaghan
  if (d.includes('babusar') || d.includes('naran') || d.includes('kaghan')) {
    return [
      'Hazara Motorway (M-15) ➔ Naran-Kaghan Highway (N-15 via Balakot & Kaghan)',
      'Babusar Pass Scenic Route (N-15 over 13,691 ft Pass into Chilas)',
      'Murree Expressway (N-75) ➔ Kohala ➔ Muzaffarabad ➔ Garhi Habibullah ➔ Balakot (N-15)',
      'Karakoram Highway (KKH / N-35 via Abbottabad & Besham) ➔ Chilas ➔ N-15 Link',
    ];
  }

  // 4. To Hunza / Gilgit / Khunjerab / Naltar / Phander / Fairy Meadows
  if (d.includes('hunza') || d.includes('gilgit') || d.includes('khunjerab') || d.includes('naltar') || d.includes('phander') || d.includes('fairy meadows')) {
    return [
      'Hazara Motorway (M-15) ➔ Karakoram Highway (KKH / N-35 via Besham, Dasu & Chilas)',
      'Babusar Pass Scenic Route (N-15 via Naran & Kaghan into Chilas KKH - Summer Route)',
      'Karakoram Highway (KKH / N-35) along Indus & Hunza River to Karimabad & Attabad Lake',
      'Khunjerab Border Highway (KKH / N-35 via Gulmit, Passu Cones & Sost to Border)',
    ];
  }

  // 5. To Skardu / Deosai / Khaplu / Shigar / Astore
  if (d.includes('skardu') || d.includes('deosai') || d.includes('khaplu') || d.includes('shigar') || d.includes('astore')) {
    return [
      'Hazara Motorway (M-15) ➔ KKH (N-35) ➔ Skardu Strategic Highway (S-1 via Jaglot & Indus Gorge)',
      'Babusar Pass (N-15) ➔ Chilas ➔ Jaglot Junction ➔ Skardu Strategic Highway (S-1)',
      'Astore Valley Road via Jaglot Junction & Rama Alpine Trail',
      'Deosai Alpine Jeep Corridor (via Ali Malik Pass & Sheosar Lake Trail - Seasonal)',
    ];
  }

  // 6. To Swat / Kalam / Malam Jabba / Kumrat
  if (d.includes('swat') || d.includes('kalam') || d.includes('malam jabba') || d.includes('kumrat')) {
    return [
      'Peshawar - Islamabad Motorway (M-1) ➔ Swat Expressway (M-16 via Colonel Sher Khan)',
      'Chakdara - Mingora - Kalam Valley Highway (N-95 along Swat River)',
      'Malam Jabba Mountain Road (via Saidu Sharif & Manglor / Swat)',
      'Kumrat Valley Corridor (M-16 to Chakdara ➔ Dir Highway N-45 ➔ Thal Kumrat Road)',
    ];
  }

  // 7. To Chitral / Kalash / Lowari Tunnel / Shandur
  if (d.includes('chitral') || d.includes('kalash') || d.includes('lowari') || d.includes('shandur')) {
    return [
      'Swat Expressway (M-16) ➔ Dir - Lowari Tunnel - Chitral Highway (N-45)',
      'Malakand Pass & Timurgara Scenic Highway (N-45)',
      'Kalash Valley Road via Ayun (Bumburet, Rumbur & Birir Valley Trail)',
      'Shandur Pass Alpine Route (connecting Chitral with Gilgit & Phander)',
    ];
  }

  // 8. To Murree / Galyat / Abbottabad / Thandiani / Rawalakot / Banjosa / Neelum / Muzaffarabad
  if (d.includes('murree') || d.includes('galyat') || d.includes('abbottabad') || d.includes('thandiani') || d.includes('rawalakot') || d.includes('banjosa') || d.includes('neelum') || d.includes('muzaffarabad')) {
    return [
      'Islamabad - Murree Expressway (N-75 via Bhara Kahu Bypass)',
      'Galyat Scenic Ridge Highway (Nathiagali, Ayubia, Dunga Gali & Changla Gali)',
      'Hazara Motorway (M-15 via Abbottabad Tunnels) & Thandiani Ridge Road',
      'Murree - Kohala ➔ Muzaffarabad ➔ Neelum Valley Road (along Neelum River)',
      'Rawalakot Highway via Azad Pattan Bridge & Banjosa Lake Road',
    ];
  }

  // 9. To Gwadar / Makran Coast / Kund Malir / Ormara / Astola / Karachi Coast
  if (d.includes('gwadar') || d.includes('kund malir') || d.includes('ormara') || d.includes('astola') || d.includes('coast') || d.includes('beach') || d.includes('clifton') || d.includes('hawksbay') || d.includes('manora')) {
    return [
      'Makran Coastal Highway (N-10 via Kund Malir, Ormara & Pasni to Gwadar)',
      'Karachi Northern Bypass (M-10) ➔ RCD Highway (N-25 to Hub & Coastal Highway)',
      'Hingol National Park Coastal Drive (via Princess of Hope & Buzi Pass)',
      'Karachi Coastal Boulevard & Marine Drive Gwadar',
    ];
  }

  // 10. To Karachi / Hyderabad / Thatta / Sukkur / Mohenjo-daro
  if (d.includes('karachi') || d.includes('hyderabad') || d.includes('thatta') || d.includes('sukkur') || d.includes('mohenjo')) {
    return [
      'Karachi - Hyderabad Motorway (M-9)',
      'National Highway (N-5 via Thatta, Makli Necropolis & Keenjhar Lake)',
      'Multan - Sukkur Motorway (M-5) ➔ M-9 Motorway Corridor',
      'Indus Highway (N-55 via Sehwan Sharif, Dadu & Larkana to Mohenjo-daro)',
    ];
  }

  // 11. To Lahore / Gujranwala / Sialkot / Harappa
  if (d.includes('lahore') || d.includes('sialkot') || d.includes('harappa') || d.includes('gujranwala')) {
    return [
      'Islamabad - Lahore Motorway (M-2 via Salt Range, Kalar Kahar & Bhera)',
      'Grand Trunk Road (N-5 / GT Road via Jhelum, Gujrat & Gujranwala)',
      'Sialkot - Lahore Motorway (M-11 via Sambrial & Kamoke)',
      'Lahore - Abdul Hakeem Motorway (M-3 via Nankana Sahib & Harappa Interchange)',
    ];
  }

  // 12. To Multan / Bahawalpur / Faisalabad
  if (d.includes('multan') || d.includes('bahawalpur') || d.includes('faisalabad')) {
    return [
      'Lahore - Abdul Hakeem Motorway (M-3) ➔ Faisalabad - Multan Motorway (M-4)',
      'Multan - Sukkur Motorway (M-5 / CPEC Southern Motorway to Bahawalpur)',
      'National Highway (N-5 via Sahiwal, Khanewal & Bahawalpur Bypass)',
      'Pindi Bhattian - Faisalabad Motorway (M-4 via Chiniot & Gojra)',
    ];
  }

  // 13. To Peshawar / Taxila / Rohtas Fort / Khewra / Katas Raj
  if (d.includes('peshawar') || d.includes('taxila') || d.includes('rohtas') || d.includes('khewra') || d.includes('katas')) {
    return [
      'Peshawar - Islamabad Motorway (M-1 via Rashakai & Attock Bridge)',
      'Grand Trunk Road (N-5 / GT Road via Taxila Museum & Margalla Pass)',
      'M-2 Motorway (Lilla / Choa Saidan Shah Interchange to Khewra & Katas Raj)',
      'Grand Trunk Road (N-5 South via Dina to Rohtas Fort Heritage Route)',
    ];
  }

  // 14. To Quetta / Ziarat
  if (d.includes('quetta') || d.includes('ziarat')) {
    return [
      'RCD Highway (N-25 via Hub, Khuzdar & Kalat to Quetta)',
      'Indus Highway (N-55) ➔ D.G. Khan ➔ Loralai - Quetta Highway (N-70)',
      'Ziarat Juniper Valley Highway (N-50 via Kuchlak & Bostan to Ziarat Pass)',
      'Zhob - D.I. Khan CPEC Western Alignment Route (N-50)',
    ];
  }

  // 15. To Islamabad / Rawalpindi from any other city
  if (d.includes('islamabad') || d.includes('rawalpindi')) {
    if (s.includes('lahore')) {
      return [
        'Lahore - Islamabad Motorway (M-2 via Salt Range & Kalar Kahar)',
        'Grand Trunk Road (N-5 / GT Road via Gujranwala, Gujrat & Jhelum)',
        'Sialkot Motorway (M-11) ➔ GT Road (N-5) Express Link',
      ];
    }
    if (s.includes('peshawar')) {
      return [
        'Peshawar - Islamabad Motorway (M-1 via Rashakai & Burhan)',
        'Grand Trunk Road (N-5 via Nowshera, Attock Khurd & Hasan Abdal)',
      ];
    }
    if (s.includes('faisalabad') || s.includes('multan')) {
      return [
        'M-4 Motorway ➔ M-2 Motorway (via Pindi Bhattian to Islamabad)',
        'Grand Trunk Road (N-5 / GT Road Corridor)',
      ];
    }
    if (s.includes('karachi') || s.includes('sukkur')) {
      return [
        'National Highway / Motorway Corridor (M-5 ➔ M-4 ➔ M-2 to Islamabad)',
        'Indus Highway (N-55 Corridor)',
      ];
    }
    return [
      'Peshawar - Islamabad Motorway (M-1) / Lahore - Islamabad Motorway (M-2)',
      'Grand Trunk Road (N-5 / GT Road via Taxila & Rawalpindi)',
      'Srinagar Highway (Kashmir Highway Direct City Access)',
      'Islamabad Expressway / Murree Road Arterial Corridor',
    ];
  }

  // 16. Universal Intelligent Fallback based on category
  const cat = String(category || '').toLowerCase();
  if (cat.includes('northern') || cat.includes('mountain')) {
    return [
      'Hazara Motorway (M-15) + Karakoram Highway (KKH / N-35)',
      'Babusar Pass Scenic Route (N-15 via Naran & Kaghan)',
      'Skardu Strategic Highway (S-1 via Jaglot)',
      'Regional Alpine Highway Corridor',
    ];
  }
  if (cat.includes('coastal') || cat.includes('beach')) {
    return [
      'Makran Coastal Highway (N-10 via Kund Malir & Ormara to Gwadar)',
      'Karachi - Thatta - Hyderabad National Highway (N-5)',
      'Karachi Northern Bypass (M-10) to Hub & Coastal Highway',
    ];
  }

  return [
    'National Motorway Network (M-1 / M-2 / M-3 / M-4 / M-5)',
    'Grand Trunk Road (N-5 / GT Road Network)',
    'CPEC Western / Eastern Highway Corridor',
    'Regional Scenic Highway Link',
  ];
}

const DESTINATION_ACTIVITIES_MAP = {
  // --- Lahore ---
  lahore: [
    { id: 'lahore_heritage', name: 'Shahi Qila & Badshahi Mosque Heritage Pass', icon: 'ribbon-outline', pricePerPerson: 600, desc: 'Official entry & Mughal architectural guided tour of Lahore Fort and Badshahi Mosque' },
    { id: 'lahore_wagah', name: 'Wagah Border Flag Ceremony VIP Pass', icon: 'flag-outline', pricePerPerson: 1500, desc: 'Reserved stadium seating & escorted parade pass at Pak-India Wagah Border' },
    { id: 'lahore_food_street', name: 'Old Lahore (Androon) Food Street & Haveli Walk', icon: 'restaurant-outline', pricePerPerson: 1800, desc: 'Guided night heritage walk through Delhi Gate, Wazir Khan Mosque & Fort Road Food Street feast' },
    { id: 'lahore_shalimar', name: 'Shalimar Gardens & Lahore Museum Pass', icon: 'leaf-outline', pricePerPerson: 500, desc: 'Official UNESCO Mughal garden entry and historic Lahore Museum relics pass' },
    { id: 'lahore_joyland', name: 'Sozo Water Park / Joyland Family Thrill Rides', icon: 'color-wand-outline', pricePerPerson: 1200, desc: 'All-inclusive pass for water slides, rollercoasters & family amusement' },
  ],

  // --- Malam Jabba ---
  'malam jabba': [
    { id: 'malam_ski', name: 'Skiing & Snowboard Equipment Rental', icon: 'snow-outline', pricePerPerson: 2500, desc: 'Full ski gear, snow boots, poles & ski slope access pass' },
    { id: 'malam_chairlift', name: 'Panoramic Mountain Chairlift & Cable Car', icon: 'trending-up-outline', pricePerPerson: 1200, desc: 'Spectacular dual chairlift ride to the 9,200ft Malam Jabba summit' },
    { id: 'malam_zipline', name: 'High-Altitude Mountain Zipline Thrill', icon: 'airplane-outline', pricePerPerson: 1800, desc: 'Certified alpine zipline flight across the snow-capped valley gorge' },
    { id: 'malam_tubing', name: 'Pine Forest Snow Tubing & Ice Skating', icon: 'football-outline', pricePerPerson: 900, desc: 'Fun snow tube sliding & ice rink session with safety gear' },
    { id: 'malam_forest_hike', name: 'Guided Cedar Forest Nature Trek', icon: 'trail-sign-outline', pricePerPerson: 800, desc: 'Guided scenic hiking trail through pristine Swat pine forests' },
  ],

  // --- Hunza Valley ---
  hunza: [
    { id: 'hunza_attabad_boat', name: 'Attabad Lake Speedboat & Jet Ski Ride', icon: 'boat-outline', pricePerPerson: 2000, desc: 'High-speed turquoise lake boating session & jet ski thrill at Attabad' },
    { id: 'hunza_forts', name: 'Baltit & Altit Forts Guided Heritage Pass', icon: 'shield-outline', pricePerPerson: 1200, desc: '800-year-old Mir of Hunza royal palaces entry and local guide' },
    { id: 'hunza_bridge', name: 'Passu Cones Suspension Bridge Walk & Zipline', icon: 'walk-outline', pricePerPerson: 1500, desc: 'Adrenaline suspension bridge crossing over Hunza River with rope safety' },
    { id: 'hunza_khunjerab_jeep', name: '4x4 Mountain Jeep Safari to Khunjerab Pass', icon: 'trail-sign-outline', pricePerGroup: 7500, desc: 'Rugged mountain 4x4 excursion up to the Pak-China border at 15,397 ft' },
    { id: 'hunza_eagles_nest', name: 'Eagles Nest Sunset Viewpoint & Cultural Music', icon: 'musical-notes-outline', pricePerPerson: 1000, desc: 'Panoramic sunset over 7 peaks with live Rubab & Hunza folk instruments' },
  ],

  // --- Skardu ---
  skardu: [
    { id: 'skardu_boating', name: 'Shangrila Resort Lake & Upper Kachura Boating', icon: 'boat-outline', pricePerPerson: 1500, desc: 'Serene shikara boat ride on Lower & Upper Kachura crystal lakes' },
    { id: 'skardu_katpana', name: 'Katpana Cold Desert 4x4 Dune Bashing', icon: 'car-sport-outline', pricePerGroup: 4500, desc: "World's highest cold desert sand dune drifting & quad bike thrill" },
    { id: 'skardu_deosai', name: 'Deosai Plains & Sheosar Lake 4x4 Expedition', icon: 'trail-sign-outline', pricePerGroup: 9000, desc: 'Full-day rugged 4x4 safari across the Land of Giants (Deosai plateau)' },
    { id: 'skardu_forts', name: 'Kharpocho Fort Mountain Hike & Shigar Palace', icon: 'business-outline', pricePerPerson: 1000, desc: 'Heritage entry and high vantage point overlooking the Indus River' },
    { id: 'skardu_trout', name: 'Fresh Indus Trout Angling & Riverside BBQ', icon: 'fish-outline', pricePerPerson: 2500, desc: 'Guided trout fishing permit & riverside barbecue experience' },
  ],

  // --- Islamabad & Rawalpindi ---
  islamabad: [
    { id: 'isb_rawal_lake', name: 'Rawal Lake Motorboat & Water Sports', icon: 'boat-outline', pricePerPerson: 1200, desc: 'Scenic motorboat cruise & water sports session at Rawal Lake / Lake View Park' },
    { id: 'isb_trail_hike', name: 'Margalla Hills Guided Hike (Trail 3/5 to Monal)', icon: 'trail-sign-outline', pricePerPerson: 1000, desc: 'Guided ridge trail hike with wildlife spotting and summit refreshments' },
    { id: 'isb_lok_virsa', name: 'Lok Virsa & National Heritage Museum Pass', icon: 'ribbon-outline', pricePerPerson: 600, desc: 'Pakistan National Monument Museum & Lok Virsa folk heritage ticket' },
    { id: 'isb_bus_tour', name: 'Islamabad Sightseeing Double Decker Bus Tour', icon: 'bus-outline', pricePerPerson: 800, desc: 'Open-roof scenic tour covering Faisal Mosque, Shakarparian & Blue Area' },
    { id: 'isb_monal_dinner', name: 'Daman-e-Koh Hilltop Dining & Monal Sunset Pass', icon: 'restaurant-outline', pricePerPerson: 2000, desc: 'Reserved scenic viewpoint table overlooking entire capital skyline' },
  ],
  rawalpindi: [
    { id: 'rwp_bazaar', name: 'Raja Bazaar & Saddar Heritage Food Walk', icon: 'restaurant-outline', pricePerPerson: 1200, desc: 'Authentic Punjabi street food tour and historic colonial cantonment walk' },
    { id: 'rwp_ayub_park', name: 'Ayub National Park Boating & Jungle Barracks Pass', icon: 'boat-outline', pricePerPerson: 700, desc: 'Lake pedal boating, aviary safari and family amusement park rides' },
    { id: 'rwp_havelis', name: 'Historic Rawalpindi Havelis & Clock Tower Trail', icon: 'ribbon-outline', pricePerPerson: 600, desc: 'Architectural photography of 19th-century carved wood and brick mansions' },
  ],

  // --- Murree & Galyat ---
  murree: [
    { id: 'murree_patriata', name: 'Patriata (New Murree) Chairlift & Cable Car', icon: 'trending-up-outline', pricePerPerson: 1200, desc: 'Famous 7km panoramic dual chairlift and gondola cable car ride' },
    { id: 'murree_pipeline', name: 'Ayubia National Park Pipeline Track Guided Walk', icon: 'walk-outline', pricePerPerson: 800, desc: 'Historic mountain pipeline nature trail walk through pine forests' },
    { id: 'murree_miranjani', name: 'Nathia Gali Green Spot & Miranjani Hilltop Trek', icon: 'trail-sign-outline', pricePerPerson: 1500, desc: 'Guided trekking pass to the highest peak in Abbottabad/Galyat region' },
    { id: 'murree_horse_ride', name: 'Mall Road Horse Riding & Evening Heritage Stroll', icon: 'paw-outline', pricePerPerson: 700, desc: 'Traditional horse ride along Kashmir Point and Mall Road bazaars' },
  ],

  // --- Swat & Kalam ---
  swat: [
    { id: 'swat_rafting', name: 'Swat River White Water Rafting Thrill', icon: 'water-outline', pricePerPerson: 2500, desc: 'Certified rapids rafting adventure along the roaring Swat River' },
    { id: 'swat_mahodand', name: 'Mahodand Lake 4x4 Mountain Jeep Safari', icon: 'trail-sign-outline', pricePerGroup: 6500, desc: 'Scenic off-road jeep drive through Ushu pine forest and Matiltan waterfall' },
    { id: 'swat_chairlift', name: 'Malam Jabba Chairlift & Mountain Zipline', icon: 'trending-up-outline', pricePerPerson: 1600, desc: 'High altitude cable ride and alpine resort pass' },
    { id: 'swat_heritage', name: 'Swat Buddhist Stupas & Museum Heritage Pass', icon: 'ribbon-outline', pricePerPerson: 600, desc: 'Ancient Butkara Stupa, Buddhist rock reliefs and Swat Archaeological Museum' },
  ],
  kalam: [
    { id: 'kalam_mahodand', name: 'Mahodand & Saifullah Lakes 4x4 Jeep Safari', icon: 'trail-sign-outline', pricePerGroup: 6500, desc: 'Rugged off-road expedition to glacial alpine lakes through Ushu Forest' },
    { id: 'kalam_trout', name: 'Ushu River Trout Fishing & Riverside BBQ', icon: 'fish-outline', pricePerPerson: 2000, desc: 'Fresh mountain trout fishing with rods and riverbank campfire meal' },
    { id: 'kalam_kundol', name: 'Kundol Lake Glacial Alpine Trek Guide', icon: 'walk-outline', pricePerGroup: 4000, desc: 'Professional local guide for the high-altitude glacial Kundol lake trek' },
  ],

  // --- Naran & Kaghan ---
  naran: [
    { id: 'naran_saiful_jeep', name: 'Lake Saif-ul-Malook 4x4 Jeep Expedition', icon: 'trail-sign-outline', pricePerGroup: 5500, desc: 'Exciting mountain jeep climb to the legendary fairy-tale lake at 10,578 ft' },
    { id: 'naran_rafting', name: 'Kunhar River White Water Rafting', icon: 'water-outline', pricePerPerson: 2200, desc: 'Certified rapids rafting thrilling adventure on Kunhar River' },
    { id: 'naran_boating', name: 'Saif-ul-Malook Boating & Lakeside Horse Riding', icon: 'boat-outline', pricePerPerson: 1500, desc: 'Wooden boat rowing on emerald waters and lakeside horse trot' },
    { id: 'naran_babusar_tour', name: 'Babusar Top & Lulusar Lake Mountain Jeep Tour', icon: 'car-sport-outline', pricePerGroup: 7000, desc: 'Scenic mountain pass tour to 13,691 ft Babusar summit and turquoise lake' },
  ],

  // --- Fairy Meadows ---
  'fairy meadows': [
    { id: 'fairy_jeep', name: 'Raikot Bridge to Tattu 4x4 Mountain Jeep Safari', icon: 'trail-sign-outline', pricePerGroup: 8500, desc: 'World-famous thrilling cliffside mountain jeep track to Tattu village' },
    { id: 'fairy_horse', name: 'Horse Riding / Mule Portage to Fairy Meadows', icon: 'paw-outline', pricePerPerson: 3500, desc: 'Scenic alpine horseback ascent to Fairy Meadows plateau' },
    { id: 'fairy_trek', name: 'Guided Beyal Camp & Nanga Parbat Base Camp Trek', icon: 'walk-outline', pricePerGroup: 4000, desc: 'Professional mountaineering guide trek right beneath Killer Mountain' },
    { id: 'fairy_bonfire', name: 'Alpine Stargazing & Bonfire Night', icon: 'flame-outline', pricePerPerson: 1200, desc: 'Clear Milky Way telescope viewing and pine wood campfire' },
  ],

  // --- Neelum Valley & Muzaffarabad ---
  neelum: [
    { id: 'neelum_rattigali', name: 'Ratti Gali Lake 4x4 Jeep Safari', icon: 'trail-sign-outline', pricePerGroup: 7000, desc: 'Thrilling jeep track to the alpine red-flower glacial lake (12,130 ft)' },
    { id: 'neelum_arangkel', name: 'Arang Kel Cable Car & Hilltop Village Hike', icon: 'trending-up-outline', pricePerPerson: 1000, desc: 'Local river cable lift and hike to the breathtaking pearl of Neelum' },
    { id: 'neelum_sharda', name: 'Sharda Ancient Buddhist University Heritage Walk', icon: 'ribbon-outline', pricePerPerson: 500, desc: 'Historical 9th-century ancient temple ruins guided heritage tour' },
    { id: 'neelum_waterfall', name: 'Kutton Waterfall & Jagran Stream Trout Meal', icon: 'water-outline', pricePerPerson: 1200, desc: 'Crystal cascading waterfall visit and stream trout meal experience' },
  ],
  muzaffarabad: [
    { id: 'muz_pir_chinasi', name: 'Pir Chinasi Mountain Peak 4x4 Drive', icon: 'trail-sign-outline', pricePerGroup: 4500, desc: 'Scenic 9,500 ft mountain drive with panoramic views of Kashmir valley' },
    { id: 'muz_red_fort', name: 'Red Fort (Rutta Qila) & Neelum-Jhelum Confluence', icon: 'ribbon-outline', pricePerPerson: 500, desc: 'Historic 16th-century fortress and two-tone river confluence viewpoint' },
  ],

  // --- Coastal Areas: Karachi, Clifton, Hawksbay, French Beach, Manora ---
  karachi: [
    { id: 'coast_scuba', name: 'Churna Island Scuba Diving & Coral Snorkeling', icon: 'water-outline', pricePerPerson: 4500, desc: 'Full scuba diving session with instructor, boat ride & underwater photography' },
    { id: 'coast_jetski', name: 'Clifton & Sea View Jet Ski & Speedboat', icon: 'boat-outline', pricePerPerson: 2000, desc: 'High-thrill coastal speedboat and jet ski riding on Arabian Sea' },
    { id: 'coast_quad', name: 'Beachfront Quad Biking & Camel Ride', icon: 'car-sport-outline', pricePerPerson: 1000, desc: 'Sand dune quad bike ride and traditional decorated camel safari on the beach' },
    { id: 'coast_manora', name: 'Manora Island Ferry Cruise & Waterfront Boardwalk', icon: 'navigate-outline', pricePerPerson: 800, desc: 'Scenic Keamari ferry ride to Manora Lighthouse and historic temple' },
    { id: 'coast_fishing', name: 'Deep Sea Fishing & Sunset Dinner Cruise', icon: 'fish-outline', pricePerGroup: 5500, desc: 'Chartered fishing boat expedition with rods, bait & sunset sea grill' },
  ],
  clifton: [
    { id: 'clifton_jetski', name: 'Sea View Jet Ski & Speedboat Thrill', icon: 'boat-outline', pricePerPerson: 2000, desc: 'High-speed Arabian Sea coastal boat ride and jet ski session' },
    { id: 'clifton_camel', name: 'Decorated Beach Camel & Buggy Ride', icon: 'paw-outline', pricePerPerson: 900, desc: 'Traditional camel trotting along Clifton shoreline and beach buggy' },
    { id: 'clifton_darya', name: 'Do Darya Waterfront Seafood Experience', icon: 'restaurant-outline', pricePerPerson: 2200, desc: 'Reserved open-air wooden deck dining directly over ocean waves' },
  ],
  hawksbay: [
    { id: 'hawksbay_snork', name: 'Turtle Beach Snorkeling & Water Sports', icon: 'water-outline', pricePerPerson: 2800, desc: 'Guided snorkeling session, paddleboarding and green sea turtle spotting' },
    { id: 'hawksbay_hut', name: 'Private Beach Hut Day Retreat & BBQ', icon: 'home-outline', pricePerGroup: 8000, desc: 'Furnished beachfront private hut with shaded deck and barbecue pit' },
  ],
  'french beach': [
    { id: 'french_scuba', name: 'French Beach Scuba Diving & Cliff Jumping', icon: 'water-outline', pricePerPerson: 4200, desc: 'Clear water scuba dive, cliff jump safety guide and underwater video' },
    { id: 'french_surf', name: 'Arabian Sea Paddleboard & Surfing Rental', icon: 'boat-outline', pricePerPerson: 1800, desc: 'Stand-up paddleboard rental with instructor and life jacket' },
  ],
  manora: [
    { id: 'manora_ferry', name: 'Keamari Ferry Boat Cruise to Manora Island', icon: 'navigate-outline', pricePerPerson: 800, desc: 'Traditional harbor boat crossing with seagulls, port views and lighthouse tour' },
    { id: 'manora_temple', name: 'Varun Dev Temple & Waterfront Promenade Pass', icon: 'ribbon-outline', pricePerPerson: 500, desc: 'Guided tour of the 1,000-year-old restored coastal temple & beach boardwalk' },
  ],

  // --- Gwadar & Kund Malir ---
  gwadar: [
    { id: 'gwadar_cliff', name: 'Hammerhead Cliff & Marine Drive Sunset Cruise', icon: 'boat-outline', pricePerGroup: 3500, desc: 'Dramatic peninsula cliff vantage point and ocean boat cruise in Gwadar' },
    { id: 'gwadar_batil', name: 'Koh-e-Batil Stairway Mountain Climb', icon: 'walk-outline', pricePerPerson: 600, desc: 'Scenic climb up the historic mountain overlooking Gwadar Port and Arabian Sea' },
    { id: 'gwadar_astola', name: 'Astola Island Coral Reef Snorkeling Boat Trip', icon: 'water-outline', pricePerPerson: 6500, desc: 'Expedition boat voyage to the uninhabited Island of Seven Hills' },
  ],
  'kund malir': [
    { id: 'kund_princess', name: 'Princess of Hope & Hingol Rock Formations Tour', icon: 'image-outline', pricePerGroup: 2500, desc: 'Breathtaking geological natural stone sculptures in Hingol National Park' },
    { id: 'kund_camping', name: 'Kund Malir Golden Beach Stargazing & Camping', icon: 'bonfire-outline', pricePerPerson: 3000, desc: 'Desert-meets-sea overnight beach camping and stargazing under pristine skies' },
  ],

  // --- Multan ---
  multan: [
    { id: 'multan_shrines', name: 'Shah Rukn-e-Alam & Bahauddin Zakariya Shrines Tour', icon: 'ribbon-outline', pricePerPerson: 600, desc: 'Guided architecture tour of 14th-century mastercraft blue tile shrines' },
    { id: 'multan_pottery', name: 'Kashigari Blue Pottery Artisan Workshop', icon: 'color-palette-outline', pricePerPerson: 1200, desc: 'Hands-on pottery making & glazed ceramic souvenir craft experience' },
    { id: 'multan_bazaar', name: 'Old Walled City & Hussain Agahi Bazaar Walk', icon: 'walk-outline', pricePerPerson: 800, desc: 'Authentic bazaar walk with original Multani Sohan Halwa tasting' },
    { id: 'multan_fort', name: 'Multan Fort (Qasim Bagh) & Damdama Viewpoint', icon: 'eye-outline', pricePerPerson: 500, desc: 'Panoramic fortress viewpoint and historic Sun Temple site visit' },
  ],

  // --- Bahawalpur ---
  bahawalpur: [
    { id: 'bahawalpur_palace', name: 'Noor Mahal & Darbar Mahal Royal Palace Tour', icon: 'business-outline', pricePerPerson: 800, desc: 'Italian neoclassical royal palace state apartments & light show' },
    { id: 'bahawalpur_derawar', name: 'Derawar Fort & Cholistan Desert 4x4 Safari', icon: 'trail-sign-outline', pricePerGroup: 6500, desc: 'Rugged 4x4 desert safari to the 40 colossal bastions of Derawar Fort' },
    { id: 'bahawalpur_camel', name: 'Cholistan Camel Caravan Trek & Bedouin Camp', icon: 'bonfire-outline', pricePerPerson: 2200, desc: 'Sunset camel caravan trek and desert campfire with traditional Rohi music' },
    { id: 'bahawalpur_safari', name: 'Lal Suhanra National Park Blackbuck Safari', icon: 'paw-outline', pricePerPerson: 1200, desc: 'Wildlife sanctuary tour spotting rare blackbucks, deer & desert birds' },
  ],

  // --- Peshawar ---
  peshawar: [
    { id: 'peshawar_qissa', name: 'Qissa Khwani Bazaar & Sethi Havelis Cultural Walk', icon: 'walk-outline', pricePerPerson: 1000, desc: 'Guided cultural walk through historic wood-carved merchant mansions' },
    { id: 'peshawar_bbq', name: 'Namak Mandi Shinwari BBQ Culinary Tour', icon: 'restaurant-outline', pricePerPerson: 2200, desc: 'Authentic tribal salt-meat Lamb Karahi & Peshawari Chappal Kabab feast' },
    { id: 'peshawar_museum', name: 'Peshawar Museum Gandhara Buddhist Art Pass', icon: 'ribbon-outline', pricePerPerson: 600, desc: "Entry to the world's largest collection of ancient Buddhist sculptures" },
    { id: 'peshawar_khyber', name: 'Bala Hissar Fort Viewpoint & Bab-e-Khyber Pass', icon: 'shield-outline', pricePerPerson: 1500, desc: 'Historic gateway to Central Asia excursion and fort vantage point' },
  ],

  // --- Taxila ---
  taxila: [
    { id: 'taxila_stupa', name: 'Dharmarajika Stupa & Sirkap Greek City Pass', icon: 'ribbon-outline', pricePerPerson: 700, desc: 'Guided archaeological walk across 2,500-year-old Gandhara ruins' },
    { id: 'taxila_museum', name: 'Taxila Museum Ancient Relics & Gold Treasures', icon: 'school-outline', pricePerPerson: 500, desc: 'Special museum entry showcasing ancient coins, jewelry and relics' },
    { id: 'taxila_julian', name: 'Julian Buddhist Monastery Mountain Hike', icon: 'walk-outline', pricePerPerson: 600, desc: 'Scenic hill hike to the ancient university & meditation cells of Julian' },
  ],

  // --- Rohtas Fort ---
  'rohtas fort': [
    { id: 'rohtas_walls', name: 'Sher Shah Suri Fortress Ramparts Trek', icon: 'shield-outline', pricePerPerson: 800, desc: 'Guided trek across the 4km massive UNESCO stone fortress walls' },
    { id: 'rohtas_gate', name: 'Sohail Gate & Haveli Man Singh Photo Tour', icon: 'camera-outline', pricePerPerson: 600, desc: 'Historic royal palace and intricate architectural photo expedition' },
    { id: 'rohtas_stepwell', name: 'Stepwell (Baoli) & Subterranean Tunnels Exploration', icon: 'trail-sign-outline', pricePerPerson: 700, desc: 'Historic subterranean water reservoir and military tunnel tour' },
  ],

  // --- Mohenjo-daro ---
  'mohenjo-daro': [
    { id: 'mohenjo_ruins', name: 'Ancient Indus Valley Ruins Guided Expedition', icon: 'school-outline', pricePerPerson: 800, desc: 'Expert archaeological guide through the 4,500-year-old Bronze Age city' },
    { id: 'mohenjo_bath', name: 'The Great Bath & Granary Discovery Walk', icon: 'walk-outline', pricePerPerson: 500, desc: 'Iconic prehistoric bath and urban planning discovery tour' },
    { id: 'mohenjo_museum', name: 'Mohenjo-daro Museum & Priest-King Relics', icon: 'ribbon-outline', pricePerPerson: 500, desc: 'Special museum gallery showcasing seals, pottery and bronze sculptures' },
  ],

  // --- Katas Raj & Khewra ---
  khewra: [
    { id: 'khewra_train', name: 'Khewra Salt Mine Electric Train & Salt Palace Tour', icon: 'train-outline', pricePerPerson: 1000, desc: 'Underground train ride through illuminated salt brick mosques & bridges' },
    { id: 'katas_temples', name: 'Katas Raj Sacred Temples & Holy Pond Heritage Walk', icon: 'ribbon-outline', pricePerPerson: 600, desc: 'Historic 7-temple Hindu complex and sacred pond guided tour' },
    { id: 'khewra_canyon', name: 'Salt Range Geological Canyon Safari', icon: 'car-sport-outline', pricePerGroup: 3500, desc: 'Scenic drive through dramatic prehistoric fossil valleys & red rock gorges' },
  ],

  // --- Quetta & Ziarat ---
  ziarat: [
    { id: 'ziarat_residency', name: 'Quaid-e-Azam Residency & Juniper Forest Pass', icon: 'home-outline', pricePerPerson: 600, desc: "Tour of the historic wooden summer retreat in the world's 2nd largest juniper forest" },
    { id: 'ziarat_prospect', name: 'Prospect Point Panoramic Hilltop 4x4 Safari', icon: 'trail-sign-outline', pricePerGroup: 2500, desc: 'Scenic 4x4 drive to the 8,800 ft cliff overlooking Chautair valley' },
  ],
  quetta: [
    { id: 'quetta_hanna', name: 'Hanna Lake Boating & Mountain Picnic Pass', icon: 'boat-outline', pricePerPerson: 1000, desc: 'Serene boating on turquoise Hanna Lake framed by rugged crags' },
    { id: 'quetta_wildlife', name: 'Hazarganji Chiltan National Park Wildlife Safari', icon: 'paw-outline', pricePerPerson: 1500, desc: 'Guided safari to spot rare Chiltan wild markhor and mountain ibex' },
    { id: 'quetta_bazaar', name: 'Liaquat Bazaar Afghan Carpets & Dry Fruit Trail', icon: 'restaurant-outline', pricePerPerson: 800, desc: 'Traditional dry fruits tasting, Peshawari/Quetta chappal & antique carpets' },
  ],

  // --- Kumrat Valley ---
  kumrat: [
    { id: 'kumrat_katora', name: 'Katora Lake Alpine Trekking Guide', icon: 'trail-sign-outline', pricePerGroup: 4500, desc: 'Guided trek to the bowl-shaped glacial lake surrounded by snowy peaks' },
    { id: 'kumrat_camping', name: 'Deodar Forest River Camping & Bonfire', icon: 'bonfire-outline', pricePerPerson: 2500, desc: 'Riverside tenting under towering deodars with stargazing campfire' },
    { id: 'kumrat_jeep', name: 'Kumrat Waterfall 4x4 Jeep Safari', icon: 'car-sport-outline', pricePerGroup: 5000, desc: 'Rugged jeep drive to the roaring cascading forest waterfalls' },
  ],

  // --- Chitral & Kalash ---
  chitral: [
    { id: 'kalash_culture', name: 'Kalash Valleys Cultural Immersion & Chilam Joshi Pass', icon: 'people-outline', pricePerPerson: 2500, desc: 'Unique indigenous animist culture, temple visits and traditional dance' },
    { id: 'chitral_markhor', name: 'Chitral Gol National Park Markhor Safari', icon: 'paw-outline', pricePerGroup: 3000, desc: "Wildlife ranger tour spotting Pakistan's national animal (Markhor)" },
    { id: 'chitral_shandur', name: 'Shandur Polo Ground Excursion', icon: 'trophy-outline', pricePerGroup: 6500, desc: "High mountain excursion to the world's highest polo ground (12,200 ft)" },
    { id: 'chitral_fort', name: 'Historic Shahi Mosque & Chitral Fort Tour', icon: 'shield-outline', pricePerPerson: 700, desc: 'Guided heritage walk through the ancient royal capital of Chitral' },
  ],

  // --- Gilgit, Naltar & Phander ---
  gilgit: [
    { id: 'gilgit_naltar', name: 'Naltar Valley Rainbow Lakes 4x4 Safari', icon: 'trail-sign-outline', pricePerGroup: 6500, desc: 'Thrilling 4x4 jeep expedition to green, blue and yellow crystal lakes' },
    { id: 'gilgit_buddha', name: 'Kargah Buddha 7th-Century Rock Relief Tour', icon: 'ribbon-outline', pricePerPerson: 500, desc: 'Historical relief carved high on cliffside along Kargah Nala' },
    { id: 'gilgit_phander', name: 'Phander Lake Trout Fishing & Riverside Camp', icon: 'fish-outline', pricePerPerson: 3000, desc: 'Catch-and-cook trout experience along emerald Phander waters' },
    { id: 'gilgit_rafting', name: 'Gilgit River Rafting & Suspension Bridge Walk', icon: 'water-outline', pricePerPerson: 2200, desc: 'River rapids thrill and traditional wooden cable bridge crossing' },
  ],

  // --- Deosai & Astore ---
  deosai: [
    { id: 'deosai_safari', name: 'Sheosar Lake & Himalayan Brown Bear 4x4 Safari', icon: 'trail-sign-outline', pricePerGroup: 8500, desc: "Land of Giants high plateau expedition spotting wild Himalayan bears" },
    { id: 'astore_rama', name: 'Rama Lake Alpine Pine Forest Trek', icon: 'walk-outline', pricePerPerson: 1500, desc: 'Scenic mountain trek through cedar forests to emerald Rama Lake' },
    { id: 'deosai_camp', name: 'High Plateau Stargazing & Alpine Camp', icon: 'bonfire-outline', pricePerPerson: 3000, desc: 'Overnight tenting under zero-light pollution Milky Way galaxy' },
  ],

  // --- Faisalabad ---
  faisalabad: [
    { id: 'fsb_clock_tower', name: 'Eight Bazaars & Clock Tower Heritage Tour', icon: 'time-outline', pricePerPerson: 600, desc: 'British architectural Union Jack 8-bazaar plan and Clock Tower Square' },
    { id: 'fsb_textile', name: 'Khaddi & Textile Artisan Weaver Tour', icon: 'color-palette-outline', pricePerPerson: 900, desc: 'Visit famous fabric mills, handloom khaddi centers and traditional bazaar' },
    { id: 'fsb_food', name: 'D-Ground & Katchery Bazaar Food Trail', icon: 'restaurant-outline', pricePerPerson: 1200, desc: 'Authentic Punjabi dal chawal, samosa chat and rabri kheer crawl' },
  ],

  // --- Sialkot ---
  sialkot: [
    { id: 'skt_iqbal', name: 'Iqbal Manzil National Poet Birthplace Tour', icon: 'book-outline', pricePerPerson: 500, desc: 'Historic residence and museum of Allama Muhammad Iqbal' },
    { id: 'skt_fort', name: 'Sialkot Fort (Raja Salban) & Ancient Mounds Walk', icon: 'shield-outline', pricePerPerson: 600, desc: '2,000-year-old fort ramparts and historic city overlook' },
    { id: 'skt_craft', name: 'Master Craftsmen Sports & Leather Artisan Tour', icon: 'trophy-outline', pricePerPerson: 1000, desc: 'Behind-the-scenes tour of FIFA World Cup soccer ball & leathercraft makers' },
  ],

  // --- Harappa ---
  harappa: [
    { id: 'hrp_ruins', name: 'Indus Valley Civilization Harappa Ruins Tour', icon: 'school-outline', pricePerPerson: 700, desc: 'Guided archaeological walk through 5,000-year-old granaries & city plan' },
    { id: 'hrp_museum', name: 'Harappa Archaeological Museum Pass', icon: 'ribbon-outline', pricePerPerson: 500, desc: 'Ancient terra-cotta toys, seals and copper tool collections' },
  ],

  // --- Thatta & Makli ---
  thatta: [
    { id: 'thatta_makli', name: 'UNESCO Makli Necropolis Royal Tombs Walk', icon: 'ribbon-outline', pricePerPerson: 700, desc: 'One of the world largest funerary sites with intricate stone carvings' },
    { id: 'thatta_shahjahan', name: 'Shah Jahan Mosque 100-Dome Acoustic Tour', icon: 'business-outline', pricePerPerson: 500, desc: 'Remarkable Mughal tilework and unique architectural acoustic domes' },
    { id: 'thatta_keenjhar', name: 'Keenjhar (Kalri) Lake Boating & Noori Shrine', icon: 'boat-outline', pricePerPerson: 1200, desc: 'Motorboat cruise to the mid-lake shrine of Noori Jam Tamachi' },
  ],

  // --- Hyderabad & Sukkur ---
  hyderabad: [
    { id: 'hyd_pacco_qillo', name: 'Pacco Qillo Fort & Talpur Mirs Tombs Tour', icon: 'shield-outline', pricePerPerson: 600, desc: 'Historic brick fortress built by Ghulam Shah Kalhoro in 1768' },
    { id: 'hyd_shahi_bazaar', name: 'Shahi Bazaar Glass Bangles & Choorian Walk', icon: 'color-palette-outline', pricePerPerson: 700, desc: 'Famous 2km covered bazaar for authentic glass bangles and Sindhi ajrak' },
    { id: 'hyd_kotri_boat', name: 'Indus River Sunset Boat Ride at Kotri Barrage', icon: 'boat-outline', pricePerPerson: 1000, desc: 'Scenic evening boat cruise on the Indus River with fresh river fish' },
  ],
  sukkur: [
    { id: 'sukkur_sadhubela', name: 'Sadhu Bela Island Temple Boat Ride', icon: 'boat-outline', pricePerPerson: 1200, desc: 'Serene river boat voyage to the sacred marble island temple in the Indus' },
    { id: 'sukkur_lansdowne', name: 'Lansdowne Bridge & Sukkur Barrage Museum', icon: 'business-outline', pricePerPerson: 600, desc: 'Historic 1889 cantilever railway bridge and 66-gate barrage engineering tour' },
    { id: 'sukkur_masoom', name: 'Masoom Shah Minaret Spiral Climb & Panorama', icon: 'eye-outline', pricePerPerson: 500, desc: 'Climb the 84-step red brick minaret for 360-degree views of Sukkur' },
  ],

  // --- Abbottabad & Thandiani ---
  abbottabad: [
    { id: 'abt_thandiani', name: 'Thandiani Summit Cloud Forest Ridge Walk', icon: 'trail-sign-outline', pricePerPerson: 1200, desc: 'High-altitude 9,000 ft tranquil pine ridge walk above the clouds' },
    { id: 'abt_ilyasi', name: 'Ilyasi Mosque Spring & Traditional Pakora Trail', icon: 'restaurant-outline', pricePerPerson: 600, desc: 'Historic spring-water mosque architecture and renowned mountain snacks' },
    { id: 'abt_shimla', name: 'Shimla Hill Viewpoint & Pine Forest Walk', icon: 'walk-outline', pricePerPerson: 500, desc: 'Scenic hill park viewpoint overlooking entire Abbottabad valley' },
  ],

  // --- Rawalakot & Banjosa Lake ---
  rawalakot: [
    { id: 'rwk_banjosa', name: 'Banjosa Lake Paddle Boating & Pine Picnic', icon: 'boat-outline', pricePerPerson: 1000, desc: 'Serene pine-encircled artificial lake boating and lakeside rest' },
    { id: 'rwk_toli_peer', name: 'Toli Peer 8,800 ft Mountain Top Trek', icon: 'trail-sign-outline', pricePerPerson: 1500, desc: 'Panoramic vast green hilltop with views of Poonch river and snow peaks' },
  ],
};

function getActivitiesForDestination(destName, categoryName) {
  const normalized = (destName || '').trim().toLowerCase();
  
  // 1. Direct city lookup
  if (normalized) {
    for (const [key, list] of Object.entries(DESTINATION_ACTIVITIES_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return list;
      }
    }
  }

  // 2. Category-based fallback
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('cultural') || cat.includes('historical')) {
    return [
      { id: 'cat_fort_pass', name: 'Historic Fortress & Heritage Site Guided Pass', icon: 'shield-outline', pricePerPerson: 700, desc: 'Official ticket and architectural guide to local forts, museums and heritage sites' },
      { id: 'cat_food_trail', name: 'Old Town Heritage & Traditional Food Street Walk', icon: 'restaurant-outline', pricePerPerson: 1500, desc: 'Guided evening walking tour through ancient bazaars and regional culinary delights' },
      { id: 'cat_artisan_craft', name: 'Traditional Artisan Workshop & Handicraft Crafting', icon: 'color-palette-outline', pricePerPerson: 1000, desc: 'Hands-on cultural souvenir workshop with local master craftsmen' },
      { id: 'cat_museum_pass', name: 'Archaeological Museum & Monument Pass', icon: 'school-outline', pricePerPerson: 500, desc: 'All-access admission to regional history museums and monuments' },
    ];
  }
  if (cat.includes('coastal') || cat.includes('beach')) {
    return [
      { id: 'cat_coast_boat', name: 'Coastal Speedboat & Jet Ski Ride', icon: 'boat-outline', pricePerPerson: 2000, desc: 'High-speed marine boating session and water sports thrill' },
      { id: 'cat_coast_scuba', name: 'Scuba Diving & Coral Reef Snorkeling', icon: 'water-outline', pricePerPerson: 4200, desc: 'Certified underwater snorkeling with equipment, guide and photos' },
      { id: 'cat_coast_quad', name: 'Beachfront Quad Biking & Camel Safari', icon: 'car-sport-outline', pricePerPerson: 1000, desc: 'Sand dune buggy riding and decorated camel tour along the coastline' },
      { id: 'cat_coast_cruise', name: 'Sunset Island Ferry Cruise & Seafood Grill', icon: 'restaurant-outline', pricePerGroup: 5000, desc: 'Evening boat cruise with panoramic sea views and fresh coastal fish' },
    ];
  }
  if (cat.includes('adventure') || cat.includes('nature')) {
    return [
      { id: 'cat_chairlift', name: 'Panoramic Mountain Chairlift & Cable Car', icon: 'trending-up-outline', pricePerPerson: 1200, desc: 'Scenic aerial cable car ride over mountain ridges and pine forests' },
      { id: 'cat_zipline', name: 'High-Altitude Mountain Zipline Flight', icon: 'airplane-outline', pricePerPerson: 1800, desc: 'Certified alpine zipline adventure across scenic valley gorge' },
      { id: 'cat_jeep_safari', name: '4x4 Off-Road Mountain Valley Safari', icon: 'trail-sign-outline', pricePerGroup: 6000, desc: 'Rugged 4x4 mountain trail excursion to hidden alpine viewpoints' },
      { id: 'cat_rafting', name: 'White Water Mountain River Rafting', icon: 'water-outline', pricePerPerson: 2500, desc: 'Certified river rafting thrill with life jackets and safety instructor' },
    ];
  }

  // Northern Areas & Universal Default
  return [
    { id: 'cat_lake_boat', name: 'Glacial Lake Boating & Speedboat Session', icon: 'boat-outline', pricePerPerson: 1800, desc: 'Scenic motorboat cruise on crystal turquoise alpine waters' },
    { id: 'cat_mountain_jeep', name: '4x4 Mountain Jeep Safari Expedition', icon: 'trail-sign-outline', pricePerGroup: 6500, desc: 'Exciting 4x4 jeep journey to alpine plateaus and high mountain passes' },
    { id: 'cat_fort_heritage', name: 'Ancient Mountain Fort & Royal Palace Pass', icon: 'shield-outline', pricePerPerson: 1000, desc: 'Guided tour of historical mountain citadels and royal valley landmarks' },
    { id: 'cat_stargazing', name: 'Alpine Campfire & Milky Way Stargazing Night', icon: 'flame-outline', pricePerPerson: 1200, desc: 'Overnight campfire under high-altitude unpolluted night skies' },
  ];
}

const CITY_EXTRA_EXPERIENCES_MAP = {
  lahore: [
    {
      id: 'lhr_royal_walk',
      name: '🏰 Shahi Qila & Badshahi Mosque VIP Night Heritage Walk',
      category: 'Heritage VIP Tour',
      price: 6000,
      desc: 'Exclusive evening guided tour of Lahore Fort, illuminated Sheesh Mahal, and Badshahi Mosque royal courtyards.',
    },
    {
      id: 'lhr_food_feast',
      name: '🍲 Androon Lahore & Fort Road Food Street Royal Feast',
      category: 'Food Street Feast',
      price: 12000,
      desc: 'Authentic Lahori feast: Phika Lassi, Siri Paye, Mutton Karahi, Dumba Tikka & Shahi Kheer overlooking Badshahi Mosque.',
    },
    {
      id: 'lhr_wagah_vip',
      name: '🎺 Wagah Border VIP Flag Ceremony Pass & Escort',
      category: 'Wagah Border Pass',
      price: 8000,
      desc: 'Reserved front-row VIP stadium seating & escorted entrance pass at the legendary Pak-India Wagah Border parade.',
    },
    {
      id: 'lhr_qawwali',
      name: '🪕 Live Sufi Qawwali Night at Historic Walled City Haveli',
      category: 'Sufi Qawwali Night',
      price: 10000,
      desc: 'Mesmerizing live traditional acoustic Qawwali night with authentic cardamom green tea in a 200-year-old historic Haveli.',
    },
    {
      id: 'lhr_mughal_photo',
      name: '📸 Mughal Royal Attire & 4K DSLR Photo Shoot',
      category: 'Royal Photography',
      price: 14000,
      desc: 'Professional photographer providing royal Mughal costumes, turbans and 4K DSLR portraits at Shalimar Gardens.',
    },
    {
      id: 'lhr_bazaar_safari',
      name: '🛍️ Anarkali & Kashmiri Bazaar Hidden Crafts Safari',
      category: 'Artisan Shopping',
      price: 5000,
      desc: 'Private guided shopping trail through ancient bazaars: pure silk, handmade embroidered khussas, and copper brassware.',
    },
    {
      id: 'lhr_buggy_ride',
      name: '🐴 Royal Victoria Horse Carriage Buggy Ride',
      category: 'Royal Carriage Ride',
      price: 4000,
      desc: 'Decorated horse-drawn royal Victoria buggy carriage tour through historic Mall Road and Lawrence Gardens.',
    },
  ],

  'malam jabba': [
    {
      id: 'mj_ski_gear',
      name: '⛷️ Skiing & Snowboard Equipment Rental & Pass',
      category: 'Skiing & Snowboarding',
      price: 12000,
      desc: 'Full ski gear, snow boots, poles, certified ski slope pass, and personal instructor session on Malam Jabba ski slopes.',
    },
    {
      id: 'mj_chairlift',
      name: '🚡 Panoramic Dual Chairlift & Cloud-Peak Cable Car Pass',
      category: 'Chairlift Pass',
      price: 6000,
      desc: 'Spectacular dual chairlift ride to the 9,200ft Malam Jabba summit with breathtaking views over snow pine forests.',
    },
    {
      id: 'mj_zipline',
      name: '🧗 Alpine Gorge Mountain Zipline Thrill',
      category: 'Alpine Zipline',
      price: 8000,
      desc: 'Certified high-altitude zipline flight soaring over the snow-covered pine valley gorge with professional safety gear.',
    },
    {
      id: 'mj_tubing',
      name: '🛷 Pine Forest Snow Tubing & Ice Skating Pass',
      category: 'Snow Tubing & Skating',
      price: 7000,
      desc: 'High-speed snow tube downhill slide & ice rink session with safety helmets and winter traction gear.',
    },
    {
      id: 'mj_bonfire',
      name: '🪵 Cedar Forest Campfire & Swati Kahwa Night',
      category: 'Cedar Campfire',
      price: 10000,
      desc: 'Evening roaring campfire under snowy pines with warm cardamom Swati green tea, roasted nuts & marshmallows.',
    },
    {
      id: 'mj_shinwari_bbq',
      name: '🍖 Khyber Shinwari Live Mutton Karahi & BBQ in Snow',
      category: 'Shinwari BBQ Feast',
      price: 14000,
      desc: 'Charcoal-grilled mutton tikka & live Shinwari Karahi feast served piping hot beside the snowy mountain slopes.',
    },
    {
      id: 'mj_drone_shoot',
      name: '📸 4K Snow Peak & Skiing Drone Cinematography',
      category: 'Drone Cinematography',
      price: 15000,
      desc: 'Dedicated aerial drone photographer capturing your ski runs, chairlift ascent, and summit panoramic moments in 4K.',
    },
  ],

  hunza: [
    {
      id: 'hnz_attabad_boat',
      name: '🚤 Attabad Lake Speedboat Cruise & Jet Ski Thrill',
      category: 'Turquoise Lake Boating',
      price: 10000,
      desc: 'High-speed speedboat cruise on turquoise Attabad waters with jet ski riding and life jacket safety gear.',
    },
    {
      id: 'hnz_passu_bridge',
      name: '🌉 Passu Cones Suspension Bridge Adrenaline Walk',
      category: 'Hussaini Bridge Crossing',
      price: 6000,
      desc: 'Thrilling suspension bridge crossing high over Hunza River with dramatic Passu Cathedral backdrop and safety harness.',
    },
    {
      id: 'hnz_eagles_sunset',
      name: '🦅 Eagles Nest Duiker Peak Sunset & Live Rubab',
      category: '360° Sunset Viewpoint',
      price: 9000,
      desc: 'Panoramic sunset over Rakaposhi, Ultar Sar & Golden Peak with live local Hunza Rubab acoustic performance.',
    },
    {
      id: 'hnz_forts_tour',
      name: '🏰 Baltit & Altit Forts Royal Mirs Guided VIP Tour',
      category: 'Royal Palaces Heritage',
      price: 7000,
      desc: '800-year-old royal palace private tour, ancient armory, royal organic gardens, and historical culture guide.',
    },
    {
      id: 'hnz_organic_feast',
      name: '🫓 Traditional Wakhi / Burushaski Organic Feast',
      category: 'Traditional Hunza Feast',
      price: 8000,
      desc: 'Authentic local feast: hot Chapshuro meat pies, Giyaling pancakes, fresh walnut paste, and warm apricot blossom tea.',
    },
    {
      id: 'hnz_khunjerab_jeep',
      name: '🚙 4x4 Mountain Jeep Safari to Khunjerab Pass (15,397 ft)',
      category: 'Pak-China Border Jeep',
      price: 16000,
      desc: 'High-altitude mountain 4x4 jeep expedition up to the Pak-China border, highest paved international road and snow peaks.',
    },
    {
      id: 'hnz_passu_drone',
      name: '📸 Passu Cones & Glacier 4K Drone Aerial Photography',
      category: '4K Glacier Photography',
      price: 15000,
      desc: 'Cinematic aerial drone shoot across the dramatic Karakoram Highway needle peaks and glacier moraines.',
    },
  ],

  skardu: [
    {
      id: 'skd_katpana_safari',
      name: '🏖️ Katpana Cold Desert 4x4 Dune Bashing & Quad Bike',
      category: 'Cold Desert Safari',
      price: 12000,
      desc: "World's highest cold desert sand dune drifting & sunset quad biking at 7,500 ft with panoramic Karakoram views.",
    },
    {
      id: 'skd_kachura_boat',
      name: '🚣 Shangrila Lower & Upper Kachura Lakes Shikara Boating',
      category: 'Glacial Lakes Boating',
      price: 7000,
      desc: 'Serene shikara boat ride across crystal glacier lakes, trout viewing, and stroll through Shangrila apricot orchards.',
    },
    {
      id: 'skd_deosai_expedition',
      name: '🏔️ Deosai Plains (Land of Giants) 4x4 Jeep Safari',
      category: 'Deosai Plains Safari',
      price: 18000,
      desc: "Full-day rugged 4x4 expedition across the world's 2nd highest alpine plateau to emerald Sheosar Lake at 13,780 ft.",
    },
    {
      id: 'skd_trout_bbq',
      name: '🐟 Fresh Indus River Trout Catch & Riverside Barbecue',
      category: 'Indus Trout BBQ',
      price: 11000,
      desc: 'Cold-water angling permit and live charcoal grilled river trout dinner prepared fresh beside the Indus riverbank.',
    },
    {
      id: 'skd_fort_heritage',
      name: '🏰 600-Year-Old Shigar Fort & Kharpocho Palace VIP Tour',
      category: 'Balti Royal Heritage',
      price: 8000,
      desc: 'Guided tour of restored 17th-century Raja of Shigar palace and ancient Kharpocho fortress overlooking Skardu valley.',
    },
    {
      id: 'skd_milkyway_night',
      name: '🌌 Katpana Stargazing & Milky Way Campfire Night',
      category: 'Milky Way Campfire',
      price: 14000,
      desc: 'Zero-light-pollution telescope galaxy viewing in the cold desert with warm bonfire, Balti butter tea and marshmallows.',
    },
    {
      id: 'skd_drone_pkg',
      name: '📸 Cold Desert & Glacial Lakes 4K Drone Cinematography',
      category: 'Skardu Drone Video',
      price: 15000,
      desc: 'Professional drone cinematography capturing Katpana sand dunes, Shangrila Resort, and Upper Kachura waters in 4K.',
    },
  ],

  naran: [
    {
      id: 'nrn_saifulmalook',
      name: '🚙 Lake Saif-ul-Malook 4x4 Mountain Jeep Safari',
      category: 'Saif-ul-Malook Safari',
      price: 10000,
      desc: 'Rugged mountain 4x4 jeep ascent to the legendary 10,578 ft fairy lake with crystal water boating and photography.',
    },
    {
      id: 'nrn_babusar_exp',
      name: '🏔️ Babusar Top (13,691 ft) Summit & Lulusar Lake Safari',
      category: 'Babusar Top Summit',
      price: 12000,
      desc: 'High alpine mountain pass expedition over the roof of Kaghan Valley to Lulusar Lake and the Babusar Pass summit.',
    },
    {
      id: 'nrn_rafting',
      name: '🛶 Kunhar River White Water Rafting Thrill',
      category: 'River Rafting',
      price: 8000,
      desc: 'Adrenaline white water rapid rafting on the glacial Kunhar river with certified safety raft guides and life vests.',
    },
    {
      id: 'nrn_trout_bbq',
      name: '🐟 Kunhar Fresh Brown Trout Catch & Live Riverside BBQ',
      category: 'Kunhar Trout BBQ',
      price: 11000,
      desc: 'Fresh river trout angling permit and live charcoal grilled trout feast prepared hot right on the Kunhar riverbank.',
    },
    {
      id: 'nrn_shogran_safari',
      name: '⛺ Siri Paye & Shogran Emerald Meadows Horse Trek',
      category: 'Shogran Alpine Meadows',
      price: 9000,
      desc: 'Jeep safari up to the clouds of Siri Paye alpine meadow with guided mountain horse riding under Makra Peak.',
    },
    {
      id: 'nrn_bonfire',
      name: '🔥 Riverside Kunhar Campfire & Kashmiri Kahwa Night',
      category: 'Riverside Campfire',
      price: 10000,
      desc: 'Evening roaring bonfire right beside the Kunhar river with warm cardamom green tea, roasted nuts & marshmallows.',
    },
    {
      id: 'nrn_drone_pkg',
      name: '📸 Babusar & Kaghan Waterfalls 4K Drone Package',
      category: 'Kaghan Drone Package',
      price: 14000,
      desc: 'High-resolution aerial drone shoot capturing Saif-ul-Malook, Batakundi waterfalls, and Babusar Top summit vistas.',
    },
  ],

  babusar: [
    {
      id: 'bbs_summit_jeep',
      name: '🏔️ Babusar Pass (13,691 ft) Summit & Chilas Border Jeep Safari',
      category: 'Babusar Pass Jeep',
      price: 12000,
      desc: 'Rugged 4x4 jeep tour across the high mountain pass connecting Khyber Pakhtunkhwa to Gilgit-Baltistan with snow views.',
    },
    {
      id: 'bbs_lulusar_lake',
      name: '🚣 Lulusar Lake Turquoise Waters Excursion & Boating',
      category: 'Alpine Lake Boating',
      price: 8000,
      desc: 'Scenic stop and motorboat ride on Lulusar Lake, the primary headwaters reservoir of the Kunhar River.',
    },
    {
      id: 'bbs_batakundi_bbq',
      name: '🐟 Batakundi Riverside Trout Fishing & Live Charcoal BBQ',
      category: 'Batakundi Trout BBQ',
      price: 11000,
      desc: 'Cold-water river trout fishing and live outdoor barbecue feast beside the cascading mountain streams of Batakundi.',
    },
    {
      id: 'bbs_pass_camp',
      name: '⛺ High-Altitude Alpine Pass Camping & Stargazing',
      category: 'Alpine Camping',
      price: 15000,
      desc: 'Overnight tent stay with warm sleeping bags and panoramic galaxy stargazing near the high alpine pass.',
    },
    {
      id: 'bbs_kahwa_fire',
      name: '🔥 High-Pass Campfire & Saffron Mountain Kahwa',
      category: 'Mountain Pass Bonfire',
      price: 9000,
      desc: 'Evening bonfire in freezing pass winds with warm saffron cardamom green tea and roasted mountain treats.',
    },
    {
      id: 'bbs_drone_pkg',
      name: '📸 4K High-Altitude Babusar Pass Drone Cinematography',
      category: 'Babusar Drone Cinematography',
      price: 15000,
      desc: 'Spectacular 4K drone cinematography capturing the serpentine alpine switchbacks and snow peaks of Babusar.',
    },
  ],

  swat: [
    {
      id: 'swt_mahodand',
      name: '🚙 Mahodand Lake & Ushu Cedar Forest 4x4 Safari',
      category: 'Mahodand Lake Jeep',
      price: 12000,
      desc: 'Off-road 4x4 jeep safari through dense deodar pine forests and Matiltan waterfalls to emerald Mahodand Lake.',
    },
    {
      id: 'swt_boating_horse',
      name: '🚣 Mahodand Emerald Lake Boating & Meadow Horse Riding',
      category: 'Mahodand Lake Boating',
      price: 7000,
      desc: 'Scenic wooden boat cruise across the emerald alpine lake followed by a mountain meadow horse ride under snow peaks.',
    },
    {
      id: 'swt_riverside_rubab',
      name: '🌲 Swat River Riverside BBQ & Live Pashto Rubab Night',
      category: 'Swat River Rubab BBQ',
      price: 11000,
      desc: 'Live charcoal mutton tikka and Shinwari karahi feast accompanied by live acoustic Pashto Rubab beside Swat River.',
    },
    {
      id: 'swt_buddhist_trail',
      name: '🏰 Swat Museum & Butkara Ancient Buddhist Stupa Trail',
      category: 'Gandhara Buddhist Tour',
      price: 6000,
      desc: 'Guided archaeological walk exploring 2,000-year-old Gandharan Buddhist rock carvings, stupas, and royal museum relics.',
    },
    {
      id: 'swt_malam_pass',
      name: '🚡 Malam Jabba Snow Chairlift & Alpine Zipline Pass',
      category: 'Malam Jabba Day Pass',
      price: 10000,
      desc: 'Day pass for Malam Jabba scenic chairlift ascent, high-speed mountain zipline and pine ridge walking trail.',
    },
    {
      id: 'swt_drone_pkg',
      name: '📸 Kalam & Ushu Valleys 4K Aerial Drone Cinematography',
      category: 'Swat Drone Video',
      price: 14000,
      desc: 'High-res 4K drone package capturing Ushu glacier, cascading waterfalls, and the emerald bends of Swat valley.',
    },
  ],

  islamabad: [
    {
      id: 'isb_monal_dinner',
      name: '⛰️ Margalla Hills Private Ridge Sunset & Monal Dining',
      category: 'Margalla Hilltop Dining',
      price: 12000,
      desc: 'Reserved scenic viewpoint dining table overlooking the illuminated capital skyline with authentic Pakistani cuisine.',
    },
    {
      id: 'isb_rawal_water',
      name: '🚤 Rawal Lake Speedboat Cruise & Water Sports Pass',
      category: 'Rawal Lake Boating',
      price: 7000,
      desc: 'High-speed motorboat cruise, lake pedal boating and water sports session at scenic Rawal Lake View Park.',
    },
    {
      id: 'isb_monument_vip',
      name: '🏛️ Lok Virsa & Pakistan Monument VIP Heritage Pass',
      category: 'National Heritage Tour',
      price: 6000,
      desc: 'Official guided tour of national folk heritage museum, regional ethnology halls and Pakistan Monument architectural arches.',
    },
    {
      id: 'isb_bus_tour',
      name: '🚌 Double-Decker Islamabad Open-Top Sightseeing Tour',
      category: 'Open-Top Bus Tour',
      price: 5000,
      desc: 'Open-roof scenic city tour covering Faisal Mosque, Shakarparian garden, Constitution Avenue & diplomatic zone.',
    },
    {
      id: 'rwp_street_food',
      name: '🍢 Raja Bazaar & Saddar Heritage Street Food Safari',
      category: 'Rawalpindi Food Safari',
      price: 8000,
      desc: 'Old Rawalpindi food walk: authentic Seekh Kababs, Bala Tikka, Rabri falooda and hot Kashmiri chai.',
    },
    {
      id: 'isb_drone_pkg',
      name: '📸 Margalla Hills & Faisal Mosque 4K Drone Package',
      category: 'Capital Drone Cinematography',
      price: 14000,
      desc: 'Professional drone cinematography capturing the majestic Faisal Mosque marble porticos and green Margalla ridges.',
    },
  ],

  karachi: [
    {
      id: 'khi_yacht_cruise',
      name: '🚤 Arabian Sea Private Yacht Cruise & Sunset Sailing',
      category: 'Arabian Sea Yacht',
      price: 16000,
      desc: 'Exclusive luxury motorboat/yacht cruise along Karachi harbor, Oyster Rocks, and Manora Island with sunset views.',
    },
    {
      id: 'khi_crabbing',
      name: '🦀 Deep Sea Crabbing & Live Floating Seafood Feast',
      category: 'Live Crabbing Feast',
      price: 14000,
      desc: 'Live crab catching experience on the Arabian Sea with boat chef cooking spicy masala crabs and hot garlic naan on board.',
    },
    {
      id: 'khi_beach_hut',
      name: '🌊 Hawksbay & Turtle Beach Private Seaside Cabana Day',
      category: 'Seaside Beach Cabana',
      price: 15000,
      desc: 'Furnished seaside beach hut with private oceanfront terrace, fresh coastal breeze, swimming and live charcoal BBQ.',
    },
    {
      id: 'khi_watersports',
      name: '🪂 Jet Ski Thrill & Parasailing at Clifton / French Beach',
      category: 'Ocean Water Sports',
      price: 11000,
      desc: 'Adrenaline ocean water sports pass including jet ski runs and parasailing flight with certified rescue life guards.',
    },
    {
      id: 'khi_burns_road',
      name: '🍢 Burns Road & Port Grand Heritage Street Food Trail',
      category: 'Karachi Street Food',
      price: 8000,
      desc: 'Historic culinary trail: Waheed Nihari, Fry Kabab, Matka Biryani, Bun Kabab and original Rabri Falooda.',
    },
    {
      id: 'khi_drone_pkg',
      name: '📸 Coastal Sunset & Ocean Wave 4K Drone Cinematography',
      category: 'Coastal Drone Video',
      price: 14000,
      desc: '4K aerial drone shoot capturing coastal cliffs, crashing ocean surf, and golden hour Arabian Sea sunset.',
    },
  ],

  gwadar: [
    {
      id: 'gwd_kund_malir_camp',
      name: '🏖️ Kund Malir Golden Sands Beach Camping & Bonfire',
      category: 'Makran Beach Camping',
      price: 15000,
      desc: 'Overnight luxury tent camping along Makran Coastal Highway with stargazing, fresh fish barbecue, and beach campfire.',
    },
    {
      id: 'gwd_astola_island',
      name: '🐬 Astola Island (Haft Talar) Deep-Sea Speedboat Safari',
      category: 'Astola Island Safari',
      price: 20000,
      desc: "Deep-sea speedboat expedition to uninhabited Astola Island with coral reef snorkeling, turquoise lagoons and dolphins.",
    },
    {
      id: 'gwd_hingol_safari',
      name: '🚙 Princess of Hope & Hingol Mud Volcano 4x4 Safari',
      category: 'Hingol National Park',
      price: 14000,
      desc: 'Off-road 4x4 expedition through surreal natural rock formations, Hingol canyon gorge, and active Chandragup mud volcanoes.',
    },
    {
      id: 'gwd_lobster_feast',
      name: '🦞 Fresh Arabian Sea Grilled Lobster & Jumbo Prawn Feast',
      category: 'Makran Seafood Feast',
      price: 13000,
      desc: 'Catch-of-the-day grilled lobster, jumbo tiger prawns and authentic Balochi sajji prepared right by the coastline.',
    },
    {
      id: 'gwd_hammerhead_tour',
      name: '🛥️ Gwadar Hammerhead Peak Sunset & Deep Sea Boat Tour',
      category: 'Gwadar Port Boat Tour',
      price: 11000,
      desc: 'Panoramic viewpoint overlooking the hammerhead peninsula followed by a scenic deep sea cruise with local fishermen.',
    },
  ],

  multan: [
    {
      id: 'mlt_derawar_safari',
      name: '🏰 Derawar Fort & Cholistan Desert 4x4 Dune Safari',
      category: 'Cholistan Desert Safari',
      price: 16000,
      desc: 'Expedition across Cholistan dunes to the 40 colossal bastions of Derawar Fort with sunset desert camel riding.',
    },
    {
      id: 'mlt_rohi_music',
      name: '⛺ Cholistan Desert Campfire & Rohi Folk Music Night',
      category: 'Desert Sufi Campfire',
      price: 14000,
      desc: 'Overnight desert camp under sparkling stars with live Khwaja Ghulam Farid mystic Sufi singing and acoustic dholak.',
    },
    {
      id: 'mlt_kashigari_trail',
      name: '🕌 Multan Sufi Shrines & Kashigari Blue Pottery Trail',
      category: 'Blue Pottery & Shrines',
      price: 7000,
      desc: 'Guided tour of Shah Rukn-e-Alam, Bahauddin Zakariya shrines & hands-on pottery shaping at an artisan workshop.',
    },
    {
      id: 'mlt_sohan_halwa_feast',
      name: '🥩 Authentic Multani Chaanp, Sohan Halwa & Mango Feast',
      category: 'Multani Royal Feast',
      price: 9000,
      desc: 'Royal Punjabi feast: succulent mutton chaanp, traditional tandoori flatbreads, and original Hafiz Sohan Halwa.',
    },
    {
      id: 'mlt_noor_mahal',
      name: '🏰 Noor Mahal & Darbar Mahal Royal Palaces VIP Tour',
      category: 'Bahawalpur Palaces',
      price: 8000,
      desc: 'Nawab of Bahawalpur royal Italianate palace interior tour, evening light show and royal gardens photography.',
    },
  ],

  kumrat: [
    {
      id: 'kmr_deodar_trek',
      name: '🌲 Kumrat Deodar Jungle Trek & Waterfall Safari',
      category: 'Deodar Forest Trek',
      price: 9000,
      desc: 'Guided nature hike through towering thousand-year-old virgin cedar deodar forest to cascading forest waterfalls.',
    },
    {
      id: 'kmr_katora_jeep',
      name: '🚙 Do Kala Chashma & Katora Lake Base 4x4 Jeep Safari',
      category: 'Katora Lake Base Jeep',
      price: 14000,
      desc: 'Rugged mountain 4x4 jeep trek to roaring glacier streams, wooden log bridges, and pristine alpine mountain springs.',
    },
    {
      id: 'kmr_panjkora_camp',
      name: '⛺ Panjkora Riverside Swiss Tent Camp & Bonfire',
      category: 'Panjkora River Camp',
      price: 15000,
      desc: 'Overnight luxury tent camp right beside the roaring Panjkora river with hot local river trout barbecue and campfire.',
    },
    {
      id: 'kmr_folk_rubab',
      name: '🪕 Traditional Kohistani / Pashto Folk Rubab Night',
      category: 'Folk Rubab Campfire',
      price: 8000,
      desc: 'Fireside acoustic folk music session with mountain elders, Pashto rubab melodies, and spiced herbal mountain green tea.',
    },
  ],

  chitral: [
    {
      id: 'cht_kalash_fest',
      name: '🎭 Kalash Tribal Village Cultural Immersion & Dance',
      category: 'Kalash Tribe Immersion',
      price: 10000,
      desc: 'Authentic Kalasha cultural ceremony, handmade beaded dresses, traditional folk singing and valley walking tour.',
    },
    {
      id: 'cht_royal_fort',
      name: '🏰 Chitral Royal Fort & Shahi Mosque Guided Walk',
      category: 'Chitral Royal Heritage',
      price: 7000,
      desc: 'Historic royal seat of the Mehtar of Chitral along the Kunar river banks with mountain museum artifacts.',
    },
    {
      id: 'cht_shandur_safari',
      name: '🏇 Shandur (World Highest Polo Ground) Day Safari',
      category: 'Shandur Polo Safari',
      price: 16000,
      desc: "High-altitude mountain pass journey to the 12,200 ft plateau where the world's most thrilling freestyle polo is played.",
    },
    {
      id: 'cht_trout_dinner',
      name: '🍲 Traditional Chitrali Baqalam & River Trout Feast',
      category: 'Chitrali Feast',
      price: 8000,
      desc: 'Local walnut bread (Baqalam), mutton broth, and fresh cold-water river trout dinner with dry fruit herbal tea.',
    },
  ],

  murree: [
    {
      id: 'mrr_chairlift',
      name: '🚡 Patriata (New Murree) Dual Chairlift & Cable Car Pass',
      category: 'Patriata Cable Car',
      price: 7000,
      desc: 'Famous 7km panoramic dual chairlift and gondola cable car flight high above misty pine forests and rolling hills.',
    },
    {
      id: 'mrr_pipeline',
      name: '🌲 Ayubia National Park Pipeline Track Nature Walk',
      category: 'Pipeline Nature Trail',
      price: 6000,
      desc: 'Guided historic pine forest nature walk with monkey spotting, pine canopy views and bird watching.',
    },
    {
      id: 'mrr_miranjani',
      name: '⛰️ Miranjani Peak Hilltop Guided Hiking Trek',
      category: 'Miranjani Peak Trek',
      price: 8000,
      desc: 'Guided ascent to the highest 9,776 ft peak in Abbottabad/Galyat with snow peak panoramas and alpine air.',
    },
    {
      id: 'mrr_pine_bonfire',
      name: '🪵 Pine Forest Campfire, Hot BBQ & Corn Night',
      category: 'Galyat Pine Campfire',
      price: 10000,
      desc: 'Evening campfire in cedar woods with roasted sweet corn, charcoal chicken tikka and spiced Kashmiri tea.',
    },
    {
      id: 'mrr_horse_ride',
      name: '🐴 Mall Road Horse Riding & Evening Heritage Stroll',
      category: 'Mall Road Horse Ride',
      price: 5000,
      desc: 'Traditional mountain horse ride along Kashmir Point and colonial Mall Road bazaar with scenic sunset photography.',
    },
  ],

  'fairy meadows': [
    {
      id: 'fm_tattu_jeep',
      name: '🚙 Tattu Village 4x4 Cliff Jeep Thrill Safari',
      category: 'Tattu Cliff Jeep',
      price: 15000,
      desc: 'World-famous thrill jeep ride carved into narrow mountain cliffs to the trailhead of Fairy Meadows.',
    },
    {
      id: 'fm_base_camp_trek',
      name: '🐴 Nanga Parbat Base Camp & Beyal Camp Guided Trek',
      category: 'Nanga Parbat Trek',
      price: 14000,
      desc: 'Guided alpine trek to the face of the Killer Mountain (8,126m) with massive Raikot glacier moraine views.',
    },
    {
      id: 'fm_lake_camp',
      name: '⛺ Fairy Meadows Reflection Lake Camping & Bonfire',
      category: 'Fairy Meadows Camp',
      price: 16000,
      desc: 'Overnight luxury wooden cottage / tent camp beside the crystal reflection pond with roaring birch wood campfire.',
    },
    {
      id: 'fm_stargazing',
      name: '🌌 Nanga Parbat Milky Way Stargazing & Night Shoot',
      category: 'Milky Way Stargazing',
      price: 12000,
      desc: 'Astrophotography session capturing the Milky Way arching directly over the snow-covered face of Nanga Parbat.',
    },
  ],

  neelum: [
    {
      id: 'nlm_ratti_gali',
      name: '🚙 Ratti Gali & Chitta Katha Glacial Lake 4x4 Safari',
      category: 'Ratti Gali Lake Jeep',
      price: 16000,
      desc: 'High mountain 4x4 jeep trek to the turquoise glacial jewel of Azad Kashmir nestled at 12,130 ft altitude.',
    },
    {
      id: 'nlm_waterfall_boat',
      name: '🚣 Kutton & Dhani Waterfalls Rafting & Boating Pass',
      category: 'Neelum River Boating',
      price: 8000,
      desc: 'Scenic wooden rafting and boat ride along Neelum river with stop at cascading crystal mountain waterfalls.',
    },
    {
      id: 'nlm_wazwan_fire',
      name: '🪵 Riverside Neelum Pine Bonfire & Kashmiri Wazwan',
      category: 'Kashmiri Wazwan Feast',
      price: 12000,
      desc: 'Evening campfire beside Neelum river with authentic Kashmiri Wazwan: Roghan Josh, Rista, Gushtaba & Kashmiri tea.',
    },
    {
      id: 'nlm_pir_chinasi',
      name: '🏰 Pir Chinasi 9,500 ft Summit & Red Fort Muzaffarabad Tour',
      category: 'Pir Chinasi Excursion',
      price: 9000,
      desc: 'Scenic mountain drive up to Pir Chinasi paragliding ridge and guided walk through 16th-century Red Fort.',
    },
  ],

  quetta: [
    {
      id: 'qta_juniper_trek',
      name: '🌲 Ancient Ziarat Juniper Forest Guided Nature Trek',
      category: 'Ancient Juniper Trek',
      price: 9000,
      desc: "Guided walk through the world's 2nd largest ancient juniper forest with trees over 5,000 years old.",
    },
    {
      id: 'qta_residency_tour',
      name: '🏛️ Quaid-e-Azam Residency & Ziarat Heritage VIP Tour',
      category: 'Quaid Residency Tour',
      price: 6000,
      desc: 'Historic wooden Victorian architecture retreat where the founder of Pakistan spent his last peaceful days.',
    },
    {
      id: 'qta_balochi_rosh',
      name: '🍖 Authentic Balochi Rosh & Dumpukht Feast',
      category: 'Balochi Rosh Feast',
      price: 11000,
      desc: 'Traditional slow-cooked Balochi mutton Rosh, Kandahari Naan, fresh pomegranates, and green tea.',
    },
    {
      id: 'qta_hanna_lake',
      name: '⛰️ Hanna Lake Boating & Urak Valley Fruit Orchard Walk',
      category: 'Hanna Lake Boating',
      price: 7000,
      desc: 'Scenic turquoise lake boating and walking tour through sweet apple, cherry and peach orchards in Urak valley.',
    },
  ],

  peshawar: [
    {
      id: 'psh_namak_mandi',
      name: '🍢 Namak Mandi Shinwari Tikka & Chapli Kabab Feast',
      category: 'Namak Mandi Feast',
      price: 10000,
      desc: 'World-famous frontier meat feast: live mutton karahi, authentic Jalil Chapli Kababs, and hot tandoori roghni naans.',
    },
    {
      id: 'psh_heritage_walk',
      name: '🏰 Bala Hisar Fort, Sethi House & Qissa Khwani Walk',
      category: 'Old Peshawar Heritage',
      price: 8000,
      desc: 'Guided tour of the historic Storytellers Bazaar, intricately carved wood Sethi Havelis, and ancient Gor Khatri ruins.',
    },
    {
      id: 'psh_qahwa_trail',
      name: '☕ Traditional Peshawari Qahwa & Dry Fruit Tea Trail',
      category: 'Peshawari Qahwa Trail',
      price: 4000,
      desc: 'Historic copper samovar green tea tasting with roasted almonds, walnuts, and traditional sweet Peshawari halwa.',
    },
    {
      id: 'psh_karkhano_safari',
      name: '🛍️ Karkhano Silk & Afghan Rugs Guided Shopping Safari',
      category: 'Frontier Bazaars Shopping',
      price: 5000,
      desc: 'Private guided shopping tour of famous frontier silk fabrics, tribal handmade carpets, and brass handicrafts.',
    },
  ],

  taxila: [
    {
      id: 'txl_gandhara_vip',
      name: '🏛️ Taxila UNESCO Gandhara Stupas & Museum VIP Tour',
      category: 'Taxila UNESCO Tour',
      price: 7000,
      desc: 'Guided archaeological tour of 2,500-year-old Buddhist university, Jaulian monastery, and Dharmarajika stupa.',
    },
    {
      id: 'txl_rohtas_fort',
      name: '🏰 Rohtas Fort Colossal Ramparts & Sher Shah Suri Walk',
      category: 'Rohtas Fort Tour',
      price: 8000,
      desc: 'Guided exploration of 16th-century UNESCO military fortress with 12 colossal stone gates and massive ramparts.',
    },
    {
      id: 'txl_katas_khewra',
      name: '🛕 Katas Raj Sacred Temples & Khewra Salt Mine Train Pass',
      category: 'Katas Raj & Khewra',
      price: 8000,
      desc: 'Historic holy Shiva pond temples and electric train tour through the crystal salt chambers of the Khewra Salt Mine.',
    },
  ],
};

function getCityExtraExperiences(destName, categoryName) {
  const normalized = (destName || '').trim().toLowerCase();

  // 1. Direct city key matching
  if (normalized) {
    for (const [key, list] of Object.entries(CITY_EXTRA_EXPERIENCES_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return list;
      }
    }
  }

  // 2. Category-based fallback
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('cultural') || cat.includes('historical')) {
    return [
      {
        id: 'cat_ext_heritage_walk',
        name: '🏰 Historic Fortress & Old Town VIP Guided Walk',
        category: 'Heritage VIP Walk',
        price: 7000,
        desc: 'Private architectural and historical walking tour with certified regional heritage guide.',
      },
      {
        id: 'cat_ext_food_feast',
        name: '🍲 Authentic Traditional Food Street Royal Feast',
        category: 'Food Street Feast',
        price: 11000,
        desc: 'Multi-course evening feast featuring regional barbecue, traditional gravies, and heritage desserts.',
      },
      {
        id: 'cat_ext_qawwali',
        name: '🪕 Evening Sufi Qawwali & Traditional Folk Music Night',
        category: 'Sufi Folk Music',
        price: 9000,
        desc: 'Atmospheric evening acoustic musical session celebrating regional folklore and traditional instruments.',
      },
      {
        id: 'cat_ext_costumes',
        name: '📸 Traditional Royal Costumes & 4K Photo Shoot',
        category: 'Heritage Photography',
        price: 12000,
        desc: 'Professional photography shoot with authentic regional heritage costumes at iconic landmarks.',
      },
      {
        id: 'cat_ext_crafts',
        name: '🛍️ Historic Bazaars & Indigenous Crafts Safari',
        category: 'Artisan Crafts Safari',
        price: 6000,
        desc: 'Guided shopping excursion through traditional bazaars: pottery, textiles, and local handicrafts.',
      },
      {
        id: 'cat_ext_buggy',
        name: '🐴 Royal Decorated Horse Carriage / Buggy Tour',
        category: 'Royal Carriage Tour',
        price: 5000,
        desc: 'Charming horse-drawn carriage ride through historic city avenues and heritage quarters.',
      },
    ];
  }

  if (cat.includes('coastal') || cat.includes('beach')) {
    return [
      {
        id: 'cat_ext_coastal_boat',
        name: '🚤 Private Coastal Speedboat & Marine Cruise',
        category: 'Coastal Speedboat',
        price: 14000,
        desc: 'Private boat cruise along coastal waters with scenic cliff views and sea breeze.',
      },
      {
        id: 'cat_ext_seafood_bbq',
        name: '🦀 Fresh Catch Deep-Sea Barbecue & Seafood Feast',
        category: 'Seafood BBQ Feast',
        price: 13000,
        desc: 'Fresh caught fish, jumbo prawns and grilled coastal seafood feast prepared right by the shore.',
      },
      {
        id: 'cat_ext_beach_hut',
        name: '🏖️ Private Beachfront Cabana Day with Ocean Views',
        category: 'Beachfront Cabana',
        price: 15000,
        desc: 'Furnished seaside beach cabana day with private terrace, shade, swimming and barbecue grill.',
      },
      {
        id: 'cat_ext_watersports',
        name: '🪂 Jet Ski Ocean Thrill & Water Sports Package',
        category: 'Ocean Water Sports',
        price: 10000,
        desc: 'Adrenaline marine water sports with life jacket safety gear and professional guide.',
      },
      {
        id: 'cat_ext_beach_fire',
        name: '🔥 Seaside Beach Bonfire & Acoustic Stargazing Night',
        category: 'Beach Bonfire',
        price: 11000,
        desc: 'Evening roaring campfire on sandy beach under star-lit skies with warm tea and marshmallows.',
      },
      {
        id: 'cat_ext_coast_drone',
        name: '📸 Golden Hour Ocean Sunset 4K Drone Photography',
        category: 'Coastal Drone Package',
        price: 14000,
        desc: 'Cinematic aerial drone shoot capturing coastal cliffs, waves, and sunset over the sea.',
      },
    ];
  }

  if (cat.includes('adventure') || cat.includes('nature')) {
    return [
      {
        id: 'cat_ext_ridge_trek',
        name: '🧗 Guided Scenic Ridge Hiking & Nature Trail',
        category: 'Nature Trail Hike',
        price: 8000,
        desc: 'Scenic nature hike along mountain ridges with certified local trail guide and nature photography.',
      },
      {
        id: 'cat_ext_river_bbq',
        name: '🍖 Riverside Charcoal Live Barbecue Dinner',
        category: 'Riverside BBQ Dinner',
        price: 11000,
        desc: 'Live charcoal BBQ feast (chicken tikka, kebabs & parathas) beside flowing streams under the stars.',
      },
      {
        id: 'cat_ext_campfire',
        name: '🔥 Musical Campfire & Roasted Treats Night',
        category: 'Musical Campfire',
        price: 10000,
        desc: 'Evening acoustic campfire setup with traditional green tea (kahwa) and roasted marshmallows.',
      },
      {
        id: 'cat_ext_wilderness_camp',
        name: '⛺ Scenic Wilderness Swiss Tent Camping Experience',
        category: 'Wilderness Camping',
        price: 14000,
        desc: 'Overnight tent stay with luxury tents, insulated sleeping bags, and sunrise panoramic views.',
      },
      {
        id: 'cat_ext_drone_action',
        name: '📸 Landscape & Action 4K Drone Photography',
        category: '4K Drone Photography',
        price: 14000,
        desc: 'Dedicated professional photographer with 4K drone capturing high-res memories across your stops.',
      },
      {
        id: 'cat_ext_thrill_pass',
        name: '🪂 Multi-Thrill Zipline & Rope Course Adventure Pass',
        category: 'Adventure Pass',
        price: 10000,
        desc: 'Adrenaline pass including zipline run, suspended rope walk, or river crossing thrill.',
      },
    ];
  }

  // Northern Areas & General Mountain Fallback
  return [
    {
      id: 'cat_ext_alpine_trek',
      name: '🌲 Outdoor Nature & Alpine Trail Mountain Trek',
      category: 'Alpine Nature Trek',
      price: 8000,
      desc: 'Guided nature hike along scenic alpine ridges with certified local mountain trail leader.',
    },
    {
      id: 'cat_ext_trout_bbq',
      name: '🐟 Fresh Cold-Water River Trout Catch & Live BBQ',
      category: 'River Trout BBQ',
      price: 11000,
      desc: 'Cold-water river trout fishing permit and live charcoal grilled dinner beside mountain streams.',
    },
    {
      id: 'cat_ext_alpine_bonfire',
      name: '🔥 Mountain Campfire & Traditional Cardamom Kahwa',
      category: 'Alpine Bonfire Night',
      price: 10000,
      desc: 'Evening acoustic campfire setup under mountain stars with warm green tea (kahwa) and marshmallows.',
    },
    {
      id: 'cat_ext_swiss_camp',
      name: '⛺ Alpine Wilderness Swiss Tent Camping Experience',
      category: 'Swiss Tent Camping',
      price: 15000,
      desc: 'Overnight tent stay with luxury Swiss tents, insulated sleeping bags, and sunrise mountain views.',
    },
    {
      id: 'cat_ext_mountain_drone',
      name: '📸 Mountain Peaks & Valley 4K Drone Cinematography',
      category: 'Mountain Drone Video',
      price: 14000,
      desc: 'Dedicated aerial drone photographer capturing your journey and high mountain panoramic vistas in 4K.',
    },
    {
      id: 'cat_ext_adventure_pass',
      name: '🪂 High-Thrill Mountain Adventure Pass',
      category: 'Mountain Adventure Pass',
      price: 10000,
      desc: 'Adrenaline adventure pass including suspension bridge crossing, chairlift or zipline flight.',
    },
    {
      id: 'cat_ext_folk_rubab',
      name: '🪕 Local Cultural Experience & Folk Rubab Night',
      category: 'Local Folk Rubab',
      price: 6000,
      desc: 'Authentic local village visit, traditional rubab music session, and indigenous handicraft tour.',
    },
  ];
}

// Fallback constant for backward compatibility
const EXTRA_EXPERIENCES = getCityExtraExperiences('Lahore', 'Cultural & Historical');

function getPresetDate(type) {
  const now = new Date();
  if (type === 'tomorrow') {
    now.setDate(now.getDate() + 1);
  } else if (type === 'weekend') {
    const day = now.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    now.setDate(now.getDate() + diff);
  } else if (type === 'nextWeek') {
    now.setDate(now.getDate() + 7);
  }
  return now.toISOString().split('T')[0];
}

function computeEndDate(startStr, numDays) {
  try {
    const d = new Date(startStr);
    if (isNaN(d.getTime())) return '';
    const endD = new Date(d.getTime() + Math.max(0, numDays - 1) * 24 * 60 * 60 * 1000);
    return endD.toISOString().split('T')[0];
  } catch (_) {
    return '';
  }
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validateJourneyDates(sDate, eDate, tripDays) {
  const today = getTodayStr();

  if (sDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sDate)) {
      return `Invalid start date format. Please use YYYY-MM-DD (e.g. ${today}).`;
    }
    const [y, m, d] = sDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
      return 'Start date does not exist on calendar (invalid calendar date).';
    }
    if (sDate < today) {
      return `Start date cannot be in the past (${sDate}). Please select today (${today}) or a future date.`;
    }
  }

  if (eDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eDate)) {
      return 'Invalid end date format. Please use YYYY-MM-DD.';
    }
    const [y, m, d] = eDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
      return 'End date does not exist on calendar (invalid calendar date).';
    }
    if (sDate && eDate < sDate) {
      return `End date (${eDate}) cannot be earlier than start date (${sDate}). Please select an end date on or after the start date.`;
    }
  }

  if (tripDays !== undefined && tripDays !== '') {
    const count = parseInt(tripDays, 10);
    if (isNaN(count) || count < 1) {
      return 'Total trip duration must be at least 1 day.';
    }
    if (count > 60) {
      return 'Maximum trip duration is 60 days.';
    }
  }

  return '';
}

export default function TripPlanningScreen({ navigation, route }) {
  const { preselectedDestination, preselectedCategory, initialTripMode, preselectedBudget } = route.params || {};
  const { user, generateTrip } = useApp();

  // 0. Journey Planning Mode (Supervisor handwritten breakdown)
  const [tripMode, setTripMode] = useState(initialTripMode || 'company'); // 'company' (Company Tour or Full Package) | 'customized' (Customize My Trip)
  const [transportRequired, setTransportRequired] = useState(true);
  const [hotelRequired, setHotelRequired] = useState(true);
  const [foodRequired, setFoodRequired] = useState(true);
  const [activitiesRequired, setActivitiesRequired] = useState(true);

  // Sync mode if navigated with explicit mode parameter
  useEffect(() => {
    if (initialTripMode) {
      setTripMode(initialTripMode);
      if (initialTripMode === 'company') {
        setTransportRequired(true);
        setHotelRequired(true);
        setFoodRequired(true);
        setActivitiesRequired(true);
        setFoodChoice('included');
        setTransportChoice('rental');
      }
    }
  }, [initialTripMode]);
  const [roomsQuantity, setRoomsQuantity] = useState(1);
  const [selectedMeals, setSelectedMeals] = useState({ breakfast: true, lunch: false, dinner: true });
  const [transportChoice, setTransportChoice] = useState('rental'); // 'rental' | 'own'
  const [preferredRoute, setPreferredRoute] = useState('Hazara Motorway (M-15) + Karakoram Highway (KKH / N-35)');
  const [customRouteInput, setCustomRouteInput] = useState('');
  const [foodChoice, setFoodChoice] = useState('included'); // 'included' | 'self'
  const [selectedOptionalActivities, setSelectedOptionalActivities] = useState([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState([]);
  const [budgetModal, setBudgetModal] = useState({
    visible: false,
    title: '',
    message: '',
    availableAmount: 0,
    serviceAmount: 0,
    primaryText: '',
    onPrimary: null,
    secondaryText: '',
    onSecondary: null,
  });
  const [bonfireSelected, setBonfireSelected] = useState(false);
  const [foodAdjustmentDismissed, setFoodAdjustmentDismissed] = useState(false);
  const [hotelAdjustmentDismissed, setHotelAdjustmentDismissed] = useState(false);

  // 1. Category & Destination State
  const [category, setCategory] = useState(preselectedCategory || 'Northern Areas');
  const [destination, setDestination] = useState(preselectedDestination || 'Hunza Valley');

  // Compute destination-specific food menu dynamically based on selected city
  const currentFoodMenu = useMemo(() => {
    return getCityFoodMenu(destination);
  }, [destination]);

  // Reset food adjustment dismissal when destination changes so new menus re-evaluate cleanly
  useEffect(() => {
    setFoodAdjustmentDismissed(false);
    setHotelAdjustmentDismissed(false);
  }, [destination]);

  // Compute destination-specific activities dynamically based on selected city
  const currentActivitiesList = useMemo(() => {
    return getActivitiesForDestination(destination, category);
  }, [destination, category]);

  // Compute destination-specific extra experiences ("Make Your Trip More Special!") dynamically based on selected city
  const currentExtraExperiences = useMemo(() => {
    return getCityExtraExperiences(destination, category);
  }, [destination, category]);

  // Reset selected optional activities & extra experiences when destination changes so no mismatched activities remain selected
  useEffect(() => {
    setSelectedOptionalActivities([]);
    setSelectedExtraIds([]);
  }, [destination]);

  // 2. Journey Origin / Departure Point & Live Map
  const [startLocation, setStartLocation] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('stp_user_start_location');
      if (saved) return saved;
    }
    return 'Lahore';
  });
  const [originCoords, setOriginCoords] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('stp_user_origin_coords');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 2) return parsed;
        }
      } catch (_) {}
    }
    return [31.5204, 74.3587];
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [liveLocationStatus, setLiveLocationStatus] = useState('📍 Real-time departure active. Tap map, GPS, or presets to change.');
  const [departureSearchQuery, setDepartureSearchQuery] = useState('');
  const [isCustomOrigin, setIsCustomOrigin] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [originCategoryTab, setOriginCategoryTab] = useState(null);

  // Listen to Leaflet Map iframe postMessages (when user drags green pin or taps anywhere on map)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleMapMessage = (event) => {
      if (event.data && event.data.type === 'UPDATE_START_LOCATION') {
        if (event.data.name) {
          setStartLocation(event.data.name);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('stp_user_start_location', event.data.name);
          }
        }
        if (event.data.lat && event.data.lon) {
          const lat = Number(event.data.lat);
          const lon = Number(event.data.lon);
          setOriginCoords([lat, lon]);
          setLiveLocationStatus(`📍 Selected Real Location: ${event.data.name} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('stp_user_origin_coords', JSON.stringify([lat, lon]));
          }
        }
      }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, []);

  // Real-time live place/landmark search across Pakistan (Universities, Offices, Neighborhoods, Homes)
  useEffect(() => {
    const q = departureSearchQuery.trim();
    if (q.length < 2) {
      setLiveSearchResults([]);
      setIsSearchingPlaces(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=pk&addressdetails=1&limit=6`,
          { headers: { 'User-Agent': 'SmartTravelPlannerApp/2.1' } }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((item) => {
            const addr = item.address || {};
            const title =
              addr.amenity ||
              addr.university ||
              addr.school ||
              addr.college ||
              addr.office ||
              addr.building ||
              addr.neighbourhood ||
              addr.suburb ||
              addr.road ||
              item.name ||
              item.display_name.split(',')[0];
            const city = addr.city || addr.town || addr.county || addr.state || '';
            const type = item.type || item.class || 'place';
            let icon = 'location';
            if (type.includes('school') || type.includes('university') || type.includes('college')) icon = 'school';
            else if (type.includes('office') || type.includes('commercial')) icon = 'business';
            else if (type.includes('residential') || type.includes('house') || type.includes('living')) icon = 'home';

            const cleanName = title && city && !title.toLowerCase().includes(city.toLowerCase())
              ? `${title}, ${city}`
              : (title || item.display_name);

            return {
              id: item.place_id || item.osm_id || Math.random().toString(),
              name: cleanName,
              fullAddress: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              icon,
            };
          });
          setLiveSearchResults(mapped);
        }
      } catch (_) {
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [departureSearchQuery]);

  const filteredDepartureCities = useMemo(() => {
    if (!departureSearchQuery.trim()) return [];
    const q = departureSearchQuery.trim().toLowerCase();
    return DEPARTURE_CITIES.filter((city) => city.toLowerCase().includes(q));
  }, [departureSearchQuery]);

  // Destination coordinates based on selected destination
  const destCoords = useMemo(() => {
    return getLocationCoords(destination, [34.7994, 72.5725]);
  }, [destination]);

  // Synchronize actively selected planning destination and origin to localStorage immediately
  useEffect(() => {
    if (destination && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('stp_active_destination', destination);
      if (startLocation) {
        window.localStorage.setItem('stp_user_start_location', startLocation);
      }
      if (originCoords) {
        window.localStorage.setItem('stp_user_origin_coords', JSON.stringify(originCoords));
      }
    }
  }, [destination, startLocation, originCoords]);

  // Handle explicit selection or search of departure city
  const handleSelectDepartureCity = async (city, explicitCoords = null) => {
    setDepartureSearchQuery('');
    setLiveSearchResults([]);
    setStartLocation(city);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('stp_user_start_location', city);
    }
    if (explicitCoords && Array.isArray(explicitCoords)) {
      setOriginCoords(explicitCoords);
      setLiveLocationStatus(`📍 Departure: ${city} (${explicitCoords[0].toFixed(4)}° N, ${explicitCoords[1].toFixed(4)}° E)`);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('stp_user_origin_coords', JSON.stringify(explicitCoords));
      }
      return;
    }
    const coords = getLocationCoords(city, null);
    if (coords) {
      setOriginCoords(coords);
      setLiveLocationStatus(`📍 Departure: ${city} (${coords[0].toFixed(4)}° N, ${coords[1].toFixed(4)}° E)`);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('stp_user_origin_coords', JSON.stringify(coords));
      }
    } else {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&countrycodes=pk&limit=1`
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const foundLat = parseFloat(geoData[0].lat);
          const foundLon = parseFloat(geoData[0].lon);
          setOriginCoords([foundLat, foundLon]);
          setLiveLocationStatus(`📍 Departure: ${city} (${foundLat.toFixed(4)}° N, ${foundLon.toFixed(4)}° E)`);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('stp_user_origin_coords', JSON.stringify([foundLat, foundLon]));
          }
          return;
        }
      } catch (_) {}
      setLiveLocationStatus(`📍 Departure: ${city}`);
    }
  };

  // Helper: Reverse Geocode Exact Coordinates via OpenStreetMap Nominatim
  const applyDetectedLocation = async (lat, lon, fallbackHint = null) => {
    setOriginCoords([lat, lon]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};

      // Find the most specific human-readable area where the user is
      const specificArea =
        addr.neighbourhood ||
        addr.suburb ||
        addr.residential ||
        addr.hamlet ||
        addr.village ||
        addr.town ||
        addr.road ||
        addr.city_district ||
        addr.city;

      const city = addr.city || addr.town || addr.county || addr.state_district || '';
      let detectedName = '';
      if (specificArea && city && !specificArea.toLowerCase().includes(city.toLowerCase())) {
        detectedName = `${specificArea}, ${city}`;
      } else if (specificArea) {
        detectedName = specificArea;
      } else if (city) {
        detectedName = city;
      } else {
        detectedName = fallbackHint || `Current Location (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
      }

      setStartLocation(detectedName);
      setLiveLocationStatus(`📍 Exact Real Location: ${detectedName} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('stp_user_start_location', detectedName);
        window.localStorage.setItem('stp_user_origin_coords', JSON.stringify([lat, lon]));
      }
      setIsDetectingLocation(false);
      setIsCustomOrigin(false);
    } catch (e) {
      const fallbackName = fallbackHint || `Current Location (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
      setStartLocation(fallbackName);
      setLiveLocationStatus(`📍 Exact Real Location: ${fallbackName} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('stp_user_start_location', fallbackName);
        window.localStorage.setItem('stp_user_origin_coords', JSON.stringify([lat, lon]));
      }
      setIsDetectingLocation(false);
      setIsCustomOrigin(false);
    }
  };

  // Live GPS Geolocation Handler with Automatic IP Fallback
  const handleDetectCurrentLocation = () => {
    setIsDetectingLocation(true);
    setLiveLocationStatus('Detecting live GPS coordinates...');

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          applyDetectedLocation(lat, lon);
        },
        async (err) => {
          console.warn('Browser GPS permission error or unavailable, trying IP geolocation:', err.message);
          // Fallback to IP geolocation if GPS is blocked or unavailable
          try {
            const ipRes = await fetch('https://ipwho.is/');
            const ipData = await ipRes.json();
            if (ipData.success && ipData.latitude && ipData.longitude) {
              await applyDetectedLocation(ipData.latitude, ipData.longitude, ipData.city);
              return;
            }
          } catch (_) {}

          try {
            const ipRes2 = await fetch('https://get.geojs.io/v1/ip/geo.json');
            const ipData2 = await ipRes2.json();
            if (ipData2.latitude && ipData2.longitude) {
              await applyDetectedLocation(parseFloat(ipData2.latitude), parseFloat(ipData2.longitude), ipData2.city);
              return;
            }
          } catch (_) {}

          setStartLocation('Current Location');
          setLiveLocationStatus('📍 Location permission required. Search or choose departure city below.');
          setIsDetectingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      (async () => {
        try {
          const ipRes = await fetch('https://ipwho.is/');
          const ipData = await ipRes.json();
          if (ipData.success && ipData.latitude && ipData.longitude) {
            await applyDetectedLocation(ipData.latitude, ipData.longitude, ipData.city);
            return;
          }
        } catch (_) {}

        setStartLocation('Current Location');
        setLiveLocationStatus('📍 Please search or choose departure city below.');
        setIsDetectingLocation(false);
      })();
    }
  };

  // Auto-detect live GPS location on component mount only if no prior location is saved
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('stp_user_start_location');
      if (saved) {
        setLiveLocationStatus(`📍 Saved Starting Location: ${saved}`);
        return;
      }
    }
    handleDetectCurrentLocation();
  }, []);

  // Dynamic Accurate Highway Routes based on Origin and Destination
  const dynamicRoutes = useMemo(() => {
    return getAccurateRoutesForJourney(startLocation, destination, category);
  }, [startLocation, destination, category]);

  useEffect(() => {
    if (dynamicRoutes && dynamicRoutes.length > 0) {
      if (!preferredRoute || !dynamicRoutes.includes(preferredRoute)) {
        setPreferredRoute(dynamicRoutes[0]);
      }
    }
  }, [dynamicRoutes, preferredRoute]);

  // 3. Journey Dates & Duration (all fields clear initially for manual user entry)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState('');
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarPickerMode, setCalendarPickerMode] = useState('start'); // 'start' | 'end'
  const [dateError, setDateError] = useState('');

  // 4. Tour Group Size & Budget (all fields clear initially for manual user entry)
  const [numberOfPersons, setNumberOfPersons] = useState('');
  const [malesInput, setMalesInput] = useState('');
  const [femalesInput, setFemalesInput] = useState('');
  const [budgetPerPerson, setBudgetPerPerson] = useState('');
  const [budget, setBudget] = useState(preselectedBudget ? String(preselectedBudget) : '');
  const [travelerGender, setTravelerGender] = useState('mixed'); // 'male' | 'female' | 'mixed'
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [vehicleType, setVehicleType] = useState('Economy-Alto');
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const driverRequired = false; // Licensed mountain driver option removed

  // Travel Style
  const [travelType, setTravelType] = useState('Family');
  const [selectedInterests, setSelectedInterests] = useState(['Nature', 'Sightseeing', 'Food']);
  const [transportation, setTransportation] = useState('Private Car');
  const [comfortLevel, setComfortLevel] = useState('Normal');

  // In-App Hotel State
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hotelUnavailableNotice, setHotelUnavailableNotice] = useState(null);
  const [alternativeHotels, setAlternativeHotels] = useState([]);

  // Submitting
  const [generating, setGenerating] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Synchronization & Calendar helpers
  function openCalendarPicker(mode) {
    setCalendarPickerMode(mode);
    setCalendarModalVisible(true);
  }

  function handleCalendarSelect(selectedDateStr) {
    if (calendarPickerMode === 'start') {
      handleStartDateSelect(selectedDateStr);
    } else {
      handleEndDateSelect(selectedDateStr);
    }
  }

  function handleStartDateSelect(newStart) {
    setStartDate(newStart);
    let nextEndDate = endDate;
    let nextDays = days;

    if (endDate) {
      if (endDate < newStart) {
        const dCount = parseInt(days, 10) || 3;
        nextEndDate = computeEndDate(newStart, dCount);
        setEndDate(nextEndDate);
      } else {
        try {
          const s = new Date(newStart);
          const e = new Date(endDate);
          const diffDays = Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
          if (diffDays >= 1) {
            nextDays = String(diffDays);
            setDays(nextDays);
          }
        } catch (_) {}
      }
    } else if (days) {
      const dCount = parseInt(days, 10);
      if (dCount > 0) {
        nextEndDate = computeEndDate(newStart, dCount);
        setEndDate(nextEndDate);
      }
    }

    const err = validateJourneyDates(newStart, nextEndDate, nextDays);
    setDateError(err);
  }

  function handleEndDateSelect(newEnd) {
    setEndDate(newEnd);
    let nextDays = days;

    if (startDate) {
      if (newEnd < startDate) {
        const err = `End date (${newEnd}) cannot be earlier than start date (${startDate}).`;
        setDateError(err);
        return;
      }
      try {
        const s = new Date(startDate);
        const e = new Date(newEnd);
        const diffDays = Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
        if (diffDays >= 1) {
          nextDays = String(diffDays);
          setDays(nextDays);
        }
      } catch (_) {}
    }

    const err = validateJourneyDates(startDate, newEnd, nextDays);
    setDateError(err);
  }

  function handleStartDateChange(text) {
    setStartDate(text);
    if (text.length >= 10) {
      handleStartDateSelect(text);
    } else {
      const err = text.length > 0 ? validateJourneyDates(text, endDate, days) : '';
      setDateError(err);
    }
  }

  function handleEndDateChange(text) {
    setEndDate(text);
    if (text.length >= 10) {
      handleEndDateSelect(text);
    } else {
      const err = text.length > 0 ? validateJourneyDates(startDate, text, days) : '';
      setDateError(err);
    }
  }

  function handleDaysChange(text) {
    const clean = String(text ?? '').replace(/[^0-9]/g, '');
    setDays(clean);
    const num = parseInt(clean, 10);
    let nextEnd = endDate;
    if (!isNaN(num) && num > 0 && startDate) {
      nextEnd = computeEndDate(startDate, num);
      setEndDate(nextEnd);
    }
    const err = validateJourneyDates(startDate, nextEnd, clean);
    setDateError(err);
  }

  function getRecommendedRooms(personsCount, ppBudget, totBudget) {
    const p = Math.max(1, Number(personsCount) || 1);
    const pp = Number(ppBudget) || (p > 0 ? Number(totBudget) / p : 0) || 0;
    // For low / tight budget (<= 12,000 PKR per person), allocate Family Quad Room (up to 4 per room)
    if (pp > 0 && pp <= 12000) {
      return Math.max(1, Math.ceil(p / 4));
    }
    return Math.max(1, Math.ceil(p / 2));
  }

  function handleMalesChange(text) {
    const clean = String(text ?? '').replace(/[^0-9]/g, '');
    setMalesInput(clean);
    const m = parseInt(clean, 10) || 0;
    const f = parseInt(femalesInput, 10) || 0;
    const total = m + f;
    setMaleCount(m);
    setFemaleCount(f);
    setNumberOfPersons(total > 0 ? String(total) : '');

    if (m > 0 && f === 0) setTravelerGender('male');
    else if (f > 0 && m === 0) setTravelerGender('female');
    else setTravelerGender('mixed');

    if (total > 0) {
      if (travelType === 'Family') {
        const tot = Number(budget) || 0;
        const pp = tot > 0 ? Math.round(tot / total) : (Number(budgetPerPerson) || 0);
        if (tot > 0) setBudgetPerPerson(String(pp));
        setRoomsQuantity(getRecommendedRooms(total, pp, tot));
      } else {
        const perPerson = Number(budgetPerPerson) || 0;
        setRoomsQuantity(getRecommendedRooms(total, perPerson, total * perPerson));
        if (perPerson > 0) {
          setBudget(String(total * perPerson));
        }
      }
    } else {
      if (travelType !== 'Family') setBudget('');
    }
  }

  function handleFemalesChange(text) {
    const clean = String(text ?? '').replace(/[^0-9]/g, '');
    setFemalesInput(clean);
    const f = parseInt(clean, 10) || 0;
    const m = parseInt(malesInput, 10) || 0;
    const total = m + f;
    setMaleCount(m);
    setFemaleCount(f);
    setNumberOfPersons(total > 0 ? String(total) : '');

    if (m > 0 && f === 0) setTravelerGender('male');
    else if (f > 0 && m === 0) setTravelerGender('female');
    else setTravelerGender('mixed');

    if (total > 0) {
      if (travelType === 'Family') {
        const tot = Number(budget) || 0;
        const pp = tot > 0 ? Math.round(tot / total) : (Number(budgetPerPerson) || 0);
        if (tot > 0) setBudgetPerPerson(String(pp));
        setRoomsQuantity(getRecommendedRooms(total, pp, tot));
      } else {
        const perPerson = Number(budgetPerPerson) || 0;
        setRoomsQuantity(getRecommendedRooms(total, perPerson, total * perPerson));
        if (perPerson > 0) {
          setBudget(String(total * perPerson));
        }
      }
    } else {
      if (travelType !== 'Family') setBudget('');
    }
  }

  function handlePersonsChange(text) {
    const clean = String(text ?? '').replace(/[^0-9]/g, '');
    setNumberOfPersons(clean);
    const count = parseInt(clean, 10);
    if (!isNaN(count) && count > 0) {
      if (travelType === 'Family') {
        const tot = Number(budget) || 0;
        const pp = tot > 0 ? Math.round(tot / count) : (Number(budgetPerPerson) || 0);
        if (tot > 0) setBudgetPerPerson(String(pp));
        setRoomsQuantity(getRecommendedRooms(count, pp, tot));
      } else {
        const perPerson = Number(budgetPerPerson) || 0;
        setRoomsQuantity(getRecommendedRooms(count, perPerson, count * perPerson));
        if (perPerson > 0) {
          setBudget(String(count * perPerson));
        }
      }
      const m = parseInt(malesInput, 10) || 0;
      const f = parseInt(femalesInput, 10) || 0;
      if (m + f !== count) {
        const half = Math.ceil(count / 2);
        setMalesInput(String(half));
        setFemalesInput(String(Math.max(0, count - half)));
        setMaleCount(half);
        setFemaleCount(Math.max(0, count - half));
      }
    } else {
      if (travelType !== 'Family') setBudget('');
      setMalesInput('');
      setFemalesInput('');
      setMaleCount(0);
      setFemaleCount(0);
    }
  }

  function handleBudgetPerPersonChange(text) {
    const clean = String(text ?? '').replace(/[^0-9]/g, '');
    setBudgetPerPerson(clean);
    const perPerson = Number(clean) || 0;
    const m = parseInt(malesInput, 10) || 0;
    const f = parseInt(femalesInput, 10) || 0;
    const count = parseInt(numberOfPersons, 10) || (m + f) || 1;
    if (perPerson > 0) {
      setBudget(String(perPerson * count));
      setRoomsQuantity(getRecommendedRooms(count, perPerson, perPerson * count));
    } else {
      setBudget('');
    }
  }

  function handleTotalBudgetChange(text) {
    const clean = String(text ?? '').replace(/[^0-9]/g, '');
    setBudget(clean);
    const total = Number(clean) || 0;
    const m = parseInt(malesInput, 10) || 0;
    const f = parseInt(femalesInput, 10) || 0;
    const count = parseInt(numberOfPersons, 10) || (m + f) || 1;
    if (total > 0 && count > 0) {
      const pp = Math.round(total / count);
      setBudgetPerPerson(String(pp));
      setRoomsQuantity(getRecommendedRooms(count, pp, total));
    } else {
      setBudgetPerPerson('');
    }
  }

  function handleTravelTypeSelect(newType) {
    setTravelType(newType);
    if (newType === 'Solo') {
      setNumberOfPersons('1');
      setVehicleType('Bike-YBR125G'); // Default to popular adventure touring bike for solo travel
      const gender = travelerGender === 'female' ? 'female' : 'male';
      setTravelerGender(gender);
      if (gender === 'male') {
        setMalesInput('1');
        setFemalesInput('0');
        setMaleCount(1);
        setFemaleCount(0);
      } else {
        setMalesInput('0');
        setFemalesInput('1');
        setMaleCount(0);
        setFemaleCount(1);
      }
      if (budget) {
        setBudgetPerPerson(budget);
        setRoomsQuantity(getRecommendedRooms(1, Number(budget), Number(budget)));
      } else if (budgetPerPerson) {
        setBudget(budgetPerPerson);
        setRoomsQuantity(getRecommendedRooms(1, Number(budgetPerPerson), Number(budgetPerPerson)));
      }
    } else {
      // If switching to Family or Group and current vehicle is a bike, auto-switch to a passenger car
      if (vehicleType.startsWith('Bike-')) {
        setVehicleType('Economy-Alto');
      }
      const m = parseInt(malesInput, 10) || 0;
      const f = parseInt(femalesInput, 10) || 0;
      const total = m + f;
      if (total > 0) {
        setNumberOfPersons(String(total));
        const pp = Number(budgetPerPerson) || 0;
        if (pp > 0) {
          setBudget(String(total * pp));
        }
      }
    }
  }

  function handleSoloGenderSelect(gender) {
    setTravelerGender(gender);
    setNumberOfPersons('1');
    if (gender === 'male') {
      setMalesInput('1');
      setFemalesInput('0');
      setMaleCount(1);
      setFemaleCount(0);
    } else {
      setMalesInput('0');
      setFemalesInput('1');
      setMaleCount(0);
      setFemaleCount(1);
    }
  }

  function handleSoloBudgetChange(text) {
    const clean = String(text ?? '').replace(/[^0-9]/g, '');
    setBudget(clean);
    setBudgetPerPerson(clean);
    const total = Number(clean) || 0;
    if (total > 0) {
      setRoomsQuantity(getRecommendedRooms(1, total, total));
    }
  }

  // Sync category when preselectedDestination changes
  useEffect(() => {
    if (preselectedCategory) {
      setCategory(preselectedCategory);
    }
  }, [preselectedCategory]);

  useEffect(() => {
    if (preselectedDestination) {
      setDestination(preselectedDestination);
    }
  }, [preselectedDestination]);

  // Group size & duration safe numbers
  const numDays = Math.max(0, parseInt(days, 10) || 0);
  const numPersons = Math.max(0, parseInt(numberOfPersons, 10) || 0);
  const numBudget = Number(budget) || 0;
  const numBudgetPerPerson = Number(budgetPerPerson) || 0;
  const nights = Math.max(0, numDays > 1 ? numDays - 1 : (numDays === 1 ? 1 : 0));

  // Supervisor Rule: If budget is low, system manages hotel stay & transport while customer handles food on their own
  const isLowBudget = useMemo(() => {
    if (numBudget <= 0 || numDays <= 0 || numPersons <= 0) return false;
    return numBudget < (numPersons * numDays * 3500);
  }, [numBudget, numDays, numPersons]);

  // Allocation formula: If company mode, 10% company profit is deducted from budget
  const companyProfit = (tripMode === 'company') ? Math.round(numBudget * 0.10) : 0;
  const safetyMargin = (tripMode === 'company') ? Math.round(numBudget * 0.05) : 0;
  const allocTransport = isLowBudget
    ? ((tripMode === 'company') ? Math.round(numBudget * 0.43) : Math.round(numBudget * 0.46))
    : ((tripMode === 'company') ? Math.round(numBudget * 0.30) : Math.round(numBudget * 0.35));
  const allocHotel = isLowBudget
    ? ((tripMode === 'company') ? Math.round(numBudget * 0.43) : Math.round(numBudget * 0.50))
    : Math.round(numBudget * 0.35);
  const allocFood = isLowBudget ? 0 : Math.round(numBudget * 0.15);
  const allocActivities = isLowBudget
    ? 0
    : ((tripMode === 'company') ? Math.round(numBudget * 0.05) : Math.round(numBudget * 0.10));
  const allocSafety = Math.round(numBudget * ((tripMode === 'company') ? 0.05 : 0.04));
  // Daily budget per room per night (hotel allocation divided by total room-nights)
  const dailyHotelBudget = (nights > 0 && roomsQuantity > 0) ? Math.round(allocHotel / (nights * roomsQuantity)) : allocHotel;

  // Fetch destination-specific hotels when destination, budget, or days change
  useEffect(() => {
    if (!destination.trim() || !hotelRequired) return;
    let active = true;

    async function loadHotels() {
      setHotelsLoading(true);
      setHotelUnavailableNotice(null);
      try {
        const res = await apiRequest(
          `/hotels?city=${encodeURIComponent(destination.trim())}&budget=${numBudget}&days=${numDays || 1}&comfortLevel=${comfortLevel}&dailyHotelBudget=${dailyHotelBudget}&roomsQuantity=${roomsQuantity}&numberOfPersons=${numPersons}`
        );
        if (active) {
          const list = res.hotels || [];
          setHotels(list);
          if (list.length > 0) {
            // Auto-select first hotel that is within budget
            const withinBudgetChoice = list.find((h) => h.withinBudget) || list[0];
            setSelectedHotel(withinBudgetChoice);
            setSelectedRoom(withinBudgetChoice.defaultRoom || withinBudgetChoice.rooms?.[0] || null);
          } else {
            setSelectedHotel(null);
            setSelectedRoom(null);
          }
        }
      } catch (_) {
        if (active) setHotels([]);
      } finally {
        if (active) setHotelsLoading(false);
      }
    }

    loadHotels();
    return () => { active = false; };
  }, [destination, numBudget, numDays, comfortLevel, hotelRequired, dailyHotelBudget, roomsQuantity, numPersons]);

  // Clear hotel state when user selects NO hotel
  useEffect(() => {
    if (!hotelRequired) {
      setHotels([]);
      setSelectedHotel(null);
      setSelectedRoom(null);
    }
  }, [hotelRequired]);

  // Dynamic budget-based hotel tiering and badges:
  // "agar budget low ha to kam price waly vehicle and hotels agar budget high ha to zyada price waly hotels ans vehicles show ho"
  const sortedHotels = useMemo(() => {
    if (!hotels || hotels.length === 0) return [];
    const pp = Number(budgetPerPerson) || (numPersons > 0 ? numBudget / numPersons : numBudget) || 0;
    const tripDays = Math.max(1, parseInt(numDays, 10) || 1);
    const dailyPP = (numPersons > 0 && tripDays > 0 && numBudget > 0) ? Math.round(numBudget / (numPersons * tripDays)) : 0;
    const isHigh = dailyPP >= 12000 || pp >= 60000 || numBudget >= 180000 || comfortLevel === 'Luxury';
    const isLow = !isHigh && (dailyPP <= 5500 || pp <= 25000 || comfortLevel === 'Basic' || (numBudget > 0 && numBudget <= 45000));

    const copy = hotels.map((h) => {
      const price = Number(h.pricePerNight) || 0;
      let budgetBadge = '⭐ Standard Pick';
      let badgeType = 'standard';
      if (isHigh) {
        if (h.comfortLevel === 'Luxury' || price >= 14000) {
          budgetBadge = '👑 Luxury Pick · Recommended';
          badgeType = 'luxury';
        } else {
          budgetBadge = '💰 Economy Option';
          badgeType = 'economy';
        }
      } else if (isLow) {
        if (h.comfortLevel === 'Basic' || price <= 6000) {
          budgetBadge = '💰 Budget Pick · Recommended';
          badgeType = 'budget';
        } else {
          budgetBadge = '⭐ Premium Upgrade';
          badgeType = 'luxury';
        }
      } else {
        if (h.comfortLevel === 'Luxury') {
          budgetBadge = '👑 Luxury Pick';
          badgeType = 'luxury';
        } else if (h.comfortLevel === 'Basic' || price <= 5000) {
          budgetBadge = '💰 Budget Pick';
          badgeType = 'economy';
        } else {
          budgetBadge = '⭐ Recommended for Budget';
          badgeType = 'standard';
        }
      }
      return { ...h, budgetBadge, badgeType };
    });

    copy.sort((a, b) => {
      if (isHigh) {
        // High budget: luxury and higher price hotels first
        if (a.comfortLevel === 'Luxury' && b.comfortLevel !== 'Luxury') return -1;
        if (b.comfortLevel === 'Luxury' && a.comfortLevel !== 'Luxury') return 1;
        return (Number(b.pricePerNight) || 0) - (Number(a.pricePerNight) || 0);
      } else if (isLow) {
        // Low budget: economical and lower price hotels first
        if (a.comfortLevel === 'Basic' && b.comfortLevel === 'Luxury') return -1;
        if (b.comfortLevel === 'Basic' && a.comfortLevel === 'Luxury') return 1;
        return (Number(a.pricePerNight) || 0) - (Number(b.pricePerNight) || 0);
      } else {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
    });

    return copy;
  }, [hotels, budgetPerPerson, numBudget, numPersons, numDays, comfortLevel]);

  // Handle vehicle selection with budget check
  function handleSelectVehicle(veh) {
    if (!veh) return;
    const cost = veh.rentPerDay * (numDays || 1);
    if (cost > numBudget && numBudget > 0) {
      setBudgetModal({
        visible: true,
        title: 'Vehicle Budget Exceeded',
        message: `Your total trip budget is PKR ${numBudget.toLocaleString()}, but ${veh.name} costs PKR ${cost.toLocaleString()} for ${numDays} days. Please choose an economical vehicle, travel in your personal car, or increase your budget.`,
        availableAmount: numBudget,
        serviceAmount: cost,
        primaryText: 'Use Own Car (PKR 0)',
        onPrimary: () => {
          setTransportChoice('own');
          setVehicleDropdownOpen(false);
        },
        secondaryText: 'Select Budget Car',
        onSecondary: () => {
          const cheapest = [...matchingVehicles].sort((a, b) => a.rentPerDay - b.rentPerDay)[0];
          if (cheapest) setVehicleType(cheapest.id);
          setVehicleDropdownOpen(false);
        },
      });
      return;
    }
    setVehicleType(veh.id);
    setVehicleDropdownOpen(false);
  }

  // Handle hotel selection & availability check
  async function handleSelectHotel(hotel) {
    setHotelUnavailableNotice(null);
    setAlternativeHotels([]);

    const room = hotel.rooms?.[0] || hotel.defaultRoom;
    const pricePerNight = Number(room?.price || room?.pricePerNight || hotel.pricePerNight || 3200);
    const roomCap = Number(room?.capacity || 2);
    const reqRooms = Math.ceil(numPersons / roomCap);
    const effRooms = Math.max(1, roomsQuantity ? Number(roomsQuantity) : reqRooms);
    const cost = pricePerNight * nights * effRooms;

    if (cost > remainingAfterTransport && numBudget > 0) {
      setBudgetModal({
        visible: true,
        title: 'Hotel Budget Notice',
        message: `Your remaining budget after transport is PKR ${remainingAfterTransport.toLocaleString()}, but ${hotel.name} costs PKR ${cost.toLocaleString()} (${effRooms} room(s) × ${nights} night(s)). Please choose a cheaper hotel, skip hotel stay, or increase your budget.`,
        availableAmount: remainingAfterTransport,
        serviceAmount: cost,
        primaryText: 'Skip Hotel Stay (Save PKR ' + cost.toLocaleString() + ')',
        onPrimary: () => {
          setHotelRequired(false);
          setSelectedHotel(null);
        },
        secondaryText: 'Select Cheaper Hotel',
        onSecondary: () => {
          const cheapest = [...hotels].sort((a, b) => (Number(a.pricePerNight) || 0) - (Number(b.pricePerNight) || 0))[0];
          if (cheapest && cheapest.id !== hotel.id) {
            handleSelectHotel(cheapest);
          }
        },
      });
      return;
    }

    try {
      const res = await apiRequest('/hotels/check-availability', {
        method: 'POST',
        body: {
          hotelId: hotel.id,
          roomId: room?.id,
          days: numDays || 1,
          roomsQuantity: effRooms,
          budget: numBudget,
        },
      });

      if (!res.available) {
        setHotelUnavailableNotice(res.message || 'Sorry, this hotel is currently unavailable.');
        setAlternativeHotels(res.alternativeHotels || []);
        return;
      }

      setSelectedHotel(hotel);
      setSelectedRoom(room || null);
    } catch (_) {
      setSelectedHotel(hotel);
      setSelectedRoom(hotel.rooms?.[0] || hotel.defaultRoom || null);
    }
  }

  // Handle meal toggling with budget check
  function handleToggleMeal(mealKey) {
    const nextMeals = { ...selectedMeals, [mealKey]: !selectedMeals[mealKey] };
    let nextDaily = 0;
    if (nextMeals.breakfast) nextDaily += breakfastRate;
    if (nextMeals.lunch) nextDaily += lunchRate;
    if (nextMeals.dinner) nextDaily += dinnerRate;
    const nextFoodCost = nextDaily * numPersons * (numDays || 1);

    if (nextMeals[mealKey] && nextFoodCost > remainingAfterHotel && numBudget > 0) {
      setBudgetModal({
        visible: true,
        title: 'Food Budget Notice',
        message: `Your selected food options (PKR ${nextFoodCost.toLocaleString()}) exceed your remaining budget of PKR ${remainingAfterHotel.toLocaleString()} by PKR ${(nextFoodCost - remainingAfterHotel).toLocaleString()}.`,
        availableAmount: remainingAfterHotel,
        serviceAmount: nextFoodCost,
        primaryText: 'Manage Food Myself (Save PKR ' + nextFoodCost.toLocaleString() + ')',
        onPrimary: () => {
          setFoodRequired(false);
          setFoodChoice('self');
        },
        secondaryText: 'Keep Current Meals',
        onSecondary: () => {},
      });
      return;
    }

    setSelectedMeals(nextMeals);
  }

  // Handle activity toggle with budget check
  function handleToggleActivity(actId) {
    const act = currentActivitiesList.find((a) => a.id === actId);
    if (!act) return;
    const cost = act.pricePerGroup ? act.pricePerGroup : (act.pricePerPerson * numPersons);
    const isCurrentlySelected = selectedOptionalActivities.includes(actId);

    if (!isCurrentlySelected) {
      const currentRem = remainingAfterFood - calculatedActivitiesCost;
      if (cost > currentRem && numBudget > 0) {
        setBudgetModal({
          visible: true,
          title: 'Activity Budget Notice',
          message: `Your remaining budget is PKR ${currentRem.toLocaleString()}, but "${act.name}" costs PKR ${cost.toLocaleString()} for ${numPersons} travelers. Please choose a cheaper activity, skip activities, or increase your budget.`,
          availableAmount: currentRem,
          serviceAmount: cost,
          primaryText: 'Skip Paid Activities',
          onPrimary: () => {
            setActivitiesRequired(false);
            setSelectedOptionalActivities([]);
          },
          secondaryText: 'Close',
          onSecondary: () => {},
        });
        return;
      }
      setSelectedOptionalActivities([...selectedOptionalActivities, actId]);
    } else {
      setSelectedOptionalActivities(selectedOptionalActivities.filter((id) => id !== actId));
    }
  }

  // Handle extra experience toggle with budget check
  function handleToggleExtraExperience(expId) {
    const exp = currentExtraExperiences.find((e) => e.id === expId) || EXTRA_EXPERIENCES.find((e) => e.id === expId);
    if (!exp) return;
    const isCurrentlySelected = selectedExtraIds.includes(expId);

    if (!isCurrentlySelected) {
      const currentAvailable = remainingBeforeExtras - totalExtrasCost;
      if (exp.price > currentAvailable && numBudget > 0) {
        setBudgetModal({
          visible: true,
          title: 'Extra Experience Budget Notice',
          message: `Your remaining budget is PKR ${currentAvailable.toLocaleString()}, but "${exp.name}" costs PKR ${exp.price.toLocaleString()}. Please choose another experience or keep your budget savings.`,
          availableAmount: currentAvailable,
          serviceAmount: exp.price,
          primaryText: 'Skip All Extras (Keep Full Savings)',
          onPrimary: () => setSelectedExtraIds([]),
          secondaryText: 'Close',
          onSecondary: () => {},
        });
        return;
      }
      setSelectedExtraIds([...selectedExtraIds, expId]);
    } else {
      setSelectedExtraIds(selectedExtraIds.filter((id) => id !== expId));
    }
  }

  function notifyUser(title, message) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }

  function handleSelectRoom(room) {
    if (room.available === 0) {
      notifyUser(
        'Room Unavailable',
        'This specific room type is currently fully booked. Please select another room or hotel.'
      );
      return;
    }
    setSelectedRoom(room);
  }

  function toggleInterest(interest) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((i) => i !== interest)
        : [...current, interest]
    );
  }

  function toggleOptionalActivity(id) {
    setSelectedOptionalActivities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Journey mode flags
  const isCompany = tripMode === 'company';
  const isTransportNeeded = Boolean(transportRequired);
  const isHotelNeeded = Boolean(hotelRequired);
  const isFoodNeeded = Boolean(foodRequired) && foodChoice !== 'self';
  const isActivitiesNeeded = Boolean(activitiesRequired);
  const isOwnCar = isTransportNeeded && transportChoice === 'own';

  // Filter vehicles strictly by capacity and budget (shows MULTIPLE cars within budget)
  const matchingVehicles = useMemo(() => {
    const tripDays = Math.max(1, numDays);
    const mCount = parseInt(malesInput, 10) || 0;
    const fCount = parseInt(femalesInput, 10) || 0;
    const count = parseInt(numberOfPersons, 10) || (mCount + fCount) || 1;

    // Determine user's budget ceiling
    const rawBudget = Number(budget) || 0;
    const ppBudget = Number(budgetPerPerson) || 0;
    const effectiveTotal = rawBudget > 0 ? rawBudget : (ppBudget > 0 ? ppBudget * count : 0);
    // Flexible daily/per-person budget limit
    const budgetLimit = Math.max(
      effectiveTotal,
      ppBudget,
      tripDays > 1 ? Math.round(effectiveTotal / tripDays) : 0
    );

    // 1. Capacity filtering based on actual group size (v.maxPersons >= count)
    const isSolo = (travelType === 'Solo' || count === 1);
    let list = RENTAL_VEHICLES.filter((v) => {
      // If group size > 1 or not solo, exclude motorbikes
      if (!isSolo && v.isBike) return false;
      return v.maxPersons >= count;
    });

    // Reasonable upper limits
    if (isSolo) {
      // Solo traveler: include all touring bikes AND compact cars (up to 5 maxPersons)
      list = list.filter((v) => v.isBike || v.maxPersons <= 5);
      // Place bikes first for solo traveler convenience
      list = [...list.filter((v) => v.isBike), ...list.filter((v) => !v.isBike)];
    } else if (count <= 3) {
      list = list.filter((v) => !v.isBike && v.maxPersons <= 5);
    } else if (count === 4) {
      list = list.filter((v) => !v.isBike && v.maxPersons <= 7);
    } else if (count <= 6) {
      list = list.filter((v) => !v.isBike && v.maxPersons >= 4 && v.maxPersons <= 11);
    } else if (count <= 12) {
      list = list.filter((v) => !v.isBike && v.maxPersons >= 7 && v.maxPersons <= 14);
    } else {
      list = list.filter((v) => !v.isBike && v.maxPersons >= 13);
    }

    const computed = list.map((veh) => {
      const vehRent = veh.rentPerDay * tripDays;
      const vehFuel = veh.fuelPerDay * tripDays;
      const toll = 800 * tripDays;
      const totalCost = vehRent + vehFuel + toll;
      return {
        ...veh,
        vehRentTotal: vehRent,
        tripTotalCost: totalCost,
      };
    });

    // 2. Budget Tier Determination & Dynamic Sorting:
    // "agar budget low ha to kam price waly vehicle and hotels agar budget high ha to zyada price waly hotels ans vehicles show ho"
    const effectivePerPerson = ppBudget > 0 ? ppBudget : (count > 0 && effectiveTotal > 0 ? Math.round(effectiveTotal / count) : 0);
    const dailyPerPerson = (count > 0 && tripDays > 0 && effectiveTotal > 0) ? Math.round(effectiveTotal / (count * tripDays)) : 0;

    const isHighTier = (dailyPerPerson >= 12000) || (effectivePerPerson >= 60000) || (effectiveTotal >= 180000 && count <= 4) || (comfortLevel === 'Luxury');
    const isLowTier = !isHighTier && ((dailyPerPerson > 0 && dailyPerPerson <= 5500) || (effectivePerPerson > 0 && effectivePerPerson <= 25000) || (effectiveTotal > 0 && effectiveTotal <= 45000) || (comfortLevel === 'Basic'));

    let candidateVehicles = computed;

    if (budgetLimit > 0) {
      const affordable = computed.filter((veh) => {
        return (
          veh.rentPerDay <= budgetLimit ||
          (effectiveTotal > 0 && veh.vehRentTotal <= effectiveTotal) ||
          (effectiveTotal > 0 && veh.rentPerDay <= effectiveTotal)
        );
      });

      if (affordable.length > 0) {
        candidateVehicles = affordable.map((v) => ({ ...v, fitsBudget: true }));
      } else {
        const topLowest = [...computed].sort((a, b) => a.rentPerDay - b.rentPerDay).slice(0, 4);
        candidateVehicles = topLowest.map((v) => ({ ...v, fitsBudget: false, budgetTooLow: true }));
      }
    } else {
      candidateVehicles = computed.map((v) => ({ ...v, fitsBudget: true }));
    }

    // Attach budget-appropriate badge and sort according to user budget tier
    const badgedAndSorted = candidateVehicles.map((veh) => {
      const isLuxuryVeh = veh.rentPerDay >= 11000 || ['SUV-Fortuner', 'SUV-Prado', 'SUV-Sportage', 'Sedan-Civic', 'Grand-Cabin', 'Bus-Coaster'].includes(veh.id);
      const isEconomyVeh = veh.rentPerDay <= 4800 || veh.isBike || ['Economy-Alto', 'Economy-Mira', 'Economy-WagonR', 'Compact-Vitz'].includes(veh.id);

      let budgetBadge = '⭐ Standard Match';
      let badgeType = 'standard';
      if (isHighTier) {
        if (isLuxuryVeh) {
          budgetBadge = '👑 Luxury Pick · Recommended';
          badgeType = 'luxury';
        } else {
          budgetBadge = '💰 Economy Saver Option';
          badgeType = 'economy';
        }
      } else if (isLowTier) {
        if (isEconomyVeh) {
          budgetBadge = '💰 Best Economy Match · Recommended';
          badgeType = 'budget';
        } else {
          budgetBadge = '⭐ Premium Upgrade Option';
          badgeType = 'luxury';
        }
      } else {
        if (isLuxuryVeh) {
          budgetBadge = '👑 Luxury Upgrade';
          badgeType = 'luxury';
        } else if (isEconomyVeh) {
          budgetBadge = '💰 Economy Option';
          badgeType = 'economy';
        } else {
          budgetBadge = '⭐ Recommended for Budget';
          badgeType = 'standard';
        }
      }

      return {
        ...veh,
        isLuxuryVeh,
        isEconomyVeh,
        budgetBadge,
        badgeType,
      };
    });

    badgedAndSorted.sort((a, b) => {
      if (isHighTier) {
        // High budget: highest rentPerDay first (Fortuner, Prado, Sportage, Civic, etc.)
        return b.rentPerDay - a.rentPerDay;
      } else if (isLowTier) {
        // Low budget: lowest rentPerDay first (Alto, Mehran, Cultus, WagonR, etc.)
        return a.rentPerDay - b.rentPerDay;
      } else {
        // Standard: balanced sedans first, then ascending
        const aStd = a.rentPerDay >= 5000 && a.rentPerDay <= 9000;
        const bStd = b.rentPerDay >= 5000 && b.rentPerDay <= 9000;
        if (aStd && !bStd) return -1;
        if (bStd && !aStd) return 1;
        return a.rentPerDay - b.rentPerDay;
      }
    });

    return badgedAndSorted;
  }, [numberOfPersons, malesInput, femalesInput, budget, budgetPerPerson, numDays, travelType, comfortLevel]);

  // Keep vehicleType in sync with matching vehicles and auto-recommend when budget tier changes
  const prevBudgetTierRef = useRef(null);
  useEffect(() => {
    if (matchingVehicles.length > 0) {
      const rawBudget = Number(budget) || 0;
      const ppBudget = Number(budgetPerPerson) || 0;
      const count = parseInt(numberOfPersons, 10) || 1;
      const effectiveTotal = rawBudget > 0 ? rawBudget : (ppBudget > 0 ? ppBudget * count : 0);
      const effectivePerPerson = ppBudget > 0 ? ppBudget : (count > 0 && effectiveTotal > 0 ? Math.round(effectiveTotal / count) : 0);
      const tripDays = Math.max(1, parseInt(numDays, 10) || 1);
      const dailyPerPerson = (count > 0 && tripDays > 0 && effectiveTotal > 0) ? Math.round(effectiveTotal / (count * tripDays)) : 0;

      const currentTier = (dailyPerPerson >= 12000 || effectivePerPerson >= 60000 || (effectiveTotal >= 180000 && count <= 4) || comfortLevel === 'Luxury')
        ? 'high'
        : ((dailyPerPerson > 0 && dailyPerPerson <= 5500) || (effectivePerPerson > 0 && effectivePerPerson <= 25000) || (effectiveTotal > 0 && effectiveTotal <= 45000) || comfortLevel === 'Basic')
        ? 'low'
        : 'standard';

      if (prevBudgetTierRef.current !== currentTier) {
        prevBudgetTierRef.current = currentTier;
        // Auto-switch to top recommended vehicle for this budget tier
        setVehicleType(matchingVehicles[0].id);
      } else {
        const exists = matchingVehicles.some((v) => v.id === vehicleType);
        if (!exists) {
          setVehicleType(matchingVehicles[0].id);
        }
      }
    }
  }, [matchingVehicles, vehicleType, budget, budgetPerPerson, numberOfPersons, numDays, comfortLevel]);

  // 1. Vehicle & Transport calculations
  const currentVehicle = matchingVehicles.find((v) => v.id === vehicleType) || matchingVehicles[0] || RENTAL_VEHICLES.find((v) => v.id === vehicleType) || RENTAL_VEHICLES[0];
  const driverCharges = 0;
  const vehicleRentTotal = (!isTransportNeeded || isOwnCar) ? 0 : currentVehicle.rentPerDay * (numDays || 1);
  const vehicleFuelTotal = 0;
  const tollParkingEstimate = 0;
  const estimatedVehicleCost = vehicleRentTotal;
  const maxAffordableDaysForVehicle = currentVehicle.rentPerDay > 0 ? Math.floor(numBudget / currentVehicle.rentPerDay) : (numDays || 1);
  const remainingAfterTransport = numBudget - estimatedVehicleCost;
  const canAffordTransport = remainingAfterTransport >= 0;

  // 2. Hotel calculations (room requirements using actual room capacity) - Priority 2
  const roomCapacity = selectedRoom?.capacity || 2;
  const calculatedRequiredRooms = Math.ceil(numPersons / roomCapacity);
  const effectiveRooms = Math.max(1, roomsQuantity ? Number(roomsQuantity) : calculatedRequiredRooms);
  const roomPricePerNight = selectedRoom?.price || selectedRoom?.pricePerNight || selectedHotel?.pricePerNight || 3200;
  const rawHotelCost = roomPricePerNight * nights * effectiveRooms;
  const hotelTotalCost = (!hotelRequired || !isHotelNeeded) ? 0 : rawHotelCost;
  const remainingAfterHotel = remainingAfterTransport - hotelTotalCost;
  const canAffordHotel = remainingAfterTransport >= hotelTotalCost;
  const hotelBudgetShortfall = Math.max(0, hotelTotalCost - remainingAfterTransport);

  // 3. Food calculations based on destination-specific authentic cuisine - Priority 3
  const breakfastRate = currentFoodMenu?.meals?.breakfast?.averagePricePerPerson || 450;
  const lunchRate = currentFoodMenu?.meals?.lunch?.averagePricePerPerson || 850;
  const dinnerRate = currentFoodMenu?.meals?.dinner?.averagePricePerPerson || 1200;
  let dailyMealRate = 0;
  if (isFoodNeeded) {
    if (selectedMeals.breakfast) dailyMealRate += breakfastRate;
    if (selectedMeals.lunch) dailyMealRate += lunchRate;
    if (selectedMeals.dinner) dailyMealRate += dinnerRate;
  }
  const rawFoodCost = dailyMealRate * numPersons * (numDays || 1);
  const foodTotalCost = isFoodNeeded ? rawFoodCost : 0;
  const remainingAfterFood = remainingAfterHotel - foodTotalCost;
  const canAffordFood = remainingAfterHotel >= foodTotalCost;
  const foodBudgetShortfall = Math.max(0, foodTotalCost - remainingAfterHotel);

  // 4. Activities calculations - Priority 4
  const calculatedActivitiesCost = (!isActivitiesNeeded || !activitiesRequired)
    ? 0
    : selectedOptionalActivities.reduce((sum, actId) => {
        const item = currentActivitiesList.find((a) => a.id === actId);
        if (!item) return sum;
        const cost = item.pricePerGroup ? item.pricePerGroup : (item.pricePerPerson * numPersons);
        return sum + cost;
      }, 0);
  const remainingAfterActivities = remainingAfterFood - calculatedActivitiesCost;
  const canAffordActivities = remainingAfterFood >= calculatedActivitiesCost;

  // 5. Optional Extra Experiences ("Make Your Trip More Special!") - Priority 5
  const remainingBeforeExtras = remainingAfterActivities;
  const totalExtrasCost = selectedExtraIds.reduce((sum, id) => {
    const exp = currentExtraExperiences.find((e) => e.id === id) || EXTRA_EXPERIENCES.find((e) => e.id === id);
    return sum + (exp ? exp.price : 0);
  }, 0);
  const bonfireCost = bonfireSelected ? 20000 : 0;
  const totalOptionalCost = totalExtrasCost + bonfireCost;

  // Total Incurred vs Budget (Actual Costs!)
  const totalIncurred = estimatedVehicleCost + foodTotalCost + hotelTotalCost + calculatedActivitiesCost + totalOptionalCost + companyProfit + safetyMargin;
  const remainingBudget = Math.max(0, numBudget - totalIncurred);
  const budgetShortfall = Math.max(0, totalIncurred - numBudget);
  const budgetExceeded = totalIncurred > numBudget && numBudget > 0;
  const perPersonIncurred = Math.round(totalIncurred / Math.max(1, numPersons));
  const remainingPerPerson = Math.round(remainingBudget / Math.max(1, numPersons));

  // Auto-fit function: 1-click optimization
  function handleAutoFitBudget() {
    setVehicleType('Economy-Mehran');
    setComfortLevel('Basic');
    if (!isCompany) {
      setSelectedMeals((prev) => ({ ...prev, lunch: false }));
    }
  }

  // Individual optimization helper
  function applyOptimization(suggestion) {
    if (suggestion.type === 'vehicle') {
      setVehicleType('Economy-Mehran');

    } else if (suggestion.type === 'hotel') {
      setComfortLevel('Basic');
    } else if (suggestion.type === 'food') {
      setSelectedMeals((prev) => ({ ...prev, lunch: false }));
    } else if (suggestion.type === 'transportChoice') {
      setTransportChoice('own');
    }
  }

  // Active optimization suggestions computed live on frontend
  const liveSuggestions = useMemo(() => {
    if (!budgetExceeded) return [];
    const suggestions = [];

    // Vehicle downgrade
    if (isTransportNeeded && !isOwnCar && vehicleType !== 'Economy-Mehran') {
      const mehran = RENTAL_VEHICLES[0];
      const savings = (currentVehicle.rentPerDay - mehran.rentPerDay + currentVehicle.fuelPerDay - mehran.fuelPerDay) * (numDays || 1);
      if (savings > 0) {
        suggestions.push({
          id: 'opt_vehicle',
          type: 'vehicle',
          title: `Switch to ${mehran.name}`,
          desc: `Save fuel and vehicle rent by choosing compact economy (${mehran.luggage}).`,
          savings,
        });
      }
    }

    // Budget hotel
    if (isHotelNeeded && comfortLevel !== 'Basic') {
      const hotelSavings = Math.max(1000, (roomPricePerNight - 2800) * nights * roomsQuantity);
      if (hotelSavings > 0) {
        suggestions.push({
          id: 'opt_hotel',
          type: 'hotel',
          title: 'Switch to Budget Friendly Hotel',
          desc: 'Select standard economy rooms and guest houses.',
          savings: hotelSavings,
        });
      }
    }

    // Lunch self-paid
    if (isFoodNeeded && selectedMeals.lunch) {
      const lunchSavings = 850 * numPersons * (numDays || 1);
      suggestions.push({
        id: 'opt_food',
        type: 'food',
        title: 'Self-arrange lunch at local food stops',
        desc: 'Exclude lunch from pre-booked package.',
        savings: lunchSavings,
      });
    }

    // Own car
    if (isTransportNeeded && !isCompany && transportChoice === 'rental') {
      const ownSavings = vehicleRentTotal;
      if (ownSavings > 0) {
        suggestions.push({
          id: 'opt_own',
          type: 'transportChoice',
          title: 'Use Personal / Own Car',
          desc: 'Drive your own vehicle to avoid car rental fees.',
          savings: ownSavings,
        });
      }
    }

    return suggestions;
  }, [budgetExceeded, isTransportNeeded, isOwnCar, vehicleType, currentVehicle, numDays, isCompany, driverRequired, isHotelNeeded, comfortLevel, roomPricePerNight, nights, roomsQuantity, isFoodNeeded, selectedMeals, numPersons, transportChoice, vehicleRentTotal]);

  async function handleGenerateItinerary() {
    setValidationMessage('');
    if (!destination || !destination.trim()) {
      const msg = 'Please specify a travel destination.';
      setValidationMessage(msg);
      notifyUser('Destination Required', msg);
      return;
    }
    if (!startLocation || !startLocation.trim()) {
      const msg = 'Please specify where you will start your journey from.';
      setValidationMessage(msg);
      notifyUser('Origin Required', msg);
      return;
    }
    if (!startDate || !startDate.trim()) {
      const msg = 'Please enter your journey start date (YYYY-MM-DD).';
      setDateError(msg);
      setValidationMessage(msg);
      notifyUser('Start Date Required', msg);
      return;
    }
    const dateValidationErr = validateJourneyDates(startDate, endDate, numDays);
    if (dateValidationErr) {
      setDateError(dateValidationErr);
      setValidationMessage(dateValidationErr);
      notifyUser('Invalid Journey Dates', dateValidationErr);
      return;
    }
    if (!numDays || numDays < 1) {
      const msg = 'Please enter total trip days (at least 1 day).';
      setValidationMessage(msg);
      notifyUser('Trip Days Required', msg);
      return;
    }
    if (!numPersons || numPersons < 1) {
      const msg = 'Please enter the number of persons traveling (at least 1).';
      setValidationMessage(msg);
      notifyUser('Group Size Required', msg);
      return;
    }
    const cleanBudget = Number(budget) || 0;
    if (cleanBudget <= 0) {
      const msg = 'Please enter a valid trip budget in PKR (e.g. 50,000).';
      setValidationMessage(msg);
      notifyUser('Budget Required', msg);
      return;
    }

    if (budgetExceeded) {
      const msg = `Selected services total PKR ${totalIncurred.toLocaleString()}, which exceeds your budget of PKR ${cleanBudget.toLocaleString()} by PKR ${(totalIncurred - cleanBudget).toLocaleString()}. Please adjust your vehicle, food, or hotel selections before generating your itinerary.`;
      setValidationMessage(msg);
      notifyUser('Budget Exceeded', msg);
      return;
    }

    // Auto-resolve hotel selection if isHotelNeeded is true
    let hotelToUse = selectedHotel;
    let roomToUse = selectedRoom;
    if (isHotelNeeded) {
      if (!hotelToUse && hotels.length > 0) {
        hotelToUse = hotels[0];
        roomToUse = hotels[0].rooms?.[0] || hotels[0].defaultRoom || null;
        setSelectedHotel(hotelToUse);
        setSelectedRoom(roomToUse);
      }
    }

    runTripGeneration(hotelToUse, roomToUse);
  }

  async function runTripGeneration(hotelToUse = selectedHotel, roomToUse = selectedRoom) {
    setGenerating(true);
    setValidationMessage('');
    try {
      const cleanBudget = Number(budget) || 0;
      const cleanBudgetPerPerson = Number(budgetPerPerson) || Math.round(cleanBudget / Math.max(1, numPersons));
      const selectedVehicleObj = RENTAL_VEHICLES.find((v) => v.id === vehicleType) || RENTAL_VEHICLES[1];

      const extrasList = selectedExtraIds.map((id) => {
        const exp = currentExtraExperiences.find((e) => e.id === id) || EXTRA_EXPERIENCES.find((e) => e.id === id);
        return {
          id,
          name: exp?.name || id,
          category: exp?.category || 'Optional Experience',
          price: exp?.price || 0,
          cost: exp?.price || 0,
          isExtra: true,
          selected: true,
        };
      });

      const optionalList = [
        ...selectedOptionalActivities.map((id) => {
          const act = currentActivitiesList.find((a) => a.id === id);
          return {
            id,
            name: act?.name || id,
            price: act?.pricePerGroup || (act?.pricePerPerson || 0) * numPersons,
            selected: true,
          };
        }),
        ...extrasList,
        ...(bonfireSelected ? [{ id: 'opt_bonfire', name: `Campfire & Bonfire Night in ${destination}`, price: 20000, cost: 20000, isExtra: true, selected: true }] : []),
      ];

      const trip = await generateTrip({
        destination: destination.trim(),
        startLocation: startLocation.trim(),
        startDate,
        endDate: endDate || computeEndDate(startDate, numDays),
        category,
        tripMode,
        transportChoice: isCompany ? 'rental' : transportChoice,
        preferredRoute: preferredRoute || customRouteInput || 'Scenic Highway Route',
        foodChoice: foodChoice,
        optionalActivities: optionalList,
        optionalExperiences: [
          ...extrasList,
          ...(bonfireSelected ? [{ id: 'opt_bonfire', name: `Campfire & Bonfire Night in ${destination}`, price: 20000, cost: 20000, selected: true }] : []),
        ],
        days: numDays,
        budget: cleanBudget,
        numberOfPersons: numPersons,
        travelerGender,
        maleCount: travelerGender === 'male' ? numPersons : (travelerGender === 'female' ? 0 : maleCount),
        femaleCount: travelerGender === 'female' ? numPersons : (travelerGender === 'male' ? 0 : femaleCount),
        budgetPerPerson: cleanBudgetPerPerson,
        vehicleType,
        driverRequired: false,
        interests: selectedInterests,
        travelType: isCompany ? 'Group' : travelType,
        transportation: isOwnCar ? 'Own Car (Personal Vehicle)' : selectedVehicleObj.name,
        comfortLevel,
        transportRequired: isTransportNeeded,
        foodRequired: Boolean(foodRequired && foodChoice !== 'self'),
        activitiesRequired: Boolean(activitiesRequired),
        roomsQuantity: effectiveRooms,
        selectedMeals,
        hotelRequired: Boolean(isHotelNeeded && hotelToUse),
        selectedHotelId: isHotelNeeded && hotelToUse ? hotelToUse.id : undefined,
        selectedRoomId: isHotelNeeded && roomToUse ? roomToUse.id : undefined,
      });

      if (!trip) {
        throw new Error('Trip generation did not return a valid itinerary.');
      }

      // Save latest planned trip to localStorage
      const finalDest = destination || trip.destination;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('stp_last_planned_trip', JSON.stringify({
          tripId: trip._id,
          destination: finalDest,
          startLocation: trip.startLocation,
          originCoords: originCoords,
          destCoords: destCoords,
        }));
        window.localStorage.setItem('stp_active_destination', finalDest);
      }

      // Redirect directly to MapScreen with generated trip, destination and origin
      navigation.navigate('MainApp', {
        screen: 'Map',
        params: {
          trip,
          destination: finalDest,
          startLocation: trip.startLocation,
          originCoords: originCoords,
          destCoords: destCoords,
          justGenerated: true,
        },
      });
    } catch (error) {
      const msg = error.message || 'Unable to build itinerary. Please retry.';
      setValidationMessage(msg);
      notifyUser('Trip Planning Failed', msg);
    } finally {
      setGenerating(false);
    }
  }

  const categoryCities = CATEGORY_CITIES_MAP[category] || [];

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <ImageBackground
        source={natureBg}
        style={styles.pageBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(244, 250, 247, 0.20)',
            'rgba(244, 250, 247, 0.32)',
            'rgba(244, 250, 247, 0.45)',
          ]}
          style={styles.pageGradientOverlay}
        >
          {/* SCENIC TOP HEADER (FULL WIDTH) */}
          <LinearGradient colors={['#155E43', '#21845D']} style={styles.scenicHeader}>
            <View style={styles.scenicHeaderInner}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBackBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <AppIcon name="arrow-back" size={18} color="#ffffff" style={{ marginRight: 4 }} />
                <AppText style={styles.headerBackText}>Back</AppText>
              </TouchableOpacity>
              <AppText style={styles.headerTitle}>Plan Your Trip</AppText>
              <AppText style={styles.headerSubtitle}>Complete all-in-one Pakistan journey planner</AppText>
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
            <View style={styles.mainContainer}>

        {/* LIVE BUDGET SUMMARY TRACKER (Requirement 8) */}
        {numBudget > 0 ? (
          <View style={styles.liveBudgetTrackerCard}>
            <View style={styles.liveTrackerHeader}>
              <View style={styles.liveTrackerTitleWrap}>
                <AppIcon name="wallet-outline" size={18} color="#15803d" />
                <AppText style={styles.liveTrackerTitle}>Live Dynamic Budget Summary</AppText>
              </View>
              <View style={[styles.liveStatusPill, budgetExceeded ? styles.liveStatusPillDanger : styles.liveStatusPillSuccess]}>
                <AppText style={[styles.liveStatusText, budgetExceeded && { color: '#dc2626' }]}>
                  {budgetExceeded ? '⚠️ OVER BUDGET' : '✓ ON BUDGET'}
                </AppText>
              </View>
            </View>

            <View style={styles.liveTrackerGrid}>
              <View style={styles.liveTrackerMetric}>
                <AppText style={styles.liveTrackerLbl}>PER PERSON</AppText>
                <AppText style={styles.liveTrackerVal}>PKR {numBudgetPerPerson.toLocaleString()}</AppText>
              </View>
              <View style={styles.liveTrackerDivider} />
              <View style={styles.liveTrackerMetric}>
                <AppText style={styles.liveTrackerLbl}>TOTAL GROUP</AppText>
                <AppText style={styles.liveTrackerVal}>PKR {numBudget.toLocaleString()}</AppText>
                <AppText style={styles.liveTrackerSub}>({numPersons} travelers)</AppText>
              </View>
              <View style={styles.liveTrackerDivider} />
              <View style={styles.liveTrackerMetric}>
                <AppText style={styles.liveTrackerLbl}>TOTAL SPENT</AppText>
                <AppText style={[styles.liveTrackerVal, { color: '#0369a1' }]}>PKR {totalIncurred.toLocaleString()}</AppText>
              </View>
              <View style={styles.liveTrackerDivider} />
              <View style={styles.liveTrackerMetric}>
                <AppText style={styles.liveTrackerLbl}>REMAINING</AppText>
                <AppText style={[styles.liveTrackerVal, { color: budgetExceeded ? '#dc2626' : '#15803d', fontWeight: 'bold' }]}>
                  PKR {remainingBudget.toLocaleString()}
                </AppText>
              </View>
            </View>

            {/* Service Chips */}
            <View style={styles.liveServicesChips}>
              <View style={styles.liveChip}>
                <AppText style={styles.liveChipText}>
                  🚗 Transport: {isOwnCar ? 'Own Car (PKR 0)' : `PKR ${estimatedVehicleCost.toLocaleString()}`}
                </AppText>
              </View>
              <View style={[styles.liveChip, !hotelRequired && styles.liveChipSkipped]}>
                <AppText style={[styles.liveChipText, !hotelRequired && styles.liveChipTextSkipped]}>
                  🏨 Hotel: {hotelRequired ? `PKR ${hotelTotalCost.toLocaleString()}` : 'Skipped (PKR 0)'}
                </AppText>
              </View>
              <View style={[styles.liveChip, (!foodRequired || foodChoice === 'self') && styles.liveChipSkipped]}>
                <AppText style={[styles.liveChipText, (!foodRequired || foodChoice === 'self') && styles.liveChipTextSkipped]}>
                  🍽️ Food: {(foodRequired && foodChoice !== 'self') ? `PKR ${foodTotalCost.toLocaleString()}` : 'Skipped (PKR 0)'}
                </AppText>
              </View>
              <View style={[styles.liveChip, (!activitiesRequired || calculatedActivitiesCost === 0) && styles.liveChipSkipped]}>
                <AppText style={[styles.liveChipText, (!activitiesRequired || calculatedActivitiesCost === 0) && styles.liveChipTextSkipped]}>
                  🎯 Activities: {activitiesRequired && calculatedActivitiesCost > 0 ? `PKR ${calculatedActivitiesCost.toLocaleString()}` : 'Skipped (PKR 0)'}
                </AppText>
              </View>
              {totalExtrasCost > 0 ? (
                <View style={[styles.liveChip, { backgroundColor: '#fdf4ff', borderColor: '#f0abfc' }]}>
                  <AppText style={[styles.liveChipText, { color: '#a21caf' }]}>
                    ✨ Extras: PKR {totalExtrasCost.toLocaleString()}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 0. TRIP MODE SELECTION: COMPANY TOUR OR FULL PACKAGE vs CUSTOMIZE MY TRIP */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="options-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>Choose Planning Mode</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Select whether you want an all-inclusive company package or full customizable control:
          </AppText>

          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeCard, tripMode === 'company' && styles.modeCardActive]}
              onPress={() => {
                setTripMode('company');
                setTransportRequired(true);
                setHotelRequired(true);
                setFoodRequired(true);
                setActivitiesRequired(true);
                setFoodChoice('included');
                setTransportChoice('rental');
              }}
            >
              <View style={styles.modeHeaderRow}>
                <AppIcon name="business-outline" size={20} color={tripMode === 'company' ? colors.white : colors.forest} />
                <AppText style={[styles.modeTitle, tripMode === 'company' && styles.modeTitleActive]}>
                  Company Tour or Full Package
                </AppText>
              </View>
              <AppText style={[styles.modeDesc, tripMode === 'company' && styles.modeDescActive]}>
                Company arranges complete tour: dedicated vehicle with driver, hotel stay, meals, sightseeing, fuel & motorway tolls.
              </AppText>
              <View style={[styles.modeBadge, tripMode === 'company' && styles.modeBadgeActive]}>
                <AppText style={[styles.modeBadgeText, tripMode === 'company' && styles.modeBadgeTextActive]}>
                  {tripMode === 'company' ? '✓ ACTIVE' : 'SELECT'}
                </AppText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, tripMode === 'customized' && styles.modeCardActive]}
              onPress={() => setTripMode('customized')}
            >
              <View style={styles.modeHeaderRow}>
                <AppIcon name="construct-outline" size={20} color={tripMode === 'customized' ? colors.white : colors.forest} />
                <AppText style={[styles.modeTitle, tripMode === 'customized' && styles.modeTitleActive]}>
                  Customize My Trip
                </AppText>
              </View>
              <AppText style={[styles.modeDesc, tripMode === 'customized' && styles.modeDescActive]}>
                Select required services (Transport, Hotel, Food, Sights). Unselected services are completely hidden and cost PKR 0.
              </AppText>
              <View style={[styles.modeBadge, tripMode === 'customized' && styles.modeBadgeActive]}>
                <AppText style={[styles.modeBadgeText, tripMode === 'customized' && styles.modeBadgeTextActive]}>
                  {tripMode === 'customized' ? '✓ ACTIVE' : 'SELECT'}
                </AppText>
              </View>
            </TouchableOpacity>
          </View>

          {/* CUSTOMIZE MY TRIP: SERVICE CHECKLIST SWITCHES */}
          {tripMode === 'customized' ? (
            <View style={styles.serviceCustomBox}>
              <View style={styles.serviceCustomHeader}>
                <AppIcon name="options" size={16} color={colors.forest} />
                <AppText style={styles.serviceCustomTitle}>Select Required Services</AppText>
              </View>
              <AppText style={styles.serviceCustomDesc}>
                Toggle which services you need. Jo service uncheck hogi uska section niche hide ho jayega aur uski cost PKR 0 hogi:
              </AppText>
              <View style={styles.serviceGrid}>
                <TouchableOpacity
                  style={[styles.serviceCheckChip, transportRequired && styles.serviceCheckChipActive]}
                  onPress={() => setTransportRequired(!transportRequired)}
                >
                  <AppIcon name={transportRequired ? "checkbox" : "square-outline"} size={18} color={transportRequired ? colors.white : colors.forest} />
                  <AppText style={[styles.serviceCheckText, transportRequired && styles.serviceCheckTextActive]}>
                    Transport {transportRequired ? '(Active)' : '(Hidden - PKR 0)'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serviceCheckChip, hotelRequired && styles.serviceCheckChipActive]}
                  onPress={() => setHotelRequired(!hotelRequired)}
                >
                  <AppIcon name={hotelRequired ? "checkbox" : "square-outline"} size={18} color={hotelRequired ? colors.white : colors.forest} />
                  <AppText style={[styles.serviceCheckText, hotelRequired && styles.serviceCheckTextActive]}>
                    Hotel Stay {hotelRequired ? '(Active)' : '(Hidden - PKR 0)'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serviceCheckChip, foodRequired && styles.serviceCheckChipActive]}
                  onPress={() => setFoodRequired(!foodRequired)}
                >
                  <AppIcon name={foodRequired ? "checkbox" : "square-outline"} size={18} color={foodRequired ? colors.white : colors.forest} />
                  <AppText style={[styles.serviceCheckText, foodRequired && styles.serviceCheckTextActive]}>
                    Food Meals {foodRequired ? '(Active)' : '(Hidden - PKR 0)'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serviceCheckChip, activitiesRequired && styles.serviceCheckChipActive]}
                  onPress={() => setActivitiesRequired(!activitiesRequired)}
                >
                  <AppIcon name={activitiesRequired ? "checkbox" : "square-outline"} size={18} color={activitiesRequired ? colors.white : colors.forest} />
                  <AppText style={[styles.serviceCheckText, activitiesRequired && styles.serviceCheckTextActive]}>
                    Activities {activitiesRequired ? '(Active)' : '(Hidden - PKR 0)'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.companyInclusionsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppIcon name="shield-checkmark" size={18} color="#065f46" />
                <AppText style={styles.companyInclusionsTitle}>Full Company Package Inclusions</AppText>
              </View>
              <AppText style={styles.companyInclusionsText}>
                ✓ Chauffeur vehicle with fuel & motorway tolls  •  ✓ Hotel stay according to budget tier  •  ✓ Daily breakfast & dinner  •  ✓ Sights entry coordination & 24/7 support
              </AppText>
            </View>
          )}
        </View>

        {/* 1. CATEGORY SELECTION & CLARITY */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="layers-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>1. Travel Category</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Select which travel region of Pakistan you want to explore:
          </AppText>

          <View style={styles.pillRow}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => {
                    setCategory(cat);
                    const firstCity = CATEGORY_CITIES_MAP[cat]?.[0];
                    if (firstCity) setDestination(firstCity);
                  }}
                >
                  <AppText style={[styles.catChipText, active && styles.catChipTextActive]}>
                    {cat}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explicit Category Explanation */}
          <View style={styles.categoryInfoBox}>
            <AppIcon name="information-circle" size={16} color={colors.forest} />
            <AppText style={styles.categoryInfoText}>
              📍 <AppText style={{ fontWeight: 'bold' }}>{destination}</AppText> lies in the <AppText style={{ fontWeight: 'bold', color: colors.forest }}>{category}</AppText> category.
            </AppText>
          </View>

          {/* Cities that lie in this category */}
          <View style={{ marginTop: 8 }}>
            <AppText style={styles.sublabel}>Iconic cities in {category}:</AppText>
            <View style={styles.cityPillsWrap}>
              {categoryCities.map((city) => {
                const active = destination.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(destination.toLowerCase());
                return (
                  <TouchableOpacity
                    key={city}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    onPress={() => setDestination(city)}
                  >
                    <AppText style={[styles.cityChipText, active && styles.cityChipTextActive]}>
                      {city}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 2. WHERE YOU START YOUR JOURNEY (LIVE GPS ORIGIN & ARRIVAL CITY) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="navigate-circle-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>2. Where You Start Your Journey</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Your live GPS location and destination arrival city:
          </AppText>

          {/* Real Live GPS Location Detection Button */}
          <TouchableOpacity
            style={styles.gpsDetectButton}
            onPress={handleDetectCurrentLocation}
            disabled={isDetectingLocation}
          >
            {isDetectingLocation ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            ) : (
              <AppIcon name="locate" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            )}
            <AppText style={styles.gpsDetectButtonText}>
              {isDetectingLocation ? 'Detecting Live GPS...' : '📍 Detect Exact Live Location (GPS)'}
            </AppText>
          </TouchableOpacity>

          {/* DUAL ENDPOINTS DISPLAY: USER LIVE LOCATION & ARRIVAL CITY */}
          <View style={styles.journeyEndpointsContainer}>
            {/* User Live Location (Departure Origin) */}
            <View style={styles.endpointCardLive}>
              <View style={styles.endpointHeaderRow}>
                <View style={styles.livePulseDot} />
                <AppText style={styles.endpointTag}>USER LIVE LOCATION (DEPARTURE)</AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <AppIcon name="location" size={18} color="#15803d" style={{ marginRight: 6 }} />
                <AppText style={styles.endpointCityName}>{startLocation || 'Current Location'}</AppText>
              </View>
              {liveLocationStatus ? (
                <AppText style={styles.endpointCoordsText}>{liveLocationStatus}</AppText>
              ) : (
                <AppText style={styles.endpointCoordsText}>
                  📍 GPS: {originCoords ? `${originCoords[0]?.toFixed(4)}°N, ${originCoords[1]?.toFixed(4)}°E` : 'Live Coordinates Synced'}
                </AppText>
              )}
            </View>

            {/* Arrival City (Final Destination) */}
            <View style={styles.endpointCardArrival}>
              <View style={styles.endpointHeaderRow}>
                <AppIcon name="flag" size={13} color="#0284c7" style={{ marginRight: 4 }} />
                <AppText style={styles.endpointArrivalTag}>ARRIVAL CITY (DESTINATION)</AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <AppIcon name="pin" size={18} color="#0284c7" style={{ marginRight: 6 }} />
                <AppText style={styles.endpointCityName}>{destination || 'Malam Jabba'}</AppText>
              </View>
              <AppText style={styles.endpointCategoryText}>
                Category: {category || 'Northern Areas'}
              </AppText>
            </View>
          </View>

          {/* QUICK PRESETS & SEARCH FOR DEPARTURE (Ghar, Office, School, Uni, Live GPS) */}
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <AppText style={styles.sublabel}>Set Starting Point (Ghar, Office, School, Uni, or Live GPS):</AppText>
            
            {/* Quick Location Mode Buttons */}
            <View style={styles.originPresetsRow}>
              <TouchableOpacity
                style={[styles.originPresetBtn, isDetectingLocation && styles.originPresetBtnActive]}
                onPress={handleDetectCurrentLocation}
                disabled={isDetectingLocation}
              >
                <AppIcon name="navigate-circle" size={15} color={isDetectingLocation ? '#ffffff' : '#15803d'} />
                <AppText style={[styles.originPresetBtnText, isDetectingLocation && styles.originPresetBtnTextActive]}>
                  {isDetectingLocation ? 'Detecting GPS...' : '🎯 Live GPS Tracker'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originPresetBtn, originCategoryTab === 'home' && styles.originPresetBtnActive]}
                onPress={() => setOriginCategoryTab(originCategoryTab === 'home' ? null : 'home')}
              >
                <AppIcon name="home" size={13} color={originCategoryTab === 'home' ? '#ffffff' : '#15803d'} />
                <AppText style={[styles.originPresetBtnText, originCategoryTab === 'home' && styles.originPresetBtnTextActive]}>🏠 Home / Ghar</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originPresetBtn, originCategoryTab === 'uni' && styles.originPresetBtnActive]}
                onPress={() => setOriginCategoryTab(originCategoryTab === 'uni' ? null : 'uni')}
              >
                <AppIcon name="school" size={13} color={originCategoryTab === 'uni' ? '#ffffff' : '#15803d'} />
                <AppText style={[styles.originPresetBtnText, originCategoryTab === 'uni' && styles.originPresetBtnTextActive]}>🏫 School / Uni</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.originPresetBtn, originCategoryTab === 'office' && styles.originPresetBtnActive]}
                onPress={() => setOriginCategoryTab(originCategoryTab === 'office' ? null : 'office')}
              >
                <AppIcon name="business" size={13} color={originCategoryTab === 'office' ? '#ffffff' : '#15803d'} />
                <AppText style={[styles.originPresetBtnText, originCategoryTab === 'office' && styles.originPresetBtnTextActive]}>🏢 Office</AppText>
              </TouchableOpacity>
            </View>

            {/* Sub-chips for Home / Uni / Office */}
            {originCategoryTab === 'home' && (
              <View style={styles.originSubChipsBox}>
                <AppText style={styles.originSubChipsTitle}>Popular Home & Residential Areas:</AppText>
                <View style={styles.originSubChipsWrap}>
                  {[
                    { label: '🏠 DHA Lahore', name: 'DHA Lahore', coords: [31.4697, 74.3800] },
                    { label: '🏠 Bahria Town Rawalpindi', name: 'Bahria Town Rawalpindi', coords: [33.5186, 73.1097] },
                    { label: '🏠 Gulberg Lahore', name: 'Gulberg Lahore', coords: [31.5204, 74.3487] },
                    { label: '🏠 Model Town Lahore', name: 'Model Town Lahore', coords: [31.4880, 74.3211] },
                    { label: '🏠 F-10 Islamabad', name: 'F-10 Islamabad', coords: [33.6934, 73.0031] },
                    { label: '🏠 Askari Lahore', name: 'Askari Lahore', coords: [31.5392, 74.4012] },
                    { label: '🏠 Satellite Town Rwp', name: 'Satellite Town Rawalpindi', coords: [33.6391, 73.0645] },
                    { label: '🏠 Clifton Karachi', name: 'Clifton Karachi', coords: [24.8138, 67.0300] },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.originSubChip, startLocation.toLowerCase().includes(item.name.toLowerCase()) && styles.originSubChipActive]}
                      onPress={() => {
                        handleSelectDepartureCity(item.name, item.coords);
                        setOriginCategoryTab(null);
                      }}
                    >
                      <AppText style={[styles.originSubChipText, startLocation.toLowerCase().includes(item.name.toLowerCase()) && styles.originSubChipTextActive]}>
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {originCategoryTab === 'uni' && (
              <View style={styles.originSubChipsBox}>
                <AppText style={styles.originSubChipsTitle}>Top Universities in Pakistan:</AppText>
                <View style={styles.originSubChipsWrap}>
                  {[
                    { label: '🏫 FAST NUCES Islamabad', name: 'FAST NUCES Islamabad', coords: [33.6518, 73.0159] },
                    { label: '🏫 NUST H-12 Islamabad', name: 'NUST Islamabad', coords: [33.6425, 72.9904] },
                    { label: '🏫 LUMS Lahore', name: 'LUMS Lahore', coords: [31.4705, 74.4111] },
                    { label: '🏫 COMSATS Islamabad', name: 'COMSATS Islamabad', coords: [33.6519, 73.1566] },
                    { label: '🏫 GIKI Topi', name: 'GIKI Topi', coords: [34.0705, 72.6433] },
                    { label: '🏫 Punjab University (PU)', name: 'Punjab University Lahore', coords: [31.4988, 74.2985] },
                    { label: '🏫 UET Lahore', name: 'UET Lahore', coords: [31.5794, 74.3562] },
                    { label: '🏫 IBA Karachi', name: 'IBA Karachi', coords: [24.9427, 67.1142] },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.originSubChip, startLocation.toLowerCase().includes(item.name.toLowerCase()) && styles.originSubChipActive]}
                      onPress={() => {
                        handleSelectDepartureCity(item.name, item.coords);
                        setOriginCategoryTab(null);
                      }}
                    >
                      <AppText style={[styles.originSubChipText, startLocation.toLowerCase().includes(item.name.toLowerCase()) && styles.originSubChipTextActive]}>
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {originCategoryTab === 'office' && (
              <View style={styles.originSubChipsBox}>
                <AppText style={styles.originSubChipsTitle}>Popular Office & Corporate Districts:</AppText>
                <View style={styles.originSubChipsWrap}>
                  {[
                    { label: '🏢 Blue Area Islamabad', name: 'Blue Area Islamabad', coords: [33.7103, 73.0656] },
                    { label: '🏢 Gulberg Main Blvd Lahore', name: 'Gulberg Lahore', coords: [31.5204, 74.3487] },
                    { label: '🏢 I-9 Industrial Area Isb', name: 'I-9 Islamabad', coords: [33.6582, 73.0521] },
                    { label: '🏢 I.I. Chundrigar Road Karachi', name: 'I.I. Chundrigar Road Karachi', coords: [24.8508, 67.0011] },
                    { label: '🏢 Saddar Commercial Rwp', name: 'Saddar Rawalpindi', coords: [33.5973, 73.0534] },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.originSubChip, startLocation.toLowerCase().includes(item.name.toLowerCase()) && styles.originSubChipActive]}
                      onPress={() => {
                        handleSelectDepartureCity(item.name, item.coords);
                        setOriginCategoryTab(null);
                      }}
                    >
                      <AppText style={[styles.originSubChipText, startLocation.toLowerCase().includes(item.name.toLowerCase()) && styles.originSubChipTextActive]}>
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Cities Row */}
            <View style={{ marginVertical: 6 }}>
              <AppText style={{ fontSize: 12, fontWeight: '700', color: colors.forest, marginBottom: 4 }}>
                Or pick departure city:
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['Lahore', 'Rawalpindi', 'Islamabad', 'Karachi', 'Peshawar', 'Multan', 'Faisalabad', 'Gujranwala', 'Sialkot', 'Abbottabad'].map((c) => {
                  const active = startLocation.toLowerCase() === c.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.cityChip, active && styles.cityChipActive, { marginRight: 6 }]}
                      onPress={() => handleSelectDepartureCity(c)}
                    >
                      <AppText style={[styles.cityChipText, active && styles.cityChipTextActive]}>{c}</AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.inputWrap}>
              <AppIcon name="search-outline" size={18} color={colors.muted} />
              <TextInput
                id="trip-start-location-search-input"
                nativeID="trip-start-location-search-input"
                name="departureSearch"
                accessibilityLabel="Search starting city or address"
                value={departureSearchQuery}
                onChangeText={setDepartureSearchQuery}
                placeholder="Search exact location (e.g. NUST, FAST, Bahria Town, G-11, Gulberg)..."
                placeholderTextColor="#94a098"
                style={styles.textInput}
              />
              {departureSearchQuery ? (
                <TouchableOpacity onPress={() => setDepartureSearchQuery('')} style={{ padding: 4 }}>
                  <AppIcon name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* LIVE ADDRESS & LANDMARK SEARCH RESULTS */}
            {isSearchingPlaces ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 }}>
                <ActivityIndicator size="small" color={colors.forest} />
                <AppText style={{ fontSize: 12, color: colors.muted }}>Searching exact address, university, or neighborhood...</AppText>
              </View>
            ) : null}

            {liveSearchResults.length > 0 && (
              <View style={styles.liveSearchResultsBox}>
                <AppText style={styles.searchSuggestionsLabel}>
                  Exact Locations & Landmarks ({liveSearchResults.length}):
                </AppText>
                {liveSearchResults.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.livePlaceItem}
                    onPress={() => handleSelectDepartureCity(place.name, [place.lat, place.lon])}
                  >
                    <AppIcon
                      name={place.icon === 'school' ? 'school' : place.icon === 'business' ? 'business' : place.icon === 'home' ? 'home' : 'location'}
                      size={18}
                      color={colors.forest}
                    />
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.livePlaceTitle}>{place.name}</AppText>
                      <AppText style={styles.livePlaceSubtitle} numberOfLines={1}>{place.fullAddress}</AppText>
                    </View>
                    <AppIcon name="chevron-forward" size={14} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Matching City Options */}
            {departureSearchQuery.trim().length > 0 && liveSearchResults.length === 0 && !isSearchingPlaces && (
              <View style={styles.searchSuggestionsBox}>
                <AppText style={styles.searchSuggestionsLabel}>
                  Matching Cities ({filteredDepartureCities.length}):
                </AppText>
                {filteredDepartureCities.length > 0 ? (
                  <View style={styles.cityPillsWrap}>
                    {filteredDepartureCities.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.searchSuggestionChip,
                          startLocation.toLowerCase() === city.toLowerCase() && styles.searchSuggestionChipActive,
                        ]}
                        onPress={() => handleSelectDepartureCity(city)}
                      >
                        <AppIcon
                          name="location-sharp"
                          size={13}
                          color={startLocation.toLowerCase() === city.toLowerCase() ? '#ffffff' : colors.forest}
                          style={{ marginRight: 4 }}
                        />
                        <AppText
                          style={[
                            styles.searchSuggestionChipText,
                            startLocation.toLowerCase() === city.toLowerCase() && styles.searchSuggestionChipTextActive,
                          ]}
                        >
                          {city}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={{ paddingVertical: 4 }}>
                    <AppText style={{ fontSize: 12, color: '#64748b' }}>
                      No predefined city matches "{departureSearchQuery}".
                    </AppText>
                    <TouchableOpacity
                      style={styles.useCustomOriginBtn}
                      onPress={() => handleSelectDepartureCity(departureSearchQuery.trim())}
                    >
                      <AppText style={styles.useCustomOriginBtnText}>
                        Use "{departureSearchQuery.trim()}" as departure location ➔
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Route Overview Strip */}
          <View style={styles.routeRoutePreview}>
            <AppIcon name="arrow-forward-circle" size={16} color={colors.forest} />
            <AppText style={styles.routeRoutePreviewText}>
              Route: <AppText style={{ fontWeight: 'bold' }}>{startLocation || 'Origin'}</AppText> ➔ <AppText style={{ fontWeight: 'bold', color: colors.forest }}>{destination || 'Destination'}</AppText>
            </AppText>
          </View>

          <AppText style={{ fontSize: 11, color: '#15803d', fontWeight: '600', marginBottom: 8, marginTop: -4 }}>
            💡 Map Tip: Green pin ko drag karein ya map par kahin bhi tap karein apne ghar, office, school, ya university ki exact location set karne ke liye.
          </AppText>

          {/* Real Journey Route Map (Current Location ➔ Final Destination) */}
          <JourneyRouteMap
            originName={startLocation || 'Origin'}
            originCoords={originCoords}
            destinationName={destination || 'Destination'}
            destCoords={destCoords}
            height={320}
          />
        </View>

        {/* 3. TRAVEL STYLE, GROUP & BUDGET (Between Origin and Dates) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="shield-checkmark-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>3. Travel Style & Group Type</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Select your travel group type and comfort preferences:
          </AppText>

          {/* Travel Group Type */}
          <AppText style={styles.sublabel}>Travel Group Type:</AppText>
          <View style={styles.travelTypeRow}>
            {TRAVEL_TYPES.map((type) => {
              const active = travelType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => handleTravelTypeSelect(type.id)}
                >
                  <AppIcon name={type.icon} size={22} color={active ? colors.white : colors.forest} />
                  <AppText style={[styles.typeTitle, active && styles.typeTitleActive]}>{type.label}</AppText>
                  <AppText style={[styles.typeDesc, active && styles.typeDescActive]}>{type.desc}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CONDITIONAL CONTENT: SOLO vs FAMILY / GROUP */}
          {travelType === 'Solo' ? (
            <View style={styles.soloContainer}>
              {/* Ask Gender: Male / Female */}
              <AppText style={[styles.sublabel, { marginTop: 12 }]}>I am traveling as (Gender):</AppText>
              <View style={styles.genderSelectRow}>
                <TouchableOpacity
                  style={[styles.genderSelectBtn, travelerGender === 'male' && styles.genderSelectBtnActive]}
                  onPress={() => handleSoloGenderSelect('male')}
                >
                  <AppIcon name="man" size={20} color={travelerGender === 'male' ? colors.white : colors.forest} />
                  <AppText style={[styles.genderSelectText, travelerGender === 'male' && styles.genderSelectTextActive]}>
                    Male Traveler
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genderSelectBtn, travelerGender === 'female' && styles.genderSelectBtnFemaleActive]}
                  onPress={() => handleSoloGenderSelect('female')}
                >
                  <AppIcon name="woman" size={20} color={travelerGender === 'female' ? colors.white : '#db2777'} />
                  <AppText style={[styles.genderSelectText, travelerGender === 'female' && styles.genderSelectTextActive]}>
                    Female Traveler
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Solo Traveler Badge */}
              <View style={styles.soloTravelerInfoBadge}>
                <AppIcon name="person" size={16} color={colors.forest} />
                <AppText style={styles.soloTravelerInfoText}>
                  Solo Journey • <AppText style={{ fontWeight: 'bold' }}>1 Traveler ({travelerGender === 'female' ? 'Female' : 'Male'})</AppText>
                </AppText>
              </View>

              {/* Solo Budget Input */}
              <AppText style={[styles.sublabel, { marginTop: 12 }]}>Your Total Trip Budget (PKR):</AppText>
              <View style={styles.inputWrap}>
                <AppText style={styles.pkrPrefix}>PKR</AppText>
                <TextInput
                  id="trip-solo-budget-input"
                  nativeID="trip-solo-budget-input"
                  name="soloBudget"
                  accessibilityLabel="Total Solo Trip Budget in PKR"
                  value={budget}
                  onChangeText={handleSoloBudgetChange}
                  keyboardType="numeric"
                  placeholder="e.g. 50000"
                  placeholderTextColor="#94a098"
                  style={styles.textInput}
                />
                <AppText style={styles.perPersonSuffix}>total</AppText>
              </View>

              {/* Solo Quick Budget Presets */}
              <View style={styles.presetPillsRow}>
                {[25000, 40000, 60000, 90000, 150000].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, Number(budget) === preset && styles.presetChipActive]}
                    onPress={() => handleSoloBudgetChange(String(preset))}
                  >
                    <AppText style={[styles.presetChipText, Number(budget) === preset && styles.presetChipTextActive]}>
                      PKR {preset.toLocaleString()}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : travelType === 'Family' ? (
            /* ============================================================
               FAMILY MODE: Combined Total Family Budget & Family Breakdown
               ============================================================ */
            <View style={styles.groupContainer}>
              <AppText style={[styles.sublabel, { marginTop: 12 }]}>👨‍👩‍👧‍👦 Family Members Breakdown:</AppText>
              <View style={styles.strengthRow}>
                {/* Males (Men / Boys) */}
                <View style={styles.strengthCol}>
                  <AppText style={styles.sublabel}>Males (Men / Boys):</AppText>
                  <View style={styles.inputWrap}>
                    <AppIcon name="man" size={18} color={colors.forest} />
                    <TextInput
                      id="trip-family-males-input"
                      nativeID="trip-family-males-input"
                      name="familyMalesStrength"
                      accessibilityLabel="Number of Males in Family"
                      value={malesInput}
                      onChangeText={handleMalesChange}
                      keyboardType="numeric"
                      placeholder="e.g. 3"
                      placeholderTextColor="#94a098"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Females (Women / Girls) */}
                <View style={styles.strengthCol}>
                  <AppText style={styles.sublabel}>Females (Women / Girls):</AppText>
                  <View style={styles.inputWrap}>
                    <AppIcon name="woman" size={18} color="#db2777" />
                    <TextInput
                      id="trip-family-females-input"
                      nativeID="trip-family-females-input"
                      name="familyFemalesStrength"
                      accessibilityLabel="Number of Females in Family"
                      value={femalesInput}
                      onChangeText={handleFemalesChange}
                      keyboardType="numeric"
                      placeholder="e.g. 5"
                      placeholderTextColor="#94a098"
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* Total Family Members Display & Auto-Sync Input */}
              <View style={{ marginTop: 10 }}>
                <AppText style={styles.sublabel}>Total Family Members Traveling:</AppText>
                <View style={[styles.inputWrap, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <AppIcon name="people" size={18} color={colors.forest} />
                  <TextInput
                    id="trip-family-persons-input"
                    nativeID="trip-family-persons-input"
                    name="familyNumberOfPersons"
                    accessibilityLabel="Total Family Members"
                    value={numberOfPersons}
                    onChangeText={handlePersonsChange}
                    keyboardType="numeric"
                    placeholder="Auto-calculated (Males + Females)"
                    placeholderTextColor="#94a098"
                    style={[styles.textInput, { fontWeight: 'bold' }]}
                  />
                  <AppText style={styles.perPersonSuffix}>
                    {numPersons > 0 ? `${numPersons} family ${numPersons === 1 ? 'member' : 'members'}` : 'family members'}
                  </AppText>
                </View>
              </View>

              {/* TOTAL FAMILY TRIP BUDGET INPUT */}
              <View style={{ marginTop: 12 }}>
                <AppText style={styles.sublabel}>Total Family Trip Budget (PKR):</AppText>
                <View style={styles.inputWrap}>
                  <AppText style={styles.pkrPrefix}>PKR</AppText>
                  <TextInput
                    id="trip-family-total-budget-input"
                    nativeID="trip-family-total-budget-input"
                    name="totalFamilyBudget"
                    accessibilityLabel="Total Family Trip Budget in PKR"
                    value={budget}
                    onChangeText={handleTotalBudgetChange}
                    keyboardType="numeric"
                    placeholder="e.g. 200000 (2 Lacs)"
                    placeholderTextColor="#94a098"
                    style={styles.textInput}
                  />
                  <AppText style={styles.perPersonSuffix}>Total Family Budget</AppText>
                </View>

                {/* Family Budget Quick Presets */}
                <View style={styles.presetPillsRow}>
                  {[100000, 150000, 200000, 300000, 500000].map((preset) => (
                    <TouchableOpacity
                      key={`fam-b-${preset}`}
                      style={[styles.presetChip, Number(budget) === preset && styles.presetChipActive]}
                      onPress={() => handleTotalBudgetChange(String(preset))}
                    >
                      <AppText style={[styles.presetChipText, Number(budget) === preset && styles.presetChipTextActive]}>
                        {preset >= 100000 ? `${preset / 100000} Lac${preset > 100000 ? 's' : ''}` : `PKR ${preset.toLocaleString()}`}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Live Family Calculation Banner */}
              <View style={styles.totalTourBudgetBanner}>
                <View style={styles.totalTourBannerTop}>
                  <AppIcon name="home-outline" size={18} color={colors.forest} />
                  <AppText style={styles.totalTourBannerTitle}>Total Family Trip Budget</AppText>
                </View>
                <AppText style={styles.totalTourFormula}>
                  {numPersons > 0 && numBudget > 0
                    ? `Family of ${numPersons} members (${maleCount} Males + ${femaleCount} Females) · Combined Trip Budget`
                    : 'Enter your family’s combined trip budget (e.g. 2 Lacs = 200,000)'}
                </AppText>
                <AppText style={styles.totalTourPrice}>
                  = PKR {numBudget.toLocaleString()} Total Family Budget
                </AppText>
              </View>

              {/* Minimum Budget Warning Indicator */}
              {numPersons > 0 && numDays > 0 && numBudget > 0 && numBudget < (numPersons * numDays * 3500) && (
                <View style={{
                  marginTop: 10,
                  padding: 12,
                  backgroundColor: '#fef2f2',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#fca5a5',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AppIcon name="alert-circle" size={18} color="#dc2626" />
                    <AppText style={{ fontWeight: '700', fontSize: 13, color: '#b91c1c' }}>
                      Budget Too Low
                    </AppText>
                  </View>
                  <AppText style={{ fontSize: 11, color: '#991b1b', lineHeight: 16 }}>
                    For {numPersons} family members and {numDays} days, minimum estimated expenses are PKR {(numPersons * numDays * 3500).toLocaleString()}. Please increase budget or reduce days for comfortable accommodations & travel.
                  </AppText>
                </View>
              )}
            </View>
          ) : (
            /* ============================================================
               GROUP MODE: Budget Per Person or Total Group Pooling
               ============================================================ */
            <View style={styles.groupContainer}>
              <AppText style={[styles.sublabel, { marginTop: 12 }]}>👥 Group Travelers Breakdown:</AppText>
              <View style={styles.strengthRow}>
                {/* Males Strength */}
                <View style={styles.strengthCol}>
                  <AppText style={styles.sublabel}>Males (Number of Men):</AppText>
                  <View style={styles.inputWrap}>
                    <AppIcon name="man" size={18} color={colors.forest} />
                    <TextInput
                      id="trip-group-males-input"
                      nativeID="trip-group-males-input"
                      name="malesStrength"
                      accessibilityLabel="Number of Males"
                      value={malesInput}
                      onChangeText={handleMalesChange}
                      keyboardType="numeric"
                      placeholder="e.g. 2"
                      placeholderTextColor="#94a098"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                {/* Females Strength */}
                <View style={styles.strengthCol}>
                  <AppText style={styles.sublabel}>Females (Number of Women):</AppText>
                  <View style={styles.inputWrap}>
                    <AppIcon name="woman" size={18} color="#db2777" />
                    <TextInput
                      id="trip-group-females-input"
                      nativeID="trip-group-females-input"
                      name="femalesStrength"
                      accessibilityLabel="Number of Females"
                      value={femalesInput}
                      onChangeText={handleFemalesChange}
                      keyboardType="numeric"
                      placeholder="e.g. 1"
                      placeholderTextColor="#94a098"
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* Total Persons Display & Auto-Sync Input */}
              <View style={{ marginTop: 10 }}>
                <AppText style={styles.sublabel}>Total Persons Traveling:</AppText>
                <View style={[styles.inputWrap, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <AppIcon name="people" size={18} color={colors.forest} />
                  <TextInput
                    id="trip-group-persons-input"
                    nativeID="trip-group-persons-input"
                    name="numberOfPersons"
                    accessibilityLabel="Total Persons Traveling"
                    value={numberOfPersons}
                    onChangeText={handlePersonsChange}
                    keyboardType="numeric"
                    placeholder="Auto-calculated (Males + Females)"
                    placeholderTextColor="#94a098"
                    style={[styles.textInput, { fontWeight: 'bold' }]}
                  />
                  <AppText style={styles.perPersonSuffix}>
                    {numPersons > 0 ? `${numPersons} ${numPersons === 1 ? 'person' : 'persons'}` : 'persons'}
                  </AppText>
                </View>
              </View>

              {/* Budget per Person Input */}
              <View style={{ marginTop: 6 }}>
                <AppText style={styles.sublabel}>Budget Per Person (PKR):</AppText>

                <View style={styles.inputWrap}>
                  <AppText style={styles.pkrPrefix}>PKR</AppText>
                  <TextInput
                    id="trip-budget-per-person-input"
                    nativeID="trip-budget-per-person-input"
                    name="budgetPerPerson"
                    accessibilityLabel="Budget Per Person in PKR"
                    value={budgetPerPerson}
                    onChangeText={handleBudgetPerPersonChange}
                    keyboardType="numeric"
                    placeholder="e.g. 38500"
                    placeholderTextColor="#94a098"
                    style={styles.textInput}
                  />
                  <AppText style={styles.perPersonSuffix}>/ person</AppText>
                </View>

                {/* Group Quick Presets */}
                <View style={styles.presetPillsRow}>
                  {[25000, 38500, 50000, 75000, 100000].map((preset) => (
                    <TouchableOpacity
                      key={`grp-b-${preset}`}
                      style={[styles.presetChip, Number(budgetPerPerson) === preset && styles.presetChipActive]}
                      onPress={() => handleBudgetPerPersonChange(String(preset))}
                    >
                      <AppText style={[styles.presetChipText, Number(budgetPerPerson) === preset && styles.presetChipTextActive]}>
                        PKR {preset.toLocaleString()}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Live Calculation Banner */}
              <View style={styles.totalTourBudgetBanner}>
                <View style={styles.totalTourBannerTop}>
                  <AppIcon name="calculator-outline" size={18} color={colors.forest} />
                  <AppText style={styles.totalTourBannerTitle}>Total Group Budget</AppText>
                </View>
                <AppText style={styles.totalTourFormula}>
                  {numPersons > 0 && numBudgetPerPerson > 0
                    ? `${numPersons} ${numPersons === 1 ? 'Person' : 'Persons'} × PKR ${numBudgetPerPerson.toLocaleString()} / person`
                    : 'Enter travelers and budget per person to calculate total'}
                </AppText>
                <AppText style={styles.totalTourPrice}>
                  = PKR {numBudget.toLocaleString()} Total
                </AppText>
              </View>

              {/* Minimum Budget Warning Indicator */}
              {numPersons > 0 && numDays > 0 && numBudget > 0 && numBudget < (numPersons * numDays * 3500) && (
                <View style={{
                  marginTop: 10,
                  padding: 12,
                  backgroundColor: '#fef2f2',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#fca5a5',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AppIcon name="alert-circle" size={18} color="#dc2626" />
                    <AppText style={{ fontWeight: '700', fontSize: 13, color: '#b91c1c' }}>
                      Budget Too Low
                    </AppText>
                  </View>
                  <AppText style={{ fontSize: 11, color: '#991b1b', lineHeight: 16 }}>
                    For {numPersons} travelers and {numDays} days, minimum estimated expenses are PKR {(numPersons * numDays * 3500).toLocaleString()}. Please increase budget or reduce days for comfortable accommodations & travel.
                  </AppText>
                </View>
              )}
            </View>
          )}

          {/* Overall Comfort Level */}
          <AppText style={[styles.sublabel, { marginTop: 14 }]}>Overall Comfort Level:</AppText>
          <View style={styles.comfortRow}>
            {COMFORT_LEVELS.map((lvl) => {
              const active = comfortLevel === lvl.id;
              return (
                <TouchableOpacity
                  key={lvl.id}
                  style={[styles.comfortCard, active && styles.comfortCardActive]}
                  onPress={() => setComfortLevel(lvl.id)}
                >
                  <View style={[styles.comfortBadge, active && styles.comfortBadgeActive]}>
                    <AppText style={[styles.comfortBadgeText, active && styles.comfortBadgeTextActive]}>{lvl.badge}</AppText>
                  </View>
                  <AppText style={[styles.comfortTitle, active && styles.comfortTitleActive]}>{lvl.label}</AppText>
                  <AppText style={[styles.comfortDesc, active && styles.comfortDescActive]}>{lvl.desc}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. TRAVEL INTERESTS (Between Style/Group and Dates) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="heart-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>4. Travel Interests</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Select your preferred travel activities and passions for this trip:
          </AppText>
          <View style={styles.interestsWrap}>
            {ALL_INTERESTS.map((interest) => {
              const active = selectedInterests.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[styles.interestChip, active && styles.interestChipActive]}
                  onPress={() => toggleInterest(interest)}
                >
                  <AppText style={[styles.interestText, active && styles.interestTextActive]}>
                    {active ? `✓ ${interest}` : interest}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. DATES & TRIP DURATION */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="calendar-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>5. Journey Dates & Duration</AppText>
          </View>

          {/* Date Error Banner (Real-time error feedback) */}
          {dateError ? (
            <View style={styles.dateErrorBox}>
              <AppIcon name="alert-circle" size={18} color="#b43b36" />
              <View style={{ flex: 1 }}>
                <AppText style={styles.dateErrorTitle}>Incorrect Date Selected</AppText>
                <AppText style={styles.dateErrorText}>{dateError}</AppText>
              </View>
            </View>
          ) : null}

          {/* Start Date Input with Interactive Calendar Trigger */}
          <View style={styles.inputLabelRow}>
            <AppText style={styles.sublabel}>Start Date:</AppText>
            <TouchableOpacity
              onPress={() => openCalendarPicker('start')}
              accessibilityLabel="Open Start Date Calendar Picker"
            >
              <AppText style={styles.openCalendarLink}>📅 Open Calendar</AppText>
            </TouchableOpacity>
          </View>
          <View style={[
            styles.inputWrap,
            dateError && startDate && (startDate < getTodayStr()) && styles.inputWrapError
          ]}>
            <TouchableOpacity
              onPress={() => openCalendarPicker('start')}
              style={styles.calendarTriggerBtn}
              accessibilityLabel="Open Start Date Calendar"
              accessibilityRole="button"
            >
              <AppIcon name="calendar" size={18} color={colors.forest} />
            </TouchableOpacity>
            <TextInput
              id="trip-start-date-input"
              nativeID="trip-start-date-input"
              name="startDate"
              accessibilityLabel="Trip Start Date"
              value={startDate}
              onChangeText={handleStartDateChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a098"
              style={styles.textInput}
            />
            <TouchableOpacity
              onPress={() => openCalendarPicker('start')}
              style={styles.calendarBadgeBtn}
              accessibilityLabel="Pick Start Date from Calendar"
              accessibilityRole="button"
            >
              <AppIcon name="calendar-outline" size={13} color={colors.forest} />
              <AppText style={styles.calendarBadgeText}>Pick Date</AppText>
            </TouchableOpacity>
          </View>

          {/* End Date Input with Interactive Calendar Trigger */}
          <View style={[styles.inputLabelRow, { marginTop: 10 }]}>
            <AppText style={styles.sublabel}>End Date:</AppText>
            <TouchableOpacity
              onPress={() => openCalendarPicker('end')}
              accessibilityLabel="Open End Date Calendar Picker"
            >
              <AppText style={styles.openCalendarLink}>📅 Open Calendar</AppText>
            </TouchableOpacity>
          </View>
          <View style={[
            styles.inputWrap,
            dateError && endDate && startDate && (endDate < startDate) && styles.inputWrapError
          ]}>
            <TouchableOpacity
              onPress={() => openCalendarPicker('end')}
              style={styles.calendarTriggerBtn}
              accessibilityLabel="Open End Date Calendar"
              accessibilityRole="button"
            >
              <AppIcon name="calendar-outline" size={18} color={colors.forest} />
            </TouchableOpacity>
            <TextInput
              id="trip-end-date-input"
              nativeID="trip-end-date-input"
              name="endDate"
              accessibilityLabel="Trip End Date"
              value={endDate}
              onChangeText={handleEndDateChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a098"
              style={styles.textInput}
            />
            <TouchableOpacity
              onPress={() => openCalendarPicker('end')}
              style={styles.calendarBadgeBtn}
              accessibilityLabel="Pick End Date from Calendar"
              accessibilityRole="button"
            >
              <AppIcon name="calendar-outline" size={13} color={colors.forest} />
              <AppText style={styles.calendarBadgeText}>Pick Date</AppText>
            </TouchableOpacity>
          </View>

          {/* Total Trip Days Input */}
          <AppText style={[styles.sublabel, { marginTop: 10 }]}>Total Trip Days:</AppText>
          <View style={styles.inputWrap}>
            <AppIcon name="time-outline" size={18} color={colors.muted} />
            <TextInput
              id="trip-days-input"
              nativeID="trip-days-input"
              name="days"
              accessibilityLabel="Total Trip Days"
              value={days}
              onChangeText={handleDaysChange}
              keyboardType="numeric"
              placeholder="e.g. 3"
              placeholderTextColor="#94a098"
              style={styles.textInput}
            />
            <AppText style={styles.perPersonSuffix}>days</AppText>
          </View>

          {/* Dynamic Journey Schedule Preview */}
          <View style={[styles.schedulePreviewBox, dateError && styles.schedulePreviewBoxError]}>
            <AppIcon
              name={dateError ? 'alert-circle' : (startDate && (endDate || days) ? 'checkmark-circle' : 'time-outline')}
              size={18}
              color={dateError ? '#b43b36' : (startDate && (endDate || days) ? colors.green : colors.forest)}
            />
            <View style={{ flex: 1 }}>
              <AppText style={[styles.schedulePreviewTitle, dateError && { color: '#b43b36' }]}>
                {dateError ? 'Date Notice' : 'Journey Schedule'}
              </AppText>
              <AppText style={[styles.schedulePreviewDates, dateError && { color: '#b43b36' }]}>
                {dateError
                  ? dateError
                  : startDate && (endDate || days)
                    ? `📅 ${startDate} ➔ ${endDate || computeEndDate(startDate, days)} (${numDays || 1} Days / ${nights} Nights)`
                    : '📅 Click the calendar or enter start date & days'}
              </AppText>
            </View>
          </View>
        </View>

        {/* 6. TRANSPORT BREAKDOWN: RENTAL CAR vs OWN CAR (Conditionally rendered when transport is needed) */}
        {(isCompany || transportRequired) && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="car-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>6. Transport Selection</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Choose whether you are using your personal car or booking a rental vehicle:
          </AppText>

          {/* RENTAL vs OWN TOGGLE (Available in customized mode; company mode is dedicated chauffeur) */}
          {tripMode === 'customized' ? (
            <View style={styles.transportToggleContainer}>
              <TouchableOpacity
                style={[styles.transportToggleBtn, transportChoice === 'rental' && styles.transportToggleBtnActive]}
                onPress={() => setTransportChoice('rental')}
              >
                <AppIcon name="key-outline" size={18} color={transportChoice === 'rental' ? colors.white : colors.forest} />
                <AppText style={[styles.transportToggleBtnText, transportChoice === 'rental' && styles.transportToggleBtnTextActive]}>
                  Rental Car
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.transportToggleBtn, transportChoice === 'own' && styles.transportToggleBtnActive]}
                onPress={() => setTransportChoice('own')}
              >
                <AppIcon name={travelType === 'Solo' ? "bicycle-outline" : "car-sport-outline"} size={18} color={transportChoice === 'own' ? colors.white : colors.forest} />
                <AppText style={[styles.transportToggleBtnText, transportChoice === 'own' && styles.transportToggleBtnTextActive]}>
                  {travelType === 'Solo' ? 'Own Bike / Car' : 'Own Car (Personal)'}
                </AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.companyServiceBanner}>
              <AppIcon name="shield-checkmark" size={18} color="#0369a1" />
              <AppText style={styles.companyServiceBannerText}>
                Company Tour Services: Dedicated commercial tourist vehicle with certified mountain chauffeur included in package.
              </AppText>
            </View>
          )}

          {isOwnCar ? (
            <View style={styles.ownCarInfoBox}>
              <View style={styles.ownCarBadgeRow}>
                <AppIcon name="checkmark-circle" size={24} color="#15803d" />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.ownCarTitle}>
                    {travelType === 'Solo' ? 'Traveling on Your Own Bike / Car' : 'Traveling in Your Own Car'}
                  </AppText>
                  <AppText style={styles.ownCarDesc}>
                    ✅ Apna personal vehicle (Car / Bike) hai! Rental charges are <AppText style={{ fontWeight: 'bold' }}>PKR 0</AppText> and will <AppText style={{ fontWeight: 'bold' }}>NOT</AppText> be cut from your budget.
                  </AppText>
                </View>
              </View>

              <View style={styles.transportFormulaBox}>
                <AppText style={styles.transportFormulaLabel}>OWN VEHICLE BUDGET DEDUCTION:</AppText>
                <AppText style={styles.transportFormulaText}>
                  Rent PKR 0 + Fuel (Self-Arranged) = <AppText style={{ fontWeight: 'bold', color: colors.forest }}>PKR 0 (Free / No Deduction)</AppText>
                </AppText>
              </View>

              <View style={styles.sectionRemainingBadge}>
                <AppIcon name="wallet-outline" size={16} color="#15803d" />
                <AppText style={styles.sectionRemainingText}>
                  Remaining Budget after Transport: <AppText style={{ fontWeight: 'bold', color: '#15803d' }}>PKR {remainingAfterTransport.toLocaleString()}</AppText> (Full Budget Preserved)
                </AppText>
              </View>
            </View>
          ) : (
            /* Rental Car / Bike Options with Dynamic Dropdown */
            <>
              <View style={{ marginTop: 6 }}>
                <View style={styles.dropdownLabelRow}>
                  <AppText style={styles.sublabel}>
                    {travelType === 'Solo' ? '🏍️ / 🚗 Select Bike or Car:' : '🚗 Select Vehicle:'}
                  </AppText>
                  {matchingVehicles.length > 0 && (
                    <View style={styles.withinBadge}>
                      <AppText style={styles.withinBadgeText}>
                        {matchingVehicles.length} within budget
                      </AppText>
                    </View>
                  )}
                </View>

                {/* Quick Select Recommended Vehicles Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickVehScroll}>
                  {matchingVehicles.slice(0, 5).map((v) => {
                    const isSel = vehicleType === v.id;
                    return (
                      <TouchableOpacity
                        key={`quick-${v.id}`}
                        style={[styles.quickVehPill, isSel && styles.quickVehPillActive]}
                        onPress={() => handleSelectVehicle(v)}
                      >
                        <AppIcon name={v.icon} size={14} color={isSel ? colors.white : colors.forest} style={{ marginRight: 5 }} />
                        <AppText style={[styles.quickVehText, isSel && styles.quickVehTextActive]}>
                          {v.name.split('/')[0].trim()} · PKR {v.rentPerDay.toLocaleString()}/d
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Dropdown Header Trigger */}
                <TouchableOpacity
                  style={[
                    styles.vehicleDropdownHeader,
                    vehicleDropdownOpen && styles.vehicleDropdownHeaderOpen,
                  ]}
                  onPress={() => setVehicleDropdownOpen((prev) => !prev)}
                  accessibilityRole="combobox"
                  accessibilityLabel="Select Vehicle Dropdown"
                >
                  <View style={styles.dropdownHeaderLeft}>
                    <View style={styles.dropdownIconCircle}>
                      <AppIcon name={currentVehicle.icon} size={22} color={colors.forest} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.dropdownVehicleName}>
                        {currentVehicle.name}
                      </AppText>
                      <AppText style={styles.dropdownVehicleMeta}>
                        {currentVehicle.persons} • 🧳 {currentVehicle.luggage} • PKR {currentVehicle.rentPerDay.toLocaleString()}/day
                      </AppText>
                      {currentVehicle.budgetBadge ? (
                        <View style={[
                          styles.vehItemBadge,
                          currentVehicle.badgeType === 'luxury' ? styles.vehItemBadgeLuxury : currentVehicle.badgeType === 'budget' ? styles.vehItemBadgeBudget : styles.vehItemBadgeStandard,
                          { marginTop: 3, alignSelf: 'flex-start' }
                        ]}>
                          <AppText style={[
                            styles.vehItemBadgeText,
                            currentVehicle.badgeType === 'luxury' ? styles.vehItemBadgeTextLuxury : currentVehicle.badgeType === 'budget' ? styles.vehItemBadgeTextBudget : styles.vehItemBadgeTextStandard
                          ]}>
                            {currentVehicle.budgetBadge}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.dropdownArrowWrap}>
                    <AppIcon
                      name={vehicleDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.forest}
                    />
                  </View>
                </TouchableOpacity>

                {/* Dropdown Options List */}
                {vehicleDropdownOpen && (
                  <View style={styles.vehicleDropdownList}>
                    {matchingVehicles.map((veh) => {
                      const isSelected = vehicleType === veh.id;
                      return (
                        <TouchableOpacity
                          key={veh.id}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                          ]}
                          onPress={() => handleSelectVehicle(veh)}
                        >
                          <View style={styles.dropdownItemLeft}>
                            <AppIcon
                              name={veh.icon}
                              size={20}
                              color={isSelected ? colors.forest : colors.muted}
                            />
                            <View style={{ flex: 1 }}>
                              <AppText
                                style={[
                                  styles.dropdownItemTitle,
                                  isSelected && styles.dropdownItemTitleSelected,
                                ]}
                              >
                                {veh.name}
                              </AppText>
                              <AppText style={styles.dropdownItemSubtitle}>
                                {veh.persons} • Rent: PKR {veh.rentPerDay.toLocaleString()}/day • Fuel: PKR {veh.fuelPerDay.toLocaleString()}/day
                              </AppText>
                              {veh.budgetBadge ? (
                                <View style={[
                                  styles.vehItemBadge,
                                  veh.badgeType === 'luxury' ? styles.vehItemBadgeLuxury : veh.badgeType === 'budget' ? styles.vehItemBadgeBudget : styles.vehItemBadgeStandard
                                ]}>
                                  <AppText style={[
                                    styles.vehItemBadgeText,
                                    veh.badgeType === 'luxury' ? styles.vehItemBadgeTextLuxury : veh.badgeType === 'budget' ? styles.vehItemBadgeTextBudget : styles.vehItemBadgeTextStandard
                                  ]}>
                                    {veh.budgetBadge}
                                  </AppText>
                                </View>
                              ) : null}
                            </View>
                          </View>
                          {isSelected ? (
                            <AppIcon name="checkmark-circle" size={20} color={colors.forest} />
                          ) : (
                            <View style={styles.selectPill}>
                              <AppText style={styles.selectPillText}>Select</AppText>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Selected Vehicle Details Card */}
                <View style={styles.selectedVehicleSummaryCard}>
                  <View style={styles.summaryTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AppIcon name="checkmark-circle" size={16} color="#15803d" />
                      <AppText style={styles.summaryTitle}>
                        {currentVehicle.name}
                      </AppText>
                    </View>
                    <View style={styles.withinBadge}>
                      <AppText style={styles.withinBadgeText}>✓ Within Budget</AppText>
                    </View>
                  </View>
                  <AppText style={styles.summaryDetails}>
                    Capacity: {currentVehicle.persons} • Luggage: {currentVehicle.luggage}
                  </AppText>
                  <AppText style={styles.summaryPricing}>
                    Daily Rent: <AppText style={{ fontWeight: 'bold' }}>PKR {currentVehicle.rentPerDay.toLocaleString()}/day</AppText> • Fuel: PKR {currentVehicle.fuelPerDay.toLocaleString()}/day
                  </AppText>
                  <AppText style={styles.summaryTripCost}>
                    Trip Transport Total ({numDays || 1} day{(numDays || 1) > 1 ? 's' : ''}): <AppText style={{ fontWeight: 'bold', color: colors.forest }}>PKR {estimatedVehicleCost.toLocaleString()}</AppText>
                  </AppText>
                </View>
              </View>

              {/* Transport Formula Box */}
              <View style={styles.transportFormulaBox}>
                <AppText style={styles.transportFormulaLabel}>TRANSPORT ESTIMATE FORMULA:</AppText>
                <AppText style={styles.transportFormulaText}>
                  Rent PKR {currentVehicle.rentPerDay.toLocaleString()} / day × {numDays || 1}d = <AppText style={{ fontWeight: 'bold', color: colors.forest }}>PKR {estimatedVehicleCost.toLocaleString()}</AppText>
                </AppText>
              </View>

              <View style={styles.sectionRemainingBadge}>
                <AppIcon name="wallet-outline" size={16} color="#15803d" />
                <AppText style={styles.sectionRemainingText}>
                  Remaining Budget after Transport: <AppText style={{ fontWeight: 'bold', color: '#15803d' }}>PKR {remainingAfterTransport.toLocaleString()}</AppText>
                </AppText>
              </View>
            </>
          )}
        </View>
        )}

        {/* 7. ROUTES & HIGHWAYS BREAKDOWN */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="trail-sign-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>7. Highway & Scenic Route Selection</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Select which highway route or scenic pass to take from {startLocation || 'your origin'} towards {destination || 'your destination'}:
          </AppText>

          <View style={{ gap: 8, marginTop: 4 }}>
            {dynamicRoutes.map((routeItem) => {
              const isSelected = preferredRoute === routeItem;
              return (
                <TouchableOpacity
                  key={routeItem}
                  style={[styles.routeChoiceCard, isSelected && styles.routeChoiceCardSelected]}
                  onPress={() => setPreferredRoute(routeItem)}
                >
                  <AppIcon
                    name={isSelected ? "navigate-circle" : "trail-sign-outline"}
                    size={20}
                    color={isSelected ? colors.forest : colors.muted}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText style={[styles.routeChoiceTitle, isSelected && styles.routeChoiceTitleSelected]}>
                      {routeItem}
                    </AppText>
                  </View>
                  {isSelected ? (
                    <AppIcon name="checkmark-circle" size={18} color={colors.forest} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputWrap}>
            <AppIcon name="trail-sign" size={18} color={colors.muted} />
            <TextInput
              id="trip-custom-route-input"
              nativeID="trip-custom-route-input"
              name="customRoute"
              accessibilityLabel="Custom Route or Mountain Pass"
              value={customRouteInput}
              onChangeText={(text) => {
                setCustomRouteInput(text);
                if (text.trim()) setPreferredRoute(text);
              }}
              placeholder="Or enter a custom route / mountain pass..."
              placeholderTextColor="#94a098"
              style={styles.textInput}
            />
          </View>

          <View style={styles.routePreviewBox}>
            <AppText style={styles.routePreviewLabel}>SELECTED JOURNEY ROUTE:</AppText>
            <AppText style={styles.routePreviewText}>
              🚗 {startLocation} ➔ <AppText style={{ fontWeight: 'bold' }}>{preferredRoute || 'Standard Scenic Route'}</AppText> ➔ {destination}
            </AppText>
          </View>
        </View>

        {/* 8. HOTEL REQUIREMENT & IN-APP SELECTION WITH SMART EXPENSE CONTROLLER */}
        <View style={styles.card}>
          <View style={styles.hotelHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardHeaderRow}>
                <AppIcon name="bed-outline" size={20} color={colors.forest} />
                <AppText variant="heading" style={styles.cardTitle}>8. Hotel Stay</AppText>
              </View>
              <AppText variant="caption" color={colors.muted}>
                Would you like to include a hotel stay in {destination}? ({nights} nights):
              </AppText>
            </View>

            {/* YES / NO TOGGLE */}
            <View style={styles.toggleWrap}>
              <TouchableOpacity
                style={[styles.toggleBtn, hotelRequired && styles.toggleBtnActive]}
                onPress={() => setHotelRequired(true)}
              >
                <AppText style={[styles.toggleText, hotelRequired && styles.toggleTextActive]}>YES</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !hotelRequired && styles.toggleBtnActive]}
                onPress={() => {
                  setHotelRequired(false);
                  setSelectedHotel(null);
                  setSelectedRoom(null);
                }}
              >
                <AppText style={[styles.toggleText, !hotelRequired && styles.toggleTextActive]}>NO</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* SMART EXPENSE CONTROLLER STATUS BANNER */}
          {hotelRequired ? (
            <View style={[
              styles.smartExpenseBanner,
              dailyHotelBudget < 3000
                ? styles.smartExpenseBudget
                : dailyHotelBudget >= 7000
                  ? styles.smartExpenseLuxury
                  : styles.smartExpenseStandard
            ]}>
              <AppIcon
                name={dailyHotelBudget < 3000 ? "shield-outline" : dailyHotelBudget >= 7000 ? "sparkles" : "checkmark-circle"}
                size={18}
                color={dailyHotelBudget < 3000 ? "#0284c7" : dailyHotelBudget >= 7000 ? "#b45309" : "#15803d"}
              />
              <View style={{ flex: 1 }}>
                <AppText style={[
                  styles.smartExpenseTitle,
                  { color: dailyHotelBudget < 3000 ? "#0369a1" : dailyHotelBudget >= 7000 ? "#92400e" : "#166534" }
                ]}>
                  {dailyHotelBudget < 3000
                    ? `Smart Controller: Budget Mode (< PKR 3,000/night)`
                    : dailyHotelBudget >= 7000
                      ? `Smart Controller: Luxury Mode (≥ PKR 7,000/night)`
                      : `Smart Controller: Standard Mode (PKR 3,000 - 7,000/night)`}
                </AppText>
                <AppText style={styles.smartExpenseNote}>
                  {dailyHotelBudget < 3000
                    ? `Daily hotel allocation: PKR ${dailyHotelBudget.toLocaleString()}/night. Luxury 4★/5★ hotels are hidden; displaying verified budget-friendly guest houses & lodges.`
                    : dailyHotelBudget >= 7000
                      ? `Daily hotel allocation: PKR ${dailyHotelBudget.toLocaleString()}/night. Luxury 4★ and 5★ resorts, executive rooms & suites are fully unlocked!`
                      : `Daily hotel allocation: PKR ${dailyHotelBudget.toLocaleString()}/night. Quality 3★ family hotels & deluxe standard rooms available.`}
                </AppText>
              </View>
            </View>
          ) : null}

          {hotelRequired ? (
            <View style={{ gap: 12, marginTop: 4 }}>
              {/* Rooms Quantity Stepper */}
              <View style={styles.roomsQuantityBox}>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.roomsQuantityTitle}>Rooms Quantity:</AppText>
                  <AppText style={styles.roomsQuantityDesc}>
                    {roomsQuantity} Room{roomsQuantity > 1 ? 's' : ''} × {nights} Nights ({numberOfPersons} travelers)
                  </AppText>
                </View>
                <View style={styles.roomsStepperWrap}>
                  <TouchableOpacity
                    style={styles.roomsStepperBtn}
                    onPress={() => setRoomsQuantity(Math.max(1, roomsQuantity - 1))}
                  >
                    <AppText style={styles.roomsStepperBtnText}>−</AppText>
                  </TouchableOpacity>
                  <AppText style={styles.roomsStepperValue}>{roomsQuantity}</AppText>
                  <TouchableOpacity
                    style={styles.roomsStepperBtn}
                    onPress={() => setRoomsQuantity(roomsQuantity + 1)}
                  >
                    <AppText style={styles.roomsStepperBtnText}>+</AppText>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Hotel Availability Notice / Unavailable Fallback */}
              {hotelUnavailableNotice ? (
                <View style={styles.alertBoxWarning}>
                  <AppIcon name="warning" size={18} color={colors.amber} />
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.alertTitle}>Hotel Unavailable</AppText>
                    <AppText style={styles.alertMessage}>{hotelUnavailableNotice}</AppText>
                    {alternativeHotels.length > 0 ? (
                      <AppText style={styles.alertSub}>We found alternative hotels in {destination} for you below:</AppText>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {hotelsLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.forest} />
                  <AppText style={styles.loadingText}>Filtering verified hotels in {destination}...</AppText>
                </View>
              ) : hotels.length === 0 ? (
                <View style={styles.noHotelsBox}>
                  <AppText style={styles.noHotelsText}>
                    No hotels registered for {destination} in this price tier yet. You can still plan with hotels toggle set to NO.
                  </AppText>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hotelScroll}>
                  {sortedHotels.map((hotel) => {
                    const isSelected = selectedHotel?.id === hotel.id;
                    return (
                      <TouchableOpacity
                        key={hotel.id}
                        style={[styles.hotelCard, isSelected && styles.hotelCardSelected]}
                        onPress={() => handleSelectHotel(hotel)}
                      >
                        <Image
                          source={{ uri: hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500' }}
                          style={styles.hotelImage}
                        />
                        <View style={styles.hotelDetails}>
                          <View style={styles.hotelTopRow}>
                            <AppText style={styles.hotelName} numberOfLines={1}>{hotel.name}</AppText>
                            <View style={styles.ratingBadge}>
                              <AppIcon name="star" size={12} color="#e5a93b" />
                              <AppText style={styles.ratingNum}>{hotel.rating || 4.5}</AppText>
                            </View>
                          </View>
                          <AppText style={styles.hotelCity}>📍 {hotel.city}</AppText>
                          {hotel.budgetBadge ? (
                            <View style={[
                              styles.hotelBudgetBadgePill,
                              hotel.badgeType === 'luxury' ? styles.hotelBudgetBadgeLuxury : hotel.badgeType === 'budget' ? styles.hotelBudgetBadgeBudget : styles.hotelBudgetBadgeStandard
                            ]}>
                              <AppText style={[
                                styles.hotelBudgetBadgeText,
                                hotel.badgeType === 'luxury' ? styles.hotelBudgetBadgeTextLuxury : hotel.badgeType === 'budget' ? styles.hotelBudgetBadgeTextBudget : styles.hotelBudgetBadgeTextStandard
                              ]}>
                                {hotel.budgetBadge}
                              </AppText>
                            </View>
                          ) : null}
                          <AppText style={styles.hotelPrice}>
                            PKR {Number(hotel.pricePerNight).toLocaleString()} <AppText style={styles.nightText}>/ night</AppText>
                          </AppText>
                          {isSelected ? (
                            <View style={styles.selectedHotelBadge}>
                              <AppIcon name="checkmark-circle" size={14} color={colors.white} />
                              <AppText style={styles.selectedHotelText}>Selected</AppText>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Room Selection */}
              {selectedHotel && selectedHotel.rooms?.length ? (
                <View style={styles.roomSelectContainer}>
                  <AppText style={styles.sublabel}>Select Room Type in {selectedHotel.name}:</AppText>
                  <View style={styles.roomsRow}>
                    {selectedHotel.rooms.map((room) => {
                      const isRoomSel = selectedRoom?.id === room.id;
                      const isAvail = room.available !== 0;
                      return (
                        <TouchableOpacity
                          key={room.id}
                          style={[
                            styles.roomChip,
                            isRoomSel && styles.roomChipSelected,
                            !isAvail && styles.roomChipDisabled,
                          ]}
                          onPress={() => handleSelectRoom(room)}
                        >
                          <View style={{ flex: 1 }}>
                            <AppText style={[styles.roomName, isRoomSel && styles.roomNameSelected]}>
                              {room.name}
                            </AppText>
                            <AppText style={styles.roomPrice}>
                              PKR {Number(room.price).toLocaleString()} / night
                            </AppText>
                          </View>
                          <View style={[styles.availBadge, !isAvail && styles.availBadgeRed]}>
                            <AppText style={styles.availText}>{isAvail ? `${room.available} left` : 'Sold out'}</AppText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* HOTEL BUDGET ADJUSTMENT POPUP / BANNER */}
              {hotelBudgetShortfall > 0 && isHotelNeeded && !hotelAdjustmentDismissed ? (
                <View style={styles.serviceAdjustmentBanner}>
                  <View style={styles.serviceAdjustmentHeader}>
                    <AppIcon name="alert-circle" size={20} color="#b45309" />
                    <AppText style={styles.serviceAdjustmentTitle}>Accommodation Budget Notice</AppText>
                  </View>
                  <AppText style={styles.serviceAdjustmentDesc}>
                    Your remaining budget after transportation and food is PKR {Math.max(0, remainingAfterFood).toLocaleString()}. The selected accommodation costs PKR {hotelTotalCost.toLocaleString()} ({effectiveRooms} room{effectiveRooms > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}).
                  </AppText>
                  <View style={styles.serviceAdjustmentActions}>
                    <TouchableOpacity
                      style={styles.serviceAdjustmentBtnPrimary}
                      onPress={() => {
                        setHotelRequired(false);
                        setSelectedHotel(null);
                        setHotelAdjustmentDismissed(true);
                      }}
                    >
                      <AppText style={styles.serviceAdjustmentBtnTextPrimary}>
                        Manage Accommodation Independently (Save PKR {hotelTotalCost.toLocaleString()})
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.serviceAdjustmentBtnSecondary}
                      onPress={() => {
                        if (hotels.length > 0) {
                          const cheapest = [...hotels].sort((a, b) => (Number(a.pricePerNight) || 0) - (Number(b.pricePerNight) || 0))[0];
                          if (cheapest) handleSelectHotel(cheapest);
                        }
                        setHotelAdjustmentDismissed(true);
                      }}
                    >
                      <AppText style={styles.serviceAdjustmentBtnTextSecondary}>
                        Select Economical Hotel
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Hotel Cost & Budget Calculation */}
              {selectedHotel ? (
                <View style={styles.budgetCalcBox}>
                  <View style={styles.calcRow}>
                    <AppText style={styles.calcLabel}>Total Hotel Cost ({nights} nights, {roomsQuantity} room{roomsQuantity > 1 ? 's' : ''}):</AppText>
                    <AppText style={styles.calcValue}>PKR {hotelTotalCost.toLocaleString()}</AppText>
                  </View>
                  <View style={styles.calcRow}>
                    <AppText style={styles.calcLabel}>Remaining Budget after Hotel:</AppText>
                    <AppText style={[styles.calcValue, { color: remainingAfterHotel < 0 ? colors.red : colors.forest, fontWeight: '700' }]}>
                      PKR {Math.max(0, remainingAfterHotel).toLocaleString()}
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.skippedServiceBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon name="bed-outline" size={20} color={colors.forest} />
                <AppText style={styles.skippedServiceTitle}>No Hotel Included (Self-Arranged / Skipped)</AppText>
              </View>
              <AppText style={styles.skippedServiceSubtitle}>
                Hotel cost: PKR 0 • You will arrange lodging independently.
              </AppText>
              <View style={styles.sectionRemainingBadge}>
                <AppText style={styles.sectionRemainingLabel}>Remaining Budget after Hotel:</AppText>
                <AppText style={styles.sectionRemainingVal}>PKR {Math.max(0, remainingAfterHotel).toLocaleString()}</AppText>
              </View>
            </View>
          )}
        </View>

        {/* 9. FOOD POLICY & REGIONAL MEAL PLAN */}
        <View style={styles.card}>
          <View style={styles.hotelHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardHeaderRow}>
                <AppIcon name="restaurant-outline" size={20} color={colors.forest} />
                <AppText variant="heading" style={styles.cardTitle}>
                  9. Food & Meal Policy ({currentFoodMenu?.cityName || destination} Authentic Cuisine)
                </AppText>
              </View>
              <AppText variant="caption" color={colors.muted}>
                Would you like to include food in your trip package?
              </AppText>
            </View>

            {/* YES / NO TOGGLE */}
            <View style={styles.toggleWrap}>
              <TouchableOpacity
                style={[styles.toggleBtn, (foodRequired && foodChoice !== 'self') && styles.toggleBtnActive]}
                onPress={() => {
                  setFoodRequired(true);
                  setFoodChoice('included');
                  setFoodAdjustmentDismissed(false);
                }}
              >
                <AppText style={[styles.toggleText, (foodRequired && foodChoice !== 'self') && styles.toggleTextActive]}>YES</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, (!foodRequired || foodChoice === 'self') && styles.toggleBtnActive]}
                onPress={() => {
                  setFoodRequired(false);
                  setFoodChoice('self');
                  setFoodAdjustmentDismissed(true);
                }}
              >
                <AppText style={[styles.toggleText, (!foodRequired || foodChoice === 'self') && styles.toggleTextActive]}>NO</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* FOOD BUDGET ADJUSTMENT POPUP / BANNER */}
          {foodBudgetShortfall > 0 && isFoodNeeded && !foodAdjustmentDismissed ? (
            <View style={styles.serviceAdjustmentBanner}>
              <View style={styles.serviceAdjustmentHeader}>
                <AppIcon name="alert-circle" size={20} color="#b45309" />
                <AppText style={styles.serviceAdjustmentTitle}>Food Budget Notice</AppText>
              </View>
              <AppText style={styles.serviceAdjustmentDesc}>
                Your budget is currently insufficient to cover both transportation and all selected food services. We can arrange your transportation within your budget. Would you like to manage food independently?
              </AppText>
              <View style={styles.serviceAdjustmentActions}>
                <TouchableOpacity
                  style={styles.serviceAdjustmentBtnPrimary}
                  onPress={() => {
                    setFoodChoice('self');
                    setFoodRequired(false);
                    setFoodAdjustmentDismissed(true);
                  }}
                >
                  <AppText style={styles.serviceAdjustmentBtnTextPrimary}>
                    Manage Food Myself (Save PKR {foodTotalCost.toLocaleString()})
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.serviceAdjustmentBtnSecondary}
                  onPress={() => {
                    setSelectedMeals((prev) => ({ ...prev, dinner: false, lunch: false }));
                    setFoodAdjustmentDismissed(true);
                  }}
                >
                  <AppText style={styles.serviceAdjustmentBtnTextSecondary}>
                    Select Fewer Meals (Breakfast Only)
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {(!foodRequired || foodChoice === 'self') ? (
            <View style={styles.skippedServiceBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon name="restaurant-outline" size={20} color={colors.forest} />
                <AppText style={styles.skippedServiceTitle}>No Food Included (Self-Arranged / Skipped)</AppText>
              </View>
              <AppText style={styles.skippedServiceSubtitle}>
                Food cost: PKR 0 • You have chosen to handle meals on your own at local eateries and dhabas.
              </AppText>
              <View style={styles.sectionRemainingBadge}>
                <AppText style={styles.sectionRemainingLabel}>Remaining Budget after Food:</AppText>
                <AppText style={styles.sectionRemainingVal}>PKR {Math.max(0, remainingAfterFood).toLocaleString()}</AppText>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 4 }}>
              {/* Breakfast Card */}
              <TouchableOpacity
                style={[styles.mealSelectCard, selectedMeals.breakfast && styles.mealSelectCardActive]}
                onPress={() => handleToggleMeal('breakfast')}
              >
                <View style={styles.mealCheckRow}>
                  <AppIcon name={selectedMeals.breakfast ? "checkbox" : "square-outline"} size={20} color={selectedMeals.breakfast ? colors.forest : colors.muted} />
                  <AppText style={styles.mealName}>🍳 Breakfast ({currentFoodMenu?.meals?.breakfast?.title || 'Morning Breakfast'})</AppText>
                  <View style={[styles.mealPriceBadge, selectedMeals.breakfast && styles.mealPriceBadgeActive]}>
                    <AppText style={[styles.mealPriceBadgeText, selectedMeals.breakfast && styles.mealPriceBadgeTextActive]}>
                      PKR {(selectedMeals.breakfast ? breakfastRate * numPersons * (numDays || 1) : 0).toLocaleString()}
                    </AppText>
                  </View>
                </View>
                <AppText style={styles.mealMenuRateText}>
                  PKR {breakfastRate.toLocaleString()} / person / day
                </AppText>
                <View style={{ marginTop: 6, gap: 4, paddingLeft: 2 }}>
                  {(currentFoodMenu?.meals?.breakfast?.items || []).map((item) => (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <AppText style={{ color: colors.forest, fontWeight: 'bold', fontSize: 13, lineHeight: 18 }}>•</AppText>
                      <View style={{ flex: 1 }}>
                        <AppText style={{ fontSize: 13, color: colors.slate, fontWeight: '600' }}>
                          {item.name} {item.isSignature ? <AppText style={{ color: '#b45309', fontSize: 11, fontWeight: 'bold' }}>[★ Specialty]</AppText> : null}
                        </AppText>
                        {item.desc ? (
                          <AppText style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                            {item.desc}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              {/* Lunch Card */}
              <TouchableOpacity
                style={[styles.mealSelectCard, selectedMeals.lunch && styles.mealSelectCardActive]}
                onPress={() => handleToggleMeal('lunch')}
              >
                <View style={styles.mealCheckRow}>
                  <AppIcon name={selectedMeals.lunch ? "checkbox" : "square-outline"} size={20} color={selectedMeals.lunch ? colors.forest : colors.muted} />
                  <AppText style={styles.mealName}>🥪 Lunch ({currentFoodMenu?.meals?.lunch?.title || 'Midday Lunch'})</AppText>
                  <View style={[styles.mealPriceBadge, selectedMeals.lunch && styles.mealPriceBadgeActive]}>
                    <AppText style={[styles.mealPriceBadgeText, selectedMeals.lunch && styles.mealPriceBadgeTextActive]}>
                      PKR {(selectedMeals.lunch ? lunchRate * numPersons * (numDays || 1) : 0).toLocaleString()}
                    </AppText>
                  </View>
                </View>
                <AppText style={styles.mealMenuRateText}>
                  PKR {lunchRate.toLocaleString()} / person / day
                </AppText>
                <View style={{ marginTop: 6, gap: 4, paddingLeft: 2 }}>
                  {(currentFoodMenu?.meals?.lunch?.items || []).map((item) => (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <AppText style={{ color: colors.forest, fontWeight: 'bold', fontSize: 13, lineHeight: 18 }}>•</AppText>
                      <View style={{ flex: 1 }}>
                        <AppText style={{ fontSize: 13, color: colors.slate, fontWeight: '600' }}>
                          {item.name} {item.isSignature ? <AppText style={{ color: '#b45309', fontSize: 11, fontWeight: 'bold' }}>[★ Specialty]</AppText> : null}
                        </AppText>
                        {item.desc ? (
                          <AppText style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                            {item.desc}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              {/* Dinner Card */}
              <TouchableOpacity
                style={[styles.mealSelectCard, selectedMeals.dinner && styles.mealSelectCardActive]}
                onPress={() => handleToggleMeal('dinner')}
              >
                <View style={styles.mealCheckRow}>
                  <AppIcon name={selectedMeals.dinner ? "checkbox" : "square-outline"} size={20} color={selectedMeals.dinner ? colors.forest : colors.muted} />
                  <AppText style={styles.mealName}>🍽️ Dinner ({currentFoodMenu?.meals?.dinner?.title || 'Evening Feast'})</AppText>
                  <View style={[styles.mealPriceBadge, selectedMeals.dinner && styles.mealPriceBadgeActive]}>
                    <AppText style={[styles.mealPriceBadgeText, selectedMeals.dinner && styles.mealPriceBadgeTextActive]}>
                      PKR {(selectedMeals.dinner ? dinnerRate * numPersons * (numDays || 1) : 0).toLocaleString()}
                    </AppText>
                  </View>
                </View>
                <AppText style={styles.mealMenuRateText}>
                  PKR {dinnerRate.toLocaleString()} / person / day
                </AppText>
                <View style={{ marginTop: 6, gap: 4, paddingLeft: 2 }}>
                  {(currentFoodMenu?.meals?.dinner?.items || []).map((item) => (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <AppText style={{ color: colors.forest, fontWeight: 'bold', fontSize: 13, lineHeight: 18 }}>•</AppText>
                      <View style={{ flex: 1 }}>
                        <AppText style={{ fontSize: 13, color: colors.slate, fontWeight: '600' }}>
                          {item.name} {item.isSignature ? <AppText style={{ color: '#b45309', fontSize: 11, fontWeight: 'bold' }}>[★ Specialty]</AppText> : null}
                        </AppText>
                        {item.desc ? (
                          <AppText style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
                            {item.desc}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              <View style={styles.foodTotalSummaryBanner}>
                <AppText style={styles.foodTotalSummaryText}>
                  Total Food Plan Cost: <AppText style={{ fontWeight: 'bold' }}>PKR {foodTotalCost.toLocaleString()}</AppText> ({numPersons} persons × {numDays || 1} days)
                </AppText>
              </View>

              <View style={styles.sectionRemainingBadge}>
                <AppText style={styles.sectionRemainingLabel}>Remaining Budget after Food:</AppText>
                <AppText style={[styles.sectionRemainingVal, { color: remainingAfterFood < 0 ? colors.red : colors.forest }]}>
                  PKR {Math.max(0, remainingAfterFood).toLocaleString()}
                </AppText>
              </View>
            </View>
          )}
        </View>

        {/* 10. DESTINATION ACTIVITIES & PAID ADVENTURES */}
        <View style={styles.card}>
          <View style={styles.hotelHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardHeaderRow}>
                <AppIcon name="ticket-outline" size={20} color={colors.forest} />
                <AppText variant="heading" style={styles.cardTitle}>
                  10. Destination Activities & Sights {destination ? `in ${destination}` : ''}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.muted}>
                Would you like to include activities in your trip?
              </AppText>
            </View>

            {/* YES / NO TOGGLE */}
            <View style={styles.toggleWrap}>
              <TouchableOpacity
                style={[styles.toggleBtn, activitiesRequired && styles.toggleBtnActive]}
                onPress={() => setActivitiesRequired(true)}
              >
                <AppText style={[styles.toggleText, activitiesRequired && styles.toggleTextActive]}>YES</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !activitiesRequired && styles.toggleBtnActive]}
                onPress={() => {
                  setActivitiesRequired(false);
                  setSelectedOptionalActivities([]);
                }}
              >
                <AppText style={[styles.toggleText, !activitiesRequired && styles.toggleTextActive]}>NO</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {!activitiesRequired ? (
            <View style={styles.skippedServiceBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppIcon name="ticket-outline" size={20} color={colors.forest} />
                <AppText style={styles.skippedServiceTitle}>Activities Skipped (Free Sightseeing Only)</AppText>
              </View>
              <AppText style={styles.skippedServiceSubtitle}>
                Activities cost: PKR 0 • Scenic viewpoints, heritage walks & standard photo stops are complimentary.
              </AppText>
              <View style={styles.sectionRemainingBadge}>
                <AppText style={styles.sectionRemainingLabel}>Remaining Budget after Activities:</AppText>
                <AppText style={styles.sectionRemainingVal}>PKR {Math.max(0, remainingAfterActivities).toLocaleString()}</AppText>
              </View>
            </View>
          ) : (
            <View style={{ gap: 8, marginTop: 4 }}>
              <AppText variant="caption" color={colors.muted}>
                Select only the paid adventure activities you want in {destination || 'your destination'}. Unselected activities cost PKR 0 and are NOT cut from your budget:
              </AppText>

              {currentActivitiesList.map((act) => {
                const isChecked = selectedOptionalActivities.includes(act.id);
                const priceText = act.pricePerGroup
                  ? `PKR ${act.pricePerGroup.toLocaleString()} / group`
                  : `PKR ${act.pricePerPerson.toLocaleString()} / person`;
                const totalActCost = act.pricePerGroup
                  ? act.pricePerGroup
                  : act.pricePerPerson * (numPersons || 1);

                return (
                  <TouchableOpacity
                    key={act.id}
                    style={[styles.activityCheckItem, isChecked && styles.activityCheckItemActive]}
                    onPress={() => handleToggleActivity(act.id)}
                  >
                    <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
                      {isChecked ? <AppIcon name="checkmark" size={14} color="#ffffff" /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.activityCheckHeader}>
                        <AppText style={[styles.activityCheckTitle, isChecked && styles.activityCheckTitleActive]}>
                          {act.name}
                        </AppText>
                        <View style={[styles.activityPriceBadge, isChecked && styles.activityPriceBadgeActive]}>
                          <AppText style={[styles.activityPriceBadgeText, isChecked && styles.activityPriceBadgeTextActive]}>
                            {priceText}
                          </AppText>
                        </View>
                      </View>
                      <AppText style={styles.activityCheckDesc}>{act.desc}</AppText>
                      {isChecked ? (
                        <AppText style={styles.activityTotalText}>
                          Total for {numPersons || 1} travelers: PKR {totalActCost.toLocaleString()}
                        </AppText>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.activityPolicyNotice}>
                <AppIcon name="information-circle-outline" size={16} color={colors.forest} />
                <AppText style={styles.activityPolicyNoticeText}>
                  Standard sightseeing, heritage viewpoints & photo stops are free. Total selected activities: PKR {calculatedActivitiesCost.toLocaleString()}.
                </AppText>
              </View>

              <View style={styles.sectionRemainingBadge}>
                <AppText style={styles.sectionRemainingLabel}>Remaining Budget after Activities:</AppText>
                <AppText style={styles.sectionRemainingVal}>PKR {Math.max(0, remainingAfterActivities).toLocaleString()}</AppText>
              </View>
            </View>
          )}
        </View>

        {/* 10B. MAKE YOUR TRIP MORE SPECIAL! (OPTIONAL EXTRA EXPERIENCES WHEN BUDGET REMAINS) */}
        {remainingBeforeExtras > 0 ? (
          <View style={styles.card}>
            <View style={styles.hotelHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeaderRow}>
                  <AppIcon name="sparkles" size={20} color="#b45309" />
                  <AppText variant="heading" style={[styles.cardTitle, { color: '#92400e' }]}>
                    ✨ Make Your Trip More Special in {destination || 'Pakistan'}!
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.muted}>
                  You have PKR {remainingBeforeExtras.toLocaleString()} remaining budget! Add premium {destination ? `${destination}-exclusive` : 'local'} experiences to elevate your journey:
                </AppText>
              </View>
              {selectedExtraIds.length > 0 ? (
                <TouchableOpacity
                  style={styles.skipExtrasBtn}
                  onPress={() => setSelectedExtraIds([])}
                >
                  <AppText style={styles.skipExtrasBtnText}>Skip All Extras</AppText>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={{ gap: 8, marginTop: 6 }}>
              {currentExtraExperiences.filter((exp) => {
                const isSelected = selectedExtraIds.includes(exp.id);
                // Only show options that the user can actually afford (or is already selected)
                return isSelected || exp.price <= remainingBeforeExtras;
              }).map((exp) => {
                const isSelected = selectedExtraIds.includes(exp.id);
                return (
                  <TouchableOpacity
                    key={exp.id}
                    style={[styles.extraExpCard, isSelected && styles.extraExpCardActive]}
                    onPress={() => handleToggleExtraExperience(exp.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.checkboxSquare, isSelected && styles.checkboxSquareChecked]}>
                      {isSelected ? <AppIcon name="checkmark" size={14} color="#ffffff" /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.activityCheckHeader}>
                        <AppText style={[styles.activityCheckTitle, isSelected && styles.activityCheckTitleActive]}>
                          {exp.name}
                        </AppText>
                        <View style={[styles.extraPriceBadge, isSelected && styles.extraPriceBadgeActive]}>
                          <AppText style={[styles.extraPriceBadgeText, isSelected && styles.extraPriceBadgeTextActive]}>
                            PKR {exp.price.toLocaleString()}
                          </AppText>
                        </View>
                      </View>
                      <AppText style={styles.activityCheckDesc}>{exp.desc}</AppText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sectionRemainingBadge}>
              <AppText style={styles.sectionRemainingLabel}>Remaining Savings after Extra Experiences:</AppText>
              <AppText style={[styles.sectionRemainingVal, { color: '#15803d' }]}>
                PKR {remainingBudget.toLocaleString()}
              </AppText>
            </View>
          </View>
        ) : null}

        {/* 11. LIVE BUDGET DEDUCTION & SAVINGS CONTROLLER */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppIcon name="calculator-outline" size={20} color={colors.forest} />
            <AppText variant="heading" style={styles.cardTitle}>11. Budget Deduction & Savings Summary</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Smart Expense Controller audit: Only items you selected are deducted from your PKR {numBudget.toLocaleString()} budget:
          </AppText>

          <View style={styles.deductionAuditCard}>
            <View style={styles.deductionRow}>
              <AppText style={styles.deductionLabel}>👥 Budget & Group Size:</AppText>
              <AppText style={styles.deductionVal}>
                PKR {numBudgetPerPerson.toLocaleString()} / person × {numPersons || 1} = PKR {numBudget.toLocaleString()}
              </AppText>
            </View>

            <View style={styles.deductionRow}>
              <AppText style={styles.deductionLabel}>🚗 Transport ({isOwnCar ? 'Own Car' : 'Rental'}):</AppText>
              <AppText style={styles.deductionVal}>
                {isOwnCar ? `PKR 0 rent ${driverCharges > 0 ? `+ PKR ${driverCharges.toLocaleString()} driver` : ''}` : `PKR ${estimatedVehicleCost.toLocaleString()}`}
              </AppText>
            </View>

            <View style={styles.deductionRow}>
              <AppText style={styles.deductionLabel}>🏨 Hotel Stay ({nights} nights, {effectiveRooms} rooms):</AppText>
              <AppText style={styles.deductionVal}>
                {(!hotelRequired || !selectedHotel || hotelTotalCost === 0) ? 'PKR 0 (Skipped / Self-arranged)' : `PKR ${hotelTotalCost.toLocaleString()}`}
              </AppText>
            </View>

            <View style={styles.deductionRow}>
              <AppText style={styles.deductionLabel}>🍽️ Food Plan ({currentFoodMenu?.cityName || destination}):</AppText>
              <AppText style={styles.deductionVal}>
                {(!foodRequired || foodChoice === 'self' || foodTotalCost === 0) ? 'PKR 0 (Skipped / Self-arranged)' : `PKR ${foodTotalCost.toLocaleString()}`}
              </AppText>
            </View>

            <View style={styles.deductionRow}>
              <AppText style={styles.deductionLabel}>🎯 Selected Activities:</AppText>
              <AppText style={styles.deductionVal}>
                {(!activitiesRequired || calculatedActivitiesCost === 0) ? 'PKR 0 (Skipped / Free Sights)' : `PKR ${calculatedActivitiesCost.toLocaleString()}`}
              </AppText>
            </View>

            {selectedExtraIds.length > 0 ? (
              <View style={styles.deductionRow}>
                <AppText style={styles.deductionLabel}>✨ Optional Extra Experiences ({selectedExtraIds.length}):</AppText>
                <AppText style={styles.deductionVal}>PKR {totalExtrasCost.toLocaleString()}</AppText>
              </View>
            ) : null}

            <View style={styles.deductionDivider} />

            <View style={styles.deductionRow}>
              <AppText style={styles.deductionTotalLabel}>TOTAL ESTIMATED SPENT:</AppText>
              <AppText style={styles.deductionTotalVal}>PKR {totalIncurred.toLocaleString()}</AppText>
            </View>

            <View style={styles.deductionRow}>
              <AppText style={styles.deductionLabel}>Per Person Spent ({numberOfPersons} travelers):</AppText>
              <AppText style={styles.deductionVal}>PKR {perPersonIncurred.toLocaleString()} / person</AppText>
            </View>

            <View style={styles.deductionRow}>
              <AppText style={styles.deductionRemainLabel}>
                {budgetExceeded ? '⚠️ BUDGET SHORTFALL:' : '💰 REMAINING SAVINGS:'}
              </AppText>
              <AppText style={[styles.deductionRemainVal, { color: budgetExceeded ? '#dc2626' : '#15803d' }]}>
                PKR {budgetExceeded ? (totalIncurred - numBudget).toLocaleString() : remainingBudget.toLocaleString()}
              </AppText>
            </View>
          </View>

          {/* BUDGET EXCEEDED: AUTO-FIT BUTTON & OPTIMIZATION ASSISTANT */}
          {budgetExceeded ? (
            <View style={{ marginTop: 12, gap: 10 }}>
              <TouchableOpacity
                style={styles.autoFitBtn}
                onPress={handleAutoFitBudget}
                activeOpacity={0.88}
              >
                <AppIcon name="flash" size={18} color="#ffffff" />
                <AppText style={styles.autoFitBtnText}>⚡ Auto-Fit to Budget (1-Click Optimization)</AppText>
              </TouchableOpacity>

              {liveSuggestions.length > 0 && (
                <View style={styles.optimizationCard}>
                  <View style={styles.optimizationHeader}>
                    <AppIcon name="bulb-outline" size={18} color="#b45309" />
                    <AppText style={styles.optimizationTitle}>Optimization Assistant: Cheaper Options</AppText>
                  </View>
                  <AppText style={styles.optimizationDesc}>
                    Your selected items exceed your budget by PKR {budgetShortfall.toLocaleString()}. Click Apply on any suggestion to save costs:
                  </AppText>
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {liveSuggestions.map((sug) => (
                      <View key={sug.id} style={styles.suggestionRow}>
                        <View style={{ flex: 1 }}>
                          <AppText style={styles.sugTitle}>{sug.title}</AppText>
                          <AppText style={styles.sugDesc}>{sug.desc}</AppText>
                          <AppText style={styles.sugSavings}>💰 Saves approx. PKR {sug.savings.toLocaleString()}</AppText>
                        </View>
                        <TouchableOpacity
                          style={styles.applyBtn}
                          onPress={() => applyOptimization(sug)}
                        >
                          <AppText style={styles.applyBtnText}>Apply</AppText>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* SUBMIT BUTTON */}
        <View style={styles.submitSection}>
          {validationMessage ? (
            <View style={styles.errorNoticeCard}>
              <AppIcon name="alert-circle" size={20} color="#b91c1c" />
              <AppText style={styles.errorNoticeText}>{validationMessage}</AppText>
            </View>
          ) : null}

          <PrimaryButton
            title={generating ? 'SYNTHESIZING ITINERARY...' : 'GENERATE COMPLETE ITINERARY'}
            onPress={handleGenerateItinerary}
            loading={generating}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </ScrollView>

        {/* FLOATING CHATBOT BUTTON ON SIDE OF SCREEN */}
        <FloatingChatButton navigation={navigation} />

        {/* INTERACTIVE CALENDAR MODAL */}
        <CalendarPickerModal
          visible={calendarModalVisible}
          onClose={() => setCalendarModalVisible(false)}
          onSelectDate={handleCalendarSelect}
          selectedDate={calendarPickerMode === 'start' ? startDate : endDate}
          minDate={calendarPickerMode === 'start' ? getTodayStr() : (startDate || getTodayStr())}
          startDate={startDate}
          mode={calendarPickerMode}
          title={calendarPickerMode === 'start' ? 'Select Journey Start Date' : 'Select Journey End Date'}
        />

        {/* BUDGET VALIDATION MODAL */}
        <Modal
          visible={budgetModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setBudgetModal({ visible: false, title: '', message: '', options: [] })}
        >
          <View style={styles.budgetModalOverlay}>
            <View style={styles.budgetModalContent}>
              <View style={styles.budgetModalHeader}>
                <AppIcon name="alert-circle" size={26} color="#b45309" />
                <AppText style={styles.budgetModalTitle}>{budgetModal.title}</AppText>
              </View>
              <AppText style={styles.budgetModalMessage}>{budgetModal.message}</AppText>
              <View style={styles.budgetModalButtons}>
                {(budgetModal.options || []).map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.budgetModalBtn,
                      opt.style === 'cancel' ? styles.budgetModalBtnSecondary : styles.budgetModalBtnPrimary,
                    ]}
                    onPress={() => {
                      setBudgetModal({ visible: false, title: '', message: '', options: [] });
                      if (opt.onPress) opt.onPress();
                    }}
                  >
                    <AppText
                      style={[
                        styles.budgetModalBtnText,
                        opt.style === 'cancel' ? styles.budgetModalBtnTextSecondary : styles.budgetModalBtnTextPrimary,
                      ]}
                    >
                      {opt.text}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0a2318', position: 'relative' },
  pageBackground: { flex: 1, width: '100%', height: '100%' },
  pageGradientOverlay: { flex: 1 },

  scenicHeader: {
    width: '100%',
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    paddingTop: Platform.OS === 'ios' ? 18 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.20)',
    ...shadowSoft,
    marginBottom: 10,
  },
  scenicHeaderInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  headerBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1FAE5',
    marginTop: 2,
  },

  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 85 },
  mainContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  errorNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#f87171',
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  errorNoticeText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 13,
    fontFamily: fonts.semiBold,
    lineHeight: 18,
  },
  card: {
    ...shadowSoft,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: radius.xl,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DCECE5',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.ink,
  },
  sublabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.muted,
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#edf6f1',
    borderWidth: 1,
    borderColor: '#c6e8d5',
  },
  catChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  catChipTextActive: {
    color: colors.white,
  },
  categoryInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#edf6f1',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c6e8d5',
  },
  categoryInfoText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  cityPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cityChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  cityChipText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  cityChipTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  strengthCol: {
    flex: 1,
  },
  dropdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  withinBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  withinBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#15803d',
  },
  vehicleDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.forest,
    borderRadius: radius.md,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  vehicleDropdownHeaderOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#e2ece6',
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownVehicleName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  dropdownVehicleMeta: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginTop: 2,
  },
  dropdownArrowWrap: {
    padding: 4,
  },
  vehicleDropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.forest,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f3',
  },
  dropdownItemSelected: {
    backgroundColor: '#eef8f2',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  dropdownItemTitleSelected: {
    color: colors.forest,
  },
  dropdownItemSubtitle: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginTop: 2,
  },
  selectPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#f1f5f3',
  },
  selectPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  selectedVehicleSummaryCard: {
    backgroundColor: '#f8faf9',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#d2e3d9',
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  summaryDetails: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  summaryPricing: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
  },
  summaryTripCost: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.ink,
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2ece6',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#f1f7f4',
    borderWidth: 1.2,
    borderColor: '#cce5d7',
  },
  genderChipSelected: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  genderChipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  genderChipTextSelected: {
    color: '#ffffff',
  },
  genderSplitBox: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    backgroundColor: '#f8faf9',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e2ede7',
  },
  genderSplitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  genderSplitLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.forest,
    lineHeight: 18,
  },
  counterValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
    minWidth: 16,
    textAlign: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  inputWrapError: {
    borderColor: '#b43b36',
    borderWidth: 1.5,
    backgroundColor: '#fff5f5',
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  openCalendarLink: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.green,
    textDecorationLine: 'underline',
  },
  calendarTriggerBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eaf4ee',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#cde4d6',
  },
  calendarBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  quickDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#edf6f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#c6e8d5',
  },
  quickDateText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  dateErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 10,
  },
  dateErrorTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#b43b36',
  },
  dateErrorText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#b43b36',
    marginTop: 2,
    lineHeight: 16,
  },
  schedulePreviewBoxError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  gpsDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginTop: 10,
    marginBottom: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsDetectButtonText: {
    color: '#ffffff',
    fontFamily: fonts.semiBold,
    fontSize: 13,
    fontWeight: '700',
  },
  liveLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#86efac',
    marginBottom: 10,
  },
  liveLocationBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontFamily: fonts.medium,
    fontWeight: '600',
    flex: 1,
  },
  routeRoutePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  routeRoutePreviewText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  journeyEndpointsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  endpointCardLive: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 6,
  },
  endpointCardArrival: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#7dd3fc',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 6,
  },
  endpointHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  endpointTag: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#15803d',
    letterSpacing: 0.5,
  },
  endpointArrivalTag: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#0369a1',
    letterSpacing: 0.5,
  },
  endpointCityName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  endpointCoordsText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#15803d',
    marginTop: 4,
  },
  endpointCategoryText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#0369a1',
    marginTop: 4,
  },
  searchSuggestionsBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchSuggestionsLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#64748b',
    marginBottom: 6,
  },
  searchSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  searchSuggestionChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  searchSuggestionChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  searchSuggestionChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  useCustomOriginBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  useCustomOriginBtnText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.forest,
  },
  datePresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  datePresetChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  datePresetText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  datePresetTextActive: {
    color: colors.white,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stepperLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSoft,
  },
  stepperValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  dayChipText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  dayChipTextActive: {
    color: colors.white,
  },
  schedulePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  schedulePreviewTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.forest,
    textTransform: 'uppercase',
  },
  schedulePreviewDates: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginTop: 2,
  },
  hotelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  toggleBtnActive: {
    backgroundColor: colors.forest,
  },
  toggleText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  toggleTextActive: {
    color: colors.white,
  },
  hotelScroll: {
    marginHorizontal: -4,
  },
  hotelCard: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadowSoft,
  },
  hotelCardSelected: {
    borderColor: colors.forest,
    backgroundColor: '#f3fbf6',
  },
  hotelImage: {
    width: '100%',
    height: 100,
  },
  hotelDetails: {
    padding: 10,
    gap: 3,
  },
  hotelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hotelName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
    flex: 1,
    marginRight: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNum: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#b45309',
  },
  hotelCity: {
    fontSize: 11,
    color: colors.muted,
  },
  hotelPrice: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
    marginTop: 2,
  },
  nightText: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: fonts.regular,
  },
  selectedHotelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  selectedHotelText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  quickVehScroll: {
    marginVertical: 8,
  },
  quickVehPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginRight: 8,
    ...shadowSoft,
  },
  quickVehPillActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  quickVehText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  quickVehTextActive: {
    color: colors.white,
  },
  vehItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  vehItemBadgeLuxury: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  vehItemBadgeBudget: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  vehItemBadgeStandard: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  vehItemBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  vehItemBadgeTextLuxury: {
    color: '#b45309',
  },
  vehItemBadgeTextBudget: {
    color: '#15803d',
  },
  vehItemBadgeTextStandard: {
    color: '#0369a1',
  },
  hotelBudgetBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginVertical: 3,
  },
  hotelBudgetBadgeLuxury: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  hotelBudgetBadgeBudget: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  hotelBudgetBadgeStandard: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  hotelBudgetBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  hotelBudgetBadgeTextLuxury: {
    color: '#b45309',
  },
  hotelBudgetBadgeTextBudget: {
    color: '#15803d',
  },
  hotelBudgetBadgeTextStandard: {
    color: '#0369a1',
  },
  roomSelectContainer: {
    marginTop: 6,
    gap: 6,
  },
  roomsRow: {
    gap: 6,
  },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  roomChipSelected: {
    backgroundColor: '#edf6f1',
    borderColor: colors.forest,
  },
  roomChipDisabled: {
    opacity: 0.5,
  },
  roomName: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  roomNameSelected: {
    color: colors.forest,
  },
  roomPrice: {
    fontSize: 11,
    color: colors.muted,
  },
  availBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  availBadgeRed: {
    backgroundColor: '#fee2e2',
  },
  availText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  budgetCalcBox: {
    backgroundColor: '#edf6f1',
    borderRadius: radius.lg,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#c6e8d5',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  calcValue: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  noHotelNotice: {
    padding: 10,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    marginTop: 6,
  },
  noHotelNoticeText: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.medium,
  },
  alertBoxWarning: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderRadius: radius.lg,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#b45309',
  },
  alertMessage: {
    fontSize: 11,
    color: colors.ink,
    marginTop: 2,
  },
  alertSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    fontFamily: fonts.medium,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 12,
    color: colors.muted,
  },
  noHotelsBox: {
    padding: 12,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
  },
  noHotelsText: {
    fontSize: 12,
    color: colors.muted,
  },
  travelTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  typeCardActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  typeTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  typeTitleActive: {
    color: colors.white,
  },
  typeDesc: {
    fontSize: 9,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 12,
  },
  typeDescActive: {
    color: colors.mint,
  },
  soloContainer: {
    marginTop: 8,
  },
  groupContainer: {
    marginTop: 4,
  },
  genderSelectRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  genderSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  genderSelectBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  genderSelectBtnFemaleActive: {
    backgroundColor: '#be185d',
    borderColor: '#be185d',
  },
  genderSelectText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  genderSelectTextActive: {
    color: colors.white,
  },
  soloTravelerInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  soloTravelerInfoText: {
    fontSize: 12,
    color: '#065f46',
  },
  presetPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: colors.cream,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  presetChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  presetChipTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  transportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  transportChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  transportText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  transportTextActive: {
    color: colors.white,
  },
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  interestChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  interestText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  interestTextActive: {
    color: colors.white,
  },
  budgetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  budgetChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  budgetChipText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  budgetChipTextActive: {
    color: colors.white,
  },
  pkrPrefix: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  perPersonSuffix: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  totalTourBudgetBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    marginTop: 8,
    gap: 3,
  },
  totalTourBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalTourBannerTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.forest,
    textTransform: 'uppercase',
  },
  totalTourFormula: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginTop: 2,
  },
  totalTourPrice: {
    fontSize: 18,
    fontFamily: fonts.displayBold,
    color: colors.forest,
  },
  allocationBarContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.cream,
    marginTop: 4,
  },
  allocationSegment: {
    height: '100%',
  },
  allocationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  allocCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.line,
  },
  allocDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  allocCardTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  allocCardValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.forest,
    marginTop: 1,
  },
  allocCardNote: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 1,
  },
  vehCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  vehCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: colors.forest,
  },
  vehIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSoft,
  },
  vehHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  vehName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
    flex: 1,
  },
  vehNameSelected: {
    color: colors.forest,
  },
  vehCapacityBadge: {
    backgroundColor: colors.paper,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  vehCapacityBadgeSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  vehCapacityText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  vehCapacityTextSelected: {
    color: colors.forest,
    fontFamily: fonts.bold,
  },
  vehPricing: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  budgetStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  budgetStatusFit: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  budgetStatusExceed: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  budgetStatusText: {
    fontSize: 9,
    fontFamily: fonts.semiBold,
  },
  budgetStatusFitText: {
    color: '#15803d',
  },
  budgetStatusExceedText: {
    color: '#b45309',
  },
  driverToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 4,
    gap: 8,
  },
  driverToggleTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  driverToggleDesc: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  transportFormulaBox: {
    backgroundColor: '#edf6f1',
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c6e8d5',
    gap: 3,
  },
  transportFormulaLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.forest,
    textTransform: 'uppercase',
  },
  transportFormulaText: {
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
  },
  foodPolicyGrid: {
    gap: 8,
  },
  foodPolicyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  foodPolicyIcon: {
    fontSize: 20,
  },
  foodPolicyTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  foodPolicyDesc: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  foodTagGreen: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  foodTagGreenText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#15803d',
  },
  foodTagYellow: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  foodTagYellowText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: '#b45309',
  },
  smartExpenseBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1.5,
  },
  smartExpenseBudget: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  smartExpenseLuxury: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
  },
  smartExpenseStandard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  smartExpenseTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  smartExpenseNote: {
    fontSize: 11,
    color: colors.ink,
    marginTop: 2,
    lineHeight: 15,
  },
  comfortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  comfortCard: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  comfortCardActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  comfortBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  comfortBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  comfortBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  comfortBadgeTextActive: {
    color: colors.white,
  },
  comfortTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  comfortTitleActive: {
    color: colors.white,
  },
  comfortDesc: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 12,
  },
  comfortDescActive: {
    color: colors.mint,
  },
  submitSection: {
    marginTop: 8,
  },
  submitBtn: {
    paddingVertical: 14,
  },

  // Mode selection
  modeToggleRow: {
    gap: 10,
    marginTop: 4,
  },
  modeCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  modeCardActive: {
    borderColor: colors.forest,
    backgroundColor: '#f0fdf4',
  },
  modeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  modeTitleActive: {
    color: colors.forest,
  },
  modeDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.muted,
    lineHeight: 18,
  },
  modeDescActive: {
    color: '#334155',
  },
  modeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#f1f5f9',
  },
  modeBadgeActive: {
    backgroundColor: colors.forest,
  },
  modeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  modeBadgeTextActive: {
    color: '#ffffff',
  },

  // Transport toggle
  transportToggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  transportToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: '#f1f5f9',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transportToggleBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  transportToggleBtnText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  transportToggleBtnTextActive: {
    color: '#ffffff',
  },
  companyServiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: radius.md,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  companyServiceBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#0369a1',
    lineHeight: 16,
  },
  ownCarInfoBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  ownCarBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ownCarTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#15803d',
  },
  ownCarDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#166534',
    marginTop: 2,
    lineHeight: 18,
  },

  // Low Budget Policy Banners
  lowBudgetInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  lowBudgetInfoTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0369a1',
  },
  lowBudgetInfoText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#0c4a6e',
    marginTop: 2,
    lineHeight: 17,
  },
  lowBudgetFoodBanner: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: radius.md,
    padding: 12,
    marginTop: 4,
  },
  lowBudgetFoodTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#0369a1',
  },
  lowBudgetFoodDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#0c4a6e',
    lineHeight: 17,
  },

  // Routes
  routeChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  routeChoiceCardSelected: {
    borderColor: colors.forest,
    backgroundColor: '#f0fdf4',
  },
  routeChoiceTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  routeChoiceTitleSelected: {
    color: colors.forest,
    fontFamily: fonts.bold,
  },
  routePreviewBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radius.md,
    padding: 10,
    gap: 4,
    marginTop: 6,
  },
  routePreviewLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  routePreviewText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.ink,
  },

  // Food policy
  foodToggleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  foodToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: '#f1f5f9',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  foodToggleBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  foodToggleBtnText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  foodToggleBtnTextActive: {
    color: '#ffffff',
  },
  selfFoodInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
    marginTop: 8,
  },
  selfFoodTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#15803d',
  },
  selfFoodDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#166534',
    marginTop: 2,
    lineHeight: 18,
  },

  // Activities checkboxes
  activityCheckItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  activityCheckItemActive: {
    borderColor: colors.forest,
    backgroundColor: '#f0fdf4',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxSquareChecked: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  activityCheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityCheckTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.ink,
    flex: 1,
  },
  activityCheckTitleActive: {
    color: colors.forest,
    fontFamily: fonts.bold,
  },
  activityPriceBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activityPriceBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  activityPriceBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  activityPriceBadgeTextActive: {
    color: '#15803d',
  },
  activityCheckDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  activityTotalText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.forest,
    marginTop: 4,
  },
  activityPolicyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: radius.md,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  activityPolicyNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#166534',
    lineHeight: 16,
  },

  // Deduction Summary Card
  deductionAuditCard: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  deductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deductionLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  deductionVal: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  deductionDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  deductionTotalLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  deductionTotalVal: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  deductionRemainLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  deductionRemainVal: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  /* SERVICE CUSTOM CHECKLIST */
  serviceCustomBox: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  serviceCustomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceCustomTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  serviceCustomDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
    lineHeight: 15,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  serviceCheckChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  serviceCheckChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  serviceCheckText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  serviceCheckTextActive: {
    color: '#ffffff',
  },
  companyInclusionsBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 10,
    gap: 6,
  },
  companyInclusionsTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#065f46',
  },
  companyInclusionsText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#047857',
    lineHeight: 16,
  },

  /* ROOMS QUANTITY STEPPER */
  roomsQuantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 4,
  },
  roomsQuantityTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  roomsQuantityDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
    marginTop: 2,
  },
  roomsStepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roomsStepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  roomsStepperBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.forest,
    lineHeight: 18,
  },
  roomsStepperValue: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.ink,
    minWidth: 18,
    textAlign: 'center',
  },

  /* FOOD MEALS SELECT CARDS */
  mealSelectCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: radius.md,
    padding: 12,
    gap: 6,
  },
  mealSelectCardActive: {
    borderColor: colors.forest,
    backgroundColor: '#f0fdf4',
  },
  mealCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mealName: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  mealPriceBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mealPriceBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  mealPriceBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  mealPriceBadgeTextActive: {
    color: colors.forest,
  },
  mealMenuText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#64748b',
    lineHeight: 15,
    paddingLeft: 28,
  },

  /* BUDGET EXCEEDED & OPTIMIZATION */
  autoFitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    ...shadowSoft,
  },
  autoFitBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#ffffff',
  },
  optimizationCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  optimizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optimizationTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#92400e',
  },
  optimizationDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#78350f',
    lineHeight: 16,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fef08a',
    borderRadius: radius.md,
    padding: 10,
    gap: 10,
  },
  sugTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  sugDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
    marginTop: 2,
  },
  sugSavings: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#15803d',
    marginTop: 3,
  },
  applyBtn: {
    backgroundColor: colors.forest,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  applyBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#ffffff',
  },

  /* LIVE DYNAMIC BUDGET TRACKER */
  liveBudgetTrackerCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    marginBottom: 16,
    ...shadowSoft,
  },
  liveBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  liveBudgetTitle: {
    fontSize: 15,
    fontFamily: fonts.displayBold,
    color: colors.forest,
  },
  liveBudgetSubtitle: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
    marginTop: 1,
  },
  liveBudgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  liveBudgetItem: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  liveBudgetItemTotal: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  liveBudgetItemRemaining: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  liveBudgetItemShortfall: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  liveBudgetLbl: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  liveBudgetVal: {
    fontSize: 13,
    fontFamily: fonts.displayBold,
    color: colors.ink,
    marginTop: 2,
  },

  /* SECTION REMAINING BADGES & SKIPPED BOXES */
  sectionRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 6,
  },
  sectionRemainingLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#166534',
  },
  sectionRemainingVal: {
    fontSize: 13,
    fontFamily: fonts.displayBold,
    color: '#15803d',
  },
  skippedServiceBox: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  skippedServiceTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  skippedServiceSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.muted,
  },

  /* EXTRA EXPERIENCES (SECTION 10B) */
  skipExtrasBtn: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: radius.md,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  skipExtrasBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#92400e',
  },
  extraExpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdfa',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: radius.lg,
    padding: 12,
    gap: 12,
  },
  extraExpCardActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
  },
  extraPriceBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  extraPriceBadgeActive: {
    backgroundColor: '#d97706',
  },
  extraPriceBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#92400e',
  },
  extraPriceBadgeTextActive: {
    color: '#ffffff',
  },

  /* BUDGET VALIDATION MODAL */
  budgetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  budgetModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    ...shadowSoft,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  budgetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  budgetModalTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: '#9a3412',
    flex: 1,
  },
  budgetModalMessage: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 18,
  },
  budgetModalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  budgetModalBtn: {
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  budgetModalBtnPrimary: {
    backgroundColor: colors.forest,
  },
  budgetModalBtnSecondary: {
    backgroundColor: '#f1f5f9',
  },
  budgetModalBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  budgetModalBtnTextPrimary: {
    color: '#ffffff',
  },
  budgetModalBtnTextSecondary: {
    color: '#475569',
  },

  /* ORIGIN LOCATION PRESETS & LIVE PLACES SEARCH */
  originPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  originPresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  originPresetBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  originPresetBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#166534',
  },
  originPresetBtnTextActive: {
    color: '#ffffff',
  },
  originSubChipsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  originSubChipsTitle: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.forest,
    marginBottom: 6,
  },
  originSubChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  originSubChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  originSubChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  originSubChipText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#334155',
  },
  originSubChipTextActive: {
    color: '#ffffff',
  },
  liveSearchResultsBox: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#86efac',
    marginTop: 6,
    gap: 4,
    ...shadowSoft,
  },
  livePlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  livePlaceTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  livePlaceSubtitle: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.muted,
    marginTop: 1,
  },
});
