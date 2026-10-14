/** Upstream session_usage.rs fixtures at pin 479964f2. */

export const PARSE_LINE =
  '{"type":"assistant","message":{"id":"msg_test123","model":"claude-opus-4-6","usage":{"input_tokens":3,"output_tokens":150,"cache_read_input_tokens":5000,"cache_creation_input_tokens":10000},"stop_reason":"end_turn"},"timestamp":"2026-04-05T12:00:00Z","sessionId":"session-abc"}';

export const DEDUP_INTERMEDIATE =
  '{"type":"assistant","message":{"id":"msg_1","model":"claude-opus-4-6","usage":{"input_tokens":3,"output_tokens":26,"cache_read_input_tokens":5000,"cache_creation_input_tokens":10000}},"timestamp":"2026-04-05T12:00:00Z","sessionId":"session-a"}';

export const DEDUP_FINAL =
  '{"type":"assistant","message":{"id":"msg_1","model":"claude-opus-4-6","usage":{"input_tokens":3,"output_tokens":1349,"cache_read_input_tokens":5000,"cache_creation_input_tokens":10000},"stop_reason":"end_turn"},"timestamp":"2026-04-05T12:00:01Z","sessionId":"session-a"}';

/** L1913 — billable without stop_reason */
export const BILLABLE_NOSTOP =
  '{"type":"assistant","message":{"id":"msg_nostop","model":"claude-opus-4-8","usage":{"input_tokens":2,"output_tokens":1,"cache_read_input_tokens":48719,"cache_creation_input_tokens":2061}},"timestamp":"2026-06-07T13:01:23Z","sessionId":"session-wf"}';

/** L1914 — all-zero placeholder */
export const EMPTY_ZERO =
  '{"type":"assistant","message":{"id":"msg_empty","model":"claude-opus-4-8","usage":{"input_tokens":0,"output_tokens":0,"cache_read_input_tokens":0,"cache_creation_input_tokens":0}},"timestamp":"2026-06-07T13:01:24Z","sessionId":"session-wf"}';

export const SESSION_B_ASSISTANT =
  '{"type":"assistant","message":{"id":"msg_b1","model":"claude-sonnet-4-5","usage":{"input_tokens":10,"output_tokens":20,"cache_read_input_tokens":100,"cache_creation_input_tokens":50},"stop_reason":"end_turn"},"timestamp":"2026-06-07T14:00:00Z","sessionId":"session-b"}';
