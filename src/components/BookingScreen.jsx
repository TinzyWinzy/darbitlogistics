import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BookingScreen = () => {
  const [pickupLocation, setPickupLocation] = useState('275 Ash Dr. San Jose, South Dakota 83475');
  const [dropLocation, setDropLocation] = useState('4040 Parker Rd. Allentown, New Mexico 3034');
  const [selectedDate, setSelectedDate] = useState('12 Feb. 2023');
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [selectedVehicle, setSelectedVehicle] = useState('cargo-truck');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const vehicles = [
    {
      id: 'cargo-truck',
      name: 'Cargo Truck',
      price: '$24/km',
      icon: '🚛',
      description: 'Large capacity, ideal for heavy loads'
    },
    {
      id: 'pickup-van',
      name: 'Pickup Van',
      price: '$15/km',
      icon: '🚐',
      description: 'Compact, perfect for smaller moves'
    }
  ];

  const handleVehicleSelect = (vehicleId) => {
    setSelectedVehicle(vehicleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <span className="caption">9:41</span>
        <div className="flex items-center space-x-2">
          <span className="body-sm">Hello Brooklyn Simmons</span>
          <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold">BS</span>
          </div>
        </div>
      </motion.div>

      {/* Location Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <h3 className="heading-sm mb-4">Where to drop?</h3>
        
        {/* Pickup Location */}
        <div className="mb-4">
          <label className="body-sm text-neutral-400 mb-2 block">Pickup Location</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-3 text-neutral-50 placeholder-neutral-400 focus:border-accent-blue focus:outline-none transition-colors"
              placeholder="Enter pickup location"
            />
          </div>
        </div>

        {/* Drop Location */}
        <div>
          <label className="body-sm text-neutral-400 mb-2 block">Drop Location</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={dropLocation}
              onChange={(e) => setDropLocation(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-3 text-neutral-50 placeholder-neutral-400 focus:border-accent-orange focus:outline-none transition-colors"
              placeholder="Enter drop location"
            />
          </div>
        </div>
      </motion.div>

      {/* Date and Time Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        {/* Date Picker */}
        <div className="card">
          <label className="body-sm text-neutral-400 mb-2 block">Select Date</label>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-50 hover:border-accent-blue transition-colors text-left flex items-center justify-between"
          >
            <span>{selectedDate}</span>
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* Time Picker */}
        <div className="card">
          <label className="body-sm text-neutral-400 mb-2 block">Select Time</label>
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-neutral-50 hover:border-accent-blue transition-colors text-left flex items-center justify-between"
          >
            <span>{selectedTime}</span>
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Vehicle Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mb-6"
      >
        <h3 className="heading-sm mb-4">Select Vehicle</h3>
        <div className="grid grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <motion.button
              key={vehicle.id}
              onClick={() => handleVehicleSelect(vehicle.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedVehicle === vehicle.id
                  ? 'border-accent-orange bg-accent-orange bg-opacity-20'
                  : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{vehicle.icon}</div>
                <h4 className="heading-sm mb-1">{vehicle.name}</h4>
                <p className="body-sm text-accent-orange mb-2">{vehicle.price}</p>
                <p className="caption text-neutral-400">{vehicle.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full button button-primary py-4 heading-sm"
      >
        Continue
      </motion.button>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowDatePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-80 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="heading-sm mb-4">Select Date</h3>
              {/* Date picker content would go here */}
              <div className="space-y-2">
                {['12 Feb. 2023', '13 Feb. 2023', '14 Feb. 2023'].map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }}
                    className="w-full p-3 text-left rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    {date}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Picker Modal */}
      <AnimatePresence>
        {showTimePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowTimePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-80 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="heading-sm mb-4">Select Time</h3>
              {/* Time picker content would go here */}
              <div className="space-y-2">
                {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'].map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      setSelectedTime(time);
                      setShowTimePicker(false);
                    }}
                    className="w-full p-3 text-left rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingScreen; 