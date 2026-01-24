from rest_framework import serializers
from users.models import User, UserAddress
from restaurants.models import Restaurant, RestaurantBranch
from catalog.models import Category, Product, Tag, ProductOption, OptionValue
from orders.models import Order, OrderItem, Cart, CartItem, PromoCode, BonusRule, UserBonusTransaction
from payments.models import Payment


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'telegram_id', 'username', 'first_name', 'last_name',
            'phone', 'email', 'language_code', 'is_premium',
            'total_orders', 'total_spent', 'bonus_balance', 'bonus_percent_allowed',
            'referral_code', 'referred_by', 'referral_count',
            'notification_preferences', 'settings',
            'registration_date', 'last_login', 'last_activity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'telegram_id', 'registration_date', 'created_at', 'updated_at']


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            'id', 'alias', 'address', 'city', 'street', 'house',
            'entrance', 'floor', 'apartment', 'intercom', 'comment',
            'latitude', 'longitude', 'geolocation_accuracy',
            'is_default', 'is_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class RestaurantSerializer(serializers.ModelSerializer):
    branches_count = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'slug', 'description', 'logo_url',
            'cover_url', 'contact_phone', 'branches_count'
        ]

    def get_branches_count(self, obj):
        return obj.branches.filter(is_active=True).count()


class RestaurantBranchSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name')

    class Meta:
        model = RestaurantBranch
        fields = [
            'id', 'name', 'restaurant', 'restaurant_name', 'address',
            'city', 'latitude', 'longitude', 'phone', 'business_hours',
            'min_order_amount', 'delivery_fee', 'free_delivery_threshold',
            'delivery_radius_meters', 'accepted_payment_methods',
            'is_accepting_orders'
        ]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'description', 'color', 'icon_url']


class ProductOptionSerializer(serializers.ModelSerializer):
    values = serializers.SerializerMethodField()

    class Meta:
        model = ProductOption
        fields = [
            'id', 'name', 'description', 'option_type', 'is_required',
            'min_selection', 'max_selection', 'values'
        ]

    def get_values(self, obj):
        # Return the option values for this product option
        values = OptionValue.objects.filter(option=obj)
        return OptionValueSerializer(values, many=True).data


class OptionValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionValue
        fields = [
            'id', 'value', 'description', 'price_modifier', 'cost_modifier',
            'is_available', 'stock_quantity', 'display_order', 'is_default',
            'color', 'icon_url'
        ]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', allow_null=True)
    restaurant_name = serializers.CharField(source='restaurant.name')
    tags = TagSerializer(many=True, read_only=True)
    options = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'short_description', 'price',
            'old_price', 'category', 'category_name', 'restaurant',
            'restaurant_name', 'weight_grams', 'calories', 'main_image_url',
            'image_urls', 'is_popular', 'is_new', 'is_recommended',
            'is_vegetarian', 'is_vegan', 'is_gluten_free', 'tags',
            'options', 'in_stock', 'cooking_time_minutes'
        ]

    def get_options(self, obj):
        # Return the options available for this product
        # This requires defining a reverse relation in models
        from catalog.models import ProductOptionMapping
        option_mappings = ProductOptionMapping.objects.filter(product=obj).select_related('option')
        options = [mapping.option for mapping in option_mappings]
        return ProductOptionSerializer(options, many=True, context=self.context).data

    def get_in_stock(self, obj):
        if obj.is_unlimited_stock:
            return True
        if obj.stock_quantity is None:
            return obj.is_available
        return obj.stock_quantity > 0


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image_url', 'icon_url',
                 'display_order', 'is_active', 'is_visible', 'created_at', 'updated_at']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    selected_options = OptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'selected_options', 'unit_price', 'total_price', 'created_at']


class CartSerializer(serializers.ModelSerializer):
    cart_items = CartItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'cart_items', 'items_count', 'total_price', 'created_at', 'updated_at']

    def get_items_count(self, obj):
        return obj.items_count

    def get_total_price(self, obj):
        return obj.total_price


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_description', 'product_price',
            'quantity', 'unit_price', 'subtotal', 'selected_options',
            'options_modifier', 'special_instructions', 'is_prepared', 'prepared_at'
        ]


class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    branch = RestaurantBranchSerializer(read_only=True)
    delivery_address = UserAddressSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'branch', 'order_type', 'status',
            'delivery_address', 'preferred_delivery_time', 'delivery_time_slot',
            'subtotal', 'delivery_fee', 'service_fee', 'packaging_fee',
            'discount_amount', 'bonus_used', 'total_amount', 'tips_amount',
            'promo_code', 'promo_discount_amount', 'bonus_percent_used', 'bonus_earned',
            'payment_method', 'payment_status', 'payment_provider', 'payment_id',
            'payment_url', 'courier_name', 'courier_phone', 'courier_vehicle',
            'courier_tracking_url', 'estimated_preparation_time', 'estimated_delivery_time',
            'preparation_duration_minutes', 'delivery_duration_minutes',
            'customer_comment', 'special_instructions', 'restaurant_notes',
            'cancellation_reason', 'source', 'device_info', 'ip_address',
            'user_agent', 'created_at', 'updated_at', 'confirmed_at', 'prepared_at',
            'dispatched_at', 'completed_at', 'cancelled_at', 'items'
        ]
        read_only_fields = ['id', 'order_number', 'user', 'created_at', 'updated_at']


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = [
            'id', 'name', 'code', 'promo_type', 'discount_amount',
            'discount_percentage', 'usage_limit', 'usage_limit_per_user',
            'min_order_amount', 'valid_from', 'valid_until', 'is_active',
            'usage_count', 'created_at', 'updated_at'
        ]


class BonusRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BonusRule
        fields = [
            'id', 'name', 'rule_type', 'bonus_amount', 'bonus_percentage',
            'max_bonus_amount', 'min_order_amount', 'validity_days',
            'usage_limit', 'is_active', 'created_at', 'updated_at'
        ]


class UserBonusTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBonusTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'description', 'order_id',
            'bonus_rule_id', 'promo_code_id', 'expires_at', 'is_expired',
            'is_used', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']