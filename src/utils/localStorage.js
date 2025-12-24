// Indian numbering system formatting (1,00,000 format)
export const formatIndianCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Real localStorage API implementation
const STORAGE_KEYS = {
  DEALS: 'deals',
  SUPPLIERS: 'suppliers',
  BUYERS: 'buyers',
  COUNTERS: 'counters',
  DELIVERIES: 'deliveries'
};

// Initialize counters if not exists
const initCounters = () => {
  const counters = localStorage.getItem(STORAGE_KEYS.COUNTERS);
  if (!counters) {
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify({
      deal_id: 1,
      supplier_id: 1,
      buyer_id: 1,
      delivery_id: 1
    }));
  }
};

// Get next ID and increment counter
const getNextId = (type) => {
  initCounters();
  const counters = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUNTERS));
  const nextId = counters[type];
  counters[type] = nextId + 1;
  localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
  return nextId;
};

// Generic storage functions
const getFromStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // Reset all data
  resetAllData: () => {
    return new Promise((resolve) => {
      localStorage.removeItem(STORAGE_KEYS.DEALS);
      localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
      localStorage.removeItem(STORAGE_KEYS.BUYERS);
      localStorage.removeItem(STORAGE_KEYS.COUNTERS);
      resolve();
    });
  },

  // Suppliers
  getSuppliers: () => {
    return new Promise((resolve) => {
      resolve(getFromStorage(STORAGE_KEYS.SUPPLIERS));
    });
  },

  addSupplier: (supplier) => {
    return new Promise((resolve) => {
      const suppliers = getFromStorage(STORAGE_KEYS.SUPPLIERS);
      const newSupplier = {
        ...supplier,
        supplier_id: getNextId('supplier_id'),
        created_at: new Date().toISOString()
      };
      suppliers.push(newSupplier);
      saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
      resolve({ lastID: newSupplier.supplier_id });
    });
  },

  // Buyers
  getBuyers: () => {
    return new Promise((resolve) => {
      resolve(getFromStorage(STORAGE_KEYS.BUYERS));
    });
  },

  addBuyer: (buyer) => {
    return new Promise((resolve) => {
      const buyers = getFromStorage(STORAGE_KEYS.BUYERS);
      const newBuyer = {
        ...buyer,
        buyer_id: getNextId('buyer_id'),
        created_at: new Date().toISOString()
      };
      buyers.push(newBuyer);
      saveToStorage(STORAGE_KEYS.BUYERS, buyers);
      resolve({ lastID: newBuyer.buyer_id });
    });
  },

  // Deals
  getDeals: () => {
    return new Promise((resolve) => {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const suppliers = getFromStorage(STORAGE_KEYS.SUPPLIERS);
      const buyers = getFromStorage(STORAGE_KEYS.BUYERS);
      
      const dealsWithNames = deals.map(deal => {
        const supplier = suppliers.find(s => s.supplier_id === deal.supplier_id);
        const buyer = buyers.find(b => b.buyer_id === deal.buyer_id);
        return {
          ...deal,
          supplier_name: supplier ? supplier.name : 'Unknown',
          buyer_name: buyer ? buyer.name : 'Unknown'
        };
      });
      
      resolve(dealsWithNames);
    });
  },

  addDeal: (deal) => {
    return new Promise((resolve) => {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const newDeal = {
        ...deal,
        deal_id: getNextId('deal_id'),
        created_at: new Date().toISOString()
      };
      deals.push(newDeal);
      saveToStorage(STORAGE_KEYS.DEALS, deals);
      resolve({ lastID: newDeal.deal_id });
    });
  },

  updateDeal: (updatedDeal) => {
    return new Promise((resolve) => {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const index = deals.findIndex(d => d.deal_id === updatedDeal.deal_id);
      if (index !== -1) {
        deals[index] = updatedDeal;
        saveToStorage(STORAGE_KEYS.DEALS, deals);
      }
      resolve();
    });
  },

  deleteDeal: (dealId) => {
    return new Promise((resolve) => {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const filteredDeals = deals.filter(d => d.deal_id !== dealId);
      saveToStorage(STORAGE_KEYS.DEALS, filteredDeals);
      resolve();
    });
  },

  updateDealPayment: (dealId, status) => {
    return new Promise((resolve) => {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const deal = deals.find(d => d.deal_id === dealId);
      if (deal) {
        deal.payment_status = status;
        saveToStorage(STORAGE_KEYS.DEALS, deals);
      }
      resolve();
    });
  },

  // Dashboard stats
  getDashboardStats: () => {
    return new Promise((resolve) => {
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const totalDeals = deals.length;
      const totalBrokerage = deals.reduce((sum, deal) => sum + (deal.brokerage_amount || 0), 0);
      const pendingBrokerage = deals
        .filter(deal => deal.payment_status === 'Pending')
        .reduce((sum, deal) => sum + (deal.brokerage_amount || 0), 0);
      
      resolve({
        totalDeals,
        totalBrokerage,
        pendingBrokerage
      });
    });
  },

  // Deliveries
  addDelivery: (delivery) => {
    return new Promise((resolve) => {
      const deliveries = getFromStorage(STORAGE_KEYS.DELIVERIES);
      const newDelivery = {
        ...delivery,
        delivery_id: getNextId('delivery_id'),
        created_at: new Date().toISOString()
      };
      deliveries.push(newDelivery);
      saveToStorage(STORAGE_KEYS.DELIVERIES, deliveries);
      resolve({ lastID: newDelivery.delivery_id });
    });
  },

  getDeliveries: (params = {}) => {
    return new Promise((resolve) => {
      let deliveries = getFromStorage(STORAGE_KEYS.DELIVERIES);
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const suppliers = getFromStorage(STORAGE_KEYS.SUPPLIERS);
      const buyers = getFromStorage(STORAGE_KEYS.BUYERS);
      
      // Join with deal, supplier, and buyer data
      const deliveriesWithDetails = deliveries.map(delivery => {
        const deal = deals.find(d => d.deal_id === delivery.deal_id);
        const supplier = suppliers.find(s => s.supplier_id === deal?.supplier_id);
        const buyer = buyers.find(b => b.buyer_id === deal?.buyer_id);
        
        return {
          ...delivery,
          deal: deal || {},
          supplier_name: supplier?.name || 'Unknown',
          buyer_name: buyer?.name || 'Unknown',
          product_name: deal?.product_name || 'Unknown'
        };
      });

      // Apply filters
      if (params.dealId) {
        deliveriesWithDetails = deliveriesWithDetails.filter(d => d.deal_id === params.dealId);
      }
      if (params.status) {
        deliveriesWithDetails = deliveriesWithDetails.filter(d => d.payment_status === params.status);
      }
      if (params.dateFrom) {
        deliveriesWithDetails = deliveriesWithDetails.filter(d => new Date(d.delivery_date) >= new Date(params.dateFrom));
      }
      if (params.dateTo) {
        deliveriesWithDetails = deliveriesWithDetails.filter(d => new Date(d.delivery_date) <= new Date(params.dateTo));
      }

      resolve(deliveriesWithDetails);
    });
  },

  getDeliverySummary: (dealId) => {
    return new Promise((resolve) => {
      const deliveries = getFromStorage(STORAGE_KEYS.DELIVERIES);
      const dealDeliveries = deliveries.filter(d => d.deal_id === parseInt(dealId));
      
      const totalBagsDelivered = dealDeliveries.reduce((sum, d) => sum + (d.bags_delivered || 0), 0);
      const totalAmount = dealDeliveries.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalBrokerage = dealDeliveries.reduce((sum, d) => sum + (d.brokerage || 0), 0);
      
      // Get deal details
      const deals = getFromStorage(STORAGE_KEYS.DEALS);
      const deal = deals.find(d => d.deal_id === parseInt(dealId));
      
      // Ensure we have a valid deal and quantity
      const dealQuantity = deal ? parseFloat(deal.quantity) : 0;
      const remainingBags = dealQuantity - totalBagsDelivered;
      
      // Determine payment status
      let paymentStatus = 'Pending';
      if (dealDeliveries.length === 0) {
        paymentStatus = 'Pending';
      } else if (dealDeliveries.every(d => d.payment_status === 'Paid')) {
        paymentStatus = 'Paid';
      } else if (dealDeliveries.some(d => d.payment_status === 'Paid')) {
        paymentStatus = 'Partial';
      }

      resolve({
        dealId: parseInt(dealId),
        totalBagsDelivered,
        remainingBags,
        totalAmount,
        totalBrokerage,
        paymentStatus,
        deliveries: dealDeliveries,
        deal: deal || {}
      });
    });
  },

  updateDeliveryPayment: (deliveryId, status) => {
    return new Promise((resolve) => {
      const deliveries = getFromStorage(STORAGE_KEYS.DELIVERIES);
      const delivery = deliveries.find(d => d.delivery_id === deliveryId);
      if (delivery) {
        delivery.payment_status = status;
        saveToStorage(STORAGE_KEYS.DELIVERIES, deliveries);
      }
      resolve();
    });
  },

  deleteDelivery: (deliveryId) => {
    return new Promise((resolve) => {
      const deliveries = getFromStorage(STORAGE_KEYS.DELIVERIES);
      const filteredDeliveries = deliveries.filter(d => d.delivery_id !== deliveryId);
      saveToStorage(STORAGE_KEYS.DELIVERIES, filteredDeliveries);
      resolve();
    });
  }
};