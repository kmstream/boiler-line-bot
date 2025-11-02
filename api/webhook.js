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

function pick() {
  return questions[Math.floor(Math.random() * questions.length)];
}

export default async function handler(req, res) {
  // LINE署名検証
  const mw = middleware({ channelSecret: config.channelSecret });
  await new Promise((resolve, reject) =>
    mw(req, res, (err) => (err ? reject(err) : resolve()))
  );

  const events = req.body.events || [];
  await Promise.all(
    events.map(async (event) => {
      if (
        event.type === "message" &&
        event.message.type === "text" ||
        event.type === "follow"
      ) {
        const q = pick();
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
      if (event.type === "postback") {
        const data = Object.fromEntries(
          new URLSearchParams(event.postback.data)
        );
        const q = questions.find((x) => x.id === data.qid);
        const ok = Number(data.a) === q.answer_index;
        const url = `https://your-domain.com/explain/${q.explain_slug}/?utm_source=line_bot&utm_medium=msg&utm_campaign=boiler&quiz=${q.id}`;
        return client.replyMessage(event.replyToken, [
          {
            type: "text",
            text: ok
              ? "✅ 正解！"
              : `❌ 不正解… 正解は「${q.choices[q.answer_index]}」`
          },
          {
            type: "template",
            altText: "解説を見る",
            template: {
              type: "buttons",
              title: "解説と教材",
              text: "詳しい解説はこちら",
              actions: [{ type: "uri", label: "解説ページへ", uri: url }]
            }
          }
        ]);
      }
    })
  );
  res.status(200).send("OK");
}
