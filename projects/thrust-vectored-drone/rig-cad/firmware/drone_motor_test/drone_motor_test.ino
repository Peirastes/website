/*
 * TVD Rig Bench-Test — Throttle + Vector Servo  —  Arduino Nano (CH340)
 * ---------------------------------------------------------------------
 * Two manual channels for the 1-DOF thrust-vector test rig:
 *   Throttle pot -> A0 -> servo-style PWM on D2 -> brushless ESC signal.
 *   Vector pot   -> A2 -> servo-style PWM on D4 -> MG996R yoke servo.
 *
 * WIRING
 *   Throttle pot:   outer legs -> 5V and GND, wiper -> A0
 *   Vector pot:     outer legs -> 5V and GND, wiper -> A2
 *   ESC 3-pin lead: white (signal) -> D2
 *                   black (ground) -> Arduino GND     <-- REQUIRED common ground
 *                   red   (+5V BEC) -> LEAVE DISCONNECTED (Nano is USB-powered)
 *   Servo 3-pin:    signal -> D4, ground -> Arduino GND
 *                   +5V -> EXTERNAL 5V supply, NOT the Nano's regulator.
 *                   An MG996R stalls at several amps; the Nano's 5V rail cannot
 *                   source that and a brownout resets the board mid-run.
 *   ESC power leads: 2S/3S LiPo or bench PSU ~7.4-11.1V (NOT 5V). Watch polarity.
 *
 * SAFETY
 *   - PROP OFF and motor clamped for first runs.
 *   - Boots holding MIN throttle to arm the ESC, then will NOT follow the
 *     throttle pot until that pot is turned to minimum (guards against a knob
 *     left cranked up).
 *   - Servo holds CENTRE through arming, then follows the vector pot.
 *   - Servo travel is clamped to +/- SERVO_SWEEP_DEG in software. That limit is
 *     the CAD clearance figure from check_servo_sweep (prop vs PivotHub, with
 *     yoke_axis_h at 70): +/-48 deg servo against +/-50 deg beam. Re-run
 *     rig-cad/run_check.py if the geometry changes — this number is not a
 *     property of the servo, it is a property of the rig.
 *   - Open Serial Monitor @ 115200 to watch raw / microseconds / throttle / vector.
 */

#include <Servo.h>

// ---- Throttle channel ----
const int  ESC_PIN = 2;        // PWM out -> ESC signal (white)
const int  POT_PIN = A0;       // throttle pot wiper
const int  MIN_US  = 1000;     // ESC minimum / motor off
const int  MAX_US  = 2000;     // ESC full throttle
const unsigned long ARM_MS = 3000;   // hold MIN this long so the ESC arms
const int  SAFE_RAW  = 30;     // pot ADC must fall below this to "enable"
const int  DEADBAND  = 15;     // raw counts near bottom that force full-off

// ---- Vector (servo) channel ----
const int  SERVO_PIN     = 4;  // PWM out -> MG996R signal
const int  SERVO_POT_PIN = A2; // vector pot wiper
const int  SERVO_CENTRE_DEG = 90;   // command that puts the yoke at thrust-straight
const int  SERVO_SWEEP_DEG  = 48;   // +/- travel, from CAD clearance (see header)

const float SMOOTH   = 0.20;   // pot smoothing (0..1; higher = snappier)
const unsigned long PRINT_MS = 250;

Servo esc;
Servo vec;
float smoothRaw = 0;           // throttle pot, smoothed
float smoothVec = 0;           // vector pot, smoothed
unsigned long lastPrint = 0;

// Map a raw 0..1023 pot reading onto the clamped servo travel band.
int vectorAngle(int raw) {
  int deg = map(raw, 0, 1023,
                SERVO_CENTRE_DEG - SERVO_SWEEP_DEG,
                SERVO_CENTRE_DEG + SERVO_SWEEP_DEG);
  return constrain(deg,
                   SERVO_CENTRE_DEG - SERVO_SWEEP_DEG,
                   SERVO_CENTRE_DEG + SERVO_SWEEP_DEG);
}

void setup() {
  Serial.begin(115200);

  vec.attach(SERVO_PIN);
  vec.write(SERVO_CENTRE_DEG);                   // yoke straight while we arm

  esc.attach(ESC_PIN, MIN_US, MAX_US);
  esc.writeMicroseconds(MIN_US);                 // hold minimum to arm the ESC

  Serial.println(F("Arming ESC (holding MIN throttle)..."));
  delay(ARM_MS);                                 // listen for arm beeps

  // Safe start: refuse to go live until the throttle pot is actually at minimum.
  Serial.println(F("Turn throttle pot to MINIMUM to enable."));
  while (analogRead(POT_PIN) > SAFE_RAW) {
    esc.writeMicroseconds(MIN_US);
    delay(50);
  }
  smoothRaw = analogRead(POT_PIN);
  smoothVec = analogRead(SERVO_POT_PIN);
  Serial.println(F("Enabled - throttle follows A0, vector follows A2."));
}

void loop() {
  int raw = analogRead(POT_PIN);                 // 0..1023 (Nano 10-bit ADC)
  smoothRaw += (raw - smoothRaw) * SMOOTH;       // simple EMA de-jitter
  int r = (int)smoothRaw;

  int us;
  if (r <= DEADBAND) us = MIN_US;                // clean full-off at the bottom
  else               us = map(r, DEADBAND, 1023, MIN_US, MAX_US);
  us = constrain(us, MIN_US, MAX_US);

  esc.writeMicroseconds(us);

  int vraw = analogRead(SERVO_POT_PIN);
  smoothVec += (vraw - smoothVec) * SMOOTH;
  int vdeg = vectorAngle((int)smoothVec);

  vec.write(vdeg);

  if (millis() - lastPrint >= PRINT_MS) {        // telemetry
    lastPrint = millis();
    int pct = map(us, MIN_US, MAX_US, 0, 100);
    Serial.print(F("raw="));      Serial.print(raw);
    Serial.print(F("  us="));     Serial.print(us);
    Serial.print(F("  throttle=")); Serial.print(pct); Serial.print(F("%"));
    Serial.print(F("  vraw="));   Serial.print(vraw);
    Serial.print(F("  vector=")); Serial.print(vdeg - SERVO_CENTRE_DEG);
    Serial.println(F(" deg"));
  }
}
