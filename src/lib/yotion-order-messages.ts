import { db } from "./yotion-db";
import { escapeOrderHtml as esc } from "./yotion-order-progress";

type Message = { sender: string; message: string; sent_at: string };

export async function orderMessages(token: string | null, reference: string | null, message: string | null = null): Promise<Message[]> {
  const { data, error } = await db().rpc("yotion_order_messages", {
    p_token: token, p_reference: reference, p_message: message,
  });
  if (error) throw error;
  return data ?? [];
}

export function renderOrderMessages(messages: Message[], customerLabel: string) {
  const format = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });
  return messages.length ? `<ul class="order-messages">${messages.map(item =>
    `<li><strong>${item.sender === "yotion" ? "Yotion" : customerLabel}</strong> <time datetime="${esc(item.sent_at)}">${format.format(new Date(item.sent_at))}</time><p>${esc(item.message)}</p></li>`
  ).join("")}</ul>` : "<p>No messages yet.</p>";
}
