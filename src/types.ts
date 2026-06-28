export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Fresh Produce' | 'Dairy & Eggs' | 'Meat & Seafood' | 'Beverages' | 'Bakery & Snacks';
  imageUrl: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  unit: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderTrackingHistory {
  status: 'placed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    category: string;
  }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'placed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  trackingHistory: OrderTrackingHistory[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'order' | 'promo' | 'system';
  createdAt: string;
}

export interface Recipe {
  name: string;
  description: string;
  ingredients: {
    name: string;
    amount: string;
    category?: string;
    matchedProduct?: Product;
  }[];
  instructions: string[];
}

export interface ForecastResult {
  categoryRecommendations: {
    category: string;
    currentStock: number;
    forecastedDemand: string; // 'High', 'Medium', 'Low'
    recommendedRestock: number;
    justification: string;
  }[];
  summary: string;
}
