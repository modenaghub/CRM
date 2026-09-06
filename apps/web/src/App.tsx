import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterOrganizationPage } from './pages/auth/RegisterOrganizationPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { ProspectsPage } from './pages/prospects/ProspectsPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { KanbanPage } from './pages/opportunities/KanbanPage';
import { CustomObjectsPage } from './pages/custom-objects/CustomObjectsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrganizationPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/prospects" element={<ProspectsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/opportunities" element={<KanbanPage />} />
          <Route path="/custom-objects" element={<CustomObjectsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
