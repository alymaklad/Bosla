# Project Summary: Masar AI (مسار) — Autonomous Career Guidance Platform

## Project Abstract

Masar AI is an end-to-end multi-agent software platform designed to deliver individualized career counseling, skill gap evaluations, and interactive mentorship for students and early-career professionals. By processing student background attributes alongside uploaded resume documents, the system synthesizes unstructured user input into structured career vectors, actionable skill development roadmaps, and dynamic mentorship interactions.

---

## System Architecture & Technical Specifications

```
  [ Student Inputs ] ---> [ PyPDF2 Engine ]
  (Major, Interests,       (CV / Resume Text
     Experience)              Extraction)
          |                        |
          +-----------+------------+
                      |
                      v
          [ Unified LangChain Pipeline ]
                      |
                      v
             [ Quantized Model ]
           (Qwen2.5-7B Engine)
                      |
          +-----------+-----------+
          |                       |
          v                       v
[ Agent 1 & 2: Assessment ]   [ Agent 3: Mentorship Chat ]
(Career Matches & Roadmaps)   (Context-Aware QA Engine)
          |                       |
          +-----------+-----------+
                      |
                      v
        [ Agent 4: ReportLab Engine ]
        (PDF Compilation & Export)
                      |
                      v
       [ Gradio Microservice Interface ]

```

The application is structured around a modular pipeline divided across eight distinct operational components:

* **Cell 1: System Dependencies & Environment Setup** — Configures core libraries, CUDA acceleration parameters, and environment dependencies.
* **Cell 2: LLM Inference Engine** — Initializes the foundational text-generation pipeline leveraging quantized local execution (`Qwen2.5-7B`).
* **Cell 3: Document Ingestion Engine** — Microservice responsible for extracting, sanitizing, and normalizing text from user-uploaded PDF resumes (`PyPDF2`).
* **Cell 4: Assessment & Skill Gap Engine (Agents 1 & 2)** — Constructs structured LangChain prompt primitives designed to execute single-pass evaluations of candidate skills against current market profiles.
* **Cell 5: Unified Pipeline Orchestration** — Integrates user profile metadata, parsed resume contents, and model parameters into a cohesive execution chain.
* **Cell 6: Contextual Mentorship Engine (Agent 3)** — Powers a stateful conversational agent capable of handling follow-up queries while maintaining reference to the user's primary career evaluation.
* **Cell 7: Document Compilation Microservice (Agent 4)** — Converts raw output logs and conversational state into structured PDF documents utilizing a PLATYPUS page-budget design (`ReportLab`).
* **Cell 8: Gateway & User Interface** — Deploys a two-tier Gradio web interface handling event queues, token-level streaming, and session state persistence.

---

## Core Technical Features

| Feature | Implementation Mechanism | Technical Objective |
| --- | --- | --- |
| **Document Processing** | PyPDF2 Text Extraction | Normalizes unstructured PDF input for prompt injection. |
| **Real-Time Streaming** | LangChain `stream` Interface | Minimizes user latency by displaying token outputs live. |
| **Context Retention** | Session State Orchestration | Maintains evaluation history across the chat interface. |
| **Report Generation** | ReportLab PLATYPUS Layout | Compiles styled PDF reports containing assessment logs. |
