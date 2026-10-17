/**
 * PackFlow Service Module for REST API Communication
 * Connected to Spring Boot REST backend running on http://localhost:8080
 */

const API_BASE_URL = 'http://localhost:8080/api';

// --- Authentication API ---
export const registerUser = async (fullName, email, mobileNumber, password, confirmPassword) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, mobileNumber, password, confirmPassword })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

export const fetchCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Session expired or invalid token');
  }
  return await response.json();
};

export const logoutUser = async (token) => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) {
    console.warn('Logout notification error:', e.message);
  }
};

// --- Supplier OTP Verification & Registration APIs ---
export const requestSupplierOtp = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/supplier/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send OTP code');
  return data;
};

export const verifySupplierOtp = async (email, otp) => {
  const response = await fetch(`${API_BASE_URL}/auth/supplier/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to verify OTP code');
  return data;
};

export const completeSupplierRegistration = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/supplier/complete-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Supplier registration failed');
  return data;
};

// --- Dashboard & Module APIs ---
export const fetchDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  if (!response.ok) throw new Error('Failed to load system stats');
  return await response.json();
};

// Products
export const fetchProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to load products');
  return await response.json();
};

export const createProduct = async (productData, token) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error('Failed to create product');
  return await response.json();
};

export const updateProduct = async (id, productData, token) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error('Failed to update product master record');
  return await response.json();
};

export const deleteProduct = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete product record');
  return await response.json();
};

// Orders
export const fetchOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  if (!response.ok) throw new Error('Failed to load orders');
  return await response.json();
};

export const fetchMyOrders = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load your orders');
  return await response.json();
};

export const submitPackagingRequirement = async (orderData, token) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  if (!response.ok) throw new Error('Failed to submit packaging requirement');
  return await response.json();
};

export const updateOrderStatus = async (orderId, status, progressPercentage, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status, progressPercentage })
  });
  if (!response.ok) throw new Error('Failed to update order status');
  return await response.json();
};

export const updateCustomerDeadline = async (orderId, targetDeadline, customerInstructions, token, pricingDetails = {}) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/customer-deadline`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      targetDeadline,
      customerInstructions,
      ...pricingDetails
    })
  });
  if (!response.ok) throw new Error('Failed to submit order deadline, instructions & payment');
  return await response.json();
};

export const verifyOrderPayment = async (orderId, verificationType, status, reason, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/verify-payment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ verificationType, status, reason })
  });
  if (!response.ok) throw new Error('Failed to verify payment status');
  return await response.json();
};

export const submitFinalPayment = async (orderId, finalPaymentMethod, finalPaymentSlipUrl, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pay-final-balance`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ finalPaymentMethod, finalPaymentSlipUrl })
  });
  if (!response.ok) throw new Error('Failed to submit final balance payment');
  return await response.json();
};

export const deleteOrder = async (orderId, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  if (!response.ok) throw new Error('Failed to delete order');
  return await response.json();
};

export const placeAndAssignOrder = async (orderId, startDate, endDate, assignedManager, token, pmInstructions = '') => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/place-and-assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ startDate, endDate, assignedManager, pmInstructions })
  });
  if (!response.ok) throw new Error('Failed to place order and assign packaging manager');
  return await response.json();
};

export const assignStaffToOrder = async (
  orderId,
  teamLeader,
  teamMembers,
  status,
  token,
  pmInstructions = '',
  member1Task = '',
  member2Task = '',
  member3Task = '',
  member4Task = '',
  assignedTasksJson = ''
) => {
  const assignedStaff = `Leader: ${teamLeader} | Team: ${teamMembers}`;
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign-staff`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      teamLeader,
      teamMembers,
      assignedStaff,
      status,
      pmInstructions,
      member1Task,
      member2Task,
      member3Task,
      member4Task,
      assignedTasksJson
    })
  });
  if (!response.ok) throw new Error('Failed to assign staff team, individual member tasks, and approve order');
  return await response.json();
};

// --- Staff Member Directory & Registration APIs ---
export const fetchStaffMembers = async () => {
  const response = await fetch(`${API_BASE_URL}/staff`);
  if (!response.ok) throw new Error('Failed to load plant staff members');
  return await response.json();
};

export const createStaffMember = async (staffData, token) => {
  const response = await fetch(`${API_BASE_URL}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(staffData)
  });
  if (!response.ok) throw new Error('Failed to register staff member');
  return await response.json();
};

export const updateStaffMember = async (id, staffData, token) => {
  const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(staffData)
  });
  if (!response.ok) throw new Error('Failed to update staff member record');
  return await response.json();
};

export const deleteStaffMember = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to remove staff member record');
  return await response.json();
};

export const rejectOrderByPm = async (orderId, rejectionReason, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pm-reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ rejectionReason })
  });
  if (!response.ok) throw new Error('Failed to reject order process');
  return await response.json();
};

// Inventory
export const fetchInventory = async () => {
  const response = await fetch(`${API_BASE_URL}/inventory`);
  if (!response.ok) throw new Error('Failed to load inventory items');
  return await response.json();
};

export const addInventoryItem = async (itemData, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  if (!response.ok) throw new Error('Failed to add inventory item');
  return await response.json();
};

export const updateInventoryItem = async (id, itemData, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  if (!response.ok) throw new Error('Failed to update inventory item');
  return await response.json();
};

export const deleteInventoryItem = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete inventory item');
  return await response.json();
};

export const acceptMaterialOrder = async (id, bankDetailsOrToken, tokenArg) => {
  // Support both acceptMaterialOrder(id, token) and acceptMaterialOrder(id, bankDetails, token)
  let bankDetails = null;
  let token = null;
  if (typeof bankDetailsOrToken === 'string') {
    token = bankDetailsOrToken;
  } else {
    bankDetails = bankDetailsOrToken;
    token = tokenArg;
  }

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (bankDetails) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}/inventory/${id}/accept`, {
    method: 'PATCH',
    headers,
    body: bankDetails ? JSON.stringify(bankDetails) : undefined
  });
  if (!response.ok) throw new Error('Failed to accept material order');
  return await response.json();
};

export const paySupplierByVisa = async (id, paymentData, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/inventory/${id}/pay-supplier`, {
    method: 'POST',
    headers,
    body: JSON.stringify(paymentData)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to complete Visa payment to supplier');
  }
  return await response.json();
};

export const markSupplierPaymentNotificationRead = async (id, token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/inventory/${id}/mark-supplier-payment-read`, {
    method: 'PATCH',
    headers
  });
  if (!response.ok) throw new Error('Failed to mark supplier payment notification as read');
  return await response.json();
};

export const markAllSupplierPaymentsRead = async (token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/inventory/mark-all-supplier-payments-read`, {
    method: 'PATCH',
    headers
  });
  if (!response.ok) throw new Error('Failed to mark all supplier payment notifications as read');
  return await response.json();
};

export const markAcceptedNotificationRead = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/${id}/mark-accepted-notification-read`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to mark notification as read');
  return await response.json();
};

export const markAllAcceptedNotificationsRead = async (token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/mark-all-accepted-notifications-read`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to mark all notifications as read');
  return await response.json();
};

export const fetchSupplierMaterialHistory = async (supplierId = null, token = null) => {
  const url = supplierId ? `${API_BASE_URL}/material-history?supplierId=${supplierId}` : `${API_BASE_URL}/material-history`;
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch supplier material history');
  return await response.json();
};

export const addSupplierMaterialHistory = async (historyData, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/material-history`, {
    method: 'POST',
    headers,
    body: JSON.stringify(historyData)
  });
  if (!response.ok) throw new Error('Failed to add material history record');
  return await response.json();
};

export const deleteSupplierMaterialHistory = async (id, token = null) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/material-history/${id}`, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) throw new Error('Failed to delete material history record');
  return await response.json();
};

export const updateStockLevel = async (itemId, stockLevel, purchasedStock, token) => {
  const payload = { stockLevel };
  if (purchasedStock !== undefined && purchasedStock !== null) {
    payload.purchasedStock = purchasedStock;
  }
  const response = await fetch(`${API_BASE_URL}/inventory/${itemId}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to update stock level');
  return await response.json();
};

export const reorderMaterialFromSupplier = async (itemId, reorderData, token) => {
  const response = await fetch(`${API_BASE_URL}/inventory/${itemId}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reorderData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to submit reorder request to supplier');
  }
  return await response.json();
};

export const fetchInventoryTransactions = async (itemId = null) => {
  const url = itemId ? `${API_BASE_URL}/inventory/transactions?itemId=${itemId}` : `${API_BASE_URL}/inventory/transactions`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to load inventory transaction history');
  return await response.json();
};

// Suppliers
export const fetchSuppliers = async () => {
  const response = await fetch(`${API_BASE_URL}/suppliers`);
  if (!response.ok) throw new Error('Failed to load suppliers');
  return await response.json();
};

export const saveSupplier = async (supplierData, token) => {
  const response = await fetch(`${API_BASE_URL}/suppliers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(supplierData)
  });
  if (!response.ok) throw new Error('Failed to save supplier profile');
  return await response.json();
};

// System Activities & Users
export const fetchActivities = async () => {
  const response = await fetch(`${API_BASE_URL}/activities`);
  if (!response.ok) throw new Error('Failed to load system activity log');
  return await response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error('Failed to load users');
  return await response.json();
};

// --- Third-Party Product Records ---
export const fetchThirdPartyProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/third-party-products`);
  if (!response.ok) throw new Error('Failed to load third-party products');
  return await response.json();
};

export const registerThirdPartyProduct = async (productData, token) => {
  const response = await fetch(`${API_BASE_URL}/third-party-products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error('Failed to register third-party product record');
  return await response.json();
};

export const updateThirdPartyProduct = async (id, productData, token) => {
  const response = await fetch(`${API_BASE_URL}/third-party-products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error('Failed to update third-party product record');
  return await response.json();
};

export const deleteThirdPartyProduct = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/third-party-products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete third-party product record');
  return await response.json();
};

export const convertOrderToThirdPartyProduct = async (orderId, overrides, token) => {
  const response = await fetch(`${API_BASE_URL}/third-party-products/convert/${orderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(overrides || {})
  });
  if (!response.ok) throw new Error('Failed to convert requirement into 3rd-party product record');
  return await response.json();
};

// --- Packaging Types & Dimension Constraints ---
export const fetchPackagingTypes = async () => {
  const response = await fetch(`${API_BASE_URL}/packaging-types`);
  if (!response.ok) throw new Error('Failed to load packaging types & constraints');
  return await response.json();
};

export const createPackagingType = async (typeData, token) => {
  const response = await fetch(`${API_BASE_URL}/packaging-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(typeData)
  });
  if (!response.ok) throw new Error('Failed to create packaging type & constraints');
  return await response.json();
};

export const updatePackagingType = async (id, typeData, token) => {
  const response = await fetch(`${API_BASE_URL}/packaging-types/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(typeData)
  });
  if (!response.ok) throw new Error('Failed to update packaging type & constraints');
  return await response.json();
};

export const deletePackagingType = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/packaging-types/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete packaging type');
  return await response.json();
};

// --- Administrator Customer Management APIs ---
export const fetchPendingCustomers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/customers/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load pending customer registration requests');
  return await response.json();
};

export const fetchCustomerRecords = async (token, query = '') => {
  const url = query ? `${API_BASE_URL}/admin/customers/records?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/admin/customers/records`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load customer records');
  return await response.json();
};

export const fetchRejectedCustomers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/customers/rejected`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load rejected customers');
  return await response.json();
};

export const approveAndRegisterCustomer = async (userId, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/customers/${userId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to approve and register customer');
  }
  return await response.json();
};

export const rejectCustomerRequest = async (userId, reason, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/customers/${userId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) throw new Error('Failed to reject customer request');
  return await response.json();
};

// --- Supplier Inquiry & Directory APIs ---
export const submitSupplierInquiry = async (inquiryData) => {
  const response = await fetch(`${API_BASE_URL}/public/supplier-inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inquiryData)
  });
  if (!response.ok) throw new Error('Failed to submit supplier inquiry');
  return await response.json();
};

export const fetchPendingSuppliers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/suppliers/pending`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load pending supplier requests');
  return await response.json();
};

export const fetchSupplierRecords = async (token, query = '') => {
  const url = query ? `${API_BASE_URL}/admin/suppliers/records?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/admin/suppliers/records`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load supplier records');
  return await response.json();
};

export const fetchRejectedSuppliers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/suppliers/rejected`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load rejected suppliers');
  return await response.json();
};

export const fetchSupplierActivities = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/suppliers/activity`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load supplier activity information');
  return await response.json();
};

export const approveSupplierInquiry = async (supplierId, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/suppliers/${supplierId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to approve supplier inquiry');
  return data;
};

export const rejectSupplierInquiry = async (supplierId, rejectionReason, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/suppliers/${supplierId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ rejectionReason })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to reject supplier inquiry');
  return data;
};

export const fetchMySupplierProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/suppliers/my-profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load supplier profile');
  return await response.json();
};

export const updateMySupplierProfile = async (profileData, token) => {
  const response = await fetch(`${API_BASE_URL}/suppliers/my-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  if (!response.ok) throw new Error('Failed to update supplier profile');
  return await response.json();
};

export const deleteSupplierRecord = async (supplierId, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/suppliers/${supplierId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to delete supplier record');
  return data;
};

// --- Supplier Previous Material History APIs ---
// Handled above under /material-history

export const deleteMySupplierProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/suppliers/my-profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Failed to delete supplier profile');
  return data;
};

// --- Customer Profile APIs ---
export const fetchMyCustomerProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/customers/my-profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load customer profile information');
  return await response.json();
};

export const updateMyCustomerProfile = async (profileData, token) => {
  const response = await fetch(`${API_BASE_URL}/customers/my-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update customer profile information');
  return data;
};

// --- Announcements APIs ---
export const fetchAnnouncements = async () => {
  const response = await fetch(`${API_BASE_URL}/announcements`);
  if (!response.ok) throw new Error('Failed to load announcements');
  return await response.json();
};

export const createAnnouncement = async (announcementData, token) => {
  const response = await fetch(`${API_BASE_URL}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(announcementData)
  });
  if (!response.ok) throw new Error('Failed to create announcement');
  return await response.json();
};

export const deleteAnnouncement = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete announcement');
  return await response.json();
};

// --- Feedback APIs ---
export const fetchAllFeedbacks = async () => {
  const response = await fetch(`${API_BASE_URL}/feedbacks`);
  if (!response.ok) throw new Error('Failed to load customer feedbacks');
  return await response.json();
};

export const fetchMyFeedbacks = async (token) => {
  const response = await fetch(`${API_BASE_URL}/feedbacks/my-feedbacks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load your feedback history');
  return await response.json();
};

export const submitFeedback = async (feedbackData, token) => {
  const response = await fetch(`${API_BASE_URL}/feedbacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(feedbackData)
  });
  if (!response.ok) throw new Error('Failed to submit feedback');
  return await response.json();
};

export const respondToFeedback = async (id, adminResponse, token) => {
  const response = await fetch(`${API_BASE_URL}/feedbacks/${id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ adminResponse })
  });
  if (!response.ok) throw new Error('Failed to send response to customer feedback');
  return await response.json();
};

export const deleteFeedback = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/feedbacks/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
  if (!response.ok) throw new Error('Failed to delete feedback');
  return await response.json();
};

// --- Order History APIs ---
export const fetchOrderHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/orders/history`);
  if (!response.ok) throw new Error('Failed to load system order history');
  return await response.json();
};

export const fetchMyOrderHistory = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders/my-history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to load your order history');
  return await response.json();
};

// --- Packaging Tasks APIs (packaing_tasks table) ---
export const fetchPackagingTasks = async (token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/packaging-tasks`, { headers });
  if (!response.ok) throw new Error('Failed to load packaging tasks');
  return await response.json();
};

export const fetchOrderPackagingTasks = async (orderId, token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/packaging-tasks/order/${orderId}`, { headers });
  if (!response.ok) throw new Error('Failed to load order tasks');
  return await response.json();
};

export const updatePackagingTaskStatus = async (taskId, status, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const response = await fetch(`${API_BASE_URL}/packaging-tasks/${taskId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update task status');
  return await response.json();
};

export const unassignPackagingTask = async (taskId, token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/packaging-tasks/${taskId}/unassign`, {
    method: 'PATCH',
    headers
  });
  if (!response.ok) throw new Error('Failed to unassign task');
  return await response.json();
};

export const assignPackagingTask = async (taskId, token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/packaging-tasks/${taskId}/assign`, {
    method: 'PATCH',
    headers
  });
  if (!response.ok) throw new Error('Failed to assign task');
  return await response.json();
};

export const unassignStaffFromOrder = async (orderId, staffMember, token, taskId) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const payload = { staffMember };
  if (taskId != null) {
    payload.taskId = taskId.toString();
  }
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/unassign-staff`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to unassign staff member from order');
  return await response.json();
};

export const assignStaffMemberToOrder = async (orderId, staffMember, task, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign-staff-member`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ staffMember, task })
  });
  if (!response.ok) throw new Error('Failed to assign staff member to order');
  return await response.json();
};



