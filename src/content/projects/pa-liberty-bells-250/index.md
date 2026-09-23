---
title: Liberty Bells 250
description: An interactive app that provides list and map views of the 250th anniversary Liberty Bell Project in Pennsylvania
repo: https://github.com/sdaconceicao/pa-libertybells-250
url: https://pa-libertybells-250.vercel.app/
tech:
  - React
  - TypeScript
  - Tanstack Start
  - Vite
  - Playwright
  - Leaflet
  - Vercel
featured: true
image: ./cover.png
imageAlt: "PA Liberty Bells Homepage"
images:
  - src: ./pa-1.png
    alt: "Map of Pennsylvania showing Liberty Bell locations and clustered markers"
  - src: ./pa-2.png
    alt: "Liberty Bell map with desktop and mobile location detail panels"
status: live
order: 3
---

Pennsylvania created a static website with a list of the locations for their Liberty Bell 250 project. With their current presentation, understanding where the bells are geographically, and planning which ones to visit, can be difficult.

I built this app to provide a more useful way to discover the bells, with an interactive map, location details, and the ability to track places I want to visit or have already visited. User accounts allow those preferences to be saved and accessed across sessions.

The project also gave me an opportunity to explore TanStack Start as a full stack React framework. Its combination of file based routing, server side functionality, and a React frontend made it a good fit for an application that primarily serves static location data but also requires authentication and persistent user data. he application includes a data synchronization pipeline that fetches and processes bell information, geocodes addresses to provide accurate map locations, and handles image processing for location imagery. The backend is intentionally focused on those user specific features.
