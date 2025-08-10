// src/App.jsx

import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './styles/fonts.css';

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
import FinancialReportPage from './pages/FinancialReportPage.jsx';
import PayrollPage from './pages/PayrollPage.jsx';
import AccessoryCompatibilityPage from './pages/AccessoryCompatibilityPage.jsx';
import PhoneHistoryPage from './pages/PhoneHistoryPage.jsx';
import ReturnsPage from './pages/ReturnsPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StockPage from './pages/StockPage.jsx';
import TrafficSourcesPage from './pages/TrafficSourcesPage.jsx';
import PendingSalesPage from './pages/PendingSalesPage.jsx';
import MySalesPage from './pages/MySalesPage.jsx';  


// Этот компонент отвечает за основную структуру страницы (меню + контент)
function MainLayout() {
  const { logout, hasPermission } = useAuth();

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2 className="sidebar-title">Меню</h2>
        <ul className="nav-list">
            {/* Ссылки, которые будут показаны в зависимости от прав доступа */}
            {hasPermission('perform_sales') && <li className="nav-item"><NavLink to="/dashboard" className="nav-link">Рабочий стол</NavLink></li>}
            {hasPermission('perform_sales') && <li className="nav-item"><NavLink to="/stock" className="nav-link">Каталог</NavLink></li>}
            {hasPermission('perform_sales') && <li className="nav-item"><NavLink to="/sales" className="nav-link">Продажа</NavLink></li>}
            {hasPermission('perform_sales') && <li className="nav-item"><NavLink to="/pending-sales" className="nav-link">Ожидают оплаты</NavLink></li>}
            {hasPermission('perform_sales') && <li className="nav-item"><NavLink to="/my-sales" className="nav-link">Мои продажи</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('perform_inspections')) && <li className="nav-item"><NavLink to="/inspection" className="nav-link">Инспекция</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('perform_sales')) && <li className="nav-item"><NavLink to="/warehouse" className="nav-link">Склад</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('receive_supplier_orders')) && <li className="nav-item"><NavLink to="/orders" className="nav-link">Заказы</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('perform_inspections')) && <li className="nav-item"><NavLink to="/returns" className="nav-link">Брак/Возвраты</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/phones" className="nav-link">Телефоны</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/accessories" className="nav-link">Аксессуары</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/suppliers" className="nav-link">Поставщики</NavLink></li>}
            {hasPermission('manage_inventory') && <li className="nav-item"><NavLink to="/compatibility" className="nav-link">Совместимость</NavLink></li>}
            {hasPermission('manage_users') && <li className="nav-item"><NavLink to="/traffic-sources" className="nav-link">Источники</NavLink></li>}
            {hasPermission('manage_pricing') && <li className="nav-item"><NavLink to="/pricing" className="nav-link">Цены</NavLink></li>}
            {hasPermission('manage_cashflow') && <li className="nav-item"><NavLink to="/cashflow" className="nav-link">Финансы</NavLink></li>}
            {hasPermission('view_reports') && <li className="nav-item"><NavLink to="/reports" className="nav-link">Отчеты</NavLink></li>}
            {hasPermission('view_reports') && <li className="nav-item"><NavLink to="/financial-report" className="nav-link">Рост компании</NavLink></li>}
            {hasPermission('view_reports') && <li className="nav-item"><NavLink to="/payroll" className="nav-link">Зарплаты</NavLink></li>}
            {hasPermission('manage_users') && <li className="nav-item"><NavLink to="/employees" className="nav-link">Сотрудники</NavLink></li>}
            {(hasPermission('manage_inventory') || hasPermission('perform_sales')) && (<li className="nav-item"><NavLink to="/phone-history" className="nav-link">История телефона</NavLink></li>)}
        </ul>
        <div className="logout-container">
            <button onClick={logout} className="btn btn-secondary" style={{width: '100%'}}>Выйти</button>
        </div>
      </nav>

      <main className="main-content">
        {/* Здесь будут отображаться компоненты страниц */}
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/phones" element={<PhonesPage />} />
          <Route path="/phone-history/:serialNumber" element={<PhoneHistoryPage />} />
          <Route path="/phone-history/" element={<PhoneHistoryPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/inspection" element={<InspectionPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/warehouse" element={<WarehousePage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/compatibility" element={<AccessoryCompatibilityPage />} />
          <Route path="/traffic-sources" element={<TrafficSourcesPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/pending-sales" element={<PendingSalesPage />} />
          <Route path="/my-sales" element={<MySalesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/cashflow" element={<CashFlowPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/financial-report" element={<FinancialReportPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          {/* Если ни один путь не совпал, перенаправляем на рабочий стол */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

// Этот компонент - точка входа. Он решает, показать страницу входа или приложение.
function App() {
  const { token } = useAuth();
  
  return (
    <Routes>
      {token ? (
          // Если пользователь авторизован, загружаем основной макет
          <Route path="/*" element={<MainLayout />} />
      ) : (
          // Если нет, любой путь ведет на страницу входа
          <Route path="*" element={<LoginPage />} />
      )}
    </Routes>
  );
}

export default App;