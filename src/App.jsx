import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n'; // Initialize i18next
import { useTranslation } from 'react-i18next';
import AuthSessionManager from './utils/AuthSessionManager';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api'
  : 'https://dailybloom-x82y.onrender.com/api';

function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLang(lang);
    localStorage.setItem('dailybloom_language', lang);
  };

  useEffect(() => {
    // Check for existing admin/partner session
    const adminToken = localStorage.getItem('dailybloom_admin_token');
    const partnerToken = localStorage.getItem('dailybloom_partner_token');

    if (adminToken) {
      const adminUser = JSON.parse(localStorage.getItem('dailybloom_admin_user') || '{}');
      setUser({ ...adminUser, role: 'admin', token: adminToken });
      // Setup auto-refresh for admin
      AuthSessionManager.setupAutoRefresh('admin');
    } else if (partnerToken) {
      const partnerUser = JSON.parse(localStorage.getItem('dailybloom_partner_user') || '{}');
      setUser({ ...partnerUser, role: 'partner', token: partnerToken });
      // Setup auto-refresh for partner
      AuthSessionManager.setupAutoRefresh('partner');
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    AuthSessionManager.clearSession('admin');
    AuthSessionManager.clearSession('partner');
    setUser(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {/* Language Selector - Mobile Optimized */}
        <div style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          zIndex: 1000, 
          background: 'white', 
          padding: '8px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '@media (max-width: 768px)': {
            top: 'auto',
            bottom: 10,
            right: 10,
            left: 10,
            textAlign: 'center'
          }
        }}>
          <select 
            value={currentLang} 
            onChange={(e) => changeLanguage(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              width: '100%',
              maxWidth: '200px'
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="as">অসমীয়া</option>
          </select>
        </div>
        <Routes>
          <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <LoginPage setUser={setUser} setError={setError} error={error} />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/partner" element={user?.role === 'partner' ? <PartnerDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

function LoginPage({ setUser, setError, error }) {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'partner'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = loginType === 'admin' ? '/auth/admin/login' : '/auth/partner/login';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (loginType === 'admin') {
        localStorage.setItem('dailybloom_admin_token', data.token);
        localStorage.setItem('dailybloom_admin_user', JSON.stringify(data.user));
        AuthSessionManager.setToken(data.token, data.expiresIn || 604800, 'admin'); // 7 days default
        setUser({ ...data.user, role: 'admin', token: data.token });
        AuthSessionManager.setupAutoRefresh('admin');
      } else {
        localStorage.setItem('dailybloom_partner_token', data.token);
        localStorage.setItem('dailybloom_partner_user', JSON.stringify(data.user));
        AuthSessionManager.setToken(data.token, data.expiresIn || 604800, 'partner'); // 7 days default
        setUser({ ...data.user, role: 'partner', token: data.token });
        AuthSessionManager.setupAutoRefresh('partner');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: 400 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8, color: '#333' }}>DailyBloom</h1>
        <p style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>Management & Partner Portal</p>

        <div style={{ display: 'flex', marginBottom: 24, gap: 8 }}>
          <button
            onClick={() => setLoginType('admin')}
            style={{
              flex: 1,
              padding: 10,
              background: loginType === 'admin' ? '#333' : '#f5f5f5',
              color: loginType === 'admin' ? 'white' : '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Admin
          </button>
          <button onClick={() => setLoginType('partner')}
            style={{
              flex: 1,
              padding: 10,
              background: loginType === 'partner' ? '#333' : '#f5f5f5',
              color: loginType === 'partner' ? 'white' : '#333',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Partner
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
              {loginType === 'admin' ? 'Admin Email' : 'Partner Email'}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={loginType === 'admin' ? 'admin@dailybloom.com' : 'partner@dailybloom.com'}
              style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="•••••••••"
              style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
            />
          </div>

          {error && <div style={{ background: '#fee', color: '#c33', padding: 10, borderRadius: 6, marginBottom: 16 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Logging in...' : `${loginType === 'admin' ? 'Admin' : 'Partner'} Login`}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [stagingOrders, setStagingOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [editingPartner, setEditingPartner] = useState(null);
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showWalletAdjustment, setShowWalletAdjustment] = useState(false);
  const [walletAdjustment, setWalletAdjustment] = useState({
    amount: '',
    adjustment_type: 'credit',
    reason: ''
  });

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'staging') fetchStagingOrders();
    if (activeTab === 'partners') fetchPartners();
    if (activeTab === 'complaints') fetchComplaints();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'customers') fetchCustomers();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStagingOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/staging-queue`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setStagingOrders(data);
    } catch (err) {
      console.error('Failed to fetch staging queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/partners`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setPartners(data);
    } catch (err) {
      console.error('Failed to fetch partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePartner = async (partnerId, partnerData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(partnerData)
      });
      if (res.ok) {
        fetchPartners();
        setShowPartnerDetails(false);
        setEditingPartner(null);
      }
    } catch (err) {
      console.error('Failed to update partner:', err);
    }
  };

  const deletePartner = async (partnerId) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchPartners();
      }
    } catch (err) {
      console.error('Failed to delete partner:', err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/complaints`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/customers`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/customers/${customerId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedCustomer(data);
        setShowCustomerDetails(true);
      }
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
    }
  };

  const handleWalletAdjustment = async () => {
    if (!selectedCustomer || !walletAdjustment.amount) {
      alert('Please enter an amount');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/wallet/admin/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          user_id: selectedCustomer.user.id,
          amount: parseFloat(walletAdjustment.amount),
          adjustment_type: walletAdjustment.adjustment_type,
          reason: walletAdjustment.reason
        })
      });

      if (res.ok) {
        alert('Wallet adjustment successful');
        setShowWalletAdjustment(false);
        setWalletAdjustment({ amount: '', adjustment_type: 'credit', reason: '' });
        fetchCustomerDetails(selectedCustomer.user.id); // Refresh customer details
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to adjust wallet');
      }
    } catch (err) {
      console.error('Failed to adjust wallet:', err);
      alert('Failed to adjust wallet');
    }
  };

  const escalateComplaint = async (complaintId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/escalate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchComplaints();
      }
    } catch (err) {
      console.error('Failed to escalate complaint:', err);
    }
  };

  const resolveComplaint = async (complaintId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchComplaints();
      }
    } catch (err) {
      console.error('Failed to resolve complaint:', err);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Order status updated to ${status}`);
        fetchOrders();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to update order: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error('Failed to update order:', err);
      alert('Failed to update order. Please try again.');
    }
  };

  const assignOrderToPartner = async (orderId, partnerId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/assign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ partner_id: partnerId })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to assign order:', err);
    }
  };

  const createProduct = async (productData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        fetchProducts();
        setShowProductForm(false);
        setEditingProduct(null);
      }
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  const updateProduct = async (productId, productData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        fetchProducts();
        setShowProductForm(false);
        setEditingProduct(null);
      }
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Management Dashboard</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowChangePassword(true)} style={{ padding: '8px 12px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Change Password</button>
          <button onClick={onLogout} style={{ padding: '8px 12px', background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Logout</button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 20 }}>Change Password</h2>
            {passwordError && <div style={{ background: '#fee', color: '#c33', padding: 10, borderRadius: 6, marginBottom: 16 }}>{passwordError}</div>}
            {passwordSuccess && <div style={{ background: '#efe', color: '#3c3', padding: 10, borderRadius: 6, marginBottom: 16 }}>{passwordSuccess}</div>}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (passwordForm.new !== passwordForm.confirm) {
                setPasswordError('New passwords do not match');
                return;
              }
              try {
                const res = await fetch(`${API_BASE}/auth/change-password`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  },
                  body: JSON.stringify({
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.new
                  })
                });
                const data = await res.json();
                if (res.ok) {
                  setPasswordSuccess('Password changed successfully!');
                  setPasswordError('');
                  setPasswordForm({ current: '', new: '', confirm: '' });
                  setTimeout(() => setShowChangePassword(false), 2000);
                } else {
                  setPasswordError(data.error || 'Failed to change password');
                  setPasswordSuccess('');
                }
              } catch (err) {
                setPasswordError('Failed to change password. Please try again.');
                setPasswordSuccess('');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Change Password</button>
                <button type="button" onClick={() => { setShowChangePassword(false); setPasswordForm({ current: '', new: '', confirm: '' }); setPasswordError(''); setPasswordSuccess(''); }} style={{ flex: 1, padding: 12, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('orders')} style={{ padding: '8px 16px', background: activeTab === 'orders' ? '#333' : '#f5f5f5', color: activeTab === 'orders' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Orders</button>
        <button onClick={() => setActiveTab('stats')} style={{ padding: '8px 16px', background: activeTab === 'stats' ? '#333' : '#f5f5f5', color: activeTab === 'stats' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Statistics</button>
        <button onClick={() => setActiveTab('partners')} style={{ padding: '8px 16px', background: activeTab === 'partners' ? '#333' : '#f5f5f5', color: activeTab === 'partners' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Partners</button>
        <button onClick={() => setActiveTab('products')} style={{ padding: '8px 16px', background: activeTab === 'products' ? '#333' : '#f5f5f5', color: activeTab === 'products' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Products</button>
        <button onClick={() => setActiveTab('customers')} style={{ padding: '8px 16px', background: activeTab === 'customers' ? '#333' : '#f5f5f5', color: activeTab === 'customers' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Customers</button>
        <button onClick={() => setActiveTab('complaints')} style={{ padding: '8px 16px', background: activeTab === 'complaints' ? '#333' : '#f5f5f5', color: activeTab === 'complaints' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Complaints</button>
        <button onClick={() => setActiveTab('staging')} style={{ padding: '8px 16px', background: activeTab === 'staging' ? '#333' : '#f5f5f5', color: activeTab === 'staging' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Staging Queue</button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Recent Orders</h2>
          {loading ? (
            <div>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ color: '#666' }}>No orders yet. Place an order from the customer portal to see it here.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {orders.map(order => (
                <div key={order.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Order #{order.display_order_id || order.id?.slice(0, 8) || order.id}</strong>
                    <span style={{ color: '#666' }}>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>Status: <strong>{order.status}</strong></div>
                  <div style={{ marginBottom: 8 }}>Total: ₹{order.total}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => updateOrderStatus(order.id, 'confirmed')} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Confirm</button>
                    <button onClick={() => updateOrderStatus(order.id, 'in_progress')} style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>In Progress</button>
                    <button onClick={() => updateOrderStatus(order.id, 'delivered')} style={{ padding: '6px 12px', background: '#FF9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delivered</button>
                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Analytics Dashboard</h2>
          {loading ? (
            <div>Loading statistics...</div>
          ) : stats ? (
            <div>
              {/* Key Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Today's Orders</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.todayOrders || 0}</div>
                </div>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Today's Revenue</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>₹{stats.todayRevenue || 0}</div>
                </div>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Pending Orders</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.pendingOrders || 0}</div>
                </div>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Total Customers</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalCustomers || 0}</div>
                </div>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Total Partners</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalPartners || 0}</div>
                </div>
              </div>

              {/* Additional Analytics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* Order Status Breakdown */}
                <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Order Status Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pending</span>
                      <strong>{stats.pendingOrders || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Confirmed</span>
                      <strong>{stats.confirmedOrders || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>In Progress</span>
                      <strong>{stats.inProgressOrders || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Delivered</span>
                      <strong>{stats.deliveredOrders || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cancelled</span>
                      <strong>{stats.cancelledOrders || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Weekly Revenue */}
                <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Weekly Revenue</h3>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#4CAF50' }}>
                    ₹{stats.weeklyRevenue || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Last 7 days
                  </div>
                </div>

                {/* Top Products */}
                <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Top Products</h3>
                  {stats.topProducts && stats.topProducts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stats.topProducts.slice(0, 5).map((product, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{product.name}</span>
                          <strong>{product.orders} orders</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', fontSize: 13 }}>No data available</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#666' }}>No statistics available yet.</div>
          )}
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Partners Management</h2>
          
          {/* Add Partner Form */}
          <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 6, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Add New Partner</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              try {
                const res = await fetch(`${API_BASE}/admin/partners`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  },
                  body: JSON.stringify({
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    partner_type: formData.get('partner_type'),
                    password: formData.get('password')
                  })
                });
                if (res.ok) {
                  alert('Partner added successfully!');
                  e.target.reset();
                  // Refresh partners list
                } else {
                  alert('Failed to add partner');
                }
              } catch (err) {
                alert('Error adding partner');
              }
            }} style={{ display: 'grid', gap: 12 }}>
              <input name="name" placeholder="Partner Name" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
              <input name="phone" placeholder="Phone Number" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
              <input name="email" placeholder="Email (optional)" style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
              <select name="partner_type" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}>
                <option value="milk_van">Milk Van</option>
                <option value="florist">Florist</option>
                <option value="bakery">Bakery</option>
                <option value="organic_partner">Organic Partner</option>
              </select>
              <input name="assigned_zone_id" placeholder="Zone ID (optional)" style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
              <input name="password" type="password" placeholder="Password" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
              <button type="submit" style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Partner</button>
            </form>
          </div>

          {/* Partners List */}
          <div>
            <h3 style={{ marginBottom: 12 }}>Existing Partners</h3>
            {loading ? (
              <div>Loading partners...</div>
            ) : partners.length === 0 ? (
              <div style={{ color: '#666' }}>No partners yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {partners.map(partner => (
                  <div key={partner.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{partner.name}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>{partner.email || partner.phone}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Type: {partner.partner_type}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setEditingPartner(partner); setShowPartnerDetails(true); }} style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>View/Edit</button>
                      <button onClick={() => deletePartner(partner.id)} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partner Details Modal */}
      {showPartnerDetails && editingPartner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 500 }}>
            <h2 style={{ marginBottom: 20 }}>Partner Details</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              await updatePartner(editingPartner.id, {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                partner_type: formData.get('partner_type'),
                assigned_zone_id: formData.get('assigned_zone_id') || null
              });
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Name</label>
                <input name="name" defaultValue={editingPartner.name} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Phone</label>
                <input name="phone" defaultValue={editingPartner.phone} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Email</label>
                <input name="email" defaultValue={editingPartner.email || ''} style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Partner Type</label>
                <select name="partner_type" defaultValue={editingPartner.partner_type} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}>
                  <option value="milk_van">Milk Van</option>
                  <option value="florist">Florist</option>
                  <option value="bakery">Bakery</option>
                  <option value="organic_partner">Organic Partner</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Assigned Zone</label>
                <input name="assigned_zone_id" defaultValue={editingPartner.assigned_zone_id || ''} placeholder="Zone ID (optional)" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Update Partner</button>
                <button type="button" onClick={() => { setShowPartnerDetails(false); setEditingPartner(null); }} style={{ flex: 1, padding: 12, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Product Management</h2>
            <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Add Product</button>
          </div>
          {loading ? (
            <div>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ color: '#666' }}>No products yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {products.map(product => (
                <div key={product.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{product.name}</strong>
                    <span style={{ color: '#666' }}>₹{product.price}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>Category: {product.category}</div>
                  <div style={{ marginBottom: 8 }}>Stock: {product.stock}</div>
                  <div style={{ marginBottom: 8 }}>Partner: {product.partner_name || 'Unassigned'}</div>
                  <div style={{ marginBottom: 8 }}>Status: {product.is_active ? 'Active' : 'Inactive'}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteProduct(product.id)} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 20 }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')),
                category: formData.get('category'),
                image_url: formData.get('image_url'),
                partner_id: formData.get('partner_id'),
                is_active: formData.get('is_active') === 'true'
              };
              if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
              } else {
                await createProduct(productData);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Product Name *</label>
                <input name="name" defaultValue={editingProduct?.name} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Description</label>
                <textarea name="description" defaultValue={editingProduct?.description || ''} rows="3" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Price (₹) *</label>
                <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Stock *</label>
                <input name="stock" type="number" defaultValue={editingProduct?.stock || 0} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Category *</label>
                <select name="category" defaultValue={editingProduct?.category} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}>
                  <option value="">Select Category</option>
                  <option value="dairy">Dairy</option>
                  <option value="flowers">Flowers</option>
                  <option value="bakery">Bakery</option>
                  <option value="honey">Honey</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Partner *</label>
                <select name="partner_id" defaultValue={editingProduct?.partner_id} required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}>
                  <option value="">Select Partner</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>{partner.name} ({partner.partner_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Image URL</label>
                <input name="image_url" defaultValue={editingProduct?.image_url || ''} placeholder="https://..." style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Status</label>
                <select name="is_active" defaultValue={editingProduct?.is_active !== false ? 'true' : 'false'} style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{editingProduct ? 'Update Product' : 'Add Product'}</button>
                <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); }} style={{ flex: 1, padding: 12, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Customer Management</h2>
          {loading ? (
            <div>Loading customers...</div>
          ) : customers.length === 0 ? (
            <div style={{ color: '#666' }}>No customers yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {customers.map(customer => (
                <div key={customer.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{customer.name}</strong>
                    <span style={{ color: '#666' }}>{new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>Email: {customer.email || 'N/A'}</div>
                  <div style={{ marginBottom: 8 }}>Phone: {customer.phone || 'N/A'}</div>
                  <div style={{ marginBottom: 8 }}>Wallet Balance: ₹{customer.wallet_balance || 0}</div>
                  <div style={{ marginBottom: 8 }}>Escrow Balance: ₹{customer.escrow_balance || 0}</div>
                  <div style={{ marginBottom: 8 }}>Saved Addresses: {customer.address_count || 0}</div>
                  <div style={{ marginBottom: 8 }}>Last Login: {customer.last_login_at ? new Date(customer.last_login_at).toLocaleString() : 'Never'}</div>
                  <button onClick={() => fetchCustomerDetails(customer.id)} style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>View Details</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 20 }}>Customer Details</h2>
            <div style={{ marginBottom: 16 }}>
              <strong>Name:</strong> {selectedCustomer.user.name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Email:</strong> {selectedCustomer.user.email || 'N/A'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Phone:</strong> {selectedCustomer.user.phone || 'N/A'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Wallet Balance:</strong> ₹{selectedCustomer.user.wallet_balance || 0}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Escrow Balance:</strong> ₹{selectedCustomer.user.escrow_balance || 0}
            </div>
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowWalletAdjustment(true)} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Adjust Wallet Balance</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Total Orders:</strong> {selectedCustomer.stats.total_orders || 0}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Delivered Orders:</strong> {selectedCustomer.stats.delivered_orders || 0}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Total Spent:</strong> ₹{selectedCustomer.stats.total_spent || 0}
            </div>
            <h3 style={{ marginBottom: 12 }}>Saved Addresses</h3>
            {selectedCustomer.addresses.length === 0 ? (
              <div style={{ color: '#666', marginBottom: 16 }}>No saved addresses.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                {selectedCustomer.addresses.map(address => (
                  <div key={address.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{address.title || 'Address'}</div>
                    <div>{address.line1}</div>
                    <div>{address.city}, {address.pincode}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{address.locality}</div>
                    {address.is_default && <span style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600 }}>Default</span>}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setShowCustomerDetails(false); setSelectedCustomer(null); }} style={{ padding: '12px 24px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}

      {/* Wallet Adjustment Modal */}
      {showWalletAdjustment && selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 500 }}>
            <h2 style={{ marginBottom: 20 }}>Adjust Wallet Balance</h2>
            <div style={{ marginBottom: 16 }}>
              <strong>Customer:</strong> {selectedCustomer.user.name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Current Balance:</strong> ₹{selectedCustomer.user.wallet_balance || 0}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Adjustment Type</label>
              <select
                value={walletAdjustment.adjustment_type}
                onChange={(e) => setWalletAdjustment({ ...walletAdjustment, adjustment_type: e.target.value })}
                style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              >
                <option value="credit">Credit (Add Funds)</option>
                <option value="debit">Debit (Remove Funds)</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Amount (₹)</label>
              <input
                type="number"
                value={walletAdjustment.amount}
                onChange={(e) => setWalletAdjustment({ ...walletAdjustment, amount: e.target.value })}
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Reason</label>
              <input
                type="text"
                value={walletAdjustment.reason}
                onChange={(e) => setWalletAdjustment({ ...walletAdjustment, reason: e.target.value })}
                placeholder="e.g., Refund, promotional credit, adjustment"
                style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleWalletAdjustment} style={{ flex: 1, padding: 12, background: '#4CAF50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Confirm Adjustment</button>
              <button onClick={() => { setShowWalletAdjustment(false); setWalletAdjustment({ amount: '', adjustment_type: 'credit', reason: '' }); }} style={{ flex: 1, padding: 12, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Complaint Management</h2>
          {loading ? (
            <div>Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div style={{ color: '#666' }}>No complaints yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {complaints.map(complaint => (
                <div key={complaint.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Complaint #{complaint.id?.slice(0, 8) || complaint.id}</strong>
                    <span style={{ color: '#666' }}>{new Date(complaint.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>Status: <strong>{complaint.status}</strong></div>
                  <div style={{ marginBottom: 8 }}>Issue: {complaint.issue}</div>
                  <div style={{ marginBottom: 8 }}>Order ID: {complaint.order_id}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => escalateComplaint(complaint.id)} style={{ padding: '6px 12px', background: '#FF9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Escalate</button>
                    <button onClick={() => resolveComplaint(complaint.id)} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staging Queue Tab */}
      {activeTab === 'staging' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Staging Queue (Category C Products)</h2>
          {loading ? (
            <div>Loading staging queue...</div>
          ) : stagingOrders && stagingOrders.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {stagingOrders.map(order => (
                <div key={order.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Order #{order.id?.slice(0, 8) || order.id}</strong>
                    <span style={{ color: '#666' }}>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>Total: ₹{order.total}</div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Items:</strong>
                    {order.items?.map(item => (
                      <span key={item.id} style={{ marginRight: 8 }}>{item.product_name} x{item.quantity}</span>
                    ))}
                  </div>
                  <button onClick={() => assignOrderToPartner(order.id)} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Assign to Partner</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666' }}>No orders in staging queue.</div>
          )}
        </div>
      )}
    </div>
  );
}

function PartnerDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [procurementLists, setProcurementLists] = useState([]);
  const [selectedProcurementList, setSelectedProcurementList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'procurement') fetchProcurementLists();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/orders`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partner/products`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcurementLists = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/procurement/partner`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setProcurementLists(data.procurementLists || []);
    } catch (err) {
      console.error('Failed to fetch procurement lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateShortfall = async (listId, itemId, shortfallQuantity) => {
    try {
      const res = await fetch(`${API_BASE}/procurement/${listId}/items/${itemId}/shortfall`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shortfall_quantity: shortfallQuantity })
      });
      if (res.ok) {
        alert('Shortfall updated successfully');
        fetchProcurementLists();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update shortfall');
      }
    } catch (err) {
      console.error('Failed to update shortfall:', err);
      alert('Failed to update shortfall');
    }
  };

  const submitProcurementList = async (listId) => {
    if (!confirm('Are you sure you want to submit this procurement list? Orders with shortfalls will be rejected and refunded.')) return;

    try {
      const res = await fetch(`${API_BASE}/procurement/${listId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        alert('Procurement list submitted successfully');
        fetchProcurementLists();
        setSelectedProcurementList(null);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to submit procurement list');
      }
    } catch (err) {
      console.error('Failed to submit procurement list:', err);
      alert('Failed to submit procurement list');
    }
  };

  const toggleProductAvailability = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/partner/products/${productId}/toggle-availability`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Failed to toggle product availability:', err);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/partner/accept-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to accept order:', err);
    }
  };

  const rejectOrder = async (orderId, reason = 'Stock not available') => {
    try {
      const res = await fetch(`${API_BASE}/partner/reject-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to reject order:', err);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE}/partners/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Order status updated to ${status}`);
        fetchOrders();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to update order: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error('Failed to update order:', err);
      alert('Failed to update order. Please try again.');
    }
  };

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Partner Dashboard</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowChangePassword(true)} style={{ padding: '8px 12px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Change Password</button>
          <button onClick={onLogout} style={{ padding: '8px 12px', background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Logout</button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 32, width: '100%', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 20 }}>Change Password</h2>
            {passwordError && <div style={{ background: '#fee', color: '#c33', padding: 10, borderRadius: 6, marginBottom: 16 }}>{passwordError}</div>}
            {passwordSuccess && <div style={{ background: '#efe', color: '#3c3', padding: 10, borderRadius: 6, marginBottom: 16 }}>{passwordSuccess}</div>}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (passwordForm.new !== passwordForm.confirm) {
                setPasswordError('New passwords do not match');
                return;
              }
              try {
                const res = await fetch(`${API_BASE}/auth/change-password`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  },
                  body: JSON.stringify({
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.new
                  })
                });
                const data = await res.json();
                if (res.ok) {
                  setPasswordSuccess('Password changed successfully!');
                  setPasswordError('');
                  setPasswordForm({ current: '', new: '', confirm: '' });
                  setTimeout(() => setShowChangePassword(false), 2000);
                } else {
                  setPasswordError(data.error || 'Failed to change password');
                  setPasswordSuccess('');
                }
              } catch (err) {
                setPasswordError('Failed to change password. Please try again.');
                setPasswordSuccess('');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Change Password</button>
                <button type="button" onClick={() => { setShowChangePassword(false); setPasswordForm({ current: '', new: '', confirm: '' }); setPasswordError(''); setPasswordSuccess(''); }} style={{ flex: 1, padding: 12, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('orders')} style={{ padding: '8px 16px', background: activeTab === 'orders' ? '#333' : '#f5f5f5', color: activeTab === 'orders' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Orders</button>
        <button onClick={() => setActiveTab('products')} style={{ padding: '8px 16px', background: activeTab === 'products' ? '#333' : '#f5f5f5', color: activeTab === 'products' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Products</button>
        <button onClick={() => setActiveTab('procurement')} style={{ padding: '8px 16px', background: activeTab === 'procurement' ? '#333' : '#f5f5f5', color: activeTab === 'procurement' ? 'white' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Procurement List</button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Assigned Orders</h2>
          {loading ? (
            <div>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ color: '#666' }}>No orders assigned to you yet. Once customers place orders, they will appear here.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {orders.map(order => (
                <div key={order.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Order #{order.display_order_id || order.id?.slice(0, 8) || order.id}</strong>
                    <span style={{ color: '#666' }}>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>Status: <strong>{order.status}</strong></div>
                  <div style={{ marginBottom: 8 }}>Total: ₹{order.total}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => acceptOrder(order.id)} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Accept Order</button>
                    <button onClick={() => rejectOrder(order.id, 'Stock not available')} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Reject Order</button>
                    <button onClick={() => updateOrderStatus(order.id, 'packed')} style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Packed</button>
                    <button onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} style={{ padding: '6px 12px', background: '#FF9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Out for Delivery</button>
                    <button onClick={() => updateOrderStatus(order.id, 'delivered')} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delivered</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 16 }}>My Products</h2>
          {loading ? (
            <div>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ color: '#666' }}>No products assigned to you yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {products.map(product => (
                <div key={product.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>{product.name}</strong>
                    <button
                      onClick={() => toggleProductAvailability(product.id)}
                      style={{
                        padding: '6px 12px',
                        background: product.is_active ? '#4CAF50' : '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {product.is_active ? 'Available' : 'Out of Stock'}
                    </button>
                  </div>
                  <div style={{ marginBottom: 8 }}>Category: {product.category}</div>
                  <div style={{ marginBottom: 8 }}>Price: ₹{product.price}</div>
                  <div style={{ marginBottom: 8 }}>Stock: {product.stock}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {product.is_active ? 'Product is visible to customers' : 'Product is hidden from customers'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Procurement List Tab */}
      {activeTab === 'procurement' && (
        <div style={{ background: 'white', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 16 }}>Procurement List (Buy List)</h2>
          {loading ? (
            <div>Loading procurement lists...</div>
          ) : procurementLists.length === 0 ? (
            <div style={{ color: '#666' }}>No procurement lists available yet. Lists are generated at 9:01 PM IST.</div>
          ) : selectedProcurementList ? (
            <div>
              <button onClick={() => setSelectedProcurementList(null)} style={{ marginBottom: 16, padding: '8px 16px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer' }}>← Back to Lists</button>
              <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 6, marginBottom: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Date: {selectedProcurementList.date}</h3>
                <div style={{ marginBottom: 8 }}>Total Items: {selectedProcurementList.total_items}</div>
                <div style={{ marginBottom: 8 }}>Total Orders: {selectedProcurementList.total_orders}</div>
                <div style={{ marginBottom: 8 }}>Status: <strong>{selectedProcurementList.status}</strong></div>
                {selectedProcurementList.status !== 'submitted' && (
                  <button
                    onClick={() => submitProcurementList(selectedProcurementList.id)}
                    style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Submit Procurement List
                  </button>
                )}
              </div>
              <h3 style={{ marginBottom: 16 }}>Items</h3>
              {selectedProcurementList.items && selectedProcurementList.items.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedProcurementList.items.map(item => (
                    <div key={item.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong>Order #{item.order_id?.slice(0, 8) || item.order_id}</strong>
                        <span style={{ color: '#666' }}>Qty: {item.quantity}</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>Customer: {item.customer_name} ({item.customer_phone})</div>
                      <div style={{ marginBottom: 8 }}>Address: {item.address}</div>
                      <div style={{ marginBottom: 8 }}>Price: ₹{item.price}</div>
                      {selectedProcurementList.status !== 'submitted' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <label style={{ fontWeight: 600 }}>Shortfall Qty:</label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            defaultValue={item.shortfall_quantity || 0}
                            onChange={(e) => {
                              const shortfall = parseInt(e.target.value) || 0;
                              if (shortfall >= 0 && shortfall <= item.quantity) {
                                updateShortfall(selectedProcurementList.id, item.id, shortfall);
                              }
                            }}
                            style={{ padding: '8px', borderRadius: 4, border: '1px solid #ddd', width: 80 }}
                          />
                          <span style={{ fontSize: 12, color: '#666' }}>(Max: {item.quantity})</span>
                        </div>
                      )}
                      {item.shortfall_quantity > 0 && (
                        <div style={{ marginTop: 8, padding: 8, background: '#fee', borderRadius: 4, color: '#c33', fontSize: 12 }}>
                          Shortfall: {item.shortfall_quantity} units will be rejected and refunded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#666' }}>No items in this procurement list.</div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {procurementLists.map(list => (
                <div key={list.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 6, cursor: 'pointer' }} onClick={() => setSelectedProcurementList(list)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Date: {list.date}</strong>
                    <span style={{ color: '#666' }}>{list.status}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>Total Items: {list.total_items}</div>
                  <div style={{ marginBottom: 8 }}>Total Orders: {list.total_orders}</div>
                  <button style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>View Details</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
