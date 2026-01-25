
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from users.models import User


class Restaurant(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=100, blank=True)
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    cover_url = models.URLField(blank=True)
    website = models.URLField(blank=True)

    # Contact info
    contact_phone = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)
    support_phone = models.CharField(max_length=50, blank=True)

    # Legal info
    legal_name = models.CharField(max_length=255, blank=True)
    inn = models.CharField(max_length=20, blank=True)
    kpp = models.CharField(max_length=20, blank=True)
    ogrn = models.CharField(max_length=20, blank=True)
    legal_address = models.TextField(blank=True)

    # Settings
    timezone_name = models.CharField(max_length=50, default='Europe/Moscow')
    currency = models.CharField(max_length=3, default='RUB')
    default_language = models.CharField(max_length=10, default='ru')

    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    verification_status = models.CharField(max_length=50, choices=VERIFICATION_STATUS_CHOICES, default='pending')

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'restaurants'
        verbose_name = _('restaurant')
        verbose_name_plural = _('restaurants')
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_featured']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            from django.utils.text import slugify
            import uuid
            slug = slugify(self.name, allow_unicode=True)
            original_slug = slug
            counter = 1
            while Restaurant.objects.filter(slug=slug).exists():
                slug = f"{original_slug}-{counter}"
                counter += 1
            self.slug = slug
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class RestaurantBranch(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='branches', db_index=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=100, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True)

    # Geolocation
    latitude = models.DecimalField(max_digits=10, decimal_places=8, db_index=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, db_index=True)

    # Contact info
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    manager_name = models.CharField(max_length=255, blank=True)
    manager_phone = models.CharField(max_length=50, blank=True)

    # Business hours (JSON для гибкости)
    business_hours = models.JSONField(default=dict, blank=True)

    # Order settings
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_order_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    preparation_time_min = models.IntegerField(default=30)
    preparation_time_max = models.IntegerField(default=60)

    # Delivery settings
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_radius_meters = models.IntegerField(default=5000)
    free_delivery_threshold = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_fee_ranges = models.JSONField(default=list, blank=True)  # [{"min_distance": 0, "max_distance": 2000, "fee": 100}]

    # Payment methods
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card_online', 'Card Online'),
        ('card_on_delivery', 'Card on Delivery'),
        ('bonus', 'Bonus Points'),
    ]
    accepted_payment_methods = models.JSONField(default=list, blank=True)  # List of payment method codes

    # Status
    is_active = models.BooleanField(default=True)
    is_accepting_orders = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'restaurant_branches'
        verbose_name = _('restaurant branch')
        verbose_name_plural = _('restaurant branches')
        indexes = [
            models.Index(fields=['restaurant', 'is_active']),
            models.Index(fields=['city']),
            models.Index(fields=['is_accepting_orders']),
        ]

    def save(self, *args, **kwargs):
        # Set default business hours if not provided
        if not self.business_hours:
            self.business_hours = {
                "monday": {"pickup": {"start": "09:00", "end": "23:00"}, "delivery": {"start": "10:00", "end": "22:00"}},
                "tuesday": {"pickup": {"start": "09:00", "end": "23:00"}, "delivery": {"start": "10:00", "end": "22:00"}},
                "wednesday": {"pickup": {"start": "09:00", "end": "23:00"}, "delivery": {"start": "10:00", "end": "22:00"}},
                "thursday": {"pickup": {"start": "09:00", "end": "23:00"}, "delivery": {"start": "10:00", "end": "22:00"}},
                "friday": {"pickup": {"start": "09:00", "end": "00:00"}, "delivery": {"start": "10:00", "end": "23:00"}},
                "saturday": {"pickup": {"start": "10:00", "end": "00:00"}, "delivery": {"start": "11:00", "end": "23:00"}},
                "sunday": {"pickup": {"start": "10:00", "end": "22:00"}, "delivery": {"start": "11:00", "end": "21:00"}}
            }

        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"

    def is_open_now(self):
        """Check if the branch is open now based on business hours."""
        import datetime
        now = timezone.now()
        day_name = now.strftime('%A').lower()
        current_time = now.time()

        if day_name in self.business_hours:
            day_hours = self.business_hours[day_name]
            # Check both pickup and delivery times
            for order_type in ['pickup', 'delivery']:
                if order_type in day_hours:
                    start_time = datetime.datetime.strptime(day_hours[order_type]['start'], '%H:%M').time()
                    end_time = datetime.datetime.strptime(day_hours[order_type]['end'], '%H:%M').time()

                    # Handle overnight shifts (when end time is less than start time)
                    if start_time <= end_time:
                        # Regular day shift
                        if start_time <= current_time <= end_time:
                            return True
                    else:
                        # Overnight shift (e.g., 22:00 to 02:00)
                        if current_time >= start_time or current_time <= end_time:
                            return True

        return False

    def get_next_opening_time(self):
        """Get the next opening time."""
        import datetime
        now = timezone.now()
        current_day = now.weekday()  # Monday is 0, Sunday is 6

        # Try to find opening time in the rest of the week
        for i in range(7):
            day_idx = (current_day + i) % 7
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            day_name = day_names[day_idx]

            if day_name in self.business_hours:
                day_hours = self.business_hours[day_name]

                # If it's the current day and we're closed, check opening time
                if i == 0:  # Current day
                    current_time = now.time()
                    for order_type in ['pickup', 'delivery']:
                        if order_type in day_hours:
                            start_time = datetime.datetime.strptime(day_hours[order_type]['start'], '%H:%M').time()

                            # If current time is before opening time
                            if current_time < start_time:
                                if day_idx == current_day:
                                    # Same day
                                    next_opening = now.replace(hour=start_time.hour, minute=start_time.minute, second=0, microsecond=0)
                                else:
                                    # Different day
                                    days_ahead = day_idx - current_day
                                    if days_ahead < 0:  # Target day already happened this week
                                        days_ahead += 7
                                    next_opening = (now + datetime.timedelta(days=days_ahead)).replace(
                                        hour=start_time.hour, minute=start_time.minute, second=0, microsecond=0
                                    )
                                return next_opening

                # If it's a different day, just return the opening time
                else:
                    day_hours = self.business_hours[day_name]
                    start_time = datetime.datetime.strptime(day_hours['pickup']['start'], '%H:%M').time()  # Use pickup as default
                    days_ahead = day_idx - current_day
                    if days_ahead < 0:  # Target day already happened this week
                        days_ahead += 7
                    next_opening = (now + datetime.timedelta(days=days_ahead)).replace(
                        hour=start_time.hour, minute=start_time.minute, second=0, microsecond=0
                    )
                    return next_opening

        return None