require("dotenv").config();
const { Bot, InlineKeyboard, session } = require("grammy");
const templates = require("./templates");
const { renderCard, makeText } = require("./render");

const token = process.env.BOT_TOKEN;
const admins = (process.env.ADMIN_IDS || "").split(",").map(x => x.trim()).filter(Boolean);
const channelId = process.env.CHANNEL_ID;
const studioName = process.env.STUDIO_NAME || "UKIYO STUDIO";

if (!token || token.includes("PASTE_")) {
  console.error("Set BOT_TOKEN in .env before starting the bot.");
  process.exit(1);
}

const bot = new Bot(token);
bot.use(session({ initial: () => ({ step: null, data: {} }) }));

const isAdmin = ctx => admins.includes(String(ctx.from?.id));
const homeKeyboard = () => new InlineKeyboard()
  .text("✦ Создать публикацию", "create").row()
  .text("ℹ️ Как пользоваться", "help");

function templateKeyboard() {
  const kb = new InlineKeyboard();
  for (const [key, t] of Object.entries(templates)) kb.text(t.label, `tpl:${key}`).row();
  kb.text("↩️ В меню", "home");
  return kb;
}

function formatKeyboard() {
  return new InlineKeyboard()
    .text("🖼 Карточка", "format:image")
    .text("Aa Текст", "format:text").row()
    .text("↩️ Назад", "create");
}

function previewKeyboard() {
  return new InlineKeyboard()
    .text("📤 Опубликовать", "publish").row()
    .text("✏️ Изменить заголовок", "edit:title")
    .text("✏️ Изменить текст", "edit:body").row()
    .text("🔄 Начать заново", "create")
    .text("🏠 Меню", "home");
}

async function guard(ctx) {
  if (!isAdmin(ctx)) {
    await ctx.reply("🔒 Этот бот доступен только администраторам UKIYO Studio.");
    return false;
  }
  return true;
}

bot.command("start", async ctx => {
  if (!(await guard(ctx))) return;
  ctx.session = { step: null, data: {} };
  await ctx.reply(
    `⌗ <b>${studioName}</b>\n\nДобро пожаловать в UKIYO DESIGN BOT.\nСоздавай ретро-публикации, проверяй предпросмотр и отправляй их в канал.`,
    { parse_mode: "HTML", reply_markup: homeKeyboard() }
  );
});

bot.command("id", async ctx => {
  await ctx.reply(`Ваш Telegram ID: <code>${ctx.from.id}</code>`, { parse_mode: "HTML" });
});

bot.callbackQuery("help", async ctx => {
  if (!(await guard(ctx))) return;
  await ctx.answerCallbackQuery();
  await ctx.reply("Выбери «Создать публикацию», затем категорию, формат, заголовок и текст. Перед публикацией бот покажет предпросмотр. Для отправки в канал добавь бота администратором с правом публикации.");
});

bot.callbackQuery("home", async ctx => {
  if (!(await guard(ctx))) return;
  await ctx.answerCallbackQuery();
  ctx.session = { step: null, data: {} };
  await ctx.reply("⌗ <b>UKIYO DESIGN BOT</b>\n\nГлавное меню:", {
    parse_mode: "HTML", reply_markup: homeKeyboard()
  });
});

bot.callbackQuery("create", async ctx => {
  if (!(await guard(ctx))) return;
  await ctx.answerCallbackQuery();
  ctx.session = { step: "template", data: {} };
  await ctx.reply("Выбери тип публикации:", { reply_markup: templateKeyboard() });
});

bot.callbackQuery(/^tpl:(.+)$/, async ctx => {
  if (!(await guard(ctx))) return;
  await ctx.answerCallbackQuery();
  const key = ctx.match[1];
  if (!templates[key]) return;
  ctx.session.data.templateKey = key;
  ctx.session.step = "format";
  await ctx.editMessageText("Выбери формат публикации:", { reply_markup: formatKeyboard() });
});

bot.callbackQuery(/^format:(image|text)$/, async ctx => {
  if (!(await guard(ctx))) return;
  await ctx.answerCallbackQuery();
  ctx.session.data.format = ctx.match[1];
  ctx.session.step = "title";
  const t = templates[ctx.session.data.templateKey];
  ctx.session.data.title = t.headline;
  ctx.session.data.body = t.body;
  await ctx.reply(`Отправь заголовок.\n\nШаблон по умолчанию: ${t.headline}\n\nЧтобы оставить его, отправь точку ".".`);
});

bot.callbackQuery(/^edit:(title|body)$/, async ctx => {
  if (!(await guard(ctx))) return;
  await ctx.answerCallbackQuery();
  ctx.session.step = ctx.match[1];
  await ctx.reply(ctx.match[1] === "title" ? "Отправь новый заголовок:" : "Отправь новый текст публикации:");
});

bot.on("message:text", async ctx => {
  if (!(await guard(ctx))) return;
  const step = ctx.session.step;
  const value = ctx.message.text.trim();
  if (!step) return;
  if (step === "title") {
    if (value !== ".") ctx.session.data.title = value;
    ctx.session.step = "body";
    await ctx.reply("Теперь отправь основной текст публикации. Чтобы оставить текст шаблона, отправь точку \".\".");
    return;
  }
  if (step === "body") {
    if (value !== ".") ctx.session.data.body = value;
    ctx.session.step = null;
    await showPreview(ctx);
    return;
  }
});

async function showPreview(ctx) {
  const d = ctx.session.data;
  const template = templates[d.templateKey];
  if (d.format === "image") {
    const image = await renderCard({ title: d.title, body: d.body, template, studioName });
    await ctx.replyWithPhoto(new (require("grammy").InputFile)(image, "ukiyo-preview.png"), {
      caption: `Предпросмотр · ${template.label}`,
      reply_markup: previewKeyboard()
    });
  } else {
    await ctx.reply(makeText({ title: d.title, body: d.body, template, studioName }), {
      parse_mode: "HTML",
      reply_markup: previewKeyboard()
    });
  }
}

bot.callbackQuery("publish", async ctx => {
  if (!(await guard(ctx))) return;
  await ctx.answerCallbackQuery();
  if (!channelId || channelId.includes("YOUR_CHANNEL")) {
    await ctx.reply("Сначала укажи CHANNEL_ID в .env и перезапусти бота.");
    return;
  }
  const d = ctx.session.data;
  if (!d.templateKey || !d.format) {
    await ctx.reply("Сессия публикации не найдена. Начни заново через /start.");
    return;
  }
  const template = templates[d.templateKey];
  try {
    if (d.format === "image") {
      const image = await renderCard({ title: d.title, body: d.body, template, studioName });
      await bot.api.sendPhoto(channelId, new (require("grammy").InputFile)(image, "ukiyo-post.png"));
    } else {
      await bot.api.sendMessage(channelId, makeText({ title: d.title, body: d.body, template, studioName }), { parse_mode: "HTML" });
    }
    await ctx.reply("✅ Публикация отправлена в канал UKIYO Studio.");
  } catch (err) {
    console.error(err);
    await ctx.reply("Не удалось опубликовать. Проверь CHANNEL_ID и права администратора бота в канале.");
  }
});

bot.catch(err => console.error("Bot error:", err));
bot.start();
console.log("UKIYO DESIGN BOT is running.");
