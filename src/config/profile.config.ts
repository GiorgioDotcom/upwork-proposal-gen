/**
 * Freelancer profile injected into the system prompt.
 * Edit this to change how proposals are written: stack, rate, tone, strengths.
 * This is the single highest-leverage file for proposal quality.
 */
export interface FreelancerProfile {
  name: string;
  title: string;
  hourlyRateUsd: number;
  yearsExperience: number;
  stack: string[];
  strengths: string[];
  /** Short, honest highlights of real work — referenced in proposals. */
  highlights: string[];
  /** Voice/tone guidance for the generated proposal. */
  tone: string;
  /** How to handle rate vs the client's budget. */
  rateStrategy: string;
}

export const FREELANCER_PROFILE: FreelancerProfile = {
  name: 'Giorgio',
  title: 'Node.js & AWS Serverless Backend Engineer (TypeScript / NestJS / Lambda)',
  hourlyRateUsd: 55,
  yearsExperience: 4,
  stack: [
    'TypeScript',
    'Node.js',
    'NestJS',
    'PostgreSQL / Amazon Aurora',
    'AWS Lambda',
    'API Gateway',
    'S3',
    'SQS',
    'OpenSearch',
    'REST API design',
  ],
  strengths: [
    'Enterprise-grade, multi-tenant SaaS backends on AWS serverless',
    'Production REST API design and clean, maintainable code',
    'PostgreSQL/Aurora — schema design, migrations, query optimization',
    'Third-party and AI/LLM integrations',
    'Clear communication, reliable delivery, adapting to changing requirements',
  ],
  highlights: [
    'Backend engineer on an enterprise cybersecurity SaaS platform: real-time data pipelines, vulnerability management and threat detection on AWS Lambda + Aurora PostgreSQL + OpenSearch, in TypeScript/NestJS.',
    'Built a multi-tenant event-management REST API with JWT auth, role-based access control, polymorphic data modeling and third-party integrations.',
  ],
  tone:
    'Confident but not arrogant. Concise and specific. Sound like a human who actually read the job post, not a template. No filler, no "I am writing to express my interest", no generic flattery.',
  rateStrategy:
    'Currently building a track record on Upwork (no reviews yet), so be flexible on rate to land the first jobs. ' +
    'If the client budget is below the $55/hour target, do NOT refuse or lecture about rate. ' +
    'Instead, express genuine interest and openness: signal willingness to start within their budget for an initial scope or trial, ' +
    'and let rate be a conversation, not a dealbreaker. Never undersell the work, but prioritize getting the foot in the door and a first review. ' +
    'Only mention a specific number if it strengthens the proposal; otherwise keep rate flexible and collaborative.',
};
