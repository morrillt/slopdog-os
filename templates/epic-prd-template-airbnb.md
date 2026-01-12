# Epic PRD Template (with Airbnb Example)

Use this doc as a **copy/paste template**. For each section:
- Replace the **[PLACEHOLDERS]** with your product/feature.
- Use the **Airbnb example** to calibrate level of detail and structure.

**Constraints:**
- Keep it high-level: ~2 pages max
- Purpose is to orient the next workflow (sharding into tickets)
- Go deeper only when sharding

---

## 1. Overview

**Template (fill-in):**
- **What:** [What is this feature/epic?]
- **Problem:** [What problem does it solve?]
- **Why:** [Why does it exist / why now?]

**Example (Airbnb):**
- **What:** A marketplace platform connecting travelers with hosts who have spaces to rent.
- **Problem:** Finding and booking short-term accommodation is fragmented and lacks the personal/local experience many travelers want.
- **Why:** Enable hosts to monetize spare space while giving guests affordable, unique stays with trusted reviews and secure payments.

---

## 2. Goals

**Template (fill-in):**
- [Goal 1 name] — [Functional purpose statement grounded in user value]
- [Goal 2 name] — [...]
- [Goal 3 name] — [...]

**Example (Airbnb):**
- **Discovery** — Help guests find the right place quickly and confidently.
- **Trust** — Build confidence between strangers through transparency and verification.
- **Booking** — Make reserving and paying frictionless.
- **Hosting** — Empower hosts to list and manage their spaces easily.

---

## 3. Non-Goals

**Template (fill-in):**
- [Explicitly out of scope item]
- [...]

**Example (Airbnb):**
- Long-term rentals (30+ day lease management)
- Property management services
- Travel insurance products
- Flights or car rentals

---

## 4. Technical Context

**Template (fill-in):**
- **Base Stack:** Vanilla Broz template
- **Additional Tech (if needed):** suggest options with rationale (which and why)

**Example (Airbnb):**
- **Base Stack:** Vanilla Broz template
- **Additional Tech (if needed):**

| Tech | Rationale |
|------|-----------|
| Mapbox / Leaflet | Interactive map search for listings |
| Stripe Connect | Secure payments + split payouts between platform and hosts |
| Cloudinary | Image optimization + CDN for listing photos |

---

## 5. User Stories & Acceptance Criteria

| Goal | ID | User Story | Acceptance Criteria | Edge Cases | Size |
|------|----|------------|---------------------|------------|------|
| ... | US-001 | As a [user], I want [action] so that [benefit] | - AC1: [testable criterion]<br>- AC2: ... | Unhappy paths / error states | S/M/L/XL (fib) |

**Requirements:**
- Group user stories under their parent goal
- Each AC must be specific enough to derive a test case
- Edge cases map to unhappy path tests
- Size uses Fibonacci t-shirt sizing: **S=1, M=2, L=3, XL=5**

### Goal: Discovery (Example)

| Goal | ID | User Story | Acceptance Criteria | Edge Cases | Size |
|------|----|------------|---------------------|------------|------|
| Discovery | US-001 | As a guest, I want to search listings by location so I can find places where I’m traveling | - Search accepts city/address<br>- Results show listings within a radius<br>- Empty state when no results | Invalid location, no results, API timeout | M |
| Discovery | US-002 | As a guest, I want to filter by price, dates, and amenities so I can narrow options | - Price range filter updates results<br>- Date picker blocks unavailable dates<br>- Amenity filters apply immediately | Conflicting filters yield 0 results | M |
| Discovery | US-003 | As a guest, I want to view results on a map so I can understand location visually | - Map shows pins for each listing<br>- Clicking pin shows preview card<br>- Map/list state persists | Clustering at low zoom, mobile gestures | L |

### Goal: Trust (Example)

| Goal | ID | User Story | Acceptance Criteria | Edge Cases | Size |
|------|----|------------|---------------------|------------|------|
| Trust | US-004 | As a guest, I want to read reviews from past guests so I can assess quality | - Reviews show rating, text, date, author<br>- Average rating visible on listing card<br>- Sort by recent/helpful | Listing has 0 reviews | S |
| Trust | US-005 | As a guest, I want to see host verification/profile details so I can trust who I’m booking with | - Host profile shows photo + bio<br>- Verification badges displayed (if present)<br>- “Member since” shown | Unverified host, missing photo | S |

### Goal: Booking (Example)

| Goal | ID | User Story | Acceptance Criteria | Edge Cases | Size |
|------|----|------------|---------------------|------------|------|
| Booking | US-006 | As a guest, I want to book a listing and pay securely so my reservation is confirmed | - Select dates + guest count<br>- Price breakdown before payment<br>- Payment succeeds → confirmation shown | Payment fails, dates become unavailable mid-checkout | L |
| Booking | US-007 | As a guest, I want to message the host before booking so I can ask questions | - Message entry on listing page<br>- Conversation thread view<br>- Reply notifications | Host doesn’t respond | M |

### Goal: Hosting (Example)

| Goal | ID | User Story | Acceptance Criteria | Edge Cases | Size |
|------|----|------------|---------------------|------------|------|
| Hosting | US-008 | As a host, I want to create a listing with photos and details so guests can find my space | - Guided form (details, photos, price, availability)<br>- Photo upload + reorder<br>- Preview before publish | Upload fails, missing required fields | L |
| Hosting | US-009 | As a host, I want to manage my availability calendar so I control booking dates | - Calendar view with blocked/available dates<br>- Bulk edit date ranges<br>- Prevent double booking | Conflicting edits, race conditions | M |

---

## 6. Concerns & Risks

**Template (fill-in):**
- [Risk/concern]
- [...]

**Example (Airbnb):**
- Payment disputes + cancellation policy complexity
- Trust cold-start for new listings with 0 reviews
- Map/search performance at large result volumes
- Photo moderation and safety issues

---

## 7. Notes

**Template (fill-in):**
- [Misc context / considerations]

**Example (Airbnb):**
- Mobile-first UX (most users browse on phones)
- Consider “Instant Book” vs “Request to Book” as a host setting
- Reviews are two-way (guest↔host)

---

## 8. Suggested Additional User Stories

**Template (fill-in):**
- As a [user], I want [action] so that [benefit]

**Example (Airbnb):**
- As a guest, I want to save listings to a wishlist so I can compare later
- As a guest, I want price drop alerts for saved listings
- As a host, I want earnings analytics + payout history
- As a guest, I want to split payment with other travelers

---

## Downstream Workflow: Sharding into Tickets

1. One user story per ticket
2. Include all related acceptance criteria + edge cases
3. Reference parent goal and epic

