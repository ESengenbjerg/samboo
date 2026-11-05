export type Listing = {
  id: number;
  agency: string;
  external_id: number;
  url: string;
  property_type: string | null;
  municipality: string | null;
  area: string | null;
  price: number | null;
  rooms: number | null;
  living_area?: number | null;
  monthly_fee?: number | null;
  address: string | null;
  image_url: string | null;
  is_new_construction: boolean;
};

export type UserListing = {
  id: number;
  is_new: boolean;
  liked: boolean;
  listings: Listing;
};

// A listing together with my user_listings row data, so the UI can show the "Ny" flag
// and attach tags (listing_tags.user_listing_id = user_listing_id)
export type MatchedListing = Listing & {
  user_listing_id: number;
  is_new: boolean;
};

// UserListing with the owner, used when rows from several users are fetched at once
export type MemberUserListing = UserListing & {
  user_id: string;
};

// Only the listing id of a liked user_listings row (listings.id = user_listings.listing_id)
export type LikedListingId = {
  listing_id: number;
};
