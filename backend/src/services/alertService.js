const Alert = require('../models/Alert');

async function syncTripAlerts(trip) {
  if (!trip?._id || !trip.userId) return [];
  const alerts = [];
  const rainyDays = (trip.forecast || []).filter((day) => day.isRainy || /rain|storm|thunder/i.test(`${day.main || ''} ${day.description || ''}`));
  const snowDays = (trip.forecast || []).filter((day) => day.isSnowy || /snow/i.test(`${day.main || ''} ${day.description || ''}`));
  if (rainyDays.length) alerts.push({
    dedupeKey: `trip:${trip._id}:weather:rain`, type: 'weather', severity: 'warning', title: 'Wet weather expected',
    message: `${rainyDays.length} forecast day${rainyDays.length === 1 ? '' : 's'} may include rain or storms. Review indoor alternatives and route timing.`,
  });
  if (snowDays.length) alerts.push({
    dedupeKey: `trip:${trip._id}:weather:snow`, type: 'weather', severity: 'danger', title: 'Snow conditions expected',
    message: 'Snow is present in the saved forecast. Verify road access, closures, clothing, and local safety guidance.',
  });
  if (trip.budgetBreakdown?.exceeded) alerts.push({
    dedupeKey: `trip:${trip._id}:budget:planned`, type: 'budget', severity: 'warning', title: 'Planned budget exceeded',
    message: `The estimate is PKR ${Number(trip.budgetBreakdown.overBy || 0).toLocaleString()} above the trip budget.`,
  });
  if (trip.budgetBreakdown?.actualExceeded) alerts.push({
    dedupeKey: `trip:${trip._id}:budget:actual`, type: 'budget', severity: 'danger', title: 'Actual spending exceeded budget',
    message: `Recorded expenses are PKR ${Number(trip.budgetBreakdown.actualOverBy || 0).toLocaleString()} above budget.`,
  });
  if (trip.route?.status === 'unavailable') alerts.push({
    dedupeKey: `trip:${trip._id}:route:unavailable`, type: 'route', severity: 'warning', title: 'Route data unavailable',
    message: 'One or more stops could not be routed. Verify directions before departure.',
  });
  const activeKeys = alerts.map((item) => item.dedupeKey);
  await Alert.updateMany({ userId: trip.userId, tripId: trip._id, ...(activeKeys.length ? { dedupeKey: { $nin: activeKeys } } : {}) }, { $set: { active: false } });
  const saved = [];
  for (const item of alerts) {
    saved.push(await Alert.findOneAndUpdate(
      { userId: trip.userId, dedupeKey: item.dedupeKey },
      { $set: { ...item, tripId: trip._id, active: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ));
  }
  return saved;
}

module.exports = { syncTripAlerts };
