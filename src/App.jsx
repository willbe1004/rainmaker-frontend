import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BidDetail from './pages/BidDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bids/:id" element={<BidDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
