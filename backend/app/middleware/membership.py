# eda-backend/app/middleware/membership.py
# Middleware to check user's membership plan before granting access to tools.

from fastapi import HTTPException, status, Depends
from firebase_admin import firestore
from app.db.firebase_connection import get_firestore_db
from app.api.deps import get_current_user, CurrentUser
# CORRECTED IMPORT: Import from the new membership schema file
from app.schemas.membership import ToolAccessConfig, ToolAccessDetails
from app.schemas.project import MembershipProductResponse # Still need this for MembershipProduct
from app.utils.membership_plan import MEMBERSHIP_PLANS # Import MEMBERSHIP_PLANS for fallback
from datetime import datetime, timedelta
from typing import Annotated, Callable, Dict

def check_membership(tool_name: str) -> Callable[[CurrentUser, firestore.Client], None]:
    """
    Dependency factory to check if the user's membership grants access to a specific tool.
    This now checks:
    1. If user has activeToolAccess cached (from custom product or base plan).
    2. If not, fetches custom product from Firestore.
    3. Falls back to base MEMBERSHIP_PLANS if no custom product or if custom product doesn't define tool.
    Also checks for membership expiry.
    """
    async def _check_membership_dependency(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
        firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
    ) -> None:
        """
        The actual dependency logic that gets executed.
        """
        user_mongo_profile = current_user.mongo_user

        if not user_mongo_profile:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not authenticated.")

        user_membership = user_mongo_profile.membership
        membership_expires_at = user_mongo_profile.membershipExpiresAt
        custom_product_id = user_mongo_profile.customMembershipProductId
        active_tool_access_cache = user_mongo_profile.activeToolAccess # This field will be populated by admin update

        # Check if membership has expired (only for paid plans)
        if user_membership != 'free' and membership_expires_at and membership_expires_at < datetime.utcnow():
            # In a real app, you might trigger an update to set their membership back to 'free'
            # and clear custom_product_id and active_tool_access here.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your membership has expired. Please renew to access this tool."
            )

        # 1. Check if tool access is explicitly defined in activeToolAccess cache
        if active_tool_access_cache and tool_name in active_tool_access_cache:
            tool_details = ToolAccessDetails(**active_tool_access_cache[tool_name])
            if tool_details.hasAccess:
                # Optional: Implement usage limit check here if not already done by the tool controller
                return # Access granted
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Your current plan does not grant access to '{tool_name}'."
                )

        # 2. If not in cache, and a custom product is assigned, look up the custom product
        if custom_product_id:
            product_doc = await firestore_db.collection("membershipProducts").document(custom_product_id).get()
            if product_doc.exists:
                product_data = product_doc.to_dict()
                product_schema = MembershipProductResponse(**product_data)
                
                tool_details = product_schema.toolAccess.get(tool_name)
                if tool_details and tool_details.hasAccess:
                    # Optional: Implement usage limit check here
                    return # Access granted
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Your custom plan '{product_schema.name}' does not grant access to '{tool_name}'."
                    )
            else:
                print(f"Warning: Custom Membership Product '{custom_product_id}' not found in Firestore. Falling back to base plan.")

        # 3. Fallback to base membership plans (free, basic, premium)
        base_plan_details = MEMBERSHIP_PLANS.get(user_membership)
        if base_plan_details:
            has_access = base_plan_details["toolAccess"].get(tool_name, False)
            if has_access:
                # Optional: Implement usage limit check here
                return # Access granted
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Your base membership ({user_membership}) does not grant access to '{tool_name}'. Please upgrade."
                )
        
        # If no plan or no access defined, deny by default
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access to '{tool_name}' is denied. No valid membership found."
        )

    return _check_membership_dependency

