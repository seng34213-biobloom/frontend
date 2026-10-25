import { describe, expect, it } from 'vitest';
import { actionsFor } from './subscriptions';

describe('actionsFor', () => {
  it('offers the right actions for each status (SDS §6.4)', () => {
    expect(actionsFor('ACTIVE')).toEqual(['pause', 'skip-next', 'cancel']);
    expect(actionsFor('PAUSED')).toEqual(['resume', 'cancel']);
    expect(actionsFor('CANCELLED')).toEqual([]);
  });
});
