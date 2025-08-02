// src/App.jsx

import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import './App.css'; 
import './pages/OrdersPage.css';

import LoginPage from './pages/LoginPage.jsx';
import PhonesPage from './pages/PhonesPage.jsx';
import SuppliersPage from './pages/SuppliersPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import InspectionPage from './pages/InspectionPage.jsx';
import WarehousePage from './pages/WarehousePage.jsx';
import AccessoriesPage from './pages/AccessoriesPage.jsx';
import SalesPage from './pages/SalesPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import CashFlowPage from './pages/CashFlowPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AccessoryCompatibilityPage from './pages/AccessoryCompatibilityPage.jsx';
import PhoneHistoryPage from './pages/PhoneHistoryPage.jsx';
import ReturnsPage from './pages/ReturnsPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function MainLayout() {
  const { logout, hasPermission } = useAuth();

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2 className="sidebar-title">Меню</h2>
        <ul className="nav-list">
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/phones" className="nav-link">Телефоны</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/phone-history" className="nav-link">История телефона</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/suppliers" className="nav-link">Поставщики</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('receive_supplier_orders')) && <li className="nav-item"><NavLink to="/orders" className="nav-link">Заказы Поставщиков</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('perform_inspections')) && <li className="nav-item"><NavLink to="/inspection" className="nav-link">Инспекция</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('perform_inspections')) && <li className="nav-item"><NavLink to="/returns" className="nav-link">Брак/Возвраты</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/warehouse" className="nav-link">Склад</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/accessories" className="nav-link">Аксессуары</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/compatibility" className="nav-link">Совместимость</NavLink></li>}
            {hasPermission('perform_sales') && <li className="nav-item"><NavLink to="/sales" className="nav-link">Продажа</NavLink></li>}
            {hasPermission('manage_pricing') && <li className="nav-item"><NavLink to="/pricing" className="nav-link">Цены</NavLink></li>}
            {hasPermission('manage_cashflow') && <li className="nav-item"><NavLink to="/cashflow" className="nav-link">Движение денег</NavLink></li>}
            {hasPermission('view_reports') && <li className="nav-item"><NavLink to="/reports" className="nav-link">Отчеты</NavLink></li>}
            {hasPermission('manage_users') && <li className="nav-item"><NavLink to="/employees" className="nav-link">Сотрудники</NavLink></li>}
            {hasPermission('perform_sales') && <li className="nav-item"><NavLink to="/dashboard" className="nav-link">Рабочий стол</NavLink></li>}
        </ul>
        <div className="logout-container">
            <button onClick={logout} className="btn btn-secondary" style={{width: '100%'}}>Выйти</button>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/phones" element={<PhonesPage />} />
          <Route path="/phone-history" element={<PhoneHistoryPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/inspection" element={<InspectionPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/compatibility" element={<AccessoryCompatibilityPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/cashflow" element={<CashFlowPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const { token } = useAuth();
  
  return (
    <Routes>
      {!token ? (
          <Route path="*" element={<LoginPage />} />
      ) : (
          <Route path="*" element={<MainLayout />} />
      )}
    </Routes>
  );
}

export default App;