// Main script. Fetch, build, send, mark
import { createHash } from "node:crypto";
import { buildMail, type DueRow } from "./template.ts";

const force = process.argv.includes("--force");
// Use: node scripts/notify/sendNotifications.ts --force
// To force run a notification before 7 AM
const dryRun = process.argv.includes("--dry-run");

// Fetch credentials
process.loadEnvFile(".env");

// Imported here, after loadEnvFile: the admin client reads the keys when it is imported
const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

// Read the settings from env
const ResendAPI = process.env.RESEND_API_KEY;
const notifyFrom = process.env.NOTIFY_FROM;

const appUrl = process.env.APP_URL;

if (!appUrl) {
  console.error("Missing APP_URL");
  process.exit(1);
}

if (!notifyFrom) {
  console.error("Missing NOTIFY_FROM");
  process.exit(1);
}

// Check if it is 07 or later in Sweden?
// The workflow runs at 05:07 and 06:07 UTC. Only one of them is 07 in Sweden (summer/winter time).
// Exit code 0 = green run in GitHub: being too early is not an error.

const hour = Number(
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "numeric",
  }).format(new Date()),
);

if (hour < 7 && !force) {
  console.log(`Too early in Sweden (hour ${hour}), nothing is sent`);
  process.exit(0);
}

// Fetch who is due today
// due_notifications() decides everything: frequency, Friday, not mailed today, active, confirmed e-mail, something new.
// The script never has to check those itself.

// Find due dates for today
const { data, error } = await supabaseAdmin.rpc("due_notifications");

// If something goes wrong
if (error) {
  console.error(
    "Could not fetch due_notifications from Supabase:",
    error.message,
  );
  process.exit(1); // Exit code 1 makes the workflow run fail (red) in GitHub
}

const rows = (data ?? []) as DueRow[];

// Build one mail per user
const mails = rows.map((row) => {
  const { subject, html, text } = buildMail(row, appUrl);

  return {
    userId: row.user_id,
    windowEnd: row.window_end, // Time for last_notified_at
    payload: {
      from: notifyFrom,
      to: [row.email], // Resend wants an array, even for one recipient
      subject,
      html,
      text,
      headers: { "List-Unsubscribe": `<${appUrl}/settings>` },
    },
  };
});

// Dry run = print and stop
if (dryRun) {
  for (const m of mails) {
    console.log("To:", m.payload.to.join(", "));
    console.log("Subject:", m.payload.subject);
    console.log(m.payload.text);
    console.log("----------------------");
  }

  console.log(
    `Dry run: ${mails.length} mails built, nothing sent, nothing marked`,
  );
  process.exit(0);
}

// Send in batches of 100 mails
if (!ResendAPI) {
  console.error("Could not fetch Resend API key.");
  process.exit(1);
}

let sent = 0;
let failed = 0;

// Today's date in Sweden: a new key every day
const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
}).format(new Date());

for (let i = 0; i < mails.length; i += 100) {
  const batch = mails.slice(i, i + 100);

  // The same day + the same users = the same key = Resend does not send again
  const userIds = batch.map((m) => m.userId);
  const idempotencyKey =
    `notify-${today}-` +
    createHash("sha256").update(userIds.join(",")).digest("hex");

  // Send
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ResendAPI}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(batch.map((m) => m.payload)),
  });

  // The batch is all-or-nothing: one invalid address rejects the whole batch.
  // On a validation error, send this batch one by one so only the bad mail fails.
  if (response.status === 400 || response.status === 422) {
    console.error(
      `Batch rejected (${response.status}), sending one by one:`,
      await response.text(),
    );
    process.exitCode = 1;

    let stop = false;
    for (const m of batch) {
      await new Promise((r) => setTimeout(r, 600)); // Stay under Resend's rate limit (2 requests/s)

      const single = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ResendAPI}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `notify-${today}-${m.userId}`,
        },
        body: JSON.stringify(m.payload),
      });

      if (!single.ok) {
        console.error(
          `Resend failed for user ${m.userId} (${single.status}):`,
          await single.text(),
        );
        failed += 1;
        continue;
      }

      if (!(await markNotified([m.userId], m.windowEnd))) {
        stop = true;
        break;
      }
      sent += 1;
    }

    if (stop) break;
    continue;
  }

  // Any other error (auth, rate limit, Resend down): stop, the next run picks them up
  if (!response.ok) {
    console.error(`Resend failed (${response.status}):`, await response.text());
    failed += batch.length;
    process.exitCode = 1;
    break;
  }

  if (!(await markNotified(userIds, batch[0].windowEnd))) break;

  sent += batch.length;
}

// Mark as mailed RIGHT away, with window_end (not new Date())
async function markNotified(userIds: string[], windowEnd: string) {
  const { error: markError } = await supabaseAdmin
    .from("profiles")
    .update({ last_notified_at: windowEnd })
    .in("id", userIds);

  if (markError) {
    console.error(
      `MAILED BUT NOT MARKED (${userIds.length} users):`,
      markError.message,
      userIds,
    );
    process.exitCode = 1;
    return false;
  }
  return true;
}

console.log(`Sent ${sent}, failed ${failed}`);
