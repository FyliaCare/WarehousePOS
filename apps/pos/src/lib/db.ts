import Dexie, { Table } from 'dexie';
import type { Product, Customer, Category } from '@warehousepos/types';

// Offline-first database for POS
export class POSDatabase extends Dexie {
  products!: Table<Product>;
  categories!: Table<Category>;
  customers!: Table<Customer>;
  pendingSales!: Table<PendingSale>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('warehousepos');
    
    this.version(1).stores({
      products: 'id, store_id, category_id, name, sku, barcode, is_active, [store_id+is_active]',
      categories: 'id, store_id, name, [store_id+is_active]',
      customers: 'id, store_id, phone, name, [store_id+phone]',
      pendingSales: '++id, store_id, created_at, status',
      syncQueue: '++id, table_name, operation, created_at, status',
    });
  }
}

export interface PendingSale {
  id?: number;
  store_id: string;
  customer_id?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  notes?: string;
  created_at: string;
  status: 'pending' | 'synced' | 'failed';
  synced_sale_id?: string;
}

export interface SaleItem {
  product_id: string;
  variant_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface SyncQueueItem {
  id?: number;
  table_name: 'products' | 'categories' | 'customers' | 'sales';
  operation: 'create' | 'update' | 'delete';
  record_id: string;
  data: any;
  created_at: string;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
  retry_count: number;
}

// Create database instance
export const db = new POSDatabase();

// Sync helpers
export async function addToSyncQueue(
  tableName: SyncQueueItem['table_name'],
  operation: SyncQueueItem['operation'],
  recordId: string,
  data: any
) {
  await db.syncQueue.add({
    table_name: tableName,
    operation,
    record_id: recordId,
    data,
    created_at: new Date().toISOString(),
    status: 'pending',
    retry_count: 0,
  });
}

export async function getPendingSyncItems() {
  return db.syncQueue.where('status').equals('pending').toArray();
}

export async function markSyncItemSynced(id: number) {
  await db.syncQueue.update(id, { status: 'synced' });
}

export async function markSyncItemFailed(id: number, error: string) {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, {
      status: item.retry_count >= 3 ? 'failed' : 'pending',
      error,
      retry_count: item.retry_count + 1,
    });
  }
}

// Clear old synced items (older than 24 hours)
export async function clearSyncedItems() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await db.syncQueue
    .where('status')
    .equals('synced')
    .filter((item) => item.created_at < yesterday)
    .delete();
}
