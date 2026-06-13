import { Navigate, Route, Routes } from "react-router-dom";
import XenoShell from "./components/layout/XenoShell";
import CampaignsPage from "./pages/CampaignsPage";
import CopilotPage from "./pages/CopilotPage";
import CustomersPage from "./pages/CustomersPage";
import NotFoundPage from "./pages/NotFoundPage";
import TimelinePage from "./pages/TimelinePage";

const App = () => {
  return (
    <Routes>
      <Route element={<XenoShell />}>
        <Route path="/" element={<Navigate to="/copilot" replace />} />
        <Route path="/copilot" element={<CopilotPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/timeline/:campaignId" element={<TimelinePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
