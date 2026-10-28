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
  ld_json: {
    streetAddress?: string;
    image?: string;
    newProduction?: boolean;
  };
};

export type UserListing = {
  id: number;
  is_new: boolean;
  liked: boolean;
  listings: Listing;
};
