📘 Online Math & English Skills Assessment Platform

Mini Project — Software Requirements Specification (SRS)

🧾 Description

This project defines the requirements for a web-based assessment system designed to evaluate Math and English skills of 9th grade students.
The platform supports online exam delivery, time tracking, student data collection, and automated PDF report generation.

This repository documents the Software Requirements Specification (SRS) for analysis, design, development, and testing phases.

🎯 Objectives

The system is designed to:

Deliver structured online assessments

Enforce a controlled, linear exam flow

Track exam duration via countdown timer

Persist student responses reliably

Generate server-side PDF reports

Provide role-based administrative access

👥 User Roles & Permissions
Role	Access Level
Student	Registration, exam participation, report download
Teacher	Exam and question management
Manager	Read-only access to student list & contact data
Admin	Full system configuration & management
🏗 System Architecture (Conceptual)
Client (Browser)
    ↓
Web Application (Frontend)
    ↓
Application Server (Backend)
    ↓
Database + PDF Generation Service
Components:

Frontend

Landing / Registration UI

Exam Interface

Timer Display

Report Download UI

Backend

Registration Handling

Exam Session Management

Timer Logic

Answer Persistence

Report Generation

Database

Student records

Exams & questions

Student responses

Results / scores

PDF Module

Server-side generation

Performance summary export

🧩 Functional Modules
🔐 Registration Module

Mandatory student data capture

Input validation

Record persistence

Redirect to exam instructions

Key Requirements:
FR-REG-01 → FR-REG-05

📄 Instruction Module

Display pre-exam guidelines

Trigger exam session initialization

Key Requirements:
FR-INS-01 → FR-INS-03

🧠 Exam Delivery Module

Paginated question display

Forward-only navigation

Autosave between pages

Session state tracking

Key Requirements:
FR-EXAM-01 → FR-EXAM-05

⏱ Timer Module

Global countdown timer

UI synchronization across pages

Auto-submit on expiration

Key Requirements:
FR-TIME-01 → FR-TIME-03

✅ Submission Module

Final confirmation workflow

Session termination

Prevent re-entry

Key Requirements:
FR-SUB-01 → FR-SUB-05

📊 Report Module

Score computation

Performance summarization

PDF generation & delivery

Key Requirements:
FR-REP-01 → FR-REP-04

🧑‍💼 Admin Module

Role-based access control (RBAC)

Exam management

Student data access

Key Requirements:
FR-ADM-01 → FR-ADM-04

⚙️ Non-Functional Requirements
Category	Constraint
Usability	Minimal learning curve for 9th graders
Performance	Page transitions ≤ 2s
Performance	PDF generation ≤ 5s
Reliability	No response loss during navigation
Security	Restricted access to student data
Availability	Active during scheduled exams
🔒 Security Considerations

Role-based authorization

Isolated student exam sessions

Server-side data validation

Controlled access to contact information

🗄 Data Entities (High-Level)

Student

First Name

Last Name

Mobile Number

Exam

Subject (Math / English)

Duration

Questions

Question

Content

Options / Answer

Response

Student ID

Question ID

Selected Answer

Report

Student ID

Scores

PDF Document

🌐 Operating Environment

Web browser (desktop/mobile)

Internet connectivity required

Server-hosted application

📎 Assumptions

Stable student internet access

Exams predefined by teachers

PDF generation service available

🚫 Exclusions / Out of Scope

Advanced authentication mechanisms

Social login providers

Adaptive testing algorithms

Detailed analytics dashboards

🚀 Future Enhancements

Potential extensions:

User authentication & login system

Analytics & performance tracking

Adaptive testing logic

Multi-grade support

Dashboard for teachers & managers

📌 Project Context

This system is implemented as a mini project / prototype, serving as a rehearsal for a larger semester-scale academic project.
