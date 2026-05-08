"use client";

import {
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle2,
  Hotel,
  Loader2,
  MapPin,
  Phone,
  Plane,
  RefreshCw,
  Route,
  Send,
  Shield,
  Train,
  UserRound,
  UsersRound
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { API_BASE, apiFetch } from "@/lib/api";

type Step = "login" | "profile" | "trip" | "itinerary" | "transport" | "travelers" | "summary";

type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

type MonitoringSnapshot = {
  weather: Record<string, string | number | boolean>;
  traffic: Record<string, string | number | boolean>;
  safety_alerts: string[];
  replan_required: boolean;
  recommended_action: string;
};

type TripPlan = {
  trip_id: string;
  destination_validation: {
    message: string;
    location?: { display_name?: string; lat?: number; lon?: number };
  };
  itinerary: Array<{
    day: number;
    date: string;
    zone: string;
    departure_time: string;
    expected_return_time: string;
    route_summary: string;
    replanning_note?: string | null;
    places: Array<{ name: string; category: string; map_url: string; notes: string }>;
    schedule: Array<{ start: string; end: string; title: string; type: string; notes?: string }>;
  }>;
  stays: Array<{
    name: string;
    zone: string;
    estimated_price_per_night: number;
    availability: { available: boolean; message: string; confidence: string };
    booking_url: string;
    distance_note: string;
  }>;
  intercity_transport: Array<{
    mode: string;
    provider: string;
    departure_time: string;
    arrival_time: string;
    duration_minutes: number;
    estimated_price: number;
    availability: { available: boolean; message: string; confidence: string };
    booking_url: string;
    notes: string;
  }>;
  local_mobility: Array<{
    provider: string;
    vehicle_type: string;
    eta_minutes: number;
    estimated_price: number;
    suitability_score: number;
    booking_url: string;
    notes: string;
  }>;
  monitoring: MonitoringSnapshot;
  safety: {
    emergency_contacts: EmergencyContact[];
    nearby_help: Array<{ name: string; type: string; address: string; map_url: string; phone?: string }>;
    helplines: Record<string, string>;
    safety_warnings: string[];
  };
  return_journey: {
    checkout_time: string;
    leave_for_terminal_time: string;
    terminal_eta: string;
    traffic_buffer_minutes: number;
    recommended_transport: {
      mode: string;
      provider: string;
      departure_time: string;
      estimated_price: number;
      booking_url: string;
    };
  };
  booking_readiness: { ready: boolean; note: string; blocked_reasons: string[] };
};

type ApiMessage = {
  message: string;
  details?: {
    delivery?: { status?: string; reason?: string; provider?: string; to?: string };
  };
};

type Traveler = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  gender: string;
  age: number;
};

type UserProfile = {
  email: string;
  name?: string | null;
  phone?: string | null;
  gender?: string | null;
  age?: number | null;
  government_id?: {
    id_type?: string | null;
    id_number?: string | null;
    issuing_country?: string | null;
  } | null;
};

const steps: Array<{ id: Step; label: string }> = [
  { id: "login", label: "Login" },
  { id: "profile", label: "User & emergency" },
  { id: "trip", label: "Trip input" },
  { id: "itinerary", label: "Itinerary" },
  { id: "transport", label: "Transport" },
  { id: "travelers", label: "Travelers" },
  { id: "summary", label: "All details" }
];

const emptyProfileForm = {
  name: "",
  phone: "",
  gender: "",
  age: "",
  id_type: "",
  id_number: "",
  issuing_country: ""
};

const emptyContactForm = {
  name: "",
  relation: "",
  phone: ""
};

const emptyTravelerForm = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  age: "",
  id_type: "",
  id_number: "",
  issuing_country: ""
};

export default function Home() {
  const [activeStep, setActiveStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState("");
  const [notice, setNotice] = useState("Ready");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [needEmergency, setNeedEmergency] = useState(false);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [travelerForm, setTravelerForm] = useState(emptyTravelerForm);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [selectedTravelers, setSelectedTravelers] = useState<string[]>([]);
  const [history, setHistory] = useState<TripPlan[]>([]);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [tripForm, setTripForm] = useState({
    current_location: "",
    destination: "",
    travel_date: "",
    number_of_days: "",
    budget: "",
    interests: ""
  });

  const authReady = Boolean(token);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("travel_companion_token") ?? "";
    if (savedToken) {
      window.setTimeout(() => {
        setToken(savedToken);
        void refreshSavedData(savedToken);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run<T>(label: string, action: () => Promise<T>) {
    setLoading(label);
    setError("");
    try {
      const result = await action();
      setNotice(label);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      return null;
    } finally {
      setLoading("");
    }
  }

  async function refreshSavedData(activeToken = token) {
    if (!activeToken) return;
    const [profileData, travelerData, contactData, tripData] = await Promise.all([
      apiFetch<UserProfile>("/profile", {}, activeToken),
      apiFetch<Traveler[]>("/travelers", {}, activeToken),
      apiFetch<EmergencyContact[]>("/emergency-contacts", {}, activeToken),
      apiFetch<TripPlan[]>("/trips/history", {}, activeToken)
    ]);
    setProfile(profileData);
    setTravelers(travelerData);
    setContacts(contactData);
    setHistory(tripData);
  }

  async function requestOtp() {
    setOtp("");
    const response = await run("OTP requested", () =>
      apiFetch<ApiMessage>("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email })
      })
    );
    const delivery = response?.details?.delivery;
    if (delivery?.status === "sent") {
      setNotice(`Email accepted by ${delivery.provider ?? "SMTP"}${delivery.to ? ` to ${delivery.to}` : ""}`);
    } else if (delivery?.reason) {
      setNotice(delivery.reason);
    }
  }

  async function verifyOtp() {
    const response = await run("Signed in", () =>
      apiFetch<{ access_token: string }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp })
      })
    );
    if (response?.access_token) {
      setToken(response.access_token);
      window.localStorage.setItem("travel_companion_token", response.access_token);
      await refreshSavedData(response.access_token);
      setActiveStep("profile");
    }
  }

  async function saveProfileAndEmergency(event: FormEvent) {
    event.preventDefault();
    const saved = await run("Profile saved", () =>
      apiFetch<UserProfile>(
        "/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            name: profileForm.name,
            phone: profileForm.phone,
            gender: profileForm.gender,
            age: Number(profileForm.age),
            government_id: {
              id_type: profileForm.id_type,
              id_number: profileForm.id_number,
              issuing_country: profileForm.issuing_country
            }
          })
        },
        token
      )
    );
    if (saved) {
      setProfile(saved);
      setProfileForm(emptyProfileForm);
      if (needEmergency) {
        const contact = await run("Emergency contact saved", () =>
          apiFetch<EmergencyContact>(
            "/emergency-contacts",
            {
              method: "POST",
              body: JSON.stringify(contactForm)
            },
            token
          )
        );
        if (!contact) {
          return;
        }
        setContacts((items) => [contact, ...items]);
        setContactForm(emptyContactForm);
      }
      setNeedEmergency(false);
      setActiveStep("trip");
    }
  }

  async function generatePlan(event: FormEvent) {
    event.preventDefault();
    const payload = {
      current_location: tripForm.current_location,
      destination: tripForm.destination,
      travel_date: tripForm.travel_date,
      number_of_days: Number(tripForm.number_of_days),
      travelers: [],
      saved_traveler_ids: selectedTravelers,
      preferences: {
        budget: tripForm.budget,
        interests: tripForm.interests.split(",").map((item) => item.trim()).filter(Boolean),
        accessibility_needs: []
      }
    };
    const response = await run("Trip plan generated", () =>
      apiFetch<TripPlan>("/trips/plan", { method: "POST", body: JSON.stringify(payload) }, token)
    );
    if (response) {
      setPlan(response);
      await refreshSavedData();
      setActiveStep("itinerary");
    }
  }

  async function saveTraveler(event: FormEvent) {
    event.preventDefault();
    const saved = await run("Traveler saved", () =>
      apiFetch<Traveler>(
        "/travelers",
        {
          method: "POST",
          body: JSON.stringify({
            name: travelerForm.name,
            email: travelerForm.email || undefined,
            phone: travelerForm.phone,
            gender: travelerForm.gender,
            age: Number(travelerForm.age),
            government_id: {
              id_type: travelerForm.id_type,
              id_number: travelerForm.id_number,
              issuing_country: travelerForm.issuing_country
            }
          })
        },
        token
      )
    );
    if (saved) {
      setTravelers((items) => [saved, ...items]);
      setSelectedTravelers((items) => [saved.id, ...items]);
      setTravelerForm(emptyTravelerForm);
    }
  }

  async function monitorTrip() {
    if (!plan) return;
    const snapshot = await run("Manual live refresh", () =>
      apiFetch<MonitoringSnapshot>(`/trips/${plan.trip_id}/monitor`, { method: "POST" }, token)
    );
    if (snapshot) setPlan({ ...plan, monitoring: snapshot });
  }

  function toggleTraveler(id: string) {
    setSelectedTravelers((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
    );
  }

  function visitTime(day: TripPlan["itinerary"][number], placeName: string) {
    const visit = day.schedule.find((block) => block.type === "sightseeing" && block.title === placeName);
    return visit ? `${visit.start} to ${visit.end}` : "";
  }

  return (
    <main className="flow-shell">
      <header className="flow-header">
        <div className="brand">
          <Route aria-hidden="true" />
          <div>
            <strong>Travel Companion</strong>
            <span>Step {steps.findIndex((step) => step.id === activeStep) + 1} of {steps.length}</span>
          </div>
        </div>
        <div className="flow-progress" aria-label="Travel flow progress">
          <span>{steps.find((step) => step.id === activeStep)?.label}</span>
          <div>
            <i style={{ width: `${((steps.findIndex((step) => step.id === activeStep) + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <section className="page-stage">
        <header className="topbar">
          <div>
            <p>{API_BASE}</p>
            <h1>{steps.find((step) => step.id === activeStep)?.label}</h1>
          </div>
          <div className="status-line">
            {loading ? <Loader2 className="spin" aria-hidden="true" /> : <Shield aria-hidden="true" />}
            <span>{loading || notice}</span>
          </div>
        </header>

        {error ? (
          <div className="alert" role="alert">
            <AlertTriangle aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {activeStep === "login" ? (
          <ModuleCard icon={<Shield aria-hidden="true" />} title="Login using email auth">
            <label>
              Email
              <input required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <div className="button-row">
              <button type="button" onClick={requestOtp} title="Send OTP">
                <Send aria-hidden="true" />
              </button>
              <input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="OTP from email" />
              <button type="button" onClick={verifyOtp} title="Verify OTP">
                <CheckCircle2 aria-hidden="true" />
              </button>
            </div>
            <StatusPill tone={authReady ? "good" : "warn"} label={authReady ? "Signed in" : "Auth needed"} />
          </ModuleCard>
        ) : null}

        {activeStep === "profile" ? (
          <ModuleCard icon={<UserRound aria-hidden="true" />} title="User details and emergency contact">
            <form className="module-form" onSubmit={saveProfileAndEmergency}>
              <label>
                Name
                <input required disabled={!authReady} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} placeholder="Full name" />
              </label>
              <label>
                Phone
                <input required disabled={!authReady} value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} placeholder="Phone number" />
              </label>
              <div className="grid-two">
                <label>
                  Gender
                  <input required disabled={!authReady} value={profileForm.gender} onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value })} placeholder="Gender" />
                </label>
                <label>
                  Age
                  <input required disabled={!authReady} type="number" min={1} max={120} value={profileForm.age} onChange={(event) => setProfileForm({ ...profileForm, age: event.target.value })} />
                </label>
              </div>
              <div className="grid-two">
                <label>
                  ID Type
                  <select required disabled={!authReady} value={profileForm.id_type} onChange={(event) => setProfileForm({ ...profileForm, id_type: event.target.value })}>
                    <option value="">Select ID type</option>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="passport">Passport</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="driving_license">Driving license</option>
                    <option value="pan">PAN</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  Country
                  <input required disabled={!authReady} value={profileForm.issuing_country} onChange={(event) => setProfileForm({ ...profileForm, issuing_country: event.target.value })} placeholder="Issuing country" />
                </label>
              </div>
              <label>
                ID Number
                <input required disabled={!authReady} value={profileForm.id_number} onChange={(event) => setProfileForm({ ...profileForm, id_number: event.target.value })} placeholder="Government ID number" />
              </label>
              <div className="choice-row">
                <button type="button" className={needEmergency ? "choice selected" : "choice"} onClick={() => setNeedEmergency(true)}>
                Add emergency contact
                </button>
                <button type="button" className={!needEmergency ? "choice selected" : "choice"} onClick={() => setNeedEmergency(false)}>
                  No emergency contact
                </button>
              </div>
              {needEmergency ? (
                <>
                <label>
                  Contact name
                  <input required disabled={!authReady} value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} placeholder="Name" />
                </label>
                <label>
                  Relation
                  <input required disabled={!authReady} value={contactForm.relation} onChange={(event) => setContactForm({ ...contactForm, relation: event.target.value })} placeholder="Family, friend, manager" />
                </label>
                <label>
                  Phone
                  <input required disabled={!authReady} value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} placeholder="Phone number" />
                </label>
                </>
              ) : null}
              <button className="wide primary" type="submit" disabled={!authReady}>
                <UserRound aria-hidden="true" />
                Save and continue
              </button>
            </form>
            {profile ? <small>Saved profile: {profile.name ?? profile.email}</small> : null}
            <ListLine items={contacts.map((contact) => `${contact.name} (${contact.relation})`)} empty="No emergency contacts added." />
          </ModuleCard>
        ) : null}

        {activeStep === "trip" ? (
          <ModuleCard icon={<CalendarDays aria-hidden="true" />} title="Trip details">
            <form className="module-form" onSubmit={generatePlan}>
              <div className="grid-two">
                <label>
                  Source
                  <input required disabled={!authReady} value={tripForm.current_location} onChange={(event) => setTripForm({ ...tripForm, current_location: event.target.value })} placeholder="Starting city" />
                </label>
                <label>
                  Destination
                  <input required disabled={!authReady} value={tripForm.destination} onChange={(event) => setTripForm({ ...tripForm, destination: event.target.value })} placeholder="Destination city" />
                </label>
                <label>
                  Start date
                  <input required disabled={!authReady} type="date" value={tripForm.travel_date} onChange={(event) => setTripForm({ ...tripForm, travel_date: event.target.value })} />
                </label>
                <label>
                  Days
                  <input required disabled={!authReady} type="number" min={1} max={21} value={tripForm.number_of_days} onChange={(event) => setTripForm({ ...tripForm, number_of_days: event.target.value })} />
                </label>
                <label>
                  Budget
                  <select required disabled={!authReady} value={tripForm.budget} onChange={(event) => setTripForm({ ...tripForm, budget: event.target.value })}>
                    <option value="">Select budget</option>
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </label>
              </div>
              <label>
                Interests optional
                <input disabled={!authReady} value={tripForm.interests} onChange={(event) => setTripForm({ ...tripForm, interests: event.target.value })} placeholder="nature, culture, food" />
              </label>
              <button className="wide primary" disabled={!authReady || Boolean(loading)}>
                <Route aria-hidden="true" />
                Generate trip plan
              </button>
            </form>
          </ModuleCard>
        ) : null}

        {activeStep === "itinerary" ? (
          <ModuleCard icon={<Route aria-hidden="true" />} title="Trip itinerary">
            {plan ? (
              <>
                <div className="section-head">
                  <p>{plan.destination_validation.message}</p>
                  <button type="button" onClick={monitorTrip} disabled={!authReady} title="Refresh live context">
                    <RefreshCw aria-hidden="true" />
                  </button>
                </div>
                {plan.itinerary.map((day) => (
                  <article className="day-row" key={`${day.day}-${day.date}`}>
                    <div className="day-index">
                      <strong>Day {day.day}</strong>
                      <span>{day.date}</span>
                    </div>
                    <div className="day-body">
                      <h3>{day.zone}</h3>
                      <div className="visit-list">
                        {day.places.map((place) => (
                          <a href={place.map_url} target="_blank" rel="noreferrer" key={`${day.day}-${place.name}`}>
                            <MapPin aria-hidden="true" />
                            <span>
                              <strong>{place.name}</strong>
                              <small>{visitTime(day, place.name)}</small>
                            </span>
                          </a>
                        ))}
                      </div>
                      <p>{day.route_summary}</p>
                    </div>
                  </article>
                ))}
                <button className="wide primary" type="button" onClick={() => setActiveStep("transport")}>
                  Continue to transport
                </button>
              </>
            ) : (
              <EmptyState icon={<Route aria-hidden="true" />} label="Generate a trip plan first." />
            )}
          </ModuleCard>
        ) : null}

        {activeStep === "transport" ? (
          <ModuleCard icon={<Train aria-hidden="true" />} title="Book transport from source to destination">
            {plan ? (
              <>
                <div className="grid-three">
                  {plan.intercity_transport.map((option) => (
                    <Tile key={`${option.mode}-${option.provider}`} title={`${option.mode} · ${option.provider}`} meta={`${option.departure_time} to ${option.arrival_time}`} href={option.booking_url}>
                      <b>₹{option.estimated_price.toLocaleString("en-IN")}</b>
                      <span>{Math.round(option.duration_minutes / 60)} hr · {option.availability.available ? "Seats likely" : "Low inventory"}</span>
                      <small>{option.notes}</small>
                    </Tile>
                  ))}
                </div>
                <button className="wide primary" type="button" onClick={() => setActiveStep("travelers")}>
                  Continue to travelers
                </button>
              </>
            ) : (
              <EmptyState icon={<Train aria-hidden="true" />} label="Transport options appear after trip planning." />
            )}
          </ModuleCard>
        ) : null}

        {activeStep === "travelers" ? (
          <ModuleCard icon={<UsersRound aria-hidden="true" />} title="Add people or travelers if needed">
            <form className="module-form" onSubmit={saveTraveler}>
              <div className="grid-two">
                <label>
                  Name
                  <input required disabled={!authReady} value={travelerForm.name} onChange={(event) => setTravelerForm({ ...travelerForm, name: event.target.value })} placeholder="Traveler name" />
                </label>
                <label>
                  Email optional
                  <input disabled={!authReady} type="email" value={travelerForm.email} onChange={(event) => setTravelerForm({ ...travelerForm, email: event.target.value })} placeholder="traveler@example.com" />
                </label>
                <label>
                  Phone
                  <input required disabled={!authReady} value={travelerForm.phone} onChange={(event) => setTravelerForm({ ...travelerForm, phone: event.target.value })} placeholder="Phone number" />
                </label>
                <label>
                  Gender
                  <input required disabled={!authReady} value={travelerForm.gender} onChange={(event) => setTravelerForm({ ...travelerForm, gender: event.target.value })} placeholder="Gender" />
                </label>
                <label>
                  Age
                  <input required disabled={!authReady} type="number" min={1} max={120} value={travelerForm.age} onChange={(event) => setTravelerForm({ ...travelerForm, age: event.target.value })} />
                </label>
                <label>
                  ID Type
                  <select required disabled={!authReady} value={travelerForm.id_type} onChange={(event) => setTravelerForm({ ...travelerForm, id_type: event.target.value })}>
                    <option value="">Select ID type</option>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="passport">Passport</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="driving_license">Driving license</option>
                    <option value="pan">PAN</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="grid-two">
                <label>
                  Country
                  <input required disabled={!authReady} value={travelerForm.issuing_country} onChange={(event) => setTravelerForm({ ...travelerForm, issuing_country: event.target.value })} placeholder="Issuing country" />
                </label>
                <label>
                  ID Number
                  <input required disabled={!authReady} value={travelerForm.id_number} onChange={(event) => setTravelerForm({ ...travelerForm, id_number: event.target.value })} placeholder="Government ID number" />
                </label>
              </div>
              <button className="wide" type="submit" disabled={!authReady}>
                <UsersRound aria-hidden="true" />
                Add traveler
              </button>
              <button className="wide primary" type="button" onClick={() => setActiveStep("summary")}>
                Continue to all details
              </button>
            </form>
            <div className="traveler-strip">
              {travelers.length ? (
                travelers.map((item) => (
                  <button type="button" key={item.id} className={selectedTravelers.includes(item.id) ? "chip selected" : "chip"} onClick={() => toggleTraveler(item.id)}>
                    {item.name}
                  </button>
                ))
              ) : (
                <span>No extra travelers added.</span>
              )}
            </div>
          </ModuleCard>
        ) : null}

        {activeStep === "summary" ? (
          <ModuleCard icon={<CheckCircle2 aria-hidden="true" />} title="All details">
            <div className="grid-main">
              <SummaryBlock title="User">
                <b>{profile?.name ?? "Not saved"}</b>
                <span>{profile?.email ?? email}</span>
                <span>{profile?.phone ?? "No phone"}</span>
              </SummaryBlock>
              <SummaryBlock title="Trip">
                <b>{tripForm.current_location || "Source"} to {tripForm.destination || "Destination"}</b>
                <span>{tripForm.travel_date || "No date"} · {tripForm.number_of_days || "0"} days</span>
                <span>{tripForm.budget || "No budget"} {tripForm.interests ? `· ${tripForm.interests}` : ""}</span>
              </SummaryBlock>
            </div>
            <div className="grid-three">
              <OptionColumn icon={<Phone aria-hidden="true" />} title="Emergency Contacts">
                <ListLine items={contacts.map((contact) => `${contact.name} · ${contact.phone}`)} empty="No emergency contacts." />
              </OptionColumn>
              <OptionColumn icon={<UsersRound aria-hidden="true" />} title="Travelers">
                <ListLine items={travelers.map((traveler) => `${traveler.name} · ${traveler.phone}`)} empty="No extra travelers." />
              </OptionColumn>
              <OptionColumn icon={<Hotel aria-hidden="true" />} title="Stays">
                {plan?.stays.map((stay) => (
                  <Tile key={stay.name} title={stay.name} meta={stay.zone} href={stay.booking_url}>
                    <b>₹{stay.estimated_price_per_night.toLocaleString("en-IN")}/night</b>
                    <small>{stay.distance_note}</small>
                  </Tile>
                ))}
              </OptionColumn>
            </div>
            <div className="grid-main">
              <OptionColumn icon={<Car aria-hidden="true" />} title="Local Mobility">
                {plan?.local_mobility.map((option) => (
                  <Tile key={`${option.provider}-${option.vehicle_type}`} title={`${option.provider} ${option.vehicle_type}`} meta={`${option.eta_minutes} min ETA`} href={option.booking_url}>
                    <b>₹{option.estimated_price.toLocaleString("en-IN")}</b>
                    <span>Suitability {option.suitability_score}/10</span>
                  </Tile>
                ))}
              </OptionColumn>
              <OptionColumn icon={<Plane aria-hidden="true" />} title="Return Journey">
                {plan ? (
                  <div className="return-box">
                    <Metric label="Leave" value={plan.return_journey.leave_for_terminal_time} />
                    <Metric label="Terminal ETA" value={plan.return_journey.terminal_eta} />
                    <Metric label="Buffer" value={`${plan.return_journey.traffic_buffer_minutes} min`} />
                    <a href={plan.return_journey.recommended_transport.booking_url} target="_blank" rel="noreferrer">
                      {plan.return_journey.recommended_transport.mode} · {plan.return_journey.recommended_transport.provider}
                    </a>
                  </div>
                ) : null}
              </OptionColumn>
            </div>
            <section className="surface compact">
              <div className="section-head">
                <div>
                  <p>{history.length} saved trips</p>
                  <h2>Trip History</h2>
                </div>
                <button type="button" onClick={() => refreshSavedData()} disabled={!authReady} title="Refresh history">
                  <RefreshCw aria-hidden="true" />
                </button>
              </div>
              <div className="history-list">
                {history.slice(0, 5).map((item) => (
                  <button type="button" key={item.trip_id} onClick={() => setPlan(item)}>
                    <b>{item.destination_validation.location?.display_name ?? item.trip_id}</b>
                    <span>{item.itinerary.length} days · {item.booking_readiness.ready ? "booking ready" : "review needed"}</span>
                  </button>
                ))}
                {!history.length ? <span>No stored trips yet.</span> : null}
              </div>
            </section>
          </ModuleCard>
        ) : null}
      </section>
    </main>
  );
}

function ModuleCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="module-page">
      <div className="panel-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "good" | "warn" }) {
  return <span className={`status ${tone}`}>{label}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="empty">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ListLine({ items, empty }: { items: string[]; empty: string }) {
  return (
    <div className="list-line">
      {items.length ? items.map((item) => <span key={item}>{item}</span>) : <span>{empty}</span>}
    </div>
  );
}

function SummaryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface summary-block">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function OptionColumn({
  icon,
  title,
  children
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface option-column">
      <div className="section-head">
        <div>
          <p>Saved detail</p>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      <div className="tiles">{children || <span>No options yet.</span>}</div>
    </section>
  );
}

function Tile({
  title,
  meta,
  href,
  children
}: {
  title: string;
  meta: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="tile" href={href} target="_blank" rel="noreferrer">
      <strong>{title}</strong>
      <span>{meta}</span>
      {children}
    </a>
  );
}
