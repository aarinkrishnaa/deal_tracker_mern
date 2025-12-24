import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Download, FileText, X } from 'lucide-react';
import { api } from '../utils/localStorage';

const DealEntry = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_no: '' });
  const [newBuyer, setNewBuyer] = useState({ name: '', contact_no: '' });

  const [formData, setFormData] = useState({
    supplier_id: '',
    buyer_id: '',
    confirmation_date: new Date().toISOString().split('T')[0],
    product_name: '',
    calculation_mode: 'per_kg',
    rate: '',
    quantity: '',
    unit: 'bags',
    kg_per_unit: 50,
    discount_percent: 0,
    brokerage_mode: 'percentage',
    brokerage_percent: 0.5,
    brokerage_per_bag: '',
    gst_percent: 5,
    payment_status: 'Pending'
  });

  const [calculations, setCalculations] = useState({
    amount_without_gst: 0,
    discount_amount: 0,
    amount_after_discount: 0,
    gst_amount: 0,
    total_amount: 0,
    brokerage_amount: 0,
    total_kg: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [formData]);

  const loadData = async () => {
    const suppliersData = await api.getSuppliers();
    const buyersData = await api.getBuyers();
    setSuppliers(suppliersData);
    setBuyers(buyersData);
  };

  const calculateAmounts = () => {
    const { rate, quantity, kg_per_unit, discount_percent, gst_percent, brokerage_percent, brokerage_per_bag, calculation_mode, brokerage_mode } = formData;
    
    let amount_without_gst = 0;
    let total_kg = 0;

    if (calculation_mode === 'per_kg') {
      total_kg = parseFloat(quantity || 0) * parseFloat(kg_per_unit || 0);
      amount_without_gst = parseFloat(rate || 0) * total_kg;
    } else {
      amount_without_gst = parseFloat(rate || 0) * parseFloat(quantity || 0);
    }

    const discount_amount = (amount_without_gst * parseFloat(discount_percent || 0)) / 100;
    const amount_after_discount = amount_without_gst - discount_amount;
    const gst_amount = (amount_after_discount * parseFloat(gst_percent || 0)) / 100;
    const total_amount = amount_after_discount + gst_amount;

    let brokerage_amount = 0;
    if (brokerage_mode === 'per_bag') {
      brokerage_amount = parseFloat(quantity || 0) * parseFloat(brokerage_per_bag || 0);
    } else {
      brokerage_amount = (amount_after_discount * parseFloat(brokerage_percent || 0)) / 100;
    }

    setCalculations({
      amount_without_gst,
      discount_amount,
      amount_after_discount,
      gst_amount,
      total_amount,
      brokerage_amount,
      total_kg
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSupplier = async () => {
    if (!newSupplier.name.trim()) return;
    const result = await api.addSupplier(newSupplier);
    setFormData(prev => ({ ...prev, supplier_id: result.lastID }));
    setNewSupplier({ name: '', contact_no: '' });
    setShowSupplierModal(false);
    loadData();
  };

  const addBuyer = async () => {
    if (!newBuyer.name.trim()) return;
    const result = await api.addBuyer(newBuyer);
    setFormData(prev => ({ ...prev, buyer_id: result.lastID }));
    setNewBuyer({ name: '', contact_no: '' });
    setShowBuyerModal(false);
    loadData();
  };

  const saveDeal = async () => {
    if (!formData.supplier_id || !formData.buyer_id || !formData.product_name || !formData.rate || !formData.quantity) {
      alert('Please fill all required fields');
      return;
    }

    const dealData = {
      ...formData,
      ...calculations,
      supplier_id: parseInt(formData.supplier_id),
      buyer_id: parseInt(formData.buyer_id),
      rate: parseFloat(formData.rate),
      quantity: parseFloat(formData.quantity),
      kg_per_unit: parseFloat(formData.kg_per_unit),
      discount_percent: parseFloat(formData.discount_percent),
      brokerage_percent: parseFloat(formData.brokerage_percent),
      brokerage_per_bag: parseFloat(formData.brokerage_per_bag || 0),
      gst_percent: parseFloat(formData.gst_percent)
    };

    await api.addDeal(dealData);
    alert('Deal saved successfully!');
    refreshForm();
  };

  const refreshForm = () => {
    setFormData({
      supplier_id: '',
      buyer_id: '',
      confirmation_date: new Date().toISOString().split('T')[0],
      product_name: '',
      calculation_mode: 'per_kg',
      rate: '',
      quantity: '',
      unit: 'bags',
      kg_per_unit: 50,
      discount_percent: 0,
      brokerage_mode: 'percentage',
      brokerage_percent: 0.5,
      brokerage_per_bag: '',
      gst_percent: 5,
      payment_status: 'Pending'
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Deal Entry</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Deal Information</h2>
          
          <div className="space-y-4">
            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <div className="flex gap-2">
                <select
                  value={formData.supplier_id}
                  onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="bg-white text-gray-900">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.supplier_id} value={supplier.supplier_id} className="bg-white text-gray-900">
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowSupplierModal(true)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                >
                  Add New
                </button>
              </div>
            </div>

            {/* Buyer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer *</label>
              <div className="flex gap-2">
                <select
                  value={formData.buyer_id}
                  onChange={(e) => handleInputChange('buyer_id', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="bg-white text-gray-900">Select Buyer</option>
                  {buyers.map(buyer => (
                    <option key={buyer.buyer_id} value={buyer.buyer_id} className="bg-white text-gray-900">
                      {buyer.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowBuyerModal(true)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                >
                  Add New
                </button>
              </div>
            </div>

            {/* Confirmation Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Date</label>
              <input
                type="date"
                value={formData.confirmation_date}
                onChange={(e) => handleInputChange('confirmation_date', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter product name"
              />
            </div>

            {/* Calculation Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Mode</label>
              <select
                value={formData.calculation_mode}
                onChange={(e) => handleInputChange('calculation_mode', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="per_kg" className="bg-white text-gray-900">Rate per KG (with unit conversion)</option>
                <option value="direct" className="bg-white text-gray-900">Direct Rate × Quantity</option>
              </select>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.calculation_mode === 'per_kg' ? 'Rate per KG *' : 'Rate *'}
              </label>
              <input
                type="number"
                value={formData.rate}
                onChange={(e) => handleInputChange('rate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter rate"
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="bags" className="bg-white text-gray-900">Bags</option>
                  <option value="kg" className="bg-white text-gray-900">KG</option>
                  <option value="tons" className="bg-white text-gray-900">Tons</option>
                </select>
              </div>
            </div>

            {/* KG per Unit (only for per_kg mode) */}
            {formData.calculation_mode === 'per_kg' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KG per Unit</label>
                <input
                  type="number"
                  value={formData.kg_per_unit}
                  onChange={(e) => handleInputChange('kg_per_unit', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            )}

            {/* Cash Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash Discount %</label>
              <input
                type="number"
                value={formData.discount_percent}
                onChange={(e) => handleInputChange('discount_percent', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            {/* Brokerage Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brokerage Mode</label>
              <select
                value={formData.brokerage_mode}
                onChange={(e) => handleInputChange('brokerage_mode', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage" className="bg-white text-gray-900">Percentage</option>
                <option value="per_bag" className="bg-white text-gray-900">Per Bag</option>
              </select>
            </div>

            {/* Brokerage Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.brokerage_mode === 'percentage' ? 'Brokerage %' : 'Brokerage per Bag'}
              </label>
              <input
                type="number"
                value={formData.brokerage_mode === 'percentage' ? formData.brokerage_percent : formData.brokerage_per_bag}
                onChange={(e) => handleInputChange(
                  formData.brokerage_mode === 'percentage' ? 'brokerage_percent' : 'brokerage_per_bag',
                  e.target.value
                )}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            {/* GST */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
              <input
                type="number"
                value={formData.gst_percent}
                onChange={(e) => handleInputChange('gst_percent', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={refreshForm}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={saveDeal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Deal
            </button>
            <button
              onClick={() => setShowBillModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Bill
            </button>
          </div>
        </div>

        {/* Calculations Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Real-time Calculations</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Amount:</span>
              <span className="font-medium">₹{calculations.amount_without_gst.toLocaleString()}</span>
            </div>
            
            {formData.calculation_mode === 'per_kg' && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total KG:</span>
                <span>{calculations.total_kg} kg × ₹{formData.rate}</span>
              </div>
            )}
            
            {calculations.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Discount:</span>
                <span className="font-medium text-red-600">-₹{calculations.discount_amount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Amount (after discount/without GST):</span>
              <span className="font-medium">₹{calculations.amount_after_discount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">GST Amount ({formData.gst_percent}%):</span>
              <span className="font-medium">₹{calculations.gst_amount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-900 font-semibold">Total Amount with GST:</span>
              <span className="font-bold text-lg">₹{calculations.total_amount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between bg-green-50 p-3 rounded">
              <span className="text-green-800 font-semibold">Your Brokerage:</span>
              <span className="font-bold text-green-600">₹{calculations.brokerage_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Supplier</h3>
              <button onClick={() => setShowSupplierModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Supplier Name *"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="text"
                placeholder="Contact Number"
                value={newSupplier.contact_no}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact_no: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                onClick={addSupplier}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Modal */}
      {showBuyerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Buyer</h3>
              <button onClick={() => setShowBuyerModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Buyer Name *"
                value={newBuyer.name}
                onChange={(e) => setNewBuyer({ ...newBuyer, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="text"
                placeholder="Contact Number"
                value={newBuyer.contact_no}
                onChange={(e) => setNewBuyer({ ...newBuyer, contact_no: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              <button
                onClick={addBuyer}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Add Buyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealEntry;