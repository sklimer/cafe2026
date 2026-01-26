
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from restaurants.models import Restaurant, RestaurantBranch


class Category(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='categories', db_index=True, null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children', db_index=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    icon_url = models.URLField(blank=True)

    # Display settings
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_visible = models.BooleanField(default=True)

    # SEO
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.TextField(blank=True)
    seo_keywords = models.JSONField(default=list, blank=True)  # List of keywords

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'categories'
        verbose_name = _('category')
        verbose_name_plural = _('categories')
        indexes = [
            models.Index(fields=['restaurant', 'is_active']),
            models.Index(fields=['parent']),
            models.Index(fields=['display_order']),
        ]
        ordering = ['display_order']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def has_children(self):
        """Check if category has subcategories."""
        return self.children.exists()


class Tag(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tags', db_index=True, null=True, blank=True)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, blank=True)  # Hex color code
    icon_url = models.URLField(blank=True)

    # Status
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'tags'
        verbose_name = _('tag')
        verbose_name_plural = _('tags')
        indexes = [
            models.Index(fields=['restaurant', 'is_active']),
            models.Index(fields=['slug']),
        ]
        unique_together = ['restaurant', 'slug']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class Product(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='products', db_index=True, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', db_index=True)

    name = models.CharField(max_length=255)
    description = models.TextField()
    short_description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    old_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # For profit calculation
    profit_margin = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Percentage

    # Availability
    is_available = models.BooleanField(default=True)
    stock_quantity = models.IntegerField(null=True, blank=True)
    low_stock_threshold = models.IntegerField(default=5)
    is_unlimited_stock = models.BooleanField(default=False)

    # Characteristics
    weight_grams = models.IntegerField(null=True, blank=True)
    volume_ml = models.IntegerField(null=True, blank=True)
    calories = models.IntegerField(null=True, blank=True)
    proteins = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in grams
    fats = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in grams
    carbohydrates = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in grams

    # Media
    main_image_url = models.URLField(null=True, blank=True)
    image_urls = models.JSONField(default=list, blank=True)  # List of image URLs
    video_url = models.URLField(null=True, blank=True)

    # Flags
    is_popular = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)
    is_spicy = models.BooleanField(default=False)
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)

    # Cooking
    cooking_time_minutes = models.IntegerField(null=True, blank=True)
    preparation_instructions = models.TextField(blank=True)

    # Display settings
    display_order = models.IntegerField(default=0)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.TextField(blank=True)
    seo_keywords = models.JSONField(default=list, blank=True)  # List of keywords

    # Custom attributes (for flexibility)
    custom_attributes = models.JSONField(default=dict, blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'products'
        verbose_name = _('product')
        verbose_name_plural = _('products')
        indexes = [
            models.Index(fields=['restaurant', 'is_available']),
            models.Index(fields=['category']),
            models.Index(fields=['display_order']),
            models.Index(fields=['is_popular']),
            models.Index(fields=['is_new']),
            models.Index(fields=['is_vegetarian', 'is_vegan', 'is_gluten_free']),
        ]
        ordering = ['display_order']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def in_stock(self):
        """Check if product is in stock."""
        if self.is_unlimited_stock:
            return True
        if self.stock_quantity is None:
            return self.is_available
        return self.stock_quantity > 0

    @property
    def is_low_stock(self):
        """Check if product is low in stock."""
        if self.is_unlimited_stock or self.stock_quantity is None:
            return False
        return self.stock_quantity <= self.low_stock_threshold

    @property
    def discount_percentage(self):
        """Calculate discount percentage if old price is available."""
        if self.old_price and self.old_price > self.price:
            return round(((self.old_price - self.price) / self.old_price) * 100, 2)
        return 0


class ProductOption(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='product_options', db_index=True, null=True, blank=True)

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    OPTION_TYPE_CHOICES = [
        ('single_choice', 'Single Choice'),
        ('multiple_choice', 'Multiple Choice'),
        ('quantity', 'Quantity'),
        ('boolean', 'Boolean'),
    ]
    option_type = models.CharField(max_length=20, choices=OPTION_TYPE_CHOICES, default='single_choice')

    is_required = models.BooleanField(default=False)
    min_selection = models.IntegerField(default=0)
    max_selection = models.IntegerField(default=1)
    default_value = models.TextField(blank=True, null=True)

    # Display settings
    display_order = models.IntegerField(default=0)
    help_text = models.TextField(blank=True)

    # Status
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'product_options'
        verbose_name = _('product option')
        verbose_name_plural = _('product options')
        indexes = [
            models.Index(fields=['restaurant', 'is_active']),
            models.Index(fields=['display_order']),
        ]
        ordering = ['display_order']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class OptionValue(models.Model):
    option = models.ForeignKey(ProductOption, on_delete=models.CASCADE, related_name='values', db_index=True)

    value = models.TextField()
    description = models.TextField(blank=True)

    # Price modification
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_modifier = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # For cost accounting

    # Availability
    is_available = models.BooleanField(default=True)
    stock_quantity = models.IntegerField(null=True, blank=True)

    # Display settings
    display_order = models.IntegerField(default=0)
    is_default = models.BooleanField(default=False)
    color = models.CharField(max_length=7, blank=True)  # Hex color code
    icon_url = models.URLField(blank=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'option_values'
        verbose_name = _('option value')
        verbose_name_plural = _('option values')
        indexes = [
            models.Index(fields=['option', 'is_available']),
            models.Index(fields=['display_order']),
        ]
        ordering = ['display_order']

    def __str__(self):
        return f"{self.option.name}: {self.value}"

    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class ProductOptionMapping(models.Model):
    """Many-to-many relationship between products and their options."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='option_mappings', db_index=True)
    option = models.ForeignKey(ProductOption, on_delete=models.CASCADE, related_name='product_mappings', db_index=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'product_option_mappings'
        verbose_name = _('product option mapping')
        verbose_name_plural = _('product option mappings')
        unique_together = ['product', 'option']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['option']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.option.name}"