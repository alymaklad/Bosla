# Bosla / Questify Learning Analytics System

## 1. Project Overview

The **Bosla / Questify Learning Analytics System** is an analytics and machine learning solution designed to help administrators understand learner progression, engagement, performance, and learning difficulties.

The project extends the analytics framework used in the Student Performance project:

> **Student data → Analyze behavior → Find factors related to performance → Detect problems → Build a model → Give useful insights**

For Bosla and Questify, this becomes:

> **Learner activity data → Analyze progression → Find factors related to learning outcomes → Detect struggling users → Compare user groups → Give admins actionable insights**

The goal is not simply to display completion percentages. Instead, the system should help administrators answer questions such as:

- Is a learner progressing normally?
- Where is the learner struggling?
- Which activities are associated with better progression?
- Are Bosla users progressing differently from non-users?
- Which learners are becoming inactive?
- Which topics or skills have the highest failure rates?
- Does using a particular feature appear to be associated with better learning outcomes?

---

## 2. Inspiration: The Student Performance Project

The Student Performance project used variables such as:

| Student Performance Variable | Bosla / Questify Equivalent |
|---|---|
| `StudyTimeWeekly` | Learning time / platform usage |
| `Absences` | Missed sessions / inactivity |
| `Tutoring` | Use of learning support |
| `ParentalSupport` | Mentor or teacher engagement |
| `Extracurricular` | Additional learning activities |
| `GPA` | Learning performance |
| `GradeClass` | Performance category |

A similar dataset can be built for each learner.

### Example Learner Dataset

| User | Learning Hours | Lessons Completed | Quiz Average | Attempts | Active Days | Bosla Usage | Progress |
|---|---:|---:|---:|---:|---:|---|---:|
| A | 18 | 25 | 88% | 32 | 15 | Yes | 82% |
| B | 5 | 8 | 61% | 12 | 4 | No | 35% |
| C | 14 | 21 | 79% | 27 | 12 | Yes | 74% |

This data can be used to analyze learner behavior, identify patterns, and build predictive models.

---

## 3. Core Metric: Learning Progression

Instead of using GPA as the main target, Bosla or Questify could use a **Learning Progress Score**.

This score could incorporate:

- Lessons completed
- Skills mastered
- Quiz performance
- Assignment performance
- Learning consistency
- Improvement over time

The system should track the learner's progression through the following stages:

> **Initial level → Current level → Improvement**

### Example

> A learner started at 42% proficiency and reached 71% after six weeks.

This provides more meaningful information than simply reporting course completion.

> **Completion does not necessarily equal learning.**

---

## 4. Detecting Learning Problems

The system can identify several types of learner difficulties.

### 4.1 Low Engagement

A learner has not logged in for a specific period, such as 10 days.

### 4.2 Slow Progression

A learner remains active but their skill level does not improve significantly.

### 4.3 Repeated Mistakes

A learner repeatedly fails questions related to a particular topic.

### 4.4 High Effort with Low Performance

A learner spends substantial time studying but continues to achieve low quiz scores.

### 4.5 Sudden Performance Decline

A learner's performance decreases over time.

Example:

> **82% → 79% → 61%**

This pattern can alert an administrator that the learner may require further investigation or support.

---

## 5. Comparing Bosla Users and Non-Users

One of the key analytics features is comparing learners who use Bosla with learners who do not.

### Learner Groups

#### Group A: Bosla Users

Learners who use the Bosla platform.

#### Group B: Non-Bosla Users

Learners who do not use the Bosla platform.

### Example Comparison

| Metric | Bosla Users | Non-Bosla Users |
|---|---:|---:|
| Average Progress | 78% | 61% |
| Average Quiz Score | 84% | 70% |
| Completion Rate | 82% | 64% |
| Weekly Learning Time | 11.5 hours | 7.2 hours |
| Dropout / Inactivity Rate | 8% | 19% |

These comparisons can help administrators identify differences between the two groups.

### Important Statistical Consideration

If Bosla users perform better than non-users, the result should be described as an **association**, not proof that Bosla caused the improvement.

Other factors may explain the observed differences, including:

- Previous learner ability
- Motivation
- Access to educational resources
- Teacher or mentor support
- Time available for learning
- Other demographic or contextual factors

> **Correlation or association does not automatically imply causation.**

---

## 6. Hypothesis Testing

The Student Performance project investigated whether tutoring had a significant relationship with GPA.

A similar approach can be applied to Bosla.

### Research Question

> Is there a statistically significant difference in average learning progression between Bosla users and non-users?

A **two-sample t-test** could be used if the outcome and the test assumptions are appropriate.

### Hypotheses

- **Null hypothesis (H₀):** There is no difference in average progression between Bosla users and non-users.
- **Alternative hypothesis (H₁):** There is a difference in average progression between Bosla users and non-users.

### Interpreting the Result

If:

> **p < 0.05**

there is statistical evidence of a difference in the sample under the selected test and significance level.

The result should still be interpreted carefully, especially when the data comes from observational groups rather than a randomized experiment.

---

## 7. Correlation Analysis

Correlation analysis can be used to investigate relationships between learning behavior and outcomes.

Potential relationships include:

- Learning time ↔ Progress
- Number of attempts ↔ Skill improvement
- Active days ↔ Completion rate
- Quiz attempts ↔ Final performance

### Example

> **Active Days ↔ Progress = 0.62**

A positive correlation of 0.62 would indicate a positive association between active days and progress in the analyzed dataset.

However:

> **Correlation does not prove causation.**

Correlation analysis is useful for identifying relationships that may deserve further investigation.

---

## 8. Regression Modeling

The Student Performance project used linear regression to predict GPA.

For Bosla or Questify, regression could be used to estimate learner progression.

> **Linear Regression → Predict learner progression**

### Possible Input Features

- Learning hours
- Active days
- Lessons completed
- Quiz attempts
- Average quiz score
- Assignment completion
- Number of failed attempts
- Time since last activity
- Bosla usage

### Example Output

> **Predicted progress = 76%**

Regression can also help identify which variables are associated with the outcome while accounting for other variables included in the model.

The predicted score should be treated as an estimate rather than a guaranteed result.

---

## 9. Decision Tree Analysis

Decision trees can produce understandable rules that help administrators interpret learner behavior.

### Example Decision Tree

```text
                     Active Days
                    /           \
                 >10             ≤10
                 /                 \
           Quiz Score            Inactive
            /      \                 |
         >75%      ≤75%          At Risk
          |          |
      Good Progress  Medium
```

Decision trees are useful for administrators because their rules can be easier to understand than the outputs of more complex models.

---

## 10. Administrator Dashboard

The analytics system can eventually be integrated into an administrator dashboard.

### 10.1 Overall Dashboard

Example metrics:

- **Total Learners:** 2,450
- **Active Learners:** 1,820
- **Average Progress:** 73%
- **Average Quiz Score:** 78%
- **At-Risk Learners:** 184
- **Inactive Learners:** 231

> These values are illustrative examples, not actual platform measurements.

### 10.2 Progression Overview

A graph can display learner progress over time:

```text
Week 1 → Week 2 → Week 3 → Week 4 → Week 5
```

The dashboard could support:

- Individual learner progression
- Group-level progression
- Course-level progression
- Skill-level improvement
- Changes in performance over time

### 10.3 Problem Areas

The dashboard could highlight topics with high rates of learner difficulty.

Example:

| Topic | Percentage of Learners Struggling |
|---|---:|
| Mathematics | 34% |
| Algebra | 29% |
| Geometry | 21% |

### 10.4 Bosla Users vs. Non-Users

Example comparison:

#### Bosla Users

- Progress: 78%
- Completion: 84%
- Quiz Average: 82%

#### Non-Bosla Users

- Progress: 63%
- Completion: 67%
- Quiz Average: 71%

A statistical test could be displayed below the comparison.

Example:

> **Statistical test: p = 0.003**

This would indicate that the observed difference is statistically significant under the selected test and assumptions.

> The example values above are illustrative and should not be interpreted as actual findings.

---

## 11. At-Risk Learner Detection

The project can extend beyond descriptive analytics and regression into classification.

Instead of predicting GPA or progression, the system could predict whether a learner is likely to struggle or fall behind.

### Classification Target

> **At Risk = Yes / No**

### Possible Machine Learning Algorithms

- Logistic Regression
- Decision Tree
- Random Forest

### Example Prediction

```text
Student: 1254
Risk probability: 82%

Potential contributing signals:
- 12 days inactive
- Low quiz performance
- Repeated failures in Algebra
- Progress declining for 3 weeks
```

This type of output gives administrators actionable information that can support early intervention.

The risk probability should be calibrated and validated before being used in real decisions. It should support human review rather than automatically labeling or penalizing learners.

---

## 12. Relationship Between the Three Projects

The Student Performance project, Questify, and Bosla can share the same analytics philosophy.

### Student Performance Project

> **Analyze → Find factors → Predict performance**

↓

### Questify

> **Track learning behavior → Analyze progression → Identify problems**

↓

### Bosla

> **Track learning behavior → Compare users → Detect issues → Predict risk → Support decisions**

The Student Performance project can therefore serve as a conceptual and analytical foundation for a broader learning analytics system.

---

## 13. Complete Bosla Analytics Pipeline

```text
                     LEARNER DATA
                          ↓
               Data Collection & Cleaning
                          ↓
                  Exploratory Analysis
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
       Progress Analysis       Behavior Analysis
              ↓                       ↓
       Performance Trends     Engagement Patterns
              ↓                       ↓
              └───────────┬───────────┘
                          ↓
                  Statistical Testing
                          ↓
                   Bosla vs Non-Bosla
                          ↓
                     ML Prediction
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
       Progress Prediction      Risk Detection
              ↓                       ↓
              └───────────┬───────────┘
                          ↓
                   ADMIN DASHBOARD
                          ↓
                    Insights & Actions
```

---

## 14. Main Project Questions

The system should help answer the following questions:

1. How are learners progressing over time?
2. Which learners are struggling or falling behind?
3. Which topics and skills have the highest failure rates?
4. Which engagement patterns are associated with better learning outcomes?
5. How do Bosla users differ from non-Bosla users?
6. Is there statistical evidence of differences between learner groups?
7. Can learner progression be estimated using behavioral data?
8. Can learners at risk of falling behind be identified early?
9. Which insights can administrators use to provide better support?

---

## 15. Key Takeaway

The project should evolve from a simple analytics and visualization tool into a practical **Learning Analytics System for Administrators**.

The main conceptual transition is:

> **Student Performance:**  
> What factors are related to student GPA, and can we predict GPA?

to:

> **Bosla / Questify:**  
> How are learners progressing, what problems are they experiencing, what factors are associated with their progress, how do Bosla users differ from non-users, and which learners may need attention?

The value of the system lies in combining:

- Descriptive analytics
- Progression tracking
- Engagement analysis
- Correlation analysis
- Hypothesis testing
- Regression modeling
- Decision tree analysis
- At-risk classification
- Actionable administrator dashboards

Together, these components form a foundation for data-informed learning support and learner success.
