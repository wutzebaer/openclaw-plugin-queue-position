import { defineFeaturePlugin } from "openclaw/plugin-sdk/feature-plugin";
import { contract } from "./contract.js";
import { modelCallFromHook, noteModelCallEnded, noteModelCallStarted, readModelLane, readModelQueuePosition } from "./model-calls.js";
export default defineFeaturePlugin({
    contract,
    name: "Queue Position",
    description: "Shows whether a model request is being served or which queue place it holds.",
    setup(api) {
        const hooks = api;
        hooks.on("model_call_started", (event, context) => {
            const call = modelCallFromHook(event, context);
            if (call)
                noteModelCallStarted(call);
        });
        hooks.on("model_call_ended", (event, context) => {
            const call = modelCallFromHook(event, context);
            if (call)
                noteModelCallEnded(call.callId);
        });
        return {
            position: ({ sessionKey }) => readModelQueuePosition(sessionKey),
            lane: () => readModelLane(),
        };
    },
});
