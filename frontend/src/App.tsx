import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";


import CustomerLoginPage from "./pages/CustomerLoginPage";
import CustomerOnboardingPage from "./pages/CustomerOnboardingPage";

import EmployeeLoginPage from "./pages/EmployeeLoginPage";

import CustomerDashboard from "./pages/CustomerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

import AadhaarRegisterPage from "./pages/AadhaarRegisterPage";
import FaceEnrollPage from "./pages/FaceEnrollPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Landing */}
          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* Aadhaar Registration — new unified 5-step onboarding */}
          <Route
            path="/aadhaar/register"
            element={<CustomerOnboardingPage />}
          />

          {/* Legacy Aadhaar register (kept for backwards compatibility) */}
          <Route
            path="/aadhaar/register/legacy"
            element={<AadhaarRegisterPage />}
          />

          {/* Face Enrollment */}
          <Route
            path="/aadhaar/face-enroll"
            element={<FaceEnrollPage />}
          />

          {/* Customer Authentication */}
          <Route
            path="/customer/register"
            element={<CustomerOnboardingPage />}
          />

          <Route
            path="/customer/login"
            element={<CustomerLoginPage />}
          />

          {/* Employee Authentication */}
          <Route
            path="/employee/login"
            element={<EmployeeLoginPage />}
          />

          {/* Customer Dashboard */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute actorType="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Employee Dashboard */}
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