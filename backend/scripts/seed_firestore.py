# eda-backend/scripts/seed_firestore.py
# A one-time script to seed initial data into Firestore,
# specifically for ToolAccessConfig.

import asyncio
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings
from app.utils.membership_plan import MEMBERSHIP_PLANS # Import the defined plans
from app.schemas.project import ToolAccessConfig # Import the Pydantic schema
from typing import Any # Import Any for client_id type hint

async def seed_tool_access_configs():
    """
    Connects to Firebase and seeds initial ToolAccessConfig data into Firestore.
    """
    print("Starting Firestore seeding process...")

    # Initialize Firebase Admin SDK (similar to connections.py)
    try:
        if not firebase_admin._apps:
            firebase_private_key_formatted = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": "silicon-ai-7519b",
                "private_key_id": "32b2994b8aa97bd1cf540a724db16b7b18a330d3",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCgidMpkft/Y7m/\nhRIHdkdCqdivsAqOI6aXVCQBGGWZs5WmeQ4nztimf/UQ39UnoHHnSbpNvQgxPZKC\nxJ7WmDCfpADKqiUNcFVPAG2XrTuEdK9NJVe0UxDfWGnmezt0ai6r0QVyhEUxy/n1\nXHj77D2U1txYprTbHsLuknSDHTMxZn80wwZd+AbR3/9MRH4NA9ZYR3P38yp2OnlH\nSPHIxwTSuTrRFdwAuzI0RZqAD6jDs56lS6cdKP9cbP4e6rEwnFOPBsh8JlDuKhoq\n4OSpE7an2tK+oprGRrqYdzOz76JuaE4iu65LvEKrB2/0WZWqAffeh9rO/gP/G4G1\n19lr8CxNAgMBAAECggEACxFFYTKWHvOnya5pjkfwsYW9EWudAEYwuD90PGEYTAh0\nUv9tSU0T/lju8uSQSnf5fxaQ0fnFhIOFELlv/xJYTWeRW5qiprKgwJGifItUTmIV\nXceq+RykgQlHqVYqKwq3WfmbtKF6yOwrhZqEIRxpwgbIA3j55rgc4mg7wRHa+b15\nSvz3Qs1M4t3MPPba4+bCjxBpnTRBe+lsd+QyxzB0/6YzYfY0HtZ+DBZ0nhcfI0dE\nKTcci8qCFQru/TV6zTu4YDpa0HdXB3L9FQRss5C8khLtc2Pywu4lYHXe9d9xDkaz\nHgEewl1JUTo5eYh2zDbxlvn6QYlUpbwCVenu/sHAnwKBgQDZBhnMBuLnG3p8w1zm\nOkaYeaMVEx+e9pOBiTtN6lQ2+uFn2H1S2iag6M/M2kUtu/pVa4v0Mn+cWr9dHyIh\ng+jefrcyP6xyZyKq2ytfkQzJytp1UPH4Jo9RC4a+rx0imh0tJQmkjI3AXzL5pnzj\nWudujo2N/l1tFk2Cb8UGpC+eMwKBgQC9Xr7y7S3+ONkXptJxr+mcBw3nKxIX+XHP\nPYIl7eRqa3TQGbnux/p6lg9Tcbv5SbAyBK6EC+m1tjMBzsYBVfgCyX/6hmYIUjs4\nnzFVnM3jZQcOItXQMR6UifNXCAd24xzjYh6I2vLaBgyvy3dJ4k56LVe847vwz0gH\nlafXW+mLfwKBgF+4qyQsXWQl4I6q9IyvY3fZHq8q8iWBCGp4BupE0sQ1P7o36H7k\nrWkHhrAKDb0wTifi+aXJqDNka0c9diZmMg4Awfit0PfcuZO2e5j5NzTB/j0EaNVU\n3J2YgeQVBLrAUuIYlfo37EXPN4KZhjgZXj6LLbBVYwu8bI99kN9vB3m1AoGAAyBf\nUq9rxPi3TNaqPspCtxq+tgRWBiNOJ7fCQFIPJVqk0RK7qR+QGRoFIsGL8u+ugwTk\nxLVVpHRfnzYEutzqfVFKVZ6GbLi+1Y57SAiQtaJjXW5hzVAiSx2D8Pnm9aWGQpLK\nIkRLIiJbb0OSspuT5Bx/iFTSM4WYkNd9r+aKko0CgYEArqIgzK6RIcyKTFrzENYh\ngNXVHMOtpjVt57710i7Z8NGupPvZWIoyOvktbqZbl5s1gCBJ6zZYg3xK2uUw8ZId\n9cTJgrbrA4l55zBL7Ff58yWluQGZ2XN8AJnmIU1FYourAVF1omGBTULVUKAa04nW\nCdDF2AkdWycC6zc+NuhL2OU=\n-----END PRIVATE KEY-----\n",
                "client_email": "firebase-adminsdk-fbsvc@silicon-ai-7519b.iam.gserviceaccount.com",
                "client_id": "106622890985374772184", # IMPORTANT: Replace with your actual client_id from JSON key
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL}",
           })
            firebase_app = firebase_admin.initialize_app(cred)
            print("🔥 Firebase Admin SDK Initialized successfully for seeding!")
        else:
            firebase_app = firebase_admin.get_app()
            print("🔥 Firebase Admin SDK already initialized for seeding.")
        
        db = firestore.client(firebase_app)

    except Exception as e:
        print(f"❌ Firebase Admin SDK initialization failed for seeding: {e}")
        return # Exit if initialization fails

    tool_access_collection = db.collection("toolAccessConfigs")
    loop = asyncio.get_event_loop() # Get the current event loop

    # Define the tools and their access configurations based on MEMBERSHIP_PLANS
    tools_to_seed = {
        "pcbDesignTool": {
            "accessLevels": {
                "free": MEMBERSHIP_PLANS["free"]["toolAccess"]["pcbDesignTool"],
                "basic": MEMBERSHIP_PLANS["basic"]["toolAccess"]["pcbDesignTool"],
                "premium": MEMBERSHIP_PLANS["premium"]["toolAccess"]["pcbDesignTool"],
            },
            "usageLimits": {
                "free": MEMBERSHIP_PLANS["free"]["usageLimits"]["pcbDesignTool"],
                "basic": MEMBERSHIP_PLANS["basic"]["usageLimits"]["pcbDesignTool"],
                "premium": MEMBERSHIP_PLANS["premium"]["usageLimits"]["pcbDesignTool"],
            },
        },
        "chipSynthesisTool": {
            "accessLevels": {
                "free": MEMBERSHIP_PLANS["free"]["toolAccess"]["chipSynthesisTool"],
                "basic": MEMBERSHIP_PLANS["basic"]["toolAccess"]["chipSynthesisTool"],
                "premium": MEMBERSHIP_PLANS["premium"]["toolAccess"]["chipSynthesisTool"],
            },
            "usageLimits": {
                "free": MEMBERSHIP_PLANS["free"]["usageLimits"]["chipSynthesisTool"],
                "basic": MEMBERSHIP_PLANS["basic"]["usageLimits"]["chipSynthesisTool"],
                "premium": MEMBERSHIP_PLANS["premium"]["usageLimits"]["chipSynthesisTool"],
            },
        },
        "platformSimulationTool": {
            "accessLevels": {
                "free": MEMBERSHIP_PLANS["free"]["toolAccess"]["platformSimulationTool"],
                "basic": MEMBERSHIP_PLANS["basic"]["toolAccess"]["platformSimulationTool"],
                "premium": MEMBERSHIP_PLANS["premium"]["toolAccess"]["platformSimulationTool"],
            },
            "usageLimits": {
                "free": MEMBERSHIP_PLANS["free"]["usageLimits"]["platformSimulationTool"],
                "basic": MEMBERSHIP_PLANS["basic"]["usageLimits"]["platformSimulationTool"],
                "premium": MEMBERSHIP_PLANS["premium"]["usageLimits"]["platformSimulationTool"],
            },
        },
    }

    for tool_name, config_data in tools_to_seed.items():
        doc_ref = tool_access_collection.document(tool_name)
        
        # CORRECTED: Run synchronous .get() in an executor
        doc = await loop.run_in_executor(None, lambda: doc_ref.get())
        
        if doc.exists:
            print(f"ToolAccessConfig for '{tool_name}' already exists. Skipping.")
            continue
        
        # Create a Pydantic model instance to ensure data validity
        tool_config = ToolAccessConfig(
            toolName=tool_name,
            accessLevels=config_data["accessLevels"],
            usageLimits=config_data["usageLimits"],
            createdAt=firestore.SERVER_TIMESTAMP,
            updatedAt=firestore.SERVER_TIMESTAMP,
        )
        
        # CORRECTED: Run synchronous .set() in an executor
        await loop.run_in_executor(None, lambda: doc_ref.set(tool_config.model_dump()))
        print(f"Seeded ToolAccessConfig for '{tool_name}'.")

    print("Firestore seeding process completed.")

if __name__ == "__main__":
    # Ensure the .env file is loaded for settings
    from dotenv import load_dotenv
    load_dotenv()
    
    asyncio.run(seed_tool_access_configs())