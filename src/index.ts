import { defineFeaturePlugin } from "openclaw/plugin-sdk/feature-plugin";
import { contract } from "./contract.js";
import { modelCallFromHook, noteModelCallEnded, noteModelCallStarted, readModelLane, readModelQueuePosition } from "./model-calls.js";

type HookApi = {
  on: (name: string, handler: (event: unknown, context: unknown) => void) => void;
};

export default defineFeaturePlugin({
  contract,
  name: "Queue Position",
  description: "Shows whether a model request is being served or which queue place it holds.",
  setup(api: unknown) {
    const hooks = api as HookApi;
    hooks.on("model_call_started", (event, context) => {
      const call = modelCallFromHook(event, context);
      if (call) noteModelCallStarted(call);
    });
    hooks.on("model_call_ended", (event, context) => {
      const call = modelCallFromHook(event, context);
      if (call) noteModelCallEnded(call.callId);
    });
    return {
      position: ({ sessionKey }: { sessionKey: string }) => readModelQueuePosition(sessionKey),
      lane: () => readModelLane(),
    };
  },
});
