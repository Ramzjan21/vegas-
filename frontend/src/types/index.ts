export type UserRole = 'ADMINISTRATOR' | 'OFITSIANT' | 'KASSIR' | 'OMBORCHI';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  isActive: boolean;
  createdAt?: string;
  _count?: {
    orders?: number;
    payments?: number;
  };
}

export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  sortOrder: number;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  isAvailable: boolean;
  unit: string;
  categoryId: number;
  category?: Category;
  inventoryId?: number | null;
  inventory?: InventoryItem | null;
}

export type TableStatus = 'EMPTY' | 'OCCUPIED' | 'RESERVED';

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: TableStatus;
  section: string;
  activeOrder?: Order | null;
  activeReservation?: Reservation | null;
}

export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  comment?: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  tableId: number;
  table: Table;
  waiterId: number;
  waiter: {
    id: number;
    fullName: string;
    username?: string;
    phone?: string;
  };
  customerId?: number | null;
  customer?: Customer | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  serviceFee: number;
  finalAmount: number;
  notes?: string | null;
  items: OrderItem[];
  payment?: Payment | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: number;
  orderId: number;
  order?: Order;
  cashierId: number;
  cashier?: {
    id: number;
    fullName: string;
  };
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'MIXED';
  cashReceived?: number | null;
  changeGiven?: number | null;
  paidAt: string;
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  visitsCount: number;
  totalSpent: number;
  notes?: string | null;
  lastVisitAt?: string | null;
  createdAt: string;
  _count?: {
    orders: number;
    reservations: number;
  };
}

export interface Reservation {
  id: number;
  customerName: string;
  customerPhone: string;
  customerId?: number | null;
  tableId: number;
  table: Table;
  guestsCount: number;
  reservationDate: string;
  reservationTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  initialStock: number;
  currentStock: number;
  minStock: number;
  pricePerUnit: number;
  createdAt?: string;
}

export interface InventoryTransaction {
  id: number;
  inventoryId: number;
  inventory: InventoryItem;
  userId: number;
  user: { fullName: string };
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  cost?: number | null;
  note?: string | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'NEW_ORDER' | 'RESERVATION' | 'PAYMENT' | 'ORDER_READY';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  user?: {
    id: number;
    fullName: string;
    username: string;
    role: string;
  } | null;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface SystemSettings {
  id: number;
  cafeName: string;
  address: string;
  phone: string;
  serviceFeePercent: number;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
}

export interface DashboardStats {
  todaySales: number;
  todayOrdersCount: number;
  activeOrdersCount: number;
  emptyTablesCount: number;
  occupiedTablesCount: number;
  reservedTablesCount: number;
  lowStockCount: number;
  averageCheck: number;
}
