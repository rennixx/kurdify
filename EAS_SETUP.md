# EAS Build Setup for Kurdify

This guide covers setting up Expo Application Services (EAS) for building and deploying Kurdify.

## Prerequisites

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

## Environment Variables Setup

### 1. Set EAS Secrets

Run these commands to set your Supabase credentials as EAS secrets:

```bash
# Set Supabase URL
eas secret:create --scope project --name SUPABASE_URL --value your-supabase-url

# Set Supabase Anon Key  
eas secret:create --scope project --name SUPABASE_ANON_KEY --value your-supabase-anon-key
```

Replace `your-supabase-url` and `your-supabase-anon-key` with your actual Supabase credentials.

### 2. Verify Secrets

```bash
eas secret:list --scope project
```

## Build Commands

### Development Build
```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

### Preview Build
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Production Build
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

## EAS Update (OTA Updates)

Setup for over-the-air updates:

```bash
# Configure EAS Update
eas update:configure

# Publish an update
eas update --branch production --message "Bug fixes and improvements"
```

## Build Profiles

The `eas.json` includes three profiles:

- **development**: For development builds with dev client
- **preview**: For internal testing and sharing
- **production**: For App Store/Play Store releases

## Security Notes

- ✅ Environment variables are securely stored as EAS secrets
- ✅ Never commit actual credentials to git
- ✅ Secrets are injected at build time
- ✅ Different secrets can be used for different build profiles

## Local Development

For local development, continue using your `.env` file as before. EAS secrets are only used during cloud builds.

## Troubleshooting

### Build Fails with Environment Variables
- Verify secrets are set: `eas secret:list --scope project`
- Check secret names match exactly in `eas.json`
- Ensure values don't have extra quotes or spaces

### Metro/Bundle Issues
- Clear Metro cache: `pnpm start --clear`
- Reset EAS cache: `eas build --clear-cache`

## Next Steps

1. Set up your EAS secrets using the commands above
2. Run a development build to test
3. Set up EAS Submit for app store deployment