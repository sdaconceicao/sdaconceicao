---
title: Poképendium
description: A full stack application that provides all the information on Pokémon you ever wanted.
repo: https://github.com/sdaconceicao/pokependium
url: https://pokedex-frontend-beryl.vercel.app/
tech:
  - Next.js
  - GraphQl
  - nestjs
  - TypeScript
  - Vite
  - Playwright
featured: true
image: ./cover.png
imageAlt: "Pokependium homepage"
images:
  - src: ./poke-1.png
    alt: "Type view with visualization showing strengths and weaknesses"
  - src: ./poke-2.png
    alt: "Details view of a Pokemon"
status: live
order: 2
---

The Poképendium is a full stack Pokémon encyclopedia built to help me better understand GraphQL and the challenges of working with complex, interconnected data. Rather than building another tutorial application, I wanted to create something that could take advantage of GraphQL's ability to combine related data into a flexible, queryable API.

The application transforms data from the public PokéAPI into a GraphQL service that exposes composed entities and relationships across Pokémon, including their forms, types, abilities, and other related information. The service handles combining data from multiple REST endpoints and caches the results server-side, allowing the cost of retrieving and composing that data to be shared across users.

The frontend is built with Next.js and provides a data-rich exploration experience, including the ability to search and filter Pokémon by multiple attributes. It uses server side rendering to improve initial page performance and reduce unnecessary client side JavaScript. Most pages are primarily presentational, so data can be fetched and rendered on the server rather than requiring interactive client side applications for every view.

The project gave me an opportunity to explore GraphQL schema design, data composition, caching strategies, and the trade offs between server side rendering and client side interactivity in a data rich application. It was also alot of fun coming up with ways to visualize some of the more complex relationships, like how dual types are handled both on offense and defense.
