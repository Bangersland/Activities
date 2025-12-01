import React, { useState, useEffect } from 'react';
import { getBarangayCaseCount } from './Map';

const BarangayCaseCount = ({ barangayName, showMapLink = true }) => {
  const [caseCount, setCaseCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (barangayName && barangayName.trim()) {
      fetchCaseCount();
    } else {
      setCaseCount(null);
      setLoading(false);
    }
  }, [barangayName]);

  const fetchCaseCount = async () => {
    try {
      setLoading(true);
      const count = await getBarangayCaseCount(barangayName);
      setCaseCount(count);
    } catch (error) {
      console.error('Error fetching case count:', error);
      setCaseCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (!barangayName || !barangayName.trim()) {
    return null;
  }

  if (loading) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: '#6b7280',
        marginLeft: '8px'
      }}>
        <span>Loading...</span>
      </div>
    );
  }

  const getRiskColor = (count) => {
    if (count >= 20) return '#ef4444'; // Red - High
    if (count >= 10) return '#f97316'; // Orange - Medium
    if (count >= 5) return '#eab308'; // Yellow - Low
    return '#22c55e'; // Green - Minimal
  };

  const getRiskLevel = (count) => {
    if (count >= 20) return 'High Risk';
    if (count >= 10) return 'Medium Risk';
    if (count >= 5) return 'Low Risk';
    return 'Minimal Risk';
  };

  const riskColor = getRiskColor(caseCount);
  const riskLevel = getRiskLevel(caseCount);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '4px',
      padding: '6px 12px',
      backgroundColor: `${riskColor}15`,
      borderRadius: '6px',
      border: `1px solid ${riskColor}40`,
      fontSize: '12px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: riskColor
      }}></div>
      <span style={{ color: '#374151', fontWeight: '500' }}>
        <strong style={{ color: riskColor }}>{caseCount}</strong> case{caseCount !== 1 ? 's' : ''} reported
      </span>
      <span style={{ 
        color: riskColor, 
        fontWeight: '600',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        ({riskLevel})
      </span>
      {showMapLink && (
        <a
          href="#/map"
          onClick={(e) => {
            e.preventDefault();
            // Navigate to map - you may need to adjust this based on your routing
            window.location.hash = '#/map';
          }}
          style={{
            marginLeft: '8px',
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          📍 View on Map
        </a>
      )}
    </div>
  );
};

export default BarangayCaseCount;

