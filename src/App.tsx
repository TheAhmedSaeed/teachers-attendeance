import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MainPage } from './pages/MainPage';
import { ConfigPage } from './pages/ConfigPage';
import { AbsencePage } from './pages/AbsencePage';
import { TardinessPage } from './pages/TardinessPage';
import { AbsenceReportPage } from './pages/AbsenceReportPage';
import { TardinessReportPage } from './pages/TardinessReportPage';
import { StatisticsPage } from './pages/StatisticsPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/absence" element={<AbsencePage />} />
          <Route path="/tardiness" element={<TardinessPage />} />
          <Route path="/absence-report" element={<AbsenceReportPage />} />
          <Route path="/tardiness-report" element={<TardinessReportPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
