import React, { useState, useEffect, useMemo } from 'react';
import { Package, CheckCircle, Download, Calendar, AlertCircle, Plus, Save, RefreshCw, Trash2 } from 'lucide-react';
import { api, formatIndianCurrency } from '../utils/localStorage';
import { format } from 'date-fns';

const GoodsDelivered = () => {
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState('');
  const [summary, setSummary] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    delivery_date: new Date().toISOString().split('T')[0],
    bill_number: '',
    bags_delivered: '',
    buyer_name: '',
    gst_percent: 5,
    payment_status: 'Pending'
  });

  const [calculations, setCalculations] = useState({
    amount: 0,
    gst_amount: 0,
    total: 0,
    brokerage: 0
  });

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    if (selectedDealId) {
      loadDeliverySummary();
    }
  }, [selectedDealId]);

  useEffect(() => {
    calculateAmounts();
  }, [form, summary]);

  const loadDeals = async () => {
    const dealsData = await api.getDeals();
    console.log('Loaded Deals:', dealsData); // Debug log
    // Show all deals for delivery tracking, regardless of status
    // This allows tracking deliveries even for completed deals
    setDeals(dealsData);
  };

  const loadDeliverySummary = async () => {
    if (!selectedDealId) return;
    
    const summaryData = await api.getDeliverySummary(selectedDealId);
    console.log('Delivery Summary Data:', summaryData); // Debug log
    
    // Ensure we have valid data
    if (summaryData && summaryData.deal && summaryData.deal.quantity) {
      setSummary(summaryData);
      setDeliveries(summaryData.deliveries);
    } else {
      console.error('Invalid deal data:', summaryData);
      alert('Error loading deal data. Please try again.');
    }
  };

  const calculateAmounts = () => {
    if (!summary || !form.bags_delivered) {
      setCalculations({ amount: 0, gst_amount: 0, total: 0, brokerage: 0 });
      return;
    }

    const deal = summary.deal;
    const bagsDelivered = parseFloat(form.bags_delivered) || 0;
    
    // Calculate amount based on deal's calculation mode
    let amount = 0;
    if (deal.calculation_mode === 'per_kg') {
      const totalKg = bagsDelivered * (deal.kg_per_unit || 50);
      amount = totalKg * (deal.rate || 0);
    } else {
      amount = bagsDelivered * (deal.rate || 0);
    }

    // Apply discount
    const discountAmount = (amount * (deal.discount_percent || 0)) / 100;
    amount = amount - discountAmount;

    // Calculate GST
    const gstAmount = (amount * (form.gst_percent || 0)) / 100;
    const total = amount + gstAmount;

    // Calculate brokerage
    let brokerage = 0;
    if (deal.brokerage_mode === 'per_bag') {
      brokerage = bagsDelivered * (deal.brokerage_per_bag || 0);
    } else {
      brokerage = (amount * (deal.brokerage_percent || 0)) / 100;
    }

    setCalculations({
      amount,
      gst_amount: gstAmount,
      total,
      brokerage
    });
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDealSelect = (dealId) => {
    setSelectedDealId(dealId);
    const selectedDeal = deals.find(d => d.deal_id === parseInt(dealId));
    if (selectedDeal) {
      setForm(prev => ({
        ...prev,
        buyer_name: selectedDeal.buyer_name,
        gst_percent: selectedDeal.gst_percent || 5
      }));
    }
  };

  const saveDelivery = async () => {
    if (!selectedDealId || !form.bags_delivered || !form.bill_number) {
      alert('Please fill all required fields');
      return;
    }

    const bagsToDeliver = parseFloat(form.bags_delivered);
    
    // Allow over-delivery but show warning
    if (bagsToDeliver > summary.remainingBags && summary.remainingBags > 0) {
      const confirmOverDelivery = window.confirm(
        `Warning: You are delivering ${bagsToDeliver} bags, but only ${summary.remainingBags} bags remain in the original deal.\n\nThis will result in over-delivery. Do you want to continue?`
      );
      if (!confirmOverDelivery) return;
    }
    
    // Prevent delivery if no bags remaining and trying to deliver more than 0
    if (summary.remainingBags <= 0 && bagsToDeliver > 0) {
      const confirmOverDelivery = window.confirm(
        `This deal is already complete (0 bags remaining). You are trying to deliver ${bagsToDeliver} bags.\n\nThis will be recorded as over-delivery. Do you want to continue?`
      );
      if (!confirmOverDelivery) return;
    }

    const deliveryData = {
      deal_id: parseInt(selectedDealId),
      delivery_date: form.delivery_date,
      bill_number: form.bill_number,
      bags_delivered: parseFloat(form.bags_delivered),
      buyer_name: form.buyer_name,
      gst_percent: parseFloat(form.gst_percent),
      amount: calculations.amount,
      gst_amount: calculations.gst_amount,
      total: calculations.total,
      brokerage: calculations.brokerage,
      payment_status: form.payment_status
    };

    await api.addDelivery(deliveryData);
    
    // Check if all bags are delivered (including over-delivery)
    const newRemainingBags = summary.remainingBags - parseFloat(form.bags_delivered);
    if (newRemainingBags <= 0) {
      // Update deal status to delivered
      await api.updateDealPayment(selectedDealId, 'Delivered');
    }

    // Reset form and reload data
    resetForm();
    loadDeliverySummary();
    loadDeals();
    alert('Delivery saved successfully!');
  };

  const resetForm = () => {
    setForm({
      delivery_date: new Date().toISOString().split('T')[0],
      bill_number: '',
      bags_delivered: '',
      buyer_name: summary?.deal?.buyer_name || '',
      gst_percent: summary?.deal?.gst_percent || 5,
      payment_status: 'Pending'
    });
    setShowForm(false);
  };

  const updateDeliveryPayment = async (deliveryId, status) => {
    await api.updateDeliveryPayment(deliveryId, status);
    loadDeliverySummary();
  };

  const deleteDelivery = async (deliveryId) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      await api.deleteDelivery(deliveryId);
      loadDeliverySummary();
      loadDeals();
    }
  };

  const exportDeliveries = () => {
    if (!summary || deliveries.length === 0) {
      alert('No deliveries to export');
      return;
    }

    const headers = ['Sr No', 'Date', 'Bill No', 'Bags', 'Amount', 'GST', 'Total', 'Brokerage', 'Status'];
    const csvData = deliveries.map((delivery, index) => [
      index + 1,
      format(new Date(delivery.delivery_date), 'dd/MM/yyyy'),
      delivery.bill_number,
      delivery.bags_delivered,
      delivery.amount,
      delivery.gst_amount,
      delivery.total,
      delivery.brokerage,
      delivery.payment_status
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deliveries_Deal_${selectedDealId}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const selectedDeal = deals.find(d => d.deal_id === parseInt(selectedDealId));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Goods Delivered</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Selection & Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Select Deal</h2>
          <select
              value={selectedDealId}
              onChange={(e) => handleDealSelect(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a deal to track deliveries</option>
              {deals.map(deal => (
                <option key={deal.deal_id} value={deal.deal_id}>
                  {deal.deal_id} - {deal.supplier_name} → {deal.buyer_name} @ ₹{deal.rate} ({deal.quantity} {deal.unit})
                </option>
              ))}
          </select>
          </div>

          {/* Delivery Entry Form */}
          {selectedDealId && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Delivery Entry</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Hide Form' : 'Add Delivery'}
                  </button>
                  {deliveries.length > 0 && (
          <button
                      onClick={exportDeliveries}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
                  )}
                </div>
              </div>

              {showForm && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                      <input
                        type="date"
                        value={form.delivery_date}
                        onChange={(e) => handleFormChange('delivery_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number *</label>
                      <input
                        type="text"
                        value={form.bill_number}
                        onChange={(e) => handleFormChange('bill_number', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Enter bill/invoice number"
                      />
        </div>
      </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bags Delivered *</label>
                      <input
                        type="number"
                        value={form.bags_delivered}
                        onChange={(e) => handleFormChange('bags_delivered', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Enter number of bags"
                        max={summary?.remainingBags || ''}
                      />
                      {summary && (
                        <div className="mt-1">
                          <p className={`text-sm ${
                            summary.remainingBags === 0 ? 'text-green-600' : 
                            summary.remainingBags < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            Remaining: {summary.remainingBags < 0 ? `${summary.remainingBags} (Over-delivered)` : summary.remainingBags} bags
                          </p>
                          {summary.remainingBags <= 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ This deal is complete. Adding more bags will be recorded as over-delivery.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                      <input
                        type="text"
                        value={form.buyer_name}
                        onChange={(e) => handleFormChange('buyer_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Buyer name"
                      />
            </div>
          </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                      <input
                        type="number"
                        value={form.gst_percent}
                        onChange={(e) => handleFormChange('gst_percent', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        step="0.01"
                      />
        </div>
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select
                        value={form.payment_status}
                        onChange={(e) => handleFormChange('payment_status', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
            </div>
          </div>

                  {/* Real-time Calculations */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Real-time Calculations</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">
                          {formatIndianCurrency(calculations.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST Amount:</span>
                        <span className="font-medium">
                          {formatIndianCurrency(calculations.gst_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">
                          {formatIndianCurrency(calculations.total)}
                        </span>
        </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Brokerage:</span>
                        <span className="font-medium text-green-600">
                          {formatIndianCurrency(calculations.brokerage)}
                        </span>
        </div>
        </div>
      </div>

                  {/* Form Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={saveDelivery}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Delivery
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </button>
                  </div>
              </div>
              )}
            </div>
          )}

          {/* Delivery Timeline (compact rows) */}
          {selectedDealId && deliveries.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Delivery Timeline</h3>
                <p className="text-xs text-gray-500 mt-0.5">Step-by-step deliveries</p>
              </div>
              <div className="divide-y divide-gray-100">
                {deliveries
                  .sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date))
                  .map((delivery, index) => {
                    const cumulativeDelivered = deliveries
                      .filter(d => new Date(d.delivery_date) <= new Date(delivery.delivery_date))
                      .reduce((sum, d) => sum + d.bags_delivered, 0);
                    const remainingAfterThis = summary.deal.quantity - cumulativeDelivered;
                    const isComplete = remainingAfterThis === 0;

                    return (
                      <div key={delivery.delivery_id} className="px-4 py-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold ${
                              isComplete ? 'bg-green-500' : 'bg-blue-500'
                            }`}>{index + 1}</span>
                            <span className="text-gray-900 font-medium truncate">Delivery #{index + 1}</span>
                            <span className="text-gray-500">• {format(new Date(delivery.delivery_date), 'dd MMM yyyy')}</span>
            </div>
                          <div className="flex items-center gap-2">
                            {delivery.payment_status === 'Paid' ? (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 rounded-full">✓ Paid</span>
                            ) : (
                              <select
                                value={delivery.payment_status}
                                onChange={(e) => updateDeliveryPayment(delivery.delivery_id, e.target.value)}
                                className="text-[10px] border border-gray-300 rounded px-1.5 py-0.5 bg-orange-50 text-orange-800"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Mark as Paid</option>
                              </select>
                            )}
                            <button
                              onClick={() => deleteDelivery(delivery.delivery_id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete delivery"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1">
                          <div className="text-gray-500">Bags</div>
                          <div className="text-gray-900 font-semibold">{delivery.bags_delivered}</div>
                          <div className="text-gray-500">Bill</div>
                          <div className="text-gray-900 font-medium truncate" title={delivery.bill_number}>{delivery.bill_number}</div>
                          <div className="text-gray-500">Total</div>
                          <div className="text-gray-900 font-medium">
                            {formatIndianCurrency(delivery.total)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                            <span>Remaining after this</span>
                            <span className={`${isComplete ? 'text-green-600' : 'text-orange-600'} font-medium`}>{remainingAfterThis} bags</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`${isComplete ? 'bg-green-500' : 'bg-blue-500'} h-1.5 rounded-full`}
                              style={{ width: `${summary.deal.quantity > 0 ? (cumulativeDelivered / summary.deal.quantity) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
        </div>
      )}

          {/* Detailed Delivery History Table (Compact) */}
          {selectedDealId && deliveries.length > 0 && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Detailed History</h3>
                <p className="text-xs text-gray-500 mt-0.5">Complete delivery records</p>
        </div>
        <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">#</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Bill</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Bags</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Cum.</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Rem.</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Brokerage</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {deliveries
                      .sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date))
                      .map((delivery, index) => {
                        const cumulativeDelivered = deliveries
                          .filter(d => new Date(d.delivery_date) <= new Date(delivery.delivery_date))
                          .reduce((sum, d) => sum + d.bags_delivered, 0);
                        const remainingAfterThis = summary.deal.quantity - cumulativeDelivered;
                
                return (
                          <tr key={delivery.delivery_id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                              #{index + 1}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                              {format(new Date(delivery.delivery_date), 'dd/MM/yy')}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{delivery.bill_number}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-blue-600">
                              {delivery.bags_delivered}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                              {cumulativeDelivered}
                            </td>
                            <td className={`px-3 py-2 whitespace-nowrap text-xs font-medium ${
                              remainingAfterThis === 0 ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {remainingAfterThis}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                              {formatIndianCurrency(delivery.total)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                              {formatIndianCurrency(delivery.brokerage)}
                    </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {delivery.payment_status === 'Paid' ? (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 rounded-full">
                          Paid
                        </span>
                      ) : (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-800 rounded-full">
                                  Pending
                                </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
              </div>
            </div>
          )}
        </div>

        {/* Summary Panel (compact) */}
        {selectedDealId && summary && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Delivery Summary</h2>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                  summary.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                  summary.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {summary.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="text-gray-500">Deal ID</div>
                <div className="text-gray-900 font-medium">{summary.dealId}</div>
                <div className="text-gray-500">Product</div>
                <div className="text-gray-900 font-medium truncate" title={summary.deal.product_name}>{summary.deal.product_name}</div>
                <div className="text-gray-500">Total Qty</div>
                <div className="text-gray-900 font-medium">{summary.deal.quantity} {summary.deal.unit}</div>
                <div className="text-gray-500">Delivered</div>
                <div className="text-blue-600 font-semibold">{summary.totalBagsDelivered}</div>
                <div className="text-gray-500">Remaining</div>
                <div className={`${summary.remainingBags === 0 ? 'text-green-600' : summary.remainingBags < 0 ? 'text-red-600' : 'text-orange-600'} font-medium`}>
                  {summary.remainingBags < 0 ? `${summary.remainingBags} (Over-delivered)` : summary.remainingBags}
                </div>
                <div className="text-gray-500">Amount</div>
                <div className="text-gray-900 font-medium">
                  {formatIndianCurrency(summary.totalAmount)}
                </div>
                <div className="text-gray-500">Brokerage</div>
                <div className="text-green-600 font-medium">
                  {formatIndianCurrency(summary.totalBrokerage)}
                </div>
        </div>
        
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{summary.deal.quantity > 0 ? Math.round((summary.totalBagsDelivered / summary.deal.quantity) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${summary.remainingBags === 0 ? 'bg-green-500' : 'bg-blue-500'} h-2 rounded-full`}
                    style={{ width: `${summary.deal.quantity > 0 ? (summary.totalBagsDelivered / summary.deal.quantity) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!selectedDealId && (
          <div className="lg:col-span-3">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Deal Selected</h3>
              <p className="text-gray-500">Select a deal from the dropdown to start tracking deliveries.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoodsDelivered;