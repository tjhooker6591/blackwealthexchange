export type TravelMapAddress = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  formatted?: string;
};

export type TravelMapLocation = {
  lat?: number | null;
  lng?: number | null;
};

export type TravelMapBusiness = {
  _id: string;
  business_name: string;
  slug?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  website?: string;
  phone?: string;
  image?: string | null;
  verified?: boolean;
  sponsored?: boolean;
  featured?: boolean;
  address?: TravelMapAddress;
  location?: TravelMapLocation;
};

export type TravelMapSearchResponse = {
  ok: boolean;
  total: number;
  page: number;
  pageSize: number;
  results: TravelMapBusiness[];
  filters: {
    q: string;
    city: string;
    state: string;
    category: string;
    verified: boolean;
    sponsored: boolean;
  };
};
