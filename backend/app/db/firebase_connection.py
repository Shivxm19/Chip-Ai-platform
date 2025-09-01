# eda-backend/app/db/firebase_connections.py

import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.core.config import settings
from fastapi import HTTPException, status
from typing import Any

# Use a dictionary to assemble the credentials from settings
firebase_config = {
"type": "service_account",
"project_id": "silicon-ai-7519b",
"private_key_id": "9f962f396682ea73644eb523c18646f45a4eac56",
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2ariMzgZ+dkG/\nH+zj1gwXfJ7b/hba1GpWhiiseOy4xmbzoxqn1M/TLnXF+x6zl5McY9/43EbQzaLJ\nmPdDkcp5BhFBpBE2h0tTNNfg8Em2HpR38frTBElDh3mPSuGFFRQdiFYM8EGo0IXM\nD17O3Hdo/y1PmPa4WE8dFP41oxnaYNO5/TvK9YPusHFj5rmPn5PiwBtl0bKOK/6p\nsay/9n+UDom0qqgRV6mjOcgIiPLb2NCwcUIrwkf0I9id283JO2kH866u6JEsIyN9\nBgYLKNRkcDg7t7DqH8ffJ/Qws1eAcchA029Mk0L7so3b7hGx6AIQRjGFghH4rC9b\nXulya/zbAgMBAAECggEAD4slHJe1mp2troEkPf8QMAl7aS12ecEIf++V6amy1MUl\nzUmETPFnoAwLwbSgghcT/vhNA7c+sC4a2pNr263Bk0cUE1l36gM575DHewWekk56\nwi8JULptxRD3J7buuS35n9FChn8LvpG+GjbjvOaw+hkRnasKuDHg0+PlDAxQzfhg\nslT3QjYvgvC7lniKD3O72uW2gT1Gp9TGwy5E5Lhj5fVFa2Z/EIBCe9c8/g3dPa2f\n+TQcRFLrZybw1jU8FlHR36gOZWtGeyZQCuRUQVhlrdl5iziUkpdmvl0e+GhqCx4C\nLgtD12fsP9Nqq+hhzIm5l0l3e0TgCPPyzQwK2Q2GiQKBgQDbup7nfJiymnHTYHE4\ntTWanfcsKEEXs6UKLdtCT1tOCOiALIPhuAhIB42UE2DfKyWrZArYPz2zRkH/ZD38\nEo9++1dUrEzhbe5RmrsZMLlB45+D5G2qVGDqNoyuDTkQZah2HZwzLfwwwGfscX+O\nB7IJDOsUPd5XUwNpBS4Tu2gC1QKBgQDUh1pYMdAYAzL23L8tsfmZfW9+GnG6JNVZ\nXq4luO7ILnJ8OsnUpuBGY2fzeW8idQytRnedHC+CciYftXL9HcaSClJj0GE5//gh\nfN84FJxUKUt3z+z9eD1Mq2DqmOyDDr4jDgvzD8Ni3Wfya3+3/XuSMBClaenWxZEC\nUG/jbsf47wKBgQC0NqiTpX47pi5LNmNGJmFzkbGi1tUkUmO/KIMXLKzvIKFIVrpH\ny7+HDCLTWt1tzB6WJnQ6jgvV2H7Sr22jK7njZNNoj/RyQ85dwbFIZMzcvIsdCqHj\nPFdMYTcanZ+60hXL4lc1JrcbaQMTSrdaTvd3MtAvhtqv9lbqsKPs7RzOjQKBgCZO\n430ENZMueHBA6ADvlKMTFhav45H+86nxRAiupfPVU3OLEThQgBqP7nvXhq26VXei\nPQtHulSUCMUsaravOEy4qZMuS2gt+Gbo4D92j5sn+l91Ti1+D+aS+Zwvxmn1LVaa\nQJMmYzyd1g+/Sr06Zpy6JzX5ulmpMPMu1owzOr5nAoGAPhB9urWeXav5sa4V4kZU\nxvc6YMyle1S4ceJDz9L3iO9X+8wkdIQoCkeP1T0pTN1tXV9jITvMr+wggOQIb9k3\n+w5FXdkX+5pZx9tfJLXRJOlQRxMjUeG/Au9M1f9rrCYm4aBtOg8JSfUu83H0Iu8N\nPcyGoZ3gGM2UW8aY0WMrq9Q=\n-----END PRIVATE KEY-----\n",
"client_email": "firebase-adminsdk-fbsvc@silicon-ai-7519b.iam.gserviceaccount.com",
"client_id": "106622890985374772184",
"token_uri": "https://oauth2.googleapis.com/token",
}

# Check if Firebase app is already initialized to prevent errors in reloader mode.
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(firebase_config)
        firebase_admin.initialize_app(cred, {'storageBucket': settings.FIREBASE_STORAGE_BUCKET})
        print("Firebase app initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize Firebase app: {e}")

def get_firestore_db() -> firestore.Client:
    """
    Dependency that provides a Firestore database client.
    """
    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase app is not initialized."
        )
    return firestore.client()

def get_firebase_storage_bucket() -> Any:
    """
    Dependency that provides the Firebase storage bucket.
    """
    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase app is not initialized."
        )
    return storage.bucket()