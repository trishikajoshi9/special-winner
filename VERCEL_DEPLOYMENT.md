# Netlify Auto-Deployment Guide

## Step-by-Step Deployment Instructions
1. **Sign up/Login to Netlify**: Go to [Netlify](https://www.netlify.com/) and create an account or log in.
2. **Link Your Repository**: Click on ‘New site from Git’ and choose GitHub. Authorize Netlify to access your GitHub account and select the repository.
3. **Configure Build Settings**: Specify the build command and publish directory accordingly (e.g., `npm run build` and `dist`).
4. **Deploy**: Click on deploy to start the process. Netlify will build and deploy your site.

## Environment Variables for Netlify
- You can set environment variables by going to Site settings > Build & deploy > Environment > Environment variables.
- Add necessary keys and secret values here.

## GitHub Secrets Setup
- Go to your GitHub repository > Settings > Secrets and variables > Actions > New repository secret.
- Add secrets for any API keys or sensitive information needed for your Netlify deployment.

## Gmail OAuth Configuration
1. **Create Google OAuth Credentials**: Go to [Google Developers Console](https://console.developers.google.com/) and create a new project.
2. **Configure Consent Screen**: Set up the permissions and scopes needed for your app.
3. **Create Credentials**: Generate OAuth 2.0 credentials and note your `Client ID` and `Client Secret`.
4. **Add Redirect URLs**: Ensure you add Netlify’s URL in the redirect URIs.

## PostgreSQL Setup
1. **Provision Database**: Use a service like Heroku or ElephantSQL to create your PostgreSQL database.
2. **Connection String**: Note the connection string needed for your application.
3. **Environment Variable**: Add this connection string to your Netlify environment variables as `DATABASE_URL`.

## Automatic Deployment Flow
- Every time you push code to the main branch or other specified branches, Netlify will automatically rebuild and deploy your site.

## Troubleshooting Guide
- **Failed Deploys**: Check the deploy log for errors and ensure all environment variables are set correctly.
- **Build Errors**: Review the build command and ensure all dependencies are correctly installed.

## Quick Commands
- To trigger a manual deployment, go to your Netlify dashboard and click on ‘Deploys’ then ‘Trigger deploy’.
- Use the command `netlify deploy` to deploy your site from the CLI.

## Useful Links
- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
- [Netlify Support](https://www.netlify.com/support/)