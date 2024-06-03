This app works like a normal AI chat. However, it is possible to talk with the AI without texting using the button and the bottom left. On top of that, the AI is capable of looking information online and get up to date information.
I made it with the intention of using ChatGPT for the AI, but when I tried to get the API Key I realized, that unlike the browser version, is not free. That is why right now uses Gemini instead. Gemini tends to make up information and is not as reliable. However, as long as it doesn't missbehave, it is good enough to make the app work the way I wanted. I left the code for calling ChatGPT, I wasn't able to test it properly but it should work based on the tests I made with the browser version .You'll have to add your API Keys for the AIs to work, you have to write them in AIservice.js. You can also change the AI used in that same file.

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.
