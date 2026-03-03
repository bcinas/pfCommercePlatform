export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IProductSpecification {
  key: string;
  value: string;
}

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string | ICategory;
  stock: number;
  isActive: boolean;
  rating: number;
  numReviews: number;
  specifications: IProductSpecification[];
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProductResponse {
  products: IProduct[];
  page: number;
  totalPages: number;
  totalProducts: number;
}
