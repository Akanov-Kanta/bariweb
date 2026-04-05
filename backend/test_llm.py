from app.services.a11y_ai import a11y_ai_service
try:
    res = a11y_ai_service.simplify_text("complex text")
    print("Result:", res)
except Exception as e:
    print("Error:", e)
