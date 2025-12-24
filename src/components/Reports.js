import React, { useState, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';
import { api } from '../utils/localStorage';
import { format } from 'date-fns';

const Reports = () => {
  const [deals, setDeals] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supplier: '',
    buyer: '',
    status: ''
  });

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    const dealsData = await api.getDeals();
    setDeals(dealsData);
  };

  const filteredDeals = deals.filter(deal => {
    if (filters.startDate && new Date(deal.confirmation_date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(deal.confirmation_date) > new Date(filters.endDate)) return false;
    if (filters.supplier && !deal.supplier_name.toLowerCase().includes(filters.supplier.toLowerCase())) return false;
    if (filters.buyer && !deal.buyer_name.toLowerCase().includes(filters.buyer.toLowerCase())) return false;
    if (filters.status && deal.payment_status !== filters.status) return false;
    return true;
  });

  const summary = {
    totalDeals: filteredDeals.length,
    totalAmount: filteredDeals.reduce((sum, deal) => sum + (deal.total_amount || 0), 0),
    totalBrokerage: filteredDeals.reduce((sum, deal) => sum + (deal.brokerage_amount || 0), 0),
    totalGST: filteredDeals.reduce((sum, deal) => sum + (deal.gst_amount || 0), 0)
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      supplier: '',
      buyer: '',
      status: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Sr No', 'Date', 'Deal ID', 'Supplier', 'Buyer', 'Product', 'Quantity', 'Unit', 'Rate', 'Amount', 'Brokerage', 'Status'];
    const csvData = filteredDeals.map((deal, index) => [
      index + 1,
      format(new Date(deal.confirmation_date), 'dd/MM/yyyy'),
      deal.deal_id,
      deal.supplier_name,
      deal.buyer_name,
      deal.product_name,
      deal.quantity,
      deal.unit,
      deal.rate,
      deal.total_amount,
      deal.brokerage_amount,
      deal.payment_status
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `All_Deals_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Deals Report</h1>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Search Supplier"
            value={filters.supplier}
            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="text"
            placeholder="Search Buyer"
            value={filters.buyer}
            onChange={(e) => setFilters({ ...filters, buyer: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Delivered">Delivered</option>
            <option value="Paid">Paid</option>
          </select>
          <button
            onClick={clearFilters}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Deals</h3>
          <p className="text-2xl font-bold text-gray-900">{summary.totalDeals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
          <p className="text-2xl font-bold text-blue-600">₹{summary.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Brokerage</h3>
          <p className="text-2xl font-bold text-green-600">₹{summary.totalBrokerage.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total GST</h3>
          <p className="text-2xl font-bold text-orange-600">₹{summary.totalGST.toLocaleString()}</p>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">All Deals ({filteredDeals.length})</h3>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brokerage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeals.map((deal) => (
                <tr key={deal.deal_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(deal.confirmation_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.deal_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.supplier_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.buyer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.quantity} {deal.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{deal.rate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{deal.total_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{deal.brokerage_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      deal.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                      deal.payment_status === 'Delivered' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {deal.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;