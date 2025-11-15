import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const TOKEN = "7788304758:AAGYGSAhMNgwAAybqiHMmr5W2MUxntykbfE";
const bot = new TelegramBot(TOKEN);

// Handler pesan saat webhook menerima update
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  const file = msg.document || msg.photo?.pop() || msg.video;
  if (!file) {
    bot.sendMessage(chatId, "📌 Kirim file untuk diupload ke Catbox.moe");
    return;
  }

  try {
    const statusMsg = await bot.sendMessage(chatId, "📥 Download file...");

    const fileInfo = await bot.getFile(file.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${fileInfo.file_path}`;
    const fileName = path.basename(fileInfo.file_path);

    const buffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(fileName, buffer);

    await bot.editMessageText("⏳ Upload ke Catbox.moe...", {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(fileName));

    const upload = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    await bot.editMessageText(`✅ Selesai!\n🔗 ${upload.data}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    bot.sendMessage(chatId, "❌ Error: " + err.message);
  }
});

// Vercel API Endpoint
export default async function handler(req, res) {
  if (req.method === "POST") {
    await bot.processUpdate(req.body); // PENTING!
    return res.status(200).send("OK");
  }

  res.status(200).send("Bot aktif.");
}
