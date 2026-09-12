/**
 * What a sign-up records about consent.
 *
 * This used to also park the values in localStorage across the Google OAuth
 * redirect, because `signInWithOAuth` navigates away and takes no
 * `options.data`. Google Identity Services replaced that flow — the browser
 * never leaves the page — so the consent is written straight onto the user and
 * there is nothing left to park.
 */
export type SignUpPrefs = {
  phone: string;
  marketing_email: boolean;
  marketing_sms: boolean;
  consent_at: string;
  consent_source: string;
  terms_accepted_at: string;
};
