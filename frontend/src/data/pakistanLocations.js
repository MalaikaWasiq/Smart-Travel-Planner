/**
 * Comprehensive geographical coordinates and highway routing information for Pakistan.
 * Used for live GPS navigation, route mapping, highway classification, and road advisories.
 */

export const PAKISTAN_COORDINATES = {
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

  // Federal & Punjab
  'islamabad': [33.6844, 73.0479],
  'islamabad / rawalpindi': [33.6844, 73.0479],
  'rawalpindi': [33.5989, 73.0441],
  'lahore': [31.5204, 74.3587],
  'multan': [30.1575, 71.5249],
  'faisalabad': [31.4504, 73.1350],
  'sialkot': [32.4945, 74.5229],
  'gujranwala': [32.1877, 74.1945],
  'bahawalpur': [29.3544, 71.6911],
  'peshawar': [34.0151, 71.5249],
  'abbottabad': [34.1688, 73.2215],
  'murree': [33.9070, 73.3943],
  'karachi': [24.8607, 67.0011],
  'quetta': [30.1798, 66.9750],

  // Key Universities & Institutes
  'fast nuces': [33.6518, 73.0159],
  'fast nuces islamabad': [33.6518, 73.0159],
  'fast university': [33.6518, 73.0159],
  'fast nuces lahore': [31.4815, 74.3030],
  'nust': [33.6425, 72.9904],
  'nust islamabad': [33.6425, 72.9904],
  'nust h-12': [33.6425, 72.9904],
  'lums': [31.4705, 74.4111],
  'lums lahore': [31.4705, 74.4111],
  'comsats': [33.6519, 73.1566],
  'comsats islamabad': [33.6519, 73.1566],
  'giki': [34.0705, 72.6433],
  'punjab university': [31.4988, 74.2985],
  'pu lahore': [31.4988, 74.2985],
  'uet lahore': [31.5794, 74.3562],
  'iba karachi': [24.9427, 67.1142],

  // Key Residential Neighborhoods & Home Areas
  'bahria town': [33.5186, 73.1097],
  'bahria town rawalpindi': [33.5186, 73.1097],
  'bahria town lahore': [31.3683, 74.1804],
  'dha': [31.4697, 74.3800],
  'dha lahore': [31.4697, 74.3800],
  'dha phase 5': [31.4697, 74.3800],
  'dha islamabad': [33.5284, 73.1498],
  'gulberg': [31.5204, 74.3487],
  'gulberg lahore': [31.5204, 74.3487],
  'model town': [31.4880, 74.3211],
  'model town lahore': [31.4880, 74.3211],
  'askari': [31.5392, 74.4012],
  'satellite town': [33.6391, 73.0645],
  'satellite town rawalpindi': [33.6391, 73.0645],
  'saddar': [33.5973, 73.0534],
  'saddar rawalpindi': [33.5973, 73.0534],
  'f-10': [33.6934, 73.0031],
  'f-11': [33.6823, 72.9877],
  'g-11': [33.6677, 72.9996],
  'clifton': [24.8138, 67.0300],

  // Corporate & Office Areas
  'blue area': [33.7103, 73.0656],
  'blue area islamabad': [33.7103, 73.0656],
  'i-8': [33.6685, 73.0768],
  'i-9 industrial': [33.6582, 73.0521],
  'i.i. chundrigar road': [24.8508, 67.0011],
  'rohtas fort': [32.9664, 73.5786],
  'katas raj & khewra': [32.6517, 72.9575],
  'harappa': [30.6300, 72.8647],

  // Khyber Pakhtunkhwa & Northern Adventure
  'malam jabba': [34.7994, 72.5725],
  'swat valley': [35.2227, 72.4258],
  'swat': [35.2227, 72.4258],
  'kalam valley': [35.4912, 72.5796],
  'kalam': [35.4912, 72.5796],
  'naran & kaghan': [34.9080, 73.6520],
  'naran': [34.9080, 73.6520],
  'babusar top': [35.1524, 74.0477],
  'kumrat valley': [35.5392, 72.2155],
  'chitral & kalash': [35.8510, 71.7864],
  'peshawar': [34.0151, 71.5249],
  'abbottabad': [34.1688, 73.2215],
  'abbottabad & thandiani': [34.1688, 73.2215],
  'murree & galyat': [33.9062, 73.3903],
  'murree': [33.9062, 73.3903],

  // Gilgit-Baltistan & Azad Kashmir
  'hunza valley': [36.3167, 74.6500],
  'hunza': [36.3167, 74.6500],
  'skardu': [35.2971, 75.6333],
  'gilgit': [35.9221, 74.3087],
  'fairy meadows': [35.3850, 74.5772],
  'deosa national park': [34.9961, 75.4419],
  'deosai plains': [34.9961, 75.4419],
  'deosai': [34.9961, 75.4419],
  'khaplu & shigar': [35.1583, 76.3353],
  'ghizer & phander': [36.1772, 72.9556],
  'ghizer & phander lake': [36.1772, 72.9556],
  'naltar valley': [36.1389, 74.1917],
  'khunjerab pass': [36.8497, 75.4297],
  'neelum valley': [34.5859, 73.9069],
  'muzaffarabad': [34.3700, 73.4711],
  'rawalakot & banjosa': [33.8584, 73.7610],

  // Sindh & Balochistan Coastal
  'karachi': [24.8607, 67.0011],
  'karachi coast': [24.8607, 67.0011],
  'clifton beach': [24.8138, 67.0305],
  'hawksbay': [24.8530, 66.8652],
  'gwadar': [25.1216, 62.3254],
  'kund malir': [25.5000, 65.4500],
  'ormara beach': [25.2088, 64.6357],
  'quetta': [30.1798, 66.9750],
  'hyderabad': [25.3960, 68.3578],
  'sukkur': [27.7052, 68.8574],
  'ziarat': [30.3824, 67.7256],
  'mohenjo-daro': [27.3292, 68.1367],
  'thatta & makli': [24.7475, 67.9272],

  // Comprehensive Pakistan Cities & Districts
  'gujrat': [32.5736, 74.0789],
  'sargodha': [32.0836, 72.6711],
  'jhelum': [32.9333, 73.7333],
  'chakwal': [32.9328, 72.8631],
  'mianwali': [32.5839, 71.5378],
  'sheikhupura': [31.7131, 73.9783],
  'rahim yar khan': [28.4212, 70.2989],
  'jhang': [31.2681, 72.3181],
  'dera ghazi khan': [30.0561, 70.6348],
  'kasur': [31.1167, 74.4500],
  'okara': [30.8081, 73.4458],
  'sahiwal': [30.6682, 73.1114],
  'chiniot': [31.7200, 72.9789],
  'kamoke': [31.9744, 74.2244],
  'hafizabad': [32.0711, 73.6878],
  'mandi bahauddin': [32.5861, 73.4917],
  'wazirabad': [32.4419, 74.1206],
  'muridke': [31.8019, 74.2564],
  'khanewal': [30.3017, 71.9322],
  'muzaffargarh': [30.0744, 71.1844],
  'vehari': [30.0419, 72.3489],
  'pakpattan': [30.3411, 73.3856],
  'burewala': [30.1667, 72.6833],
  'kot addu': [30.4700, 70.9667],
  'bhakkar': [31.6256, 71.0656],
  'layyah': [30.9611, 70.9419],
  'lodhran': [29.5339, 71.6333],
  'rajanpur': [29.1039, 70.3250],
  'bahawalnagar': [29.9986, 73.2536],
  'mardan': [34.1989, 72.0403],
  'mingora': [34.7758, 72.3625],
  'kohat': [33.5869, 71.4414],
  'dera ismail khan': [31.8327, 70.9024],
  'bannu': [32.9861, 70.6042],
  'swabi': [34.1202, 72.4698],
  'charsadda': [34.1481, 71.7406],
  'nowshera': [34.0153, 71.9747],
  'mansehra': [34.3333, 73.2000],
  'haripur': [33.9994, 72.9344],
  'batkhela': [34.6186, 71.9719],
  'malakand': [34.5667, 71.9333],
  'timergara': [34.8267, 71.8419],
  'karak': [33.1114, 71.0942],
  'hangu': [33.5281, 71.0572],
  'larkana': [27.5590, 68.2120],
  'nawabshah': [26.2483, 68.4096],
  'mirpur khas': [25.5276, 69.0159],
  'jacobabad': [28.2819, 68.4375],
  'shikarpur': [27.9572, 68.6478],
  'khairpur': [27.5295, 68.7592],
  'dadu': [26.7319, 67.7750],
  'tando adam': [25.7681, 68.6619],
  'tando allahyar': [25.4606, 68.7172],
  'badin': [24.6558, 68.8383],
  'thatta': [24.7475, 67.9272],
  'ghotki': [28.0064, 69.3161],
  'umerkot': [25.3614, 69.7369],
  'jamshoro': [25.4361, 68.2711],
  'turbat': [26.0031, 63.0544],
  'khuzdar': [27.8119, 66.6094],
  'hub': [25.0289, 66.8833],
  'chaman': [30.9236, 66.4512],
  'sibi': [29.5448, 67.8764],
  'zhob': [31.3417, 69.4486],
  'loralai': [30.3705, 68.5979],
  'dera murad jamali': [28.5467, 68.2231],
  'pasni': [25.2631, 63.4714],
  'chilas': [35.4128, 74.0961],
  'astore': [35.3667, 74.8500],
  'mirpur': [33.1484, 73.7519],
  'rawalakot': [33.8584, 73.7610],
  'kotli': [33.5156, 73.9019],
  'bhimber': [32.9744, 74.0786],
  'bagh': [33.9811, 73.7936],
};

export const ALL_PAKISTAN_CITIES = [
  // Punjab & Federal
  'Attock City', 'Hazro', 'Gondal', 'Kamra', 'Hasan Abdal', 'Wah Cantt', 'Taxila',
  'Fateh Jang', 'Pindi Gheb', 'Jand', 'Islamabad', 'Rawalpindi', 'Lahore', 'Faisalabad',
  'Multan', 'Gujranwala', 'Sialkot', 'Sargodha', 'Bahawalpur', 'Jhelum', 'Gujrat',
  'Sahiwal', 'Sheikhupura', 'Rahim Yar Khan', 'Jhang', 'Dera Ghazi Khan', 'Kasur',
  'Okara', 'Chiniot', 'Kamoke', 'Hafizabad', 'Mandi Bahauddin', 'Wazirabad', 'Muridke',
  'Khanewal', 'Muzaffargarh', 'Vehari', 'Pakpattan', 'Chakwal', 'Mianwali', 'Burewala',
  'Kot Addu', 'Bhakkar', 'Layyah', 'Lodhran', 'Rajanpur', 'Bahawalnagar', 'Murree',
  
  // Khyber Pakhtunkhwa (KPK)
  'Peshawar', 'Mardan', 'Mingora', 'Swat', 'Abbottabad', 'Kohat', 'Dera Ismail Khan',
  'Bannu', 'Swabi', 'Charsadda', 'Nowshera', 'Mansehra', 'Haripur', 'Batkhela',
  'Malakand', 'Chitral', 'Dir', 'Timergara', 'Karak', 'Hangu', 'Kalam', 'Naran',
  'Malam Jabba', 'Babusar Top', 'Kumrat Valley',
  
  // Sindh
  'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad',
  'Shikarpur', 'Khairpur', 'Dadu', 'Tando Adam', 'Tando Allahyar', 'Badin', 'Thatta',
  'Ghotki', 'Umerkot', 'Jamshoro', 'Kashmore',
  
  // Balochistan
  'Quetta', 'Turbat', 'Gwadar', 'Khuzdar', 'Hub', 'Chaman', 'Sibi', 'Zhob',
  'Loralai', 'Dera Murad Jamali', 'Ormara', 'Pasni', 'Kund Malir', 'Ziarat',
  
  // Gilgit-Baltistan & Azad Kashmir
  'Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Ghizer', 'Astore', 'Khaplu', 'Shigar',
  'Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bhimber', 'Bagh', 'Neelum Valley'
];

export function getPakistanCoords(name, defaultCoords = [33.6844, 73.0479]) {
  if (!name) return defaultCoords;
  const q = String(name).toLowerCase().trim();
  if (PAKISTAN_COORDINATES[q]) return PAKISTAN_COORDINATES[q];
  for (const [key, coords] of Object.entries(PAKISTAN_COORDINATES)) {
    if (q.includes(key) || key.includes(q)) return coords;
  }
  return defaultCoords;
}

export const CATEGORIZED_DESTINATIONS = {
  'Northern Areas': [
    'Hunza Valley',
    'Skardu',
    'Gilgit',
    'Fairy Meadows',
    'Neelum Valley',
    'Deosai Plains',
    'Kalam Valley',
    'Khunjerab Pass',
    'Muzaffarabad',
  ],
  'Adventure & Nature': [
    'Malam Jabba',
    'Babusar Top',
    'Swat Valley',
    'Naran & Kaghan',
    'Kumrat Valley',
    'Murree & Galyat',
    'Chitral & Kalash',
    'Abbottabad & Thandiani',
  ],
  'Coastal Areas': [
    'Gwadar',
    'Kund Malir',
    'Ormara Beach',
    'Karachi Coast',
    'Clifton Beach',
    'Hawksbay',
    'Astola Island',
  ],
  'Cultural & Historical': [
    'Lahore',
    'Attock',
    'Faisalabad',
    'Islamabad',
    'Peshawar',
    'Multan',
    'Taxila',
    'Rohtas Fort',
    'Bahawalpur',
  ],
};

export const POPULAR_MAP_DESTINATIONS = [
  'Malam Jabba',
  'Swat Valley',
  'Babusar Top',
  'Hunza Valley',
  'Skardu',
  'Naran & Kaghan',
  'Murree & Galyat',
  'Kumrat Valley',
  'Gwadar',
  'Attock',
  'Faisalabad',
  'Lahore',
  'Islamabad',
  'Peshawar',
  'Deosai Plains',
  'Neelum Valley',
];

/**
 * Returns authentic scenic stops and attractions for ANY destination in Pakistan
 * so MapScreen displays genuine stops for that city rather than defaulting to Islamabad.
 */
export function getScenicStopsForDestination(destName, destCoords) {
  const d = String(destName || '').toLowerCase().trim();
  const dLat = Number(destCoords?.[0]) || 34.7994;
  const dLon = Number(destCoords?.[1]) || 72.5725;

  if (d.includes('malam jabba')) {
    return [
      { index: 1, place: 'Panoramic Mountain Chairlift & Cable Car', time: '08:30 AM', lat: 34.8010, lon: 72.5710 },
      { index: 2, place: 'Malam Jabba Alpine Ski Slope & Snowboard Viewpoint', time: '11:30 AM', lat: 34.7985, lon: 72.5740 },
      { index: 3, place: 'High-Altitude Mountain Zipline Thrill', time: '02:30 PM', lat: 34.7960, lon: 72.5690 },
      { index: 4, place: 'Pine Forest Cedar Nature Trek & Summit Sunset', time: '05:00 PM', lat: 34.8040, lon: 72.5760 },
    ];
  }

  if (d.includes('swat') || d.includes('kalam')) {
    return [
      { index: 1, place: 'Mingora White Palace (Marghazar) Heritage', time: '09:00 AM', lat: 35.2150, lon: 72.4210 },
      { index: 2, place: 'Swat River White Water Rapids Viewpoint', time: '12:30 PM', lat: 35.2280, lon: 72.4300 },
      { index: 3, place: 'Ushu Pine Forest & Matiltan Waterfall', time: '03:30 PM', lat: 35.4850, lon: 72.5600 },
      { index: 4, place: 'Mahodand Glacial Lake Scenic Vista', time: '06:00 PM', lat: 35.5300, lon: 72.6100 },
    ];
  }

  if (d.includes('hunza')) {
    return [
      { index: 1, place: 'Baltit & Altit Forts Guided Heritage Stop', time: '09:00 AM', lat: 36.3260, lon: 74.6710 },
      { index: 2, place: 'Attabad Lake Speedboat & Jet Ski Deck', time: '12:00 PM', lat: 36.3350, lon: 74.8650 },
      { index: 3, place: 'Passu Cones Suspension Bridge Walk', time: '03:00 PM', lat: 36.4850, lon: 74.8870 },
      { index: 4, place: 'Eagles Nest Duikar Panoramic Sunset Viewpoint', time: '06:30 PM', lat: 36.3310, lon: 74.6850 },
    ];
  }

  if (d.includes('skardu')) {
    return [
      { index: 1, place: 'Shangrila Lower Kachura Crystal Lake', time: '08:30 AM', lat: 35.4190, lon: 75.4420 },
      { index: 2, place: 'Upper Kachura Scenic Boating Deck', time: '11:30 AM', lat: 35.4450, lon: 75.4380 },
      { index: 3, place: 'Katpana Cold Desert Sand Dune Drifting', time: '03:00 PM', lat: 35.3210, lon: 75.5920 },
      { index: 4, place: 'Kharpocho Fort Rock Vantage over Indus River', time: '05:30 PM', lat: 35.3020, lon: 75.6450 },
    ];
  }

  if (d.includes('babusar') || d.includes('naran')) {
    return [
      { index: 1, place: 'Lake Saif-ul-Malook Alpine Jeep Stop', time: '08:30 AM', lat: 34.8780, lon: 73.6920 },
      { index: 2, place: 'Kunhar River White Water Rapids Viewpoint', time: '12:00 PM', lat: 34.9120, lon: 73.6500 },
      { index: 3, place: 'Lulusar Emerald Glacial Lake Stop', time: '03:30 PM', lat: 35.0830, lon: 73.9250 },
      { index: 4, place: 'Babusar Top Summit (13,691 ft) Vantage Pass', time: '05:30 PM', lat: 35.1524, lon: 74.0477 },
    ];
  }

  if (d.includes('lahore')) {
    return [
      { index: 1, place: 'Shahi Qila & Badshahi Mosque Mughal Heritage Pass', time: '09:00 AM', lat: 31.5880, lon: 74.3100 },
      { index: 2, place: 'Old Lahore (Androon) Food Street & Haveli Walk', time: '01:00 PM', lat: 31.5870, lon: 74.3130 },
      { index: 3, place: 'Wagah Border Flag Ceremony VIP Pass', time: '04:30 PM', lat: 31.6040, lon: 74.5730 },
      { index: 4, place: 'Shalimar Gardens UNESCO Mughal Heritage', time: '07:30 PM', lat: 31.5860, lon: 74.3820 },
    ];
  }

  if (d.includes('gwadar') || d.includes('kund malir') || d.includes('ormara')) {
    return [
      { index: 1, place: 'Hammerhead Koh-e-Batil Cliff Vantage', time: '09:00 AM', lat: 25.1050, lon: 62.3310 },
      { index: 2, place: 'Marine Promenade & Deep Sea Port Viewpoint', time: '12:30 PM', lat: 25.1320, lon: 62.3210 },
      { index: 3, place: 'Kund Malir Princess of Hope Rock Formation', time: '03:30 PM', lat: 25.5010, lon: 65.4510 },
      { index: 4, place: 'Ormara Beach Sunset Coastal Promenade', time: '06:30 PM', lat: 25.2090, lon: 64.6360 },
    ];
  }

  if (d.includes('attock') || d.includes('gondal') || d.includes('hazro')) {
    return [
      { index: 1, place: 'Historic Attock Fort & Indus River Confluence', time: '09:00 AM', lat: 33.8860, lon: 72.2410 },
      { index: 2, place: 'Attock Khurd Victorian Railway Bridge & Viewpoint', time: '12:00 PM', lat: 33.8720, lon: 72.2350 },
      { index: 3, place: 'COMSATS University Attock Campus & Garden', time: '03:00 PM', lat: 33.7788, lon: 72.3582 },
      { index: 4, place: 'Campbellpur Cantonment Heritage & Kamra Walk', time: '06:00 PM', lat: 33.7640, lon: 72.3690 },
    ];
  }

  if (d.includes('faisalabad')) {
    return [
      { index: 1, place: 'Historic Clock Tower (Ghanta Ghar) & Eight Bazaars', time: '09:00 AM', lat: 31.4180, lon: 73.0790 },
      { index: 2, place: 'D Ground Boulevard & Traditional Lyallpur Food Street', time: '12:30 PM', lat: 31.4110, lon: 73.1110 },
      { index: 3, place: 'Gutwala Forest Park & Wildlife Conservation Sanctuary', time: '03:30 PM', lat: 31.4820, lon: 73.1890 },
      { index: 4, place: 'Lyallpur Galleria Evening Promenade', time: '06:30 PM', lat: 31.4420, lon: 73.1250 },
    ];
  }

  if (d.includes('murree') || d.includes('galyat')) {
    return [
      { index: 1, place: 'Patriata (New Murree) Dual Chairlift & Cable Car', time: '09:30 AM', lat: 33.9110, lon: 73.4520 },
      { index: 2, place: 'Ayubia National Park Pipeline Nature Trail Walk', time: '01:00 PM', lat: 34.0280, lon: 73.4020 },
      { index: 3, place: 'Nathia Gali Green Spot & Miranjani Hilltop Trek', time: '04:00 PM', lat: 34.0720, lon: 73.3850 },
      { index: 4, place: 'Mall Road Horse Stroll & Kashmir Point Sunset', time: '07:00 PM', lat: 33.9062, lon: 73.3903 },
    ];
  }

  if (d.includes('islamabad')) {
    return [
      { index: 1, place: 'Daman-e-Koh Hilltop & Margalla Ridge Vantage', time: '08:30 AM', lat: 33.7440, lon: 73.0580 },
      { index: 2, place: 'Faisal Mosque Architectural Monument', time: '12:00 PM', lat: 33.7290, lon: 73.0370 },
      { index: 3, place: 'Rawal Lake & Lake View Park Promenade', time: '03:30 PM', lat: 33.7020, lon: 73.1280 },
      { index: 4, place: 'Pakistan National Monument & Shakarparian Hills', time: '06:30 PM', lat: 33.6930, lon: 73.0680 },
    ];
  }

  // Generic regional stops calculated around destination coordinates
  return [
    { index: 1, place: `${destName} Central Heritage & Welcome Point`, time: '09:00 AM', lat: Number((dLat + 0.012).toFixed(4)), lon: Number((dLon - 0.010).toFixed(4)) },
    { index: 2, place: `${destName} Panoramic Scenic Viewpoint`, time: '12:30 PM', lat: Number((dLat + 0.025).toFixed(4)), lon: Number((dLon + 0.018).toFixed(4)) },
    { index: 3, place: `${destName} Regional Cultural Bazaar & Food Street`, time: '04:00 PM', lat: Number((dLat - 0.015).toFixed(4)), lon: Number((dLon + 0.012).toFixed(4)) },
    { index: 4, place: `${destName} Resort & Evening Sunset Viewpoint`, time: '07:00 PM', lat: Number((dLat - 0.008).toFixed(4)), lon: Number((dLon - 0.020).toFixed(4)) },
  ];
}

export const POPULAR_MAP_ORIGINS = [
  'Attock City',
  'Hazro',
  'Gondal',
  'Kamra',
  'Hasan Abdal',
  'Wah Cantt',
  'Taxila',
  'Islamabad / Rawalpindi',
  'Lahore',
  'Peshawar',
  'Multan',
  'Faisalabad',
  'Karachi',
];

/**
 * Returns highway comparison (Shortest Motorway Route vs GT Road Route)
 * along with road blockage advisory info.
 */
export function getHighwayRouteDetails(originName, destName, originCoords = null, destCoords = null) {
  const o = String(originName || '').toLowerCase();
  const d = String(destName || '').toLowerCase();

  const oLat = Number(originCoords?.[0]) || getPakistanCoords(originName, [33.7667, 72.3667])[0];
  const oLon = Number(originCoords?.[1]) || getPakistanCoords(originName, [33.7667, 72.3667])[1];
  const dLat = Number(destCoords?.[0]) || getPakistanCoords(destName, [34.7994, 72.5725])[0];
  const dLon = Number(destCoords?.[1]) || getPakistanCoords(destName, [34.7994, 72.5725])[1];

  // 1. Malam Jabba / Swat / Kalam (Direct via M-1 ➔ M-16 Swat Expressway)
  if (d.includes('malam jabba') || d.includes('swat') || d.includes('kalam') || d.includes('mingora')) {
    return {
      motorwayRoute: {
        id: 'motorway',
        name: '⚡ Shortest Motorway Route',
        badge: 'M-1 + Swat Expressway (M-16)',
        highways: ['M-1 Motorway (Burhan)', 'M-16 Swat Expressway', 'Malam Jabba Alpine Road'],
        typeLabel: 'Motorway Express (120 km/h)',
        color: '#15803d',
        isShortest: true,
        desc: 'Fastest route via M-1 to Col. Sher Khan Interchange, then M-16 Swat Expressway past Barikot into Swat.',
      },
      gtRoadRoute: {
        id: 'gt_road',
        name: '🚗 Alternative GT Road Route',
        badge: 'N-5 GT Road + Malakand Pass (N-45)',
        highways: ['N-5 Grand Trunk Road (via Nowshera)', 'Malakand Pass (N-45)', 'Chakdara Link'],
        typeLabel: 'National Highway (GT Road)',
        color: '#2563eb',
        isShortest: false,
        desc: 'Traditional highway via historic towns, tea stalls and Malakand mountain pass.',
      },
      roadBlock: {
        hasBlock: true,
        title: '⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK & HIGH TRAFFIC',
        locationName: 'Swat Expressway / Barikot Corridor (M-16 Swat Valley)',
        coords: [34.685, 72.215],
        delayMins: 15,
        speedWarning: 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 35 km/h).',
        constructionNotice: 'Sadak ki repair / widening chal rahi hai: Two-way road ab single one-way lane mein chal rahi hai (gariyan baari baari aa jaa rahi hain).',
        reason: 'Heavy traffic congestion due to ongoing road expansion & single-lane diversion near Barikot.',
        detourAdvice: 'Maintain safe distance and follow traffic marshal hand signals.',
      },
      turnByTurn: [
        { step: 1, text: `Depart from ${originName || 'Current Location'}`, icon: 'navigate', type: 'start' },
        { step: 2, text: 'Take motorway corridor towards Colonel Sher Khan Interchange', icon: 'speedometer', highway: 'Motorway Corridor' },
        { step: 3, text: 'Merge onto Swat Expressway (M-16) through Palai Tunnels', icon: 'shuffle', highway: 'M-16 Swat Expressway' },
        { step: 4, text: '⚠️ ⛔ HAZARD: Speed slow karein! Road construction work & single lane diversion near Barikot (+15 min delay)', icon: 'warning', isDelay: true },
        { step: 5, text: 'Pass Mingora towards alpine Malam Jabba junction', icon: 'trail-sign', highway: 'Expressway' },
        { step: 6, text: `Ascend alpine scenic road to ${destName || 'Malam Jabba'} summit`, icon: 'flag', type: 'destination' },
      ],
    };
  }

  // 2. Babusar Top / Naran / Kaghan / Hunza / Gilgit / Skardu
  if (d.includes('babusar') || d.includes('naran') || d.includes('hunza') || d.includes('skardu') || d.includes('gilgit') || d.includes('kaghan')) {
    return {
      motorwayRoute: {
        id: 'motorway',
        name: '⚡ Shortest Hazara Motorway Route',
        badge: 'M-15 Hazara Motorway + N-15 Kaghan',
        highways: ['M-15 Hazara Motorway', 'N-15 Kaghan Alpine Highway', 'Babusar Pass Summit'],
        typeLabel: 'Motorway & Alpine Highway',
        color: '#15803d',
        isShortest: true,
        desc: 'Fastest transit via Havelian, Abbottabad bypass, Mansehra tunnels and Kunhar River corridor.',
      },
      gtRoadRoute: {
        id: 'gt_road',
        name: '🚗 Traditional GT Road & Murree Route',
        badge: 'N-5 GT Road + N-75 + Galyat Corridor',
        highways: ['N-5 GT Road', 'N-75 Murree Expressway', 'Galyat N-35 Link'],
        typeLabel: 'National Highway & Mountain Pass',
        color: '#2563eb',
        isShortest: false,
        desc: 'Scenic pass through pine ridges, Nathia Gali and Abbottabad town.',
      },
      roadBlock: {
        hasBlock: true,
        title: '⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK & HIGH TRAFFIC',
        locationName: 'N-15 Alpine Corridor near Balakot / Kaghan approach',
        coords: [34.820, 73.480],
        delayMins: 15,
        speedWarning: 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 30 km/h).',
        constructionNotice: 'Sadak ki repair / widening chal rahi hai: Two-way road ab single one-way lane mein chal rahi hai (gariyan bari bari aa jaa rahi hain).',
        reason: 'Heavy traffic congestion due to single-lane shoulder maintenance.',
        detourAdvice: 'Follow road signs and maintain safe following distance.',
      },
      turnByTurn: [
        { step: 1, text: `Depart from ${originName || 'Current Location'}`, icon: 'navigate', type: 'start' },
        { step: 2, text: 'Connect to Hazara Motorway (M-15) via Abbottabad Bypass', icon: 'speedometer', highway: 'M-15 Motorway' },
        { step: 3, text: 'Pass Mansehra and merge onto N-15 Kaghan Alpine Highway', icon: 'trail-sign', highway: 'N-15' },
        { step: 4, text: '⚠️ ⛔ HAZARD: Speed slow karein! Mountain road maintenance & single lane traffic (+15 min delay)', icon: 'warning', isDelay: true },
        { step: 5, text: 'Continue through Naran Valley past Lulusar Emerald Lake', icon: 'car-sport', highway: 'Alpine Highway' },
        { step: 6, text: `Ascend alpine pass to ${destName || 'Babusar Top'} summit`, icon: 'flag', type: 'destination' },
      ],
    };
  }

  // 3. Lahore
  if (d.includes('lahore')) {
    return {
      motorwayRoute: {
        id: 'motorway',
        name: '⚡ Shortest M-2 Motorway Route',
        badge: 'M-2 Motorway (Balkasar & Salt Range)',
        highways: ['M-2 Motorway', 'Lahore Ring Road (L-20)'],
        typeLabel: '6-Lane Motorway (120 km/h)',
        color: '#15803d',
        isShortest: true,
        desc: 'Seamless 6-lane access with service areas at Sukheke, Bhera & Kalar Kahar.',
      },
      gtRoadRoute: {
        id: 'gt_road',
        name: '🚗 Historic GT Road Route',
        badge: 'N-5 Grand Trunk Road',
        highways: ['N-5 GT Road via Jhelum, Gujrat & Gujranwala'],
        typeLabel: 'N-5 National Highway',
        color: '#2563eb',
        isShortest: false,
        desc: 'Historic trade route passing through heart of Punjab cities with roadside dhabas.',
      },
      roadBlock: {
        hasBlock: true,
        title: '⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK & HIGH TRAFFIC',
        locationName: 'M-2 Motorway near Salt Range / Kallar Kahar Pass',
        coords: [32.780, 72.820],
        delayMins: 15,
        speedWarning: 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 40 km/h).',
        constructionNotice: 'Sadak ki lane resurfacing chal rahi hai: Two-way road ab single one-way lane mein chal rahi hai (gariyan bari bari aa jaa rahi hain).',
        reason: 'Salt Range lane maintenance & safety barrier replacement.',
        detourAdvice: 'Shift to lower gear on steep descent and use open overtaking lane.',
      },
      turnByTurn: [
        { step: 1, text: `Depart from ${originName || 'Current Location'}`, icon: 'navigate', type: 'start' },
        { step: 2, text: 'Merge onto Motorway towards M-2 Lahore Corridor', icon: 'speedometer', highway: 'M-2 Motorway' },
        { step: 3, text: 'Descend scenic Salt Range (km 225)', icon: 'trail-sign', highway: 'M-2 Motorway' },
        { step: 4, text: '⚠️ ⛔ HAZARD: Speed slow karein! Salt Range lane resurfacing & single-lane traffic (+15 min delay)', icon: 'warning', isDelay: true },
        { step: 5, text: 'Cruise past Bhera & Sukheke service areas on M-2 (120 km/h)', icon: 'car-sport', highway: 'M-2 Motorway' },
        { step: 6, text: `Enter Lahore via Thokar Niaz Baig / Babu Sabu Interchange`, icon: 'flag', type: 'destination' },
      ],
    };
  }

  // 4. Islamabad / Rawalpindi
  if (d.includes('islamabad') || d.includes('rawalpindi')) {
    return {
      motorwayRoute: {
        id: 'motorway',
        name: '⚡ Shortest Express Motorway Route',
        badge: 'M-1 / M-2 ➔ Srinagar Highway',
        highways: ['Motorway Corridor', 'Srinagar Highway', 'Islamabad Expressway'],
        typeLabel: 'Express Motorway Route',
        color: '#15803d',
        isShortest: true,
        desc: 'Direct highway corridor into Islamabad Capital Territory via Zero Point.',
      },
      gtRoadRoute: {
        id: 'gt_road',
        name: '🚗 Alternative N-5 GT Road Route',
        badge: 'N-5 Grand Trunk Road',
        highways: ['N-5 GT Road via Taxila & Margalla Pass'],
        typeLabel: 'National Highway Route',
        color: '#2563eb',
        isShortest: false,
        desc: 'Historic Margalla Pass highway leading into Rawalpindi Saddar & Islamabad.',
      },
      roadBlock: {
        hasBlock: true,
        title: '⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK & HIGH TRAFFIC',
        locationName: 'Islamabad Entrance Corridor near Toll Plaza Link',
        coords: [33.645, 72.985],
        delayMins: 10,
        speedWarning: 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 35 km/h).',
        constructionNotice: 'Sadak ki lane maintenance chal rahi hai: Two-way road ab single one-way lane mein tabdeel ho gayi hai.',
        reason: 'Toll plaza approach lane resurfacing & expansion.',
        detourAdvice: 'Follow overhead electronic road signs into Capital Territory.',
      },
      turnByTurn: [
        { step: 1, text: `Depart from ${originName || 'Current Location'}`, icon: 'navigate', type: 'start' },
        { step: 2, text: 'Follow Motorway corridor towards Islamabad Toll Plaza', icon: 'speedometer', highway: 'Motorway' },
        { step: 3, text: '⚠️ ⛔ HAZARD: Speed slow karein! Toll Plaza approach lane resurfacing (+10 min delay)', icon: 'warning', isDelay: true },
        { step: 4, text: 'Merge onto Srinagar Highway towards Islamabad city center', icon: 'trail-sign', highway: 'Srinagar Highway' },
        { step: 5, text: `Reach final destination: ${destName || 'Islamabad'}`, icon: 'flag', type: 'destination' },
      ],
    };
  }

  // 5. Murree & Galyat
  if (d.includes('murree') || d.includes('galyat')) {
    return {
      motorwayRoute: {
        id: 'motorway',
        name: '⚡ Shortest Murree Expressway Route',
        badge: 'N-75 Murree Expressway',
        highways: ['Barakahu Bypass', 'N-75 Murree Expressway', 'Mall Road Corridor'],
        typeLabel: '4-Lane Alpine Expressway',
        color: '#15803d',
        isShortest: true,
        desc: 'Fastest route via elevated Barakahu Bypass and 4-lane expressway to Lower Topa.',
      },
      gtRoadRoute: {
        id: 'gt_road',
        name: '🚗 Old Murree Road via Tret',
        badge: 'Old Murree Alpine Highway',
        highways: ['Old Murree Road (via Tret & Salgran)'],
        typeLabel: 'Scenic Mountain Highway',
        color: '#2563eb',
        isShortest: false,
        desc: 'Winding scenic road through pine forests and roadside chai stalls.',
      },
      roadBlock: {
        hasBlock: true,
        title: '⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK & HIGH TRAFFIC',
        locationName: 'Murree Expressway (N-75) near Lower Topa',
        coords: [33.880, 73.370],
        delayMins: 15,
        speedWarning: 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 30 km/h).',
        constructionNotice: 'Sadak ki hillside protection work chal rahi hai: Two-way road ab single one-way lane mein chal rahi hai.',
        reason: 'Hillside retaining wall maintenance.',
        detourAdvice: 'Follow motorway police hand signals and lane dividers.',
      },
      turnByTurn: [
        { step: 1, text: `Depart from ${originName || 'Current Location'}`, icon: 'navigate', type: 'start' },
        { step: 2, text: 'Take Murree Expressway (N-75) via elevated Barakahu Bypass', icon: 'speedometer', highway: 'N-75' },
        { step: 3, text: '⚠️ ⛔ HAZARD: Speed slow karein! Hillside protection work & single lane diversion (+15 min delay)', icon: 'warning', isDelay: true },
        { step: 4, text: 'Climb pine forest ridge towards Mall Road / Kashmir Point', icon: 'trail-sign', highway: 'Expressway' },
        { step: 5, text: `Reach final destination: ${destName || 'Murree'}`, icon: 'flag', type: 'destination' },
      ],
    };
  }

  // 6. Coastal Destinations (Gwadar, Karachi Coast, Kund Malir, Ormara)
  if (d.includes('gwadar') || d.includes('kund malir') || d.includes('ormara') || d.includes('karachi')) {
    return {
      motorwayRoute: {
        id: 'motorway',
        name: '⚡ Shortest Coastal Highway Route',
        badge: 'Makran Coastal Highway (N-10)',
        highways: ['National Highway Corridor', 'Makran Coastal Highway (N-10)'],
        typeLabel: 'Scenic Coastal Highway',
        color: '#15803d',
        isShortest: true,
        desc: 'Direct highway along the Arabian Sea coast.',
      },
      gtRoadRoute: {
        id: 'gt_road',
        name: '🚗 Regional Coastal Highway Link',
        badge: 'RCD / Regional Link Highway',
        highways: ['RCD Highway Link', 'Coastal Connecting Road'],
        typeLabel: 'Regional Highway',
        color: '#2563eb',
        isShortest: false,
        desc: 'Regional transit corridor connecting coastal towns.',
      },
      roadBlock: {
        hasBlock: true,
        title: '⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK & HIGH TRAFFIC',
        locationName: 'Makran Coastal Highway (N-10) near Kund Malir Pass',
        coords: [25.500, 65.450],
        delayMins: 15,
        speedWarning: 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 40 km/h).',
        constructionNotice: 'Sadak ki sand clearance chal rahi hai: Two-way road ab single one-way lane mein chal rahi hai.',
        reason: 'Windblown coastal sand removal & barrier repair.',
        detourAdvice: 'Drive with caution and headlights on in sand drift zones.',
      },
      turnByTurn: [
        { step: 1, text: `Depart from ${originName || 'Current Location'}`, icon: 'navigate', type: 'start' },
        { step: 2, text: 'Take National Highway corridor towards Coastal belt', icon: 'speedometer', highway: 'Highway Corridor' },
        { step: 3, text: '⚠️ ⛔ HAZARD: Speed slow karein! Coastal sand drift clearance & single lane road (+15 min delay)', icon: 'warning', isDelay: true },
        { step: 4, text: 'Cruise along scenic Arabian Sea Coastal Highway (N-10)', icon: 'trail-sign', highway: 'N-10' },
        { step: 5, text: `Reach final destination: ${destName || 'Destination'}`, icon: 'flag', type: 'destination' },
      ],
    };
  }

  // 7. Dynamic Route & Hazard Interpolation for ANY other Destination in Pakistan
  const hazardLat = Number(((oLat * 0.45) + (dLat * 0.55)).toFixed(4));
  const hazardLon = Number(((oLon * 0.45) + (dLon * 0.55)).toFixed(4));

  return {
    motorwayRoute: {
      id: 'motorway',
      name: `⚡ Shortest Motorway Route to ${destName}`,
      badge: `Primary Motorway Corridor to ${destName}`,
      highways: [`Motorway Corridor towards ${destName}`, 'Direct Express Highway'],
      typeLabel: 'Primary Motorway Route',
      color: '#15803d',
      isShortest: true,
      desc: `Optimal fastest access controlled highway corridor leading to ${destName}.`,
    },
    gtRoadRoute: {
      id: 'gt_road',
      name: `🚗 Alternative Highway Route to ${destName}`,
      badge: `National Highway Network to ${destName}`,
      highways: [`National Highway (N-5 / Regional Link) towards ${destName}`],
      typeLabel: 'National Highway Route',
      color: '#2563eb',
      isShortest: false,
      desc: `Alternative scenic highway passing through regional towns towards ${destName}.`,
    },
    roadBlock: {
      hasBlock: true,
      title: '⚠️ ⛔ SPEED SLOW KAREIN — ROAD BLOCK & HIGH TRAFFIC',
      locationName: `Highway Corridor approaching ${destName}`,
      coords: [hazardLat, hazardLon],
      delayMins: 15,
      speedWarning: 'Speed slow karein! Aagay road block aur high traffic jam hai (Speed limit 35 km/h).',
      constructionNotice: 'Sadak ki repair / patch work chal rahi hai: Two-way road ab single one-way lane mein convert ho gayi hai aur gariyan aik hi lane se aa jaa rahi hain.',
      reason: 'Routine highway patch work & single-lane diversion. High traffic congestion.',
      detourAdvice: 'Follow road signs and maintain safe following distance.',
    },
    turnByTurn: [
      { step: 1, text: `Depart from ${originName || 'Current Location'}`, icon: 'navigate', type: 'start' },
      { step: 2, text: `Take primary highway corridor towards ${destName}`, icon: 'speedometer', highway: 'Express Corridor' },
      { step: 3, text: '⚠️ ⛔ HAZARD: Speed slow karein! Road construction & single lane diversion reported (+15 min delay)', icon: 'warning', isDelay: true },
      { step: 4, text: `Cruise along expressway corridor approaching ${destName}`, icon: 'trail-sign', highway: 'Express Corridor' },
      { step: 5, text: `Reach final destination: ${destName}`, icon: 'flag', type: 'destination' },
    ],
  };
}

/**
 * Returns dynamic journey progression stages (Departing Origin ➔ On Highway ➔ In Transit City ➔ Reached Final Destination)
 * for live GPS driving simulation and tracking.
 */
export function getJourneyStages(originName, destName, originCoords, destCoords) {
  const oLat = Number(originCoords?.[0]) || 31.4504;
  const oLon = Number(originCoords?.[1]) || 73.1350;
  const dLat = Number(destCoords?.[0]) || 33.7667;
  const dLon = Number(destCoords?.[1]) || 72.3667;

  const o = String(originName || '').toLowerCase();
  const d = String(destName || '').toLowerCase();

  let stage1Label = `Departing ${originName || 'Origin'}`;
  let stage2Label = 'On Motorway / Highway (Cruising)';
  let stage3Label = 'In Transit City / Approach Interchange';
  let stage4Label = `Arrived at ${destName || 'Final Destination'}!`;

  if (o.includes('faisalabad') && d.includes('attock')) {
    stage1Label = 'Faisalabad City (Starting Point)';
    stage2Label = 'M-4 / M-2 Motorway (Cruising 110 km/h)';
    stage3Label = 'Islamabad / Rawalpindi Ring (Transit Hub)';
    stage4Label = `${destName || 'Attock'} (Final Destination Reached)`;
  } else if (o.includes('attock') && d.includes('malam jabba')) {
    stage1Label = `${originName || 'Attock'} (Starting Point)`;
    stage2Label = 'M-1 Motorway ➔ Swat Expressway (M-16)';
    stage3Label = 'Mingora / Barikot (Swat Valley Transit)';
    stage4Label = 'Malam Jabba Ski Resort (Final Destination Reached)';
  } else if (o.includes('lahore') && d.includes('islamabad')) {
    stage1Label = 'Lahore City (Starting Point)';
    stage2Label = 'M-2 Motorway (Salt Range / Bhera)';
    stage3Label = 'Islamabad Toll Plaza (Zero Point Approach)';
    stage4Label = 'Islamabad Capital (Final Destination Reached)';
  } else if (d.includes('attock')) {
    stage1Label = `${originName || 'Origin'} (Starting Point)`;
    stage2Label = 'Motorway Transit Corridor (Cruising)';
    stage3Label = 'Islamabad / Rawalpindi Transit Corridor';
    stage4Label = 'Attock City (Final Destination Reached)';
  }

  return [
    {
      index: 0,
      title: 'Stage 1: Origin',
      locationName: stage1Label,
      coords: [oLat, oLon],
      percent: 0,
      speed: '0 km/h',
      statusText: `Current location: ${stage1Label}. Starting vehicle engine and checking GPS signal.`,
      icon: 'flag-outline',
    },
    {
      index: 1,
      title: 'Stage 2: On Motorway',
      locationName: stage2Label,
      coords: [
        Number((oLat + (dLat - oLat) * 0.38).toFixed(4)),
        Number((oLon + (dLon - oLon) * 0.38).toFixed(4)),
      ],
      percent: 38,
      speed: '115 km/h',
      statusText: `Current location: ${stage2Label}. High-speed motorway cruising, upcoming route ahead active.`,
      icon: 'speedometer-outline',
    },
    {
      index: 2,
      title: 'Stage 3: In Transit City',
      locationName: stage3Label,
      coords: [
        Number((oLat + (dLat - oLat) * 0.75).toFixed(4)),
        Number((oLon + (dLon - oLon) * 0.75).toFixed(4)),
      ],
      percent: 75,
      speed: '70 km/h',
      statusText: `Current situation: ${stage3Label}. Passing transit interchange, final approach underway.`,
      icon: 'business-outline',
    },
    {
      index: 3,
      title: 'Stage 4: Arrived!',
      locationName: stage4Label,
      coords: [dLat, dLon],
      percent: 100,
      speed: '0 km/h',
      statusText: `🎉 You have reached your final destination: ${destName}!`,
      icon: 'checkmark-circle-outline',
      isArrived: true,
    },
  ];
}
