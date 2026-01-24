from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from orders.models import Order


class Payment(models.Model):
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
    
    # Order reference
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments', db_index=True)
    
    # Payment details
    payment_id = models.CharField(max_length=100, unique=True, db_index=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_provider = models.CharField(max_length=50, blank=True)
    
    # Amounts
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='RUB')
    
    # Status
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # External references
    external_payment_id = models.CharField(max_length=100, blank=True)  # ID from payment provider
    external_transaction_id = models.CharField(max_length=100, blank=True)  # Transaction ID from provider
    payment_url = models.URLField(blank=True)  # URL for payment processing
    
    # Additional data
    payment_data = models.JSONField(default=dict, blank=True)  # Provider-specific data
    failure_reason = models.TextField(blank=True)  # Reason if payment failed
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = _('payment')
        verbose_name_plural = _('payments')
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['payment_id']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Payment {self.payment_id} for order {self.order.order_number}"


class PaymentLog(models.Model):
    """Log of all payment-related events."""
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='logs', db_index=True)
    
    # Event details
    event_type = models.CharField(max_length=50)  # 'created', 'processed', 'failed', 'refunded', etc.
    description = models.TextField()
    
    # Data associated with the event
    event_data = models.JSONField(default=dict, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'payment_logs'
        verbose_name = _('payment log')
        verbose_name_plural = _('payment logs')
        indexes = [
            models.Index(fields=['payment', '-created_at']),
            models.Index(fields=['event_type']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment log for {self.payment.payment_id} - {self.event_type}"


class Refund(models.Model):
    REFUND_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
    ]
    
    # References
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refunds', db_index=True)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds', db_index=True)
    
    # Refund details
    refund_id = models.CharField(max_length=100, unique=True, db_index=True)
    reason = models.TextField()
    
    # Amounts
    requested_amount = models.DecimalField(max_digits=10, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='RUB')
    
    # Status
    status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='pending')
    
    # Processing info
    processed_by = models.CharField(max_length=255, blank=True)  # Admin who processed
    rejection_reason = models.TextField(blank=True)  # If refund was rejected
    
    # External references
    external_refund_id = models.CharField(max_length=100, blank=True)  # From payment provider
    refund_data = models.JSONField(default=dict, blank=True)  # Provider-specific data
    
    # Metadata
    requested_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'refunds'
        verbose_name = _('refund')
        verbose_name_plural = _('refunds')
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['payment']),
            models.Index(fields=['refund_id']),
            models.Index(fields=['status']),
        ]
        ordering = ['-requested_at']
    
    def save(self, *args, **kwargs):
        # Update updated_at timestamp
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Refund {self.refund_id} for order {self.order.order_number}"