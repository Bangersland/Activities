import React, { useState, useEffect, useRef } from 'react';

const Map = () => {
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    };

    loadLeaflet();

    return () => {
      // Cleanup
      if (map) {
        map.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.L) return;

    // Initialize map centered on Bogo City
    const mapInstance = window.L.map(mapRef.current).setView([11.044526, 124.004376], 13);

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    setMap(mapInstance);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          setUserLocation({ lat: userLat, lng: userLng });

          // Center map on user location
          mapInstance.setView([userLat, userLng], 15);

          // Add user marker
          window.L.marker([userLat, userLng])
            .addTo(mapInstance)
            .bindPopup('You are here!')
            .openPopup();
        },
        (error) => {
          console.error("Error getting location:", error.message);
          // If geolocation fails, just show the map centered on Bogo City
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="content-section">
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px 12px 0 0',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: '600' }}>
          Interactive Map
        </h2>
        {userLocation && (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            📍 Location detected
          </div>
        )}
      </div>

      {/* Map Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        backgroundColor: '#f8fafc'
      }}>
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            borderRadius: '0 0 12px 12px'
          }}
        />
      </div>
    </div>
  );
};

export default Map; 