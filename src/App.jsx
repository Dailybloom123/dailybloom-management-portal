import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api'
  : 'https://dailybloom-x82y.onrender.com/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for existing admin/partner session
    const adminToken = localStorage.getItem('dailybloom_admin_token');
    const partnerToken = localStorage.getItem('dailybloom_partner_token');

    if (adminToken) {
      const adminUser = JSON.parse(localStorage.getItem('dailybloom_admin_user') || '{}');
      setUser({ ...adminUser, role: 'admin', token: adminToken });
    } else if (partnerToken) {
      const partnerUser = JSON.parse(localStorage.getItem('dailybloom_partner_user') || '{}');
      setUser({ ...partnerUser, role: 'partner', token: partnerToken });
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dailybloom_admin_token');
    localStorage.removeItem('dailybloom_admin_user');
    localStorage.removeItem('dailybloom_partner_token');
    localStorage.removeItem('dailybloom_partner_user');
    setUser(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
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
        setUser({ ...data.user, role: 'admin', token: data.token });
      } else {
        localStorage.setItem('dailybloom_partner_token', data.token);
        localStorage.setItem('dailybloom_partner_user', JSON.stringify(data.user));
        setUser({ ...data.user, role: 'partner', token: data.token });
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
        <p style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>Admin & Partner Portal</p>

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

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'staging') fetchStagingOrders();
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
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to update order:', err);
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

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowChangePassword(true)} style={{ padding: '8px 16px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Change Password</button>
          <button onClick={onLogout} style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
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
                    <strong>Order #{order.id?.slice(0, 8) || order.id}</strong>
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
              <input name="password" type="password" placeholder="Password" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }} />
              <button type="submit" style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Partner</button>
            </form>
          </div>

          {/* Partners List */}
          <div>
            <h3 style={{ marginBottom: 12 }}>Existing Partners</h3>
            <div style={{ color: '#666' }}>
              <p>Partner list will be displayed here. Use the API to manage partners:</p>
              <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                GET /api/admin/partners
              </code>
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
          ) : (
            <div style={{ color: '#666' }}>
              <p>Complaint management will display customer complaints and disputes here.</p>
              <p>Features to implement:</p>
              <ul style={{ marginLeft: 20 }}>
                <li>View all complaints with status</li>
                <li>Escalate complaints to partners</li>
                <li>Resolve complaints directly</li>
                <li>Track complaint SLA (4-hour response time)</li>
                <li>Partner warning system (3-strike rule)</li>
              </ul>
              <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                GET /api/admin/complaints
              </code>
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
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/partners/orders`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.success ? data.orders : data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/partners/orders/${orderId}/accept`, {
        method: 'PATCH',
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
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Partner Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowChangePassword(true)} style={{ padding: '8px 16px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Change Password</button>
          <button onClick={onLogout} style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
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
                  <strong>Order #{order.id?.slice(0, 8) || order.id}</strong>
                  <span style={{ color: '#666' }}>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div style={{ marginBottom: 8 }}>Status: <strong>{order.status}</strong></div>
                <div style={{ marginBottom: 8 }}>Total: ₹{order.total}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => acceptOrder(order.id)} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Accept Order</button>
                  <button onClick={() => updateOrderStatus(order.id, 'packed')} style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Packed</button>
                  <button onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} style={{ padding: '6px 12px', background: '#FF9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Out for Delivery</button>
                  <button onClick={() => updateOrderStatus(order.id, 'delivered')} style={{ padding: '6px 12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delivered</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
