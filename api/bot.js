import axios from "axios";
import FormData from "form-data";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const update = req.body;

    try {
      // Pastikan ini pesan dengan foto
      if (update.message?.photo) {
        const chatId = update.message.chat.id;

        // Kirim pesan cepat (biar webhook tidak timeout)
        await axios.post(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: "📥 Sedang mengupload ke Catbox…"
        });

        // Ambil file_id resolusi terbesar
        const fileId = update.message.photo.at(-1).file_id;

        // Dapatkan link file Telegram
        const fileInfo = await axios.get(`https://api.telegram.org/bot${process.env.TOKEN}/getFile?file_id=${fileId}`);
        const filePath = fileInfo.data.result.file_path;

        // Download file dari Telegram
        const file = await axios({
          url: `https://api.telegram.org/file/bot${process.env.TOKEN}/${filePath}`,
          method: "GET",
          responseType: "arraybuffer"
        });

        // Upload ke Catbox
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", Buffer.from(file.data), "image.jpg");

        const catbox = await axios.post("https://catbox.moe/user/api.php", form, {
          headers: form.getHeaders()
        });

        // Kirim link hasil upload
        await axios.post(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: `✔ Selesai!\n${catbox.data}`
        });

      }

    } catch (err) {
      console.error(err);
    }

    // WAJIB — webhook harus selalu cepat selesai
    return res.status(200).send("OK");
  }

  res.status(200).send("Bot Running");
}
