from fastapi.middleware.cors import CORSMiddleware
from app.services.cors_service import get_allowed_origins

class DynamicCORSMiddleware(CORSMiddleware):
    def is_allowed_origin(self, origin: str) -> bool:
        """
        Check if the origin is allowed.
        First checks static allow_origins, then checks dynamic origins from DB.
        """
        # 1. Check static origins (config-based)
        if super().is_allowed_origin(origin):
            return True
        
        # 2. Check dynamic origins from DB (cached)
        allowed_origins = get_allowed_origins()
        return origin in allowed_origins
