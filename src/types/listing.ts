export type Listing = {
  agency: string;
  external_id: number;
  url: string;
  property_type: string | null;
  municipality: string | null;
  area: string | null;
  price: number | null;
  rooms: number | null;
  ld_json: {
    streetAddress?: string;
    livingArea?: number;
    image?: string;
    monthlyFee?: number,
    newProduction?: boolean,
  };
};
