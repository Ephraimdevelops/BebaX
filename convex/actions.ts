import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendPushNotification = action({
    args: {
        to: v.string(),
        title: v.string(),
        body: v.string(),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        if (!args.to) return;

        const message = {
            to: args.to,
            sound: 'default',
            title: args.title,
            body: args.body,
            data: args.data,
        };

        try {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
        } catch (error) {
            console.error("Failed to send push notification:", error);
        }
    },
});
