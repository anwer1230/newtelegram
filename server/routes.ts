import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram";
import input from "input";

// Default configuration for the bot
const API_ID = 22043994;
const API_HASH = '56f64582b363d367280db96586b97801';

// Global state for Telegram
let client: TelegramClient | null = null;
let senderInterval: NodeJS.Timeout | null = null;
let isSenderRunning = false;
let isMonitorRunning = false;

const KEYWORDS = [
  "اريد مساعدة", "ابي مساعدة", "من يسوي تكليف", "من يحل", "عندي بحث", "معي واجب",
  "عندي اسايمنت", "من يسوي اسايمنت", "ابي سكليف", "ابي عذر", "من يسوي سكليف",
  "ابي شخص مضمون", "ابي مختص", "هيليب", "من يستطيع", "تعرفون احد", "تعرفون شخص",
  "من يساعدني", "من يعرف مختص", "مين يعرف يحل واجب", "من يحل واجبات الجامعه",
  "أحتاج مساعدتكم", "ابي احد يسوي بحث", "عندي بحث", "مين يعرف مختص", "من يعرف احد كويس"
];

const MESSAGE_TEXT = `
📚 السلام عليكم 
للخدمات الطلابيه المتكامله
💞من خدمتنا💞
✅بحوث جامعية(عربي ✅+إنجليزي)
✅ رسائل ماجستير 
✅ اعذار طبيه صحتي ورقي pdf
✅واجبات وأنشطة
✅عروض باوربوينت power point
✅تقارير وتكاليف 
✅ *حل كويزات /ميد/فاينل* 
✅ محاسبة + ادارة أعمال
✅ حاسوب + برمجة 
✅ مشاريع تخرج Project 
✅تلخيص محاضرات
✅تصميم سيره ذاتيه احترافيه 
✅تصاميم بوستر وبروشور
✅كتابه تقارير تدريب
اسعار مناسبه للجميع
↩️للتواصل واتس اب
https://wa.me/+966562570935
`;

async function initTelegramClient() {
  const sessionData = await storage.getSession();
  const session = new StringSession(sessionData?.sessionString || "");
  
  client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  if (sessionData?.sessionString) {
    try {
      await client.connect();
      if (await client.checkAuthorization()) {
         console.log("Telegram connected with existing session.");
      } else {
         console.log("Telegram session expired or invalid.");
      }
    } catch (err) {
      console.error("Failed to connect with existing session", err);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize Telegram client globally
  initTelegramClient().catch(console.error);

  // Groups
  app.get(api.groups.list.path, async (req, res) => {
    const groups = await storage.getGroups();
    res.json(groups);
  });

  app.post(api.groups.create.path, async (req, res) => {
    try {
      const data = api.groups.create.input.parse(req.body);
      const group = await storage.createGroup(data);
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.delete(api.groups.delete.path, async (req, res) => {
    try {
      await storage.deleteGroup(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Telegram Login Flow
  let phoneCodePromiseResolver: ((code: string) => void) | null = null;
  let passwordPromiseResolver: ((password: string) => void) | null = null;

  app.post(api.telegram.login.path, async (req, res) => {
    try {
      const { phoneNumber } = api.telegram.login.input.parse(req.body);
      
      if (!client) {
        const session = new StringSession("");
        client = new TelegramClient(session, API_ID, API_HASH, { connectionRetries: 5 });
      }

      await client.connect();

      // Start the login process in background, we'll feed it the code when we get it
      client.start({
        phoneNumber: async () => phoneNumber,
        password: async () => {
          return new Promise<string>((resolve) => {
            passwordPromiseResolver = resolve;
          });
        },
        phoneCode: async () => {
          return new Promise<string>((resolve) => {
            phoneCodePromiseResolver = resolve;
          });
        },
        onError: (err) => console.log("Telegram Login Error:", err),
      }).then(async () => {
        console.log("You should now be connected.");
        if (client) {
          const sessionString = client.session.save() as unknown as string;
          await storage.saveSession(sessionString);
        }
      }).catch(err => {
        console.error("Login flow error:", err);
      });

      // Telegram doesn't give us a phoneCodeHash synchronously like mtproto, 
      // but we wait a little bit to see if we can trigger the code request.
      res.status(200).json({ message: "Code requested. Please verify.", phoneCodeHash: "dummy" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to initiate login" });
    }
  });

  app.post(api.telegram.verifyCode.path, async (req, res) => {
    try {
      const { code } = api.telegram.verifyCode.input.parse(req.body);
      if (phoneCodePromiseResolver) {
        phoneCodePromiseResolver(code);
        phoneCodePromiseResolver = null;
      }
      
      // We don't know instantly if it needs password or if it's successful, 
      // ideally we'd wait for a promise. For simplicity, we just assume it's verifying.
      // Wait a moment to let the start() promise resolve or ask for password
      await new Promise(r => setTimeout(r, 2000));
      
      let isAuth = false;
      if (client) {
        isAuth = await client.checkAuthorization();
      }

      if (isAuth) {
        const sessionString = client!.session.save() as unknown as string;
        await storage.saveSession(sessionString);
        res.status(200).json({ message: "Login successful!" });
      } else {
        // Assume it needs password if not auth yet
        res.status(200).json({ message: "Code received. Might need password.", needsPassword: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  app.post(api.telegram.verifyPassword.path, async (req, res) => {
    try {
      const { password } = api.telegram.verifyPassword.input.parse(req.body);
      if (passwordPromiseResolver) {
        passwordPromiseResolver(password);
        passwordPromiseResolver = null;
      }

      await new Promise(r => setTimeout(r, 2000));
      
      if (client && await client.checkAuthorization()) {
        const sessionString = client.session.save() as unknown as string;
        await storage.saveSession(sessionString);
        res.status(200).json({ message: "Login successful!" });
      } else {
        res.status(400).json({ message: "Invalid password or login failed" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  app.get(api.telegram.status.path, async (req, res) => {
    let isLoggedIn = false;
    if (client) {
      try {
        isLoggedIn = await client.checkAuthorization();
      } catch (e) {
        isLoggedIn = false;
      }
    }
    res.json({
      isLoggedIn,
      isSenderRunning,
      isMonitorRunning
    });
  });

  // Sending Logic
  async function sendScheduledMessage() {
    if (!client || !isSenderRunning) return;
    try {
      console.log("بدء الإرسال المجدول...");
      await client.sendMessage("me", { message: `⏰ بدء الإرسال المجدول الساعة ${new Date().toLocaleString()}` });

      const dbGroups = await storage.getGroups();
      const allUrls = dbGroups.map(g => g.url);
      
      for (const groupLink of allUrls) {
        if (!isSenderRunning) break;
        try {
          // Handle different types of links
          let entityToMessage: string | Api.TypeEntityLike = groupLink;
          if (groupLink.startsWith('https://t.me/+')) {
             // Invite link handling - might need join logic or different approach in gramjs
             console.log("Skipping private invite link for now", groupLink);
             continue;
          } else if (groupLink.startsWith('https://t.me/')) {
             entityToMessage = groupLink.replace('https://t.me/', '');
          }
          
          await client.sendMessage(entityToMessage, { message: MESSAGE_TEXT });
          console.log(`تم الإرسال إلى: ${groupLink}`);
          await new Promise(r => setTimeout(r, 2000));
        } catch (e: any) {
          console.error(`فشل الإرسال إلى ${groupLink}:`, e?.message);
          await client.sendMessage("me", { message: `⚠️ خطأ في الإرسال إلى ${groupLink}\n${e?.message}` });
        }
      }
      
      console.log("انتهى الإرسال المجدول.");
      await client.sendMessage("me", { message: `✅ تم الانتهاء من الإرسال المجدول الساعة ${new Date().toLocaleString()}` });
    } catch (e) {
      console.error("Error in scheduled message loop:", e);
    }
  }

  app.post(api.telegram.sender.path, async (req, res) => {
    try {
      const { action } = api.telegram.sender.input.parse(req.body);
      
      if (action === "start") {
        if (isSenderRunning) {
          return res.json({ message: "Sender already running" });
        }
        isSenderRunning = true;
        
        // Initial run
        sendScheduledMessage();
        
        // Schedule every 450 seconds (7.5 mins)
        senderInterval = setInterval(sendScheduledMessage, 450 * 1000);
        res.json({ message: "Started scheduled sender" });
      } else {
        isSenderRunning = false;
        if (senderInterval) {
          clearInterval(senderInterval);
          senderInterval = null;
        }
        res.json({ message: "Stopped scheduled sender" });
      }
    } catch (err) {
      res.status(500).json({ message: "Error toggling sender" });
    }
  });

  // Monitoring Logic
  const messageHandler = async (event: any) => {
    if (!isMonitorRunning || !client) return;

    const message = event.message;
    if (message.out) return; // Ignore outgoing

    const messageText = message.message;
    if (!messageText) return;

    const lowerText = messageText.toLowerCase();
    const matchedKeywords = KEYWORDS.filter(kw => lowerText.includes(kw));

    if (matchedKeywords.length > 0) {
      try {
        const sender = await message.getSender();
        const chat = await message.getChat();
        
        const senderName = sender?.firstName || sender?.username || "غير معروف";
        const chatTitle = chat?.title || "محادثة خاصة";
        
        let chatLink = "رابط خاص (غير متاح)";
        if (chat?.username) {
          chatLink = `https://t.me/${chat.username}`;
        }

        const msgTime = new Date(message.date * 1000).toLocaleString();
        const keywordsFound = matchedKeywords.join("، ");

        const notification = `🔔 رسالة مراقبة جديدة\n` +
          `🕒 الوقت: ${msgTime}\n` +
          `👤 المرسل: ${senderName} (ID: ${sender?.id})\n` +
          `💬 المجموعة: ${chatTitle}\n` +
          `🔗 رابط المجموعة: ${chatLink}\n` +
          `📝 الكلمات المفتاحية: ${keywordsFound}\n` +
          `📨 نص الرسالة:\n${messageText}\n` +
          `${'-'.repeat(40)}`;

        await client.sendMessage("me", { message: notification });
        console.log(`تم إرسال إشعار عن رسالة من ${senderName} في ${chatTitle}`);
      } catch (err) {
        console.error("Error handling monitored message:", err);
      }
    }
  };

  app.post(api.telegram.monitor.path, async (req, res) => {
    try {
      const { action } = api.telegram.monitor.input.parse(req.body);
      
      if (!client) {
         return res.status(400).json({ message: "Not logged in" });
      }

      if (action === "start") {
        if (isMonitorRunning) {
          return res.json({ message: "Monitor already running" });
        }
        isMonitorRunning = true;
        client.addEventHandler(messageHandler, new Api.events.NewMessage({ incoming: true }));
        res.json({ message: "Started monitor" });
      } else {
        isMonitorRunning = false;
        client.removeEventHandler(messageHandler, new Api.events.NewMessage({ incoming: true }));
        res.json({ message: "Stopped monitor" });
      }
    } catch (err) {
      res.status(500).json({ message: "Error toggling monitor" });
    }
  });

  // Seed DB with the default groups
  const existingGroups = await storage.getGroups();
  if (existingGroups.length === 0) {
    const defaultUrls = [
      "https://t.me/amdd757hh", "https://t.me/M805029", "https://t.me/hhhhhhjfj", "https://t.me/RiyadhVIP1",
      "https://t.me/OspGDP", "https://t.me/ACC1003", "https://t.me/KSUMRK7", "https://t.me/grouplaw",
      "https://t.me/makkah_24h", "https://t.me/logisticsacademy", "https://t.me/smallbusinessclub1",
      "https://t.me/sdgghjklv", "https://t.me/GDP_NHC", "https://t.me/GardenView14", "https://t.me/maaden0",
      "https://t.me/akadim", "https://t.me/httpsLjsIIb3S3nIwMzVk", "https://t.me/TWwWjww", "https://t.me/+7j-xqCFEiYE5NTc0",
      "https://t.me/ab12342030", "https://t.me/AOUSAUDI", "https://t.me/almahdia35", "https://t.me/bdydbeu",
      "https://t.me/biostatisticia", "https://t.me/bsfmisk", "https://t.me/DigitalSAMAA", "https://t.me/F_8_T2",
      "https://t.me/groupIAU", "https://t.me/iatccollge", "https://t.me/jazanh12", "https://t.me/KearneyMiddleEast",
      "https://t.me/kingsauduniversityalolia", "https://t.me/kormataifuni", "https://t.me/ksucpy", "https://t.me/Maths_genius2",
      "https://t.me/MonffizAcademy", "https://t.me/mtager545", "https://t.me/nahdileadership", "https://t.me/NarcoticscontroL1",
      "https://t.me/qbaqassim", "https://t.me/QiddiyaGDP", "https://t.me/salla_pool", "https://t.me/Sazdfjf536",
      "https://t.me/sho2200", "https://t.me/skdjfu", "https://t.me/sultanu1999", "https://t.me/tabuk_2022",
      "https://t.me/tahakom112", "https://t.me/Taif64", "https://t.me/tajned1445", "https://t.me/Takamol_GDP",
      "https://t.me/Tu_English2", "https://t.me/universty_taif11", "https://t.me/YouthGrowthProgramYGP",
      "https://t.me/nahdileadershipprogram", "https://t.me/KFUPMDS20", "https://t.me/kaptin0", "https://t.me/evolve1"
    ];
    for (const url of defaultUrls) {
      await storage.createGroup({ url });
    }
  }

  return httpServer;
}
