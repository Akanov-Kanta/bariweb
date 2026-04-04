import logging
import httpx
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import config

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow preflight and public endpoints
        if request.method == "OPTIONS":
            return await call_next(request)
            
        if request.url.path in ["/health", "/docs", "/openapi.json", "/redoc", "/crawl", "/search"]:
            return await call_next(request)
            
        access_token = request.cookies.get("access_token")
        
        # Check authorization header as fallback
        if not access_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                access_token = auth_header.split(" ")[1]

        if not access_token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required. Missing access_token."}
            )
        
        try:
            # Verify the token via the main backend
            verify_url = f"{config.BACKEND_API_URL.rstrip('/')}/auth/verify"
            
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    verify_url,
                    cookies={"access_token": access_token} if not request.headers.get("Authorization") else None,
                    headers={"Authorization": f"Bearer {access_token}"} if request.headers.get("Authorization") else None,
                    timeout=5.0
                )
                
            if resp.status_code != 200:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or expired token"}
                )
                
            # If valid, inject user data to request state
            request.state.user = resp.json()
            
        except httpx.RequestError as e:
            logger.error(f"Error checking auth with backend: {e}")
            return JSONResponse(
                status_code=503,
                content={"detail": f"Auth validation service unavailable: {e}"}
            )

        # Proceed to route
        response = await call_next(request)
        return response
