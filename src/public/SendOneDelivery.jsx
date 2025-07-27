import React, { useState } from 'react';
import { FaTruck, FaUser, FaMapMarkerAlt, FaPhone, FaWeight, FaBox, FaCreditCard, FaCheckCircle } from 'react-icons/fa';

export default function SendOneDelivery() {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    loading_point: '',
    destination: '',
    tonnage: '',
    container_count: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) return 'Customer name is required';
    if (!formData.phone_number.trim()) return 'Phone number is required';
    if (!formData.loading_point.trim()) return 'Loading point is required';
    if (!formData.destination.trim()) return 'Destination is required';
    if (!formData.tonnage.trim()) return 'Tonnage is required';
    if (!formData.container_count.trim()) return 'Container count is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/public/send-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.paynowUrl) {
        // Redirect to Paynow for payment
        window.location.href = data.paynowUrl;
      } else {
        setError(data.error || 'Failed to create delivery. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{ 
      background: 'linear-gradient(135deg, #003366 0%, #0066CC 100%)',
      color: 'white'
    }}>
      <div className="w-100" style={{ 
        padding: window.innerWidth <= 768 ? '40px 20px' : '80px 120px'
      }}>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Header */}
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold mb-3" style={{ color: 'white' }}>
                Send One Delivery
              </h1>
              <p className="lead" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                No signup required. Pay once, track your delivery with SMS updates.
              </p>
              <div className="alert" style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}>
                <strong>Cost:</strong> $1.00 USD | <strong>Payment:</strong> Ecocash or USD
              </div>
            </div>

            {/* Process Steps */}
            <div className="row mb-5">
              <div className="col-12">
                <h3 className="h5 fw-bold mb-3" style={{ color: 'white' }}>How it works:</h3>
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="text-center p-3 rounded shadow-sm" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div className="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 40, height: 40, background: '#FF6600' }}>
                        <span className="fw-bold">1</span>
                      </div>
                      <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Enter details</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 rounded shadow-sm" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div className="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 40, height: 40, background: '#FF6600' }}>
                        <span className="fw-bold">2</span>
                      </div>
                      <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pay $1.00</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 rounded shadow-sm" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div className="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 40, height: 40, background: '#FF6600' }}>
                        <span className="fw-bold">3</span>
                      </div>
                      <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Get tracking code</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 rounded shadow-sm" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div className="text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 40, height: 40, background: '#FF6600' }}>
                        <span className="fw-bold">4</span>
                      </div>
                      <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>SMS updates</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="card shadow-sm border-0" style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px'
            }}>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* Customer Name */}
                    <div className="col-md-6">
                      <label htmlFor="customer_name" className="form-label fw-semibold" style={{ color: 'white' }}>
                        <FaUser className="me-2" />
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="customer_name"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        placeholder="Enter customer name"
                        required
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="col-md-6">
                      <label htmlFor="phone_number" className="form-label fw-semibold" style={{ color: 'white' }}>
                        <FaPhone className="me-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        placeholder="+263 78 123 4567"
                        required
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>

                    {/* Loading Point */}
                    <div className="col-md-6">
                      <label htmlFor="loading_point" className="form-label fw-semibold" style={{ color: 'white' }}>
                        <FaMapMarkerAlt className="me-2" />
                        Loading Point *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="loading_point"
                        name="loading_point"
                        value={formData.loading_point}
                        onChange={handleInputChange}
                        placeholder="e.g., Harare CBD"
                        required
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>

                    {/* Destination */}
                    <div className="col-md-6">
                      <label htmlFor="destination" className="form-label fw-semibold" style={{ color: 'white' }}>
                        <FaMapMarkerAlt className="me-2" />
                        Destination *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="destination"
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        placeholder="e.g., Bulawayo"
                        required
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>

                    {/* Tonnage */}
                    <div className="col-md-6">
                      <label htmlFor="tonnage" className="form-label fw-semibold" style={{ color: 'white' }}>
                        <FaWeight className="me-2" />
                        Tonnage *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="tonnage"
                        name="tonnage"
                        value={formData.tonnage}
                        onChange={handleInputChange}
                        placeholder="e.g., 10"
                        min="0.1"
                        step="0.1"
                        required
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>

                    {/* Container Count */}
                    <div className="col-md-6">
                      <label htmlFor="container_count" className="form-label fw-semibold" style={{ color: 'white' }}>
                        <FaBox className="me-2" />
                        Container Count *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="container_count"
                        name="container_count"
                        value={formData.container_count}
                        onChange={handleInputChange}
                        placeholder="e.g., 2"
                        min="1"
                        required
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)', 
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="alert alert-danger mt-3" role="alert">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="d-grid mt-4">
                    <button
                      type="submit"
                      className="btn btn-lg fw-bold"
                      disabled={loading}
                      style={{ 
                        background: 'linear-gradient(135deg, #FF6600, #FF8533)', 
                        border: 'none', 
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '16px 32px'
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaCreditCard className="me-2" />
                          Pay $1.00 & Send Delivery
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Features */}
            <div className="row mt-5">
              <div className="col-12">
                <h3 className="h5 fw-bold mb-3" style={{ color: 'white' }}>What you get:</h3>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="text-center p-3 rounded shadow-sm" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <FaCheckCircle className="mb-2" size={24} style={{ color: '#28a745' }} />
                      <h6 className="fw-semibold" style={{ color: 'white' }}>SMS Updates</h6>
                      <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Get notified at each checkpoint</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 rounded shadow-sm" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <FaTruck className="mb-2" size={24} style={{ color: '#FF6600' }} />
                      <h6 className="fw-semibold" style={{ color: 'white' }}>Track Online</h6>
                      <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Monitor progress on our website</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 rounded shadow-sm" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <FaPhone className="mb-2" size={24} style={{ color: '#17a2b8' }} />
                      <h6 className="fw-semibold" style={{ color: 'white' }}>24/7 Support</h6>
                      <small style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Call or email for assistance</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center mt-5">
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }} className="mb-2">
                Need help? Contact us:
              </p>
              <p className="mb-0">
                <a href="mailto:support@darlogistics.co.zw" className="text-decoration-none me-3" style={{ color: 'white' }}>
                  support@darlogistics.co.zw
                </a>
                <a href="tel:+263781334474" className="text-decoration-none" style={{ color: 'white' }}>
                  +263 781 334474
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 