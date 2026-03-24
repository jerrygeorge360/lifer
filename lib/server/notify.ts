interface NotifyTarget {
  email: string | null;
  telegramId: string | null;
}

export async function sendEmailAlert(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Lifer <alerts@lifer.local>",
      to,
      subject,
      html,
    }),
  });
}

export async function sendTelegramAlert(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function notifySubscribers(
  subscribers: NotifyTarget[],
  title: string,
  message: string,
): Promise<number> {
  let sent = 0;

  await Promise.all(
    subscribers.map(async (subscriber) => {
      if (subscriber.email) {
        await sendEmailAlert(subscriber.email, title, `<p>${message}</p>`);
        sent += 1;
      }
      if (subscriber.telegramId) {
        await sendTelegramAlert(subscriber.telegramId, `${title}\n\n${message}`);
        sent += 1;
      }
    }),
  );

  return sent;
}
