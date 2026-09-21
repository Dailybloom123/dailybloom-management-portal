/**
 * Mobile Device Permissions Handler for Web Browsers
 * Handles camera and GPS permissions for Chrome, Safari, Firefox, Samsung Internet
 */

export class WebDevicePermissions {
  /**
   * Request camera permission for delivery photo capture
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      // Check if the browser supports camera API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera API not supported in this browser');
        return false;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera for delivery photos
      });

      // Stop the stream immediately (we just wanted permission)
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Capture photo using device camera
   */
  static async capturePhoto() {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission not granted');
      }

      // Use device camera via file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Prefer back camera on mobile

      return new Promise((resolve, reject) => {
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          } else {
            resolve(null);
          }
        };
        input.oncancel = () => resolve(null);
        input.click();
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }

  /**
   * Request GPS/location permission for partner tracking
   */
  static async requestLocationPermission(): Promise<boolean> {
    try {
      // Check if geolocation API is supported
      if (!navigator.geolocation) {
        console.warn('Geolocation API not supported in this browser');
        return false;
      }

      // Request location permission (iOS requires explicit permission request)
      const position = await navigator.geolocation.getCurrentPosition(
        () => {}, // Success callback
        (error) => {
          throw error;
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return true;
    } catch (error) {
      console.error('Location permission denied:', error);
      return false;
    }
  }

  /**
   * Get current GPS location
   */
  static async getCurrentLocation() {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      return position;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Start GPS tracking for partner delivery
   */
  static startLocationTracking(
    callback: (position: GeolocationPosition) => void
  ): number | null {
    try {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback(position);
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return null;
    }
  }

  /**
   * Stop GPS tracking
   */
  static stopLocationTracking(watchId: number): void {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  /**
   * Check browser compatibility
   */
  static checkBrowserCompatibility() {
    return {
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      geolocation: !!navigator.geolocation,
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
    };
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission denied:', error);
      return false;
    }
  }

  /**
   * Show local notification
   */
  static showNotification(title: string, body: string): void {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'dailybloom-notification',
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Detect mobile browser
   */
  static isMobileBrowser(): boolean {
    const userAgent = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }

  /**
   * Detect browser name
   */
  static getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      return 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('SamsungBrowser')) {
      return 'Samsung Internet';
    } else if (userAgent.includes('Edg')) {
      return 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      return 'Opera';
    }
    
    return 'Unknown';
  }

  /**
   * Get browser-specific permission instructions
   */
  static getPermissionInstructions(feature: 'camera' | 'location'): string {
    const browser = this.getBrowserName();
    const isMobile = this.isMobileBrowser();

    if (feature === 'camera') {
      if (browser === 'Safari' && isMobile) {
        return 'iOS: Settings > Safari > Camera > Allow';
      } else if (browser === 'Chrome' && isMobile) {
        return 'Android: Settings > Apps > Chrome > Permissions > Camera';
      }
      return 'Allow camera access when prompted by the browser';
    }

    if (feature === 'location') {
      if (browser === 'Safari' && isMobile) {
        return 'iOS: Settings > Safari > Location > "While Using the App"';
      } else if (browser === 'Chrome' && isMobile) {
        return 'Android: Settings > Apps > Chrome > Permissions > Location';
      }
      return 'Allow location access when prompted by the browser';
    }

    return 'Allow the requested permission when prompted';
  }
}

export default WebDevicePermissions;
