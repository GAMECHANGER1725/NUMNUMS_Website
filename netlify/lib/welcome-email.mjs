/**
 * The newsletter welcome — sent once by `netlify/functions/subscribe.mjs`,
 * written as a note from Tarun Patel, who opened the bakery.
 *
 * Every fact in it comes from about.html (2019, Wigram Street, the one rule,
 * why, Riverstone, the values). Do not add a claim here that the About page
 * does not already make — this goes out under a real person's name.
 *
 * The brand, masthead, footer and colours live in `email-shell.mjs`. `esc`
 * runs over the name, which is customer-supplied: this is the trust boundary.
 */
import { shell, esc, BODY, DISPLAY, ORNAMENT, PROD, eyebrowRule, button, para, textFooter } from './email-shell.mjs';

const VALUES = [
  ['Fresh', 'Baked for your pickup date. Never pre-baked, never frozen.'],
  ['Community', 'Built in Harris Park, for families who have trusted us since day one.'],
  ['Craft', 'Every design finished by hand, in our own kitchen.'],
];

/**
 * `unsubscribeUrl` has no default on purpose: this is a commercial electronic
 * message under the Spam Act 2003, so it cannot go out without a working
 * unsubscribe facility, and a required parameter cannot be forgotten.
 */
export function welcomeEmail({ name, unsubscribeUrl, site = PROD }) {
  const first = String(name ?? '').trim().split(/\s+/)[0];
  const hi = first ? `Hi ${esc(first)},` : 'Hi there,';

  const values = VALUES.map(([k, v]) => `
            <tr><td class="rule" style="padding:10px 0;border-bottom:1px solid #EBD3DA;">
              <p class="muted" style="margin:0;font-family:${BODY};font-size:14px;line-height:22px;color:#5C3A22;font-weight:300;">
                <span style="color:#C85478;font-weight:500;">${k}.</span> ${v}
              </p>
            </td></tr>`).join('');

  const rows = `
        <tr><td class="pad" style="padding:26px 56px 0 56px;">
          <p class="muted" style="margin:0 0 20px 0;font-family:${BODY};font-size:15px;line-height:22px;color:#5C3A22;">${hi}</p>
          <h1 class="h1 ink" style="margin:0;font-family:${DISPLAY};font-size:34px;line-height:40px;font-weight:300;color:#2C1A0E;letter-spacing:-1px;mso-line-height-rule:exactly;">
            Welcome to<br><span style="color:#C85478;">the Num Num&#39;s family.</span>
          </h1>
        </td></tr>
${para('I opened Num Num&#39;s on Wigram Street, Harris Park, in 2019 with one rule: every cake we sell is 100% eggless. Not some cakes. Every single one.', 22)}
${para('I started it because vegetarian and Jain families in Sydney could not walk into most bakeries and order a celebration cake without worrying about what was inside. Since then we have opened a second shop at Riverstone, and that rule has not changed.')}
${eyebrowRule('What we stand for')}
        <tr><td class="pad" style="padding:14px 56px 0 56px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${values}
          </table>
        </td></tr>
${para('Every so often I will write with new flavours, seasonal specials and festival pre-order dates. Nothing more.', 24)}
        <tr><td class="pad" style="padding:22px 56px 0 56px;">
          <p class="muted" style="margin:0;font-family:${BODY};font-size:15px;line-height:22px;color:#5C3A22;font-weight:300;">Warmly,</p>
          <p class="ink" style="margin:6px 0 0 0;font-family:${ORNAMENT};font-size:26px;line-height:30px;color:#2C1A0E;font-style:italic;">Tarun Patel</p>
          <p class="muted" style="margin:2px 0 0 0;font-family:${BODY};font-size:12px;line-height:18px;letter-spacing:1.4px;text-transform:uppercase;color:#8A6B55;">Founder, Num Num&#39;s Bakery</p>
        </td></tr>
${button(`${site}/shop`, 'Browse our cakes')}`;

  const html = shell({
    title: "Welcome to Num Num's",
    preheader: 'A note from Tarun, who opened Num Num’s in 2019.',
    site,
    rows,
    unsubscribe: unsubscribeUrl,
  });

  const text = [
    first ? `Hi ${first},` : 'Hi there,',
    '',
    "Welcome to the Num Num's family.",
    '',
    "I opened Num Num's on Wigram Street, Harris Park, in 2019 with one rule: every cake we sell is 100% eggless. Not some cakes. Every single one.",
    '',
    'I started it because vegetarian and Jain families in Sydney could not walk into most bakeries and order a celebration cake without worrying about what was inside. Since then we have opened a second shop at Riverstone, and that rule has not changed.',
    '',
    'What we stand for',
    ...VALUES.map(([k, v]) => `- ${k}. ${v}`),
    '',
    'Every so often I will write with new flavours, seasonal specials and festival pre-order dates. Nothing more.',
    '',
    'Warmly,',
    'Tarun Patel',
    "Founder, Num Num's Bakery",
    '',
    `Browse our cakes: ${site}/shop`,
    '',
    textFooter(unsubscribeUrl),
  ].join('\n');

  return { subject: "Welcome to Num Num's, from Tarun", html, text };
}
