# Student attendance management system

## Features

1. Boilerplate fully typed with `TypeScript`
2. Configured with `Vite`. Vite pre-bundles dependencies using esbuild. Esbuild is written in Go and pre-bundles dependencies 10-100x faster than other JavaScript-based bundlers. [Learn more about vite](https://dev.to/karanpratapsingh/vite-is-too-fast-i8g)
3. Configured with `Ant Design`
4. Less, Scss, CSS & styled-components can be use if needed
5. It has the translation & styled-components default theme with typed configuration
6. Configured with `React Router V6` which has the more optimised features than previous version
7. Has access control features
8. It has the fallback UI for internal server error & unauthorised

## Quick start

1. You'll need to have Node >= 14.18.1 and npm >= 6.14.15 on your machine.
2. Clone this repo using `git clone --depth=1 https://github.com/strativ-dev/react-boilerplate-ts <YOUR_PROJECT_NAME>`
3. Enter to the project directory: `cd <YOUR_PROJECT_NAME>`
4. Run `yarn or npm install` in order to install dependencies.
5. At this point you can run `yarn dev or npm dev` to see the app at `http://localhost:5173`
6. You may need to a `.env` file. For development `.env.development`

Now you are ready to buzz!

## .env example

`.env`

```
VITE_BACKEND_API_URL=https://reqres.in/api
```

`.env.development`

```
VITE_BACKEND_API_URL=https://example.com/api
```

super_admin & admin: add subject and assign subject to teacher's and student as well as

teacher: view assigned subjects, enable/disable attendance taking for each subject, manually taking attendance

student: view assigned subject, give attendance while teacher enable it
