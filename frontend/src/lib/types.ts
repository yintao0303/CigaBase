export interface CigaretteProduct {
  id: number;
  brand_id: number;
  brand_name: string;
  name: string;
  full_name: string;
  type: string;
  cigarette_type: string;
  tar: string;
  nicotine: string;
  co: string;
  length: string;
  packaging: string;
  primary_color: string;
  secondary_color: string;
  quantity_per_box: string;
  boxes_per_carton: string;
  price_per_box: string;
  price_per_carton: string;
  barcode_box: string;
  barcode_carton: string;
  coverpic: string;
  coverpic_thumb400x300: string;
  coverpic_thumb120x90: string;
  popularity: number;
  rating_taste: number;
  rating_appearance: number;
  rating_value: number;
  rating_overall: number;
  rating_count: number;
  comment_count: number;
  packprice_raw: number;
  barprice_raw: number;
}

export interface Brand {
  id: number;
  name: string;
  product_count: number;
  coverpic: string;
  desp: string;
  region: string;
}
