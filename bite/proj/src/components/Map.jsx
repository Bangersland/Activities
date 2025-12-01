import React, { useState, useEffect, useRef } from 'react';
import { getAllAppointments } from '../supabase';

const Map = () => {
  const [map, setMap] = useState(null);
  const [barangayData, setBarangayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heatmapLayer, setHeatmapLayer] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false); // Hide markers by default for cleaner look
  const [showColoredAreas, setShowColoredAreas] = useState(true); // Show colored areas by default
  const [highlightedBarangay, setHighlightedBarangay] = useState(null);
  const [coloredAreas, setColoredAreas] = useState([]);
  const mapRef = useRef(null);

  // Barangay coordinates mapping for Bogo City, Cebu, Philippines
  // Bogo City Center: [11.044526, 124.004376]
  // Coordinates are in format [latitude, longitude]
  const barangayCoordinates = {
    'Taytayan': [11.0488, 123.9919],
    'Barangay Taytayan': [11.0488, 123.9919],
    'Barangay 1': [11.0500, 124.0100],
    'Barangay 2': [11.0450, 124.0050],
    'Barangay 3': [11.0400, 124.0000],
    'Barangay 4': [11.0350, 124.0080],
    'Barangay 5': [11.0480, 124.0030],
    'Barangay 6': [11.0420, 124.0120],
    'Barangay 7': [11.0380, 124.0060],
    'Barangay 8': [11.0520, 124.0070],
    'Barangay 9': [11.0460, 124.0020],
    'Barangay 10': [11.0410, 124.0090],
    // Add more barangays as needed with their actual coordinates
  };

  // Fetch treatment records and process by barangay
  useEffect(() => {
    fetchBarangayData();
  }, []);

  const fetchBarangayData = async () => {
    try {
      setLoading(true);
      const { data, error } = await getAllAppointments();
      
      if (error) {
        console.error('Error fetching appointments:', error);
        setLoading(false);
        return;
      }

      // Group by barangay using place_bitten from appointments table
      const barangayCounts = {};
      const barangayCases = {};

      (data || []).forEach(appointment => {
        const barangay = appointment.place_bitten;
        if (barangay && barangay.trim()) {
          const normalizedBarangay = barangay.trim();
          barangayCounts[normalizedBarangay] = (barangayCounts[normalizedBarangay] || 0) + 1;
          
          if (!barangayCases[normalizedBarangay]) {
            barangayCases[normalizedBarangay] = [];
          }
          barangayCases[normalizedBarangay].push(appointment);
        }
      });

      // Log unique barangay names found in database (for debugging/updating coordinates)
      const uniqueBarangays = Object.keys(barangayCounts);
      console.log('Barangays found in database:', uniqueBarangays);
      console.log('Barangay counts:', barangayCounts);

      // Create barangay data with coordinates
      const processedData = Object.entries(barangayCounts).map(([barangay, count]) => {
        // Normalize barangay name for matching (remove extra spaces, lowercase)
        const normalizedBarangay = barangay.trim().toLowerCase();
        
        // Try to find coordinates for this barangay (exact match first)
        let coords = barangayCoordinates[barangay] || 
                     barangayCoordinates[barangay.trim()];
        
        // If exact match not found, try case-insensitive match
        if (!coords) {
          const exactKey = Object.keys(barangayCoordinates).find(key => 
            key.trim().toLowerCase() === normalizedBarangay
          );
          coords = exactKey ? barangayCoordinates[exactKey] : null;
        }
        
        // If still not found, try to find similar barangay name (partial match)
        if (!coords) {
          const matchingKey = Object.keys(barangayCoordinates).find(key => {
            const normalizedKey = key.trim().toLowerCase();
            return normalizedBarangay.includes(normalizedKey) || 
                   normalizedKey.includes(normalizedBarangay) ||
                   normalizedBarangay.replace(/\s+/g, '') === normalizedKey.replace(/\s+/g, '');
          });
          coords = matchingKey ? barangayCoordinates[matchingKey] : null;
        }

        // If still no coordinates, use a default location within Bogo City with slight variation
        if (!coords) {
          // Log warning for missing coordinates
          console.warn(`⚠️ No coordinates found for barangay: "${barangay}". Using generated coordinates. Please add actual coordinates to barangayCoordinates mapping.`);
          
          // Generate approximate coordinates based on barangay name hash
          // Keep coordinates within Bogo City bounds
          const hash = barangay.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const latOffset = ((hash % 200) - 100) / 1000; // -0.1 to +0.1 degrees
          const lngOffset = (((hash * 7) % 200) - 100) / 1000; // -0.1 to +0.1 degrees
          // Bogo City center coordinates
          coords = [11.044526 + latOffset, 124.004376 + lngOffset];
        } else {
          // Log successful coordinate match for debugging
          console.log(`✓ Found coordinates for "${barangay}": [${coords[0]}, ${coords[1]}]`);
        }

        return {
          barangay,
          count,
          coordinates: coords,
          cases: barangayCases[barangay]
        };
      });

      // Sort by count (descending)
      processedData.sort((a, b) => b.count - a.count);
      setBarangayData(processedData);
      setLoading(false);

      // Update heatmap if map is already initialized
      if (map && window.L && (window.L.heatLayer || window.heatLayer)) {
        updateHeatmap(processedData);
      }
    } catch (error) {
      console.error('Error processing barangay data:', error);
      setLoading(false);
    }
  };

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
        // Load Leaflet Heat plugin
        const heatScript = document.createElement('script');
        heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        heatScript.onload = () => {
          initializeMap();
        };
        document.head.appendChild(heatScript);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateHeatmap = (data) => {
    if (!map || !window.L) return;
    const heatLayerFn = window.L.heatLayer || window.heatLayer;
    if (!heatLayerFn) return;

    // Remove existing heatmap layer
    if (heatmapLayer) {
      map.removeLayer(heatmapLayer);
    }

    // Create heatmap points with intensity based on case count
    const heatPoints = [];
    data.forEach(item => {
      if (item.coordinates && item.count > 0) {
        // Intensity is based on case count (normalized to 0-1, with max intensity at 1.0)
        const maxCount = Math.max(...data.map(d => d.count), 1);
        const intensity = Math.min(item.count / maxCount, 1.0);
        
        // Add multiple points for higher case counts to create better heat visualization
        const pointMultiplier = Math.max(1, Math.floor(item.count / 5));
        for (let i = 0; i < pointMultiplier; i++) {
          // Add slight random variation to spread the heat
          const latOffset = (Math.random() - 0.5) * 0.01;
          const lngOffset = (Math.random() - 0.5) * 0.01;
          heatPoints.push([
            item.coordinates[0] + latOffset,
            item.coordinates[1] + lngOffset,
            intensity
          ]);
        }
      }
    });

    // Create heatmap layer with green to red gradient (like the reference image)
    const heat = heatLayerFn(heatPoints, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.3,
      gradient: {
        0.0: 'green',      // Low intensity - green
        0.2: 'lime',       // Light green
        0.4: 'yellow',     // Yellow
        0.6: 'orange',      // Orange
        0.8: 'red',         // Red
        1.0: 'darkred'      // High intensity - dark red
      }
    });

    heat.addTo(map);
    setHeatmapLayer(heat);
  };

  const initializeMap = () => {
    if (!window.L) return;

    // Bogo City, Cebu, Philippines coordinates (City Center)
    const bogoCityCenter = [11.044526, 124.004376];

    // Initialize map centered on Bogo City with optimal zoom for city view
    const mapInstance = window.L.map(mapRef.current).setView(bogoCityCenter, 14);

    // Set map bounds to strictly focus on Bogo City area only
    const bogoBounds = window.L.latLngBounds(
      [10.95, 123.95],  // Southwest corner - tighter bounds
      [11.15, 124.05]   // Northeast corner - tighter bounds
    );
    mapInstance.setMaxBounds(bogoBounds);
    mapInstance.setMinZoom(13);
    mapInstance.setMaxZoom(18);
    
    // Prevent dragging outside Bogo City bounds
    mapInstance.setMaxBounds(bogoBounds.pad(0.1));

    // Use CartoDB Positron tiles for a cleaner, modern design
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstance);

    // Add Bogo City center marker
    const cityCenterIcon = window.L.divIcon({
      className: 'bogo-city-center',
      html: `<div style="
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const cityMarker = window.L.marker(bogoCityCenter, { 
      icon: cityCenterIcon,
      zIndexOffset: 2000
    }).addTo(mapInstance);

    cityMarker.bindPopup(`
      <div style="min-width: 180px; text-align: center;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: 600;">
          Bogo City
        </h3>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">
          Cebu, Philippines
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
          City Center
        </p>
      </div>
    `);

    setMap(mapInstance);

    // Add markers for barangays once data is loaded
    if (barangayData.length > 0) {
      addBarangayMarkers(mapInstance, barangayData, highlightedBarangay);
      if (window.L.heatLayer || window.heatLayer) {
        updateHeatmap(barangayData);
      }
    }
  };

  // Get color based on case count
  const getColorByCount = (count) => {
    if (count >= 20) return '#ef4444'; // Red - High Risk
    if (count >= 10) return '#f97316'; // Orange - Medium Risk
    if (count >= 5) return '#eab308'; // Yellow - Low Risk
    return '#22c55e'; // Green - Minimal Risk
  };

  // Get risk level text
  const getRiskLevel = (count) => {
    if (count >= 20) return 'High Risk';
    if (count >= 10) return 'Medium Risk';
    if (count >= 5) return 'Low Risk';
    return 'Minimal Risk';
  };

  const addBarangayMarkers = (mapInstance, data, highlightBarangay = null) => {
    // Clear existing markers, labels, and colored areas
    if (mapInstance.barangayMarkers) {
      mapInstance.barangayMarkers.forEach(marker => mapInstance.removeLayer(marker));
    }
    if (mapInstance.barangayLabels) {
      mapInstance.barangayLabels.forEach(label => mapInstance.removeLayer(label));
    }
    if (mapInstance.barangayAreas) {
      mapInstance.barangayAreas.forEach(area => mapInstance.removeLayer(area));
    }
    mapInstance.barangayMarkers = [];
    mapInstance.barangayLabels = [];
    mapInstance.barangayAreas = [];

    // Calculate max count for opacity scaling
    const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count), 1) : 1;

    data.forEach(item => {
      if (item.coordinates) {
        // Determine marker color based on case count
        let markerColor = 'green';
        if (item.count >= 20) markerColor = 'red';
        else if (item.count >= 10) markerColor = 'orange';
        else if (item.count >= 5) markerColor = 'yellow';

        // Create custom icon with color
        const icon = window.L.icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const marker = window.L.marker(item.coordinates, { icon })
          .bindPopup(`
            <div style="min-width: 150px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${item.barangay}</h3>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong style="color: #ef4444;">${item.count}</strong> case${item.count !== 1 ? 's' : ''}
              </p>
            </div>
          `);

        // Add label for barangay name (like city labels in reference image)
        const isHighlighted = highlightBarangay && 
          item.barangay.toLowerCase() === highlightBarangay.toLowerCase();
        
        const label = window.L.marker(item.coordinates, {
          icon: window.L.divIcon({
            className: 'barangay-label',
            html: `<div style="
              background-color: ${isHighlighted ? '#fef3c7' : 'rgba(255, 255, 255, 0.95)'};
              border: 2px solid ${isHighlighted ? '#f59e0b' : '#3b82f6'};
              border-radius: 6px;
              padding: 4px 10px;
              font-size: 12px;
              font-weight: 600;
              color: #1f2937;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              pointer-events: none;
            ">${item.barangay} <span style="color: #6b7280; font-weight: 500;">(${item.count})</span></div>`,
            iconSize: [120, 30],
            iconAnchor: [60, 15]
          }),
          zIndexOffset: 1000
        });

        // Create colored polygon area for this barangay (representing the whole barangay)
        // All barangays have the same size - color represents case count
        const areaColor = getColorByCount(item.count);
        
        // Fixed size for all barangays (representing actual barangay boundaries)
        // Approximately 1.5-2 km barangay area
        const polygonSize = 0.015; // Fixed size in degrees (approximately 1.6 km)
        
        // Create a square polygon representing the barangay area
        // Using the coordinate as center, create corners of a square
        const [centerLat, centerLng] = item.coordinates;
        const halfSize = polygonSize / 2;
        
        const polygonBounds = [
          [centerLat - halfSize, centerLng - halfSize], // Southwest
          [centerLat - halfSize, centerLng + halfSize], // Southeast
          [centerLat + halfSize, centerLng + halfSize], // Northeast
          [centerLat + halfSize, centerLng - halfSize]  // Northwest
        ];
        
        // Calculate opacity based on case count for visual intensity
        // Higher cases = more opaque, lower cases = more transparent
        const opacityIntensity = Math.min(0.4 + (item.count / maxCount) * 0.35, 0.75);
        
        const coloredArea = window.L.polygon(polygonBounds, {
          fillColor: areaColor,
          fillOpacity: opacityIntensity,
          color: areaColor,
          weight: 3,
          opacity: 1.0,
          smoothFactor: 1
        });

        // Store original opacity for hover effect
        coloredArea.originalOpacity = opacityIntensity;

        // Add click handler to show case information
        coloredArea.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1f2937; font-weight: 600; border-bottom: 2px solid ${areaColor}; padding-bottom: 8px;">
              ${item.barangay}
            </h3>
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 32px; font-weight: 700; color: ${areaColor};">
                  ${item.count}
                </span>
                <span style="font-size: 14px; color: #6b7280;">
                  case${item.count !== 1 ? 's' : ''}
                </span>
              </div>
              <div style="padding: 6px 12px; background-color: ${areaColor}20; border-radius: 6px; display: inline-block;">
                <span style="font-size: 12px; font-weight: 600; color: ${areaColor};">
                  ${getRiskLevel(item.count)}
                </span>
              </div>
            </div>
            <p style="margin: 0; font-size: 12px; color: #9ca3af; font-style: italic;">
              Click to view details
            </p>
          </div>
        `);

        // Add hover effect - brighten on hover
        coloredArea.on('mouseover', function(e) {
          this.setStyle({
            fillOpacity: Math.min(this.originalOpacity + 0.2, 0.9),
            weight: 4
          });
        });

        coloredArea.on('mouseout', function(e) {
          this.setStyle({
            fillOpacity: this.originalOpacity,
            weight: 3
          });
        });

        if (showColoredAreas) {
          coloredArea.addTo(mapInstance);
        }

        if (showMarkers) {
          marker.addTo(mapInstance);
        }
        label.addTo(mapInstance);

        mapInstance.barangayMarkers.push(marker);
        mapInstance.barangayLabels.push(label);
        mapInstance.barangayAreas.push(coloredArea);
      }
    });
  };

  // Check for highlighted barangay from sessionStorage
  useEffect(() => {
    const highlight = sessionStorage.getItem('highlightBarangay');
    if (highlight) {
      setHighlightedBarangay(highlight);
      sessionStorage.removeItem('highlightBarangay');
    }
  }, []);

  // Update markers when barangay data changes
  useEffect(() => {
    if (map && barangayData.length > 0) {
      addBarangayMarkers(map, barangayData, highlightedBarangay);
      if (window.L.heatLayer || window.heatLayer) {
        updateHeatmap(barangayData);
      }
      
      // If there's a highlighted barangay, zoom to it
      if (highlightedBarangay) {
        setTimeout(() => {
          const barangay = barangayData.find(b => 
            b.barangay.toLowerCase() === highlightedBarangay.toLowerCase()
          );
          if (barangay && barangay.coordinates) {
            map.setView(barangay.coordinates, 14);
            // Open popup for highlighted barangay
            const marker = map.barangayMarkers?.find(m => {
              const lat = m.getLatLng().lat;
              const lng = m.getLatLng().lng;
              return Math.abs(lat - barangay.coordinates[0]) < 0.001 && 
                     Math.abs(lng - barangay.coordinates[1]) < 0.001;
            });
            if (marker) {
              marker.openPopup();
            }
          }
        }, 500);
      }
    }
  }, [barangayData, map, highlightedBarangay, showMarkers, showColoredAreas]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle heatmap visibility
  useEffect(() => {
    if (map && heatmapLayer) {
      if (showHeatmap) {
        map.addLayer(heatmapLayer);
      } else {
        map.removeLayer(heatmapLayer);
      }
    }
  }, [showHeatmap, map, heatmapLayer]);

  // Toggle colored areas visibility
  useEffect(() => {
    if (map && map.barangayAreas) {
      map.barangayAreas.forEach(area => {
        if (showColoredAreas) {
          map.addLayer(area);
        } else {
          map.removeLayer(area);
        }
      });
    }
  }, [showColoredAreas, map]);

  // Toggle markers visibility
  useEffect(() => {
    if (map && map.barangayMarkers) {
      map.barangayMarkers.forEach(marker => {
        if (showMarkers) {
          map.addLayer(marker);
        } else {
          map.removeLayer(marker);
        }
      });
    }
    // Labels always visible
  }, [showMarkers, map]);

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
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: '600' }}>
            Bogo City, Cebu - Case Distribution
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Barangay areas colored by case count - Click areas to view case details
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showColoredAreas}
              onChange={(e) => setShowColoredAreas(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', color: '#374151' }}>Barangay Areas</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', color: '#374151' }}>Heatmap</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', color: '#374151' }}>Markers</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', backgroundColor: 'white' }}>
        {/* Map Container */}
        <div style={{
          position: 'relative',
          flex: 1,
          height: '600px',
          backgroundColor: '#f8fafc'
        }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              backgroundColor: 'white',
              padding: '15px 25px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <p style={{ margin: 0, color: '#6b7280' }}>Loading case data...</p>
            </div>
          )}
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '100%',
              borderRadius: '0 0 0 12px',
              border: '1px solid #e5e7eb',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}
          />
        </div>

        {/* Legend and Barangay List */}
        <div style={{
          width: '300px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '0 0 12px 0',
          borderLeft: '1px solid #e5e7eb',
          overflowY: 'auto',
          maxHeight: '600px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
            Barangay Case Count
          </h3>
          
          {/* Colored Areas Legend */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Barangay Areas (Click to view cases):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#ef4444', opacity: 0.5, border: '2px solid #ef4444' }}></div>
                <span style={{ color: '#6b7280' }}>20+ cases (High Risk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#f97316', opacity: 0.5, border: '2px solid #f97316' }}></div>
                <span style={{ color: '#6b7280' }}>10-19 cases (Medium Risk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#eab308', opacity: 0.5, border: '2px solid #eab308' }}></div>
                <span style={{ color: '#6b7280' }}>5-9 cases (Low Risk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#22c55e', opacity: 0.5, border: '2px solid #22c55e' }}></div>
                <span style={{ color: '#6b7280' }}>&lt;5 cases (Minimal Risk)</span>
              </div>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
              All barangay areas are the same size. Color intensity indicates case count. Click to see details.
            </p>
          </div>

          {/* Heatmap Legend */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Heatmap Intensity:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '150px', 
                height: '20px', 
                background: 'linear-gradient(to right, green, lime, yellow, orange, red, darkred)',
                borderRadius: '4px'
              }}></div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Low → High
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
              Green = Low cases | Red = High cases
            </div>
          </div>

          {/* Marker Legend */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Marker Colors:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>●</span>
                <span style={{ color: '#6b7280' }}>20+ cases (High Risk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f97316', fontWeight: '600' }}>●</span>
                <span style={{ color: '#6b7280' }}>10-19 cases (Medium Risk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#eab308', fontWeight: '600' }}>●</span>
                <span style={{ color: '#6b7280' }}>5-9 cases (Low Risk)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#22c55e', fontWeight: '600' }}>●</span>
                <span style={{ color: '#6b7280' }}>&lt;5 cases (Minimal Risk)</span>
              </div>
            </div>
          </div>

          {/* Barangay List */}
          {barangayData.length > 0 ? (
            <div>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Top Barangays by Case Count:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {barangayData.map((item, index) => {
                  let riskColor = '#22c55e';
                  let riskLevel = 'Minimal';
                  if (item.count >= 20) {
                    riskColor = '#ef4444';
                    riskLevel = 'High';
                  } else if (item.count >= 10) {
                    riskColor = '#f97316';
                    riskLevel = 'Medium';
                  } else if (item.count >= 5) {
                    riskColor = '#eab308';
                    riskLevel = 'Low';
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${riskColor}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                      onClick={() => {
                        if (map && item.coordinates) {
                          map.setView(item.coordinates, 15);
                          // Open popup for this barangay (prefer colored area, fallback to marker)
                          const area = map.barangayAreas?.find(a => {
                            const lat = a.getLatLng().lat;
                            const lng = a.getLatLng().lng;
                            return Math.abs(lat - item.coordinates[0]) < 0.001 && 
                                   Math.abs(lng - item.coordinates[1]) < 0.001;
                          });
                          if (area) {
                            area.openPopup();
                          } else {
                            const marker = map.barangayMarkers?.find(m => {
                              const lat = m.getLatLng().lat;
                              const lng = m.getLatLng().lng;
                              return Math.abs(lat - item.coordinates[0]) < 0.001 && 
                                     Math.abs(lng - item.coordinates[1]) < 0.001;
                            });
                            if (marker) {
                              marker.openPopup();
                            }
                          }
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                            {item.barangay}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            {item.count} case{item.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: `${riskColor}20`,
                          color: riskColor,
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {riskLevel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !loading && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                <p>No case data available</p>
                <p style={{ fontSize: '12px', marginTop: '5px' }}>
                  Appointments with barangay information will appear here
                </p>
              </div>
            )
          )}

          {/* Summary Stats */}
          {barangayData.length > 0 && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#eff6ff', 
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                Summary:
              </p>
              <div style={{ fontSize: '13px', color: '#1e3a8a' }}>
                <p style={{ margin: '4px 0' }}>
                  Total Barangays: <strong>{barangayData.length}</strong>
                </p>
                <p style={{ margin: '4px 0' }}>
                  Total Cases: <strong>{barangayData.reduce((sum, item) => sum + item.count, 0)}</strong>
                </p>
                <p style={{ margin: '4px 0' }}>
                  Highest: <strong>{barangayData[0]?.barangay}</strong> ({barangayData[0]?.count} cases)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export function to get barangay case count (for use in other components)
export const getBarangayCaseCount = async (barangayName) => {
  try {
    const { data, error } = await getAllAppointments();
    if (error || !data) return 0;
    
    const count = data.filter(appointment => 
      appointment.place_bitten && 
      appointment.place_bitten.trim().toLowerCase() === barangayName.trim().toLowerCase()
    ).length;
    
    return count;
  } catch (error) {
    console.error('Error getting barangay case count:', error);
    return 0;
  }
};

// Export function to get all barangay data
export const getAllBarangayData = async () => {
  try {
    const { data, error } = await getAllAppointments();
    if (error || !data) return {};
    
    const barangayCounts = {};
    (data || []).forEach(appointment => {
      const barangay = appointment.place_bitten;
      if (barangay && barangay.trim()) {
        const normalizedBarangay = barangay.trim();
        barangayCounts[normalizedBarangay] = (barangayCounts[normalizedBarangay] || 0) + 1;
      }
    });
    
    return barangayCounts;
  } catch (error) {
    console.error('Error getting barangay data:', error);
    return {};
  }
};

export default Map; 