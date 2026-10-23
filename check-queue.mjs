import assert from "node:assert/strict";
import { noteModelCallEnded, noteModelCallStarted, readModelLane, readModelQueuePosition, resetModelCalls } from "./dist/model-calls.js";
import { copyFor, formatPosition } from "./dist/i18n.js";

const mine = "agent:main:dashboard:aaaaaaaa-bbbb";
const other = "agent:main:dashboard:cccccccc-dddd";

resetModelCalls();
noteModelCallStarted({ callId: "a", sessionKey: other, at: 1_000 }, 1_000);
noteModelCallStarted({ callId: "b", sessionKey: mine, at: 1_100 }, 1_100);
noteModelCallStarted({ callId: "c", sessionKey: "agent:main:third", at: 1_200 }, 1_200);
noteModelCallStarted({ callId: "a", sessionKey: other, at: 1_300 }, 1_300);

const german = copyFor("de");
const english = copyFor("en");
assert.equal(copyFor("fr"), english);
assert.equal(readModelQueuePosition(other, 1_500).state, "running");
assert.equal(formatPosition(readModelQueuePosition(other, 1_500), german), "läuft");
assert.equal(formatPosition(readModelQueuePosition(mine, 1_500), german), "Platz 1 in Queue");
assert.equal(formatPosition(readModelQueuePosition("agent:main:third", 1_500), english), "Place 2 in queue");
assert.equal(readModelQueuePosition("agent:main:idle", 1_500).state, "idle");
assert.equal(formatPosition(readModelQueuePosition("agent:main:idle", 1_500), english), "");

noteModelCallEnded("a");
assert.equal(readModelQueuePosition(mine, 1_600).state, "running");
assert.equal(formatPosition(readModelQueuePosition("agent:main:third", 1_600), german), "Platz 1 in Queue");
assert.deepEqual(readModelLane(1_600).entries, [
  { state: "running", position: 0, label: "…aaa-bbbb" },
  { state: "queued", position: 1, label: "third" },
]);
assert.equal(readModelLane(1_600).active, 1);
assert.equal(readModelLane(1_600).waiting, 1);

console.log("queue position checks passed");
