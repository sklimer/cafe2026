import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Импортируйте новый компонент с ChatBurger дизайном
import MenuPage from './pages/MenuPage';
import RestaurantListPage from './pages/RestaurantListPage';
import ProductPage from './pages/ProductPage';
import AddressesPage from './pages/AddressesPage';
import ProfilePage from './pages/ProfilePage';
import PromotionsPage from './pages/PromotionsPage';
import CategoryPage from './pages/CategoryPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import CartPage from './pages/CartPage';
import Layout from './components/layout/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
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
            <Route index element={<RestaurantListPage />} />
            {/* Используйте ChatBurgerMenu вместо обычного MenuPage */}
            <Route path="/menu/:restaurantId" element={<MenuPage />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/order/:orderId" element={<OrderDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

export default App;