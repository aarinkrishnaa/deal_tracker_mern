import React, { useState } from 'react';
import { Home, Plus, FileText, Receipt, Trash2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import DealEntry from './components/DealEntry';
import Reports from './components/Reports';
import GoodsDelivered from './components/GoodsDelivered';
import DataReset from './components/DataReset';
import DealDetails from './components/DealDetails';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDeal, setSelectedDeal] = useState(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, component: Dashboard },
    { id: 'new-deal', label: 'New Deal', icon: Plus, component: DealEntry },
    { id: 'all-deals', label: 'All Deals', icon: FileText, component: Reports },
    { id: 'goods-delivered', label: 'Goods Delivered', icon: Receipt, component: GoodsDelivered },
    { id: 'reset-data', label: 'Reset Data', icon: Trash2, component: DataReset }
  ];

  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setActiveTab('deal-details');
  };

  const handleBackToDashboard = () => {
    setSelectedDeal(null);
    setActiveTab('dashboard');
  };

  const handleEditDeal = (deal) => {
    setSelectedDeal(deal);
    setActiveTab('new-deal');
  };

  const getActiveComponent = () => {
    if (activeTab === 'deal-details') {
      return <DealDetails 
        deal={selectedDeal} 
        onBack={handleBackToDashboard}
        onEdit={handleEditDeal}
      />;
    }

    const tab = tabs.find(tab => tab.id === activeTab);
    if (!tab) return <Dashboard onDealClick={handleDealClick} />;

    const Component = tab.component;
    if (tab.id === 'dashboard') {
      return <Component onDealClick={handleDealClick} />;
    }
    
    return <Component />;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Deal Tracker</h1>
        </div>
        <nav className="mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'deal-details') {
                    setSelectedDeal(null);
                  }
                }}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {getActiveComponent()}
      </div>
    </div>
  );
};

export default App;