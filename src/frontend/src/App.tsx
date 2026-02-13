import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { AppShell } from './components/AppShell';
import ProductsPage from './pages/ProductsPage';
import POSPage from './pages/POSPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import AboutSettingsPage from './pages/AboutSettingsPage';
import ReceiptPage from './pages/ReceiptPage';

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: POSPage,
});

const posRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pos',
  component: POSPage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductsPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/transactions',
  component: TransactionsPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: AboutSettingsPage,
});

const receiptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/receipt/$transactionId',
  component: ReceiptPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  posRoute,
  productsRoute,
  transactionsRoute,
  reportsRoute,
  settingsRoute,
  receiptRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
