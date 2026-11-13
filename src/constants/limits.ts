// Limits the app checks before it sends anything. The database is the authority: each value mirrors
// the rule named in its comment, so change both together. Limits that only the database checks
// (50 showings, 5 search changes per day, invites) are not here: the app shows the
// database's own message, which already contains the number.

// The longest valid e-mail address (RFC 5321). invites_email_length (invites.to_email) uses the same
// limit; sign-in, sign-up and forgot password use it as input length
export const EMAIL_MAX_LENGTH = 254;

// profiles_name_length: 1-100 characters
export const NAME_MAX_LENGTH = 100;

// user_tags_name_length: 1-20 characters
export const TAG_NAME_MAX_LENGTH = 20;

// showings_note_length
export const SHOWING_NOTE_MAX_LENGTH = 500;

// showings_date_range: 2000-01-01 to 2099-12-31. The app starts at today, so only the end is needed
export const SHOWING_LAST_DATE = "2099-12-31";

// limit_tags_per_user(): raises P0001 "Du har redan max antal taggar (30)"
export const MAX_TAGS_PER_USER = 30;

// accept_invite(): a group can not grow past this
export const MAX_GROUP_MEMBERS = 10;

// search_params_place_limit
export const MAX_MUNICIPALITIES = 10;
export const MAX_AREAS = 200;

// Supabase Auth's cooldown between e-mails to the same address (an Auth setting, not in schema.sql)
export const RESEND_CODE_INTERVAL_SECONDS = 60;

// Supabase Auth's minimum password length (an Auth setting, not in schema.sql). No character rules
export const PASSWORD_MIN_LENGTH = 6;
