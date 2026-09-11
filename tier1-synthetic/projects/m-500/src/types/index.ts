export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  imageUrl?: string;
  stock: number;
}

export interface Order extends BaseEntity {
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  actionUrl?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
