# Pitfalls Research

**Domain:** Real-time sensor-based mobile driving coach with audio feedback
**Project:** Water Cup Driving Coach
**Researched:** 2026-02-01
**Confidence:** MEDIUM-HIGH (multiple sources verified across domains)

## Critical Pitfalls

### Pitfall 1: Android Sensor Sampling Rate Throttling

**What goes wrong:**
Setting accelerometer update interval to 50Hz (20ms) on Android does not guarantee 50Hz sampling. Android OS throttles sensor updates, and actual intervals can be 2-5x slower than requested (250-500ms instead of 100ms). This makes jerk calculation mathematically incorrect and produces unreliable smoothness scores.

**Why it happens:**
- Android OS manages sensor hardware to balance battery and performance
- Different OEMs implement sensor throttling differently (Samsung vs Pixel vs others)
- React Native bridge adds additional latency and batching
- Android 12+ enforces a 200Hz limit requiring explicit HIGH_SAMPLING_RATE_SENSORS permission

**How to avoid:**
1. Add `HIGH_SAMPLING_RATE_SENSORS` permission to AndroidManifest.xml for Android 12+
2. Measure actual sampling rate at runtime, not assumed rate
3. Use timestamps from sensor events, not wall clock time
4. Calculate jerk using actual time deltas, not assumed intervals
5. Consider native module for sensor processing to bypass JS bridge batching

**Warning signs:**
- Smoothness scores differ significantly between iOS and Android
- Sensor data array sizes don't match expected counts over time period
- Jerk values are unusually smooth or spiky on Android

**Phase to address:**
Phase 1 (Sensor Foundation) - Must validate actual sampling behavior before building jerk algorithm

**Sources:**
- [react-native-sensors GitHub Issue #163](https://github.com/react-native-sensors/react-native-sensors/issues/163)
- [Expo Sensors Documentation](https://docs.expo.dev/versions/latest/sdk/sensors/)

---

### Pitfall 2: Background Sensor Access Termination

**What goes wrong:**
App collects sensor data perfectly in foreground, but stops receiving sensor events when backgrounded or screen locked. On Android 9+, sensors using continuous reporting mode (accelerometer, gyroscope) don't receive events when app is in background. App appears to work but silently stops collecting data mid-drive.

**Why it happens:**
- iOS: App suspended after ~10 seconds in background without proper background mode
- Android 9+: Explicit restriction - background apps don't receive continuous sensor events
- Samsung/Xiaomi/Huawei: Aggressive battery optimization kills foreground services
- User force-quit clears iOS flag, preventing any background wake

**How to avoid:**
1. **iOS:** Register for location background mode (triggers sensor access), use audio background mode for audio playback
2. **Android:** Use foreground service with notification, acquire partial wake lock
3. **Both:** Implement "auto-start detection" using Activity Recognition + significant location change, not continuous polling
4. Prompt users to disable battery optimization for the app
5. Test on actual Samsung/Xiaomi devices - they behave differently than Pixel

**Warning signs:**
- Drive sessions missing chunks of data (gaps in timeline)
- Data collection stops after exact threshold (10 seconds, 3 minutes)
- Works in development but fails in production release builds

**Phase to address:**
Phase 2 (Background Execution) - Core architectural decision that affects all other features

**Sources:**
- [Android Sensors Overview](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview)
- [Don't Kill My App - Stock Android](https://dontkillmyapp.com/stock_android)
- [Don't Kill My App - Samsung](https://dontkillmyapp.com/samsung)
- [iOS Background Execution Limits](https://developer.apple.com/forums/thread/685525)

---

### Pitfall 3: Audio Latency Destroying Feedback Loop

**What goes wrong:**
Audio feedback plays 200-500ms after the driving event it's responding to. By the time user hears the "water spill" sound, they've already completed the turn. Feedback feels disconnected and useless for real-time coaching.

**Why it happens:**
- iOS default audio session adds ~30ms for noise cancellation
- Bluetooth adds 100-300ms encoding/transmission latency
- expo-av / React Native audio has JS bridge overhead
- Android audio path can add 50-200ms depending on device
- Preloading audio clips not performed on app startup

**How to avoid:**
1. Use audio session mode "measurement" on iOS for minimum latency (~10-15ms reduction)
2. Warn users about Bluetooth latency, recommend wired audio or car speakers
3. Preload all audio clips at app startup, not on first play
4. Use native audio module for playback (expo-audio or react-native-sound)
5. Test with `Superpowered Latency Test` app to measure actual device latency
6. For Android, consider Oboe library via native module for lowest latency

**Warning signs:**
- Users report feedback "feeling delayed" or "out of sync"
- Audio cues fire after the event is visually complete on debug UI
- Latency acceptable with wired headphones but terrible with car Bluetooth

**Phase to address:**
Phase 1 (Audio Foundation) - Must establish low-latency audio pipeline before building feedback logic

**Sources:**
- [Android Audio Latency Primer](https://superpowered.com/android-audio-low-latency-primer)
- [Android Audio Latency Documentation](https://developer.android.com/ndk/guides/audio/audio-latency)
- [iOS Audio Source Types](https://source.android.com/docs/core/audio/latency/app)

---

### Pitfall 4: Confusing Potholes with Bad Driving

**What goes wrong:**
User drives over pothole or railroad tracks, app triggers "harsh braking" or "jerky driving" alert. User gets frustrated by false positives. Alternatively, app filters too aggressively and misses real jerky driving.

**Why it happens:**
- Pothole vibrations and harsh braking both produce accelerometer spikes
- Simple threshold-based detection has 20-30% false negative rates
- Smartphone accelerometer noise can mask or amplify real signals
- Different vehicles have different suspension characteristics
- Phone mounting position affects sensor readings

**How to avoid:**
1. Use frequency analysis - potholes have different vibration signature than braking
2. Combine accelerometer with gyroscope for better context
3. Apply Kalman filter or complementary filter for noise reduction
4. Use time-domain features: potholes are sharp spikes, braking is sustained
5. Consider machine learning but expect 88-92% real-world accuracy, not 99%
6. Let users report false positives to improve detection over time
7. Use "confidence threshold" - only alert on high-confidence events

**Warning signs:**
- High volume of user complaints about "unfair" alerts
- Alert frequency spikes on certain road types
- Perfect accuracy in controlled testing, poor accuracy in real driving

**Phase to address:**
Phase 3 (Algorithm Refinement) - Requires significant tuning with real driving data

**Sources:**
- [MDPI Pothole Detection Study](https://www.mdpi.com/1424-8220/20/19/5564)
- [Kalman Filter for GPS/Accelerometer](https://maddevs.io/blog/reduce-gps-data-error-on-android-with-kalman-filter-and-accelerometer/)

---

### Pitfall 5: CarPlay/Android Auto App Rejection

**What goes wrong:**
App works perfectly on phone, but Apple rejects CarPlay entitlement request or Google rejects Android Auto submission. Audio source doesn't appear in car infotainment system. Users can't control app while driving.

**Why it happens:**
- CarPlay requires entitlement approval before submission (not after)
- Audio app must fit narrow category definition
- MediaBrowserService callbacks incomplete (Android Auto)
- Wording in app that instructs user to pick up phone (instant rejection)
- Missing required manifest/Info.plist configurations

**How to avoid:**
1. **Apply for CarPlay entitlement early** - can take weeks for Apple approval
2. Read [CarPlay App Programming Guide](https://developer.apple.com/carplay/documentation/CarPlay-App-Programming-Guide.pdf) completely
3. Implement full MediaBrowserService with onGetRoot() and onLoadChildren() for Android Auto
4. Never include text like "pick up your phone" or "tap your iPhone"
5. Test all CarPlay flows without touching phone
6. Include proper manifest entries for automotive_app.xml on Android

**Warning signs:**
- App icon appears in car but no UI loads
- Background audio works but no car controls
- CarPlay entitlement request pending for weeks with no response

**Phase to address:**
Phase 4 (Vehicle Integration) - Must apply for entitlements at project start, build features later

**Sources:**
- [CarPlay Developer Guide](https://developer.apple.com/carplay/documentation/CarPlay-App-Programming-Guide.pdf)
- [Requesting CarPlay Entitlements](https://developer.apple.com/documentation/carplay/requesting-carplay-entitlements)
- [Android Auto Media Apps](https://developer.android.com/training/cars/media)

---

### Pitfall 6: iOS Motion Sensor Permission Rejection

**What goes wrong:**
Apple rejects app for vague or misleading motion sensor usage description. App requests motion permission at launch instead of in context, leading to user denial and Apple rejection.

**Why it happens:**
- NSMotionUsageDescription must explain exactly why motion data is needed
- Apple rejects generic descriptions like "to improve your experience"
- Requesting permissions at app launch appears suspicious
- Motion permission required alongside location can seem excessive

**How to avoid:**
1. Write specific usage string: "Motion activity is used to detect driving events and measure ride smoothness without continuously using GPS, saving battery life."
2. Request motion permission only when user first starts a drive session
3. Explain in onboarding why motion + location are both needed
4. Don't request camera/motion/location all at once on launch

**Warning signs:**
- App rejection citing "does not clarify the use of Motion Sensor"
- User permission grant rate below 60%
- Permissions requested before user understands value

**Phase to address:**
Phase 2 (Permissions & Background) - Design permission flow before implementation

**Sources:**
- [cordova-ios Issue #891](https://github.com/apache/cordova-ios/issues/891)
- [Background Geolocation Issue #210](https://github.com/transistorsoft/cordova-background-geolocation-lt/issues/210)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using JS for sensor processing | Faster development | Bridge bottleneck at 50Hz, jank | Prototype only - must move to native module |
| Skipping Kalman filter | Ships faster | Noisy data, false positives | Never for driving coach |
| Single threshold for all events | Simple code | Doesn't adapt to phone position or vehicle | MVP only, must add calibration |
| expo-av for audio | Easy setup | Higher latency than native | Acceptable if latency <100ms measured |
| Polling sensors instead of event-driven | Simpler mental model | Battery drain, missed events | Never |
| Hardcoded jerk thresholds | Works in testing | Different vehicles need different values | MVP only, need calibration phase |

---

## Integration Gotchas

Common mistakes when connecting to external services/systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| CarPlay | Building UI before entitlement approval | Apply for entitlement immediately, build while waiting |
| Android Auto | Incomplete MediaBrowserService | Implement all callbacks, return valid BrowserRoot even for empty content |
| Bluetooth Audio | Assuming wired latency | Detect Bluetooth, warn users about latency impact |
| GPS + Motion | Using both continuously | Use motion for detection, GPS only for context/mapping |
| Background Location | UIBackgroundModes without actual feature | Must have legitimate continuous location feature or Apple rejects |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Storing raw sensor data | Works in 5-min test | Compress/aggregate before storage | >30 min drives, storage explodes |
| Processing sensors on JS thread | Smooth in dev | Jank during audio playback | When audio + sensors + UI active |
| Continuous GPS polling | Accurate location | Battery dead in 2 hours | Any real drive |
| Unthrottled sensor subscriptions | High fidelity | Bridge overflow, dropped frames | Sustained 50Hz for minutes |
| Saving to AsyncStorage during drive | Convenient | Blocking I/O causes sensor gaps | Large data writes |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing GPS history unencrypted | Location privacy violation | Encrypt at rest, allow user to delete |
| Transmitting driving scores without auth | Score manipulation | Authenticate API calls, validate server-side |
| Keeping microphone active for detection | Privacy concern, app rejection | Use motion sensors only, not audio for detection |
| Background location without clear purpose | App store rejection, user distrust | Minimal location use, clear privacy policy |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Alerts during turns | Distraction while driving | Queue alerts, play after maneuver complete |
| No audio preview option | User surprised by sounds while driving | Settings screen with sound previews |
| Requiring login before first use | Abandonment | Allow anonymous first drive, prompt account later |
| Battery warning too late | App dies mid-drive | Warn at 20%, suggest charging |
| No "sensitivity" setting | Harsh drivers get constant alerts | Let users adjust thresholds |
| CarPlay UI too complex | Dangerous distraction | Maximum 2-3 actions visible |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Sensor sampling:** Often missing actual rate validation - verify with timestamps, not assumptions
- [ ] **Background execution:** Often missing Samsung/Xiaomi testing - test on real OEM devices, not just Pixel
- [ ] **Audio latency:** Often missing Bluetooth path - test with actual car Bluetooth, not just wired
- [ ] **Trip detection:** Often missing false positive handling - what happens with train rides, passenger in car
- [ ] **CarPlay:** Often missing entitlement lead time - Apple approval takes weeks, not days
- [ ] **Jerk calculation:** Often missing calibration - different phones have different sensor noise floors
- [ ] **Battery impact:** Often missing real-world testing - test 1-hour drive, not 5-minute session

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Android sensor throttling | LOW | Add native module for sensor processing, doesn't require architecture change |
| Background termination | MEDIUM | Restructure to foreground service architecture, may require notification design |
| Audio latency | MEDIUM | Switch to native audio module, preload assets, adjust timing offsets |
| Pothole false positives | HIGH | Requires algorithm rewrite, ML model training, significant testing |
| CarPlay rejection | LOW-MEDIUM | Fix issues in code, resubmit (if entitlement approved) |
| App store rejection (permissions) | LOW | Update description strings, re-request permissions in context |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Android sensor throttling | Phase 1 | Measure actual Hz on 3+ Android devices |
| Background termination | Phase 2 | Run 30-min background test on Samsung device |
| Audio latency | Phase 1 | Measure end-to-end latency with oscilloscope or test app |
| Pothole vs driving confusion | Phase 3 | Test on known bumpy road, verify low false positive rate |
| CarPlay/Android Auto rejection | Phase 0 (apply) + Phase 4 (implement) | Entitlement approved before Phase 4 starts |
| Motion permission rejection | Phase 2 | Review by someone familiar with Apple rejections |
| Battery drain | Phase 2 | 1-hour drive test, <10% battery consumption |

---

## Phase-Specific Research Flags

Phases that likely need deeper research during execution:

| Phase | Research Needed | Why |
|-------|-----------------|-----|
| Phase 1: Sensor Foundation | HIGH | Must validate actual sampling rates on target devices |
| Phase 2: Background Execution | HIGH | OEM-specific behaviors not fully documented |
| Phase 3: Jerk Algorithm | MEDIUM | May need ML or signal processing expertise |
| Phase 4: CarPlay/Android Auto | LOW | Well-documented but strict requirements |
| Phase 5: Polish | LOW | Standard mobile patterns |

---

## Sources

- [react-native-sensors GitHub Issues](https://github.com/react-native-sensors/react-native-sensors/issues)
- [Expo Sensors Documentation](https://docs.expo.dev/versions/latest/sdk/sensors/)
- [Don't Kill My App](https://dontkillmyapp.com/)
- [Android Sensor Overview](https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview)
- [iOS Background Execution](https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time)
- [CarPlay App Programming Guide](https://developer.apple.com/carplay/documentation/CarPlay-App-Programming-Guide.pdf)
- [Android Auto Media Apps](https://developer.android.com/training/cars/media)
- [Superpowered Audio Latency](https://superpowered.com/android-audio-low-latency-primer)
- [MDPI Pothole Detection Study](https://www.mdpi.com/1424-8220/20/19/5564)
- [Kalman Filter for Accelerometer](https://maddevs.io/blog/reduce-gps-data-error-on-android-with-kalman-filter-and-accelerometer/)
- [MileIQ Drive Detection](https://support.mileiq.com/hc/en-us/articles/203798509-Drive-Detection-Best-Practices)
- [DriveQuant Trip Detection](https://blog.drivequant.com/automatic-trip-detection-smartphone-telematics-tech)

---
*Pitfalls research for: Water Cup Driving Coach*
*Researched: 2026-02-01*
