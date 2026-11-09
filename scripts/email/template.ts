// Build topic, html and text for ONE user
// Only functions that turn data into text: no database, no network.
// The data: one row from due_emails() (see docs/database-design.md, "Emails")

import type { Enums, Tables } from "../../shared/database.types.ts";
import type { RpcRow } from "../../shared/db.ts";
import { formatNumber, formatPrice } from "../../shared/format.ts";
import { propertyTypeLabel } from "../../shared/property-types.ts";

// One listing in due_emails().new_listings. The function builds the json from these listings columns
export type MailListing = Pick<
  Tables<"listings">,
  | "id"
  | "address"
  | "area"
  | "municipality"
  | "property_type"
  | "price"
  | "rooms"
  | "living_area"
  | "monthly_fee"
  | "is_new_construction"
  | "agency"
  | "url"
>;

// One entry in due_emails().partner_likes. Handwritten: the function returns it as jsonb,
// which the generated types only know as Json
export type PartnerLike = {
  name: string;
  count: number;
  listings: { id: number; address: string | null }[]; // the 2 latest
};

// One row from due_emails(). The json columns get their shape here, and frequency is narrower
// than the column: users with "none" are never returned
export type DueRow = Omit<
  RpcRow<"due_emails">,
  "frequency" | "new_listings" | "partner_likes"
> & {
  frequency: Exclude<Enums<"email_frequency">, "none">;
  new_listings: MailListing[]; // at most 5
  partner_likes: PartnerLike[];
};

// ----- Small helpers -----
// This function replaces symbols, use it on everything from the database that goes into the html version of the mail
export function escapeHtml(text: string): string {
  text = text.replaceAll("&", "&amp;");
  text = text.replaceAll("<", "&lt;");
  text = text.replaceAll(">", "&gt;");
  text = text.replaceAll('"', "&quot;");
  text = text.replaceAll("'", "&#39;");

  return text;
}

export function objectsWord(value: number): string {
  // This is used if 1
  if (value === 1) {
    return "1 nytt objekt";
  }
  // For 0 and all other numbers
  return `${value} nya objekt`;
}

// Link to Samboo's listing page. The paths in this file follow the Expo Router files:
// /search/object/<id> is src/app/(tabs)/search/object/[id].tsx and /settings is src/app/(tabs)/settings.tsx.
// Moving or renaming those files breaks the links in every mail sent after that
export function listingUrl(appUrl: string, id: number): string {
  return `${appUrl}/search/object/${id}`;
}

// ----------------- NEW OBJECTS -----------------

// Convert one listing to two lines

// Line 1 (title): address + ", " + area, but ONLY add area if the address does not already contain it
//   ("Hytterkullen 16, Öjersjö" + "Öjersjö" -> no extra). No address: use area or municipality.
export function listingTitle(l: MailListing): string {
  const address: string | null = l.address;
  const area: string | null = l.area;
  const municipality: string | null = l.municipality;

  // Missing address, try to turn area first hand, municipality 2nd hand, otherwise just a string
  if (!address) {
    if (area) {
      return `En bostad i ${area}`;
    }
    if (municipality) {
      return `En bostad i ${municipality}`;
    }
    return "En ny bostadsannons";
  }

  // From here on, address exists
  //   If address contains area, just return address with area
  if (area && address.toLowerCase().includes(area.toLowerCase())) {
    return address;
  }

  // If address and area are separate, concaternate
  if (area) {
    const result = `${address}, ${area}`;
    return result;
  }

  // If no area, just reteurn address
  return address;
}

// Line 2 (facts): the parts that are not null
// "Lägenhet · 3 495 000 kr · 3 rok · 78 m² · Avgift 4 200 kr/mån · Nyproduktion"
export function listingFacts(list: MailListing): string {
  const parts: string[] = [];

  const type = propertyTypeLabel(list.property_type);
  if (type) parts.push(type);

  if (list.price) parts.push(formatPrice(list.price));

  if (list.rooms) parts.push(`${formatNumber(list.rooms)} rok`);

  if (list.living_area) parts.push(`${formatNumber(list.living_area)} kvm`);

  if (list.monthly_fee)
    parts.push(`Avgift ${formatNumber(list.monthly_fee)} kr/mån`);

  if (list.is_new_construction) parts.push("Nyproduktion");

  return parts.join(" · ");
}

// ----------------- A GROUP MEMEBER's NEW LIKES  -----------------
export function partnerSentence(p: PartnerLike): string {
  if (p.count === 1) {
    return `${p.name} har gillat ${p.listings[0].address ? p.listings[0].address : "ett objekt"}.`;
  }

  if (p.count === 2) {
    return `${p.name} har gillat ${p.listings[0].address ? p.listings[0].address : "ett objekt"} och ${p.listings[1].address ? p.listings[1].address : "ett annat objekt"}.`;
  }

  return `${p.name} har gillat ${p.count} objekt sedan sist.`;
}

// ----------------- CREATE SUBJECT LINE -----------------
export function mailSubject(row: DueRow): string {
  if (row.frequency === "week") {
    return "Samboo: Senaste veckan";
  }

  return "Nytt på Samboo";
}

// Text version of the mail, sent alongside the HTML (for clients and spam filters that perfer plain text)
export function mailContent(row: DueRow, appUrl: string): string {
  const lines: string[] = [];

  lines.push(`Hej ${row.name},`);
  lines.push(""); // Empty line

  // Number of new matching objects
  if (row.new_count > 0) {
    lines.push(
      `Du har ${objectsWord(row.new_count)} som matchar din bevakning.`,
    );
    lines.push("");

    for (const l of row.new_listings) {
      lines.push(listingTitle(l));
      lines.push(listingFacts(l));
      lines.push(listingUrl(appUrl, l.id));
      lines.push("");
    }
  }

  if (row.new_count > 5) {
    lines.push(`och ${row.new_count - 5} till i appen.`);
    lines.push("");
  }

  // Number of partner likes
  const partnerList: PartnerLike[] = row.partner_likes;
  if (partnerList.length > 0) {
    partnerList.forEach((p) => {
      lines.push(partnerSentence(p));
    });
    lines.push("");
  }

  // Outro
  lines.push(`Öppna Samboo ${appUrl}`);
  lines.push(
    `Du får det här mailet eftersom du valt ${row.frequency === "week" ? "veckovisa" : "dagliga"} notiser.`,
  );
  lines.push(`Stäng av under Inställningar: ${appUrl}/settings`);

  // Put lines together
  return lines.join("\n");
}

// ----------------- CREATE HTML VERSION OF MAIL -----------------
// The app's colors (src/global.css) as hex: mail clients do not all understand hsl()
const COLOR_BACKGROUND = "#F7F2ED"; // --off-white
const COLOR_TEXT = "#293907"; // --dark-green
const COLOR_MUTED = "#6B6259"; // greige, for the facts line and the footer
const COLOR_BORDER = "#DCD5D0"; // --light-greige
const COLOR_BUTTON = "#EDB74A"; // --yellow
const COLOR_BUTTON_TEXT = "#212121"; // --off-black

const FONT = "Arial, Helvetica, sans-serif";

// One paragraph. The text must already be escaped
function paragraph(html: string, style = ""): string {
  return `<p style="margin: 0 0 16px 0; ${style}">${html}</p>`;
}

// Html version of the mail, same content as mailContent()
export function mailHtml(row: DueRow, appUrl: string): string {
  const parts: string[] = [];

  parts.push(paragraph(`Hej ${escapeHtml(row.name)},`));

  // New matching objects: one table row per listing, with a line between them
  if (row.new_count > 0) {
    parts.push(
      paragraph(
        `Du har ${objectsWord(row.new_count)} som matchar din bevakning.`,
      ),
    );

    const listingRows = row.new_listings.map(
      (l) => `
        <tr>
          <td style="padding: 12px 0; border-top: 1px solid ${COLOR_BORDER};">
            <a href="${listingUrl(appUrl, l.id)}" style="color: ${COLOR_TEXT}; font-weight: bold; font-size: 16px; text-decoration: underline;">${escapeHtml(listingTitle(l))}</a>
            <div style="color: ${COLOR_MUTED}; font-size: 14px; margin-top: 4px;">${escapeHtml(listingFacts(l))}</div>
          </td>
        </tr>`,
    );

    parts.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px 0;">
        ${listingRows.join("")}
      </table>`);
  }

  if (row.new_count > 5) {
    parts.push(paragraph(`…och ${row.new_count - 5} till i appen.`));
  }

  // Partner likes: one paragraph per group member
  for (const p of row.partner_likes) {
    parts.push(paragraph(escapeHtml(partnerSentence(p))));
  }

  // Button = a link with a background color (padding on the <td> makes the whole button clickable in Outlook too)
  parts.push(`
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 24px 0;">
      <tr>
        <td style="background-color: ${COLOR_BUTTON}; border-radius: 6px;">
          <a href="${appUrl}" style="display: inline-block; padding: 12px 24px; color: ${COLOR_BUTTON_TEXT}; font-weight: bold; font-size: 16px; text-decoration: none;">Öppna Samboo</a>
        </td>
      </tr>
    </table>`);

  // Footer
  const frequencyWord = row.frequency === "week" ? "veckovisa" : "dagliga";
  parts.push(
    paragraph(
      `Du får det här mailet eftersom du valt ${frequencyWord} notiser. ` +
        `<a href="${appUrl}/settings" style="color: ${COLOR_MUTED};">Stäng av under Inställningar</a>.`,
      `color: ${COLOR_MUTED}; font-size: 12px; margin: 0;`,
    ),
  );

  // The page around it: an off-white background with a white box in the middle, at most 600px wide
  return `<!DOCTYPE html>
<html lang="sv">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(mailSubject(row))}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${COLOR_BACKGROUND};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLOR_BACKGROUND};">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px;">
            <tr>
              <td style="padding: 24px; font-family: ${FONT}; font-size: 16px; line-height: 1.5; color: ${COLOR_TEXT};">
                ${parts.join("\n")}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ----------------- FUNCTION TO BUILD MAIL -----------------
export function buildMail(
  row: DueRow,
  appUrl: string,
): { subject: string; html: string; text: string } {
  return {
    subject: mailSubject(row),
    html: mailHtml(row, appUrl),
    text: mailContent(row, appUrl),
  };
}
