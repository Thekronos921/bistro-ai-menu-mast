import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PostRegistrationSetup from "@/components/PostRegistrationSetup";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Recipes from "./pages/Recipes";
import Inventory from "./pages/Inventory";
import MenuEngineering from "./pages/MenuEngineering";
import FoodCost from "./pages/FoodCost";
import ProductionPlanning from "./pages/ProductionPlanning";
import DemandForecast from "./pages/DemandForecast";
import CustomerAnalysis from "./pages/CustomerAnalysis";
import CassaInCloudIntegration from "./pages/CassaInCloudIntegration";
import EventCalendar from "./pages/EventCalendar";
import StaffDashboard from "./pages/StaffDashboard";
import LabelView from "./pages/LabelView";
import Reservations from "./pages/Reservations";
import ShiftManagementPage from "./components/shifts/ShiftManagementPage";
import NotFound from "./pages/NotFound";
import Configuration from "./pages/Configuration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes - without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/label/:id" element={<LabelView />} />
            
            {/* Protected routes - with layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <Index />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/configuration" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <Configuration />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/recipes" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <Recipes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <Inventory />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/menu-engineering" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <MenuEngineering />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/food-cost" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <FoodCost />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/production-planning" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <ProductionPlanning />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/demand-forecast" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <DemandForecast />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/customer-analysis" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <CustomerAnalysis />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/cassa-in-cloud" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <CassaInCloudIntegration />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <EventCalendar />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <StaffDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reservations" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <Reservations />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/gestione-turni" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Layout>
                  <ShiftManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
