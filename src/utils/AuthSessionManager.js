/**
 * Mobile Authentication Session Manager
 * Handles JWT token storage and auto-refresh for mobile browsers
 */

export class AuthSessionManager {
  /**
   * Store auth token with expiration
   */
  static setToken(token, expiresIn, role) {
    const tokenKey = role === 'admin' ? 'dailybloom_admin_token' : 'dailybloom_partner_token';
    const expiresAt = Date.now() + (expiresIn * 1000); // Convert to milliseconds
    
    const sessionData = {
      token,
      expiresAt,
      lastRefresh: Date.now()
    };
    
    localStorage.setItem(tokenKey, JSON.stringify(sessionData));
    
    // Also set legacy format for backward compatibility
    localStorage.setItem(tokenKey, token);
  }

  /**
   * Get valid token (auto-refresh if expired)
   */
  static async getToken(role) {
    const tokenKey = role === 'admin' ? 'dailybloom_admin_token' : 'dailybloom_partner_token';
    
    try {
      const sessionDataStr = localStorage.getItem(tokenKey);
      if (!sessionDataStr) return null;
      
      const sessionData = JSON.parse(sessionDataStr);
      
      // Check if token is expired
      if (Date.now() > sessionData.expiresAt) {
        // Token expired, try to refresh
        const newToken = await this.refreshToken(role);
        return newToken;
      }
      
      return sessionData.token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Refresh token with backend
   */
  static async refreshToken(role) {
    const userKey = role === 'admin' ? 'dailybloom_admin_user' : 'dailybloom_partner_user';
    const userStr = localStorage.getItem(userKey);
    
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      const endpoint = role === 'admin' ? '/auth/admin/refresh' : '/auth/partner/refresh';
      
      const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:4000/api'
        : 'https://dailybloom-x82y.onrender.com/api';
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(role === 'admin' ? 'dailybloom_admin_token' : 'dailybloom_partner_token')}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Refresh failed, clear session
        this.clearSession(role);
        return null;
      }
      
      // Store new token
      this.setToken(data.token, data.expiresIn || 604800000, role); // Default 7 days
      
      return data.token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearSession(role);
      return null;
    }
  }

  /**
   * Clear session (logout)
   */
  static clearSession(role) {
    const tokenKey = role === 'admin' ? 'dailybloom_admin_token' : 'dailybloom_partner_token';
    const userKey = role === 'admin' ? 'dailybloom_admin_user' : 'dailybloom_partner_user';
    
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  }

  /**
   * Check if session is valid
   */
  static isSessionValid(role) {
    const tokenKey = role === 'admin' ? 'dailybloom_admin_token' : 'dailybloom_partner_token';
    
    try {
      const sessionDataStr = localStorage.getItem(tokenKey);
      if (!sessionDataStr) return false;
      
      const sessionData = JSON.parse(sessionDataStr);
      return Date.now() < sessionData.expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user data
   */
  static getUser(role) {
    const userKey = role === 'admin' ? 'dailybloom_admin_user' : 'dailybloom_partner_user';
    const userStr = localStorage.getItem(userKey);
    
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }

  /**
   * Auto-refresh token before expiry (call this periodically)
   */
  static async autoRefreshIfNeeded(role) {
    const tokenKey = role === 'admin' ? 'dailybloom_admin_token' : 'dailybloom_partner_token';
    
    try {
      const sessionDataStr = localStorage.getItem(tokenKey);
      if (!sessionDataStr) return false;
      
      const sessionData = JSON.parse(sessionDataStr);
      const timeUntilExpiry = sessionData.expiresAt - Date.now();
      
      // Refresh if token expires in less than 1 hour
      if (timeUntilExpiry < 3600000) {
        const newToken = await this.refreshToken(role);
        return !!newToken;
      }
      
      return true;
    } catch (error) {
      console.error('Error in auto-refresh:', error);
      return false;
    }
  }

  /**
   * Setup periodic token refresh (call on app initialization)
   */
  static setupAutoRefresh(role) {
    // Refresh every 30 minutes
    setInterval(() => {
      this.autoRefreshIfNeeded(role);
    }, 30 * 60 * 1000);
    
    // Also refresh when tab becomes visible (for mobile browsers)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.autoRefreshIfNeeded(role);
      }
    });
  }
}

export default AuthSessionManager;
