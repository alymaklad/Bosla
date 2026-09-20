# Minutes of Meeting: GenAI Hackathon Project Brainstorming

## Meeting Overview

| Field | Details |
|---|---|
| Date | 5 September 2026 |
| Duration | 26 minutes 50 seconds |
| Meeting type | Product discovery and hackathon scope definition |
| Participants | Multiple team members; names and individual speaker identities are not reliably recoverable from the supplied transcript |
| Working concept | Conversational AI for personalized education and career navigation |
| Status | Concept selected for further exploration; MVP boundaries partially agreed, with differentiation and implementation still requiring validation |

> Evidence note: the supplied transcript contains only five large timestamped blocks and no reliable speaker labels. References below therefore cite the nearest available block start, not fabricated sentence-level timestamps.

## Executive Summary

The team explored a GenAI platform that helps people who feel uncertain about their education or career direction. Rather than presenting a long, rigid personality questionnaire, the product would hold an adaptive conversation, learn about the user’s personality, interests, skills, preferences, and experience, and recommend several plausible career directions with clear reasoning.

The intended journey goes beyond assigning a personality label. The platform should help a user understand what a role actually involves, why it may fit, what skills it requires, how demand and compensation vary, and what steps could move the user toward it. The proposed user base spans secondary-school students choosing university pathways, university students selecting specializations, graduates entering the market, early-career professionals refining their path, and people considering a career change.

The strongest differentiation discussed was the combination of adaptive conversation, explainable recommendations, and realistic role previews. Suggested previews included curated “day in the life” videos, role descriptions, sample tasks, and lightweight simulations. The team also discussed persistent profiles, roadmaps, CV/LinkedIn/portfolio inputs, skill-gap measurement, learning recommendations, and an agent that improves its guidance as it learns more about the user.

The discussion identified significant scope risk. Personalized learning delivery, continuous coaching, generated role simulations, fine-tuning, and full longitudinal adaptation could turn a hackathon prototype into a graduation-project-scale system. The clearest MVP direction was therefore to solve the immediate problem: help a confused user leave with a small set of credible, understandable career options and enough confidence to begin exploring one. Step-by-step teaching, custom course generation, and model fine-tuning should remain outside the initial prototype.

## Problem Statement

People at education and career transition points often lack enough self-knowledge and real-world exposure to choose a direction confidently. Existing personality and career tests commonly rely on long, repetitive multiple-choice questionnaires, force uncertain answers, produce opaque labels, and stop at shallow job suggestions. They rarely explain the recommendation, demonstrate the day-to-day reality of the role, or translate the result into an actionable next step. As a result, users remain distracted by too many possibilities or unconvinced by the suggested path. [00:04:29] [00:19:41]

## Primary Users

1. Secondary-school students deciding which university or study path to pursue.
2. University students deciding among specializations and career tracks within their field.
3. Recent graduates who do not know where to begin professionally.
4. Early-career professionals reconsidering their specialization.
5. Career switchers who want to reuse existing skills and experience in a new direction.

The discussion deliberately broadened the concept from a one-time school guidance tool to a continuing career-navigation relationship. [00:01:18] [00:04:29]

## Proposed Product Experience

### 1. Adaptive discovery conversation

The user speaks with an AI guide instead of completing a fixed questionnaire. Questions adapt to previous answers and can be rephrased when misunderstood. The agent should gather evidence about interests, dislikes, working preferences, strengths, existing skills, experiences, and motivations without pretending that the user already understands every aspect of their own personality. [00:00:00] [00:04:29]

### 2. Explainable career recommendations

The system proposes several job profiles rather than one deterministic answer. Each recommendation explains which user signals support the match, where uncertainty remains, and what additional evidence could confirm or reject it. The desired outcome is reduced confusion and informed confidence—not a claim that one person has only one suitable career. [00:19:41] [00:22:37]

### 3. Realistic role previews

Each recommendation should show what the job involves through concise role descriptions and, where available, curated “day in the life” videos. The team preferred reusing strong existing online content for the prototype before investing in generated video. Suggested supporting information included typical activities, study requirements, salary context, remote-work potential, local market demand, and role availability. [00:01:18] [00:04:29]

### 4. Actionable next-step roadmap

Once a user accepts or saves a direction, the platform can outline how to explore it: relevant university choices, foundational subjects, skills to develop, portfolio steps, and later specialization decisions. The roadmap should guide exploration without expanding the MVP into a full teaching platform. [00:04:29] [00:19:41]

### 5. Persistent user profile

Accepted insights, skills, recommendations, and prior conversations can be saved to a profile. Future sessions should continue from that context. Potential evidence sources include a CV, LinkedIn profile, portfolio, projects, applications, and work history, subject to consent and privacy controls. [00:04:29]

## Candidate Features and Scope Classification

| Feature | MVP classification | Rationale |
|---|---|---|
| Conversational onboarding and adaptive questions | Must have | Core replacement for rigid questionnaires |
| Personality, interest, skill, and experience profile | Must have | Evidence base for recommendations |
| Three to five ranked career profiles | Must have | Reduces uncertainty without forcing one answer |
| Explanation and evidence for every recommendation | Must have | Builds trust and distinguishes the product from basic tests |
| Saveable/downloadable assessment summary | Must have | Explicitly requested and easy to demonstrate |
| Follow-up chatbot for “why,” comparisons, and next steps | Must have | Turns a static result into an interactive experience |
| Curated role-preview links or videos | Should have | Strong differentiation; existing content reduces prototype cost |
| Basic roadmap and skill-gap outline | Should have | Makes recommendations actionable while remaining feasible |
| Salary, remote-work, and market-demand context | Should have | Important to real decisions, but data quality must be controlled |
| CV/LinkedIn/portfolio ingestion | Could have | Useful evidence source but adds consent, parsing, and privacy work |
| Mini-games or work simulations | Could have | Potentially powerful validation signal but high design effort |
| Personalized learning-style detection | Later | Unclear implementation and disputed scope during the meeting |
| Course matching and step-by-step learning coach | Later | Explicitly identified as too broad for the initial solution |
| Generated job-preview videos | Later | Curated existing content is sufficient for the prototype |
| Fine-tuned proprietary model | Out of MVP | Data, time, and evaluation requirements exceed hackathon scope |

## Decisions and Working Agreements

| # | Decision or working agreement | Rationale | Evidence |
|---:|---|---|---|
| 1 | Focus the concept on personalized education and career navigation for people who feel lost or undecided. | This was the recurring user problem across all proposed segments. | [00:00:00] |
| 2 | Use an adaptive conversation rather than a conventional fixed multiple-choice personality test. | Existing tests were considered boring, ambiguous, and insufficiently expressive. | [00:04:29] |
| 3 | Return multiple explainable job profiles, not a single deterministic career label. | A person can succeed in several roles; the goal is to reduce distraction and create conviction. | [00:19:41] [00:22:37] |
| 4 | Include realistic role context, preferably using existing videos/content in the prototype. | It helps users understand whether they can imagine themselves doing the work and avoids unnecessary video-generation scope. | [00:01:18] [00:04:29] |
| 5 | Keep the hackathon deliverable as a prototype; the full longitudinal platform does not need to be built. | The complete vision was recognized as substantially larger than the available timeframe. | [00:04:29] |
| 6 | Exclude full step-by-step teaching and content delivery from the initial problem boundary. | It distracts from the core job-to-be-done and would significantly enlarge implementation scope. | [00:19:41] |
| 7 | Avoid fine-tuning in the initial implementation; prefer agent configuration, skills, and persistent context. | The team lacks the time and proprietary training data required for responsible fine-tuning. | [00:04:29] |

## Key Product Risks

- **Differentiation risk:** A conversational interface alone may look like a more pleasant version of an existing personality test. The pitch must demonstrate deeper evidence gathering, explainability, realistic role exposure, and actionable exploration.
- **Trust risk:** Recommendations must show supporting signals and uncertainty. An unexplained answer will not convince the user or judges.
- **Scope risk:** Learning personalization, simulations, continuous coaching, labor-market intelligence, video generation, and fine-tuning cannot all fit in one hackathon MVP.
- **Assessment validity:** Casual conversation must not be presented as a scientifically validated psychometric diagnosis without evidence.
- **Data quality:** Salary and market-demand claims require location, date, and source provenance.
- **Privacy:** CVs, portfolios, conversations, inferred traits, and career decisions are sensitive personal data requiring consent and deletion controls.
- **Cold-start risk:** The product needs a useful first session before it has longitudinal behavior or outcome feedback.
- **Feedback-loop risk:** Learning from user outcomes can reinforce biased recommendations unless the feedback data and evaluation criteria are carefully governed.

## Action Items and Next Steps

No individual owner or deadline was explicitly assigned in the transcript; assignments below therefore remain `TBD` rather than being invented.

| # | Task | Owner | Deadline | Priority | Evidence |
|---:|---|---|---|---|---|
| 1 | Write a one-sentence problem statement and value proposition that clearly differentiates the concept from 16Personalities and ordinary career quizzes. | TBD | TBD | High | [00:19:41] [00:22:37] |
| 2 | Freeze the hackathon MVP to conversational profiling, explainable job recommendations, one role preview, and a short next-step roadmap. | Team | Before prototype implementation | High | [00:04:29] [00:19:41] |
| 3 | Define the minimum user-profile schema: interests, strengths, preferences, skills, experience, constraints, and confidence/uncertainty. | TBD | TBD | High | [00:00:00] [00:04:29] |
| 4 | Design a short adaptive conversation that can be completed without questionnaire fatigue and can rephrase unclear questions. | TBD | TBD | High | [00:04:29] [00:19:41] |
| 5 | Create three representative job-profile cards containing fit rationale, activities, required skills, market context, and a role-preview link. | TBD | TBD | High | [00:01:18] [00:04:29] |
| 6 | Decide what evidence will demonstrate recommendation quality and user confidence during judging. | TBD | TBD | High | [00:19:41] [00:22:37] |
| 7 | Separate post-hackathon ideas—learning personalization, simulations, longitudinal coaching, and fine-tuning—into a roadmap slide. | TBD | TBD | Medium | [00:04:29] [00:19:41] |
| 8 | Interview representative secondary students, university students, graduates, and career switchers to validate the problem and current alternatives. | TBD | TBD | High | [00:01:18] [00:04:29] |

## Open Questions

1. Which user segment should be primary for the hackathon demo: secondary students, university students, graduates, or career switchers?
2. What evidence makes a recommendation credible enough that a user leaves convinced rather than merely entertained?
3. How will the product distinguish supportive guidance from an unvalidated psychological or aptitude assessment?
4. Which career taxonomy and skill framework will power the prototype?
5. Where will salary, demand, location, and remote-work data come from, and how will freshness be shown?
6. How many adaptive questions are sufficient before producing useful recommendations?
7. Which role-preview content can legally and reliably be embedded or linked?
8. What user data will be saved, for how long, and how can the user delete it?
9. Does the team want to commit to this idea, refine its differentiator, or compare it against another hackathon concept before implementation?

## Recommended Hackathon Positioning

**Working value proposition:**

> An AI career-discovery companion that replaces exhausting personality questionnaires with an adaptive conversation, then turns the user’s interests, skills, personality signals, and experience into explainable career options, realistic role previews, and a practical first-step roadmap.

**Recommended demo story:** A confused university student completes a short adaptive conversation, receives three evidence-backed career profiles, explores one realistic “day in the life,” challenges the recommendation in chat, and leaves with a saved summary and a focused seven-day exploration plan.

**Success criterion:** The user can explain why the recommended options fit, identify one option worth testing next, and name the first concrete action they will take.
