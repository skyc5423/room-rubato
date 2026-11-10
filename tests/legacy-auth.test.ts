import { expect, it } from 'vitest';
import { GET, POST, DELETE } from '../src/app/api/users/route';
it('rejects every legacy auth method regardless of supplied credentials', async () => {
  for (const handler of [GET, POST, DELETE]) {
    const response = handler();
    expect(response.status).toBe(410);
    expect((await response.json()).error).toContain('disabled');
  }
});
