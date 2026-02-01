# Feature Research

**Domain:** Driving Coach / Driving Smoothness / Telemetry Apps
**Researched:** 2026-02-01
**Confidence:** MEDIUM (based on multiple WebSearch sources, cross-verified patterns)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Real-time feedback | Core value proposition of any coaching app; users expect immediate response to their actions | MEDIUM | Audio/haptic within 100ms of event. [GreenRoad](https://greenroad.com/solutions/in-vehicle-feedback-2/) and [Samsara](https://samsara.com/products/safety/driver-coaching) emphasize this as critical. |
| Drive recording / history | Users expect to review past performance; standard in all telemetry apps | MEDIUM | Auto-start/stop detection is expected. [DriveQuant](https://docs.drivequant.com/) and [Driversnote](https://www.driversnote.com/) show this is table stakes. |
| Score/metric per drive | Quantification validates improvement; without scores, users can't track progress | LOW | 0-100 scale is standard. [Sentiance](https://docs.sentiance.com/sentiance-insights/overview-of-sentiance-insights/driving-insights/driving-events-and-scores) and [DriveSafe Pro](https://apps.apple.com/us/app/drivesafe-pro/id1516971190) use this approach. |
| Event markers (harsh brake, accel) | Users expect to know what triggered feedback; essential for learning | LOW | Timestamp + location + severity. Industry standard from [Motive](https://helpcenter.gomotive.com/hc/en-us/articles/31054170471837-Harsh-Driving). |
| Adjustable sensitivity / difficulty | Different skill levels need different thresholds; one-size-fits-all frustrates users | LOW | 2-4 levels typical. Fleet apps like [Fleetio](https://www.fleetio.com/blog/telematics-driver-scoring) allow admin customization. |
| Map view of drive route | Visual context for where events occurred; expected in any GPS-based app | MEDIUM | Route polyline + event pins. Standard in [TrackAddict](https://racerender.com/TrackAddict/Features.html), [RaceChrono](https://racechrono.com/). |
| Background operation | App must work when screen is off; critical for in-car use | HIGH | iOS/Android background modes are complex. Battery efficiency crucial. |
| Settings persistence | Users expect preferences to be remembered | LOW | Difficulty, volume, auto-start toggle |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Audio-only feedback (water cup metaphor)** | Unique sonic signature tied to Initial D culture; no visual distraction; muscle memory training | MEDIUM | This IS the differentiator. No competitor uses water sounds. [Research](https://www.frontiersin.org/journals/ict/articles/10.3389/fict.2018.00005/full) shows haptic/audio feedback is perceived faster than visual. |
| **Jerk-based smoothness (not just G-force)** | Measures rate of change, not just magnitude; better proxy for smooth driving | MEDIUM | [Research](https://www.sciencedirect.com/science/article/abs/pii/S0001457517301409) validates jerk as superior metric. Comfort threshold: 1 m/s^3 optimal, 10 m/s^3 maximum. |
| **Pothole/road imperfection forgiveness** | Distinguishes driver error from road conditions; fairer scoring | HIGH | Z-axis spike detection + timing analysis. No competitor does this well. |
| **Enthusiast-focused positioning** | Not insurance, not fleet, not teen monitoring - for people who WANT to improve | LOW | Marketing/UX tone. Untapped niche between track apps and safety apps. |
| **Progressive difficulty with skill gating** | Creates mastery journey; keeps experienced drivers engaged | MEDIUM | Easy -> Experienced -> Master with tighter thresholds. Borrowed from [iRacing](https://www.iracing.com/) license progression model. |
| **Streak tracking (spill-free segments)** | Gamifies the negative (avoiding spills) into a positive achievement | LOW | "15 km without spill" creates mini-goals during drives. |
| **CarPlay/Android Auto audio source** | Seamless car integration without phone interaction | HIGH | [CarPlay](https://developer.apple.com/videos/play/wwdc2019/810/) and [Android Auto](https://www.srmtech.com/knowledge-base/blogs/android-auto-in-2025-powering-the-next-generation-of-connected-vehicles/) audio integration is complex but valuable. |
| **Drive comparison (same route, different days)** | Shows improvement on familiar routes | MEDIUM | Requires route matching algorithm. [Harry's LapTimer](https://www.gps-laptimer.de/) does this for tracks. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Visual real-time display while driving** | "I want to see my score" | Distracted driving; defeats audio-only safety premise; liability | Post-drive summary only; CarPlay/AA shows static info when parked |
| **Leaderboards / social competition** | Gamification; "compare with friends" | Incentivizes risky driving to get higher scores; privacy concerns; server complexity | Personal bests only; opt-in anonymized aggregate comparisons |
| **Insurance integration / data sharing** | "Get discounts for safe driving" | Creepy surveillance feel; conflicts with enthusiast positioning; legal complexity | Stay consumer-focused; enthusiasts don't want insurance companies in their car |
| **Real-time notifications/alerts to others** | "Let my family know I'm driving safely" | Teen monitoring vibe; conflicts with enthusiast target; adds complexity | None - this isn't a parental control app |
| **OBD-II required for V1** | "More accurate data" | Hardware dependency; setup friction; compatibility issues; delays launch | Phone sensors V1, OBD-II as V2 enhancement for willing users |
| **Route planning / navigation** | "All-in-one app" | Feature creep; solved problem (Google/Apple/Waze); distracts from core value | Integration with existing nav apps, not replacement |
| **Excessive gamification (badges, levels, rewards)** | "Make it fun" | Cheapens the experience; enthusiasts want skill mastery, not Candy Crush | Subtle progression: difficulty levels, personal bests, streaks |
| **Cloud sync mandatory** | "Access from multiple devices" | Privacy concerns; server costs; offline-first is better for car use | Local-first with optional export; cloud sync as future opt-in |
| **Haptic feedback while driving** | "Feel the feedback" | Phone is mounted/pocketed; haptics require phone in hand; dangerous | Audio only - reaches driver regardless of phone location |
| **Aggressive push notifications** | "Remind users to drive" | Annoying; users drive when they drive; retention theater | Minimal notifications; trust users to open app when needed |

## Feature Dependencies

```
[Accelerometer/Gyroscope Capture]
    |
    v
[Jerk Calculation Engine] --requires--> [Low-pass Filtering]
    |                                          |
    v                                          v
[Spill Risk Scoring] <--requires-- [Gravity Compensation]
    |
    +--triggers--> [Audio Feedback System]
    |
    +--logs--> [Event Recording]
                    |
                    v
              [Drive History]
                    |
                    +--displays--> [Drive Summary Screen]
                    |
                    +--feeds--> [Map Visualization]

[GPS Location]
    |
    +--provides--> [Speed Context] --enables--> [Auto-start/stop Detection]
    |
    +--provides--> [Route Breadcrumbs] --feeds--> [Map Visualization]

[Difficulty Settings]
    |
    +--configures--> [Jerk Thresholds]
    |
    +--configures--> [Pothole Forgiveness Logic]
    |
    +--configures--> [Audio Behavior]

[Background Execution]
    |
    +--enables--> [Auto-start Detection]
    |
    +--enables--> [CarPlay/Android Auto Integration]
```

### Dependency Notes

- **Jerk Calculation requires Filtering:** Raw accelerometer data is too noisy; filtering must happen before jerk calculation
- **Audio Feedback requires Spill Risk:** Audio intensity maps to risk level; can't have feedback without the scoring engine
- **Map Visualization requires both GPS and Events:** Route shows the path, events show the markers
- **Auto-start requires Background + GPS:** Must be able to detect movement while app is backgrounded
- **CarPlay/AA requires Background:** Audio source registration only works with proper background modes
- **Pothole Forgiveness requires Z-axis analysis:** Separate from lateral/longitudinal jerk; additional sensor processing

## MVP Definition

### Launch With (v1.0)

Minimum viable product - what's needed to validate the core concept.

- [x] **Jerk-based smoothness detection** - Core differentiator; validates the whole premise
- [x] **Water slosh/splash audio feedback** - The unique value proposition
- [x] **Three difficulty levels** - Allows wide range of users to engage
- [x] **Manual drive start/stop** - Simpler than auto-detection for V1
- [x] **Basic drive recording** - Duration, spill count, score
- [x] **Drive history list** - See past drives with scores
- [x] **Settings screen** - Difficulty, volume, calibration

### Add After Validation (v1.x)

Features to add once core is working and validated.

- [ ] **Auto-start/stop detection** - Once background modes are stable; user demand confirms need
- [ ] **Map visualization** - After core loop is proven; adds polish
- [ ] **Pothole forgiveness** - Complex; add when users complain about unfair scoring
- [ ] **CarPlay audio source** - After iOS background is solid
- [ ] **Android Auto audio source** - After Android background is solid
- [ ] **Streak tracking** - Light gamification once engagement is validated
- [ ] **Drive comparison** - After route data is reliable

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **OBD-II integration** - Optional enhancement for enthusiasts with hardware
- [ ] **Advanced analytics** - Detailed graphs, trends over time
- [ ] **Route-specific scoring** - Same route comparison
- [ ] **Export functionality** - Share data, integrate with other tools
- [ ] **Widget / complications** - Quick access to recent stats
- [ ] **Pothole crowdsourcing** - Share/receive pothole locations (similar to [Coaster](https://stopclusters.com/))

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Jerk-based smoothness engine | HIGH | MEDIUM | P1 |
| Water slosh/splash audio | HIGH | MEDIUM | P1 |
| Difficulty levels (3 tiers) | HIGH | LOW | P1 |
| Basic drive recording | HIGH | LOW | P1 |
| Drive history list | MEDIUM | LOW | P1 |
| Manual start/stop | MEDIUM | LOW | P1 |
| Settings (difficulty, volume) | MEDIUM | LOW | P1 |
| Map visualization | MEDIUM | MEDIUM | P2 |
| Auto-start/stop | MEDIUM | HIGH | P2 |
| Pothole forgiveness | MEDIUM | HIGH | P2 |
| CarPlay audio source | MEDIUM | HIGH | P2 |
| Android Auto audio | MEDIUM | HIGH | P2 |
| Streak tracking | LOW | LOW | P2 |
| Drive comparison | LOW | MEDIUM | P3 |
| OBD-II integration | LOW | HIGH | P3 |
| Export functionality | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Track Apps (RaceChrono, TrackAddict) | Fleet/Insurance (Samsara, DriveQuant) | Teen Safety (Zenroad, LifeSaver) | Water Cup Coach (Ours) |
|---------|--------------------------------------|---------------------------------------|----------------------------------|------------------------|
| Target User | Track day enthusiasts | Fleet managers, insurers | Parents, new drivers | Driving enthusiasts |
| Primary Metric | Lap times, sector splits | Safety score, incident count | Safety score, distraction | Smoothness (jerk) |
| Feedback Type | Post-session analysis | Real-time alerts, manager notifications | Parental notifications | Real-time audio |
| Scoring Philosophy | Faster = better | Fewer incidents = better | Fewer violations = better | Smoother = better |
| Monetization | One-time purchase / freemium | B2B subscription | Freemium / insurance partnerships | TBD (likely one-time) |
| OBD-II | Optional enhancement | Often required | Not typically used | V2 optional |
| Social Features | Leaderboards, lap sharing | Team dashboards | Family groups | None (intentionally) |
| CarPlay/Android Auto | Limited (some lap timers) | Varies | Limited | Audio source only |
| Unique Value | Precise lap telemetry | Fleet-wide visibility | Parental peace of mind | Skill development through audio |

### Positioning Gap

**Track apps** focus on lap times - wrong metric for street driving improvement.
**Fleet/Insurance apps** focus on safety incidents - punitive, not skill-building.
**Teen safety apps** focus on monitoring - surveillance, not mastery.

**Our gap:** Skill development for enthusiasts who want to become better drivers on public roads, without being tracked by insurance companies or nagged by parents.

## Sources

**Real-time Feedback:**
- [GreenRoad DRIVE](https://greenroad.com/solutions/in-vehicle-feedback-2/) - In-vehicle feedback approach
- [Samsara Driver Coaching](https://samsara.com/products/safety/driver-coaching) - In-cab coaching features
- [Netradyne Driver-i](https://www.netradyne.com/features/driver-self-coaching) - Self-coaching approach

**Scoring and Metrics:**
- [Sentiance Driving Insights](https://docs.sentiance.com/sentiance-insights/overview-of-sentiance-insights/driving-insights/driving-events-and-scores) - Event and score definitions
- [Fleetio Driver Scoring](https://www.fleetio.com/blog/telematics-driver-scoring) - Scoring methodology
- [Damoov Driving Score](https://damoov.com/driving-score-measure-the-quality-of-your-driving/) - Score calculation approach

**Jerk as Metric:**
- [Research: Jerk for Aggressive Driver Identification](https://www.sciencedirect.com/science/article/abs/pii/S0001457517301409) - Academic validation
- [Comfort-related jerk thresholds](https://www.researchgate.net/figure/Comfort---related-acceleration-and-jerk-value-ranges-for-common-maneuvers_tbl1_326546961) - 1 m/s^3 optimal, 10 m/s^3 max

**Track/Telemetry Apps:**
- [RaceChrono](https://racechrono.com/) - Lap timer and telemetry
- [TrackAddict](https://racerender.com/TrackAddict/Features.html) - Motorsports telemetry
- [Harry's LapTimer](https://www.gps-laptimer.de/) - Feature-rich lap timer

**Trip Recording:**
- [DriveQuant DriveKit](https://docs.drivequant.com/) - SDK approach
- [Driversnote](https://www.driversnote.com/) - Automatic trip logging
- [MyCarTracks](https://play.google.com/store/apps/details?id=com.nomanprojects.mycartracks&hl=en_US) - GPS mileage tracking

**Gamification:**
- [Samsara Driver Gamification](https://www.samsara.com/blog/motivating-high-performing-fleets-with-driver-gamification) - Leaderboard approach
- [iRacing License System](https://www.iracing.com/) - Progression model
- [2026 Gamification Trends](https://tesseractlearning.com/blogs/view/gamification-in-2026-going-beyond-stars-badges-and-points/) - Beyond badges

**CarPlay/Android Auto:**
- [Apple Audio-Haptic Design](https://developer.apple.com/videos/play/wwdc2019/810/) - Design principles
- [Android Auto 2025-2026](https://www.srmtech.com/knowledge-base/blogs/android-auto-in-2025-powering-the-next-generation-of-connected-vehicles/) - Platform evolution

**Smooth Driving Monitoring:**
- [Coaster App](https://stopclusters.com/) - Harsh braking cluster mapping

**Audio/Haptic Feedback Research:**
- [Haptic Feedback in Cars Review](https://www.frontiersin.org/journals/ict/articles/10.3389/fict.2018.00005/full) - Academic review of tactile/haptic effectiveness

---
*Feature research for: Driving Coach / Driving Smoothness Apps*
*Researched: 2026-02-01*
