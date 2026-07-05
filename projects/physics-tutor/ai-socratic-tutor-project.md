# AI Socratic Tutor — Project Document

**Status:** Ideation / Pre-Prototype
**Author:** [Redacted]
**Date:** March 2026
**Confidential — Proprietary Concept**

---

## Vision

An AI-powered tutoring application that uses the Socratic method to help physics and engineering students develop genuine problem-solving ability rather than extract answers. The tutor asks progressively better questions, generates adaptive problems, and builds a quantified picture of each student's strengths and weaknesses — all within a single course context.

This is not a replacement for instructors. It is a complementary, always-available tutor that teaches students to think independently. The long-term ambition is a commercial product deployable across universities, customizable per institution, and eventually integrated into learning management systems.

**Analogies:** AI-native Khan Academy. Ethical, pedagogy-first Chegg. LogiCola for physics and engineering.

---

## Core Principles

1. **Never give the answer.** The tutor guides students to discover solutions through targeted questioning. Direct instruction is reserved only for foundational gaps that block further reasoning.
2. **Mastery over volume.** Asymmetric scoring penalizes wrong answers more heavily than it rewards correct ones, incentivizing careful thinking over rapid guessing.
3. **Transparency with encouragement.** Students see their own diagnostic data — framed as growth opportunity, not judgment.
4. **Instructor authority preserved.** Faculty define problem domains, difficulty curves, and questioning styles. The tool is configured, not imposed.
5. **Complement, don't replace.** The tutor handles scalable 1:1 practice. Instructors handle lectures, demonstrations, mentorship, and rigorous examination.

---

## Target Courses (Testbed)

- **PSE I** — Introductory physics/engineering (if taught again)
- **PSE II** — Current course offering

### Priority Topic Modules (Prototype)

1. Free body diagrams / force analysis
2. Kinematics / projectile motion
3. Rotational dynamics / moment of inertia

These were selected based on where students historically struggle most and span both PSE I and PSE II content.

---

## Feature Priorities (Ranked)

### P0 — Must Have for Prototype

**1. Socratic Questioning Engine**
The core differentiator. The AI must diagnose *why* a student is stuck and adapt its questioning accordingly.

- Distinguish between conceptual misunderstanding, mathematical error, and setup/framing mistakes
- Ask targeted follow-up questions that lead the student toward the answer without revealing it
- Detect when Socratic questioning is unproductive (student lacks a prerequisite concept entirely) and shift temporarily to brief, targeted direct instruction before returning to discovery mode
- Maintain conversational context within a problem-solving session

Key design challenge: calibrating the threshold between "keep asking questions" and "the student needs direct help." This is the hardest interaction design problem in the project.

**2. Adaptive Problem Generation**
The tutor generates problems tailored to the student's current level and weak areas.

- Problems adjust in difficulty based on demonstrated competence
- Cover conceptual, computational, and applied/scenario-based question types
- Avoid repetitive problem structures — vary context and framing
- Tag problems by topic, subtopic, and difficulty for diagnostic tracking

### P1 — Important for Prototype

**3. Asymmetric Scoring System (LogiCola Model)**
A scoring mechanic where incorrect answers cost significantly more than correct answers earn (approximately 2-3x penalty ratio).

- Score reflects consistency of understanding, not attempt volume
- Visible to the student as a progress metric
- Configurable penalty ratios per topic or difficulty tier
- Score progression unlocks harder problems (gating mechanism)

### P2 — Valuable but Deferrable

**4. Student Progress Dashboard**
A student-facing view of their quantified learning state.

- Success rates by topic and subtopic
- Score trajectories over time
- Identified growth areas (framed constructively, not punitively)
- Session history and time-on-task metrics

Design imperative: the dashboard should feel like a coach reviewing game film with an athlete, not like a report card. Framing language matters enormously here (e.g., "your next growth area" vs. "you're struggling with").

---

## Architecture & Technical Decisions

### Delivery Format
**Browser-based web application** (standalone)

Rationale: fastest iteration cycle, no install friction for students, cross-platform by default. LMS integration (Canvas, Blackboard, etc.) is a future milestone, not a prototype requirement.

### LLM Backend
**To be determined.**

Options under consideration:
- Third-party LLM API (e.g., Anthropic Claude, OpenAI GPT) — fastest path to prototype
- On-premise or local models — may be required by institutional data privacy policies
- Hybrid — API for development, self-hosted for deployment

**Open question:** What are the data privacy implications of student interactions flowing through a third-party API? This requires investigation into:
- FERPA compliance for AI-mediated tutoring interactions
- Institutional policies on student data and third-party services
- Whether anonymization or local processing is sufficient
- Terms of service for commercial LLM APIs regarding training on input data

This is flagged as a blocking research item before any student-facing deployment, though it should not block prototype development using synthetic/test data.

### Data Persistence
**Course-scoped.** Student progress data lives within a single course instance and does not carry across semesters or courses.

Rationale: eliminates most data governance complexity (FERPA longitudinal tracking, cross-course data sharing, transfer portability) while still providing meaningful adaptive tutoring within a semester. A student's competence should be re-verified in each new course anyway.

### Instructor Configuration Layer
Instructors should be able to:
- Define which topics/subtopics are active
- Set difficulty ranges and progression curves
- Customize Socratic questioning intensity (more/less directive)
- Review aggregate (anonymized) student performance data
- Add custom problem templates or seed problems

This makes the tool an authoring platform, not a black box — critical for faculty adoption.

---

## Assessment Philosophy

Courses using this tool maintain rigorous human-evaluated assessment:

- **Homework:** Completion-based, AI-graded, or submitted within the application (LogiCola model — score threshold required for completion credit)
- **Exams:** Written and/or oral, emphasizing demonstration and performance over rote correctness
- **Evaluation criteria:** Process and reasoning quality, not just numerical answers

The tutor and the examiner are deliberately separated roles. The AI helps students practice; humans evaluate mastery. This separation avoids the conflict of interest inherent in a system that both tutors and grades.

---

## Prototype Scope (Summer 2026)

### Milestone 1: Single-Topic Proof of Concept
- One topic module (likely free body diagrams / force analysis)
- Socratic questioning engine with 3-5 problem types
- Basic scoring mechanic (asymmetric penalties)
- Minimal UI — functional, not polished
- Test with synthetic student interactions (not live students)

### Milestone 2: Multi-Topic Expansion
- Add kinematics and rotational dynamics modules
- Adaptive difficulty adjustment based on scoring history
- Basic student-facing progress view
- Begin informal testing with willing students (pilot group)

### Milestone 3: Instructor Configuration
- Topic/difficulty configuration interface
- Aggregate performance reporting
- Problem template authoring tools

### Exit Criteria for Summer
A working web application that can:
1. Present a physics problem in one of the three target topics
2. Engage a student in Socratic dialogue about that problem
3. Correctly diagnose at least the most common categories of student error
4. Adjust subsequent problem difficulty based on performance
5. Track and display a score using asymmetric penalty mechanics

---

## Open Questions & Research Items

| Question | Priority | Notes |
|----------|----------|-------|
| FERPA / data privacy for LLM API usage | High | Blocking for student-facing deployment, not for prototype |
| Which LLM backend best supports Socratic interaction? | High | Requires comparative testing of prompt strategies across models |
| How to detect "student is stuck on prerequisite" vs. "student needs more Socratic prompting"? | High | Core UX research question — may require iterative testing with real students |
| Optimal asymmetric penalty ratio | Medium | Start with 1:2 or 1:3 (gain:loss), tune based on student behavior data |
| Diagram/visual input support (e.g., student-drawn FBDs) | Medium | Multimodal input would be valuable but adds significant complexity |
| Instructor adoption barriers | Medium | Survey/interview other faculty early |
| LMS integration technical requirements (Canvas API, LTI, etc.) | Low | Defer until standalone product is validated |

---

## Competitive Landscape & Differentiation

Existing tools in adjacent space:
- **Khan Academy / Khanmigo** — broad coverage, conversational AI, but not deeply Socratic or specialized in physics/engineering problem-solving methodology
- **Chegg / CourseHero** — answer-delivery models that actively undermine learning
- **Carnegie Learning** — strong pedagogy in math, less presence in university physics/engineering
- **ChatGPT / Claude (raw)** — powerful but generic; no pedagogical guardrails, no adaptive scoring, no instructor configuration

**This project's differentiation:**
1. Socratic-first interaction model with mode-switching (not just "don't give the answer")
2. Asymmetric scoring that rewards mastery over volume
3. Purpose-built for university physics and engineering pedagogy
4. Instructor-configurable — faculty are co-authors, not passengers
5. Course-scoped adaptive engine that finds and targets individual weak points
6. Designed for institutional deployment with potential university branding/culture integration

---

## Long-Term Vision

- **University branding:** Each institution deploys a tutor with its own identity — a mascot, cultural voice, and institutional values baked in. Students interact with *their university's* AI tutor, not a generic tool.
- **Cross-course deployment:** Expand beyond physics into other STEM disciplines using the same pedagogical framework and adaptive engine.
- **Longitudinal student growth:** If data governance issues are resolved, the tutor could eventually "grow with" a student across their academic career, tracking conceptual development from introductory courses through senior-level work.
- **Commercial product:** Offered to universities as a subscription service — free to students, paid by the institution.
- **LMS integration:** Native plugins for Canvas, Blackboard, Moodle, etc.

---

## Intellectual Property Notice

This concept, its pedagogical framework, and its described implementation are the original intellectual property of the author. This document is confidential and shared only for development purposes.

---

*Document generated March 21, 2026. Living document — update as decisions are made and prototype progresses.*
