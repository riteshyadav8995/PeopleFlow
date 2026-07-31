import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, AlertTriangle, Coffee } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../../../services/attendance.service';
import './ClockInOut.css';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

export function ClockInOut() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'Clocked Out' | 'Clocked In' | 'On Break'>('Clocked Out');
  const [locationStatus, setLocationStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [distance, setDistance] = useState<number | null>(null);
  
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const queryClient = useQueryClient();

  // Organization default coordinates (Admin can configure this globally)
  const OFFICE_LAT = 28.6139;
  const OFFICE_LON = 77.2090;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkLocation = () => {
    setLocationStatus('checking');
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocationStatus('invalid');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      const dist = calculateDistance(OFFICE_LAT, OFFICE_LON, userLat, userLon);
      setDistance(dist);
      
      // In a real app we might enforce distance, but for demo we allow it or set a wider radius
      if (dist <= 5.0) { // 5km for demo
        setLocationStatus('valid');
      } else {
        setLocationStatus('invalid');
      }
    }, () => {
      alert("Unable to retrieve your location");
      setLocationStatus('invalid');
    });
  };

  useEffect(() => {
    checkLocation();
  }, []);

  const clockInMutation = useMutation({
    mutationFn: (coords: { latitude: number, longitude: number }) => attendanceService.clockIn({ organizationId: organizationId!, ...coords }),
    onSuccess: () => {
      setStatus('Clocked In');
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: (coords: { latitude: number, longitude: number }) => attendanceService.clockOut(coords),
    onSuccess: () => {
      setStatus('Clocked Out');
      queryClient.invalidateQueries({ queryKey: ['myAttendance'] });
    }
  });

  const handleAction = (action: 'Clock In' | 'Clock Out' | 'Break') => {
    if (locationStatus !== 'valid') {
      alert("You must be within 5km of the office to clock in/out. (Demo limit)");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      if (action === 'Clock In') {
        clockInMutation.mutate(coords);
      } else if (action === 'Clock Out') {
        clockOutMutation.mutate(coords);
      } else if (action === 'Break') {
        if (status === 'Clocked In') {
          setStatus('On Break');
        } else {
          setStatus('Clocked In');
        }
      }
    });
  };

  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getStatusClass = () => {
    if (status === 'Clocked In') return 'clocked-in';
    if (status === 'On Break') return 'on-break';
    return 'clocked-out';
  };

  return (
    <div className="clock-in-out-container page-container">
      <div className="clock-header">
        <h1 className="clock-title">Attendance Portal</h1>
        <p className="clock-date">{formattedDate}</p>
      </div>

      <div className="clock-card">
        <div className="clock-time-display">
          {formattedTime}
        </div>
        
        <div className={`status-badge ${getStatusClass()}`}>
          <Clock size={16} /> Current Status: {status}
        </div>

        {/* Location Validation UI */}
        <div className="location-validation">
          {locationStatus === 'checking' && (
            <div className="validation-status checking">
              <MapPin size={18} /> Verifying GPS location...
            </div>
          )}
          {locationStatus === 'valid' && (
            <div className="validation-status valid">
              <CheckCircle size={18} /> Inside Geofence ({distance?.toFixed(2)} km away)
            </div>
          )}
          {locationStatus === 'invalid' && (
            <div className="validation-status invalid">
              <AlertTriangle size={18} /> Outside Geofence ({distance?.toFixed(2)} km away). Max allowed: 0.5 km.
            </div>
          )}

          <div className="test-mode-controls">
            <span className="test-mode-label">Test Mode:</span>
            <select 
              value={mockLocation} 
              onChange={(e) => setMockLocation(e.target.value as 'office' | 'home')}
              className="test-mode-select"
            >
              <option value="office">At Office (Valid)</option>
              <option value="home">At Home (Invalid)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {status === 'Clocked Out' ? (
            <button 
              onClick={() => handleAction('Clock In')}
              className="btn-clock-action btn-clock-in"
              disabled={locationStatus !== 'valid'}
            >
              <Clock size={20} /> Clock In
            </button>
          ) : (
            <button 
              onClick={() => handleAction('Clock Out')}
              className="btn-clock-action btn-clock-out"
              disabled={locationStatus !== 'valid'}
            >
              <CheckCircle size={20} /> Clock Out
            </button>
          )}

          {status !== 'Clocked Out' && (
            <button 
              onClick={() => handleAction('Break')}
              className={`btn-clock-action btn-break ${status === 'On Break' ? 'active' : ''}`}
              disabled={locationStatus !== 'valid'}
            >
              <Coffee size={20} /> {status === 'On Break' ? 'Resume Work' : 'Start Break'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
