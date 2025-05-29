
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import PostRegistrationSetup from "@/components/PostRegistrationSetup";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Protected Pages
import FoodCost from "./pages/FoodCost";
import MenuEngineering from "./pages/MenuEngineering";
import Recipes from "./pages/Recipes";
import Inventory from "./pages/Inventory";
import DemandForecast from "./pages/DemandForecast";
import CustomerAnalysis from "./pages/CustomerAnalysis";
import ProductionPlanning from "./pages/ProductionPlanning";
import StaffDashboard from "./pages/StaffDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes - Auth pages */}
              <Route
                path="/login"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Register />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ForgotPassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <ProtectedRoute requireAuth={false}>
                    <ResetPassword />
                  </ProtectedRoute>
                }
              />

              {/* Setup route for post-registration */}
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <PostRegistrationSetup />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes - Main app */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Header />
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/food-cost"
                element={
                  <ProtectedRoute>
                    <Header />
                    <FoodCost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/menu-engineering"
                element={
                  <ProtectedRoute>
                    <Header />
                    <MenuEngineering />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recipes"
                element={
                  <ProtectedRoute>
                    <Header />
                    <Recipes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <Header />
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demand-forecast"
                element={
                  <ProtectedRoute>
                    <Header />
                    <DemandForecast />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer-analysis"
                element={
                  <ProtectedRoute>
                    <Header />
                    <CustomerAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/production-planning"
                element={
                  <ProtectedRoute>
                    <Header />
                    <ProductionPlanning />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff-dashboard"
                element={
                  <ProtectedRoute>
                    <Header />
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
