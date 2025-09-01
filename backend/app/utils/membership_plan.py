# eda-backend/app/utils/membership_plans.py
# Logic for membership plans.

from typing import Dict, Any, Optional

MEMBERSHIP_PLANS: Dict[str, Dict[str, Any]] = {
  "free": {
    "name": "Free Tier",
    "price": 0,
    "durationInDays": -1, # Unlimited duration for free tier
    "description": "Limited access to basic tools.",
    "features": [
      "Access to basic PCB viewer",
      "Limited project storage (100MB)",
    ],
    "toolAccess": {
      "pcbDesignTool": False,
      "chipSynthesisTool": False,
      "platformSimulationTool": False,
    },
    "usageLimits": {
      "pcbDesignTool": 0,
      "chipSynthesisTool": 0,
      "platformSimulationTool": 0,
    },
  },
  "basic": {
    "name": "Basic Plan",
    "price": 999, # e.g., 9.99 INR or USD equivalent (in smallest unit, e.g., paisa)
    "durationInDays": 30, # 30 days
    "description": "Access to essential tools and increased storage.",
    "features": [
      "Access to basic PCB design tool (limited runs)",
      "Increased project storage (1GB)",
      "Priority support",
    ],
    "toolAccess": {
      "pcbDesignTool": True,
      "chipSynthesisTool": False,
      "platformSimulationTool": False,
    },
    "usageLimits": {
      "pcbDesignTool": 5, # 5 runs per month
      "chipSynthesisTool": 0,
      "platformSimulationTool": 0,
    },
  },
  "premium": {
    "name": "Premium Plan",
    "price": 1999, # e.g., 19.99 INR or USD equivalent
    "durationInDays": 30, # 30 days
    "description": "Full access to all tools and unlimited storage.",
    "features": [
      "Unlimited access to all PCB, Chip, and Platform tools",
      "Unlimited project storage",
      "24/7 Premium support",
      "Early access to new features",
    ],
    "toolAccess": {
      "pcbDesignTool": True,
      "chipSynthesisTool": True,
      "platformSimulationTool": True,
    },
    "usageLimits": {
      "pcbDesignTool": -1, # Unlimited
      "chipSynthesisTool": -1,
      "platformSimulationTool": -1,
    },
  },
}

def get_membership_plan_details(plan_type: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves details for a specific membership plan.
    Args:
        plan_type (str): The type of plan ('free', 'basic', 'premium').
    Returns:
        dict|None: The plan details object, or None if not found.
    """
    return MEMBERSHIP_PLANS.get(plan_type)

def has_tool_access(plan_type: str, tool_name: str) -> bool:
    """
    Checks if a given membership plan has access to a specific tool.
    Args:
        plan_type (str): The user's membership plan.
        tool_name (str): The name of the tool to check access for.
    Returns:
        bool: True if the plan grants access, false otherwise.
    """
    plan = get_membership_plan_details(plan_type)
    if not plan:
        return False
    return plan["toolAccess"].get(tool_name, False)

def get_tool_usage_limit(plan_type: str, tool_name: str) -> int:
    """
    Retrieves the usage limit for a specific tool under a given plan.
    Args:
        plan_type (str): The user's membership plan.
        tool_name (str): The name of the tool.
    Returns:
        int: The usage limit (-1 for unlimited), or 0 if no access.
    """
    plan = get_membership_plan_details(plan_type)
    if not plan:
        return 0
    return plan["usageLimits"].get(tool_name, 0)

