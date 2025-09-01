# eda-backend/app/api/v1/endpoints/admin.py
# Admin API endpoints for managing users and membership products.

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database as MongoDatabase
from firebase_admin import firestore
# CORRECTED IMPORT: Separate MongoDB and Firebase connections into their respective files
from app.db.connections import get_mongo_db
from app.db.firebase_connection import get_firestore_db
from app.api.deps import get_current_admin_user, CurrentUser # CORRECTED: Renamed dependency to match our plan
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.membership import ToolAccessConfig, ToolAccessDetails, MembershipProductCreate, MembershipProductUpdate, MembershipProductResponse
from app.utils.membership_plan import MEMBERSHIP_PLANS
from app.models.user import User as MongoUser
from typing import Annotated, List, Dict, Any, Optional
from datetime import datetime, timedelta

router = APIRouter()

# --- Admin User Management ---
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_admin_user: Annotated[CurrentUser, Depends(get_current_admin_user)],
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)]
):
    """
    Retrieves all user profiles from MongoDB. (Admin only)
    """
    users_collection = mongo_db.users
    users_data = await users_collection.find().to_list(1000)
    return [UserResponse(**user) for user in users_data]

@router.put("/users/{firebase_uid}/membership", response_model=UserResponse)
async def update_user_membership(
    firebase_uid: str,
    membership: Optional[str] = None,
    custom_product_id: Optional[str] = None,
    current_admin_user: Annotated[CurrentUser, Depends(get_current_admin_user)],
    mongo_db: Annotated[MongoDatabase, Depends(get_mongo_db)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Updates a user's base membership and/or assigns a custom membership product. (Admin only)
    This will also recalculate and update the 'activeToolAccess' in the user's MongoDB profile.
    """
    users_collection = mongo_db.users
    user_data = await users_collection.find_one({"firebaseUid": firebase_uid})

    if not user_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    update_fields = {"updatedAt": datetime.utcnow()}
    
    current_membership = user_data.get("membership", "free")

    if membership:
        if membership in MEMBERSHIP_PLANS:
            update_fields["membership"] = membership
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base membership type.")
    
    # CORRECTED: Handle custom_product_id directly, allowing it to be None
    update_fields["customMembershipProductId"] = custom_product_id

    # --- Recalculate activeToolAccess based on new membership/product ---
    active_tool_access: Dict[str, ToolAccessDetails] = {}
    membership_expires_at: Optional[datetime] = None
    
    effective_membership = update_fields.get("membership", current_membership)
    effective_custom_product_id = update_fields.get("customMembershipProductId")

    if effective_custom_product_id:
        product_doc = await firestore_db.collection("membershipProducts").document(effective_custom_product_id).get()
        if not product_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom Membership Product not found.")
        
        product_schema = MembershipProductResponse(id=product_doc.id, **product_doc.to_dict())
        active_tool_access = product_schema.toolAccess.model_dump()
        if product_schema.durationInDays != -1:
            membership_expires_at = datetime.utcnow() + timedelta(days=product_schema.durationInDays)
    else:
        # Use the base membership plan rules
        base_plan_details = MEMBERSHIP_PLANS.get(effective_membership)
        if base_plan_details:
            # Construct ToolAccessDetails from the MEMBERSHIP_PLANS constant
            active_tool_access = {
                tool_name: {"hasAccess": base_plan_details["toolAccess"].get(tool_name, False),
                            "limit": base_plan_details["usageLimits"].get(tool_name, 0)}
                for tool_name in base_plan_details["toolAccess"]
            }
            if base_plan_details["durationInDays"] != -1:
                membership_expires_at = datetime.utcnow() + timedelta(days=base_plan_details["durationInDays"])

    update_fields["activeToolAccess"] = active_tool_access
    update_fields["membershipExpiresAt"] = membership_expires_at

    # Perform the update in MongoDB
    await users_collection.update_one(
        {"firebaseUid": firebase_uid},
        {"$set": update_fields}
    )

    updated_user_data = await users_collection.find_one({"firebaseUid": firebase_uid})
    return UserResponse(**updated_user_data)


# --- Admin Membership Product Management ---
@router.post("/membership-products", response_model=MembershipProductResponse, status_code=status.HTTP_201_CREATED)
async def create_membership_product(
    product_in: MembershipProductCreate,
    current_admin_user: Annotated[CurrentUser, Depends(get_current_admin_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Creates a new custom membership product (service bundle) in Firestore. (Admin only)
    """
    product_data = product_in.model_dump()
    product_data["createdAt"] = product_data["updatedAt"] = firestore.SERVER_TIMESTAMP

    product_ref = firestore_db.collection("membershipProducts").document()
    await product_ref.set(product_data)

    created_product_doc = await product_ref.get()
    return MembershipProductResponse(id=created_product_doc.id, **created_product_doc.to_dict())

@router.get("/membership-products", response_model=List[MembershipProductResponse])
async def get_all_membership_products(
    current_admin_user: Annotated[CurrentUser, Depends(get_current_admin_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Retrieves all custom membership products from Firestore. (Admin only)
    """
    products_snapshot = await firestore_db.collection("membershipProducts").get()
    products = []
    for doc in products_snapshot:
        products.append(MembershipProductResponse(id=doc.id, **doc.to_dict()))
    return products

@router.put("/membership-products/{product_id}", response_model=MembershipProductResponse)
async def update_membership_product(
    product_id: str,
    product_in: MembershipProductUpdate,
    current_admin_user: Annotated[CurrentUser, Depends(get_current_admin_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Updates an existing custom membership product in Firestore. (Admin only)
    """
    product_ref = firestore_db.collection("membershipProducts").document(product_id)
    product_doc = await product_ref.get()

    if not product_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership Product not found.")

    updates = product_in.model_dump(exclude_unset=True)
    updates["updatedAt"] = firestore.SERVER_TIMESTAMP

    await product_ref.update(updates)

    updated_product_doc = await product_ref.get()
    return MembershipProductResponse(id=updated_product_doc.id, **updated_product_doc.to_dict())

@router.delete("/membership-products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_membership_product(
    product_id: str,
    current_admin_user: Annotated[CurrentUser, Depends(get_current_admin_user)],
    firestore_db: Annotated[firestore.Client, Depends(get_firestore_db)]
):
    """
    Deletes a custom membership product from Firestore. (Admin only)
    """
    product_ref = firestore_db.collection("membershipProducts").document(product_id)
    product_doc = await product_ref.get()

    if not product_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership Product not found.")
    
    await product_ref.delete()
    return