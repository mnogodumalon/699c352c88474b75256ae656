import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import ZutatendatenbankPage from '@/pages/ZutatendatenbankPage';
import AnalysenPage from '@/pages/AnalysenPage';
import AnalyseergebnissePage from '@/pages/AnalyseergebnissePage';
import SchnellanalysePage from '@/pages/SchnellanalysePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="zutatendatenbank" element={<ZutatendatenbankPage />} />
          <Route path="analysen" element={<AnalysenPage />} />
          <Route path="analyseergebnisse" element={<AnalyseergebnissePage />} />
          <Route path="schnellanalyse" element={<SchnellanalysePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}