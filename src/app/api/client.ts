const API_BASE = "http://localhost:5000/api";

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || `API Error ${res.status}` };
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `API Error ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    apiRequest<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  getUsers: () => apiRequest<any[]>("/auth/users"),
  createUser: (user: any) =>
    apiRequest<any>("/auth/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),

  // Products
  getProducts: () => apiRequest<any[]>("/products"),
  createProduct: (product: any) =>
    apiRequest<any>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  updateProduct: (code: string, product: any) =>
    apiRequest<any>(`/products/${code}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),
  deleteProduct: (code: string) =>
    apiRequest<any>(`/products/${code}`, {
      method: "DELETE",
    }),

  // Sailors
  getSailors: (search?: string) =>
    apiRequest<any[]>(`/sailors${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getSailor: (id: string) => apiRequest<any>(`/sailors/${id}`),
  createSailor: (sailor: any) =>
    apiRequest<any>("/sailors", {
      method: "POST",
      body: JSON.stringify(sailor),
    }),
  updateSailor: (id: string, sailor: any) =>
    apiRequest<any>(`/sailors/${id}`, {
      method: "PUT",
      body: JSON.stringify(sailor),
    }),
  deleteSailor: (id: string) =>
    apiRequest<any>(`/sailors/${id}`, {
      method: "DELETE",
    }),

  // POS Checkout
  checkout: (cardNumber: string, shipName: string, items: any[]) =>
    apiRequest<any>("/pos/checkout", {
      method: "POST",
      body: JSON.stringify({ cardNumber, shipName, items }),
    }),

  // Stock
  getStockEntries: () => apiRequest<any[]>("/stock"),
  addStock: (stockEntry: any) =>
    apiRequest<any>("/stock", {
      method: "POST",
      body: JSON.stringify(stockEntry),
    }),

  // Vendors
  getVendors: () => apiRequest<any[]>("/vendors"),
  createVendor: (vendor: any) =>
    apiRequest<any>("/vendors", {
      method: "POST",
      body: JSON.stringify(vendor),
    }),
  updateVendor: (id: string, vendor: any) =>
    apiRequest<any>(`/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(vendor),
    }),
  deleteVendor: (id: string) =>
    apiRequest<any>(`/vendors/${id}`, {
      method: "DELETE",
    }),

  // Cards (Recharge / Refund)
  rechargeCard: (sailorId: string, amount: number, remarks?: string) =>
    apiRequest<any>("/cards/recharge", {
      method: "POST",
      body: JSON.stringify({ sailorId, amount, remarks }),
    }),
  refundCard: (sailorId: string, remarks?: string) =>
    apiRequest<any>("/cards/refund", {
      method: "POST",
      body: JSON.stringify({ sailorId, remarks }),
    }),
  getCardTransactions: (customerId?: string) =>
    apiRequest<any[]>(`/cards/transactions${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ""}`),

  // Reports
  getSalesReport: () => apiRequest<any[]>("/reports/sales"),
  getConsoleReport: () => apiRequest<any[]>("/reports/console"),
  getSalesSummary: () => apiRequest<any[]>("/reports/summary"),

  // Settings
  getSettings: () => apiRequest<any>("/settings"),
  updateSettings: (settings: any) =>
    apiRequest<any>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),

  // Categories Master
  getCategories: () => apiRequest<any[]>("/categories"),
  createCategory: (cat: any) =>
    apiRequest<any>("/categories", {
      method: "POST",
      body: JSON.stringify(cat),
    }),
  updateCategory: (id: number, cat: any) =>
    apiRequest<any>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(cat),
    }),
  deleteCategory: (id: number) =>
    apiRequest<any>(`/categories/${id}`, {
      method: "DELETE",
    }),

  createSubCategory: (sub: any) =>
    apiRequest<any>("/categories/subcategories", {
      method: "POST",
      body: JSON.stringify(sub),
    }),
  updateSubCategory: (id: number, sub: any) =>
    apiRequest<any>(`/categories/subcategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(sub),
    }),
  deleteSubCategory: (id: number) =>
    apiRequest<any>(`/categories/subcategories/${id}`, {
      method: "DELETE",
    }),

  // Brands Master
  getBrands: () => apiRequest<any[]>("/categories/brands"),
  createBrand: (brand: any) =>
    apiRequest<any>("/categories/brands", { method: "POST", body: JSON.stringify(brand) }),
  updateBrand: (id: number, brand: any) =>
    apiRequest<any>(`/categories/brands/${id}`, { method: "PUT", body: JSON.stringify(brand) }),
  deleteBrand: (id: number) =>
    apiRequest<any>(`/categories/brands/${id}`, { method: "DELETE" }),

  // Ships / Units Master
  getShips: () => apiRequest<any[]>("/categories/ships"),
  createShip: (ship: any) =>
    apiRequest<any>("/categories/ships", { method: "POST", body: JSON.stringify(ship) }),
  updateShip: (id: number, ship: any) =>
    apiRequest<any>(`/categories/ships/${id}`, { method: "PUT", body: JSON.stringify(ship) }),
  deleteShip: (id: number) =>
    apiRequest<any>(`/categories/ships/${id}`, { method: "DELETE" }),

  // Ranks Master
  getRanks: () => apiRequest<any[]>("/categories/ranks"),
  createRank: (rank: any) =>
    apiRequest<any>("/categories/ranks", { method: "POST", body: JSON.stringify(rank) }),
  updateRank: (id: number, rank: any) =>
    apiRequest<any>(`/categories/ranks/${id}`, { method: "PUT", body: JSON.stringify(rank) }),
  deleteRank: (id: number) =>
    apiRequest<any>(`/categories/ranks/${id}`, { method: "DELETE" }),
};
