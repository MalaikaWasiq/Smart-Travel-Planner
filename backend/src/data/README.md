# Local Planning Data

## `hotels.json`

`hotels.json` is the `curated-local-v1` planning catalog for the supported Pakistani destinations. Hotel names, city placement, approximate coordinates, public rating estimates, and common amenities were manually curated for the academic prototype. Image URLs use Unsplash-hosted hotel photography as illustrative imagery and are not property-specific booking photos.

Prices are dated planning estimates in PKR, not scraped rates, live availability, or booking quotes. The API marks every record with `priceType=estimate`, `lastUpdated`, and a user-facing disclaimer. Users must verify current price and availability directly with a hotel before booking.

When this file is updated, change the source version, update `lastUpdated`, and retain the estimate disclaimer. A future live provider may replace price fields only after its terms, attribution, and price semantics are documented.

The v1.0.0 client package includes this catalog because it is required for deterministic laptop demonstrations without a commercial booking API. See the root `FEATURES.md` and `CLIENT_DELIVERY.md` for product scope and packaging rules.
