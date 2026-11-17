import express from "express";
import { Bot } from "grammy";

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const PORT = process.env.PORT || 3000;

if (!TOKEN) throw new Error("BOT_TOKEN is missing");

const bot = new Bot(TOKEN);
const app = express();

let product = null;
let starPrice = 10;

app.get("/", (req, res) => {
  res.send("Shanto Premium Media Bot is running");
});

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Welcome to Shanto Premium Media!\n\n" +
    "Paid media কিনতে /buy লিখুন।"
  );
});

bot.command("myid", async (ctx) => {
  await ctx.reply(`Your Telegram ID: ${ctx.from.id}`);
});

bot.command("price", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const value = Number(ctx.match);

  if (!Number.isInteger(value) || value < 1 || value > 25000) {
    return ctx.reply("ব্যবহার করুন: /price 25");
  }

  starPrice = value;
  await ctx.reply(`নতুন দাম: ${starPrice} Stars`);
});

bot.on(["message:photo", "message:video"], async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const msg = ctx.message;

  if (msg.photo) {
    const photo = msg.photo[msg.photo.length - 1];
    product = { type: "photo", fileId: photo.file_id };
  } else {
    product = { type: "video", fileId: msg.video.file_id };
  }

  product.caption = msg.caption || "Shanto Premium Media";

  await ctx.reply(
    "Paid media সংরক্ষণ হয়েছে!\n" +
    `দাম: ${starPrice} Stars\n` +
    "কাস্টমার /buy লিখে কিনতে পারবে।"
  );
});

bot.command("buy", async (ctx) => {
  if (!product) {
    return ctx.reply("এখনো কোনো ছবি বা ভিডিও আপলোড করা হয়নি।");
  }

  const media = [{
    type: product.type,
    media: product.fileId
  }];

  try {
    await ctx.api.sendPaidMedia(
      ctx.chat.id,
      starPrice,
      media,
      {
        caption: product.caption,
        protect_content: true
      }
    );
  } catch (error) {
    console.error(error);
    await ctx.reply("পেমেন্ট মিডিয়া পাঠানো যায়নি। পরে আবার চেষ্টা করুন।");
  }
});

bot.catch((err) => console.error("Bot error:", err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

bot.start();
