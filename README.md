# Queue Position

Zeigt in der Control UI, ob die offene Modellanfrage einer Session bedient wird oder welchen Platz sie in der Ankunftsreihenfolge hat.

Das Plugin zählt `model_call_started` und `model_call_ended`. Die älteste noch offene Anfrage gilt als bedient und zeigt **läuft**. Jede spätere Anfrage zeigt **Platz 1 in Queue**, **Platz 2 in Queue** und so weiter. Der laufende Request zählt nicht als Queue-Platz. Anfragen, die noch nicht abgeschickt wurden, fehlen in der Liste.

Deutsch erscheint, wenn die Control UI auf Deutsch steht. Jede andere Sprache fällt auf Englisch zurück. Die Statuszeile im Chat wird nur ergänzt. Dauer und Ausgabetokens bleiben die Anzeige von OpenClaw. Die Seite **Warteschlange** listet die offenen Anfragen.

## Voraussetzung

Ein lokales Modell, das Anfragen in Eingangsreihenfolge abarbeitet und nur eine gleichzeitig bedient. Das Plugin hält Requests nicht an und liest `agents.defaults.maxConcurrent` nicht.

## Bauen und installieren

```sh
npm install
npm run build
npm run validate
openclaw plugins install --link .
```

Für die Anzeige in der Control UI muss `gateway.controlUi.experimental.customPlugins` auf `true` stehen. Danach den Browser-Tab neu laden.

Nach Änderungen am Backend: neu bauen und `openclaw plugins reload queue-position --wait`. Nach reinen UI-Änderungen genügt `openclaw gateway call plugins.controlUi.reload --json --params '{"pluginId":"queue-position"}'`.
