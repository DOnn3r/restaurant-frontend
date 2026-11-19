export type Role = 'ADMIN' | 'SERVEUR' | 'CUISINIER';
export type ItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type OrderStatus = 'OPEN' | 'PAID' | 'CANCELLED';
export type Payment = 'CASH' | 'CARD' | 'OTHER';

export interface User { id: number; username: string; fullName: string; role: Role; active: boolean }
export interface Dish {
  id: number; name: string; description: string | null; price: number;
  category: string; ingredients: string[]; available: boolean;
}
export interface TableView {
  id: number; label: string; seats: number; occupied: boolean;
  orderId: number | null; total: number; readyCount: number;
}
export interface OrderItem {
  id: number; dishId: number | null; dishName: string; unitPrice: number; quantity: number;
  note: string | null; status: ItemStatus; createdAt: string; lineTotal: number;
}
export interface Order {
  id: number; tableId: number; tableLabel: string; serverName: string; status: OrderStatus;
  createdAt: string; paidAt: string | null; paymentMethod: Payment | null; items: OrderItem[]; total: number;
}
export interface BillLine { name: string; unitPrice: number; quantity: number; total: number }
export interface Bill {
  orderId: number; tableLabel: string; serverName: string; createdAt: string;
  lines: BillLine[]; total: number; unservedCount: number;
}
export interface Ticket { orderId: number; tableLabel: string; serverName: string; createdAt: string; items: OrderItem[] }
export interface Expense { id: number; label: string; category: string; amount: number; date: string }
export interface Stats {
  revenue: number; expenses: number; profit: number; orders: number; averageTicket: number;
  days: { date: string; revenue: number; expenses: number }[];
  topDishes: { name: string; quantity: number; revenue: number }[];
  payments: { method: Payment; amount: number }[];
  expensesByCategory: { category: string; amount: number }[];
}
export interface CartLine { dish: Dish; quantity: number; note: string }

export const ROLE_LABEL: Record<Role, string> = { ADMIN: 'Admin', SERVEUR: 'Serveur', CUISINIER: 'Cuisinier' };
export const PAYMENT_LABEL: Record<Payment, string> = { CASH: 'Espèces', CARD: 'Carte', OTHER: 'Autre' };
