# SkyCast Weather

[Open the live app](https://skycast-weather-adarsh271402.netlify.app)

Weather forecasts with location search, hourly and seven-day forecasts, air quality, and Celsius/Fahrenheit units. Built with Next.js, React, and Tailwind CSS, using Open-Meteo weather data.

## Run locally

```sh
npm install
npx next dev -p 3000
```

Open http://localhost:3000.

## Deployment

Hosted on Netlify with Next.js API routes. Build settings are in `netlify.toml`.

To publish updates with the Netlify CLI after linking this project:

```sh
npx netlify-cli deploy --prod --context production
```
