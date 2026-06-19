import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import EyeExplore from '@/pages/EyeExplore';
import BreathPuzzle from '@/pages/BreathPuzzle';
import MemoryPalace from '@/pages/MemoryPalace';
import MemoryPalaceExplore from '@/pages/MemoryPalaceExplore';
import MemoryPalaceEditor from '@/pages/MemoryPalaceEditor';
import MemoryPalaceShare from '@/pages/MemoryPalaceShare';
import DriftBottle from '@/pages/DriftBottle';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/eye-explore" element={<EyeExplore />} />
        <Route path="/breath-puzzle" element={<BreathPuzzle />} />
        <Route path="/memory-palace" element={<MemoryPalace />} />
        <Route path="/memory-palace/:id" element={<MemoryPalaceExplore />} />
        <Route path="/memory-palace/:id/edit" element={<MemoryPalaceEditor />} />
        <Route path="/share/:code" element={<MemoryPalaceShare />} />
        <Route path="/drift-bottle" element={<DriftBottle />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
