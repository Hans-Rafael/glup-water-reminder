Expo-managed skeleton for WaterReminderApp

To run locally:

1. cd expo-managed
2. npm install
3. npm run start

To build an APK with EAS:

1. npm install -g eas-cli
2. eas login
3. cd expo-managed
4. eas build:configure
5. eas build --platform android --profile preview
