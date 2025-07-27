import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentScreen = () => {
  const [helpers, setHelpers] = useState(2);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);

  const priceBreakdown = {
    cargoTruck: { label: 'Cargo Truck $24/km (20km)', amount: 480 },
    helpers: { label: `Helpers ${helpers} No.`, amount: helpers * 60 },
    discount: { label: 'Discount', amount: promoApplied ? -60 : 0 },
    taxes: { label: 'Taxes (10%)', amount: Math.round((480 + helpers * 60) * 0.1) }
  };

  const totalAmount = Object.values(priceBreakdown).reduce((sum, item) => sum + item.amount, 0);

  const handleHelperChange = (increment) => {
    const newCount = Math.max(1, Math.min(5, helpers + increment));
    setHelpers(newCount);
  };

  const handlePromoApply = async () => {
    if (!promoCode.trim()) return;
    
    setIsApplyingPromo(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (promoCode.toLowerCase() === 'save10') {
      setPromoApplied(true);
    }
    setIsApplyingPromo(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <button className="button button-secondary p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="caption">9:41</span>
      </motion.div>

      {/* Select Helpers Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <h3 className="heading-sm mb-4">Select Helpers</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => handleHelperChange(-1)}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="heading-md">{helpers.toString().padStart(2, '0')}</span>
            <button 
              onClick={() => handleHelperChange(1)}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <span className="heading-md text-accent-orange">${helpers * 60}</span>
        </div>
      </motion.div>

      {/* Promo Code Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mb-6"
      >
        <h3 className="heading-sm mb-4">Apply Promocode</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Enter Promocode"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-50 placeholder-neutral-400 focus:border-accent-blue focus:outline-none transition-colors"
          />
          <button 
            onClick={handlePromoApply}
            disabled={isApplyingPromo || !promoCode.trim()}
            className="button button-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplyingPromo ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              'Apply'
            )}
          </button>
        </div>
        {promoApplied && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 p-3 bg-success-green bg-opacity-20 border border-success-green rounded-lg"
          >
            <span className="text-success-green text-sm">Promo code applied successfully!</span>
          </motion.div>
        )}
      </motion.div>

      {/* Price Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mb-6"
      >
        <h3 className="heading-sm mb-4">Price Breakup</h3>
        <div className="space-y-3">
          {Object.entries(priceBreakdown).map(([key, item]) => (
            <motion.div 
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + Object.keys(priceBreakdown).indexOf(key) * 0.1 }}
              className="flex justify-between items-center"
            >
              <span className="body-base text-neutral-300">{item.label}</span>
              <span className={`body-base ${item.amount < 0 ? 'text-success-green' : 'text-neutral-50'}`}>
                ${item.amount}
              </span>
            </motion.div>
          ))}
          <div className="border-t border-neutral-700 pt-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="heading-sm">Amount Payable</span>
              <span className="heading-lg text-accent-orange">${totalAmount}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center space-x-3 mb-6 p-4 bg-warning-orange bg-opacity-20 border border-warning-orange rounded-lg"
      >
        <div className="w-2 h-2 bg-warning-orange rounded-full animate-pulse" />
        <span className="body-sm text-neutral-300">
          You will receive a notification one hour prior to the truck arriving at the pickup/drop location.
        </span>
      </motion.div>

      {/* Pay Now Button */}
      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full button button-primary py-4 heading-sm"
      >
        Pay Now
      </motion.button>
    </div>
  );
};

export default PaymentScreen; 