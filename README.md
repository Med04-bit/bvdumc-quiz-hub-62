# BVDUMC Quiz Hub (62)

Build the initial foundation of a professional web application called:

BVDUMC Quiz Society

Institution:
Bharati Vidyapeeth Deemed University Medical College, Pune

This is a long-term platform for managing medical quiz competitions conducted by the BVDUMC Quiz Society.

I am a complete beginner with no coding experience, so make safe technical decisions and explain important decisions in simple language.

GOAL OF THIS PHASE

For this first phase, DO NOT build the complete quiz system yet.

Only build the reliable foundation.

We will add the online quiz engine, offline quizmaster system, scorekeeper, certificates, logistics and analytics in later phases.

TECHNOLOGY

Use a modern production-ready stack appropriate for Lovable.

Prefer:

React

TypeScript

Tailwind CSS

Supabase/PostgreSQL

Supabase Authentication

Row Level Security

Responsive design

Do not expose secrets in frontend code.

Do not use fake/mock functionality where a real database implementation is appropriate.

VISUAL DESIGN

Create a premium, modern academic interface.

The application should feel appropriate for a medical college quiz society.

Style:

clean

professional

modern

minimal

academic

responsive

easy to navigate

Avoid childish gaming aesthetics.

Use the branding:

BVDUMC QUIZ SOCIETY

Create a simple professional dashboard layout with:

sidebar navigation

top navigation

user profile area

notifications area

responsive mobile navigation

INITIAL NAVIGATION

Create these navigation items, even if some are placeholders for later phases:

Dashboard
Events
Participants
Teams
Question Bank
Online Quiz
Live Quiz
Scorekeeper
Leaderboard
Certificates
Logistics
Analytics
Settings

For modules that are not implemented yet, show an appropriate “Coming in a later phase” state rather than fake functionality.

AUTHENTICATION

Implement real authentication using Supabase.

Support:

sign up

login

logout

password reset

protected routes

Create a user profile associated with the authenticated user.

Do not allow unauthenticated users to access the application dashboard.

USER ROLES

Prepare the database and application architecture for these roles:

SUPER_ADMIN
ADMIN
IT_LOGISTICS_HEAD
QUESTION_SETTER
QUESTION_REVIEWER
QUIZMASTER
SCOREKEEPER
VOLUNTEER
PARTICIPANT

For now, implement the role architecture and permissions foundation.

Do not build all role-specific dashboards yet.

DATABASE FOUNDATION

Create a clean relational database structure.

At minimum create tables appropriate for:

profiles

roles

events

event_rounds

participants

teams

team_members

questions

question_reviews

scores

certificates

volunteers

logistics_items

audit_logs

Only implement fields that are necessary for the foundation.

Design the schema so that future phases can expand these tables safely.

Use proper primary keys, foreign keys, indexes and constraints.

SECURITY

Implement Row Level Security where appropriate.

Do not rely only on frontend restrictions.

Users should only be able to access data appropriate to their role.

Do not expose database credentials or service-role keys to the frontend.

ADMIN DASHBOARD

Create the initial dashboard.

Show cards for:

Upcoming Events

Active Events

Registered Participants

Registered Teams

Questions

Pending Reviews

These can initially show zero if there is no real data.

Create quick-action buttons:

Create Event
Add Participant
Create Team
Add Question

Only make buttons functional if the corresponding backend functionality exists.

EVENTS FOUNDATION

Create the Events page.

Allow authorized administrators to create an event with:

event name

description

date

start time

end time

venue

status

Statuses:

Draft
Registration Open
Registration Closed
Live
Completed
Archived

Create an event detail page.

Do not build advanced quiz rounds yet.

CODE QUALITY

Use reusable components.

Keep the project modular.

Avoid unnecessary dependencies.

Do not duplicate logic.

Do not overwrite working functionality unnecessarily.

Use clear naming.

Add appropriate loading, error and empty states.

IMPORTANT

Do not attempt to build the entire BVDUMC Quiz Society platform in this phase.

The purpose of Phase 1 is to establish a clean, secure and scalable foundation.

After implementing Phase 1, STOP.

Then provide me with:

What you built

Database tables created

Authentication implemented

Roles implemented

Pages created

What is currently functional

What is intentionally not implemented yet

Any configuration I need to complete in Supabase/Lovable

Do not proceed to Phase 2 until I explicitly ask you to.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b15ec3e1-315c-49cd-b579-04e446c513aa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
