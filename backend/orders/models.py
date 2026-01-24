from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from users.models import User, UserAddress
from restaurants.models import RestaurantBranch
from catalog.models import Product, OptionValue
from decimal import Decimal


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart', db_index=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'carts'
        verbose_name = _('cart')
        verbose_name_plural = _('carts')
    
    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Cart for {self.user.full_name}"
    
    @property
    def items_count(self):
        """Total number of items in cart."""
        return sum(item.quantity for item in self.cart_items.all())
    
    @property
    def total_price(self):
        """Total price of all items in cart."""
        total = Decimal('0.00')
        for item in self.cart_items.all():
            total += item.total_price
        return total


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='cart_items', db_index=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_index=True)
    quantity = models.PositiveIntegerField(default=1)
    
    # Selected options
    selected_options = models.ManyToManyField(OptionValue, blank=True)
    
    # Prices
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'cart_items'
        verbose_name = _('cart item')
        verbose_name_plural = _('cart items')
        indexes = [
            models.Index(fields=['cart']),
            models.Index(fields=['product']),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate prices before saving
        self.calculate_prices()
        
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
    
    def calculate_prices(self):
        """Calculate unit and total prices based on product and options."""
        base_price = self.product.price
        options_price = sum(option.price_modifier for option in self.selected_options.all())
        
        self.unit_price = base_price + options_price
        self.total_price = self.unit_price * self.quantity
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name} in cart"


class Order(models.Model):
    ORDER_TYPE_CHOICES = [
        ('delivery', 'Delivery'),
        ('pickup', 'Pickup'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('delivering', 'Delivering'),
        ('delivered', 'Delivered'),
        ('picked_up', 'Picked Up'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card_online', 'Card Online'),
        ('card_on_delivery', 'Card on Delivery'),
        ('bonus', 'Bonus Points'),
    ]
    
    # Basic order info
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', db_index=True)
    branch = models.ForeignKey(RestaurantBranch, on_delete=models.CASCADE, related_name='orders', db_index=True)
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Address info (for delivery orders)
    delivery_address = models.ForeignKey(UserAddress, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    
    # Time preferences
    preferred_delivery_time = models.DateTimeField(null=True, blank=True)
    delivery_time_slot = models.CharField(max_length=50, blank=True)
    
    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    packaging_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    bonus_used = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tips_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Promotions and bonuses
    promo_code = models.CharField(max_length=50, blank=True)
    promo_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    bonus_percent_used = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    bonus_earned = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Payment
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_provider = models.CharField(max_length=50, blank=True)
    payment_id = models.CharField(max_length=100, blank=True)
    payment_url = models.URLField(blank=True)
    
    # Courier info (for delivery orders)
    courier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='delivered_orders')
    courier_name = models.CharField(max_length=255, blank=True)
    courier_phone = models.CharField(max_length=50, blank=True)
    courier_vehicle = models.CharField(max_length=100, blank=True)
    courier_tracking_url = models.URLField(blank=True)
    
    # Timing
    estimated_preparation_time = models.DateTimeField(null=True, blank=True)
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    preparation_duration_minutes = models.IntegerField(null=True, blank=True)
    delivery_duration_minutes = models.IntegerField(null=True, blank=True)
    
    # Customer info
    customer_comment = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    restaurant_notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    # Source and tracking
    source = models.CharField(max_length=50, default='telegram_mini_app')
    device_info = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    prepared_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'orders'
        verbose_name = _('order')
        verbose_name_plural = _('orders')
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['branch', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['order_type']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Generate order number if not exists
        if not self.order_number:
            import uuid
            self.order_number = f"ORD-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4().hex)[:8].upper()}"
        
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order #{self.order_number}"
    
    def calculate_total(self):
        """Calculate total amount based on items, fees, discounts, etc."""
        total = self.subtotal + self.delivery_fee + self.service_fee + self.packaging_fee
        total -= self.discount_amount
        total -= self.bonus_used
        total -= self.promo_discount_amount
        total += self.tips_amount
        return total


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', db_index=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    
    # Product info (stored separately to preserve data if product changes)
    product_name = models.CharField(max_length=255)
    product_description = models.TextField(blank=True)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Quantity and pricing
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Selected options
    selected_options = models.JSONField(default=list, blank=True)  # Store as JSON for historical purposes
    
    # Options modifier
    options_modifier = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Special instructions
    special_instructions = models.TextField(blank=True)
    
    # Preparation status
    is_prepared = models.BooleanField(default=False)
    prepared_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'order_items'
        verbose_name = _('order item')
        verbose_name_plural = _('order items')
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['product']),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate prices before saving
        self.calculate_prices()
        super().save(*args, **kwargs)
    
    def calculate_prices(self):
        """Calculate unit and subtotal prices."""
        self.unit_price = self.product_price + self.options_modifier
        self.subtotal = self.unit_price * self.quantity
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name} in order {self.order.order_number}"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history', db_index=True)
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    comment = models.TextField(blank=True)
    
    # Who changed the status
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'order_status_history'
        verbose_name = _('order status history')
        verbose_name_plural = _('order status histories')
        indexes = [
            models.Index(fields=['order', '-created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Status {self.status} for order {self.order.order_number} at {self.created_at}"


class PromoCode(models.Model):
    PROMO_TYPE_CHOICES = [
        ('fixed_amount', 'Fixed Amount Discount'),
        ('percentage', 'Percentage Discount'),
        ('free_delivery', 'Free Delivery'),
        ('buy_x_get_y', 'Buy X Get Y'),
    ]
    
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    promo_type = models.CharField(max_length=20, choices=PROMO_TYPE_CHOICES)
    
    # Discount values
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Usage limits
    usage_limit = models.IntegerField(null=True, blank=True)  # Total usage limit
    usage_limit_per_user = models.IntegerField(null=True, blank=True)  # Per user limit
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Validity
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    
    # Restrictions
    applicable_restaurants = models.ManyToManyField(Restaurant, blank=True)
    applicable_products = models.ManyToManyField(Product, blank=True)
    applicable_categories = models.ManyToManyField('catalog.Category', blank=True)
    is_for_new_users_only = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Usage tracking
    usage_count = models.IntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'promo_codes'
        verbose_name = _('promo code')
        verbose_name_plural = _('promo codes')
        indexes = [
            models.Index(fields=['code', 'is_active']),
            models.Index(fields=['valid_from', 'valid_until']),
        ]
    
    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class UserPromoCodeUsage(models.Model):
    """Track usage of promo codes by users."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, db_index=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    
    # Metadata
    used_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'user_promo_code_usages'
        verbose_name = _('user promo code usage')
        verbose_name_plural = _('user promo code usages')
        unique_together = ['user', 'promo_code']
        indexes = [
            models.Index(fields=['user', 'promo_code']),
            models.Index(fields=['used_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} used {self.promo_code.code}"


class BonusRule(models.Model):
    RULE_TYPE_CHOICES = [
        ('registration', 'Registration Bonus'),
        ('first_order', 'First Order Bonus'),
        ('order_percentage', 'Order Percentage Bonus'),
        ('birthday', 'Birthday Bonus'),
        ('referral', 'Referral Bonus'),
        ('custom', 'Custom Rule'),
    ]
    
    name = models.CharField(max_length=255)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    
    # Bonus configuration
    bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    bonus_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Conditions
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    applicable_restaurants = models.ManyToManyField(Restaurant, blank=True)
    applicable_products = models.ManyToManyField(Product, blank=True)
    applicable_categories = models.ManyToManyField('catalog.Category', blank=True)
    
    # Limits
    validity_days = models.IntegerField(default=30)  # How long the bonus is valid
    usage_limit = models.IntegerField(null=True, blank=True)  # How many times can be earned
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'bonus_rules'
        verbose_name = _('bonus rule')
        verbose_name_plural = _('bonus rules')
        indexes = [
            models.Index(fields=['rule_type', 'is_active']),
        ]
    
    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.rule_type}"


class UserBonusTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('earned', 'Earned'),
        ('spent', 'Spent'),
        ('expired', 'Expired'),
        ('adjustment', 'Adjustment'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bonus_transactions', db_index=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    
    # Related entities
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    bonus_rule = models.ForeignKey(BonusRule, on_delete=models.SET_NULL, null=True, blank=True)
    promo_code = models.ForeignKey(PromoCode, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Expiration
    expires_at = models.DateTimeField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    
    # Status
    is_used = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'user_bonus_transactions'
        verbose_name = _('user bonus transaction')
        verbose_name_plural = _('user bonus transactions')
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['expires_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type.title()} {self.amount} for {self.user.full_name}"