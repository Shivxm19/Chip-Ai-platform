# eda-backend/app/api/v1/endpoints/payments.py
# API endpoints for payment processing (Razorpay integration, updates MongoDB user membership).

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database as MongoDatabase
from app.db.connections import get_mongo_db
from app.db.firebase_connection import get_firestore_db # Import get_firestore_db
from app.api.deps import get_current_user, CurrentUser
from app.services.razorpay import create_razorpay_order # Razorpay service
import app.utils.membership_plan as membership_plans_util # Use the alias
from app.schemas.user import UserResponse # For returning updated user data
from app.schemas.project import MembershipProductResponse, ToolAccessDetails # Import new schemas
from typing import Annotated, Dict, Any, List
from datetime import datetime, timedelta
import hmac
import hashlib
from pydantic import BaseModel
from app.core.config import settings # Import settings for Razorpay key
from firebase_admin import firestore # Import firestore for SERVER_TIMESTAMP

router = APIRouter()

class CreateOrderRequest(BaseModel):
    amount: float # Amount in your currency (e.g., INR)
    currency: str = "INR"
    planType: str # e.g., 'basic', 'premium' (or the ID of a custom product)

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    planType: str # e.g., 'basic', 'premium' (or the ID of a custom product)

@router.post("/create-order", response_model=dict)
async def create_order(
    order_request: CreateOrderRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)] # Inject firestore_db
):
    """
    Creates a new Razorpay order for membership upgrade.
    If planType is a custom product ID, it will fetch its details.
    """
    amount = order_request.amount
    currency = order_request.currency
    plan_type_or_id = order_request.planType # This can be a base plan name or a custom product ID

    plan_details = None
    custom_product_id = None

    # Try to fetch as a custom product first
    try:
        product_doc = await firestore_db.collection("membershipProducts").document(plan_type_or_id).get()
        if product_doc.exists:
            product_data = product_doc.to_dict()
            plan_details = MembershipProductResponse(**product_data)
            custom_product_id = plan_details.id
            # Use product's price for the order
            amount = plan_details.price
    except Exception:
        # If it's not a Firestore ID, try to get it from predefined plans
        plan_details = membership_plans_util.get_membership_plan_details(plan_type_or_id)
    
    if not plan_details:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid membership plan or product ID.")

    options = {
        "amount": int(amount * 100), # Razorpay expects amount in paisa
        "currency": currency,
        "receipt": f"receipt_user_{current_user.firebase_uid}_{datetime.now().timestamp()}",
        "payment_capture": 1, # Auto capture
        "notes": {
            "userId": current_user.firebase_uid,
            "planType": plan_type_or_id, # Store the original plan type or product ID
            "customProductId": custom_product_id # Store custom product ID if applicable
        },
    }

    try:
        order = await create_razorpay_order(options)
        return {
            "id": order["id"],
            "currency": order["currency"],
            "amount": order["amount"],
            "receipt": order["receipt"],
            "planType": plan_type_or_id,
            "customProductId": custom_product_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {e}"
        )

@router.post("/verify-payment", response_model=UserResponse)
async def verify_payment(
    verify_request: VerifyPaymentRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)] # Inject firestore_db
):
    """
    Verifies Razorpay payment signature and updates user membership in MongoDB.
    """
    razorpay_order_id = verify_request.razorpay_order_id
    razorpay_payment_id = verify_request.razorpay_payment_id
    razorpay_signature = verify_request.razorpay_signature
    plan_type_or_id = verify_request.planType # This can be a base plan name or a custom product ID

    # Get Razorpay Key Secret from settings
    razorpay_key_secret = settings.RAZORPAY_KEY_SECRET

    # Create HMAC SHA256 signature
    body = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        razorpay_key_secret.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    is_authentic = expected_signature == razorpay_signature

    if is_authentic:
        users_collection = mongo_db.users
        
        update_fields = {"updatedAt": datetime.utcnow()}
        active_tool_access: Dict[str, ToolAccessDetails] = {}
        membership_expires_at: Optional[datetime] = None # pyright: ignore[reportUndefinedVariable]
        base_membership_tier: str = current_user.mongo_user.membership # Default to current base tier

        # Determine if it's a custom product or a base plan
        custom_product_assigned_id = None
        plan_details = None

        try:
            product_doc = await firestore_db.collection("membershipProducts").document(plan_type_or_id).get()
            if product_doc.exists:
                product_data = product_doc.to_dict()
                plan_details = MembershipProductResponse(**product_data)
                custom_product_assigned_id = plan_details.id
                base_membership_tier = "premium" # Or a logical mapping for custom products
        except Exception:
            # Not a custom product ID, check predefined plans
            plan_details = membership_plans_util.get_membership_plan_details(plan_type_or_id)
            if plan_details:
                base_membership_tier = plan_type_or_id # Use the base plan name

        if not plan_details:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid membership plan or product ID for verification.")

        # Populate active_tool_access based on the determined plan_details
        if custom_product_assigned_id:
            # Use rules from the custom product
            active_tool_access = plan_details.toolAccess.model_dump()
            if plan_details.durationInDays != -1:
                membership_expires_at = datetime.utcnow() + timedelta(days=plan_details.durationInDays)
        else:
            # Use rules from the base plan (from membership_plans_util)
            for tool_name, has_access in plan_details["toolAccess"].items():
                limit = plan_details["usageLimits"].get(tool_name, 0)
                active_tool_access[tool_name] = {"hasAccess": has_access, "limit": limit}
            if plan_details["durationInDays"] != -1:
                membership_expires_at = datetime.utcnow() + timedelta(days=plan_details["durationInDays"])

        update_fields["membership"] = base_membership_tier
        update_fields["customMembershipProductId"] = custom_product_assigned_id
        update_fields["activeToolAccess"] = active_tool_access
        update_fields["membershipExpiresAt"] = membership_expires_at

        await users_collection.update_one(
            {"firebaseUid": current_user.firebase_uid},
            {"$set": update_fields}
        )

        # Fetch and return the updated user profile
        updated_user_data = await users_collection.find_one({"firebaseUid": current_user.firebase_uid})
        return UserResponse(**updated_user_data)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed: Invalid signature.")

@router.get("/history", response_model=List[Dict[str, Any]])
async def get_payment_history(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)]
):
    """
    Retrieves user's payment history (simulated for now).
    In a real app, this would query a dedicated 'payments' collection in MongoDB.
    """
    # For now, return dummy data. In a real application, you'd fetch this from MongoDB.
    # You might have a 'payments' collection in MongoDB linked to user IDs.
    dummy_history = [
        {
            "id": "pay_dummy123",
            "amount": 999.00,
            "currency": "INR",
            "status": "captured",
            "plan": "basic",
            "date": (datetime.utcnow() - timedelta(days=30)).isoformat(),
        },
        {
            "id": "pay_dummy456",
            "amount": 1999.00,
            "currency": "INR",
            "status": "captured",
            "plan": "premium",
            "date": (datetime.utcnow() - timedelta(days=60)).isoformat(),
        },
    ]

    return dummy_history

