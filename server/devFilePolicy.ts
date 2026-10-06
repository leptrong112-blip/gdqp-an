/** Prevent development asset requests from bypassing the authenticated data APIs. */
export const PRIVATE_DEV_FILE_PATTERNS = [
  '.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/accounts.json*', '**/surveys.jsonl',
  '**/survey_config.json*', '**/feedback_analysis*.json', '**/exam_results.jsonl*', '**/pose_results.jsonl*'
];
