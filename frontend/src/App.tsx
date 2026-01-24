import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import MenuPage from './pages/MenuPage';
import ProductPage from './pages/ProductPage';
import AddressesPage from './pages/AddressesPage';
import ProfilePage from './pages/ProfilePage';
import PromotionsPage from './pages/PromotionsPage';
import CategoryPage from './pages/CategoryPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import Layout from './components/layout/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MenuPage />} />
            <Route path="/menu/:restaurantId" element={<MenuPage />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/order/:orderId" element={<OrderDetailsPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

export default App;