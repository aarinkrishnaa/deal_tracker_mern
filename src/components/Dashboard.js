import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { api } from '../utils/localStorage';
import { format } from 'date-fns';

const Dashboard = ({ onDealClick }) => {
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState({ totalDeals: 0, totalBrokerage: 0, pendingBrokerage: 0 });
  const [filters, setFilters] = useState({ status: '', search: '', dateFrom: '', dateTo: '' });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const dealsData = await api.getDeals();
    const statsData = await api.getDashboardStats();
    setDeals(dealsData);
    setStats(statsData);
    generateAlerts(dealsData);
  };

  const generateAlerts = (dealsData) => {
    const alertsList = [];
    const now = new Date();
    
    // No new deals for 7+ days
    if (dealsData.length > 0) {
      const lastDeal = dealsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const daysSinceLastDeal = Math.floor((now - new Date(lastDeal.created_at)) / (1000 * 60 * 60 * 24));
      if (daysSinceLastDeal >= 7) {
        alertsList.push(`No new deals for ${daysSinceLastDeal} days`);
      }
    }

    // Overdue payments (30+ days)
    const overdueDeals = dealsData.filter(deal => {
      const dealDate = new Date(deal.confirmation_date);
      const daysSinceDeal = Math.floor((now - dealDate) / (1000 * 60 * 60 * 24));
      return deal.payment_status !== 'Paid' && daysSinceDeal >= 30;
    });
    if (overdueDeals.length > 0) {
      alertsList.push(`${overdueDeals.length} overdue payments (30+ days)`);
    }

    setAlerts(alertsList);
  };

  const filteredDeals = deals.filter(deal => {
    if (filters.status && deal.payment_status !== filters.status) return false;
    if (filters.search && !deal.product_name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !deal.supplier_name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !deal.buyer_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.dateFrom && new Date(deal.confirmation_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(deal.confirmation_date) > new Date(filters.dateTo)) return false;
    return true;
  });

  const updatePaymentStatus = async (dealId, status) => {
    await api.updateDealPayment(dealId, status);
    loadData();
  };

  const deleteDeal = async (dealId, event) => {
    event.stopPropagation(); // Prevent row click when deleting
    if (window.confirm('Are you sure you want to delete this deal?')) {
      await api.deleteDeal(dealId);
      loadData();
    }
  };

  const handleDealClick = (deal) => {
    if (onDealClick) {
      onDealClick(deal);
    }
  };

  const handleStatusChange = (dealId, status, event) => {
    event.stopPropagation(); // Prevent row click when changing status
    updatePaymentStatus(dealId, status);
  };

  const exportToCSV = () => {
    const headers = ['Sr No', 'Date', 'Deal ID', 'Party Name', 'Supplier', 'Product', 'Bags', 'Ex Mill Rate', 'Amount', 'Brokerage Amount', 'Status'];
    const csvData = filteredDeals.map((deal, index) => [
      index + 1,
      format(new Date(deal.confirmation_date), 'dd/MM/yyyy'),
      deal.deal_id,
      deal.buyer_name,
      deal.supplier_name,
      deal.product_name,
      deal.quantity,
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
    a.download = `Deal_Transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const thisMonthDeals = deals.filter(deal => {
    const dealDate = new Date(deal.confirmation_date);
    const now = new Date();
    return dealDate.getMonth() === now.getMonth() && dealDate.getFullYear() === now.getFullYear();
  });

  const unpaidDeals = deals.filter(deal => deal.payment_status === 'Pending');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md" onClick={() => setFilters({})}>
          <h3 className="text-sm font-medium text-gray-500">Total Deals</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalDeals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md" onClick={() => setFilters({ status: 'Pending' })}>
          <h3 className="text-sm font-medium text-gray-500">Unpaid Deals</h3>
          <p className="text-2xl font-bold text-orange-600">{unpaidDeals.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md" onClick={() => {
          const now = new Date();
          setFilters({ dateFrom: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01` });
        }}>
          <h3 className="text-sm font-medium text-gray-500">This Month Deals</h3>
          <p className="text-2xl font-bold text-blue-600">{thisMonthDeals.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md" onClick={() => setFilters({})}>
          <h3 className="text-sm font-medium text-gray-500">Total Brokerage</h3>
          <p className="text-2xl font-bold text-green-600">₹{stats.totalBrokerage.toLocaleString()}</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-sm font-medium text-orange-800">Alerts</h3>
          </div>
          <ul className="mt-2 text-sm text-orange-700">
            {alerts.map((alert, index) => (
              <li key={index}>• {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Recent Deals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Deals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brokerage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeals.map((deal) => (
                <tr 
                  key={deal.deal_id} 
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleDealClick(deal)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(deal.confirmation_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.supplier_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deal.buyer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{deal.total_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{deal.brokerage_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {deal.payment_status === 'Pending' ? (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Pending
                      </span>
                    ) : (
                      <select
                        value={deal.payment_status}
                        onChange={(e) => handleStatusChange(deal.deal_id, e.target.value, e)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="Delivered">Delivered</option>
                        <option value="Paid">Paid</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => deleteDeal(deal.deal_id, e)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete deal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default Dashboard;