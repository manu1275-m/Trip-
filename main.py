from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from api.trip_routes import router

app = FastAPI()

# Redirect root to docs
@app.get("/")
def redirect_to_docs():
    return RedirectResponse(url="/docs")

# Include your routes
app.include_router(router)