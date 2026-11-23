const fs = require('fs');
const path = require('path');

const backendHotelsPath = path.join(__dirname, '..', 'data', 'hotels.json');
const frontendHotelsPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'data', 'hotels.json');

const existingHotels = JSON.parse(fs.readFileSync(backendHotelsPath, 'utf8'));

// 27 additional destinations to cover all 48 destinations in PakistanDestinations.json
const newHotels = [
  // 1. Bahawalpur
  {
    id: 'bahawalpur-hotel-one',
    name: 'Hotel One Bahawalpur',
    city: 'Bahawalpur',
    rating: 4.4,
    comfortLevel: 'Normal',
    pricePerNight: 13500,
    latitude: 29.3956,
    longitude: 71.6836,
    amenities: ['Free Wi-Fi', 'Complimentary Breakfast', 'AC', '24/7 Room Service', 'Power Backup'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'bw-one-std', name: 'Deluxe Room', price: 13500, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'bw-one-exec', name: 'Executive Suite', price: 18500, capacity: 3, available: 2, bed: '1 King Bed + Sofa' },
      { id: 'bw-one-fam', name: 'Family Room', price: 22000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'bahawalpur-grand-regency',
    name: 'Grand Regency Hotel Bahawalpur',
    city: 'Bahawalpur',
    rating: 4.6,
    comfortLevel: 'Luxury',
    pricePerNight: 23500,
    latitude: 29.3872,
    longitude: 71.6912,
    amenities: ['Fine Dining Restaurant', 'Swimming Pool', 'Fitness Club', 'Free Wi-Fi', 'Concierge'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
    rooms: [
      { id: 'bw-reg-dlx', name: 'Royal Executive Room', price: 23500, capacity: 2, available: 3, bed: '1 King Bed' },
      { id: 'bw-reg-suite', name: 'Nawab Presidential Suite', price: 36000, capacity: 4, available: 1, bed: '2 King Beds' }
    ]
  },
  {
    id: 'bahawalpur-victoria-lodge',
    name: 'Victoria Tourist Lodge Bahawalpur',
    city: 'Bahawalpur',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 4200,
    latitude: 29.3921,
    longitude: 71.6789,
    amenities: ['Free Wi-Fi', 'Air Cooling / AC', 'Car Parking', '24/7 Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'bw-vic-std', name: 'Standard Room', price: 4200, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'bw-vic-quad', name: 'Family Economy Quad', price: 5800, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 2. Taxila
  {
    id: 'taxila-ptdc-motel',
    name: 'PTDC Motel & Tourist Village Taxila',
    city: 'Taxila',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 6500,
    latitude: 33.7463,
    longitude: 72.8397,
    amenities: ['Garden View', 'Traditional Restaurant', 'Free Parking', 'Museum Shuttle'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'tax-ptdc-std', name: 'Deluxe Heritage Room', price: 6500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'tax-ptdc-fam', name: 'Family Quad Room', price: 8500, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'taxila-gandhara-resort',
    name: 'Gandhara Castle Heritage Resort Taxila',
    city: 'Taxila',
    rating: 4.7,
    comfortLevel: 'Luxury',
    pricePerNight: 16500,
    latitude: 33.7512,
    longitude: 72.8450,
    amenities: ['Historical Architecture', 'Fine Dining', 'Courtyard Gardens', 'Free Wi-Fi', 'Spa'],
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=80',
    rooms: [
      { id: 'tax-gan-dlx', name: 'Ancient Ashoka Deluxe', price: 16500, capacity: 2, available: 3, bed: '1 King Bed' },
      { id: 'tax-gan-suite', name: 'Gandhara Royal Suite', price: 26000, capacity: 4, available: 1, bed: '2 King Beds' }
    ]
  },
  {
    id: 'taxila-heritage-inn',
    name: 'Taxila Ruins Budget Inn',
    city: 'Taxila',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3500,
    latitude: 33.7401,
    longitude: 72.8311,
    amenities: ['Free Parking', 'Hot Water', 'Wi-Fi', 'Room Service'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'tax-inn-std', name: 'Standard Room', price: 3500, capacity: 2, available: 5, bed: '1 Double Bed' },
      { id: 'tax-inn-quad', name: 'Economy Quad (4-Bed)', price: 4800, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 3. Rohtas Fort & Jhelum
  {
    id: 'rohtas-tulip-riverside',
    name: 'Tulip Riverside Hotel Jhelum',
    city: 'Rohtas Fort',
    rating: 4.5,
    comfortLevel: 'Luxury',
    pricePerNight: 15500,
    latitude: 32.9344,
    longitude: 73.7271,
    amenities: ['River Jhelum View', 'Multi-Cuisine Restaurant', 'Gym', 'Free Wi-Fi', 'Banquet Hall'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'roh-tulip-std', name: 'River View Deluxe', price: 15500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'roh-tulip-suite', name: 'Executive Riverside Suite', price: 24000, capacity: 3, available: 2, bed: '1 King + Living Room' }
    ]
  },
  {
    id: 'rohtas-heritage-resort',
    name: 'Rohtas Fort Heritage Tourist Lodge',
    city: 'Rohtas Fort',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 7500,
    latitude: 32.9667,
    longitude: 73.5833,
    amenities: ['Fort View', 'Courtyard Dining', 'Tour Guide Service', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'roh-lodge-std', name: 'Historic Deluxe Room', price: 7500, capacity: 2, available: 4, bed: '1 Queen Bed' },
      { id: 'roh-lodge-fam', name: 'Fort Family Suite', price: 10500, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'rohtas-dina-inn',
    name: 'Dina Rohtas Tourist Rest House',
    city: 'Rohtas Fort',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3600,
    latitude: 32.9810,
    longitude: 73.6012,
    amenities: ['Free Parking', 'Hot Water', 'Desi Breakfast', '24/7 Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'roh-dina-std', name: 'Budget Double Room', price: 3600, capacity: 2, available: 5, bed: '1 Double Bed' },
      { id: 'roh-dina-quad', name: 'Budget Quad Room', price: 4600, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 4. Mohenjo-daro & Larkana
  {
    id: 'mohenjo-sambara-inn',
    name: 'Sambara Inn Larkana',
    city: 'Mohenjo-daro',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 8500,
    latitude: 27.5590,
    longitude: 68.2120,
    amenities: ['AC Rooms', 'Sindhi Traditional Food', 'Free Wi-Fi', 'Archaeological Tour Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'moh-sam-std', name: 'Executive Room', price: 8500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'moh-sam-fam', name: 'Family Room', price: 12000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'mohenjo-ptdc-motel',
    name: 'PTDC Motel Mohenjo-daro',
    city: 'Mohenjo-daro',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 4000,
    latitude: 27.3292,
    longitude: 68.1389,
    amenities: ['Direct Site Access', 'Lush Gardens', 'Restaurant', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'moh-ptdc-std', name: 'Standard Site Room', price: 4000, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'moh-ptdc-quad', name: 'Family Room', price: 5500, capacity: 4, available: 2, bed: '2 Double Beds' }
    ]
  },

  // 5. Thatta & Makli
  {
    id: 'thatta-keenjhar-resort',
    name: 'Keenjhar Lake Water Resort Thatta',
    city: 'Thatta & Makli',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 7800,
    latitude: 24.9333,
    longitude: 68.0500,
    amenities: ['Lake View', 'Boating Dock', 'Fish BBQ Restaurant', 'Lawn Area'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'tha-lake-std', name: 'Lake View Deluxe Hut', price: 7800, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'tha-lake-fam', name: 'Family Lakeside Cottage', price: 12500, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },
  {
    id: 'thatta-heritage-lodge',
    name: 'Makli Necropolis Tourist Lodge',
    city: 'Thatta & Makli',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3500,
    latitude: 24.7461,
    longitude: 67.9239,
    amenities: ['Historic Site Access', 'Traditional Sindhi Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'tha-mak-std', name: 'Standard Room', price: 3500, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'tha-mak-quad', name: 'Budget Quad', price: 4500, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 6. Deosai National Park
  {
    id: 'deosai-wilderness-camps',
    name: 'Deosai Glamping & Wilderness Eco Resort',
    city: 'Deosai National Park',
    rating: 4.8,
    comfortLevel: 'Luxury',
    pricePerNight: 19500,
    latitude: 35.0303,
    longitude: 75.4419,
    amenities: ['Heated Luxury Domes', 'Stargazing Telescopes', 'Gourmet Meals Included', 'Solar Heating', 'Oxygen Support'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'deo-dome-dlx', name: 'Stargazer Luxury Dome', price: 19500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'deo-dome-fam', name: 'Family Wilderness Dome', price: 28000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'deosai-sheosar-lodge',
    name: 'Sheosar Lake Adventure Campsite',
    city: 'Deosai National Park',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 8500,
    latitude: 34.9961,
    longitude: 75.2472,
    amenities: ['Lake View Tents', 'Campfire & BBQ', 'Hot Sleeping Bags', 'Local Mountain Guide'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'deo-sheo-std', name: 'Alpine Safari Tent', price: 8500, capacity: 2, available: 5, bed: '1 Double Bed' },
      { id: 'deo-sheo-fam', name: 'Family Group Tent', price: 12000, capacity: 4, available: 3, bed: '4 Single Beds' }
    ]
  },
  {
    id: 'deosai-bara-pani-hut',
    name: 'Bara Pani Alpine Base Camp',
    city: 'Deosai National Park',
    rating: 4.1,
    comfortLevel: 'Basic',
    pricePerNight: 4000,
    latitude: 35.0500,
    longitude: 75.4800,
    amenities: ['River Crossing Point', 'Hot Tea & Meals', 'Basic Sleeping Mats', 'Emergency Radio'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'deo-bara-std', name: 'Alpine Base Tent', price: 4000, capacity: 2, available: 8, bed: '2 Sleeping Beds' },
      { id: 'deo-bara-quad', name: 'Quad Trekker Tent', price: 5500, capacity: 4, available: 4, bed: '4 Trekker Mats' }
    ]
  },

  // 7. Naltar Valley
  {
    id: 'naltar-ski-resort',
    name: 'Naltar Pine Ski & Mountain Resort',
    city: 'Naltar Valley',
    rating: 4.7,
    comfortLevel: 'Luxury',
    pricePerNight: 21000,
    latitude: 36.1333,
    longitude: 74.1833,
    amenities: ['Ski Slope Access', 'Pine Forest View', 'Heated Wooden Cottages', 'Central Heating', 'Gourmet Kitchen'],
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=80',
    rooms: [
      { id: 'nal-ski-dlx', name: 'Pine Wooden Chalet', price: 21000, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'nal-ski-fam', name: 'Alpine Family Chalet', price: 32000, capacity: 4, available: 2, bed: '2 King Beds' }
    ]
  },
  {
    id: 'naltar-heights-inn',
    name: 'Naltar Lakes Tourist Inn',
    city: 'Naltar Valley',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 8500,
    latitude: 36.1500,
    longitude: 74.2000,
    amenities: ['Color Lakes Jeep Shuttle', 'Local Trout Fish', 'Bonfire Night', 'Hot Water'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'nal-lake-std', name: 'Deluxe Pine Room', price: 8500, capacity: 2, available: 5, bed: '1 Queen Bed' },
      { id: 'nal-lake-fam', name: 'Family Room', price: 11500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'naltar-mehmood-lodge',
    name: 'Mehmood Rest House Naltar Bala',
    city: 'Naltar Valley',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 3800,
    latitude: 36.1250,
    longitude: 74.1750,
    amenities: ['Mountain View', 'Hot Water Buckets', 'Local Chai & Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'nal-meh-std', name: 'Standard Room', price: 3800, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'nal-meh-quad', name: 'Budget Quad (4-Bed)', price: 4800, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 8. Khunjerab Pass / Sost
  {
    id: 'khunjerab-silk-route-lodge',
    name: 'Silk Route Luxury Lodge Sost',
    city: 'Khunjerab Pass',
    rating: 4.6,
    comfortLevel: 'Luxury',
    pricePerNight: 16500,
    latitude: 36.6853,
    longitude: 74.8211,
    amenities: ['Border Highway View', 'Central Heating', 'Chinese & Pakistani Cuisine', 'Free Wi-Fi', 'Oxygen Facility'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'khu-silk-dlx', name: 'Border View Deluxe', price: 16500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'khu-silk-fam', name: 'Silk Route Family Suite', price: 24000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'khunjerab-sost-embassy',
    name: 'Sost Embassy Hotel & Tourist Point',
    city: 'Khunjerab Pass',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 7500,
    latitude: 36.6800,
    longitude: 74.8150,
    amenities: ['Free Parking', 'Warm Rooms', 'Restaurant', 'Currency Exchange'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'khu-emb-std', name: 'Standard Heated Room', price: 7500, capacity: 2, available: 5, bed: '1 Queen Bed' },
      { id: 'khu-emb-fam', name: 'Family Room', price: 10500, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'khunjerab-border-inn',
    name: 'Khunjerab National Park Tourist Inn',
    city: 'Khunjerab Pass',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 4200,
    latitude: 36.7000,
    longitude: 74.8400,
    amenities: ['Scenic Mountain Backdrop', 'Warm Bedding', 'Hot Tea & Meals', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'khu-inn-std', name: 'Budget Double', price: 4200, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'khu-inn-quad', name: 'Budget Quad (4-Bed)', price: 5500, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 9. Kumrat Valley
  {
    id: 'kumrat-glamping-resort',
    name: 'Kumrat Valley River Glamping & Pods',
    city: 'Kumrat Valley',
    rating: 4.8,
    comfortLevel: 'Luxury',
    pricePerNight: 16500,
    latitude: 35.5342,
    longitude: 72.2156,
    amenities: ['Panjkora River View', 'Heated Luxury Pods', 'Campfire & Trout BBQ', 'Wi-Fi', 'Solar Power'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'kum-glamp-std', name: 'Riverfront Glamping Pod', price: 16500, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'kum-glamp-fam', name: 'Family Riverside Chalet', price: 24000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'kumrat-panjkora-lodge',
    name: 'Panjkora River View Hotel Kumrat',
    city: 'Kumrat Valley',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 7500,
    latitude: 35.5200,
    longitude: 72.2000,
    amenities: ['Forest Setting', 'Hot Water', 'Traditional Food', 'Jeep Hire Service'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'kum-pan-std', name: 'Deluxe Forest Room', price: 7500, capacity: 2, available: 6, bed: '1 Queen Bed' },
      { id: 'kum-pan-fam', name: 'Family Quad Room', price: 10500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'kumrat-forest-inn',
    name: 'Thal & Kumrat Tourist Rest House',
    city: 'Kumrat Valley',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 3500,
    latitude: 35.5050,
    longitude: 72.1850,
    amenities: ['Free Parking', 'Hot Water', 'Campfire Area', 'Local Cuisine'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'kum-for-std', name: 'Budget Forest Room', price: 3500, capacity: 2, available: 8, bed: '1 Double Bed' },
      { id: 'kum-for-quad', name: 'Budget Quad (4-Bed)', price: 4600, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 10. Clifton & Sea View (Karachi)
  {
    id: 'clifton-beach-luxury',
    name: 'Beach Luxury Hotel Karachi',
    city: 'Clifton & Sea View',
    rating: 4.5,
    comfortLevel: 'Luxury',
    pricePerNight: 26000,
    latitude: 24.8428,
    longitude: 66.9961,
    amenities: ['Creek Waterfront View', 'Outdoor Swimming Pool', 'Seafood Restaurant', 'High-Speed Wi-Fi', 'Spa'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'clif-lux-std', name: 'Waterfront Executive', price: 26000, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'clif-lux-suite', name: 'Creek Presidential Suite', price: 42000, capacity: 4, available: 2, bed: '2 King Beds' }
    ]
  },
  {
    id: 'clifton-sea-view-inn',
    name: 'Sea View Promenade Hotel',
    city: 'Clifton & Sea View',
    rating: 4.1,
    comfortLevel: 'Normal',
    pricePerNight: 11000,
    latitude: 24.7950,
    longitude: 67.0300,
    amenities: ['Arabian Sea Breeze', 'AC', 'Breakfast Included', 'Free Wi-Fi', 'Beach Access'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
    rooms: [
      { id: 'clif-view-std', name: 'Ocean View Room', price: 11000, capacity: 2, available: 6, bed: '1 Queen Bed' },
      { id: 'clif-view-fam', name: 'Family Beach Suite', price: 16500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'clifton-budget-lodge',
    name: 'Clifton Coast Tourist Lodge',
    city: 'Clifton & Sea View',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 5200,
    latitude: 24.8100,
    longitude: 67.0250,
    amenities: ['Free Wi-Fi', 'AC', '24/7 Desk', 'Room Service'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'clif-bud-std', name: 'Standard Room', price: 5200, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'clif-bud-quad', name: 'Family Quad', price: 7200, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 11. French Beach & Hawksbay
  {
    id: 'hawksbay-beach-chalets',
    name: 'Hawksbay Coastal Chalets & Huts',
    city: 'French Beach & Hawksbay',
    rating: 4.6,
    comfortLevel: 'Luxury',
    pricePerNight: 24000,
    latitude: 24.8561,
    longitude: 66.8622,
    amenities: ['Direct Sand Beachfront', 'Private BBQ Terrace', 'Generator Power Backup', 'Kitchen Facility', 'Caretaker'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'hawk-chalet-std', name: 'Private Beach Chalet', price: 24000, capacity: 4, available: 3, bed: '2 King Beds' },
      { id: 'hawk-chalet-large', name: 'VIP Double Beach Villa', price: 38000, capacity: 8, available: 1, bed: '4 Queen Beds' }
    ]
  },
  {
    id: 'french-beach-residency',
    name: 'French Beach Tourist Huts',
    city: 'French Beach & Hawksbay',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 12500,
    latitude: 24.8450,
    longitude: 66.8400,
    amenities: ['Rocky Beach View', 'Snorkeling Access', 'Seafood Catering', 'Private Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'fren-hut-std', name: 'Beachfront Hut', price: 12500, capacity: 4, available: 4, bed: '2 Double Beds' },
      { id: 'fren-hut-fam', name: 'Deluxe Extended Hut', price: 18000, capacity: 6, available: 2, bed: '3 Double Beds' }
    ]
  },
  {
    id: 'hawksbay-budget-huts',
    name: 'Mauripur Coast Tourist Huts',
    city: 'French Beach & Hawksbay',
    rating: 3.8,
    comfortLevel: 'Basic',
    pricePerNight: 5500,
    latitude: 24.8600,
    longitude: 66.8700,
    amenities: ['Beach Access', 'Fresh Water', 'Parking', 'Day & Night Stay'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'hawk-bud-hut', name: 'Standard Beach Hut', price: 5500, capacity: 4, available: 5, bed: '2 Charpoys + Mattresses' }
    ]
  },

  // 12. Ormara Beach
  {
    id: 'ormara-beach-resort',
    name: 'Ormara Turtle Beach Resort',
    city: 'Ormara Beach',
    rating: 4.6,
    comfortLevel: 'Luxury',
    pricePerNight: 16500,
    latitude: 25.2078,
    longitude: 64.6364,
    amenities: ['Makran Coastal Highway View', 'Private Arabian Sea Beach', 'Seafood Dining', 'Campfire Nights', 'Wi-Fi'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'orm-res-dlx', name: 'Oceanfront Eco Chalet', price: 16500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'orm-res-fam', name: 'Family Coastal Villa', price: 24000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'ormara-hammerhead-inn',
    name: 'Hammerhead View Tourist Inn Ormara',
    city: 'Ormara Beach',
    rating: 4.1,
    comfortLevel: 'Normal',
    pricePerNight: 7500,
    latitude: 25.2000,
    longitude: 64.6200,
    amenities: ['Hammerhead Cliff View', 'Hot Water', 'Desi & Balochi Cuisine', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'orm-ham-std', name: 'Standard Room', price: 7500, capacity: 2, available: 5, bed: '1 Double Bed' },
      { id: 'orm-ham-quad', name: 'Family Quad Room', price: 10500, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },
  {
    id: 'ormara-coastal-lodge',
    name: 'Ormara Coastal Rest House',
    city: 'Ormara Beach',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3800,
    latitude: 25.1950,
    longitude: 64.6100,
    amenities: ['Beach Access', 'Power Backup', 'Local Chai & Food', 'Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'orm-coa-std', name: 'Budget Double', price: 3800, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'orm-coa-quad', name: 'Budget Quad (4-Bed)', price: 4800, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 13. Astola Island
  {
    id: 'astola-eco-resort',
    name: 'Astola Eco-Island Expedition Camp',
    city: 'Astola Island',
    rating: 4.8,
    comfortLevel: 'Luxury',
    pricePerNight: 19500,
    latitude: 25.1219,
    longitude: 63.8475,
    amenities: ['Island Glamping Tents', 'Snorkeling & Scuba Gear', 'Deep Sea Fishing', 'Boat Transport Included', 'Fresh Seafood Chef'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'ast-eco-dlx', name: 'Coral Bay Safari Tent', price: 19500, capacity: 2, available: 4, bed: '1 Double Bed' },
      { id: 'ast-eco-quad', name: 'Expedition Quad Tent', price: 26000, capacity: 4, available: 2, bed: '4 Single Mats' }
    ]
  },
  {
    id: 'astola-pasni-lodge',
    name: 'Pasni Harbour Transit Tourist Lodge',
    city: 'Astola Island',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 3800,
    latitude: 25.2631,
    longitude: 63.4692,
    amenities: ['Harbour View', 'Astola Boat Booking', 'Hot Water', 'Desi Fish Restaurant'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'ast-pas-std', name: 'Standard Room', price: 3800, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'ast-pas-quad', name: 'Family Quad', price: 5000, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 14. Faisalabad
  {
    id: 'faisalabad-serena',
    name: 'Faisalabad Serena Hotel',
    city: 'Faisalabad',
    rating: 4.7,
    comfortLevel: 'Luxury',
    pricePerNight: 28500,
    latitude: 31.4187,
    longitude: 73.0791,
    amenities: ['5-Star Luxury', 'Swimming Pool', 'Health Club & Spa', 'Executive Lounge', 'Multiple Restaurants'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'fsd-ser-dlx', name: 'Deluxe King Room', price: 28500, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'fsd-ser-suite', name: 'Serena Executive Suite', price: 45000, capacity: 3, available: 2, bed: '1 King + Living Room' }
    ]
  },
  {
    id: 'faisalabad-hotel-one',
    name: 'Hotel One Faisalabad',
    city: 'Faisalabad',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 13500,
    latitude: 31.4250,
    longitude: 73.0850,
    amenities: ['Complimentary Breakfast', 'Free High-Speed Wi-Fi', 'Gym', 'Restaurant', 'Airport Shuttle'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
    rooms: [
      { id: 'fsd-one-std', name: 'Deluxe Room', price: 13500, capacity: 2, available: 6, bed: '1 King Bed' },
      { id: 'fsd-one-fam', name: 'Family Room', price: 18500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'faisalabad-heritage-inn',
    name: 'Clock Tower Tourist Inn Faisalabad',
    city: 'Faisalabad',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 4200,
    latitude: 31.4150,
    longitude: 73.0750,
    amenities: ['City Center', 'AC', 'Free Wi-Fi', '24/7 Room Service'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'fsd-inn-std', name: 'Standard Room', price: 4200, capacity: 2, available: 8, bed: '1 Double Bed' },
      { id: 'fsd-inn-quad', name: 'Economy Quad', price: 5800, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 15. Sialkot
  {
    id: 'sialkot-javson-hotel',
    name: 'Javson Hotel Sialkot',
    city: 'Sialkot',
    rating: 4.6,
    comfortLevel: 'Luxury',
    pricePerNight: 22000,
    latitude: 32.5020,
    longitude: 74.5360,
    amenities: ['Executive Business Rooms', 'Swimming Pool', 'Multi-Cuisine Buffet', 'Fitness Center', 'Valet Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'skt-jav-dlx', name: 'Executive Deluxe Room', price: 22000, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'skt-jav-suite', name: 'Presidential Suite', price: 35000, capacity: 3, available: 2, bed: '1 King + Living Lounge' }
    ]
  },
  {
    id: 'sialkot-hotel-one',
    name: 'Hotel One Sialkot',
    city: 'Sialkot',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 13000,
    latitude: 32.4950,
    longitude: 74.5280,
    amenities: ['Buffet Breakfast', 'Free Wi-Fi', 'AC', 'Room Service', 'Airport Pick & Drop'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
    rooms: [
      { id: 'skt-one-std', name: 'Deluxe Room', price: 13000, capacity: 2, available: 6, bed: '1 King Bed' },
      { id: 'skt-one-fam', name: 'Family Room', price: 17500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'sialkot-premier-lodge',
    name: 'Sialkot Cantt Tourist Lodge',
    city: 'Sialkot',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3900,
    latitude: 32.5100,
    longitude: 74.5400,
    amenities: ['Safe Location', 'AC', 'Free Wi-Fi', '24/7 Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'skt-prem-std', name: 'Standard Room', price: 3900, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'skt-prem-quad', name: 'Economy Quad', price: 5200, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 16. Harappa & Sahiwal
  {
    id: 'harappa-sahiwal-hotel-one',
    name: 'Hotel One Sahiwal',
    city: 'Harappa',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 11500,
    latitude: 30.6682,
    longitude: 73.1114,
    amenities: ['Free Wi-Fi', 'Complimentary Breakfast', 'AC', 'Restaurant', 'Harappa Tour Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'har-one-std', name: 'Deluxe King', price: 11500, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'har-one-fam', name: 'Family Suite', price: 16000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'harappa-archaeology-rest-house',
    name: 'Harappa Museum Archaeological Rest House',
    city: 'Harappa',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 3500,
    latitude: 30.6300,
    longitude: 72.8600,
    amenities: ['Direct Ruins Walk', 'Lawn & Gardens', 'Traditional Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'har-arc-std', name: 'Heritage Double', price: 3500, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'har-arc-quad', name: 'Heritage Quad', price: 4600, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 17. Katas Raj & Khewra
  {
    id: 'khewra-salt-resort',
    name: 'Khewra Salt Range Tourist Resort',
    city: 'Katas Raj & Khewra',
    rating: 4.4,
    comfortLevel: 'Normal',
    pricePerNight: 7800,
    latitude: 32.6500,
    longitude: 73.0100,
    amenities: ['Salt Mine View', 'Restaurant', 'AC', 'Wi-Fi', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'kat-khe-std', name: 'Salt Range Deluxe', price: 7800, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'kat-khe-fam', name: 'Family Quad', price: 10500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'katas-raj-heritage-inn',
    name: 'Katas Raj Sacred Pond Guest House',
    city: 'Katas Raj & Khewra',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 3400,
    latitude: 32.7275,
    longitude: 72.9556,
    amenities: ['Temple View', 'Lush Hills', 'Desi Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'kat-inn-std', name: 'Standard Room', price: 3400, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'kat-inn-quad', name: 'Budget Quad', price: 4500, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 18. Hyderabad
  {
    id: 'hyderabad-indus-hotel',
    name: 'Indus Hotel Hyderabad',
    city: 'Hyderabad',
    rating: 4.5,
    comfortLevel: 'Luxury',
    pricePerNight: 18500,
    latitude: 25.3960,
    longitude: 68.3578,
    amenities: ['Fine Dining Restaurant', 'AC', 'Free High-Speed Wi-Fi', 'Gym', 'Banquet Services'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'hyd-ind-dlx', name: 'Executive Deluxe', price: 18500, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'hyd-ind-suite', name: 'Royal Indus Suite', price: 28000, capacity: 3, available: 2, bed: '1 King + Living Room' }
    ]
  },
  {
    id: 'hyderabad-city-gate',
    name: 'City Gate Hotel Hyderabad',
    city: 'Hyderabad',
    rating: 4.1,
    comfortLevel: 'Normal',
    pricePerNight: 8500,
    latitude: 25.3850,
    longitude: 68.3650,
    amenities: ['Central City Location', 'AC', 'Breakfast Included', 'Free Wi-Fi'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
    rooms: [
      { id: 'hyd-gate-std', name: 'Deluxe Room', price: 8500, capacity: 2, available: 6, bed: '1 Queen Bed' },
      { id: 'hyd-gate-fam', name: 'Family Room', price: 12000, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'hyderabad-budget-inn',
    name: 'Sindh Heritage Budget Inn Hyderabad',
    city: 'Hyderabad',
    rating: 3.8,
    comfortLevel: 'Basic',
    pricePerNight: 3900,
    latitude: 25.3900,
    longitude: 68.3700,
    amenities: ['Free Parking', 'AC', '24/7 Desk', 'Room Service'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'hyd-bud-std', name: 'Standard Room', price: 3900, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'hyd-bud-quad', name: 'Economy Quad', price: 5200, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 19. Sukkur
  {
    id: 'sukkur-hotel-one',
    name: 'Hotel One Sukkur',
    city: 'Sukkur',
    rating: 4.4,
    comfortLevel: 'Normal',
    pricePerNight: 13500,
    latitude: 27.7052,
    longitude: 68.8574,
    amenities: ['Buffet Breakfast', 'Airport Shuttle', 'Free Wi-Fi', 'AC', 'Lansdowne Bridge Tour Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'suk-one-std', name: 'Deluxe Room', price: 13500, capacity: 2, available: 6, bed: '1 King Bed' },
      { id: 'suk-one-fam', name: 'Family Suite', price: 18000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'sukkur-indus-hotel',
    name: 'Indus Hotel Sukkur',
    city: 'Sukkur',
    rating: 4.5,
    comfortLevel: 'Luxury',
    pricePerNight: 19000,
    latitude: 27.7120,
    longitude: 68.8650,
    amenities: ['River Indus View', 'Swimming Pool', 'Multi-Cuisine Dining', 'Free Wi-Fi', 'Fitness Center'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
    rooms: [
      { id: 'suk-ind-dlx', name: 'Riverfront Deluxe', price: 19000, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'suk-ind-suite', name: 'Executive Suite', price: 29000, capacity: 3, available: 2, bed: '1 King + Living Lounge' }
    ]
  },
  {
    id: 'sukkur-forum-inn',
    name: 'Forum Inn Tourist Lodge Sukkur',
    city: 'Sukkur',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 4200,
    latitude: 27.7000,
    longitude: 68.8500,
    amenities: ['Central Location', 'AC', 'Desi Breakfast', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'suk-for-std', name: 'Standard Room', price: 4200, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'suk-for-quad', name: 'Economy Quad', price: 5600, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 20. Manora Island
  {
    id: 'manora-marina-resort',
    name: 'Manora Marina Waterfront Resort',
    city: 'Manora Island',
    rating: 4.5,
    comfortLevel: 'Luxury',
    pricePerNight: 19500,
    latitude: 24.7950,
    longitude: 66.9730,
    amenities: ['Private Beach Promenade', 'Harbour Ferry Access', 'Seafood Grill', 'Lighthouse View', 'Wi-Fi'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'man-res-dlx', name: 'Waterfront Chalet', price: 19500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'man-res-fam', name: 'Family Beach Villa', price: 28000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'manora-lighthouse-lodge',
    name: 'Manora Lighthouse Tourist Rest House',
    city: 'Manora Island',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 4500,
    latitude: 24.7900,
    longitude: 66.9700,
    amenities: ['Sea View', 'Ferry Point Walking Distance', 'Local Fish Dhaba', 'Terrace'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'man-lig-std', name: 'Standard Room', price: 4500, capacity: 2, available: 6, bed: '1 Double Bed' },
      { id: 'man-lig-quad', name: 'Family Quad', price: 6200, capacity: 4, available: 3, bed: '2 Double Beds' }
    ]
  },

  // 21. Quetta
  {
    id: 'quetta-serena-hotel',
    name: 'Quetta Serena Hotel',
    city: 'Quetta',
    rating: 4.7,
    comfortLevel: 'Luxury',
    pricePerNight: 29500,
    latitude: 30.1798,
    longitude: 67.0011,
    amenities: ['5-Star Luxury', 'Heated Outdoor Pool', 'Tennis Courts', 'Traditional Balochi Sajji', 'Spa & Health Club'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'qta-ser-dlx', name: 'Executive Deluxe', price: 29500, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'qta-ser-suite', name: 'Ziarat Suite', price: 46000, capacity: 3, available: 2, bed: '1 King + Sitting Area' },
      { id: 'qta-ser-fam', name: 'Family Executive Suite', price: 54000, capacity: 4, available: 1, bed: '2 King Beds' }
    ]
  },
  {
    id: 'quetta-bloom-star',
    name: 'Bloom Star Hotel Quetta',
    city: 'Quetta',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 9500,
    latitude: 30.1850,
    longitude: 67.0120,
    amenities: ['Lush Garden', 'Traditional Food', 'Heating / AC', 'Free Wi-Fi', 'Secure Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
    rooms: [
      { id: 'qta-bloom-std', name: 'Deluxe Garden Room', price: 9500, capacity: 2, available: 6, bed: '1 Queen Bed' },
      { id: 'qta-bloom-fam', name: 'Family Garden Suite', price: 13500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'quetta-lourdes-hotel',
    name: 'Lourdes Hotel Quetta',
    city: 'Quetta',
    rating: 4.1,
    comfortLevel: 'Normal',
    pricePerNight: 8000,
    latitude: 30.1900,
    longitude: 67.0150,
    amenities: ['Historic Property', 'Spacious Lawns', 'Traditional Restaurant', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'qta-lour-std', name: 'Deluxe Classic Room', price: 8000, capacity: 2, available: 6, bed: '1 Queen Bed' },
      { id: 'qta-lour-fam', name: 'Family Room', price: 11000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'quetta-budget-inn',
    name: 'Chaman Highway Tourist Rest House Quetta',
    city: 'Quetta',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3800,
    latitude: 30.1700,
    longitude: 67.0050,
    amenities: ['Free Parking', 'Warm Bedding', 'Hot Water', 'Desi Tea & Food'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'qta-bud-std', name: 'Budget Double', price: 3800, capacity: 2, available: 8, bed: '1 Double Bed' },
      { id: 'qta-bud-quad', name: 'Budget Quad (4-Bed)', price: 4800, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 22. Ziarat
  {
    id: 'ziarat-juniper-resort',
    name: 'Juniper View Alpine Resort Ziarat',
    city: 'Ziarat',
    rating: 4.6,
    comfortLevel: 'Luxury',
    pricePerNight: 16500,
    latitude: 30.3833,
    longitude: 67.7333,
    amenities: ['Juniper Forest Panoramic View', 'Central Heating', 'Balochi Sajji & Barbeque', 'Free Wi-Fi', 'Campfire'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'zia-jun-dlx', name: 'Juniper Chalet', price: 16500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'zia-jun-fam', name: 'Family Pine Suite', price: 24000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'ziarat-ptdc-motel',
    name: 'PTDC Motel Ziarat',
    city: 'Ziarat',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 7500,
    latitude: 30.3800,
    longitude: 67.7280,
    amenities: ['Near Quaid-e-Azam Residency', 'Heaters', 'Lush Pine Lawns', 'Traditional Food'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'zia-ptdc-std', name: 'Deluxe Pine Room', price: 7500, capacity: 2, available: 5, bed: '1 Queen Bed' },
      { id: 'zia-ptdc-fam', name: 'Family Quad Room', price: 10500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'ziarat-residency-inn',
    name: 'Ziarat Valley Budget Rest House',
    city: 'Ziarat',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3800,
    latitude: 30.3750,
    longitude: 67.7200,
    amenities: ['Mountain View', 'Hot Water', 'Warm Blankets', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'zia-bud-std', name: 'Budget Double', price: 3800, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'zia-bud-quad', name: 'Budget Quad (4-Bed)', price: 4800, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 23. Astore & Rama Meadows
  {
    id: 'astore-rama-resort',
    name: 'Rama Green Valley Resort & Lake Lodge',
    city: 'Astore & Rama Meadows',
    rating: 4.7,
    comfortLevel: 'Luxury',
    pricePerNight: 15500,
    latitude: 35.3667,
    longitude: 74.9000,
    amenities: ['Nanga Parbat Peak View', 'Heated Wooden Cabins', 'Bonfire Nights', 'Trout Fish', 'Rama Lake Guide'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'ast-ram-dlx', name: 'Nanga Parbat View Cabin', price: 15500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'ast-ram-fam', name: 'Meadow Family Chalet', price: 23000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'astore-valley-inn',
    name: 'Astore Heights Tourist Inn',
    city: 'Astore & Rama Meadows',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 7000,
    latitude: 35.3500,
    longitude: 74.8850,
    amenities: ['River View', 'Hot Water', 'Traditional Food', 'Jeep Hire Service'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'ast-val-std', name: 'Deluxe View Room', price: 7000, capacity: 2, available: 5, bed: '1 Queen Bed' },
      { id: 'ast-val-fam', name: 'Family Quad Room', price: 9500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'astore-wazir-lodge',
    name: 'Wazir Alpine Rest House Astore',
    city: 'Astore & Rama Meadows',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3500,
    latitude: 35.3400,
    longitude: 74.8700,
    amenities: ['Mountain View', 'Hot Water Buckets', 'Desi Chai & Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'ast-waz-std', name: 'Standard Room', price: 3500, capacity: 2, available: 8, bed: '1 Double Bed' },
      { id: 'ast-waz-quad', name: 'Budget Quad (4-Bed)', price: 4600, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 24. Khaplu & Shigar
  {
    id: 'khaplu-serena-palace',
    name: 'Serena Khaplu Palace Heritage Hotel',
    city: 'Khaplu & Shigar',
    rating: 4.8,
    comfortLevel: 'Luxury',
    pricePerNight: 32000,
    latitude: 35.1583,
    longitude: 76.3333,
    amenities: ['19th-Century Royal Palace', 'Lush Apricot Orchards', 'Organic Dining', 'Balti Cultural Museum', 'Wi-Fi'],
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=80',
    rooms: [
      { id: 'khp-ser-dlx', name: 'Royal Heritage Deluxe', price: 32000, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'khp-ser-suite', name: 'Raja Royal Suite', price: 48000, capacity: 3, available: 2, bed: '1 King + Royal Lounge' }
    ]
  },
  {
    id: 'shigar-serena-fort',
    name: 'Serena Shigar Fort - Fong-Khar',
    city: 'Khaplu & Shigar',
    rating: 4.9,
    comfortLevel: 'Luxury',
    pricePerNight: 34000,
    latitude: 35.4267,
    longitude: 75.7333,
    amenities: ['400-Year-Old Palace on the Rock', 'Stream Side Dining', 'Balti Heritage Rooms', 'Gourmet Organic Food', 'Wi-Fi'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'shg-ser-dlx', name: 'Historic Fort Deluxe', price: 34000, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'shg-ser-suite', name: 'Amacha Garden Suite', price: 52000, capacity: 3, available: 2, bed: '1 King + Sitting Terrace' }
    ]
  },
  {
    id: 'shigar-karakoram-view',
    name: 'Karakoram View Tourist Inn Shigar',
    city: 'Khaplu & Shigar',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 8500,
    latitude: 35.4200,
    longitude: 75.7250,
    amenities: ['Fruit Orchard View', 'Hot Water', 'Balti Food', 'Jeep Rental Desk'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'shg-kar-std', name: 'Deluxe Orchard Room', price: 8500, capacity: 2, available: 5, bed: '1 Queen Bed' },
      { id: 'shg-kar-fam', name: 'Family Quad Room', price: 11500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'khaplu-budget-lodge',
    name: 'Khaplu Valley Budget Rest House',
    city: 'Khaplu & Shigar',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 4000,
    latitude: 35.1500,
    longitude: 76.3250,
    amenities: ['Mountain View', 'Hot Water', 'Desi Tea & Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'khp-bud-std', name: 'Standard Room', price: 4000, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'khp-bud-quad', name: 'Budget Quad (4-Bed)', price: 5200, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 25. Ghizer & Phander Lake
  {
    id: 'phander-lake-resort',
    name: 'Phander Lake Holiday Resort & Cabins',
    city: 'Ghizer & Phander Lake',
    rating: 4.7,
    comfortLevel: 'Luxury',
    pricePerNight: 16500,
    latitude: 36.1772,
    longitude: 72.9378,
    amenities: ['Phander Cobalt Lake View', 'Trout Fishing', 'Heated Wooden Cabins', 'Campfire & BBQ', 'Wi-Fi'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'pha-res-dlx', name: 'Cobalt Lakefront Cabin', price: 16500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'pha-res-fam', name: 'Family Lakeside Villa', price: 24000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'phander-ptdc-motel',
    name: 'PTDC Motel Phander Ghizer',
    city: 'Ghizer & Phander Lake',
    rating: 4.3,
    comfortLevel: 'Normal',
    pricePerNight: 8000,
    latitude: 36.1800,
    longitude: 72.9400,
    amenities: ['Valley River View', 'Trout Dining', 'Free Parking', 'Hot Water'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'pha-ptdc-std', name: 'Deluxe Lake View', price: 8000, capacity: 2, available: 5, bed: '1 Queen Bed' },
      { id: 'pha-ptdc-fam', name: 'Family Quad Room', price: 11000, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'ghizer-river-inn',
    name: 'Ghizer River Tourist Rest House',
    city: 'Ghizer & Phander Lake',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 3600,
    latitude: 36.1650,
    longitude: 72.9200,
    amenities: ['River Sound', 'Hot Water Buckets', 'Local Chai & Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'ghi-inn-std', name: 'Budget Double', price: 3600, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'ghi-inn-quad', name: 'Budget Quad (4-Bed)', price: 4800, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 26. Muzaffarabad & Pir Chinasi
  {
    id: 'muzaffarabad-pc-hotel',
    name: 'Pearl Continental Hotel Muzaffarabad',
    city: 'Muzaffarabad & Pir Chinasi',
    rating: 4.8,
    comfortLevel: 'Luxury',
    pricePerNight: 27500,
    latitude: 34.3700,
    longitude: 73.4711,
    amenities: ['Hilltop Panoramic View', '5-Star Luxury', 'Multi-Cuisine Restaurants', 'Fitness Center', 'Spa & Heated Jacuzzi'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80',
    rooms: [
      { id: 'muz-pc-dlx', name: 'Deluxe Mountain View', price: 27500, capacity: 2, available: 5, bed: '1 King Bed' },
      { id: 'muz-pc-suite', name: 'Kashmir Executive Suite', price: 44000, capacity: 3, available: 2, bed: '1 King + Living Lounge' },
      { id: 'muz-pc-fam', name: 'Family Suite', price: 52000, capacity: 4, available: 1, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'pir-chinasi-heights-resort',
    name: 'Pir Chinasi Panoramic Heights Resort',
    city: 'Muzaffarabad & Pir Chinasi',
    rating: 4.4,
    comfortLevel: 'Normal',
    pricePerNight: 10500,
    latitude: 34.3850,
    longitude: 73.5350,
    amenities: ['Cloud View at 9,500ft', 'Heated Rooms', 'Campfire & BBQ', 'Wi-Fi', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'pir-chi-std', name: 'Deluxe Cloud Room', price: 10500, capacity: 2, available: 4, bed: '1 Queen Bed' },
      { id: 'pir-chi-fam', name: 'Family Cloud Suite', price: 14500, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'muzaffarabad-neelum-view',
    name: 'Neelum View Tourist Rest House Muzaffarabad',
    city: 'Muzaffarabad & Pir Chinasi',
    rating: 4.0,
    comfortLevel: 'Basic',
    pricePerNight: 4000,
    latitude: 34.3600,
    longitude: 73.4600,
    amenities: ['River Neelum View', 'Hot Water', 'Kashmiri Cuisine', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'muz-nee-std', name: 'Standard Room', price: 4000, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'muz-nee-quad', name: 'Budget Quad (4-Bed)', price: 5200, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  },

  // 27. Rawalakot & Banjosa Lake
  {
    id: 'banjosa-lake-resort',
    name: 'Banjosa Lake Pine Resort & Cabins',
    city: 'Rawalakot & Banjosa Lake',
    rating: 4.6,
    comfortLevel: 'Luxury',
    pricePerNight: 17500,
    latitude: 33.8058,
    longitude: 73.8189,
    amenities: ['Direct Lakeside Wooden Cabins', 'Dense Pine Forests', 'Boating Dock', 'Bonfire & BBQ', 'Wi-Fi'],
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    rooms: [
      { id: 'ban-lake-dlx', name: 'Lakeside Pine Chalet', price: 17500, capacity: 2, available: 4, bed: '1 King Bed' },
      { id: 'ban-lake-fam', name: 'Family Lake Villa', price: 25000, capacity: 4, available: 2, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'toli-peer-tourist-inn',
    name: 'Toli Peer Green Heights Tourist Inn',
    city: 'Rawalakot & Banjosa Lake',
    rating: 4.2,
    comfortLevel: 'Normal',
    pricePerNight: 8500,
    latitude: 33.8900,
    longitude: 73.8600,
    amenities: ['Panoramic Meadow View', 'Hot Water', 'Kashmiri Chai & BBQ', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80',
    rooms: [
      { id: 'tol-peer-std', name: 'Deluxe Meadow Room', price: 8500, capacity: 2, available: 5, bed: '1 Queen Bed' },
      { id: 'tol-peer-fam', name: 'Family Quad Room', price: 11500, capacity: 4, available: 3, bed: '2 Queen Beds' }
    ]
  },
  {
    id: 'rawalakot-green-lodge',
    name: 'Rawalakot Valley Tourist Rest House',
    city: 'Rawalakot & Banjosa Lake',
    rating: 3.9,
    comfortLevel: 'Basic',
    pricePerNight: 3800,
    latitude: 33.8500,
    longitude: 73.7600,
    amenities: ['Valley View', 'Hot Water', 'Desi Food', 'Free Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    rooms: [
      { id: 'raw-lod-std', name: 'Standard Room', price: 3800, capacity: 2, available: 7, bed: '1 Double Bed' },
      { id: 'raw-lod-quad', name: 'Budget Quad (4-Bed)', price: 4900, capacity: 4, available: 4, bed: '2 Double Beds' }
    ]
  }
];

// Merge unique by id
const existingIds = new Set(existingHotels.map(h => h.id));
let addedCount = 0;
for (const h of newHotels) {
  if (!existingIds.has(h.id)) {
    existingHotels.push(h);
    existingIds.add(h.id);
    addedCount++;
  }
}

console.log(`Added ${addedCount} hotels. Total hotels: ${existingHotels.length}`);

// Write to backend
fs.writeFileSync(backendHotelsPath, JSON.stringify(existingHotels, null, 2), 'utf8');
console.log('Saved to:', backendHotelsPath);

// Write to frontend
fs.writeFileSync(frontendHotelsPath, JSON.stringify(existingHotels, null, 2), 'utf8');
console.log('Saved to:', frontendHotelsPath);
