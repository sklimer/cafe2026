
from rest_framework import serializers
from users.models import User, UserAddress
from restaurants.models import Restaurant, RestaurantBranch
from catalog.models import Category, Product, Tag, ProductOption, OptionValue
from orders.models import Order, OrderItem, Cart, CartItem, PromoCode, BonusRule, UserBonusTransaction
from payments.models import Payment
from django.conf import settings

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


class AdminRestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make slug field not required during creation
        if not self.instance:  # Creation
            self.fields['slug'].required = False
            self.fields['slug'].allow_blank = True

    def validate_slug(self, value):
        # Make sure the slug is unique
        if value and Restaurant.objects.filter(slug=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Slug должен быть уникальным")
        return value

    def create(self, validated_data):
        # Auto-generate slug from name if not provided
        if 'slug' not in validated_data or not validated_data['slug']:
            name = validated_data.get('name', '')
            slug = name.lower().replace(' ', '-').replace('_', '-')
            # Remove special characters
            import re
            slug = re.sub(r'[^a-z0-9-]', '', slug)
            # Ensure uniqueness
            original_slug = slug
            counter = 1
            while Restaurant.objects.filter(slug=slug).exists():
                slug = f"{original_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug

        return super().create(validated_data)


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


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    # Измените поля для приема одного файла, а не списка
    main_image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    additional_images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        allow_empty=True,
        write_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'short_description', 'price',
            'old_price', 'cost_price', 'category', 'restaurant',
            'weight_grams', 'volume_ml', 'calories', 'proteins', 'fats', 'carbohydrates',
            'main_image', 'additional_images', 'video_url', 'is_available',
            'stock_quantity', 'is_unlimited_stock', 'low_stock_threshold',
            'is_popular', 'is_new', 'is_recommended', 'is_spicy', 'is_vegetarian',
            'is_vegan', 'is_gluten_free', 'cooking_time_minutes', 'preparation_instructions',
            'display_order', 'seo_title', 'seo_description', 'seo_keywords',
            'custom_attributes'
        ]
        read_only_fields = ['id', 'main_image_url', 'image_urls']

    def create(self, validated_data):
        # Извлекаем файлы изображений
        main_image = validated_data.pop('main_image', None)
        additional_images = validated_data.pop('additional_images', [])

        # Создаем продукт без изображений
        product = Product.objects.create(**validated_data)

        # Сохраняем основное изображение
        if main_image:
            product.main_image_url = self.save_image(main_image, product, 'main')
            product.save()

        # Сохраняем дополнительные изображения
        if additional_images:
            image_urls = []
            for img in additional_images:
                url = self.save_image(img, product, 'additional')
                image_urls.append(url)
            product.image_urls = image_urls
            product.save()

        return product

    def update(self, instance, validated_data):
        # Извлекаем файлы изображений
        main_image = validated_data.pop('main_image', None)
        additional_images = validated_data.pop('additional_images', None)

        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Обновляем основное изображение если предоставлено
        if main_image is not None:
            if main_image:  # Новое изображение
                instance.main_image_url = self.save_image(main_image, instance, 'main')
            else:  # None - удаляем изображение
                instance.main_image_url = None

        # Обновляем дополнительные изображения если предоставлены
        if additional_images is not None:
            image_urls = []
            for img in additional_images:
                url = self.save_image(img, instance, 'additional')
                image_urls.append(url)
            instance.image_urls = image_urls

        instance.save()
        return instance

    def save_image(self, image_file, product, image_type='additional'):
        """Сохраняет изображение и возвращает URL"""
        import os
        from django.core.files.storage import default_storage
        from django.utils.timezone import now

        # Генерируем уникальное имя файла
        timestamp = now().strftime('%Y%m%d_%H%M%S')
        ext = os.path.splitext(image_file.name)[1]
        filename = f'{image_type}_{timestamp}_{product.id}{ext}'

        # Сохраняем файл
        file_path = default_storage.save(f'products/{product.id}/{filename}', image_file)

        # Возвращаем URL
        return f'/media/{file_path}'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', allow_null=True)
    restaurant_name = serializers.CharField(source='restaurant.name', allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    in_stock = serializers.SerializerMethodField()

    # Добавляем поле для полного URL изображения
    main_image_url_full = serializers.SerializerMethodField()
    image_urls_full = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'short_description', 'price',
            'old_price', 'category', 'category_name', 'restaurant',
            'restaurant_name', 'weight_grams', 'calories', 'main_image_url',
            'main_image_url_full', 'image_urls', 'image_urls_full',
            'is_popular', 'is_new', 'is_recommended',
            'is_vegetarian', 'is_vegan', 'is_gluten_free', 'tags',
            'in_stock', 'cooking_time_minutes', 'stock_quantity'
        ]

    def get_main_image_url_full(self, obj):
        if obj.main_image_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image_url)
            return f"{settings.SITE_URL}{obj.main_image_url}" if hasattr(settings, 'SITE_URL') else obj.main_image_url
        return None

    def get_image_urls_full(self, obj):
        if obj.image_urls:
            request = self.context.get('request')
            if request:
                return [request.build_absolute_uri(url) for url in obj.image_urls]
            elif hasattr(settings, 'SITE_URL'):
                return [f"{settings.SITE_URL}{url}" for url in obj.image_urls]
        return obj.image_urls or []

    def get_in_stock(self, obj):
        if obj.is_unlimited_stock:
            return True
        if obj.stock_quantity is None:
            return obj.is_available
        return obj.stock_quantity > 0


class CategoryWithChildrenSerializer(serializers.ModelSerializer):
    """Serializer for category with children for hierarchical display"""
    children = serializers.SerializerMethodField()
    restaurant_name = serializers.CharField(source='restaurant.name', allow_null=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image_url', 'icon_url',
                 'display_order', 'is_active', 'is_visible', 'restaurant', 'restaurant_name', 'created_at', 'updated_at', 'children']

    def get_children(self, obj):
        # Get children categories recursively
        children = Category.objects.filter(parent=obj, is_active=True, is_visible=True)
        if children.exists():
            return CategoryWithChildrenSerializer(children, many=True, context=self.context).data
        return []


class CategorySerializer(serializers.ModelSerializer):
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=False)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image_url', 'icon_url',
                 'display_order', 'is_active', 'is_visible', 'restaurant', 'created_at', 'updated_at']


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