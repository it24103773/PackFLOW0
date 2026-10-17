import React, { useState, useEffect } from 'react';
import { fetchMyOrders, submitPackagingRequirement, fetchPackagingTypes, updateCustomerDeadline, submitFinalPayment } from '../../services/api';
import AnnouncementsSidebar from './AnnouncementsSidebar';
import CustomerFeedbackPanel from './CustomerFeedbackPanel';
import OrderHistoryTable from './OrderHistoryTable';
import { ShoppingCart, Plus, CheckCircle2, Package, User, Send, AlertTriangle, Ruler, Clock, XCircle, Calendar, FileText, CreditCard, Upload, Download, Printer, Building, Check, History, Search, Megaphone, MessageSquare } from 'lucide-react';

export default function CustomerDashboard({ user, token }) {
  const [orders, setOrders] = useState([]);
  const [packagingTypes, setPackagingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Deadline & Instructions Modal State for Approved Orders
  const [selectedApprovedOrder, setSelectedApprovedOrder] = useState(null);
  const [deadlineForm, setDeadlineForm] = useState({
    targetDeadline: '',
    customerInstructions: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('Visa / Credit Card'); // 'Visa / Credit Card' or 'Bank Transfer'
  const [paymentSlipUrl, setPaymentSlipUrl] = useState('');
  const [submittingDeadline, setSubmittingDeadline] = useState(false);

  // Card Details State for Visa / Card payments
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  // 60% Final Payment Modal State
  const [selectedFinalPayOrder, setSelectedFinalPayOrder] = useState(null);
  const [finalPaymentMethod, setFinalPaymentMethod] = useState('Visa / Credit Card');
  const [finalPaymentSlipUrl, setFinalPaymentSlipUrl] = useState('');
  const [submittingFinalPay, setSubmittingFinalPay] = useState(false);

  const [finalCardDetails, setFinalCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  const handleCardNumberChange = (e, setDetailsState) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
    setDetailsState(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e, setDetailsState) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setDetailsState(prev => ({ ...prev, expiryDate: val }));
  };

  // Printable Receipt Modal State
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Main Navigation Tabs (Orders, Announcements, Feedback, History)
  const [mainTab, setMainTab] = useState('orders'); // 'orders', 'announcements', 'feedback', 'history'

  // Order Tabs and History Search State
  const [orderTab, setOrderTab] = useState('all'); // 'all', 'active', 'history'
  const [orderSearchKeyword, setOrderSearchKeyword] = useState('');

  const [reqForm, setReqForm] = useState({
    packagingType: 'Corrugated Box',
    lengthMm: 300,
    widthMm: 200,
    heightMm: 150,
    quantity: 1000,
    material: 'Kraft Double Wall B-Flute',
    printFinish: 'Full Color Offset + Gloss Lamination',
    notes: 'Please ensure high compression strength for stackable shipping boxes.'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, typesData] = await Promise.all([
        fetchMyOrders(token),
        fetchPackagingTypes()
      ]);
      setOrders(ordersData);
      setPackagingTypes(typesData);
      if (typesData && typesData.length > 0) {
        const firstType = typesData[0];
        setReqForm(prev => ({
          ...prev,
          packagingType: firstType.typeName,
          lengthMm: Math.round((firstType.minWidthMm + firstType.maxWidthMm) / 2),
          widthMm: Math.round((firstType.minHeightMm + firstType.maxHeightMm) / 2),
          heightMm: Math.round((firstType.minDepthMm + firstType.maxDepthMm) / 2)
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeTypeSpec = packagingTypes.find(t => t.typeName === reqForm.packagingType);

  const getDimensionWarning = () => {
    if (!activeTypeSpec) return null;
    const errors = [];
    const l = Number(reqForm.lengthMm);
    const w = Number(reqForm.widthMm);
    const h = Number(reqForm.heightMm);

    if (activeTypeSpec.minWidthMm && l < activeTypeSpec.minWidthMm) errors.push(`Length below min constraint (${activeTypeSpec.minWidthMm} mm)`);
    if (activeTypeSpec.maxWidthMm && l > activeTypeSpec.maxWidthMm) errors.push(`Length exceeds max constraint (${activeTypeSpec.maxWidthMm} mm)`);
    if (activeTypeSpec.minHeightMm && w < activeTypeSpec.minHeightMm) errors.push(`Width below min constraint (${activeTypeSpec.minHeightMm} mm)`);
    if (activeTypeSpec.maxHeightMm && w > activeTypeSpec.maxHeightMm) errors.push(`Width exceeds max constraint (${activeTypeSpec.maxHeightMm} mm)`);
    if (activeTypeSpec.minDepthMm && h < activeTypeSpec.minDepthMm) errors.push(`Height below min constraint (${activeTypeSpec.minDepthMm} mm)`);
    if (activeTypeSpec.maxDepthMm && h > activeTypeSpec.maxDepthMm) errors.push(`Height exceeds max constraint (${activeTypeSpec.maxDepthMm} mm)`);

    return errors.length > 0 ? errors.join(', ') : null;
  };

  const dimensionWarning = getDimensionWarning();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (dimensionWarning) {
      if (!window.confirm(`Warning: Your entered dimensions exceed defined constraints for ${reqForm.packagingType} (${dimensionWarning}). Submit as custom engineering request anyway?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setSuccessMessage('');
      const formattedDimensions = `${reqForm.lengthMm} x ${reqForm.widthMm} x ${reqForm.heightMm} mm`;

      const submitActiveTypeSpec = packagingTypes.find(t => t.typeName?.toLowerCase() === reqForm.packagingType?.toLowerCase());
      const reqUnitPrice = submitActiveTypeSpec?.baseUnitPrice ?? (
        reqForm.packagingType?.toLowerCase().includes('corrugated') ? 150 :
          reqForm.packagingType?.toLowerCase().includes('folding') || reqForm.packagingType?.toLowerCase().includes('carton') ? 90 :
            reqForm.packagingType?.toLowerCase().includes('rigid') ? 350 :
              reqForm.packagingType?.toLowerCase().includes('mailer') || reqForm.packagingType?.toLowerCase().includes('poly') ? 120 :
                reqForm.packagingType?.toLowerCase().includes('pouch') || reqForm.packagingType?.toLowerCase().includes('bag') || reqForm.packagingType?.toLowerCase().includes('kraft') ? 70 : 120
      );
      const reqQty = Math.max(1, Number(reqForm.quantity) || 1000);
      const reqSubtotal = reqUnitPrice * reqQty;
      const reqServiceCharge = reqSubtotal * 0.20;
      const reqTotalPrice = reqSubtotal + reqServiceCharge;
      const reqAdvancePayment = reqTotalPrice * 0.40;
      const reqRemainingBalance = reqTotalPrice * 0.60;

      await submitPackagingRequirement({
        customerName: user?.fullName || 'Valued Customer',
        customerEmail: user?.email || 'customer@packflow.com',
        packagingType: reqForm.packagingType,
        dimensions: formattedDimensions,
        quantity: Number(reqForm.quantity),
        printFinish: reqForm.printFinish,
        notes: `Material: ${reqForm.material} | Notes: ${reqForm.notes}`,
        status: 'Pending',
        progressPercentage: 0,
        unitPrice: reqUnitPrice,
        subtotal: reqSubtotal,
        serviceCharge: reqServiceCharge,
        totalPrice: reqTotalPrice,
        advancePayment: reqAdvancePayment,
        remainingBalance: reqRemainingBalance
      }, token);

      setSuccessMessage('Packaging Requirement Submitted Successfully!');
      setShowSubmitModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getUnitPriceForOrder = (order) => {
    if (!order || !order.packagingType) return 150;
    const match = packagingTypes.find(pt => pt.typeName?.toLowerCase() === order.packagingType?.toLowerCase());
    if (match && match.baseUnitPrice) return match.baseUnitPrice;
    const t = order.packagingType.toLowerCase();
    if (t.includes('corrugated')) return 150;
    if (t.includes('folding') || t.includes('carton')) return 90;
    if (t.includes('rigid')) return 350;
    if (t.includes('mailer') || t.includes('poly')) return 120;
    if (t.includes('pouch') || t.includes('bag') || t.includes('kraft')) return 70;
    return 120;
  };

  const handleFileUpload = (e, setUrlCallback) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setUrlCallback(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const orderUnitPrice = getUnitPriceForOrder(selectedApprovedOrder);
  const orderQty = Number(selectedApprovedOrder?.quantity || 1000);
  const orderSubtotal = orderUnitPrice * orderQty;
  const orderServiceCharge = orderSubtotal * 0.20;
  const orderTotalPrice = orderSubtotal + orderServiceCharge;
  const orderAdvancePayment = orderTotalPrice * 0.40;
  const orderRemainingBalance = orderTotalPrice - orderAdvancePayment;

  const handleDeadlineSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApprovedOrder) return;
    if (paymentMethod === 'Bank Transfer' && !paymentSlipUrl) {
      alert('Please upload your bank transfer payment slip before submitting.');
      return;
    }

    if (paymentMethod === 'Visa / Credit Card') {
      const cleanCard = cardDetails.cardNumber.replace(/\s/g, '');
      if (!cleanCard || cleanCard.length < 16) {
        alert('Please enter a valid 16-digit Visa / Credit card number.');
        return;
      }
      if (!cardDetails.cardHolder.trim()) {
        alert('Please enter the Cardholder Name.');
        return;
      }
      if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
        alert('Please enter a valid Expiry Date (MM/YY).');
        return;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        alert('Please enter a valid 3 or 4 digit CVV/CVC code.');
        return;
      }
    }

    try {
      setSubmittingDeadline(true);
      const isBank = paymentMethod === 'Bank Transfer';
      const last4 = cardDetails.cardNumber.replace(/\s/g, '').slice(-4);
      const cardLabel = isBank ? '' : ` (•••• ${last4 || 'CARD'})`;
      const statusText = isBank
        ? 'Pending Verification (Bank Slip Uploaded)'
        : `Paid 40% Advance via Visa${cardLabel} (LKR ${orderAdvancePayment.toLocaleString(undefined, { minimumFractionDigits: 2 })})`;

      await updateCustomerDeadline(
        selectedApprovedOrder.id,
        deadlineForm.targetDeadline,
        deadlineForm.customerInstructions,
        token,
        {
          unitPrice: orderUnitPrice,
          subtotal: orderSubtotal,
          serviceCharge: orderServiceCharge,
          totalPrice: orderTotalPrice,
          advancePayment: orderAdvancePayment,
          remainingBalance: orderRemainingBalance,
          paymentMethod: isBank ? paymentMethod : `Visa / Credit Card${cardLabel}`,
          paymentSlipUrl: isBank ? paymentSlipUrl : null,
          paymentStatus: isBank ? 'Pending Verification' : 'Verified & Accepted',
          advancePaidStatus: statusText
        }
      );
      setSuccessMessage(`Order #${selectedApprovedOrder.orderNumber} updated! 40% Advance Payment (${paymentMethod}) submitted successfully!`);
      setSelectedApprovedOrder(null);
      setPaymentSlipUrl('');
      setCardDetails({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingDeadline(false);
    }
  };

  const handleFinalPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFinalPayOrder) return;
    if (finalPaymentMethod === 'Bank Transfer' && !finalPaymentSlipUrl) {
      alert('Please upload your bank transfer payment slip before submitting final balance payment.');
      return;
    }

    if (finalPaymentMethod === 'Visa / Credit Card') {
      const cleanCard = finalCardDetails.cardNumber.replace(/\s/g, '');
      if (!cleanCard || cleanCard.length < 16) {
        alert('Please enter a valid 16-digit Visa / Credit card number.');
        return;
      }
      if (!finalCardDetails.cardHolder.trim()) {
        alert('Please enter the Cardholder Name.');
        return;
      }
      if (!finalCardDetails.expiryDate || finalCardDetails.expiryDate.length < 5) {
        alert('Please enter a valid Expiry Date (MM/YY).');
        return;
      }
      if (!finalCardDetails.cvv || finalCardDetails.cvv.length < 3) {
        alert('Please enter a valid 3 or 4 digit CVV/CVC code.');
        return;
      }
    }

    try {
      setSubmittingFinalPay(true);
      const isBankFinal = finalPaymentMethod === 'Bank Transfer';
      const finalLast4 = finalCardDetails.cardNumber.replace(/\s/g, '').slice(-4);
      const finalCardLabel = isBankFinal ? '' : ` (•••• ${finalLast4 || 'CARD'})`;
      const submittedFinalMethod = isBankFinal ? finalPaymentMethod : `Visa / Credit Card${finalCardLabel}`;

      await submitFinalPayment(
        selectedFinalPayOrder.id,
        submittedFinalMethod,
        isBankFinal ? finalPaymentSlipUrl : null,
        token
      );
      setSuccessMessage(`Order #${selectedFinalPayOrder.orderNumber} final 60% balance payment (${finalPaymentMethod}) submitted!`);
      setSelectedFinalPayOrder(null);
      setFinalPaymentSlipUrl('');
      setFinalCardDetails({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingFinalPay(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Customer Portal...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="card-rounded" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        color: '#FFFFFF',
        borderRadius: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            <User size={16} />
            <span>Customer Portal</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Welcome, {user?.fullName || 'Customer'}</h1>
        </div>

        <button onClick={() => setShowSubmitModal(true)} className="btn-secondary" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', backgroundColor: '#FFFFFF', color: '#047857', fontWeight: '700' }}>
          <Plus size={18} />
          <span>Submit New Order Spec</span>
        </button>
      </div>

      {successMessage && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: '0.75rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Customer Submitted Orders List */}
      <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={20} style={{ color: '#059669' }} />
            <span>My Packaging Orders & Requirement History ({orders.length})</span>
          </h3>
          <button onClick={() => setShowSubmitModal(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Send size={16} /> Submit New Order
          </button>
        </div>

        {/* Filter Tabs & Previous Order History Search Header */}
        {(() => {
          const activeOrders = orders.filter(o => o.status !== 'Closed & Fully Paid' && o.status !== 'Completed');
          const previousOrders = orders.filter(o => o.status === 'Closed & Fully Paid' || o.status === 'Completed' || o.finalPaymentStatus === 'Verified & Accepted');

          const filteredOrders = (
            orderTab === 'active' ? activeOrders :
              orderTab === 'history' ? previousOrders : orders
          ).filter(o => {
            if (!orderSearchKeyword.trim()) return true;
            const kw = orderSearchKeyword.toLowerCase();
            return (
              o.orderNumber?.toLowerCase().includes(kw) ||
              o.packagingType?.toLowerCase().includes(kw) ||
              o.printFinish?.toLowerCase().includes(kw) ||
              o.dimensions?.toLowerCase().includes(kw) ||
              o.status?.toLowerCase().includes(kw)
            );
          });

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '0.85rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setOrderTab('all')}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '0.55rem',
                      border: '1px solid #CBD5E1',
                      backgroundColor: orderTab === 'all' ? '#0F4C81' : '#FFFFFF',
                      color: orderTab === 'all' ? '#FFFFFF' : '#475569',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      boxShadow: orderTab === 'all' ? '0 2px 6px rgba(15, 76, 129, 0.25)' : 'none'
                    }}
                  >
                    All Orders ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderTab('active')}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '0.55rem',
                      border: '1px solid #CBD5E1',
                      backgroundColor: orderTab === 'active' ? '#D97706' : '#FFFFFF',
                      color: orderTab === 'active' ? '#FFFFFF' : '#475569',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      boxShadow: orderTab === 'active' ? '0 2px 6px rgba(217, 119, 6, 0.25)' : 'none'
                    }}
                  >
                    Active Ongoing ({activeOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderTab('history')}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '0.55rem',
                      border: '1px solid #CBD5E1',
                      backgroundColor: orderTab === 'history' ? '#059669' : '#FFFFFF',
                      color: orderTab === 'history' ? '#FFFFFF' : '#475569',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: orderTab === 'history' ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none'
                    }}
                  >
                    <History size={14} /> Previous Order History ({previousOrders.length})
                  </button>
                </div>

                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search previous orders..."
                    value={orderSearchKeyword}
                    onChange={(e) => setOrderSearchKeyword(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.3rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.825rem', outline: 'none', backgroundColor: '#FFFFFF' }}
                  />
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
                  <Package size={40} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>
                    {orderTab === 'history' ? 'No Previous Order History Found' : 'No packaging orders found'}
                  </h4>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>
                    {orderTab === 'history' ? 'Completed and paid orders will appear here in your previous order history.' : 'Submit your custom box or printing requirements using the button above.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredOrders.map((o) => {
                    const isApproved = (o.status === 'Approved' || o.status === 'Accepted' || o.status === 'Waiting for Customer Deadline') && !o.targetDeadline;
                    const isReadyForPlacement = o.status === 'Ready for Placement';
                    const isInProgress = o.status === 'In Progress';
                    const isCompleted = o.status === 'Completed';
                    const isDenied = o.status === 'Denied';

                    const statusColor =
                      isCompleted ? '#059669' :
                        isApproved || isReadyForPlacement ? '#D97706' :
                          isDenied ? '#DC2626' :
                            isInProgress ? '#0284C7' : '#D97706';

                    const statusBg =
                      isCompleted ? '#D1FAE5' :
                        isApproved || isReadyForPlacement ? '#FEF3C7' :
                          isDenied ? '#FEE2E2' :
                            isInProgress ? '#E0F2FE' : '#FEF3C7';

                    return (
                      <div key={o.id} style={{ padding: '1.25rem', borderRadius: '1rem', border: isApproved ? '2px solid #F59E0B' : '1px solid #E2E8F0', backgroundColor: isApproved ? '#FFFBEB' : '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <span style={{ fontWeight: '800', color: '#059669', fontSize: '1.05rem', marginRight: '0.75rem' }}>{o.orderNumber}</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A' }}>{o.packagingType} ({o.quantity?.toLocaleString()} units)</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ padding: '0.35rem 0.85rem', borderRadius: '99px', backgroundColor: statusBg, color: statusColor, fontSize: '0.85rem', fontWeight: '800' }}>
                              Status: {isInProgress ? 'Order is in Process' : o.status}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                          <strong>Dimensions:</strong> {o.dimensions} &bull; <strong>Finish:</strong> {o.printFinish}
                        </div>

                        {/* Financial & Advance Payment Breakdown */}
                        {(() => {
                          const cardUnitPrice = o.unitPrice ?? getUnitPriceForOrder(o);
                          const cardQty = Number(o.quantity || 1000);
                          const cardSubtotal = o.subtotal ?? (cardUnitPrice * cardQty);
                          const cardServiceCharge = o.serviceCharge ?? (cardSubtotal * 0.20);
                          const cardTotalPrice = o.totalPrice ?? (cardSubtotal + cardServiceCharge);
                          const cardAdvancePayment = o.advancePayment ?? (cardTotalPrice * 0.40);
                          const cardRemainingBalance = o.remainingBalance ?? (cardTotalPrice * 0.60);

                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', fontSize: '0.8rem' }}>
                              <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>Base Unit Price:</span> <strong style={{ color: '#0F172A' }}>LKR {cardUnitPrice.toFixed(2)}</strong></div>
                              <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>Subtotal:</span> <strong style={{ color: '#0F172A' }}>LKR {cardSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                              <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>20% Service Charge:</span> <strong style={{ color: '#D97706' }}>+LKR {cardServiceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                              <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>Total Calculated Price:</span> <strong style={{ color: '#0F172A', fontSize: '0.875rem' }}>LKR {cardTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                              <div>
                                <span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>40% Advance Payment:</span>
                                <strong style={{ color: '#059669', fontSize: '0.825rem' }}>LKR {cardAdvancePayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                <span style={{ display: 'inline-block', backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', marginLeft: '0.3rem' }}>40% Advance</span>
                              </div>
                              <div><span style={{ color: '#64748B', fontSize: '0.725rem', display: 'block' }}>60% Remaining Balance:</span> <strong style={{ color: '#0284C7' }}>LKR {cardRemainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                            </div>
                          );
                        })()}


                        {/* Operational Timeline & Manager Details if In Progress or set */}
                        {(o.assignedManager || o.startDate || o.targetDeadline) && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                            {o.assignedManager && (
                              <div>
                                <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Assigned Manager:</span>
                                <strong style={{ color: '#0284C7' }}>{o.assignedManager}</strong>
                              </div>
                            )}
                            {o.startDate && (
                              <div>
                                <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Production Start Date:</span>
                                <strong style={{ color: '#0F172A' }}>{o.startDate}</strong>
                              </div>
                            )}
                            {(o.endDate || o.targetDeadline) && (
                              <div>
                                <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>Target End Date / Deadline:</span>
                                <strong style={{ color: '#D97706' }}>{o.endDate || o.targetDeadline}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {o.customerInstructions && (
                          <div style={{ fontSize: '0.8rem', color: '#0369A1', backgroundColor: '#F0F9FF', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #BAE6FD' }}>
                            <strong>Your Order Instructions & Deadline Notes:</strong> {o.customerInstructions}
                          </div>
                        )}

                        {o.notes && (
                          <div style={{ fontSize: '0.8rem', color: '#64748B', backgroundColor: '#F1F5F9', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                            <strong>Basic Spec Details:</strong> {o.notes}
                          </div>
                        )}

                        {/* Rejection Notice Banner for Payment */}
                        {o.paymentStatus === 'Rejected (Invalid Slip)' && (
                          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.85rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', color: '#991B1B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <strong>⚠️ 40% Advance Payment Slip Rejected by Admin:</strong> &ldquo;{o.paymentRejectionReason || 'Invalid bank transfer slip image or unreadable receipt details'}&rdquo;
                            </div>
                            <button
                              onClick={() => {
                                setSelectedApprovedOrder(o);
                                setDeadlineForm({
                                  targetDeadline: o.targetDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                                  customerInstructions: o.customerInstructions || ''
                                });
                              }}
                              style={{ padding: '0.45rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Re-Submit 40% Advance Payment / Slip
                            </button>
                          </div>
                        )}

                        {/* Bank Transfer Pending Verification Badge */}
                        {o.paymentStatus === 'Pending Verification' && (
                          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.825rem', color: '#92400E', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={16} /> 40% Advance Bank Transfer Slip Uploaded — Awaiting Admin Verification.
                          </div>
                        )}

                        {/* Action Banner for Approved Specifications */}
                        {isApproved && o.paymentStatus !== 'Pending Verification' && (
                          <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FEF3C7', borderRadius: '0.75rem', border: '1px solid #FCD34D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#92400E', fontWeight: '600' }}>
                              🎉 Your packaging specification is Approved! Click to set order deadlines & final instructions for admin placement.
                            </div>
                            <button
                              onClick={() => {
                                setSelectedApprovedOrder(o);
                                setDeadlineForm({
                                  targetDeadline: o.targetDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                                  customerInstructions: o.customerInstructions || 'Standard delivery required to warehouse.'
                                });
                              }}
                              style={{ padding: '0.45rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#D97706', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Clock size={15} /> Give Order Deadline & Instructions
                            </button>
                          </div>
                        )}

                        {/* 100% Production Completed - Pay Remaining 60% Balance Banner */}
                        {o.progressPercentage === 100 && o.status !== 'Closed & Fully Paid' && o.finalPaymentStatus !== 'Verified & Accepted' && o.finalPaymentStatus !== 'Pending Verification' && (
                          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.85rem 1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: '700' }}>
                              🎉 Production 100% Complete! Pay remaining 60% balance (LKR {o.remainingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}) to close order & receive PDF receipt.
                            </div>
                            <button
                              onClick={() => setSelectedFinalPayOrder(o)}
                              style={{ padding: '0.45rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <CreditCard size={15} /> Pay Remaining 60% Balance
                            </button>
                          </div>
                        )}

                        {o.finalPaymentStatus === 'Pending Verification' && (
                          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.825rem', color: '#92400E', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={16} /> 60% Final Balance Bank Slip Uploaded — Awaiting Admin Verification.
                          </div>
                        )}

                        {o.finalPaymentStatus === 'Rejected (Invalid Slip)' && (
                          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.85rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', color: '#991B1B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <strong>⚠️ 60% Final Payment Slip Rejected by Admin:</strong> &ldquo;{o.finalPaymentRejectionReason || 'Invalid slip'}&rdquo;
                            </div>
                            <button
                              onClick={() => setSelectedFinalPayOrder(o)}
                              style={{ padding: '0.45rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Re-Submit 60% Payment / Slip
                            </button>
                          </div>
                        )}

                        {/* Closed & Fully Paid Order - Download PDF Receipt Button */}
                        {(o.status === 'Closed & Fully Paid' || o.finalPaymentStatus === 'Verified & Accepted') && (
                          <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '0.85rem 1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#0369A1', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CheckCircle2 size={16} style={{ color: '#0284C7' }} /> Order Closed & Fully Paid! Official tax receipt ready.
                            </div>
                            <button
                              onClick={() => setSelectedReceiptOrder(o)}
                              style={{ padding: '0.45rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', fontWeight: '700', fontSize: '0.825rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Download size={15} /> Download PDF Order Receipt
                            </button>
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                            <span>Order Progress Status ({isInProgress ? 'Order in Process' : o.status})</span>
                            <span>{o.progressPercentage || 0}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${o.progressPercentage || 0}%`, height: '100%', backgroundColor: statusColor, borderRadius: '99px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Customer Profile Summary Card */}
      <div className="card-rounded" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} style={{ color: '#059669' }} />
          <span>Customer Profile Information</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
          <div><strong style={{ color: '#64748B' }}>Full Name:</strong> <div style={{ fontWeight: '700', color: '#0F172A' }}>{user?.fullName || 'N/A'}</div></div>
          <div><strong style={{ color: '#64748B' }}>Email Address:</strong> <div style={{ fontWeight: '700', color: '#0F172A' }}>{user?.email || 'N/A'}</div></div>
        </div>
      </div>

      {/* Submit Custom Packaging Requirement Modal */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '580px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>Submit Custom Packaging Requirement</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>Specify your required packaging type, dimensions, quantity & material finish.</p>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Packaging Type</label>
                <select
                  value={reqForm.packagingType}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const typeObj = packagingTypes.find(t => t.typeName === selected);
                    setReqForm({
                      ...reqForm,
                      packagingType: selected,
                      lengthMm: typeObj ? Math.round((typeObj.minWidthMm + typeObj.maxWidthMm) / 2) : reqForm.lengthMm,
                      widthMm: typeObj ? Math.round((typeObj.minHeightMm + typeObj.maxHeightMm) / 2) : reqForm.widthMm,
                      heightMm: typeObj ? Math.round((typeObj.minDepthMm + typeObj.maxDepthMm) / 2) : reqForm.heightMm,
                      material: typeObj?.supportedMaterials?.split(',')[0] || reqForm.material
                    });
                  }}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                >
                  {packagingTypes.map(t => (
                    <option key={t.id} value={t.typeName}>{t.typeName}</option>
                  ))}
                </select>
              </div>

              {activeTypeSpec && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.65rem', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: '0.825rem', color: '#0369A1' }}>
                  <div style={{ fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Ruler size={14} /> Allowed Dimension Constraints for {activeTypeSpec.typeName}:
                  </div>
                  <div>Length: <strong>{activeTypeSpec.minWidthMm} - {activeTypeSpec.maxWidthMm} mm</strong> &bull; Width: <strong>{activeTypeSpec.minHeightMm} - {activeTypeSpec.maxHeightMm} mm</strong> &bull; Height: <strong>{activeTypeSpec.minDepthMm} - {activeTypeSpec.maxDepthMm} mm</strong></div>
                  <div>Max Weight Capacity: <strong>{activeTypeSpec.maxWeightCapacityKg} kg</strong></div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Length (mm)</label>
                  <input required type="number" value={reqForm.lengthMm} onChange={(e) => setReqForm({ ...reqForm, lengthMm: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Width (mm)</label>
                  <input required type="number" value={reqForm.widthMm} onChange={(e) => setReqForm({ ...reqForm, widthMm: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>Height (mm)</label>
                  <input required type="number" value={reqForm.heightMm} onChange={(e) => setReqForm({ ...reqForm, heightMm: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
              </div>

              {dimensionWarning && (
                <div style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} />
                  <span>Dimension Notice: {dimensionWarning}</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Order Quantity (Units)</label>
                <input required type="number" min="50" value={reqForm.quantity} onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>

              {/* DYNAMIC LIVE PACKAGING PRICE BREAKDOWN BOX */}
              {(() => {
                const reqUnitPrice = activeTypeSpec?.baseUnitPrice ?? (
                  reqForm.packagingType?.toLowerCase().includes('corrugated') ? 150 :
                    reqForm.packagingType?.toLowerCase().includes('folding') || reqForm.packagingType?.toLowerCase().includes('carton') ? 90 :
                      reqForm.packagingType?.toLowerCase().includes('rigid') ? 350 :
                        reqForm.packagingType?.toLowerCase().includes('mailer') || reqForm.packagingType?.toLowerCase().includes('poly') ? 120 :
                          reqForm.packagingType?.toLowerCase().includes('pouch') || reqForm.packagingType?.toLowerCase().includes('bag') || reqForm.packagingType?.toLowerCase().includes('kraft') ? 70 : 120
                );
                const reqQty = Math.max(1, Number(reqForm.quantity) || 1000);
                const reqSubtotal = reqUnitPrice * reqQty;
                const reqServiceCharge = reqSubtotal * 0.20;
                const reqTotalPrice = reqSubtotal + reqServiceCharge;
                const reqAdvancePayment = reqTotalPrice * 0.40;
                const reqRemainingBalance = reqTotalPrice * 0.60;

                return (
                  <div style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #CBD5E1', padding: '1rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CreditCard size={18} style={{ color: '#D97706' }} />
                      <span>{reqForm.packagingType} — Price & Cost Estimation</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', fontSize: '0.8rem', color: '#475569' }}>
                      <div>Packaging Unit Price: <strong style={{ color: '#0F172A' }}>LKR {reqUnitPrice.toFixed(2)} / unit</strong></div>
                      <div>Quantity Requested: <strong style={{ color: '#0F172A' }}>{reqQty.toLocaleString()} Units</strong></div>
                      <div>Base Material Subtotal: <strong style={{ color: '#0F172A' }}>LKR {reqSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                      <div>Service Charge (20%): <strong style={{ color: '#D97706' }}>+LKR {reqServiceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                    </div>

                    <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>Total Calculated Order Price:</span>
                      <strong style={{ fontSize: '1.05rem', color: '#059669', fontWeight: '800' }}>LKR {reqTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.775rem', color: '#92400E' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Initial 40% Advance Required:</span>
                        <strong style={{ fontSize: '0.875rem', color: '#D97706' }}>LKR {reqAdvancePayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div style={{ backgroundColor: '#E0F2FE', border: '1px solid #7DD3FC', padding: '0.5rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.775rem', color: '#0369A1' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Final 60% Remaining Balance:</span>
                        <strong style={{ fontSize: '0.875rem', color: '#0284C7' }}>LKR {reqRemainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Material Spec Preference</label>
                <input required type="text" placeholder="e.g. 350 GSM Kraft Board or B-Flute" value={reqForm.material} onChange={(e) => setReqForm({ ...reqForm, material: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Print & Surface Finish Specs</label>
                <input required type="text" placeholder="e.g. 4 Color Offset + Matte Lamination" value={reqForm.printFinish} onChange={(e) => setReqForm({ ...reqForm, printFinish: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Special Notes / Die-Line Instructions</label>
                <textarea rows="3" value={reqForm.notes} onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#059669' }}>
                  {submitting ? 'Submitting...' : 'Submit Order Spec'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Order Deadline & Instructions Modal for Approved Specifications */}
      {selectedApprovedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '520px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#D97706', backgroundColor: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '0.35rem' }}>Approved Spec #{selectedApprovedOrder.orderNumber}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '0.35rem', marginBottom: 0 }}>Provide Order Deadline & Instructions</h3>
              </div>
              <button onClick={() => setSelectedApprovedOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <XCircle size={22} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>
              Your basic product specification has been approved by admin. Now set your target delivery deadline date and additional instructions so the admin can place the order and assign production schedule.
            </p>

            <form onSubmit={handleDeadlineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <Calendar size={16} style={{ color: '#D97706' }} /> Order Target Deadline Date
                </label>
                <input
                  required
                  type="date"
                  min={new Date().toLocaleDateString('en-CA')}
                  value={deadlineForm.targetDeadline}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, targetDeadline: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <FileText size={16} style={{ color: '#D97706' }} /> Delivery & Order Instructions
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Deliver to warehouse A, pack in bundles of 50, apply custom shipping barcode labels..."
                  value={deadlineForm.customerInstructions}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, customerInstructions: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', outline: 'none' }}
                />
              </div>

              {/* Order Pricing & 40% Advance Payment Breakdown Card */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CreditCard size={18} style={{ color: '#D97706' }} />
                  <span>Order Pricing & Initial Advance Payment</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem', color: '#475569' }}>
                  <div>Base Unit Price: <strong>LKR {orderUnitPrice.toFixed(2)}</strong></div>
                  <div>Quantity: <strong>{orderQty.toLocaleString()} Units</strong></div>
                  <div>Base Subtotal: <strong>LKR {orderSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                  <div>Service Charge (20%): <strong style={{ color: '#D97706' }}>+LKR {orderServiceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #CBD5E1', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A' }}>Total Calculated Price:</span>
                  <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>LKR {orderTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>

                {/* 40% Advance Highlight Banner */}
                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400E', textTransform: 'uppercase' }}>
                    ⚡ Initial Advance Payment Due Now (40%):
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#D97706' }}>
                    LKR {orderAdvancePayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#B45309' }}>
                    Remaining 60% Balance (LKR {orderRemainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}) due upon production completion.
                  </div>
                </div>

                {/* Select Payment Method: Visa vs Bank Transfer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>Select Payment Option:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Visa / Credit Card')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: paymentMethod === 'Visa / Credit Card' ? '2px solid #059669' : '1px solid #CBD5E1',
                        backgroundColor: paymentMethod === 'Visa / Credit Card' ? '#ECFDF5' : '#FFFFFF',
                        color: paymentMethod === 'Visa / Credit Card' ? '#047857' : '#475569',
                        fontWeight: '700',
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <CreditCard size={15} /> Visa / Card
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Bank Transfer')}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: paymentMethod === 'Bank Transfer' ? '2px solid #D97706' : '1px solid #CBD5E1',
                        backgroundColor: paymentMethod === 'Bank Transfer' ? '#FEF3C7' : '#FFFFFF',
                        color: paymentMethod === 'Bank Transfer' ? '#92400E' : '#475569',
                        fontWeight: '700',
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Building size={15} /> Bank Transfer Slip
                    </button>
                  </div>

                  {paymentMethod === 'Visa / Credit Card' && (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '0.65rem', border: '1px solid #059669', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CreditCard size={15} /> Enter Visa / Credit Card Details
                        </div>
                        <span style={{ fontSize: '0.675rem', backgroundColor: '#E0E7FF', color: '#3730A3', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: '800' }}>
                          256-bit SSL Encrypted
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                          Card Number <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            placeholder="4532 1234 5678 9012"
                            maxLength={19}
                            value={cardDetails.cardNumber}
                            onChange={(e) => handleCardNumberChange(e, setCardDetails)}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.85rem',
                              letterSpacing: '0.05em',
                              fontFamily: 'monospace',
                              fontWeight: '600'
                            }}
                          />
                          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', fontWeight: '800', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', border: '1px solid #BFDBFE' }}>
                            VISA
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                          Cardholder Name <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. JOHN DOE"
                          value={cardDetails.cardHolder}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cardHolder: e.target.value.toUpperCase() }))}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.825rem',
                            fontWeight: '600'
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                            Expiry Date <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="MM / YY"
                            maxLength={5}
                            value={cardDetails.expiryDate}
                            onChange={(e) => handleExpiryChange(e, setCardDetails)}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.825rem',
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              fontWeight: '600'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                            CVV / CVC <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input
                            type="password"
                            placeholder="123"
                            maxLength={4}
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.65rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.825rem',
                              fontFamily: 'monospace',
                              textAlign: 'center',
                              fontWeight: '600'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Bank Transfer' && (
                    <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px dashed #D97706', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontWeight: '700', color: '#92400E' }}>
                        🏦 Commercial Bank of Ceylon | Acc: 8004592019 | PackFLOW Ltd
                      </div>
                      <label style={{ fontWeight: '600', color: '#334155' }}>Upload Transfer Slip Image / PDF:</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, setPaymentSlipUrl)}
                        style={{ fontSize: '0.775rem' }}
                      />
                      {paymentSlipUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <img src={paymentSlipUrl} alt="Bank Slip Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.35rem', border: '1px solid #CBD5E1' }} />
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>✓ Transfer slip attached for admin verification</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setSelectedApprovedOrder(null); setCardDetails({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' }); }} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={submittingDeadline} className="btn-primary" style={{ flex: 1.6, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#D97706', color: '#FFFFFF', fontWeight: '700', fontSize: '0.85rem' }}>
                  {submittingDeadline ? 'Processing Payment...' : `Submit 40% Advance (${paymentMethod})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 60% Final Payment Modal for Completed Production Orders */}
      {selectedFinalPayOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '520px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#059669', backgroundColor: '#D1FAE5', padding: '0.2rem 0.5rem', borderRadius: '0.35rem' }}>Completed Order #{selectedFinalPayOrder.orderNumber}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '0.35rem', marginBottom: 0 }}>Pay Remaining 60% Balance</h3>
              </div>
              <button onClick={() => setSelectedFinalPayOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleFinalPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: '800', color: '#065F46' }}>Order Production 100% Completed!</div>
                <div>Total Order Price: <strong>LKR {selectedFinalPayOrder.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                <div>Already Paid 40% Advance: <strong style={{ color: '#059669' }}>LKR {selectedFinalPayOrder.advancePayment?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                <div style={{ borderTop: '1px dashed #A7F3D0', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '800', color: '#0F172A' }}>Remaining 60% Balance Due:</span>
                  <strong style={{ fontSize: '1.25rem', color: '#059669' }}>LKR {selectedFinalPayOrder.remainingBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* Payment Method Option */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A' }}>Select Payment Method:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setFinalPaymentMethod('Visa / Credit Card')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '0.5rem',
                      border: finalPaymentMethod === 'Visa / Credit Card' ? '2px solid #059669' : '1px solid #CBD5E1',
                      backgroundColor: finalPaymentMethod === 'Visa / Credit Card' ? '#ECFDF5' : '#FFFFFF',
                      color: finalPaymentMethod === 'Visa / Credit Card' ? '#047857' : '#475569',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <CreditCard size={15} /> Visa / Credit Card
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinalPaymentMethod('Bank Transfer')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '0.5rem',
                      border: finalPaymentMethod === 'Bank Transfer' ? '2px solid #D97706' : '1px solid #CBD5E1',
                      backgroundColor: finalPaymentMethod === 'Bank Transfer' ? '#FEF3C7' : '#FFFFFF',
                      color: finalPaymentMethod === 'Bank Transfer' ? '#92400E' : '#475569',
                      fontWeight: '700',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Building size={15} /> Bank Transfer Slip
                  </button>
                </div>

                {finalPaymentMethod === 'Visa / Credit Card' && (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem', borderRadius: '0.65rem', border: '1px solid #059669', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CreditCard size={15} /> Enter Visa / Credit Card Details
                      </div>
                      <span style={{ fontSize: '0.675rem', backgroundColor: '#E0E7FF', color: '#3730A3', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: '800' }}>
                        256-bit SSL Encrypted
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                        Card Number <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="4532 1234 5678 9012"
                          maxLength={19}
                          value={finalCardDetails.cardNumber}
                          onChange={(e) => handleCardNumberChange(e, setFinalCardDetails)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.85rem',
                            letterSpacing: '0.05em',
                            fontFamily: 'monospace',
                            fontWeight: '600'
                          }}
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', fontWeight: '800', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', border: '1px solid #BFDBFE' }}>
                          VISA
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                        Cardholder Name <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. JOHN DOE"
                        value={finalCardDetails.cardHolder}
                        onChange={(e) => setFinalCardDetails(prev => ({ ...prev, cardHolder: e.target.value.toUpperCase() }))}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.825rem',
                          fontWeight: '600'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                          Expiry Date <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          maxLength={5}
                          value={finalCardDetails.expiryDate}
                          onChange={(e) => handleExpiryChange(e, setFinalCardDetails)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.825rem',
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            fontWeight: '600'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                          CVV / CVC <span style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength={4}
                          value={finalCardDetails.cvv}
                          onChange={(e) => setFinalCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.825rem',
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            fontWeight: '600'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {finalPaymentMethod === 'Bank Transfer' && (
                  <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '0.5rem', border: '1px dashed #D97706', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontWeight: '700', color: '#92400E' }}>
                      🏦 Commercial Bank of Ceylon | Acc: 8004592019 | PackFLOW Ltd
                    </div>
                    <label style={{ fontWeight: '600', color: '#334155' }}>Upload 60% Final Payment Slip Image:</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, setFinalPaymentSlipUrl)}
                      style={{ fontSize: '0.775rem' }}
                    />
                    {finalPaymentSlipUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <img src={finalPaymentSlipUrl} alt="Slip Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.35rem', border: '1px solid #CBD5E1' }} />
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>✓ 60% Payment slip attached for admin verification</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setSelectedFinalPayOrder(null); setFinalCardDetails({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' }); }} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={submittingFinalPay} className="btn-primary" style={{ flex: 1.6, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', fontSize: '0.85rem' }}>
                  {submittingFinalPay ? 'Submitting Payment...' : `Pay Final 60% Balance (LKR ${Math.round(selectedFinalPayOrder.remainingBalance || 0).toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable PDF Order Receipt Modal */}
      {selectedReceiptOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2.5rem', borderRadius: '1.25rem', width: '100%', maxWidth: '650px', border: '1px solid #CBD5E1', maxHeight: '90vh', overflowY: 'auto', color: '#0F172A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F4C81', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F4C81', margin: 0 }}>PackFLOW Packaging Ltd</h2>
                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Official Tax Invoice & Order Receipt</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#059669' }}>PAID IN FULL</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Receipt #{selectedReceiptOrder.orderNumber}</div>
                <div style={{ fontSize: '0.775rem', color: '#94A3B8' }}>Date: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Billed To Customer:</span>
                <strong>{selectedReceiptOrder.customerName}</strong>
                <div style={{ color: '#64748B' }}>{selectedReceiptOrder.customerEmail}</div>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Packaging Specification:</span>
                <strong>{selectedReceiptOrder.packagingType}</strong>
                <div style={{ color: '#64748B' }}>Dims: {selectedReceiptOrder.dimensions}</div>
              </div>
            </div>

            {/* Receipt Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem' }}>Description</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rUnitPrice = selectedReceiptOrder.unitPrice ?? getUnitPriceForOrder(selectedReceiptOrder);
                  const rQty = Number(selectedReceiptOrder.quantity || 1000);
                  const rSubtotal = selectedReceiptOrder.subtotal ?? (rUnitPrice * rQty);
                  const rServiceCharge = selectedReceiptOrder.serviceCharge ?? (rSubtotal * 0.20);
                  const rTotalPrice = selectedReceiptOrder.totalPrice ?? (rSubtotal + rServiceCharge);
                  const rAdvance = selectedReceiptOrder.advancePayment ?? (rTotalPrice * 0.40);
                  const rRemaining = selectedReceiptOrder.remainingBalance ?? (rTotalPrice * 0.60);

                  return (
                    <>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.65rem' }}>
                          <strong>{selectedReceiptOrder.packagingType}</strong> ({selectedReceiptOrder.printFinish})
                        </td>
                        <td style={{ padding: '0.65rem', textAlign: 'center' }}>{rQty.toLocaleString()}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'right' }}>LKR {rUnitPrice.toFixed(2)}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'right' }}>LKR {rSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td colSpan="3" style={{ padding: '0.5rem 0.65rem', textAlign: 'right', color: '#64748B' }}>Base Subtotal:</td>
                        <td style={{ padding: '0.5rem 0.65rem', textAlign: 'right', fontWeight: '700' }}>LKR {rSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td colSpan="3" style={{ padding: '0.5rem 0.65rem', textAlign: 'right', color: '#D97706' }}>Service Charge (20%):</td>
                        <td style={{ padding: '0.5rem 0.65rem', textAlign: 'right', fontWeight: '700', color: '#D97706' }}>+LKR {rServiceCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #0F4C81' }}>
                        <td colSpan="3" style={{ padding: '0.75rem 0.65rem', textAlign: 'right', fontWeight: '800', fontSize: '0.95rem' }}>Grand Total Price:</td>
                        <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right', fontWeight: '800', fontSize: '1.05rem', color: '#0F172A' }}>LKR {rTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>

            {/* Payments Summary */}
            {(() => {
              const rUnitPrice = selectedReceiptOrder.unitPrice ?? getUnitPriceForOrder(selectedReceiptOrder);
              const rQty = Number(selectedReceiptOrder.quantity || 1000);
              const rSubtotal = selectedReceiptOrder.subtotal ?? (rUnitPrice * rQty);
              const rServiceCharge = selectedReceiptOrder.serviceCharge ?? (rSubtotal * 0.20);
              const rTotalPrice = selectedReceiptOrder.totalPrice ?? (rSubtotal + rServiceCharge);
              const rAdvance = selectedReceiptOrder.advancePayment ?? (rTotalPrice * 0.40);
              const rRemaining = selectedReceiptOrder.remainingBalance ?? (rTotalPrice * 0.60);

              return (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.825rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontWeight: '800', color: '#065F46', textTransform: 'uppercase', fontSize: '0.75rem' }}>Payment Transactions Summary:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                    <span>Initial 40% Advance Payment ({selectedReceiptOrder.paymentMethod || 'Paid'}):</span>
                    <strong>LKR {rAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                    <span>Final 60% Balance Payment ({selectedReceiptOrder.finalPaymentMethod || 'Paid'}):</span>
                    <strong>LKR {rRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ borderTop: '1px dashed #A7F3D0', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#065F46', fontSize: '0.9rem' }}>
                    <span>Balance Remaining:</span>
                    <span>LKR 0.00 (PAID IN FULL)</span>
                  </div>
                </div>
              );
            })()}

            {/* Print & Close Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setSelectedReceiptOrder(null)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Close</button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary"
                style={{ flex: 1.5, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#0284C7', color: '#FFFFFF', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Printer size={16} /> Print / Save PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
