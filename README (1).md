# SafeHer - Women Safety Alert App

A web app that helps a woman send an emergency alert with her live location to trusted contacts. Built with plain HTML, CSS and JavaScript. No installation or backend needed.

## Features
- **SOS button**: starts a loud siren, gets live GPS location and prepares an alert message
- **One tap sending**: WhatsApp, SMS and Call buttons for every saved emergency contact
- **Emergency contacts**: save up to 5 trusted people
- **Safe Timer**: if "I'm Safe" is not pressed before the timer ends, the SOS alert starts automatically
- **Fake Call**: an incoming call screen to help leave an uncomfortable situation
- **Helplines**: one tap call for 112, 100, 1091, 181, 108 and cyber crime 1930
- **Safety tips** and **alert history** with map links
- Data stays in the browser (localStorage)

## Tech Stack
HTML5, CSS3, JavaScript (ES6), Geolocation API, Web Audio API, Web Share API, Vibration API

## How to Run
Open the live link (GitHub Pages) on a phone or laptop and allow the location permission.
Location works only on `https` pages or `localhost`, not when `index.html` is opened directly as a file.

## Important Note
A website cannot send SMS or WhatsApp messages silently in the background. After the alert starts, the user taps a contact button and the message opens ready to send. In a real emergency always call 112.

## Project Structure
```
women-safety-alert-app/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Future Improvements
- Mobile app version that sends SMS automatically
- Backend to notify contacts with live location tracking
- Audio or video recording during an alert

## Author
Karthiga SP
