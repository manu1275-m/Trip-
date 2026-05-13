import asyncio
import httpx

async def check():
    api_key = "0bd2557ac8e9b40f33ccbb64650dddbe"
    # Mumbai coordinates
    lat = 19.0760
    lon = 72.8777
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}
            )
            print(f"Status: {res.status_code}")
            print(f"Body: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(check())
