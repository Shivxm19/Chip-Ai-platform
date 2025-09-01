# eda-backend/app/services/razorpay.py
# Service for Razorpay integration.

import razorpay
from app.core.config import settings

# Initialize Razorpay client
instance = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
instance.set_app_details({"title": settings.PROJECT_NAME, "version": settings.VERSION}) # Optional: Set app details

async def create_razorpay_order(options: dict) -> dict:
    """
    Creates a new Razorpay order.
    Args:
        options (dict): Dictionary containing order details (amount, currency, receipt, notes).
    Returns:
        dict: The created Razorpay order object.
    Raises:
        Exception: If Razorpay order creation fails.
    """
    try:
        order = instance.order.create(options)
        return order
    except Exception as e:
        print(f"Razorpay Order Creation Error: {e}")
        raise Exception(f"Failed to create Razorpay order: {e}")

async def fetch_razorpay_payment(payment_id: str) -> dict:
    """
    Fetches details of a specific Razorpay payment.
    Args:
        payment_id (str): The ID of the payment to fetch.
    Returns:
        dict: The Razorpay payment object.
    Raises:
        Exception: If fetching payment fails.
    """
    try:
        payment = instance.payment.fetch(payment_id)
        return payment
    except Exception as e:
        print(f"Razorpay Fetch Payment Error: {e}")
        raise Exception(f"Failed to fetch Razorpay payment details: {e}")

