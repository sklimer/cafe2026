from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import secrets
import string


class UserManager(models.Manager):
    def create_user(self, telegram_id, **extra_fields):
        """
        Create and save a user with the given telegram_id.
        """
        if not telegram_id:
            raise ValueError(_('The Telegram ID must be set'))

        user = self.model(telegram_id=telegram_id, **extra_fields)
        user.save(using=self._db)
        return user

    def create_superuser(self, telegram_id, **extra_fields):
        """
        Create and save a superuser with the given telegram_id.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(telegram_id, **extra_fields)

    def get_by_natural_key(self, telegram_id):
        """Для поиска пользователя по natural key (нужен для createsuperuser)"""
        return self.get(telegram_id=telegram_id)


class User(AbstractBaseUser, PermissionsMixin):
    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=255, blank=True, null=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    email = models.EmailField(unique=True, blank=True, null=True, db_index=True)
    language_code = models.CharField(max_length=10, default='ru')
    temp_password = models.CharField(max_length=255, blank=True, null=True, editable=False)

    # ✅ ВАЖНО: Добавляем поле is_staff для доступа к админке
    is_staff = models.BooleanField(
        default=False,
        verbose_name='Доступ к админке',
        help_text='Определяет, имеет ли пользователь доступ к административному сайту.'
    )

    # Business metrics
    total_orders = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus_percent_allowed = models.IntegerField(default=10)

    # Status flags
    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    # Referral system
    referral_code = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    referral_count = models.IntegerField(default=0)

    # Preferences (JSON for flexibility)
    notification_preferences = models.JSONField(default=dict, blank=True)
    settings = models.JSONField(default=dict, blank=True)

    # Timestamps
    registration_date = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(default=timezone.now)
    last_activity = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'telegram_id'  # Use telegram_id as the unique identifier
    REQUIRED_FIELDS = ['first_name']

    class Meta:
        db_table = 'users'
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def save(self, *args, **kwargs):
        # Set default values for JSON fields if they are empty
        if not self.notification_preferences:
            self.notification_preferences = {
                "order_updates": True,
                "promotions": True,
                "newsletter": False,
                "push": True,
                "email": False,
                "sms": False
            }

        if not self.settings:
            self.settings = {
                "default_order_type": "delivery",
                "save_order_history": True,
                "save_addresses": True,
                "theme": "light",
                "currency": "RUB"
            }

        # Update updated_at timestamp
        self.updated_at = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.first_name else f"User {self.telegram_id}"

    @property
    def full_name(self):
        """Return the user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return f"User {self.telegram_id}"

    def get_short_name(self):
        """Return the user's first name."""
        return self.first_name

    def generate_password(self, length=12):
        """Генерация случайного пароля"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        self.set_password(password)  # Хеширует пароль
        self.temp_password = password  # Сохраняем незашифрованный (только для показа)
        self.save()
        return password


class UserAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses', db_index=True)
    alias = models.CharField(max_length=100, default='Дом')
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    street = models.CharField(max_length=255, blank=True)
    house = models.CharField(max_length=50, blank=True)
    entrance = models.CharField(max_length=20, blank=True)
    floor = models.CharField(max_length=20, blank=True)
    apartment = models.CharField(max_length=20, blank=True)
    intercom = models.CharField(max_length=20, blank=True)
    comment = models.TextField(blank=True)

    # Geolocation for distance calculations
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    geolocation_accuracy = models.CharField(max_length=50, blank=True)

    # Status
    is_default = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'user_addresses'
        verbose_name = _('user address')
        verbose_name_plural = _('user addresses')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['user', 'is_default']),
        ]

    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()

        # If this is set as default, unset other defaults for this user
        if self.is_default:
            UserAddress.objects.filter(user=self.user, is_default=True).update(is_default=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.alias}: {self.address}"