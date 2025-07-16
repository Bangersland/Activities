import React from 'react';
import ReactDOM from 'react-dom/client';
import Timer from './time.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './timer.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Timer />
    </React.StrictMode>
);
