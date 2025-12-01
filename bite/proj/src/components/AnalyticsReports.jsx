import React, { useState, useEffect } from 'react';
import { getAllAppointments } from '../supabase';

const AnalyticsReports = () => {
  const [selectedFilter, setSelectedFilter] = useState('month');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch appointments from database
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await getAllAppointments();
      
      if (fetchError) {
        setError(fetchError.message);
        setAppointments([]);
      } else {
        setAppointments(data || []);
      }
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments based on selected period
  const getFilteredAppointments = () => {
    if (!appointments.length) return [];
    
    const currentYear = parseInt(selectedPeriod);
    const now = new Date();
    
    let filtered = appointments;
    
    // Filter by year
    filtered = filtered.filter(apt => {
      if (!apt.appointment_date) return false;
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getFullYear() === currentYear;
    });
    
    // Additional filter by selectedFilter (week/month/year)
    if (selectedFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= weekAgo;
      });
    } else if (selectedFilter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= monthAgo;
      });
    }
    // 'year' filter is already handled by year selection
    
    return filtered;
  };

  // Process time data from time_bitten field in appointments table
  const getTimeData = () => {
    const filtered = getFilteredAppointments();
    const timeSlots = [
      { time: '6:00 AM', start: 6, end: 8 },
      { time: '8:00 AM', start: 8, end: 10 },
      { time: '10:00 AM', start: 10, end: 12 },
      { time: '12:00 PM', start: 12, end: 14 },
      { time: '2:00 PM', start: 14, end: 16 },
      { time: '4:00 PM', start: 16, end: 18 },
      { time: '6:00 PM', start: 18, end: 20 },
      { time: '8:00 PM', start: 20, end: 22 }
    ];

    return timeSlots.map(slot => {
      const count = filtered.filter(apt => {
        if (!apt.time_bitten) return false;
        
        try {
          // Handle different time formats from time_bitten field
          // Could be "HH:MM:SS", "HH:MM", or just "HH:MM" string
          const timeStr = apt.time_bitten.toString().trim();
          
          // Parse hour from time string (handles HH:MM:SS or HH:MM format)
          const timeParts = timeStr.split(':');
          if (timeParts.length === 0) return false;
          
          const hour = parseInt(timeParts[0], 10);
          
          // Validate hour is a number and within valid range
          if (isNaN(hour) || hour < 0 || hour >= 24) return false;
          
          // Check if hour falls within the time slot range
          return hour >= slot.start && hour < slot.end;
        } catch (error) {
          // If parsing fails, skip this appointment
          console.warn('Error parsing time_bitten:', apt.time_bitten, error);
          return false;
        }
      }).length;
      return { ...slot, count };
    });
  };

  // Process animal type data from biting_animal field
  const getAnimalTypeData = () => {
    const filtered = getFilteredAppointments();
    const animalCounts = {};
    
    filtered.forEach(apt => {
      if (apt.biting_animal) {
        const animal = apt.biting_animal.trim();
        if (animal) {
          // Use the actual animal name from the database
          // Normalize common variations but keep original names
          let normalizedAnimal = animal;
          
          // Normalize common variations while preserving the original value
          const lowerAnimal = animal.toLowerCase();
          if (lowerAnimal.includes('dog') || lowerAnimal === 'dog') {
            normalizedAnimal = 'Dog';
          } else if (lowerAnimal.includes('cat') || lowerAnimal === 'cat') {
            normalizedAnimal = 'Cat';
          } else if (lowerAnimal.includes('rat') || lowerAnimal === 'rat') {
            normalizedAnimal = 'Rat';
          } else if (lowerAnimal.includes('monkey') || lowerAnimal === 'monkey') {
            normalizedAnimal = 'Monkey';
          } else if (lowerAnimal.includes('bat') || lowerAnimal === 'bat') {
            normalizedAnimal = 'Bat';
          } else {
            // Keep original name but capitalize first letter
            normalizedAnimal = animal.charAt(0).toUpperCase() + animal.slice(1).toLowerCase();
          }
          
          animalCounts[normalizedAnimal] = (animalCounts[normalizedAnimal] || 0) + 1;
        }
      }
    });
    
    const total = Object.values(animalCounts).reduce((sum, count) => sum + count, 0);
    
    // Color palette for different animal types
    const colorPalette = [
      '#3b82f6', // Blue - Dog
      '#f59e0b', // Orange - Cat
      '#10b981', // Green - Rat
      '#8b5cf6', // Purple - Monkey
      '#ef4444', // Red - Bat
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#6366f1'  // Indigo
    ];
    
    // Sort by count (descending) and assign colors
    const sortedAnimals = Object.entries(animalCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count], index) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colorPalette[index % colorPalette.length] || '#64748b'
      }));
    
    return sortedAnimals;
  };

  // Process victim age data
  const getVictimAgeData = () => {
    const filtered = getFilteredAppointments();
    const ageGroups = {
      '0-10 years': 0,
      '11-20 years': 0,
      '21-30 years': 0,
      '31-40 years': 0,
      '41-50 years': 0,
      '51+ years': 0
    };
    
    filtered.forEach(apt => {
      if (apt.patient_age) {
        const age = parseInt(apt.patient_age);
        if (age >= 0 && age <= 10) ageGroups['0-10 years']++;
        else if (age >= 11 && age <= 20) ageGroups['11-20 years']++;
        else if (age >= 21 && age <= 30) ageGroups['21-30 years']++;
        else if (age >= 31 && age <= 40) ageGroups['31-40 years']++;
        else if (age >= 41 && age <= 50) ageGroups['41-50 years']++;
        else if (age >= 51) ageGroups['51+ years']++;
      }
    });
    
    const total = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(ageGroups).map(([age, count]) => ({
      age,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  // Process yearly data
  const getYearlyData = () => {
    const yearCounts = {};
    
    appointments.forEach(apt => {
      if (apt.appointment_date) {
        const year = new Date(apt.appointment_date).getFullYear();
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    
    const years = Object.keys(yearCounts).sort().map(y => parseInt(y));
    if (years.length === 0) {
      // If no data, show last 5 years including current year
      const currentYear = new Date().getFullYear();
      const result = [];
      for (let year = currentYear - 4; year <= currentYear; year++) {
        result.push({
          year: year.toString(),
          cases: 0
        });
      }
      return result;
    }
    
    const minYear = Math.min(...years, new Date().getFullYear() - 4);
    const maxYear = Math.max(...years, new Date().getFullYear());
    
    const result = [];
    for (let year = minYear; year <= maxYear; year++) {
      result.push({
        year: year.toString(),
        cases: yearCounts[year] || 0
      });
    }
    
    return result;
  };

  // Process monthly trend data
  const getBiteTrendData = () => {
    const filtered = getFilteredAppointments();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthCounts = {};
    
    filtered.forEach(apt => {
      if (apt.appointment_date) {
        const date = new Date(apt.appointment_date);
        const month = date.getMonth();
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    
    return monthNames.map((month, index) => ({
      month,
      cases: monthCounts[index] || 0
    }));
  };

  // Get computed data
  const timeData = getTimeData();
  const animalTypeData = getAnimalTypeData();
  const victimAgeData = getVictimAgeData();
  const yearlyData = getYearlyData();
  const biteTrendData = getBiteTrendData();

  // Get available years from appointments
  const getAvailableYears = () => {
    const years = new Set();
    appointments.forEach(apt => {
      if (apt.appointment_date) {
        const year = new Date(apt.appointment_date).getFullYear();
        years.add(year);
      }
    });
    const currentYear = new Date().getFullYear();
    years.add(currentYear); // Always include current year
    return Array.from(years).sort((a, b) => b - a);
  };

  // Calculate pie chart angles
  const totalCases = animalTypeData.reduce((sum, item) => sum + item.count, 0);
  let currentAngle = 0;
  const pieSegments = animalTypeData.map(item => {
    const angle = totalCases > 0 ? (item.count / totalCases) * 360 : 0;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      angle
    };
  });

  // Get max values for chart scaling
  const maxYearlyCases = yearlyData.length > 0 ? Math.max(...yearlyData.map(d => d.cases), 1) : 250;
  const maxMonthlyCases = biteTrendData.length > 0 ? Math.max(...biteTrendData.map(d => d.cases), 1) : 42;
  const maxTimeCount = timeData.length > 0 ? Math.max(...timeData.map(d => d.count), 1) : 25;

  if (loading) {
    return (
      <div className="content-section">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-section">
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <p>Error loading data: {error}</p>
          <button onClick={fetchAppointments} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="analytics-header">
        <div className="header-content">
          <h2>Analytics Reports</h2>
          <p>Comprehensive bite case analysis and trends</p>
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Time Period:</label>
            <select 
              className="filter-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Year:</label>
            <select 
              className="filter-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {getAvailableYears().map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
  
       
      {/* Charts Section */}
      <div className="charts-container">
        {/* Yearly Trend Line Chart */}
        <div className="chart-panel">
          <h3>Yearly Bite Cases Trend</h3>
          <div className="chart-content">
            <div className="line-chart">
              <div className="chart-grid">
                <div className="y-axis">
                  <span>{Math.ceil(maxYearlyCases)}</span>
                  <span>{Math.ceil(maxYearlyCases * 0.8)}</span>
                  <span>{Math.ceil(maxYearlyCases * 0.6)}</span>
                  <span>{Math.ceil(maxYearlyCases * 0.4)}</span>
                  <span>{Math.ceil(maxYearlyCases * 0.2)}</span>
                  <span>0</span>
                </div>
                <div className="chart-area">
                  {yearlyData.length > 0 ? (
                    <>
                      <svg className="line-chart-svg" viewBox="0 0 400 250">
                        <defs>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[0, maxYearlyCases * 0.2, maxYearlyCases * 0.4, maxYearlyCases * 0.6, maxYearlyCases * 0.8, maxYearlyCases].map((y, index) => (
                          <line
                            key={index}
                            x1="0"
                            y1={250 - (y / maxYearlyCases) * 250}
                            x2="400"
                            y2={250 - (y / maxYearlyCases) * 250}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                        ))}
                        {/* Line chart */}
                        {yearlyData.length > 1 && (
                          <>
                            <polyline
                              points={yearlyData.map((data, index) => 
                                `${(index / (yearlyData.length - 1)) * 350 + 25},${250 - (data.cases / maxYearlyCases) * 250}`
                              ).join(' ')}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                            />
                            {/* Area fill */}
                            <polygon
                              points={`25,250 ${yearlyData.map((data, index) => 
                                `${(index / (yearlyData.length - 1)) * 350 + 25},${250 - (data.cases / maxYearlyCases) * 250}`
                              ).join(' ')} 375,250`}
                              fill="url(#lineGradient)"
                            />
                          </>
                        )}
                        {/* Data points */}
                        {yearlyData.map((data, index) => (
                          <circle
                            key={index}
                            cx={yearlyData.length > 1 ? (index / (yearlyData.length - 1)) * 350 + 25 : 200}
                            cy={250 - (data.cases / maxYearlyCases) * 250}
                            r="6"
                            fill="#3b82f6"
                            stroke="white"
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                      <div className="x-axis">
                        {yearlyData.map((data, index) => (
                          <span key={index} className="x-label">{data.year}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No data available for selected period
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animal Type Pie Chart */}
        <div className="chart-panel">
          <h3>Bite Cases by Animal Type</h3>
          <div className="chart-content">
            <div className="pie-chart">
              {totalCases > 0 ? (
                <>
                  <svg className="pie-chart-svg" viewBox="0 0 200 200">
                    {pieSegments.map((segment, index) => (
                      <path
                        key={index}
                        d={`M 100 100 L ${100 + 80 * Math.cos(segment.startAngle * Math.PI / 180)} ${100 + 80 * Math.sin(segment.startAngle * Math.PI / 180)} A 80 80 0 ${segment.angle > 180 ? 1 : 0} 1 ${100 + 80 * Math.cos(segment.endAngle * Math.PI / 180)} ${100 + 80 * Math.sin(segment.endAngle * Math.PI / 180)} Z`}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="2"
                      />
                    ))}
                    <circle cx="100" cy="100" r="30" fill="white" />
                    <text x="100" y="105" textAnchor="middle" fontSize="12" fill="#64748b">
                      {totalCases}
                    </text>
                  </svg>
                  <div className="pie-legend">
                    {pieSegments.map((segment, index) => (
                      <div key={index} className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: segment.color }}></div>
                        <div className="legend-text">
                          <span className="legend-label">{segment.type}</span>
                          <span className="legend-value">{segment.count} cases ({segment.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No animal type data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend and Time Analysis */}
      <div className="charts-container">
        {/* Monthly Trend Chart */}
        <div className="chart-panel">
          <h3>Monthly Bite Cases Trend</h3>
          <div className="chart-content">
            <div className="chart-bars">
              {biteTrendData.map((data, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${(data.cases / maxMonthlyCases) * 200}px` }}
                  >
                    <span className="bar-value">{data.cases}</span>
                  </div>
                  <span className="bar-label">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time Analysis Chart */}
        <div className="chart-panel">
          <h3>Bite Incidents by Time of Day</h3>
          <div className="chart-content">
            <div className="time-chart">
              {timeData.length > 0 ? (
                timeData.map((data, index) => (
                  <div key={index} className="time-bar-container">
                    <div className="time-bar">
                      <div 
                        className="time-bar-fill" 
                        style={{ width: `${(data.count / maxTimeCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="time-info">
                      <span className="time-label">{data.time}</span>
                      <span className="time-count">{data.count} cases</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No time data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Age Group Analysis Table */}
      <div className="analysis-tables">
        <div className="analysis-panel">
          <h3>Victim Age Distribution</h3>
          <div className="table-container">
            <table className="analysis-table">
              <thead>
                <tr>
                  <th>Age Group</th>
                  <th>Cases</th>
                  <th>Percentage</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {victimAgeData.length > 0 ? (
                  victimAgeData.map((data, index) => (
                    <tr key={index}>
                      <td>{data.age}</td>
                      <td>{data.count}</td>
                      <td>{data.percentage}%</td>
                      <td>
                        <span className={`risk-level ${data.percentage > 20 ? 'high' : data.percentage > 15 ? 'medium' : 'low'}`}>
                          {data.percentage > 20 ? 'High' : data.percentage > 15 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      No age data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          {(() => {
            // Calculate peak hours
            const peakTimeSlot = timeData.length > 0 ? timeData.reduce((max, slot) => slot.count > max.count ? slot : max, timeData[0]) : null;
            const peakHoursText = peakTimeSlot ? `Most bite incidents occur during ${peakTimeSlot.time} (${peakTimeSlot.count} cases), likely due to increased outdoor activities.` : 'Time data not available.';
            
            // Calculate dominant animal type
            const dominantAnimal = animalTypeData.length > 0 ? animalTypeData.reduce((max, animal) => animal.count > max.count ? animal : max, animalTypeData[0]) : null;
            const animalText = dominantAnimal ? `${dominantAnimal.type} accounts for ${dominantAnimal.percentage}% of all bite cases (${dominantAnimal.count} cases), making them the primary concern for public safety.` : 'Animal type data not available.';
            
            // Calculate most vulnerable age group
            const vulnerableAge = victimAgeData.length > 0 ? victimAgeData.reduce((max, age) => age.count > max.count ? age : max, victimAgeData[0]) : null;
            const ageText = vulnerableAge ? `The ${vulnerableAge.age} age group is most at risk with ${vulnerableAge.count} cases (${vulnerableAge.percentage}%), possibly due to increased interaction with animals.` : 'Age data not available.';
            
            // Calculate peak month
            const peakMonth = biteTrendData.length > 0 ? biteTrendData.reduce((max, month) => month.cases > max.cases ? month : max, biteTrendData[0]) : null;
            const seasonalText = peakMonth ? `Bite cases peak during ${peakMonth.month} with ${peakMonth.cases} cases, when outdoor activities may increase.` : 'Monthly trend data not available.';
            
            return (
              <>
                <div className="insight-card">
                  <div className="insight-icon">⚠️</div>
                  <h4>Peak Hours</h4>
                  <p>{peakHoursText}</p>
                </div>
                <div className="insight-card">
                  <div className="insight-icon">🐕</div>
                  <h4>Animal Type Dominance</h4>
                  <p>{animalText}</p>
                </div>
                <div className="insight-card">
                  <div className="insight-icon">👥</div>
                  <h4>Age Vulnerability</h4>
                  <p>{ageText}</p>
                </div>
                <div className="insight-card">
                  <div className="insight-icon">📈</div>
                  <h4>Seasonal Trend</h4>
                  <p>{seasonalText}</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports; 