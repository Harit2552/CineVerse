# CineVerse Seats

Create a modern, premium movie seat booking website for a single movie theater called CineVerse Cinemas.

The website should focus primarily on the movie selection → showtime selection → interactive seat selection → booking confirmation experience. It should look like a real production cinema website, not a generic template.

1. Home Page

Create a visually appealing cinema homepage with a dark, cinematic theme.

Include:

CineVerse Cinemas logo/name

Navigation: Home, Movies, Shows, My Bookings, About Us

Hero section featuring the currently popular movie

"Book Tickets" CTA

"Now Showing" section

"Coming Soon" section

Today's available showtimes

Theater facilities

Location and contact information

Movie cards should contain:

Movie poster

Movie title

Genre

Duration

Language

Rating

"Book Now" button

Use realistic sample movies such as:

Avengers: Endgame

Interstellar

Inception

Spider-Man: No Way Home

Dune: Part Two

2. Movie Details Page

When the user selects a movie, display:

Large movie poster

Movie title

Rating

Genre

Duration

Language

Age rating

Description

Cast

Trailer button

Below this, provide:

Select Date

Show the next 7 days as selectable date cards.

Example:

MON 15
TUE 16
WED 17
THU 18
FRI 19
SAT 20
SUN 21

Select Showtime

Display available showtimes:

10:00 AM
1:30 PM
4:30 PM
7:30 PM
10:30 PM

Each showtime should display:

Time

Screen number

Available seats

Clicking a showtime should take the user to the seat-selection page.

3. Interactive Seat Selection Page

This is the most important part of the website.

Create a realistic cinema seating layout.

At the top display:

      SCREEN
 ───────────────


Create rows:

A A A A A A A A
B B B B B B B B
C C C C C C C C
D D D D D D D D
E E E E E E E E
F F F F F F F F
G G G G G G G G
H H H H H H H H

Use seat numbers such as:

A1 A2 A3 A4 A5 A6 A7 A8

Include aisles between seat sections where appropriate.

Different seat types:

Regular

Premium

VIP

Each seat must have a different state:

Available

User can select it

Selected

Highlight it clearly

Booked

Disabled and unclickable

Unavailable

Disabled

Add a seat legend:

🟢 Available
🔵 Selected
⚫ Booked
🟡 Premium

Users should be able to:

Click an available seat to select it

Click again to deselect it

Select multiple seats

See selected seats update instantly

4. Booking Summary

Keep a booking summary panel visible on desktop and accessible on mobile.

Display:

Movie:
Interstellar

Date:
Friday, 19 September

Show:
7:30 PM

Screen:
Screen 2

Selected Seats:
D5, D6

Ticket Price:
₹400

Convenience Fee:
₹40

Taxes:
₹72

Total:
₹512

Include a large:

Proceed to Payment

button.

Do not allow the user to continue without selecting at least one seat.

5. Payment Page

Create a clean checkout page.

Payment methods:

UPI

Credit/Debit Card

Net Banking

Wallet

Show the booking summary on the right.

This is a demo application, so payment should be simulated rather than processing real money.

Add:
Pay ₹512

After clicking, show a short loading animation and then successful payment.

6. Booking Confirmation

Create a beautiful confirmation page.

Display:

✓ Booking Confirmed

Booking ID:
CV-839421

Movie:
Interstellar

Date:
19 September 2026

Time:
7:30 PM

Screen:
Screen 2

Seats:
D5, D6

Amount:
₹512

Generate a QR-code style ticket containing the booking information.

Add buttons:

Download Ticket

View My Bookings

Back to Home

The ticket should visually resemble a real cinema ticket.

7. My Bookings

Create a user booking page with two sections:

Upcoming

Show upcoming tickets with:

Movie poster

Movie name

Date

Time

Screen

Seats

Booking ID

QR code

View Ticket button

Cancel Booking button

Booking History

Display previous bookings.

8. Theater Information

Create an About Theater section containing:

CineVerse Cinemas

Include:

Theater description

Address

Contact number

Opening hours

Parking information

Food & beverages

Dolby Atmos

Recliner seats

Accessibility facilities

9. Admin Dashboard

Create a simple admin dashboard for the theater.

Include:

Dashboard statistics:

Total bookings

Today's revenue

Tickets sold

Current occupancy

Upcoming shows

Admin sections:

Movies

Shows

Screens

Seats

Bookings

Users

Revenue

Admin should be able to:

Add movies

Edit movies

Remove movies

Create shows

Change showtimes

Set ticket prices

View bookings

View seat occupancy

10. Design

Use a premium dark cinema aesthetic.

Design characteristics:

Dark background

Cinematic gradients

Large movie imagery

Glassmorphism where appropriate

Rounded cards

Subtle shadows

Smooth hover effects

Smooth page transitions

Modern typography

Clear visual hierarchy

Use colors that feel cinematic, but don't overuse gradients.

The interface should feel similar in quality to a professional ticket-booking platform.

11. Responsive Design

The website must be fully responsive.

Desktop

Use a two-column layout for seat selection:

Left: Cinema seating

Right: Booking summary

Mobile

Stack the layout:

Movie/show information

Seat map

Booking summary

Proceed button

Make the seat map horizontally scrollable if necessary.

12. Important Functional Behavior

Implement these interactions:

User selects a movie.

User selects a date.

User selects a showtime.

Seat map loads for that specific show.

Booked seats appear unavailable.

User selects seats.

Price updates automatically.

User proceeds to payment.

Payment is simulated.

Seats become booked.

Booking confirmation is generated.

Ticket appears under My Bookings.

Most importantly:

Seat availability must be specific to each show.

For example:

D5 booked for the 7:30 PM show
→ D5 must still be available for the 10:30 PM show.

Prevent double booking and ensure the UI always reflects the current booking state.

13. Technical Quality

Use:

Reusable components

Clean folder structure

Proper state management

Form validation

Loading states

Empty states

Error states

Responsive components

Accessible buttons and controls

Do not create a static mockup. Make the booking flow interactive and functional using realistic mock data if a backend is not available.

The final application should feel like a real single-theater movie booking platform, with the interactive seat-selection experience being the central feature.  every user should have to login before doing payment and accessing mybooking profile

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2b0b2c00-5212-4734-b80c-72aae5e42bbf).

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
