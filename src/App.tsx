import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PostRegistrationSetup from "@/components/PostRegistrationSetup";
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
import ShiftManagementPage from "./components/shifts/ShiftManagementPage"; // Importa la nuova pagina
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/label/:id" element={<LabelView />} />
            <Route path="/" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/recipes" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Recipes />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/menu-engineering" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <MenuEngineering />
              </ProtectedRoute>
            } />
            <Route path="/food-cost" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <FoodCost />
              </ProtectedRoute>
            } />
            <Route path="/production-planning" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <ProductionPlanning />
              </ProtectedRoute>
            } />
            <Route path="/demand-forecast" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <DemandForecast />
              </ProtectedRoute>
            } />
            <Route path="/customer-analysis" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <CustomerAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/cassa-in-cloud" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <CassaInCloudIntegration />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <EventCalendar />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/reservations" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <Reservations />
              </ProtectedRoute>
            } />
            {/* Nuova rotta per la gestione dei turni */}
            <Route path="/gestione-turni" element={
              <ProtectedRoute>
                <PostRegistrationSetup />
                <ShiftManagementPage />
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
