from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'api'

# Create router and register ViewSets
router = DefaultRouter()

# Auth endpoints
router.register(r'auth', views.AuthViewSet, basename='auth')

# Restaurant endpoints
router.register(r'restaurants', views.RestaurantViewSet, basename='restaurant')
router.register(r'branches', views.RestaurantBranchViewSet, basename='branch')

# Catalog endpoints
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'tags', views.TagViewSet, basename='tag')

# Order endpoints
router.register(r'orders', views.OrderViewSet, basename='order')

# User endpoints
router.register(r'addresses', views.UserAddressViewSet, basename='address')

urlpatterns = [
    path('', include(router.urls)),
    
    # Additional endpoints that don't fit the standard ViewSet pattern
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/add/', views.AddToCartView.as_view(), name='add-to-cart'),
    path('cart/update/<int:item_id>/', views.UpdateCartItemView.as_view(), name='update-cart-item'),
    path('cart/remove/<int:item_id>/', views.RemoveFromCartView.as_view(), name='remove-from-cart'),
    path('cart/clear/', views.ClearCartView.as_view(), name='clear-cart'),
    
    # Profile endpoints
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/orders/', views.UserOrdersView.as_view(), name='user-orders'),
    path('profile/bonus/', views.BonusView.as_view(), name='bonus'),
    path('profile/referral/', views.ReferralView.as_view(), name='referral'),
    
    # Bonus and promo endpoints
    path('bonus/balance/', views.BonusBalanceView.as_view(), name='bonus-balance'),
    path('bonus/transactions/', views.BonusTransactionsView.as_view(), name='bonus-transactions'),
    path('bonus/rules/', views.BonusRulesView.as_view(), name='bonus-rules'),
    path('promo/validate/', views.ValidatePromoCodeView.as_view(), name='validate-promo-code'),
    path('promo/active/', views.ActivePromoCodesView.as_view(), name='active-promo-codes'),
    
    # Payment endpoints
    path('payments/create/', views.CreatePaymentView.as_view(), name='create-payment'),
    path('payments/status/', views.PaymentStatusView.as_view(), name='payment-status'),
    path('payments/webhook/', views.PaymentWebhookView.as_view(), name='payment-webhook'),
    
    # Additional restaurant endpoints
    path('restaurants/<int:pk>/branches/', views.RestaurantBranchesView.as_view(), name='restaurant-branches'),
    path('restaurants/<int:pk>/menu/', views.RestaurantMenuView.as_view(), name='restaurant-menu'),
    
    # Category endpoints
    path('categories/<int:pk>/products/', views.CategoryProductsView.as_view(), name='category-products'),
    
    # Product endpoints
    path('products/<int:pk>/options/', views.ProductOptionsView.as_view(), name='product-options'),
    path('products/search/', views.ProductSearchView.as_view(), name='product-search'),
    
    # Branch endpoints
    path('branches/<int:pk>/availability/', views.BranchAvailabilityView.as_view(), name='branch-availability'),
    path('branches/<int:pk>/delivery_zones/', views.BranchDeliveryZonesView.as_view(), name='branch-delivery-zones'),
    path('branches/<int:pk>/time_slots/', views.BranchTimeSlotsView.as_view(), name='branch-time-slots'),
    
    # Order endpoints
    path('orders/<int:pk>/cancel/', views.CancelOrderView.as_view(), name='cancel-order'),
    path('orders/<int:pk>/status/', views.OrderStatusView.as_view(), name='order-status'),
    path('orders/<int:pk>/track/', views.OrderTrackingView.as_view(), name='order-track'),
    
    # Address endpoints
    path('addresses/geocode/', views.GeocodeAddressView.as_view(), name='geocode-address'),
    path('addresses/suggestions/', views.AddressSuggestionsView.as_view(), name='address-suggestions'),
]