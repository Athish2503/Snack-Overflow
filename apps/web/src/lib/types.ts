export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export type SnackCategory = 'SWEET' | 'SAVOURY' | 'DRINK' | 'HEALTHY_ISH';
export type SnackStatus = 'stocked' | 'running_low' | 'gone';

export interface Snack {
  id: string;
  name: string;
  category: SnackCategory;
  quantity: number;
  lowStockThreshold: number;
  calories?: number | null;
  imageUrl?: string | null;
  images?: string[];
  status: SnackStatus;
  voteCount: number;
  hasVoted: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SnackSummary {
  counts: {
    stocked: number;
    running_low: number;
    gone: number;
  };
  snackOfTheWeek: {
    id: string;
    name: string;
    category?: SnackCategory;
    calories?: number | null;
    imageUrl?: string | null;
    images?: string[];
    voteCount: number;
  } | null;
}

export interface CartItem {
  snack: Snack;
  quantity: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface SnackListResponse {
  data: Snack[];
  pagination: PaginationMeta;
}

export interface SnackQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: SnackCategory;
  status?: SnackStatus;
  sortBy?: 'name' | 'quantity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export type ActivityAction = 'CONSUMED' | 'RESTOCKED';

export interface ActivityItem {
  id: string;
  userId: string;
  snackId: string;
  action: ActivityAction;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  snack: {
    id: string;
    name: string;
    category: SnackCategory;
  };
}

export interface ActivityListResponse {
  data: ActivityItem[];
  pagination: PaginationMeta;
}
