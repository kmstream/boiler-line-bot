import { middleware, Client } from "@line/bot-sdk";

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const client = new Client(config);

const questions = [
  {
    id: "boiler-0001",
    question: "理論空気量とは何を指す？",
    choices: [
      "完全燃焼に必要な最小の空気量",
      "実際に供給する空気量",
      "燃料の発熱量",
      "煙突のドラフト量"
    ],
    answer_index: 0,
    explain_slug: "boiler-0001-lean-air"
  }
];

export default async function handler(req, res) {
  const mw = middleware({ channelSecret: config.channelSecret });
  await new Promise((resolve, reject) =>
    mw(req, res, (err) => (err ? reject(err) : resolve()))
  );

  const events = req.body.events || [];
  await Promise.all(
    events.map(async (event) => {
      if (event.type === "message" && event.message.type === "text") {
        const q = questions[0];
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: `【ボイラー技士】\n${q.question}`,
          quickReply: {
            items: q.choices.map((c, i) => ({
              type: "action",
              action: {
                type: "postback",
                label: c,
                data: `a=${i}&qid=${q.id}`,
                displayText: c
              }
            }))
          }
        });
      }
    })
  );
  res.status(200).send("OK");
}
