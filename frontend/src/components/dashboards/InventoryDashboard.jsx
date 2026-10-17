import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchInventory,
  fetchInventoryTransactions,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateStockLevel,
  acceptMaterialOrder,
  reorderMaterialFromSupplier,
  markAcceptedNotificationRead,
  markAllAcceptedNotificationsRead,
  paySupplierByVisa,
  fetchSupplierMaterialHistory
} from '../../services/api';
import {
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Bell,
  BellRing,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  X,
  ShieldAlert,
  Clock,
  CheckSquare,
  ArrowRight,
  ShoppingCart,
  Truck,
  Send,
  CheckCheck,
  History,
  Activity,
  FileText,
  Calendar,
  CreditCard,
  Building,
  Receipt,
  Lock,
  DollarSign,
  Printer
} from 'lucide-react';

export default function InventoryDashboard({ token, isDashboardView = false }) {
  const [items, setItems] = useState([]);
  const [materialHistory, setMaterialHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Transaction History State
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'transactions'
  const [transactions, setTransactions] = useState([]);
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState('ALL');
  const [selectedTransactionModal, setSelectedTransactionModal] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustPurchasedQty, setAdjustPurchasedQty] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSupplierAcceptedModal, setShowSupplierAcceptedModal] = useState(false);
  const [supplierAcceptedToast, setSupplierAcceptedToast] = useState(null);
  const [knownAcceptedIds, setKnownAcceptedIds] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');

  // IM Visa Payment to Supplier Modal State
  const [payingMaterialModal, setPayingMaterialModal] = useState(null);
  const [processingVisaPayment, setProcessingVisaPayment] = useState(false);
  const [viewingVisaReceiptModal, setViewingVisaReceiptModal] = useState(null);
  const [visaForm, setVisaForm] = useState({
    cardHolderName: 'PackFLOW Industrial Procurement Ltd',
    cardNumber: '4532 8920 1823 4242',
    expiryDate: '08/29',
    cvv: '382'
  });

  // IM Reorder from Supplier Modal State
  const [reorderItemModal, setReorderItemModal] = useState(null);
  const [reorderForm, setReorderForm] = useState({
    supplierName: '',
    supplierEmail: '',
    reorderQuantity: 1000,
    urgency: 'Urgent Priority (Low Stock Threshold)',
    notes: ''
  });
  const [submittingReorder, setSubmittingReorder] = useState(false);

  // Material Types (Several categories)
  const MATERIAL_TYPES = [
    'Cardboard & Paperboard',
    'Plastics & Films',
    'Bubble Wrap & Cushioning',
    'Tapes & Adhesives',
    'Glass & Containers',
    'Metal & Strapping',
    'Labels & Inks',
    'Custom Substrate'
  ];

  // Stock Unit Options
  const UNIT_OPTIONS = ['Kg', 'Sheets', 'Rolls', 'Meters', 'Liters', 'Boxes', 'Pieces'];

  // Lookup price reference from Previous Supplied Materials History
  const getHistoryPrice = (matName) => {
    if (!matName) return 45.00;
    const found = materialHistory.find(h => h.materialName && h.materialName.trim().toLowerCase() === matName.trim().toLowerCase());
    if (found && found.unitPrice) return found.unitPrice;
    const partial = materialHistory.find(h => h.materialName && (h.materialName.toLowerCase().includes(matName.toLowerCase()) || matName.toLowerCase().includes(h.materialName.toLowerCase())));
    if (partial && partial.unitPrice) return partial.unitPrice;
    return 45.00;
  };

  // New Item State (Initial status: On-Going)
  const initialNewItem = {
    name: '',
    category: 'Cardboard & Paperboard',
    purchasedStock: 1000,
    stockLevel: 800,
    unitPrice: 45.00,
    unit: 'Kg',
    reorderThreshold: 200,
    supplierName: 'Yuthma Global Materials',
    supplierEmail: 'yuthma@packflow.com',
    status: 'On-Going'
  };
  const [newItem, setNewItem] = useState(initialNewItem);

  useEffect(() => {
    loadInventory();
    const interval = setInterval(() => {
      loadInventory(true);
    }, 3000);

    const handleFocus = () => loadInventory(true);
    const handleInventoryEvent = () => loadInventory(true);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('inventory-updated', handleInventoryEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('inventory-updated', handleInventoryEvent);
    };
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadInventory = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [data, txnsData, historyData] = await Promise.all([
        fetchInventory(),
        fetchInventoryTransactions().catch(() => []),
        fetchSupplierMaterialHistory().catch(() => [])
      ]);
      setItems(data);
      setTransactions(txnsData || []);
      setMaterialHistory(historyData || []);

      // Check for newly accepted supplier orders
      const currentAccepted = data.filter(i => i.supplierAcceptedAt && String(i.supplierAcceptedAt).trim() !== '');
      if (isSilent) {
        currentAccepted.forEach(item => {
          if (!knownAcceptedIds.has(item.id) && item.acceptedNotificationRead === false) {
            setSupplierAcceptedToast({
              id: item.id,
              name: item.name,
              supplierName: item.supplierName || 'Supplier'
            });
            setTimeout(() => setSupplierAcceptedToast(null), 6000);
          }
        });
      }
      setKnownAcceptedIds(new Set(currentAccepted.map(i => i.id)));
    } catch (e) {
      console.error('Error loading inventory data:', e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await markAcceptedNotificationRead(id, token);
      setItems(prev => prev.map(item => item.id === id ? { ...item, acceptedNotificationRead: true } : item));
      showToast('Notification marked as read.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAcceptedNotificationsRead(token);
      setItems(prev => prev.map(item => ({ ...item, acceptedNotificationRead: true })));
      showToast('All supplier acceptance notifications marked as read.');
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate percentage helper
  const getItemPercentage = (item) => {
    const purchased = item.purchasedStock && item.purchasedStock > 0 ? item.purchasedStock : (item.stockLevel || 100);
    const available = item.stockLevel || 0;
    const pct = (available / purchased) * 100;
    return Math.min(Math.max(Math.round(pct * 10) / 10, 0), 100);
  };

  // Check if item is low stock (< 20% or stockLevel <= threshold)
  const isLowStock = (item) => {
    const pct = getItemPercentage(item);
    return pct < 20.0 || (item.reorderThreshold && item.stockLevel <= item.reorderThreshold) || item.stockLevel <= 0;
  };

  // Handle Material Registration Submit (Status set to On-Going initially)
  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const purchased = Number(newItem.purchasedStock);
      const available = Number(newItem.stockLevel);
      const uPrice = Number(newItem.unitPrice) || getHistoryPrice(newItem.name);

      const payload = {
        ...newItem,
        purchasedStock: purchased,
        stockLevel: available,
        unitPrice: uPrice,
        totalPrice: uPrice * purchased,
        reorderThreshold: Number(newItem.reorderThreshold),
        status: 'On-Going'
      };

      await addInventoryItem(payload, token);
      showToast(`Registered packaging material "${newItem.name}" at LKR ${uPrice.toFixed(2)} / ${newItem.unit}! Status: On-Going.`);
      setShowAddModal(false);
      setNewItem(initialNewItem);
      loadInventory(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Opening Visa Payment Modal for Supplier Order
  const handleOpenVisaPaymentModal = (item) => {
    const refPrice = item.unitPrice || getHistoryPrice(item.name);
    const qty = item.purchasedStock || item.stockLevel || 0;
    setPayingMaterialModal({
      ...item,
      unitPrice: refPrice,
      totalPrice: item.totalPrice || (refPrice * qty)
    });
    setVisaForm({
      cardHolderName: 'PackFLOW Industrial Procurement Ltd',
      cardNumber: '4532 8920 1823 4242',
      expiryDate: '08/29',
      cvv: '382'
    });
  };

  // Handle Processing Visa Card Payment to Supplier
  const handleConfirmVisaPayment = async (e) => {
    e.preventDefault();
    if (!payingMaterialModal) return;
    try {
      setProcessingVisaPayment(true);
      await paySupplierByVisa(payingMaterialModal.id, {
        cardHolderName: visaForm.cardHolderName,
        cardNumber: visaForm.cardNumber,
        expiryDate: visaForm.expiryDate,
        cvv: visaForm.cvv
      }, token);

      const paidAmount = payingMaterialModal.totalPrice || ((payingMaterialModal.unitPrice || getHistoryPrice(payingMaterialModal.name)) * (payingMaterialModal.purchasedStock || payingMaterialModal.stockLevel || 0));
      showToast(`Visa payment of LKR ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} transferred successfully to supplier ${payingMaterialModal.supplierName || 'partner'}! Supplier notified in real-time.`);
      setPayingMaterialModal(null);
      loadInventory(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message || 'Visa payment processing failed');
    } finally {
      setProcessingVisaPayment(false);
    }
  };

  // Handle Supplier Acceptance of Material Order
  const handleAcceptOrder = async (id, name) => {
    try {
      await acceptMaterialOrder(id, token);
      showToast(`Order accepted for "${name}"! Status updated to Accepted.`);
      loadInventory(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle IM Manual Edit of Low Stock or Material Details
  const handleEditItemSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const purchased = Number(editingItem.purchasedStock);
      const available = Number(editingItem.stockLevel);

      const payload = {
        ...editingItem,
        purchasedStock: purchased,
        stockLevel: available,
        reorderThreshold: Number(editingItem.reorderThreshold)
      };

      await updateInventoryItem(editingItem.id, payload, token);
      showToast(`Updated material record for "${editingItem.name}"`);
      setEditingItem(null);
      loadInventory(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Quick Stock Adjust Movement by IM
  const handleStockAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustItem || adjustQty === '') return;
    try {
      const newAvailable = Number(adjustQty);
      const newPurchased = adjustPurchasedQty !== '' ? Number(adjustPurchasedQty) : adjustItem.purchasedStock;
      await updateStockLevel(adjustItem.id, newAvailable, newPurchased, token);
      showToast(`Stock manually adjusted for "${adjustItem.name}": Available ${newAvailable} ${adjustItem.unit}`);
      setAdjustItem(null);
      setAdjustQty('');
      setAdjustPurchasedQty('');
      loadInventory(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Delete Material
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove raw packaging material "${name}" from inventory?`)) return;
    try {
      await deleteInventoryItem(id, token);
      showToast(`Removed "${name}" from inventory catalog.`);
      loadInventory(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message);
    }
  };

  // Open IM Reorder from Supplier Modal
  const handleOpenReorderModal = (item) => {
    const isLow = isLowStock(item);
    const defaultQty = (item.reorderThreshold && item.reorderThreshold > 0) ? (item.reorderThreshold * 4) : 1000;
    setReorderItemModal(item);
    setReorderForm({
      supplierName: item.supplierName || 'Yuthma Global Materials',
      supplierEmail: item.supplierEmail || 'yuthma@packflow.com',
      reorderQuantity: defaultQty,
      urgency: isLow ? 'Urgent Priority (Low Stock Threshold)' : 'Standard Replenishment',
      notes: `Reorder purchase request generated by Inventory Manager for ${item.name}. Current stock: ${item.stockLevel} ${item.unit}.`
    });
  };

  // Submit Reorder to Supplier
  const handleReorderSubmit = async (e) => {
    e.preventDefault();
    if (!reorderItemModal) return;
    try {
      setSubmittingReorder(true);
      await reorderMaterialFromSupplier(
        reorderItemModal.id,
        {
          supplierName: reorderForm.supplierName,
          supplierEmail: reorderForm.supplierEmail,
          reorderQuantity: Number(reorderForm.reorderQuantity),
          notes: `[${reorderForm.urgency}] ${reorderForm.notes}`
        },
        token
      );
      showToast(`Purchase reorder request sent to "${reorderForm.supplierName}" for ${reorderForm.reorderQuantity} ${reorderItemModal.unit} of "${reorderItemModal.name}"! Status: On-Going.`);
      setReorderItemModal(null);
      loadInventory(true);
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReorder(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: '600' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#4F46E5' }} />
        Loading Raw Materials & Inventory Control...
      </div>
    );
  }

  // Low Stock Items (< 20% remaining)
  const lowStockItems = items.filter(i => isLowStock(i));
  const onGoingItems = items.filter(i => i.status === 'On-Going' || i.status === 'Ongoing');
  const acceptedItems = items.filter(i => i.status === 'Accepted' || i.status === 'Available' || i.status === 'Low Stock');
  const supplierAcceptedNotifications = items.filter(i => i.supplierAcceptedAt && String(i.supplierAcceptedAt).trim() !== '');
  const unreadAcceptedItems = items.filter(i => i.supplierAcceptedAt && String(i.supplierAcceptedAt).trim() !== '' && i.acceptedNotificationRead === false);

  // Filtered Materials based on search & dropdowns
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id).includes(searchTerm);

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatusFilter === 'ON_GOING') {
      matchesStatus = item.status === 'On-Going' || item.status === 'Ongoing';
    } else if (selectedStatusFilter === 'ACCEPTED') {
      matchesStatus = item.status === 'Accepted' || item.status === 'Available';
    } else if (selectedStatusFilter === 'LOW_STOCK') {
      matchesStatus = isLowStock(item);
    } else if (selectedStatusFilter === 'OUT_OF_STOCK') {
      matchesStatus = item.stockLevel <= 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered Transactions based on search & dropdowns
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch =
      !transactionSearch ||
      txn.transactionCode?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      txn.itemName?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      txn.performedBy?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      txn.category?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      txn.notes?.toLowerCase().includes(transactionSearch.toLowerCase());

    const matchesType = transactionTypeFilter === 'ALL' || txn.transactionType === transactionTypeFilter;
    const matchesCategory = transactionCategoryFilter === 'ALL' || txn.category === transactionCategoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Aggregates
  const totalMaterials = items.length;
  const totalPurchasedStockSum = items.reduce((acc, i) => acc + (i.purchasedStock || i.stockLevel || 0), 0);
  const totalAvailableStockSum = items.reduce((acc, i) => acc + (i.stockLevel || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          backgroundColor: '#065F46',
          color: '#FFFFFF',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={20} style={{ color: '#34D399' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner (Clean layout, no Inventory Manager Dashboard text heading) */}
      <div className="card-rounded" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
        color: '#FFFFFF',
        borderRadius: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            padding: '0.6rem 1.15rem',
            borderRadius: '99px',
            fontSize: '1.1rem',
            fontWeight: '800',
            color: '#FFFFFF'
          }}>
            <Warehouse size={22} style={{ color: '#F59E0B' }} />
            <span>Raw Packaging Materials & Inventory Control</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Supplier Order Acceptance Notification Trigger Button */}
          <button
            onClick={() => setShowSupplierAcceptedModal(true)}
            style={{
              padding: '0.75rem 1.15rem',
              borderRadius: '0.75rem',
              backgroundColor: unreadAcceptedItems.length > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              border: unreadAcceptedItems.length > 0 ? '1.5px solid #34D399' : '1px solid rgba(255, 255, 255, 0.2)',
              color: unreadAcceptedItems.length > 0 ? '#6EE7B7' : '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: '0.2s ease',
              boxShadow: unreadAcceptedItems.length > 0 ? '0 0 15px rgba(52, 211, 153, 0.3)' : 'none'
            }}
          >
            <Truck size={19} className={unreadAcceptedItems.length > 0 ? 'animate-bounce' : ''} />
            <span>Supplier Order Acceptances</span>
            {unreadAcceptedItems.length > 0 && (
              <span style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                borderRadius: '99px',
                padding: '0.15rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {unreadAcceptedItems.length} New
              </span>
            )}
          </button>

          {/* Low Stock Notifications Trigger Button */}
          <button
            onClick={() => setShowNotificationModal(true)}
            style={{
              padding: '0.75rem 1.15rem',
              borderRadius: '0.75rem',
              backgroundColor: lowStockItems.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: lowStockItems.length > 0 ? '1px solid #F87171' : '1px solid rgba(255, 255, 255, 0.2)',
              color: lowStockItems.length > 0 ? '#FCA5A5' : '#FFFFFF',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: '0.2s ease'
            }}
          >
            {lowStockItems.length > 0 ? <BellRing size={19} className="animate-pulse" /> : <Bell size={19} />}
            <span>Low Stock Notifications</span>
            {lowStockItems.length > 0 && (
              <span style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '99px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {lowStockItems.length}
              </span>
            )}
          </button>

          {/* Register New Packaging Material Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: '#F59E0B',
              color: '#0F172A',
              fontWeight: '800',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
          >
            <Plus size={19} strokeWidth={2.5} />
            <span>Register Material</span>
          </button>
        </div>
      </div>

      {/* Prominent Supplier Order Acceptance Notification Alert Banner */}
      {unreadAcceptedItems.length > 0 && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '1.25rem',
          backgroundColor: '#ECFDF5',
          border: '1.5px solid #6EE7B7',
          color: '#065F46',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: '800', fontSize: '1.05rem', color: '#065F46' }}>
              <CheckCircle2 size={22} style={{ color: '#10B981' }} />
              <span>Supplier Notification: {unreadAcceptedItems.length} Raw Packaging Order(s) Accepted by Supplier(s)!</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleMarkAllRead}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Mark All Read
              </button>
              <button
                onClick={() => setShowSupplierAcceptedModal(true)}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>View Supplier Notifications</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {unreadAcceptedItems.slice(0, 3).map(item => (
              <div key={item.id} style={{
                backgroundColor: '#FFFFFF',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid #A7F3D0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#064E3B' }}>{item.name}</span>
                  <button
                    onClick={() => handleMarkSingleRead(item.id)}
                    style={{
                      backgroundColor: '#D1FAE5',
                      color: '#065F46',
                      border: 'none',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Acknowledge
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Supplier: <strong>{item.supplierName || 'Yuthma Global Materials'}</strong>
                </div>
                <div style={{ fontSize: '0.775rem', color: '#059669', fontWeight: '700' }}>
                  Status: Order Accepted & Added to Active Catalog ({item.purchasedStock || item.stockLevel} {item.unit})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '1.25rem',
          backgroundColor: '#FEF2F2',
          border: '1.5px solid #FCA5A5',
          color: '#991B1B',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: '800', fontSize: '1.05rem', color: '#991B1B' }}>
              <ShieldAlert size={22} style={{ color: '#DC2626' }} />
              <span>Low-Stock Alert: {lowStockItems.length} Packaging Material(s) below 20% Available Stock!</span>
            </div>
            <button
              onClick={() => setShowNotificationModal(true)}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>View Low Stock Alerts & Manually Edit</span>
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {lowStockItems.slice(0, 3).map(item => {
              const pct = getItemPercentage(item);
              const purchased = item.purchasedStock || (item.stockLevel * 2);
              return (
                <div key={item.id} style={{
                  backgroundColor: '#FFFFFF',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #FECACA',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#7F1D1D' }}>{item.name}</span>
                    <button
                      onClick={() => setEditingItem({ ...item })}
                      style={{
                        backgroundColor: '#FEF2F2',
                        color: '#991B1B',
                        border: '1px solid #FCA5A5',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.4rem',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Edit size={12} /> Edit Low Stock
                    </button>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Type: {item.category}</span>
                    <span>Available: <strong>{item.stockLevel}</strong> / {purchased} {item.unit}</span>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#FEE2E2', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#EF4444', borderRadius: '99px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Base Details KPI Cards (Overall Direct View of IM Works) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        <div className="card-rounded" style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Registered Materials</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '0.5rem' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{totalMaterials}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>Total system raw materials</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>On-Going Material Orders</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '0.5rem' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#D97706', marginTop: '0.5rem' }}>{onGoingItems.length}</div>
          <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '0.2rem' }}>Awaiting supplier acceptance</div>
        </div>

        <div className="card-rounded" style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem', cursor: 'pointer' }} onClick={() => setShowSupplierAcceptedModal(true)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Accepted Materials</span>
            <div style={{ padding: '0.4rem', backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: '0.5rem', position: 'relative' }}>
              <CheckSquare size={20} />
              {unreadAcceptedItems.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#10B981',
                  borderRadius: '50%',
                  border: '2px solid #FFFFFF'
                }} />
              )}
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#059669', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{acceptedItems.length}</span>
            {unreadAcceptedItems.length > 0 && (
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: '800' }}>
                {unreadAcceptedItems.length} New
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: unreadAcceptedItems.length > 0 ? '#059669' : '#10B981', marginTop: '0.2rem', fontWeight: unreadAcceptedItems.length > 0 ? '700' : '400' }}>
            {unreadAcceptedItems.length > 0 ? 'Click to view supplier notifications' : 'Accepted & active in stock'}
          </div>
        </div>

        <div className="card-rounded" style={{ padding: '1.35rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem', cursor: 'pointer' }} onClick={() => setShowNotificationModal(true)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: '600' }}>Low Stock Alerts (&lt; 20%)</span>
            <div style={{ padding: '0.4rem', backgroundColor: lowStockItems.length > 0 ? '#FEF2F2' : '#F1F5F9', color: lowStockItems.length > 0 ? '#DC2626' : '#64748B', borderRadius: '0.5rem' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: lowStockItems.length > 0 ? '#DC2626' : '#0F172A', marginTop: '0.5rem' }}>
            {lowStockItems.length}
          </div>
          <div style={{ fontSize: '0.8rem', color: lowStockItems.length > 0 ? '#DC2626' : '#64748B', marginTop: '0.2rem', fontWeight: lowStockItems.length > 0 ? '700' : '400' }}>
            {lowStockItems.length > 0 ? 'Click to view & edit' : 'All stock levels healthy'}
          </div>
        </div>
      </div>

      {/* CONDITION: If isDashboardView is true, render OVERALL DIRECT VIEW widgets (NO detailed catalog table) */}
      {isDashboardView ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* On-Going Material Orders Summary Card */}
          <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} style={{ color: '#D97706' }} />
                  <span>On-Going Raw Material Orders Overview</span>
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '0.25rem' }}>
                  Orders registered by IM currently awaiting supplier acceptance.
                </p>
              </div>
              <Link
                to="/inventory"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  borderRadius: '0.65rem',
                  backgroundColor: '#0F4C81',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  textDecoration: 'none'
                }}
              >
                <span>Manage Raw Materials & Stock Catalog</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {onGoingItems.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#059669', backgroundColor: '#F0FDF4', borderRadius: '0.75rem' }}>
                All requested material orders have been accepted by suppliers!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {onGoingItems.map(item => {
                  const pct = getItemPercentage(item);
                  return (
                    <div key={item.id} style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '0.85rem',
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FCD34D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0F172A' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>
                          Type: {item.category} | Supplier: {item.supplierName} | Requested Stock: <strong>{item.purchasedStock} {item.unit}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '0.775rem', fontWeight: '800' }}>
                          On-Going (Awaiting Supplier Acceptance)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Accepted Materials Overview Card */}
          <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} style={{ color: '#059669' }} />
                <span>Accepted Materials Status Summary</span>
              </h3>
              <Link
                to="/inventory"
                style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F4C81', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <span>View Full Catalog</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {acceptedItems.slice(0, 4).map(item => {
                const pct = getItemPercentage(item);
                return (
                  <div key={item.id} style={{ padding: '1rem', borderRadius: '0.85rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0F172A' }}>{item.name}</span>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#059669', fontSize: '0.75rem', fontWeight: '800' }}>
                        Accepted
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Available Stock: <strong>{item.stockLevel} {item.unit}</strong> / {item.purchasedStock} {item.unit}
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden', marginTop: '0.2rem' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#10B981', borderRadius: '99px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* CONDITION: If isDashboardView is false (on /inventory Raw Materials & Stock page) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            borderBottom: '2px solid #E2E8F0',
            paddingBottom: '0.1rem'
          }}>
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem 0.75rem 0 0',
                border: 'none',
                borderBottom: activeTab === 'catalog' ? '3px solid #0F4C81' : '3px solid transparent',
                backgroundColor: activeTab === 'catalog' ? '#EEF2FF' : 'transparent',
                color: activeTab === 'catalog' ? '#0F4C81' : '#64748B',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: '0.2s ease'
              }}
            >
              <Package size={18} />
              <span>Raw Materials Catalog</span>
              <span style={{
                backgroundColor: activeTab === 'catalog' ? '#0F4C81' : '#E2E8F0',
                color: activeTab === 'catalog' ? '#FFFFFF' : '#475569',
                borderRadius: '99px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem 0.75rem 0 0',
                border: 'none',
                borderBottom: activeTab === 'transactions' ? '3px solid #0F4C81' : '3px solid transparent',
                backgroundColor: activeTab === 'transactions' ? '#EEF2FF' : 'transparent',
                color: activeTab === 'transactions' ? '#0F4C81' : '#64748B',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: '0.2s ease'
              }}
            >
              <History size={18} />
              <span>Inventory Transaction History & Stock Movement Audit</span>
              <span style={{
                backgroundColor: activeTab === 'transactions' ? '#0F4C81' : '#E2E8F0',
                color: activeTab === 'transactions' ? '#FFFFFF' : '#475569',
                borderRadius: '99px',
                padding: '0.15rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {transactions.length}
              </span>
            </button>
          </div>

          {activeTab === 'transactions' ? (
            /* INVENTORY TRANSACTION HISTORY TAB VIEW */
            <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
              {/* Header & Description */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <History size={22} style={{ color: '#0F4C81' }} />
                    <span>Inventory Transaction History & Stock Movement Audit</span>
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem' }}>
                    Monitor real-time raw material receipts, stock issues, supplier fulfillments, manual stock adjustments, and purchase reorder history.
                  </p>
                </div>

                {/* Filter Controls Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Search Input Box */}
                  <div style={{ position: 'relative', minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search code, material, user, notes..."
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                        borderRadius: '0.65rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                    {transactionSearch && (
                      <button
                        onClick={() => setTransactionSearch('')}
                        style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={transactionCategoryFilter}
                    onChange={(e) => setTransactionCategoryFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#334155',
                      backgroundColor: '#F8FAFC'
                    }}
                  >
                    <option value="ALL">All Categories</option>
                    {MATERIAL_TYPES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Movement Type Dropdown */}
                  <select
                    value={transactionTypeFilter}
                    onChange={(e) => setTransactionTypeFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#334155',
                      backgroundColor: '#F8FAFC'
                    }}
                  >
                    <option value="ALL">All Movement Types</option>
                    <option value="STOCK_IN">Stock In (+ Fulfillments)</option>
                    <option value="STOCK_OUT">Stock Out (- Production)</option>
                    <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
                    <option value="PURCHASE_REORDER">Purchase Reorders</option>
                    <option value="MATERIAL_REGISTERED">Catalog Registrations</option>
                    <option value="SUPPLIER_ACCEPTED">Supplier Acceptances</option>
                  </select>

                  <button
                    onClick={() => loadInventory(true)}
                    title="Refresh Movements"
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#F8FAFC',
                      color: '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}
                  >
                    <RefreshCw size={15} /> Refresh
                  </button>
                </div>
              </div>

              {/* Movement KPI Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.15rem', backgroundColor: '#F8FAFC', borderRadius: '0.85rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>Total Recorded Movements</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', marginTop: '0.2rem' }}>{transactions.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Audit trail records logged</div>
                </div>
                <div style={{ padding: '1rem 1.15rem', backgroundColor: '#ECFDF5', borderRadius: '0.85rem', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#065F46', fontWeight: '700' }}>Stock In & Deliveries</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669', marginTop: '0.2rem' }}>
                    {transactions.filter(t => t.transactionType === 'STOCK_IN' || t.transactionType === 'SUPPLIER_ACCEPTED' || t.transactionType === 'MATERIAL_REGISTERED').length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>Incoming raw materials</div>
                </div>
                <div style={{ padding: '1rem 1.15rem', backgroundColor: '#FEF2F2', borderRadius: '0.85rem', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: '700' }}>Stock Out & Consumptions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#DC2626', marginTop: '0.2rem' }}>
                    {transactions.filter(t => t.transactionType === 'STOCK_OUT' || t.transactionType === 'PRODUCTION_CONSUMPTION' || t.transactionType === 'MATERIAL_REMOVED').length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>Issued for plant production</div>
                </div>
                <div style={{ padding: '1rem 1.15rem', backgroundColor: '#FEF3C7', borderRadius: '0.85rem', border: '1px solid #FCD34D' }}>
                  <div style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: '700' }}>Supplier Purchase Reorders</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#D97706', marginTop: '0.2rem' }}>
                    {transactions.filter(t => t.transactionType === 'PURCHASE_REORDER').length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#B45309' }}>Low-stock reorder requests</div>
                </div>
              </div>

              {/* Transaction Movements Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Transaction Code</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Date & Time</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Material Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Movement Type</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Quantity Delta</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Stock Balance</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Initiated By</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Audit Notes</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                          No inventory transactions found matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(txn => {
                        const isPlus = txn.quantityChanged != null && txn.quantityChanged > 0;
                        const isMinus = txn.quantityChanged != null && txn.quantityChanged < 0;

                        let badgeBg = '#F1F5F9';
                        let badgeFg = '#475569';
                        let badgeBorder = '#CBD5E1';
                        let label = txn.transactionType;

                        if (txn.transactionType === 'STOCK_IN') {
                          badgeBg = '#ECFDF5'; badgeFg = '#065F46'; badgeBorder = '#A7F3D0'; label = 'Stock In';
                        } else if (txn.transactionType === 'SUPPLIER_ACCEPTED') {
                          badgeBg = '#D1FAE5'; badgeFg = '#047857'; badgeBorder = '#6EE7B7'; label = 'Supplier Fulfilling';
                        } else if (txn.transactionType === 'STOCK_OUT') {
                          badgeBg = '#FEF2F2'; badgeFg = '#991B1B'; badgeBorder = '#FCA5A5'; label = 'Stock Out';
                        } else if (txn.transactionType === 'PRODUCTION_CONSUMPTION') {
                          badgeBg = '#FFF1F2'; badgeFg = '#BE123C'; badgeBorder = '#FECDD3'; label = 'Production Issue';
                        } else if (txn.transactionType === 'STOCK_ADJUSTMENT') {
                          badgeBg = '#EEF2FF'; badgeFg = '#3730A3'; badgeBorder = '#C7D2FE'; label = 'Stock Adjustment';
                        } else if (txn.transactionType === 'PURCHASE_REORDER') {
                          badgeBg = '#FEF3C7'; badgeFg = '#92400E'; badgeBorder = '#FCD34D'; label = 'Purchase Reorder';
                        } else if (txn.transactionType === 'MATERIAL_REGISTERED') {
                          badgeBg = '#F0F9FF'; badgeFg = '#0369A1'; badgeBorder = '#BAE6FD'; label = 'New Registration';
                        } else if (txn.transactionType === 'MATERIAL_REMOVED') {
                          badgeBg = '#FEE2E2'; badgeFg = '#991B1B'; badgeBorder = '#FCA5A5'; label = 'Catalog Removal';
                        }

                        return (
                          <tr key={txn.id || txn.transactionCode} style={{ borderBottom: '1px solid #F1F5F9', transition: '0.15s ease' }}>
                            {/* Code */}
                            <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0F4C81', fontFamily: 'monospace' }}>
                              {txn.transactionCode}
                            </td>

                            {/* Date */}
                            <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {txn.timestamp ? new Date(txn.timestamp).toLocaleString() : 'N/A'}
                            </td>

                            {/* Name */}
                            <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>
                              <div>{txn.itemName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '400' }}>{txn.category}</div>
                            </td>

                            {/* Movement Type */}
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{
                                padding: '0.3rem 0.7rem',
                                borderRadius: '99px',
                                backgroundColor: badgeBg,
                                color: badgeFg,
                                border: `1px solid ${badgeBorder}`,
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                              }}>
                                {isPlus && <ArrowUpRight size={13} />}
                                {isMinus && <ArrowDownRight size={13} />}
                                <span>{label}</span>
                              </span>
                            </td>

                            {/* Quantity Delta */}
                            <td style={{ padding: '0.85rem 1rem', fontWeight: '800', fontSize: '0.95rem', color: isPlus ? '#059669' : isMinus ? '#DC2626' : '#0F172A' }}>
                              {isPlus ? `+${txn.quantityChanged?.toLocaleString()}` : txn.quantityChanged?.toLocaleString()} <span style={{ fontSize: '0.775rem', fontWeight: '500', color: '#64748B' }}>{txn.unit}</span>
                            </td>

                            {/* Stock Balance */}
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', color: '#334155' }}>
                              {txn.previousStock != null ? `${txn.previousStock.toLocaleString()} → ` : ''}
                              <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{txn.newStock != null ? txn.newStock.toLocaleString() : 'N/A'}</strong> {txn.unit}
                            </td>

                            {/* Initiated By */}
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', color: '#475569' }}>
                              <div style={{ fontWeight: '600', color: '#1E293B' }}>{txn.performedBy || 'System'}</div>
                            </td>

                            {/* Notes */}
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#64748B', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {txn.notes || '-'}
                            </td>

                            {/* Action */}
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedTransactionModal(txn)}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '0.5rem',
                                  backgroundColor: '#EEF2FF',
                                  color: '#4F46E5',
                                  border: '1px solid #C7D2FE',
                                  fontSize: '0.775rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                <Info size={13} /> Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* RAW MATERIALS CATALOG TAB VIEW */
            <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
              {/* Header & Filter Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Raw Packaging Materials Catalog
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>
                    Registered raw materials, order lifecycle statuses (On-Going &rarr; Accepted), available stock levels, and manual IM edit tools.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Search Input Box */}
                  <div style={{ position: 'relative', minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search material, code, supplier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                        borderRadius: '0.65rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Material Type Dropdown Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Filter size={16} style={{ color: '#64748B' }} />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.65rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#334155',
                        backgroundColor: '#F8FAFC'
                      }}
                    >
                      <option value="ALL">All Material Types</option>
                      {MATERIAL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lifecycle & Stock Status Filter */}
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.65rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#334155',
                      backgroundColor: '#F8FAFC'
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ON_GOING">On-Going Orders</option>
                    <option value="ACCEPTED">Accepted Materials</option>
                    <option value="LOW_STOCK">Low Stock (&lt; 20%)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (0%)</option>
                  </select>
                </div>
              </div>

              {/* Materials Data Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Code</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Material Name</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Material Type</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Available Stock</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Purchased Stock</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Unit Price (LKR)</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Total Valuation (LKR)</th>
                      <th style={{ padding: '0.85rem 1rem', width: '140px' }}>Stock %</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Supplier & Bank</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Order & Payment Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                          No raw packaging materials found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(item => {
                        const pct = getItemPercentage(item);
                        const low = isLowStock(item);
                        const purchased = item.purchasedStock || (item.stockLevel * 2);
                        const available = item.stockLevel || 0;
                        const isOnGoing = item.status === 'On-Going' || item.status === 'Ongoing';
                        const isAccepted = item.status === 'Accepted' || item.status === 'Available';
                        const uPrice = item.unitPrice || getHistoryPrice(item.name);
                        const totalVal = item.totalPrice || (uPrice * purchased);

                        let progressColor = '#10B981'; // Green
                        if (pct < 20.0) progressColor = '#EF4444'; // Red
                        else if (pct < 40.0) progressColor = '#F59E0B'; // Amber

                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', transition: '0.15s ease' }}>
                            {/* Code */}
                            <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#64748B' }}>
                              MAT-{String(item.id).padStart(3, '0')}
                            </td>

                            {/* Name */}
                            <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0F172A' }}>
                              {item.name}
                            </td>

                            {/* Category */}
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: '0.5rem',
                                backgroundColor: '#F1F5F9',
                                color: '#334155',
                                fontSize: '0.775rem',
                                fontWeight: '600',
                                border: '1px solid #E2E8F0'
                              }}>
                                {item.category}
                              </span>
                            </td>

                            {/* Available Stock */}
                            <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: low ? '#DC2626' : '#0F4C81', fontSize: '0.95rem' }}>
                              {available.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748B' }}>{item.unit}</span>
                            </td>

                            {/* Purchased Stock */}
                            <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: '600' }}>
                              {purchased.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#64748B' }}>{item.unit}</span>
                            </td>

                            {/* Unit Price (LKR) */}
                            <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: '700' }}>
                              LKR {uPrice.toFixed(2)} <span style={{ fontSize: '0.75rem', color: '#64748B' }}>/ {item.unit}</span>
                            </td>

                            {/* Total Valuation (LKR) */}
                            <td style={{ padding: '0.85rem 1rem', color: '#047857', fontWeight: '800' }}>
                              LKR {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Stock Percentage Bar */}
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', fontWeight: '800', color: low ? '#DC2626' : '#334155' }}>
                                  <span>{pct}%</span>
                                  {low && <span style={{ fontSize: '0.7rem', color: '#DC2626' }}>LOW</span>}
                                </div>
                                <div style={{ width: '100%', height: '7px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: progressColor, borderRadius: '99px', transition: 'width 0.3s ease' }} />
                                </div>
                              </div>
                            </td>

                            {/* Supplier & Bank Details */}
                            <td style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.825rem' }}>
                              <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.supplierName || 'Yuthma Global Materials'}</div>
                              {item.accountNumber ? (
                                <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                                  <Building size={12} />
                                  <span>{item.bankName || 'Bank'} (•••{String(item.accountNumber).slice(-4)})</span>
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>Bank details pending</div>
                              )}
                            </td>

                            {/* Order & Payment Status */}
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {low ? (
                                  <span style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '99px',
                                    backgroundColor: '#FEF2F2',
                                    color: '#991B1B',
                                    border: '1px solid #FCA5A5',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <AlertTriangle size={12} style={{ color: '#DC2626' }} />
                                    <span>Low Stock</span>
                                  </span>
                                ) : isOnGoing ? (
                                  <span style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '99px',
                                    backgroundColor: '#FEF3C7',
                                    color: '#D97706',
                                    border: '1px solid #FCD34D',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <Clock size={12} />
                                    <span>On-Going</span>
                                  </span>
                                ) : (
                                  <span style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '99px',
                                    backgroundColor: '#D1FAE5',
                                    color: '#065F46',
                                    border: '1px solid #A7F3D0',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <CheckCircle2 size={12} />
                                    <span>Accepted</span>
                                  </span>
                                )}

                                {/* Payment Settlement Status */}
                                {item.paymentStatus === 'Paid' ? (
                                  <span style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '99px',
                                    backgroundColor: '#ECFDF5',
                                    color: '#065F46',
                                    border: '1px solid #6EE7B7',
                                    fontSize: '0.725rem',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <CreditCard size={11} style={{ color: '#059669' }} />
                                    <span>Paid via Visa</span>
                                  </span>
                                ) : isAccepted ? (
                                  <span style={{
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '99px',
                                    backgroundColor: '#FFFBEB',
                                    color: '#B45309',
                                    border: '1px solid #FDE68A',
                                    fontSize: '0.725rem',
                                    fontWeight: '800',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    <Clock size={11} />
                                    <span>Pending Visa Pay</span>
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {/* Visa Card Pay Button (When Accepted & Not Paid) */}
                                {isAccepted && item.paymentStatus !== 'Paid' && (
                                  <button
                                    onClick={() => handleOpenVisaPaymentModal(item)}
                                    title="Pay Supplier by Visa Card"
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '0.5rem',
                                      backgroundColor: '#059669',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      fontSize: '0.775rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                                    }}
                                  >
                                    <CreditCard size={13} /> Pay (Visa)
                                  </button>
                                )}

                                {/* View Visa Voucher (When Paid) */}
                                {item.paymentStatus === 'Paid' && (
                                  <button
                                    onClick={() => setViewingVisaReceiptModal(item)}
                                    title="View Visa Settlement Voucher"
                                    style={{
                                      padding: '0.35rem 0.65rem',
                                      borderRadius: '0.5rem',
                                      backgroundColor: '#ECFDF5',
                                      color: '#065F46',
                                      border: '1px solid #A7F3D0',
                                      fontSize: '0.775rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}
                                  >
                                    <Receipt size={13} /> Receipt
                                  </button>
                                )}

                                {/* Movement History Button */}
                                <button
                                  onClick={() => {
                                    setActiveTab('transactions');
                                    setTransactionSearch(item.name);
                                  }}
                                  title="View Stock Movement History"
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#F0FDF4',
                                    color: '#059669',
                                    border: '1px solid #A7F3D0',
                                    fontSize: '0.775rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <History size={13} /> History
                                </button>

                                {/* IM Reorder from Supplier Button */}
                                <button
                                  onClick={() => handleOpenReorderModal(item)}
                                  title="Reorder Material from Supplier"
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: low ? '#DC2626' : '#D97706',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontSize: '0.775rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                >
                                  <ShoppingCart size={13} /> Reorder
                                </button>

                                {/* Quick Adjust Button */}
                                <button
                                  onClick={() => {
                                    setAdjustItem(item);
                                    setAdjustQty(item.stockLevel);
                                    setAdjustPurchasedQty(item.purchasedStock || (item.stockLevel * 2));
                                  }}
                                  title="Adjust Stock Level"
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#EEF2FF',
                                    color: '#4F46E5',
                                    border: '1px solid #C7D2FE',
                                    fontSize: '0.775rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Stock
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => setEditingItem({ ...item })}
                                  title="Manually Edit Material Details"
                                  style={{
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: low ? '#FEF2F2' : '#F1F5F9',
                                    color: low ? '#DC2626' : '#475569',
                                    border: low ? '1px solid #FCA5A5' : '1px solid #CBD5E1',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Edit size={15} />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  title="Delete Material"
                                  style={{
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#FEF2F2',
                                    color: '#EF4444',
                                    border: '1px solid #FCA5A5',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Low Stock Notifications Modal with Manual Edit Option */}
      {showNotificationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '0.5rem' }}>
                  <BellRing size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Low Stock Threshold Notifications
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Materials with stock percentage below 20% requiring IM attention
                  </span>
                </div>
              </div>
              <button onClick={() => setShowNotificationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#059669' }}>
                <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>All Stock Levels Healthy!</div>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem' }}>No packaging materials currently fall below the 20% low stock threshold.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {lowStockItems.map(item => {
                  const pct = getItemPercentage(item);
                  const purchased = item.purchasedStock || (item.stockLevel * 2);
                  return (
                    <div key={item.id} style={{
                      padding: '1.15rem',
                      borderRadius: '0.85rem',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '800', fontSize: '1rem', color: '#7F1D1D' }}>{item.name}</span>
                          <span style={{ marginLeft: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', backgroundColor: '#FFFFFF', color: '#7F1D1D', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #FECACA' }}>
                            {item.category}
                          </span>
                        </div>
                        <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: '800' }}>
                          {pct}% Left
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                        <div>Available Stock: <strong style={{ color: '#DC2626' }}>{item.stockLevel} {item.unit}</strong></div>
                        <div>Total Purchased: <strong>{purchased} {item.unit}</strong></div>
                        <div>Supplier: <strong>{item.supplierName || 'Yuthma Global Materials'}</strong></div>
                        <div>Reorder Threshold: <strong>{item.reorderThreshold} {item.unit}</strong></div>
                      </div>

                      {/* Stock Level Bar */}
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#FEE2E2', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#DC2626', borderRadius: '99px' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button
                          onClick={() => {
                            setShowNotificationModal(false);
                            setEditingItem({ ...item });
                          }}
                          style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: '0.5rem',
                            backgroundColor: '#FFFFFF',
                            color: '#991B1B',
                            border: '1px solid #FCA5A5',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Edit size={14} /> Manually Edit Low Stock
                        </button>
                        <button
                          onClick={() => {
                            setShowNotificationModal(false);
                            handleOpenReorderModal(item);
                          }}
                          style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: '0.5rem',
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <ShoppingCart size={14} /> Reorder from Supplier
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Register Packaging Material (Initial Status: On-Going) */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '520px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Register Raw Packaging Material
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Material Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Kraft Linerboard 300 GSM"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Material Type / Category *
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}
                >
                  {MATERIAL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Purchased Stock Quantity *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={newItem.purchasedStock}
                    onChange={(e) => setNewItem({ ...newItem, purchasedStock: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Available Stock Quantity *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="e.g. 4500"
                    value={newItem.stockLevel}
                    onChange={(e) => setNewItem({ ...newItem, stockLevel: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Measurement Unit *
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Reorder Threshold *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 200"
                    value={newItem.reorderThreshold}
                    onChange={(e) => setNewItem({ ...newItem, reorderThreshold: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Unit Price (LKR) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 45.00"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: '700', color: '#059669' }}
                  />
                  <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Ref. History: <strong>LKR {getHistoryPrice(newItem.name).toFixed(2)}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Total Order Value (LKR)
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={`LKR ${((Number(newItem.unitPrice) || getHistoryPrice(newItem.name)) * (Number(newItem.purchasedStock) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#047857', fontWeight: '800' }}
                  />
                  <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '0.2rem' }}>
                    To be paid to supplier via Visa
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Yuthma Global"
                    value={newItem.supplierName}
                    onChange={(e) => setNewItem({ ...newItem, supplierName: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Initial Registration Status
                  </label>
                  <input
                    readOnly
                    type="text"
                    value="On-Going"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FEF3C7', color: '#D97706', fontWeight: '800' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  Register Material (On-Going)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: IM Manual Edit Packaging Material & Low Stock */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '520px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                IM Manual Edit: {editingItem.name}
              </h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Material Name</label>
                <input required type="text" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Material Type / Category</label>
                <select value={editingItem.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}>
                  {MATERIAL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Purchased Stock</label>
                  <input required type="number" value={editingItem.purchasedStock} onChange={(e) => setEditingItem({ ...editingItem, purchasedStock: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Available Stock</label>
                  <input required type="number" value={editingItem.stockLevel} onChange={(e) => setEditingItem({ ...editingItem, stockLevel: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Unit Price (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.unitPrice || getHistoryPrice(editingItem.name)}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: '700', color: '#059669' }}
                  />
                  <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Ref: LKR {getHistoryPrice(editingItem.name).toFixed(2)}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Total Price (LKR)</label>
                  <input
                    readOnly
                    type="text"
                    value={`LKR ${((Number(editingItem.unitPrice) || getHistoryPrice(editingItem.name)) * (Number(editingItem.purchasedStock) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontWeight: '800', color: '#047857' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Order / Material Status</label>
                  <select value={editingItem.status} onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}>
                    <option value="On-Going">On-Going</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Available">Available</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Reorder Threshold</label>
                  <input required type="number" value={editingItem.reorderThreshold} onChange={(e) => setEditingItem({ ...editingItem, reorderThreshold: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer' }}>Save IM Edits</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Adjust Stock Level Movement */}
      {adjustItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '460px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Adjust Stock Movement
              </h3>
              <button onClick={() => setAdjustItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '0.65rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0F172A' }}>{adjustItem.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                Type: {adjustItem.category} | Unit: {adjustItem.unit}
              </div>
            </div>

            <form onSubmit={handleStockAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Available Stock Quantity ({adjustItem.unit}) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '1rem', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Purchased Stock Quantity ({adjustItem.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustPurchasedQty}
                  onChange={(e) => setAdjustPurchasedQty(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setAdjustItem(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '800', cursor: 'pointer' }}>Save Stock Level</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: IM Reorder Material from Supplier Modal */}
      {reorderItemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '560px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.55rem', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '0.65rem' }}>
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Reorder Material from Supplier
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Inventory Manager Purchase Reorder Request
                  </span>
                </div>
              </div>
              <button onClick={() => setReorderItemModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Material summary box */}
            <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: isLowStock(reorderItemModal) ? '#FEF2F2' : '#F8FAFC', border: isLowStock(reorderItemModal) ? '1px solid #FCA5A5' : '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0F172A' }}>{reorderItemModal.name}</span>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: isLowStock(reorderItemModal) ? '#DC2626' : '#059669', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: '800' }}>
                  {isLowStock(reorderItemModal) ? 'Low Stock Threshold Reorder' : 'Healthy Stock'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.825rem', color: '#475569' }}>
                <div>Available Stock: <strong style={{ color: isLowStock(reorderItemModal) ? '#DC2626' : '#059669' }}>{reorderItemModal.stockLevel} {reorderItemModal.unit}</strong></div>
                <div>Reorder Threshold: <strong>{reorderItemModal.reorderThreshold || 200} {reorderItemModal.unit}</strong></div>
              </div>
            </div>

            <form onSubmit={handleReorderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Target Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={reorderForm.supplierName}
                  onChange={(e) => setReorderForm({ ...reorderForm, supplierName: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Supplier Contact Email
                </label>
                <input
                  type="email"
                  value={reorderForm.supplierEmail}
                  onChange={(e) => setReorderForm({ ...reorderForm, supplierEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Reorder Quantity ({reorderItemModal.unit}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={reorderForm.reorderQuantity}
                    onChange={(e) => setReorderForm({ ...reorderForm, reorderQuantity: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Priority Level
                  </label>
                  <select
                    value={reorderForm.urgency}
                    onChange={(e) => setReorderForm({ ...reorderForm, urgency: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Urgent Priority (Low Stock Threshold)">Urgent Priority (Low Stock)</option>
                    <option value="Standard Replenishment">Standard Replenishment</option>
                    <option value="Critical Shortage Expedite">Critical Shortage Expedite</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Reorder Purchase Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={reorderForm.notes}
                  onChange={(e) => setReorderForm({ ...reorderForm, notes: e.target.value })}
                  placeholder="Specify raw material specs, packaging roll sizes, or delivery dates..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReorderItemModal(null)}
                  style={{ padding: '0.65rem 1.15rem', borderRadius: '0.5rem', backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReorder}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', fontWeight: '800', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={15} /> {submittingReorder ? 'Sending Request...' : 'Send Reorder Request to Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Supplier Order Acceptance Floating Toast Notification */}
      {supplierAcceptedToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          backgroundColor: '#064E3B',
          color: '#FFFFFF',
          padding: '1rem 1.35rem',
          borderRadius: '1rem',
          boxShadow: '0 20px 35px rgba(0,0,0,0.3)',
          border: '1.5px solid #34D399',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          maxWidth: '420px'
        }}>
          <div style={{ padding: '0.55rem', backgroundColor: '#059669', borderRadius: '50%', color: '#FFFFFF', display: 'flex' }}>
            <Truck size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#34D399' }}>
              Supplier Order Accepted!
            </div>
            <div style={{ fontSize: '0.825rem', color: '#E2E8F0', marginTop: '0.2rem' }}>
              <strong>{supplierAcceptedToast.supplierName}</strong> accepted order for <strong>"{supplierAcceptedToast.name}"</strong>.
            </div>
          </div>
          <button
            onClick={() => setSupplierAcceptedToast(null)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Modal: Supplier Acceptance Notifications Modal */}
      {showSupplierAcceptedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '85vh',
            overflowY: 'auto',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '0.5rem' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Supplier Order Acceptance Notifications
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Notifications received when suppliers accept raw packaging material orders
                  </span>
                </div>
              </div>
              <button onClick={() => setShowSupplierAcceptedModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {supplierAcceptedNotifications.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                <CheckCheck size={40} style={{ margin: '0 auto 0.75rem auto', color: '#10B981' }} />
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0F172A' }}>No Supplier Accepted Notifications</div>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem' }}>
                  When suppliers accept registered raw material orders, notifications will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                    Total Accepted Notifications: {supplierAcceptedNotifications.length} ({unreadAcceptedItems.length} Unread)
                  </span>
                  {unreadAcceptedItems.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.775rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <CheckCheck size={14} /> Mark All as Read
                    </button>
                  )}
                </div>

                {supplierAcceptedNotifications.map(item => {
                  const isUnread = item.acceptedNotificationRead === false;
                  return (
                    <div key={item.id} style={{
                      padding: '1.15rem',
                      borderRadius: '0.85rem',
                      backgroundColor: isUnread ? '#ECFDF5' : '#F8FAFC',
                      border: isUnread ? '1.5px solid #6EE7B7' : '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      transition: '0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0F172A' }}>{item.name}</span>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '0.4rem', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #CBD5E1' }}>
                            MAT-{String(item.id).padStart(3, '0')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.8rem', fontWeight: '800', border: '1px solid #A7F3D0' }}>
                            Order Accepted
                          </span>
                          {isUnread && (
                            <button
                              onClick={() => handleMarkSingleRead(item.id)}
                              style={{
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.4rem',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                        <div>Supplier: <strong style={{ color: '#0F172A' }}>{item.supplierName || 'Yuthma Global Materials'}</strong></div>
                        <div>Supplier Email: <strong>{item.supplierEmail || 'N/A'}</strong></div>
                        <div>Material Type: <strong>{item.category}</strong></div>
                        <div>Total Quantity: <strong style={{ color: '#0F4C81' }}>{(item.purchasedStock || item.stockLevel || 0).toLocaleString()} {item.unit}</strong></div>
                        <div>Unit Price: <strong style={{ color: '#059669' }}>LKR {(item.unitPrice || getHistoryPrice(item.name)).toFixed(2)} / {item.unit}</strong></div>
                        <div>Total Valuation: <strong style={{ color: '#047857' }}>LKR {(item.totalPrice || ((item.unitPrice || getHistoryPrice(item.name)) * (item.purchasedStock || item.stockLevel || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                        {item.supplierAcceptedAt && (
                          <div style={{ gridColumn: 'span 2', fontSize: '0.8rem', color: '#64748B' }}>
                            Accepted Date & Time: <strong>{new Date(item.supplierAcceptedAt).toLocaleString()}</strong>
                          </div>
                        )}
                      </div>

                      {/* Supplier Provided Bank Details Box */}
                      {item.accountNumber ? (
                        <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', fontSize: '0.825rem' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                            <Building size={14} style={{ color: '#581C87' }} />
                            <span>Supplier Provided Bank Details (For Visa Payment):</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', color: '#334155' }}>
                            <div>Bank: <strong>{item.bankName || 'Commercial Bank of Ceylon'}</strong></div>
                            <div>Account Holder: <strong>{item.accountHolderName || item.supplierName}</strong></div>
                            <div>Account No: <strong style={{ fontFamily: 'monospace' }}>{item.accountNumber}</strong></div>
                            <div>Branch: <strong>{item.branchName || 'Main Branch'}</strong></div>
                            {item.swiftCode && <div>SWIFT: <strong>{item.swiftCode}</strong></div>}
                          </div>
                          {item.bankNotes && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.775rem', color: '#64748B', fontStyle: 'italic' }}>
                              Note: {item.bankNotes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px dashed #CBD5E1', fontSize: '0.8rem', color: '#64748B' }}>
                          Standard bank details will be applied upon payment.
                        </div>
                      )}

                      {/* Payment Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                        {item.paymentStatus === 'Paid' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ padding: '0.3rem 0.75rem', borderRadius: '99px', backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontWeight: '800', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CheckCircle2 size={14} style={{ color: '#10B981' }} /> Paid via Visa
                            </span>
                            <button
                              onClick={() => {
                                setShowSupplierAcceptedModal(false);
                                setViewingVisaReceiptModal(item);
                              }}
                              style={{ padding: '0.35rem 0.75rem', borderRadius: '0.5rem', backgroundColor: '#F0FDF4', color: '#059669', border: '1px solid #A7F3D0', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Receipt size={14} /> View Visa Receipt
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setShowSupplierAcceptedModal(false);
                              handleOpenVisaPaymentModal(item);
                            }}
                            style={{
                              padding: '0.5rem 1.15rem',
                              borderRadius: '0.55rem',
                              backgroundColor: '#059669',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: '800',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                            }}
                          >
                            <CreditCard size={16} />
                            <span>Pay Supplier via Visa Card (LKR {(item.totalPrice || ((item.unitPrice || getHistoryPrice(item.name)) * (item.purchasedStock || item.stockLevel || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Transaction Audit Trace Detail Modal */}
      {selectedTransactionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '100%',
            maxWidth: '560px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '0.5rem' }}>
                  <History size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Transaction Audit Trace #{selectedTransactionModal.transactionCode}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Stock movement record details
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTransactionModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: '700' }}>PACKAGING MATERIAL</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', marginTop: '0.2rem' }}>{selectedTransactionModal.itemName}</div>
                <div style={{ fontSize: '0.825rem', color: '#4F46E5', fontWeight: '700', marginTop: '0.15rem' }}>Category: {selectedTransactionModal.category}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Movement Type:</span>
                  <div style={{ fontWeight: '800', color: '#0F172A', marginTop: '0.15rem' }}>{selectedTransactionModal.transactionType}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Date & Time:</span>
                  <div style={{ fontWeight: '700', color: '#334155', marginTop: '0.15rem' }}>
                    {selectedTransactionModal.timestamp ? new Date(selectedTransactionModal.timestamp).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Quantity Changed:</span>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: selectedTransactionModal.quantityChanged > 0 ? '#059669' : '#DC2626', marginTop: '0.15rem' }}>
                    {selectedTransactionModal.quantityChanged > 0 ? `+${selectedTransactionModal.quantityChanged}` : selectedTransactionModal.quantityChanged} {selectedTransactionModal.unit}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Balance Before & After:</span>
                  <div style={{ fontWeight: '700', color: '#0F172A', marginTop: '0.15rem' }}>
                    {selectedTransactionModal.previousStock} &rarr; {selectedTransactionModal.newStock} {selectedTransactionModal.unit}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Initiated By / User:</span>
                <div style={{ fontWeight: '700', color: '#1E293B', marginTop: '0.15rem' }}>
                  {selectedTransactionModal.performedBy} ({selectedTransactionModal.performedByEmail || 'N/A'})
                </div>
              </div>

              <div>
                <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Audit Reason & Notes:</span>
                <div style={{ padding: '0.85rem', backgroundColor: '#FFFBEB', borderRadius: '0.5rem', border: '1px solid #FCD34D', color: '#92400E', marginTop: '0.25rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {selectedTransactionModal.notes || 'No notes attached to this stock transaction.'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedTransactionModal(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.65rem',
                  backgroundColor: '#0F4C81',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: VISA CARD PAYMENT GATEWAY FOR SUPPLIER ORDERS --- */}
      {payingMaterialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="card-rounded" style={{
            background: '#FFFFFF',
            padding: '2rem',
            borderRadius: '1.25rem',
            width: '95%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.55rem', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '0.5rem' }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Pay Supplier via Visa Card
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    Settle supplier order using their provided bank details with verified Visa card
                  </span>
                </div>
              </div>
              <button onClick={() => setPayingMaterialModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={22} />
              </button>
            </div>

            {/* Order Summary & Payable Amount */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '0.85rem', padding: '1.15rem', border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0F172A' }}>{payingMaterialModal.name}</div>
                  <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
                    MAT-{String(payingMaterialModal.id).padStart(3, '0')} &bull; Category: <strong>{payingMaterialModal.category}</strong>
                  </div>
                </div>
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '0.775rem', fontWeight: '800', border: '1px solid #A7F3D0' }}>
                  Accepted Order
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', borderTop: '1px dashed #CBD5E1', paddingTop: '0.65rem' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Order Quantity:</span>
                  <div style={{ fontWeight: '800', color: '#0F4C81' }}>
                    {(payingMaterialModal.purchasedStock || payingMaterialModal.stockLevel || 0).toLocaleString()} {payingMaterialModal.unit}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Unit Price (History Ref):</span>
                  <div style={{ fontWeight: '800', color: '#059669' }}>
                    LKR {(payingMaterialModal.unitPrice || getHistoryPrice(payingMaterialModal.name)).toFixed(2)} / {payingMaterialModal.unit}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', backgroundColor: '#ECFDF5', padding: '0.75rem 1rem', borderRadius: '0.65rem', border: '1.5px solid #34D399', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: '800', color: '#065F46', fontSize: '0.95rem' }}>Total Payable Amount:</span>
                  <span style={{ fontWeight: '900', fontSize: '1.25rem', color: '#047857' }}>
                    LKR {(payingMaterialModal.totalPrice || ((payingMaterialModal.unitPrice || getHistoryPrice(payingMaterialModal.name)) * (payingMaterialModal.purchasedStock || payingMaterialModal.stockLevel || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Beneficiary Bank Details */}
            <div style={{ backgroundColor: '#F3E8FF', borderRadius: '0.85rem', padding: '1.15rem', border: '1.5px solid #D8B4FE', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', fontSize: '0.925rem', color: '#581C87', marginBottom: '0.65rem' }}>
                <Building size={16} />
                <span>Supplier Beneficiary Bank Account (Supplied on Acceptance)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#3B0764' }}>
                <div>Bank Name: <strong>{payingMaterialModal.bankName || 'Commercial Bank of Ceylon'}</strong></div>
                <div>Account Holder: <strong>{payingMaterialModal.accountHolderName || payingMaterialModal.supplierName || 'Yuthma Global Materials (Pvt) Ltd'}</strong></div>
                <div>Account Number: <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '0.5px' }}>{payingMaterialModal.accountNumber || '800129482019'}</strong></div>
                <div>Branch: <strong>{payingMaterialModal.branchName || 'Colombo Fort Commercial Branch'}</strong></div>
                {payingMaterialModal.swiftCode && <div>SWIFT / BIC: <strong>{payingMaterialModal.swiftCode}</strong></div>}
                {payingMaterialModal.bankNotes && (
                  <div style={{ gridColumn: 'span 2', fontSize: '0.8rem', color: '#6B21A8', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    Supplier Note: "{payingMaterialModal.bankNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* Visa Card Payment Form */}
            <form onSubmit={handleConfirmVisaPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={17} style={{ color: '#2563EB' }} />
                <span>Inventory Manager Visa Card Payment Details</span>
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Cardholder Name *
                </label>
                <input
                  required
                  type="text"
                  value={visaForm.cardHolderName}
                  onChange={(e) => setVisaForm({ ...visaForm, cardHolderName: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Visa Card Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    required
                    type="text"
                    maxLength="19"
                    placeholder="4532 •••• •••• 4242"
                    value={visaForm.cardNumber}
                    onChange={(e) => setVisaForm({ ...visaForm, cardNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 3.5rem 0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: '1px' }}
                  />
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', padding: '0.2rem 0.45rem', backgroundColor: '#1E40AF', color: '#FFFFFF', borderRadius: '0.3rem', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '1px' }}>
                    VISA
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Expiry Date (MM/YY) *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength="5"
                    placeholder="MM/YY"
                    value={visaForm.expiryDate}
                    onChange={(e) => setVisaForm({ ...visaForm, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    CVV / CVC (3-digits) *
                  </label>
                  <input
                    required
                    type="password"
                    maxLength="4"
                    placeholder="•••"
                    value={visaForm.cvv}
                    onChange={(e) => setVisaForm({ ...visaForm, cvv: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: '#64748B', backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                <Lock size={14} style={{ color: '#059669', flexShrink: 0 }} />
                <span>Secured 256-Bit Encrypted Visa Electronic Settlement. The supplier will immediately receive an automated "Payment Received Successfully" notification for this order.</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPayingMaterialModal(null)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingVisaPayment}
                  className="btn-primary"
                  style={{
                    flex: 1.6,
                    padding: '0.75rem',
                    borderRadius: '0.65rem',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: processingVisaPayment ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <CreditCard size={18} />
                  <span>
                    {processingVisaPayment ? 'Processing Visa Payment...' : `Pay LKR ${(payingMaterialModal.totalPrice || ((payingMaterialModal.unitPrice || getHistoryPrice(payingMaterialModal.name)) * (payingMaterialModal.purchasedStock || payingMaterialModal.stockLevel || 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} via Visa`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: OFFICIAL VISA PAYMENT RECEIPT VOUCHER MODAL --- */}
      {viewingVisaReceiptModal && (() => {
        const receiptUnitPrice = Number(viewingVisaReceiptModal.unitPrice ?? getHistoryPrice(viewingVisaReceiptModal.name) ?? 0);
        const receiptQty = Number(viewingVisaReceiptModal.purchasedStock ?? viewingVisaReceiptModal.stockLevel ?? 0);
        const receiptTotalPrice = Number(viewingVisaReceiptModal.totalPrice ?? (receiptUnitPrice * receiptQty) ?? 0);
        let receiptDate = new Date().toLocaleDateString();
        if (viewingVisaReceiptModal.paidAt) {
          const d = new Date(viewingVisaReceiptModal.paidAt);
          if (!isNaN(d.getTime())) {
            receiptDate = d.toLocaleDateString();
          }
        }

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div className="card-rounded" style={{
              background: '#FFFFFF',
              padding: '2.5rem',
              borderRadius: '1.25rem',
              width: '92%',
              maxWidth: '680px',
              border: '1px solid #CBD5E1',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: '#0F172A',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
              {/* Voucher Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #059669', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#059669', margin: 0 }}>PackFLOW Packaging Ltd</h2>
                  <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '700', marginTop: '0.2rem' }}>Official Supplier Payment Voucher</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Industrial Inventory Visa Settlement Record</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ padding: '0.25rem 0.75rem', borderRadius: '0.4rem', backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: '800', fontSize: '0.85rem', display: 'inline-block' }}>
                    SETTLED VIA VISA
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
                    Voucher: <strong>{viewingVisaReceiptModal.paymentTransactionId || `VISA-VCH-${viewingVisaReceiptModal.id}`}</strong>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#94A3B8' }}>
                    Date: {receiptDate}
                  </div>
                </div>
              </div>

              {/* Parties Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '0.85rem', border: '1px solid #E2E8F0', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Payer (Purchaser):</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>PackFLOW Industrial Inventory Dept</strong>
                  <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Inventory Manager Procurement Visa Account</div>
                  <div style={{ color: '#2563EB', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.25rem' }}>
                    Visa Card: •••• {viewingVisaReceiptModal.cardLastFour || '4242'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Beneficiary (Supplier):</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{viewingVisaReceiptModal.accountHolderName || viewingVisaReceiptModal.supplierName || 'Yuthma Global Materials (Pvt) Ltd'}</strong>
                  <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Bank: <strong>{viewingVisaReceiptModal.bankName || 'Commercial Bank of Ceylon'}</strong></div>
                  <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Account No: <strong>{viewingVisaReceiptModal.accountNumber || '800129482019'}</strong></div>
                  {viewingVisaReceiptModal.branchName && <div style={{ color: '#64748B', fontSize: '0.8rem' }}>Branch: {viewingVisaReceiptModal.branchName}</div>}
                </div>
              </div>

              {/* Line Item Table */}
              <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#334155' }}>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Material Description</th>
                      <th style={{ padding: '0.65rem 0.75rem' }}>Category</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Quantity</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Unit Price (LKR)</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Total Settled (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '700', color: '#0F172A' }}>{viewingVisaReceiptModal.name}</td>
                      <td style={{ padding: '0.75rem', color: '#581C87', fontWeight: '600' }}>{viewingVisaReceiptModal.category}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#0F4C81' }}>
                        {receiptQty.toLocaleString()} {viewingVisaReceiptModal.unit}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#475569' }}>
                        LKR {receiptUnitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                        LKR {receiptTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #059669' }}>
                      <td colSpan="4" style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '0.95rem', color: '#0F172A' }}>
                        Grand Total Paid via Visa:
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '1.15rem', color: '#059669' }}>
                        LKR {receiptTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Voucher Footer & Print */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setViewingVisaReceiptModal(null)}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '700', cursor: 'pointer', color: '#475569' }}
                >
                  Close Receipt
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '0.7rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
                >
                  <Printer size={16} /> Print / Save Voucher PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
