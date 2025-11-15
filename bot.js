import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { Telegraf } from "telegraf";

const TOKEN = "7788304758:AAGYGSAhMNgwAAybqiHMmr5W2MUxntykbfE";
const bot = new Telegraf(TOKEN);

bot.on("message", async (ctx) => {
  const msg = ctx.message;
  const file = msg.document || msg.photo?.pop() || msg.video;

  if (!file) {
    return ctx.reply("📌 Kirim file untuk diupload ke Catbox.moe");
  }

  try {
    const waitMsg = await ctx.reply("📥 Sedang download file dari Telegram...");

    const fileInfo = await ctx.telegram.getFile(file.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`;
    const fileName = path.basename(fileInfo.file_path);

    const buffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(fileName, buffer);

    await ctx.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, "⏳ Upload ke Catbox.moe...");

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(fileName));

    const upload = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
    });

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      null,
      `✅ Berhasil!\n🔗 ${upload.data}`
    );

  } catch (err) {
    ctx.reply("❌ Error: " + err.message);
  }
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    await bot.handleUpdate(req.body);
    return res.json({ ok: true });
  }
  res.status(200).send("Bot aktif.");
}