import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import './App.css';

const routerBase = process.env.PUBLIC_URL || '/ops-dashboard';

function App() {
  return (
    <div className="App">
      <BrowserRouter basename={routerBase}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
