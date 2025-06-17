
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Recipes from "./pages/Recipes";
import MenuEngineering from "./pages/MenuEngineering";
import Inventory from "./pages/Inventory";
import FoodCost from "./pages/FoodCost";
import ProductionPlanning from "./pages/ProductionPlanning";
import Reservations from "./pages/Reservations";
import StaffDashboard from "./pages/StaffDashboard";
import CustomerAnalysis from "./pages/CustomerAnalysis";
import DemandForecast from "./pages/DemandForecast";
import EventCalendar from "./pages/EventCalendar";
import LabelView from "./pages/LabelView";
import CassaInCloudIntegration from "./pages/CassaInCloudIntegration";
import RestaurantConfiguration from "./pages/RestaurantConfiguration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/label/:id" element={<LabelView />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/recipes" element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            } />
            <Route path="/menu-engineering" element={
              <ProtectedRoute>
                <MenuEngineering />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/food-cost" element={
              <ProtectedRoute>
                <FoodCost />
              </ProtectedRoute>
            } />
            <Route path="/production-planning" element={
              <ProtectedRoute>
                <ProductionPlanning />
              </ProtectedRoute>
            } />
            <Route path="/reservations" element={
              <ProtectedRoute>
                <Reservations />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <CustomerAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/demand-forecast" element={
              <ProtectedRoute>
                <DemandForecast />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <EventCalendar />
              </ProtectedRoute>
            } />
            <Route path="/cassa-in-cloud" element={
              <ProtectedRoute>
                <CassaInCloudIntegration />
              </ProtectedRoute>
            } />
            <Route path="/restaurant-config" element={
              <ProtectedRoute>
                <RestaurantConfiguration />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
