import React from 'react';

const StaffPatientHistory = () => {
  return (
    <div className="content-section">
      <h2>Patient History</h2>
      
      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search patients by name, ID, or contact..."
            className="search-input"
          />
          <button className="search-btn">
            <span>🔍</span>
          </button>
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="barangay-filter">Barangay:</label>
            <select id="barangay-filter" className="filter-select">
              <option value="">All Barangays</option>
              <option value="barangay-1">Barangay 1</option>
              <option value="barangay-2">Barangay 2</option>
              <option value="barangay-3">Barangay 3</option>
              <option value="barangay-4">Barangay 4</option>
              <option value="barangay-5">Barangay 5</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="year-filter">Year:</label>
            <select id="year-filter" className="filter-select">
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="month-filter">Month:</label>
            <select id="month-filter" className="filter-select">
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          
          <button className="btn-secondary clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Patient History Table */}
      <div className="table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Barangay</th>
              <th>Contact</th>
              <th>Last Visit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>P001</td>
              <td>Juan Dela Cruz</td>
              <td>35</td>
              <td>Male</td>
              <td>Barangay 1</td>
              <td>09123456789</td>
              <td>2024-01-15</td>
              <td><span className="status-active">Active</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
            <tr>
              <td>P002</td>
              <td>Maria Santos</td>
              <td>28</td>
              <td>Female</td>
              <td>Barangay 2</td>
              <td>09234567890</td>
              <td>2024-01-10</td>
              <td><span className="status-active">Active</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
            <tr>
              <td>P003</td>
              <td>Pedro Reyes</td>
              <td>45</td>
              <td>Male</td>
              <td>Barangay 3</td>
              <td>09345678901</td>
              <td>2024-01-08</td>
              <td><span className="status-inactive">Inactive</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
            <tr>
              <td>P004</td>
              <td>Ana Garcia</td>
              <td>32</td>
              <td>Female</td>
              <td>Barangay 1</td>
              <td>09456789012</td>
              <td>2024-01-12</td>
              <td><span className="status-active">Active</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
            <tr>
              <td>P005</td>
              <td>Luis Martinez</td>
              <td>50</td>
              <td>Male</td>
              <td>Barangay 4</td>
              <td>09567890123</td>
              <td>2024-01-05</td>
              <td><span className="status-active">Active</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
            <tr>
              <td>P006</td>
              <td>Carmen Lopez</td>
              <td>38</td>
              <td>Female</td>
              <td>Barangay 2</td>
              <td>09678901234</td>
              <td>2024-01-14</td>
              <td><span className="status-active">Active</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
            <tr>
              <td>P007</td>
              <td>Roberto Torres</td>
              <td>42</td>
              <td>Male</td>
              <td>Barangay 5</td>
              <td>09789012345</td>
              <td>2024-01-03</td>
              <td><span className="status-inactive">Inactive</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
            <tr>
              <td>P008</td>
              <td>Isabel Flores</td>
              <td>29</td>
              <td>Female</td>
              <td>Barangay 3</td>
              <td>09890123456</td>
              <td>2024-01-11</td>
              <td><span className="status-active">Active</span></td>
              <td>
                <button className="action-btn view-btn">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="pagination">
        <button className="pagination-btn">Previous</button>
        <span className="page-info">Page 1 of 5</span>
        <button className="pagination-btn">Next</button>
      </div>
    </div>
  );
};

export default StaffPatientHistory; 