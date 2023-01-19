import cfonts from "cfonts"
import qrcode from "qrcode"
import NodeCache from "node-cache"

import * as callHandler from "./handlers/call"
import * as groupHandler from "./handlers/group"
import * as groupParticipantHandler from "./handlers/group-participant"
import * as messageHandler from "./handlers/message"

import WAClient from "./libs/whatsapp"
import Database from "./libs/database"
import { serialize } from "./libs/whatsapp"
import { i18nInit } from "./libs/international"

import { resetUserLimit, resetUserRole } from "./utils/cron"

import express from 'express';



/** Initial Client */
const aruga = new WAClient({
  // auth type "single" or "multi"
  authType: "single",
  // baileys options
  generateHighQualityLinkPreview: true,
  mediaCache: new NodeCache({
    stdTTL: 60 * 5, // 5 mins
    useClones: false
  }),
  syncFullHistory: true,
  userDevicesCache: new NodeCache({
    stdTTL: 60 * 10, // 10 mins
    useClones: false
  })
})

/** Handler Event */
setTimeout(() => {
  // handle call event
  aruga.on("call", (call) =>
    serialize
      .call(aruga, call)
      .then((call) => callHandler.execute(aruga, call).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle group event
  aruga.on("group", (message) =>
    serialize
      .group(aruga, message)
      .then((message) => groupHandler.execute(aruga, message).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle group participants event
  aruga.on("group.participant", (message) =>
    serialize
      .groupParticipant(aruga, message)
      .then((message) => groupParticipantHandler.execute(aruga, message).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle message event
  aruga.on("message", (message) =>
    serialize
      .message(aruga, message)
      .then((message) => messageHandler.execute(aruga, message).catch(() => void 0))
      .catch(() => void 0)
  )

  // handle qr code event
  aruga.on("qr", (qrCode) =>
    qrcode
      .toString(qrCode, { type: "terminal", small: true })
      .then((qrResult) => console.log(qrResult))
      .catch(() => void 0)
  )
}, 0)

/** Pretty Sexy :D */
const clearProcess = () => {
  aruga.log("Clear all process", "info")
  resetUserLimit.stop()
  resetUserRole.stop()
  Database.$disconnect()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, clearProcess)

/** Start Client */
setImmediate(async () => {
  try {
    // initialize
    await aruga.startClient()
    process.nextTick(
      () =>
        messageHandler
          .registerCommand("commands")
          .then((size) => aruga.log(`Success Register ${size} commands`))
          .catch(() => void 0),
      i18nInit()
    )

    // logs <3
    cfonts.say("Whatsapp Bot", {
      align: "center",
      colors: ["#8cf57b" as HexColor],
      font: "block",
      space: false
    })
    cfonts.say("By @gmprestes =)", {
      align: "center",
      font: "console",
      gradient: ["red", "#ee82f8" as HexColor]
    })
  } catch (err: unknown) {
    console.error(err)
    clearProcess()
  }
})

const port = process.env.NODE_PORT || 3000;
const app = express();
const router = express.Router();

router.get('/ping', async (req, res) => {
  res.end('OK');
});

router.get('/message/:message', async (req, res) => {
  let msg = (await aruga.sendMessage('555198438917@s.whatsapp.net', { text: req.params.message }));
  res.end('OK --> ' + req.params.message);
});

router.get('/list/:message', async (req, res) => {

  // send a list message!
  const sections = [
    {
      title: "Section 1",
      rows: [
        { title: "Option 1", rowId: "option1" },
        { title: "Option 2", rowId: "option2", description: "This is a description" }
      ]
    },
    {
      title: "Section 2",
      rows: [
        { title: "Option 3", rowId: "option3" },
        { title: "Option 4", rowId: "option4", description: "This is a description V2" }
      ]
    },
  ]

  const listMessage = {
    text: "This is a list",
    footer: "nice footer, link: https://google.com",
    title: "Amazing boldfaced list title",
    buttonText: "Required, text on the button to view the list",
    sections
  }


  let msg = (await aruga.sendMessage('555198438917@s.whatsapp.net', listMessage));
  res.end('OK --> ' + req.params.message);
});

router.get('/button/:message', async (req, res) => {

  const templateButtons = [
    { index: 1, urlButton: { displayText: '⭐ Diga que me ama!', url: 'https://github.com/adiwajshing/Baileys' } },
    { index: 2, callButton: { displayText: 'me ligue!', phoneNumber: '+55 (51) 99890 4515' } },
    { index: 3, quickReplyButton: { displayText: 'Resposta como botão!', id: 'id-like-buttons-message' } },
  ]

  const buttonMessage = {
    text: req.params.message ?? "Acesse esse menu",
    footer: 'gmprestes',
    templateButtons: templateButtons,
    //image: { url: 'https://example.com/image.jpeg' }
  }


  let msg = (await aruga.sendMessage('555198438917@s.whatsapp.net', buttonMessage));
  res.end('OK --> ' + req.params.message);
});

app.use(express.json());
app.use('/api', router);
app.listen(port, () => {
  cfonts.say(`Message API listen on port ${port}`, {
    align: "center",
    font: "console",
    gradient: ["red", "#ee82f8" as HexColor]
  })
});
