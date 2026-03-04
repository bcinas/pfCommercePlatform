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

export interface IReview {
  _id: string;
  user: { _id: string; name: string };
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface IShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface IOrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  createdAt: string;
}
