import { Routes, Route, Navigate } from "react-router-dom";
import PublicEnquiry from "@/pages/PublicEnquiry";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
// The catch-all keeps every unknown URL on the public enquiry form instead of a blank page.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicEnquiry />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
