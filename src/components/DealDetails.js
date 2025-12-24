import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Package, CheckCircle, AlertCircle, Calendar, User, Building2, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { api, formatIndianCurrency } from '../utils/localStorage';
import { format } from 'date-fns';

const DealDetails = ({ deal, onBack, onEdit }) => {
  const [deliverySummary, setDeliverySummary] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (deal) {
      loadDeliveryData();
    }
  }, [deal]);

  const loadDeliveryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const summaryData = await api.getDeliverySummary(deal.deal_id);
      setDeliverySummary(summaryData);
      setDeliveries(summaryData.deliveries);
    } catch (err) {
      setError('Failed to load delivery data');
      console.error('Error loading delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (deliveryId, status) => {
    try {
      await api.updateDeliveryPayment(deliveryId, status);
      loadDeliveryData();
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Delivered': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getDealStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Delivered': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Confirmed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deal details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="border-l border-gray-300 h-8 mx-4"></div>
              <h1 className="text-xl font-semibold text-gray-900">Deal Details</h1>
            </div>
            <button
              onClick={() => onEdit(deal)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Deal
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Structured Deal Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Deal #{deal.deal_id}</h2>
          </div>
          <div className="p-4">
            {/* First Row - Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Supplier</span>
                <span className="text-sm font-semibold text-gray-900">{deal.supplier_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Buyer</span>
                <span className="text-sm font-semibold text-gray-900">{deal.buyer_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Product</span>
                <span className="text-sm font-semibold text-gray-900">{deal.product_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</span>
                <span className="text-sm font-semibold text-gray-900">
                  {format(new Date(deal.confirmation_date), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
            
            {/* Second Row - Deal Details */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity</span>
                <span className="text-sm font-semibold text-gray-900">{deal.quantity} {deal.unit}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rate</span>
                <span className="text-sm font-semibold text-gray-900">₹{deal.rate} {deal.calculation_mode === 'per_kg' ? '/kg' : '/unit'}</span>
              </div>
              {deal.calculation_mode === 'per_kg' && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Weight per Unit</span>
                  <span className="text-sm font-semibold text-gray-900">{deal.kg_per_unit} kg per {deal.unit}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial and Delivery Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Financial Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Financial Breakdown</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Base Amount</span>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(deal.amount_without_gst || 0)}</span>
                </div>
                {deal.calculation_mode === 'per_kg' && (
                  <p className="text-xs text-gray-500 pl-2">
                    {deal.quantity} {deal.unit} × {deal.kg_per_unit}kg × ₹{deal.rate}
                  </p>
                )}
                
                {deal.discount_percent > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Cash Discount ({deal.discount_percent}%)</span>
                    <span className="font-semibold text-red-600">
                      -{formatIndianCurrency(deal.discount_amount || 0)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Amount (after discount)</span>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(deal.amount_after_discount || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">GST ({deal.gst_percent}%)</span>
                  <span className="font-semibold text-gray-900">{formatIndianCurrency(deal.gst_amount || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-gray-900 font-semibold">Total Amount</span>
                  <span className="font-bold text-lg text-gray-900">{formatIndianCurrency(deal.total_amount || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                  <span className="text-green-800 font-semibold text-sm">Your Brokerage</span>
                  <span className="font-bold text-green-600">{formatIndianCurrency(deal.brokerage_amount || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Delivery Summary</h2>
            </div>
            <div className="p-4">
              {deliverySummary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Total Quantity</p>
                      <p className="font-semibold text-gray-900">{deal.quantity} {deal.unit}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Delivered</p>
                      <p className="font-semibold text-blue-600">{deliverySummary.totalBagsDelivered}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Remaining</p>
                    <p className={`font-semibold ${
                      deliverySummary.remainingBags === 0 ? 'text-green-600' : 
                      deliverySummary.remainingBags < 0 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {deliverySummary.remainingBags < 0 ? 
                        `${deliverySummary.remainingBags} (Over-delivered)` : 
                        deliverySummary.remainingBags
                      }
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Delivery Progress</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {deal.quantity > 0 ? Math.round((deliverySummary.totalBagsDelivered / deal.quantity) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          deliverySummary.remainingBags === 0 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${deal.quantity > 0 ? (deliverySummary.totalBagsDelivered / deal.quantity) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Total Delivered Amount</p>
                      <p className="font-semibold text-gray-900">{formatIndianCurrency(deliverySummary.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Total Brokerage</p>
                      <p className="font-semibold text-green-600">{formatIndianCurrency(deliverySummary.totalBrokerage)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Payment Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(deliverySummary.paymentStatus)}`}>
                      {deliverySummary.paymentStatus}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No delivery data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery History */}
        {deliveries && deliveries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Delivery History</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {deliveries.length} entries
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brokerage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveries
                    .sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date))
                    .map((delivery, index) => (
                      <tr key={delivery.delivery_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(delivery.delivery_date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{delivery.bill_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {delivery.bags_delivered}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatIndianCurrency(delivery.total)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatIndianCurrency(delivery.brokerage)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {delivery.payment_status === 'Paid' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </span>
                          ) : (
                            <select
                              value={delivery.payment_status}
                              onChange={(e) => updatePaymentStatus(delivery.delivery_id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-orange-50 text-orange-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Paid">Mark as Paid</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State for No Deliveries */}
        {deliveries && deliveries.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Delivery History</h2>
            </div>
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No Deliveries Yet</h3>
              <p className="text-gray-500 text-sm">This deal hasn't had any deliveries recorded yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealDetails;