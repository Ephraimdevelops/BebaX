try {
    console.log("Requiring expo/metro-config...");
    const { getDefaultConfig } = require("expo/metro-config");
    console.log("Requiring nativewind/metro...");
    const { withNativeWind } = require("nativewind/metro");

    console.log("Getting default config...");
    const config = getDefaultConfig(__dirname);

    console.log("Applying NativeWind...");
    const finalConfig = withNativeWind(config, { input: "./global.css" });

    console.log("Success! Config loaded.");
} catch (error) {
    console.error("Error loading config:", error);
}
