# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? Install [Bun](https://bun.sh/docs/installation), the package manager used by this project.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install --frozen-lockfile
bun run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## GitHub Pages deployment

Pushing to `main` runs the GitHub Actions workflow in `.github/workflows/deploy.yml`.
It creates a static TanStack Start build with the project-site base path
`/AI-Placement-Predict1/` and deploys `dist/client` to GitHub Pages.
