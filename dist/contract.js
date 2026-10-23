import { Type } from "typebox";
import { defineFeatureContract } from "openclaw/plugin-sdk/feature-contract";
const count = Type.Integer({ minimum: 0, maximum: 10_000 });
export const contract = defineFeatureContract({
    pluginId: "queue-position",
    operations: {
        position: {
            kind: "query",
            description: "Show whether one session's oldest open model request is being served or where it waits.",
            input: Type.Object({ sessionKey: Type.String({ maxLength: 512 }) }, { additionalProperties: false }),
            output: Type.Object({
                available: Type.Boolean(),
                state: Type.Union([Type.Literal("idle"), Type.Literal("queued"), Type.Literal("running")]),
                position: count,
            }, { additionalProperties: false }),
        },
        lane: {
            kind: "query",
            description: "List open model requests in arrival order. The first one is treated as being served.",
            input: Type.Object({}, { additionalProperties: false }),
            output: Type.Object({
                available: Type.Boolean(),
                active: count,
                waiting: count,
                truncated: Type.Boolean(),
                entries: Type.Array(Type.Object({
                    state: Type.Union([Type.Literal("running"), Type.Literal("queued")]),
                    position: count,
                    label: Type.String({ maxLength: 80 }),
                }, { additionalProperties: false }), { maxItems: 40 }),
            }, { additionalProperties: false }),
        },
    },
    events: {},
});
