import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import EmployeeLoginPage from "./pages/EmployeeLoginPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/customer/register" element={<CustomerRegisterPage />} />
          <Route path="/customer/login" element={<CustomerLoginPage />} />
          <Route path="/employee/login" element={<EmployeeLoginPage />} />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute actorType="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute actorType="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
