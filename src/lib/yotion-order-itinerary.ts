import { db } from "./yotion-db";

export const itinerarySteps = {
  prepare: { title: "Prepare your website", owner: "yotion", help: "We’ll build the site using the details you submitted." },
  review: { title: "Review your website", owner: "customer", help: "Check the website and tell us if anything needs changing." },
  launch: { title: "Connect your domain and launch", owner: "yotion", help: "We’ll connect your domain and launch once you approve the site." },
} as const;

export const taskStatus = { upcoming: "Upcoming", active: "In progress", blocked: "Blocked", complete: "Complete" } as const;
export const taskOwner = { yotion: "Yotion", customer: "You" } as const;
export type Step = keyof typeof itinerarySteps;
export type TaskStatus = keyof typeof taskStatus;

type TaskUpdate = {
  id: number;
  task: Step;
  status: TaskStatus;
  owner: keyof typeof taskOwner;
  due_at: string | null;
  note: string;
  created_at: string;
};

export async function readItinerary(token: string | null, reference: string | null) {
  const { data, error } = await db().rpc("yotion_read_order_itinerary", { p_token: token, p_reference: reference });
  if (error || !data) throw error ?? new Error("Order itinerary unavailable");
  return data as { paid_at: string; submitted_at: string; tasks: TaskUpdate[]; updates: TaskUpdate[] };
}

export function itineraryTasks(saved: TaskUpdate[], previousStatus: unknown) {
  const defaults: Record<Step, TaskStatus> = {
    prepare: previousStatus === "review" ? "complete" : previousStatus === "preparing" ? "active" : "upcoming",
    review: previousStatus === "review" ? "active" : "upcoming",
    launch: "upcoming",
  };
  return (Object.keys(itinerarySteps) as Step[]).map(task => {
    const step = itinerarySteps[task];
    const stored = saved.find(item => item.task === task);
    return { task, title: step.title, help: step.help, owner: stored?.owner ?? step.owner,
      status: stored?.status ?? defaults[task], due_at: stored?.due_at ?? null,
      note: stored?.note ?? "", updated_at: stored?.created_at ?? null };
  });
}

const ukDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });
export const orderDateTime = (timestamp: string) => ukDate.format(new Date(timestamp)) + " UK time";
export function plannedDateTime(timestamp: string) {
  // Scheduled times are entered and stored as UK wall-clock times.
  const [date, time] = timestamp.split("T");
  const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
  return `${day} at ${time.slice(0, 5)} UK time`;
}
