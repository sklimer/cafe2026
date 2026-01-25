
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Sum, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password
from django.middleware.csrf import get_token
import json
from datetime import timedelta
from users.models import User, UserAddress
from restaurants.models import Restaurant, RestaurantBranch
from catalog.models import Category, Product, Tag, ProductOption, OptionValue
from orders.models import Order, OrderItem, Cart, CartItem, PromoCode, BonusRule, UserBonusTransaction
from payments.models import Payment


from .serializers import (
    UserSerializer, UserAddressSerializer, RestaurantSerializer,
    RestaurantBranchSerializer, CategorySerializer, ProductSerializer,
    TagSerializer, OrderSerializer, CartSerializer, PromoCodeSerializer,
    BonusRuleSerializer, UserBonusTransactionSerializer, AdminRestaurantSerializer
)


@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            login_field = data.get('username')  # может быть email или telegram_id
            password = data.get('password')

            # Пробуем найти пользователя по email или telegram_id
            try:
                # Ищем по email
                user = User.objects.get(email=login_field, is_active=True)
            except User.DoesNotExist:
                try:
                    # Ищем по telegram_id (преобразуем в int, если это число)
                    if login_field.isdigit():
                        user = User.objects.get(telegram_id=int(login_field), is_active=True)
                    else:
                        user = None
                except (User.DoesNotExist, ValueError):
                    user = None

            # Проверяем пароль и права
            if user is not None and check_password(password, user.password) and user.is_staff:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'telegram_id': user.telegram_id,
                        'first_name': user.first_name,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser
                    }
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Неверные данные или недостаточно прав'
                }, status=401)

        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Неверный JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


# API для выхода
@csrf_exempt
def api_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Метод не разрешен'}, status=405)


# API для проверки аутентификации
def api_check_auth(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'telegram_id': request.user.telegram_id,
                'first_name': request.user.first_name,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser
            }
        })
    return JsonResponse({'authenticated': False}, status=401)


# API для получения CSRF токена
def api_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})


class AuthViewSet(viewsets.ViewSet):
    """
    Аутентификация через Telegram и JWT
    """

    @action(detail=False, methods=['post'])
    def telegram(self, request):
        """
        Аутентификация через Telegram initData
        POST /api/v1/auth/telegram/
        {
            "initData": "query_id=...&user=..."
        }
        """
        # This would implement Telegram authentication logic
        # For now, returning a placeholder response
        return Response({
            "message": "Telegram authentication endpoint",
            "tokens": {
                "access_token": "fake_access_token",
                "refresh_token": "fake_refresh_token"
            }
        })

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """
        Обновление JWT токена
        POST /api/v1/auth/refresh/
        """
        # Implementation would go here
        return Response({"message": "Token refresh endpoint"})

    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        Выход из системы
        POST /api/v1/auth/logout/
        """
        # Implementation would go here
        return Response({"message": "Logout endpoint"})

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Получение информации о текущем пользователе
        GET /api/v1/auth/me/
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class RestaurantViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Рестораны (только чтение для клиентов)
    """
    queryset = Restaurant.objects.filter(is_active=True)
    serializer_class = RestaurantSerializer

    @action(detail=True, methods=['get'])
    def branches(self, request, pk=None):
        """
        Филиалы ресторана
        GET /api/v1/restaurants/{id}/branches/
        """
        restaurant = self.get_object()
        branches = RestaurantBranch.objects.filter(restaurant=restaurant, is_active=True)
        serializer = RestaurantBranchSerializer(branches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def menu(self, request, pk=None):
        """
        Меню ресторана (категории и товары)
        GET /api/v1/restaurants/{id}/menu/
        """
        restaurant = self.get_object()
        categories = Category.objects.filter(restaurant=restaurant, is_active=True, is_visible=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class RestaurantBranchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Филиалы ресторанов
    """
    queryset = RestaurantBranch.objects.filter(is_active=True)
    serializer_class = RestaurantBranchSerializer

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """
        Проверка доступности заказа в филиале
        GET /api/v1/branches/{id}/availability/
        Параметры:
        - order_type: delivery/pickup
        - delivery_address (опционально)
        """
        branch = self.get_object()
        order_type = request.query_params.get('order_type', 'delivery')

        # Placeholder implementation
        is_open = branch.is_open_now()
        can_accept_orders = branch.is_accepting_orders

        return Response({
            'is_open': is_open,
            'can_accept_orders': can_accept_orders,
            'order_type': order_type,
            'preparation_time': f"{branch.preparation_time_min}-{branch.preparation_time_max} minutes"
        })

    @action(detail=True, methods=['get'])
    def delivery_zones(self, request, pk=None):
        """
        Зоны доставки филиала
        GET /api/v1/branches/{id}/delivery_zones/
        """
        # Placeholder implementation
        branch = self.get_object()
        return Response({
            'branch_id': branch.id,
            'delivery_radius_meters': branch.delivery_radius_meters,
            'delivery_fee': float(branch.delivery_fee),
            'free_delivery_threshold': float(branch.free_delivery_threshold) if branch.free_delivery_threshold else None
        })

    @action(detail=True, methods=['get'])
    def time_slots(self, request, pk=None):
        """
        Доступные слоты времени
        GET /api/v1/branches/{id}/time_slots/
        Параметры:
        - date: YYYY-MM-DD
        - slot_type: delivery/pickup
        """
        # Placeholder implementation
        return Response({
            'slots': [
                {'time': '10:00-11:00', 'available': True},
                {'time': '11:00-12:00', 'available': True},
                {'time': '12:00-13:00', 'available': False},
                {'time': '13:00-14:00', 'available': True},
            ]
        })


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Категории товаров
    """
    from django_filters.rest_framework import DjangoFilterBackend
    from rest_framework import filters

    queryset = Category.objects.all()  # Changed to all to allow admin management
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['restaurant', 'parent', 'is_active', 'is_visible']
    ordering_fields = ['display_order', 'name']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        from rest_framework.permissions import IsAuthenticated, AllowAny
        if self.action in ['list', 'retrieve']:
            # Public endpoints for frontend
            permission_classes = []
        else:
            # Admin endpoints require authentication
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Автоматически устанавливаем ресторан для администраторов, если не указан
        """
        restaurant = serializer.validated_data.get('restaurant')
        if not restaurant and self.request.user.is_staff:
            # Если ресторан не указан, но пользователь - администратор,
            # используем первый доступный ресторан
            restaurant = Restaurant.objects.first()
            if restaurant:
                serializer.save(restaurant=restaurant)
            else:
                # Если ресторанов нет, выбрасываем исключение
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'restaurant': 'No restaurants available'})
        else:
            serializer.save()

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """
        Товары категории
        GET /api/v1/categories/{id}/products/
        """
        category = self.get_object()
        products = Product.objects.filter(category=category, is_available=True)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """
    Товары
    """
    from django_filters.rest_framework import DjangoFilterBackend
    from rest_framework import filters

    queryset = Product.objects.all()  # Changed to all to allow admin management
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['name', 'description', 'short_description']
    filterset_fields = ['restaurant', 'category', 'is_available', 'is_popular', 'is_new',
                        'is_recommended', 'is_vegetarian', 'is_vegan', 'is_gluten_free']
    ordering_fields = ['display_order', 'price', 'created_at', 'popularity']

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        from rest_framework.permissions import IsAuthenticated, AllowAny
        if self.action in ['list', 'retrieve']:
            # Public endpoints for frontend
            permission_classes = []
        else:
            # Admin endpoints require authentication
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['get'])
    def options(self, request, pk=None):
        """
        Доступные опции товара
        GET /api/v1/products/{id}/options/
        """
        product = self.get_object()
        # This would return the options available for this product
        # For now, returning a placeholder
        return Response({'product_id': product.id, 'options': []})

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Расширенный поиск товаров
        GET /api/v1/products/search/
        Параметры:
        - q: поисковый запрос
        - category: id категории
        - tags: список тегов
        - min_price, max_price
        - sort: price_asc, price_desc, popular, new
        """
        # Implementation would go here
        return Response({'results': []})


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Теги товаров
    """
    from django_filters.rest_framework import DjangoFilterBackend

    queryset = Tag.objects.filter(is_active=True)
    serializer_class = TagSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant']


class OrderViewSet(viewsets.ModelViewSet):
    """
    Управление заказами
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Отмена заказа
        POST /api/v1/orders/{id}/cancel/
        """
        order = self.get_object()
        # Implementation would go here
        order.status = 'cancelled'
        order.save()
        return Response({'status': 'cancelled'})

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """
        Получение статуса заказа
        GET /api/v1/orders/{id}/status/
        """
        order = self.get_object()
        return Response({'status': order.status, 'order_number': order.order_number})

    @action(detail=True, methods=['get'])
    def track(self, request, pk=None):
        """
        Отслеживание заказа (для доставки)
        GET /api/v1/orders/{id}/track/
        """
        order = self.get_object()
        # Placeholder implementation
        return Response({
            'order_id': order.id,
            'status': order.status,
            'estimated_delivery': order.estimated_delivery_time,
            'courier_info': {
                'name': order.courier_name,
                'phone': order.courier_phone
            } if order.courier_name else None
        })


class UserAddressViewSet(viewsets.ModelViewSet):
    """
    Управление адресами доставки
    """
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def geocode(self, request):
        """
        Геокодирование адреса
        POST /api/v1/addresses/geocode/
        {
            "address": "ул. Примерная, 10"
        }
        """
        # Placeholder implementation
        return Response({
            'coordinates': {'lat': 55.7558, 'lng': 37.6176},
            'formatted_address': request.data.get('address', '')
        })

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """
        Подсказки адресов
        GET /api/v1/addresses/suggestions/
        Параметры:
        - query: часть адреса
        """
        # Placeholder implementation
        query = request.query_params.get('query', '')
        return Response([
            {'id': 1, 'address': f'{query}, Moscow, Russia'},
            {'id': 2, 'address': f'{query}, St. Petersburg, Russia'}
        ])


class CartView(APIView):
    """
    Получение корзины
    GET /api/v1/cart/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class AddToCartView(APIView):
    """
    Добавление товара в корзину
    POST /api/v1/cart/add/
    {
        "product_id": 1,
        "quantity": 2,
        "selected_options": [
            {"option_id": 1, "value_ids": [1, 2]}
        ]
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Implementation would go here
        return Response({'status': 'added'})


class UpdateCartItemView(APIView):
    """
    Обновление товара в корзине
    PUT /api/v1/cart/update/{item_id}/
    {
        "quantity": 3
    }
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        # Implementation would go here
        return Response({'status': 'updated'})


class RemoveFromCartView(APIView):
    """
    Удаление товара из корзины
    DELETE /api/v1/cart/remove/{item_id}/
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        # Implementation would go here
        return Response({'status': 'removed'})


class ClearCartView(APIView):
    """
    Очистка корзины
    POST /api/v1/cart/clear/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Implementation would go here
        return Response({'status': 'cleared'})


class ProfileView(APIView):
    """
    Профиль пользователя
    GET /api/v1/profile/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserOrdersView(APIView):
    """
    История заказов пользователя
    GET /api/v1/profile/orders/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class BonusView(APIView):
    """
    Бонусный баланс и история
    GET /api/v1/profile/bonus/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Placeholder implementation
        return Response({
            'balance': float(request.user.bonus_balance),
            'percent_allowed': request.user.bonus_percent_allowed
        })


class ReferralView(APIView):
    """
    Реферальная информация
    GET /api/v1/profile/referral/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Placeholder implementation
        return Response({
            'referral_code': request.user.referral_code,
            'referral_count': request.user.referral_count,
            'referral_link': f"https://t.me/bot?start={request.user.referral_code}"
        })


class BonusBalanceView(APIView):
    """
    Бонусный баланс
    GET /api/v1/bonus/balance/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'balance': float(request.user.bonus_balance),
            'percent_allowed': request.user.bonus_percent_allowed
        })


class BonusTransactionsView(APIView):
    """
    История бонусных операций
    GET /api/v1/bonus/transactions/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = UserBonusTransaction.objects.filter(user=request.user).order_by('-created_at')
        serializer = UserBonusTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class BonusRulesView(APIView):
    """
    Активные правила начисления бонусов
    GET /api/v1/bonus/rules/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rules = BonusRule.objects.filter(is_active=True)
        serializer = BonusRuleSerializer(rules, many=True)
        return Response(serializer.data)


class ValidatePromoCodeView(APIView):
    """
    Валидация промокода
    POST /api/v1/promo/validate/
    {
        "code": "SUMMER2024",
        "order_amount": 1500,
        "branch_id": 1
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        order_amount = request.data.get('order_amount')

        try:
            promo_code = PromoCode.objects.get(code=code, is_active=True)
            # Placeholder validation logic
            if promo_code.valid_from <= timezone.now() <= promo_code.valid_until:
                if not promo_code.min_order_amount or order_amount >= promo_code.min_order_amount:
                    return Response({
                        'valid': True,
                        'discount_amount': float(promo_code.discount_amount) if promo_code.discount_amount else 0,
                        'discount_percentage': float(
                            promo_code.discount_percentage) if promo_code.discount_percentage else 0
                    })

            return Response({'valid': False, 'message': 'Promo code is not valid'},
                            status=status.HTTP_400_BAD_REQUEST)
        except PromoCode.DoesNotExist:
            return Response({'valid': False, 'message': 'Invalid promo code'},
                            status=status.HTTP_400_BAD_REQUEST)


class ActivePromoCodesView(APIView):
    """
    Активные промокоды
    GET /api/v1/promo/active/
    """

    def get(self, request):
        from django.utils import timezone
        active_codes = PromoCode.objects.filter(
            is_active=True,
            valid_from__lte=timezone.now(),
            valid_until__gte=timezone.now()
        )
        serializer = PromoCodeSerializer(active_codes, many=True)
        return Response(serializer.data)


class CreatePaymentView(APIView):
    """
    Создание платежа
    POST /api/v1/payments/create/
    {
        "order_id": 1,
        "method": "card_online",
        "return_url": "https://..."
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Implementation would go here
        return Response({
            'payment_id': 'pay_123456789',
            'status': 'pending',
            'payment_url': 'https://payment-gateway.com/pay/pay_123456789'
        })


class PaymentStatusView(APIView):
    """
    Статус платежа
    GET /api/v1/payments/status/
    Параметры:
    - order_id: ID заказа
    - payment_id: ID платежа
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Implementation would go here
        return Response({
            'status': 'paid',
            'payment_id': request.GET.get('payment_id'),
            'order_id': request.GET.get('order_id')
        })


class PaymentWebhookView(APIView):
    """
    Webhook от платежного провайдера
    POST /api/v1/payments/webhook/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Implementation would go here
        return Response({'status': 'received'})


class RestaurantBranchesView(generics.ListAPIView):
    """
    Филиалы ресторана
    GET /api/v1/restaurants/{id}/branches/
    """
    serializer_class = RestaurantBranchSerializer

    def get_queryset(self):
        restaurant_id = self.kwargs['pk']
        return RestaurantBranch.objects.filter(
            restaurant_id=restaurant_id,
            is_active=True
        )


class RestaurantMenuView(APIView):
    """
    Меню ресторана
    GET /api/v1/restaurants/{id}/menu/
    """

    def get(self, request, pk):
        restaurant = get_object_or_404(Restaurant, id=pk)
        categories = Category.objects.filter(
            restaurant=restaurant,
            is_active=True,
            is_visible=True
        ).prefetch_related('products')

        # Serialize the data
        from rest_framework import serializers

        class MenuItemSerializer(serializers.ModelSerializer):
            class Meta:
                model = Product
                fields = ['id', 'name', 'price', 'description', 'main_image_url']

        class MenuCategorySerializer(serializers.ModelSerializer):
            products = MenuItemSerializer(many=True, read_only=True)

            class Meta:
                model = Category
                fields = ['id', 'name', 'description', 'products']

        serializer = MenuCategorySerializer(categories, many=True)
        return Response(serializer.data)


class CategoryProductsView(generics.ListAPIView):
    """
    Товары категории
    GET /api/v1/categories/{id}/products/
    """
    serializer_class = ProductSerializer

    def get_queryset(self):
        category_id = self.kwargs['pk']
        return Product.objects.filter(
            category_id=category_id,
            is_available=True
        )


class ProductOptionsView(APIView):
    """
    Опции товара
    GET /api/v1/products/{id}/options/
    """

    def get(self, request, pk):
        # Implementation would go here
        return Response({'product_id': pk, 'options': []})


class ProductSearchView(generics.ListAPIView):
    """
    Поиск товаров
    GET /api/v1/products/search/
    """
    serializer_class = ProductSerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if query:
            return Product.objects.filter(
                name__icontains=query,
                is_available=True
            )
        return Product.objects.none()


class BranchAvailabilityView(APIView):
    """
    Доступность филиала
    GET /api/v1/branches/{id}/availability/
    """

    def get(self, request, pk):
        branch = get_object_or_404(RestaurantBranch, id=pk)
        order_type = request.query_params.get('order_type', 'delivery')

        return Response({
            'is_open': branch.is_open_now(),
            'can_accept_orders': branch.is_accepting_orders,
            'order_type': order_type,
            'preparation_time': f"{branch.preparation_time_min}-{branch.preparation_time_max} minutes"
        })


class BranchDeliveryZonesView(APIView):
    """
    Зоны доставки филиала
    GET /api/v1/branches/{id}/delivery_zones/
    """

    def get(self, request, pk):
        branch = get_object_or_404(RestaurantBranch, id=pk)
        return Response({
            'branch_id': branch.id,
            'delivery_radius_meters': branch.delivery_radius_meters,
            'delivery_fee': float(branch.delivery_fee),
            'free_delivery_threshold': float(branch.free_delivery_threshold) if branch.free_delivery_threshold else None
        })


class BranchTimeSlotsView(APIView):
    """
    Слоты времени филиала
    GET /api/v1/branches/{id}/time_slots/
    """

    def get(self, request, pk):
        # Placeholder implementation
        return Response({
            'slots': [
                {'time': '10:00-11:00', 'available': True},
                {'time': '11:00-12:00', 'available': True},
                {'time': '12:00-13:00', 'available': False},
                {'time': '13:00-14:00', 'available': True},
            ]
        })


class CancelOrderView(APIView):
    """
    Отмена заказа
    POST /api/v1/orders/{id}/cancel/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, id=pk, user=request.user)
        order.status = 'cancelled'
        order.save()
        return Response({'status': 'cancelled'})


class OrderStatusView(APIView):
    """
    Статус заказа
    GET /api/v1/orders/{id}/status/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, id=pk, user=request.user)
        return Response({
            'status': order.status,
            'order_number': order.order_number,
            'updated_at': order.updated_at
        })


class OrderTrackingView(APIView):
    """
    Отслеживание заказа
    GET /api/v1/orders/{id}/track/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, id=pk, user=request.user)
        return Response({
            'order_id': order.id,
            'status': order.status,
            'estimated_delivery': order.estimated_delivery_time,
            'courier_info': {
                'name': order.courier_name,
                'phone': order.courier_phone
            } if order.courier_name else None
        })


class GeocodeAddressView(APIView):
    """
    Геокодирование адреса
    POST /api/v1/addresses/geocode/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        address = request.data.get('address', '')
        # Placeholder implementation
        return Response({
            'coordinates': {'lat': 55.7558, 'lng': 37.6176},
            'formatted_address': address
        })


class AddressSuggestionsView(APIView):
    """
    Подсказки адресов
    GET /api/v1/addresses/suggestions/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('query', '')
        # Placeholder implementation
        return Response([
            {'id': 1, 'address': f'{query}, Moscow, Russia'},
            {'id': 2, 'address': f'{query}, St. Petersburg, Russia'}
        ])


class DashboardStatsView(APIView):
    """
    Статистика дашборда
    GET /api/v1/dashboard/stats/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only allow admin users to access dashboard stats
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Calculate dashboard statistics
        today = timezone.now().date()
        start_of_month = today.replace(day=1)

        # Orders count
        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__date=today).count()

        # Revenue
        total_revenue = Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        revenue_today = Order.objects.filter(created_at__date=today).aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        # Users
        total_users = User.objects.count()
        users_today = User.objects.filter(date_joined__date=today).count()

        # Products
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_available=True).count()

        stats = {
            'total_orders': total_orders,
            'orders_today': orders_today,
            'total_revenue': float(total_revenue),
            'revenue_today': float(revenue_today),
            'total_users': total_users,
            'users_today': users_today,
            'total_products': total_products,
            'active_products': active_products,
            'date_updated': timezone.now().isoformat()
        }

        return Response(stats)


class RecentOrdersView(APIView):
    """
    Последние заказы
    GET /api/v1/dashboard/recent-orders/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only allow admin users to access recent orders
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Get recent orders with basic information
        recent_orders = Order.objects.select_related('user', 'branch').order_by('-created_at')[:10]

        orders_data = []
        for order in recent_orders:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'user': {
                    'id': order.user.id,
                    'full_name': order.user.full_name,
                    'phone': order.user.phone
                },
                'branch': {
                    'id': order.branch.id,
                    'name': order.branch.name
                },
                'total_amount': float(order.total_amount),
                'status': order.status,
                'created_at': order.created_at.isoformat(),
                'order_type': order.order_type
            })

        return Response({'orders': orders_data})


class PopularProductsView(APIView):
    """
    Популярные продукты
    GET /api/v1/dashboard/popular-products/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only allow admin users to access popular products
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Get popular products based on order count
        popular_products = OrderItem.objects.values(
            'product_id',
            'product_name'
        ).annotate(
            order_count=Count('product_id'),
            total_quantity_sold=Sum('quantity')
        ).order_by('-order_count')[:10]

        products_data = []
        for product in popular_products:
            # Get the actual product to get more details
            try:
                product_obj = Product.objects.get(id=product['product_id'])
                products_data.append({
                    'id': product['product_id'],
                    'name': product['product_name'],
                    'order_count': product['order_count'],
                    'total_quantity_sold': product['total_quantity_sold'],
                    'price': float(product_obj.price),
                    'is_available': product_obj.is_available,
                    'main_image_url': product_obj.main_image_url
                })
            except Product.DoesNotExist:
                # Fallback if product doesn't exist anymore
                products_data.append({
                    'id': product['product_id'],
                    'name': product['product_name'],
                    'order_count': product['order_count'],
                    'total_quantity_sold': product['total_quantity_sold'],
                    'price': 0,
                    'is_available': False,
                    'main_image_url': None
                })

        return Response({'products': products_data})


class AdminRestaurantViewSet(viewsets.ModelViewSet):
    """
    Управление ресторанами для администраторов
    """
    queryset = Restaurant.objects.all()
    serializer_class = AdminRestaurantSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        from rest_framework.permissions import IsAuthenticated

        # All actions require authentication
        permission_classes = [IsAuthenticated]

        # Only staff users can modify restaurants
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # For modification actions, ensure user is staff
            class IsStaffPermission:
                def has_permission(self, request, view):
                    return request.user.is_staff and request.user.is_authenticated

            permission_classes.append(IsStaffPermission)

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        # Only staff users can create restaurants
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        # Only staff users can update restaurants
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only staff users can delete restaurants
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)