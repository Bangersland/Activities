import React, { useState } from 'react';

const AnalyticsReports = () => {
  const [selectedFilter, setSelectedFilter] = useState('month');
  const [selectedPeriod, setSelectedPeriod] = useState('2024');

  const timeData = [
    { time: '6:00 AM', count: 5 },
    { time: '8:00 AM', count: 12 },
    { time: '10:00 AM', count: 18 },
    { time: '12:00 PM', count: 15 },
    { time: '2:00 PM', count: 22 },
    { time: '4:00 PM', count: 25 },
    { time: '6:00 PM', count: 20 },
    { time: '8:00 PM', count: 8 }
  ];

  const animalTypeData = [
    { type: 'Dog', count: 156, percentage: 65, color: '#3b82f6' },
    { type: 'Cat', count: 45, percentage: 19, color: '#f59e0b' },
    { type: 'Other Animals', count: 38, percentage: 16, color: '#10b981' }
  ];

  const victimAgeData = [
    { age: '0-10 years', count: 45, percentage: 19 },
    { age: '11-20 years', count: 38, percentage: 16 },
    { age: '21-30 years', count: 52, percentage: 22 },
    { age: '31-40 years', count: 48, percentage: 20 },
    { age: '41-50 years', count: 32, percentage: 13 },
    { age: '51+ years', count: 24, percentage: 10 }
  ];

  const yearlyData = [
    { year: '2020', cases: 180 },
    { year: '2021', cases: 195 },
    { year: '2022', cases: 210 },
    { year: '2023', cases: 225 },
    { year: '2024', cases: 239 }
  ];

  const biteTrendData = [
    { month: 'Jan', cases: 18 },
    { month: 'Feb', cases: 22 },
    { month: 'Mar', cases: 25 },
    { month: 'Apr', cases: 28 },
    { month: 'May', cases: 32 },
    { month: 'Jun', cases: 35 },
    { month: 'Jul', cases: 38 },
    { month: 'Aug', cases: 42 },
    { month: 'Sep', cases: 39 },
    { month: 'Oct', cases: 36 },
    { month: 'Nov', cases: 31 },
    { month: 'Dec', cases: 28 }
  ];

  // Calculate pie chart angles
  const totalCases = animalTypeData.reduce((sum, item) => sum + item.count, 0);
  let currentAngle = 0;
  const pieSegments = animalTypeData.map(item => {
    const angle = (item.count / totalCases) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      angle
    };
  });

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
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
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
                  <span>250</span>
                  <span>200</span>
                  <span>150</span>
                  <span>100</span>
                  <span>50</span>
                  <span>0</span>
                </div>
                <div className="chart-area">
                  <svg className="line-chart-svg" viewBox="0 0 400 250">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    {[0, 50, 100, 150, 200, 250].map((y, index) => (
                      <line
                        key={index}
                        x1="0"
                        y1={250 - (y / 250) * 250}
                        x2="400"
                        y2={250 - (y / 250) * 250}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    ))}
                    {/* Line chart */}
                    <polyline
                      points={yearlyData.map((data, index) => 
                        `${(index / (yearlyData.length - 1)) * 350 + 25},${250 - (data.cases / 250) * 250}`
                      ).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                    {/* Area fill */}
                    <polygon
                      points={`25,250 ${yearlyData.map((data, index) => 
                        `${(index / (yearlyData.length - 1)) * 350 + 25},${250 - (data.cases / 250) * 250}`
                      ).join(' ')} 375,250`}
                      fill="url(#lineGradient)"
                    />
                    {/* Data points */}
                    {yearlyData.map((data, index) => (
                      <circle
                        key={index}
                        cx={(index / (yearlyData.length - 1)) * 350 + 25}
                        cy={250 - (data.cases / 250) * 250}
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
                    style={{ height: `${(data.cases / 42) * 200}px` }}
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
              {timeData.map((data, index) => (
                <div key={index} className="time-bar-container">
                  <div className="time-bar">
                    <div 
                      className="time-bar-fill" 
                      style={{ width: `${(data.count / 25) * 100}%` }}
                    ></div>
                  </div>
                  <div className="time-info">
                    <span className="time-label">{data.time}</span>
                    <span className="time-count">{data.count} cases</span>
                  </div>
                </div>
              ))}
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
                {victimAgeData.map((data, index) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">⚠️</div>
            <h4>Peak Hours</h4>
            <p>Most bite incidents occur between 2:00 PM and 6:00 PM, likely due to increased outdoor activities.</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🐕</div>
            <h4>Dog Dominance</h4>
            <p>Dogs account for 65% of all bite cases, making them the primary concern for public safety.</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">👥</div>
            <h4>Age Vulnerability</h4>
            <p>Adults aged 21-30 are most at risk, possibly due to increased interaction with animals.</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <h4>Seasonal Trend</h4>
            <p>Bite cases peak during summer months (June-August) when outdoor activities increase.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports; 