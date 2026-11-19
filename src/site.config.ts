/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the only file you edit to re-brand this template.
 *  Company name, contact info, services, service area, reviews, financing copy
 *  and every price live here. Components read from this object; nothing about
 *  the brand is hard-coded anywhere else.
 *
 *  After changing anything under `plans`, run `npm run setup:plans` so the
 *  matching Whop products/plans exist (it writes src/whop.plans.json).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type PlanKey = 'inspection' | 'deposit' | 'flatRate'

export interface PlanConfig {
  /** Product title shown in Whop checkout, receipts and dashboard. */
  title: string
  /** Short label for buttons/cards (max 30 chars — Whop variant title limit). */
  shortTitle: string
  /** One-time price in USD (major units). */
  price: number
  description: string
  bullets: string[]
}

export interface ServiceConfig {
  id: string
  name: string
  blurb: string
  details: string[]
  /** Optional plan this service can be booked with directly. */
  plan?: PlanKey
  /** Inline SVG path ("d" attribute) for a 24x24 icon. */
  icon: string
}

export const site = {
  company: {
    name: 'Summit Ridge Roofing',
    shortName: 'Summit Ridge',
    tagline: 'Roofs built for Texas weather.',
    phone: '(512) 555-0142',
    phoneHref: 'tel:+15125550142',
    email: 'hello@summitridge.example',
    address: 'Austin, TX',
    license: 'Licensed & insured · TX Reg. #RC-000000 (demo)',
    founded: 2009,
  },

  hero: {
    eyebrow: 'Austin’s storm-season specialists',
    headline: 'A roof you never have to think about.',
    sub: 'Repairs, full replacements and certified inspections, priced up-front and backed by a 10-year workmanship warranty.',
    stats: [
      { value: '2,400+', label: 'Roofs completed' },
      { value: '4.9★', label: 'Average rating' },
      { value: '24 hr', label: 'Storm response' },
    ],
  },

  /** Plans created in Whop by `npm run setup:plans`. */
  plans: {
    inspection: {
      title: 'Certified Roof Inspection',
      shortTitle: 'Roof Inspection',
      price: 149,
      description:
        'A 30-point certified inspection with drone photos and a written report you can hand to your insurer. Credited toward any repair over $1,000.',
      bullets: ['30-point inspection', 'Drone + attic photos', 'Insurance-ready PDF report', 'Credited toward repairs'],
    },
    deposit: {
      title: 'Project Deposit — Roof Replacement',
      shortTitle: 'Project Deposit',
      price: 500,
      description:
        'Reserves your crew and locks material pricing for a full replacement. The remaining balance is billed only after final walkthrough.',
      bullets: ['Locks your install date', 'Locks material pricing', 'Card kept on file for the final balance', 'Balance billed after walkthrough'],
    },
    flatRate: {
      title: 'Gutter Clean & Roof Tune-Up',
      shortTitle: 'Gutter & Roof Tune-Up',
      price: 349,
      description:
        'Flat-rate maintenance visit for homes up to 2,500 sq ft: gutters cleared and flushed, sealant touch-ups, and loose shingles re-secured.',
      bullets: ['Gutters cleared & flushed', 'Flashing + vent sealant touch-up', 'Up to 10 shingles re-secured', 'Before/after photos'],
    },
  } satisfies Record<PlanKey, PlanConfig>,

  services: [
    {
      id: 'repair',
      name: 'Roof Repair',
      blurb: 'Leaks, storm damage, missing shingles and flashing, fixed fast and done right the first time.',
      details: ['Emergency tarping in 24 hrs', 'Leak tracing & flashing', 'Hail & wind damage', 'Insurance claim support'],
      plan: 'inspection',
      icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    },
    {
      id: 'replacement',
      name: 'Roof Replacement',
      blurb: 'Architectural shingle, metal and tile systems installed in as little as one day, with lifetime manufacturer warranties.',
      details: ['Free measured estimate', 'GAF & Owens Corning certified', 'Full tear-off & haul-away', '10-yr workmanship warranty'],
      plan: 'deposit',
      icon: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
    },
    {
      id: 'inspection',
      name: 'Roof Inspection',
      blurb: 'Buying, selling or after a storm: get a certified, insurance-ready report with drone imagery.',
      details: ['30-point checklist', 'Drone & attic photos', 'Same-week scheduling', 'Report in 24 hrs'],
      plan: 'inspection',
      icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-4.35-4.35',
    },
    {
      id: 'maintenance',
      name: 'Gutters & Tune-Ups',
      blurb: 'Flat-rate seasonal maintenance that keeps small problems from becoming big ones.',
      details: ['Gutter clean & flush', 'Sealant touch-ups', 'Shingle re-securing', 'Photo report'],
      plan: 'flatRate',
      icon: 'M4 14h16M6 14v5m12-5v5M12 3v8m-4-4 4 4 4-4',
    },
  ] satisfies ServiceConfig[],

  serviceArea: {
    headline: 'Proudly serving Central Texas',
    sub: 'Free estimates anywhere within 45 miles of downtown Austin. Same-week inspections in every city below.',
    cities: [
      'Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville', 'Leander',
      'Lakeway', 'Bee Cave', 'Kyle', 'Buda', 'Dripping Springs', 'Hutto',
    ],
    zipPlaceholder: 'e.g. 78704',
  },

  financing: {
    headline: 'Finance your new roof',
    sub: 'Pay over time with flexible options shown right at checkout. Eligible customers see buy-now-pay-later options like Klarna, Afterpay and Splitit automatically, so there are no separate applications to fill out.',
    points: ['Options appear automatically at checkout', 'Split into installments', 'Soft credit check options', 'Card on file for the final balance'],
    disclaimer: 'Financing availability depends on eligibility and is offered through Whop checkout partners.',
  },

  reviews: [
    { name: 'Danielle R.', city: 'Round Rock', rating: 5, text: 'Crew showed up at 7am, had the old roof off and the new one on by dinner. Cleanest job site I’ve ever seen.' },
    { name: 'Marcus T.', city: 'Cedar Park', rating: 5, text: 'Inspection report was so thorough my insurance approved the hail claim in a week. Worth every penny of the $149.' },
    { name: 'Priya S.', city: 'Austin', rating: 5, text: 'Up-front pricing, a deposit to lock the date, and the final invoice matched the quote to the dollar.' },
    { name: 'Tom & Ellen K.', city: 'Georgetown', rating: 4, text: 'Great communication through the whole process. Gutter tune-up is now on our calendar every fall.' },
  ],
  reviewsNote: 'Sample reviews for template demonstration.',

  trust: ['GAF Certified', 'Owens Corning Preferred', 'BBB A+', 'Licensed & Insured', '10-yr Warranty'],

  estimateForm: {
    headline: 'Request a free estimate',
    sub: 'Tell us about your roof and we’ll reach out within one business day.',
    projectTypes: ['Roof repair', 'Full replacement', 'Inspection', 'Gutters / maintenance', 'Storm / insurance claim', 'Not sure yet'],
  },

  theme: {
    /** Primary brand color (buttons, accents). */
    accent: '#C2410C',
    accentDark: '#9A3412',
    ink: '#0F172A',
  },
} as const

export type Site = typeof site
