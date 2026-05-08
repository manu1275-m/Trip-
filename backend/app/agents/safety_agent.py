from __future__ import annotations

from app.database.repository import repo
from app.models.schemas import EmergencyContactPublic, EmergencyPlace, SafetyPack
from app.services.geo_service import map_url


class SafetyAgent:
    name = "Safety Agent"

    async def safety_pack(self, email: str, destination: str, warnings: list[str]) -> SafetyPack:
        contacts = [
            EmergencyContactPublic(
                id=item["id"],
                name=item["name"],
                relation=item["relation"],
                phone=item["phone"],
            )
            for item in await repo.list_emergency_contacts(email)
        ]
        nearby = [
            EmergencyPlace(
                name=f"{destination} Government Hospital",
                type="hospital",
                address=f"Central {destination}, India",
                phone=None,
                map_url=map_url(f"hospital near {destination}"),
            ),
            EmergencyPlace(
                name=f"{destination} Police Station",
                type="police",
                address=f"Central {destination}, India",
                phone="112",
                map_url=map_url(f"police station near {destination}"),
            ),
            EmergencyPlace(
                name=f"{destination} 24x7 Pharmacy",
                type="pharmacy",
                address=f"Central {destination}, India",
                phone=None,
                map_url=map_url(f"pharmacy near {destination}"),
            ),
        ]
        safety_warnings = warnings.copy()
        if not contacts:
            safety_warnings.append("No emergency contacts are saved for this user.")
        return SafetyPack(
            emergency_contacts=contacts,
            nearby_help=nearby,
            helplines={"india_emergency": "112", "ambulance": "108", "women_helpline": "1091"},
            safety_warnings=safety_warnings,
        )

