const Destination = require('../models/Destination');
const User = require('../models/User');
const defaultDestinations = require('../data/pakistanDestinations.json');

async function seedDestinationsIfEmpty() {
  try {
    const count = await Destination.countDocuments();
    if (count === 0) {
      console.log('Seeding initial Pakistan destinations into MongoDB...');
      await Destination.insertMany(defaultDestinations);
      console.log(`Successfully seeded ${defaultDestinations.length} destinations.`);
    } else {
      for (const d of defaultDestinations) {
        if (d.destinationId && d.imageUrl) {
          await Destination.updateOne(
            { destinationId: d.destinationId },
            { $set: { imageUrl: d.imageUrl, description: d.description, bestTimeToVisit: d.bestTimeToVisit } }
          );
        }
      }
      console.log('Synced latest destination image URLs into MongoDB.');
    }
  } catch (error) {
    console.warn('[destinationService] MongoDB seed skipped or pending connection:', error.message);
  }
}

// Initial seed trigger
seedDestinationsIfEmpty();

async function getDestinations({ category, search, userId } = {}) {
  // Try querying MongoDB first, fallback to JSON data if offline
  let userFavorites = [];
  if (userId) {
    const user = await User.findById(userId).select('favorites').lean().catch(() => null);
    userFavorites = user?.favorites || [];
  }

  let results = [];
  try {
    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { region: reg }, { description: reg }, { popularActivities: reg }];
    }

    results = await Destination.find(query).sort({ featured: -1, rating: -1 }).lean();
  } catch (_) {
    results = [];
  }

  // Fallback to static JSON if DB empty or disconnected
  if (!results || results.length === 0) {
    results = defaultDestinations.filter((dest) => {
      const matchesCategory = !category || category === 'All' || dest.category === category;
      const matchesSearch = !search || !search.trim() ||
        dest.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        dest.region.toLowerCase().includes(search.trim().toLowerCase()) ||
        dest.description.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  return results.map((dest) => ({
    ...dest,
    id: dest.destinationId || dest._id,
    isFavorite: userFavorites.includes(dest.destinationId || String(dest._id)),
  }));
}

async function getDestinationById(id, userId) {
  let userFavorites = [];
  if (userId) {
    const user = await User.findById(userId).select('favorites').lean().catch(() => null);
    userFavorites = user?.favorites || [];
  }

  let dest = null;
  try {
    dest = await Destination.findOne({ destinationId: id }).lean();
    if (!dest && id.match(/^[0-9a-fA-F]{24}$/)) {
      dest = await Destination.findById(id).lean();
    }
  } catch (_) {
    dest = null;
  }

  if (!dest) {
    dest = defaultDestinations.find((d) => d.destinationId === id || d.name.toLowerCase() === id.toLowerCase());
  }

  // Synthesize map geocoded destinations on-the-fly (e.g. map_attock, map_abbottabad)
  if (!dest && typeof id === 'string' && id.startsWith('map_')) {
    const rawName = id.replace(/^map_\d*_?/, '').replace(/_/g, ' ');
    const cityName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Pakistan City';
    dest = {
      destinationId: id,
      name: cityName,
      category: 'Explore Pakistan',
      region: 'Pakistan',
      description: `Explore ${cityName}, Pakistan. Plan your personalized itinerary, hotels, vehicles, and budget with Smart Travel Planner.`,
      bestTimeToVisit: 'Throughout the Year',
      travelDifficulty: 'Easy',
      rating: 4.8,
      popularActivities: ['City Exploration', 'Local Cuisine', 'Cultural Landmarks', 'Scenic Viewpoints'],
      isMapLocation: true,
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80',
    };
  }

  if (!dest) return null;

  return {
    ...dest,
    id: dest.destinationId || dest._id,
    isFavorite: userFavorites.includes(dest.destinationId || String(dest._id)),
  };
}

async function toggleFavorite(userId, destinationId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.favorites = user.favorites || [];
  const index = user.favorites.indexOf(destinationId);
  let isFavorite = false;

  if (index > -1) {
    user.favorites.splice(index, 1);
    isFavorite = false;
  } else {
    user.favorites.push(destinationId);
    isFavorite = true;
  }

  await user.save();
  return { destinationId, isFavorite, favorites: user.favorites };
}

async function getUserFavorites(userId) {
  const user = await User.findById(userId).select('favorites').lean();
  const favoriteIds = user?.favorites || [];
  if (!favoriteIds.length) return [];

  const all = await getDestinations({ userId });
  return all.filter((dest) => favoriteIds.includes(dest.destinationId || String(dest._id)));
}

module.exports = {
  seedDestinationsIfEmpty,
  getDestinations,
  getDestinationById,
  toggleFavorite,
  getUserFavorites,
  defaultDestinations,
};
