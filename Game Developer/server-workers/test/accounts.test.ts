// The accounts as the worker keeps them, over the Sql interface: the same rows, tokens and codes as the Node server's,
// and the import that brings a Node server's accounts across.

import { describe, expect, it } from 'vitest';
import { Accounts, openAccountsSchema, plainCode, showCode, type AccountRow, type TokenRow } from '../src/accounts.ts';
import { memorySql } from './memory-sql.ts';

function fresh() {
  const sql = memorySql();
  openAccountsSchema(sql);
  let clock = 5000;
  return { sql, tick: (ms: number) => (clock += ms), accounts: new Accounts(sql, () => clock) };
}

describe('the accounts on the worker', () => {
  it('makes an account with a player id, a code without 0, O, 1 or I, and a first token; finds it by either', () => {
    const { accounts } = fresh();
    const { account, token } = accounts.create({ name: 'Robin', classId: 'warrior', regionId: 'region-0' });
    expect(account.id).toMatch(/^p-[0-9a-f]{10}$/);
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(account.recovery).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(account.recovery).not.toMatch(/[01OI]/);
    expect(accounts.byToken(token)).toEqual(account);
    expect(accounts.byRecovery(account.recovery.toLowerCase().replace(/-/g, ' '))).toEqual(account);
    expect(accounts.byToken('no-such-token')).toBeNull();
    expect(accounts.byRecovery('AAAA-AAAA-AAAA')).toBeNull();
    expect(accounts.count()).toBe(1);
    expect(accounts.names()).toEqual(['Robin']);
  });

  it('gives another phone its own token while the first keeps working, and notes when an account was seen', () => {
    const { accounts, sql, tick } = fresh();
    const { account, token } = accounts.create({ name: 'Robin', classId: 'warrior', regionId: 'region-0' });
    tick(1000);
    const second = accounts.newToken(account.id);
    expect(second).not.toBe(token);
    expect(accounts.byToken(second)?.id).toBe(account.id);
    expect(accounts.byToken(token)?.id).toBe(account.id);
    tick(1000);
    accounts.touch(account.id);
    expect(sql.exec<{ last_seen: number }>('SELECT last_seen FROM accounts WHERE id = ?', account.id)[0]!.last_seen).toBe(7000);
  });

  it('takes a Node server\'s accounts and tokens across (the import), the same twice over', () => {
    const { accounts } = fresh();
    const rows: AccountRow[] = [{ id: 'p-02998aee1d', name: 'Robin', class_id: 'warrior', region_id: 'region-0', recovery: 'KPM4R7QX2HJD', created_at: 1000, last_seen: 2000 }];
    const tokens: TokenRow[] = [{ token: 'tok-1', account_id: 'p-02998aee1d', created_at: 1000 }];
    expect(accounts.importRows(rows, tokens)).toEqual({ accounts: 1, tokens: 1 });
    expect(accounts.importRows(rows, tokens)).toEqual({ accounts: 1, tokens: 1 });
    expect(accounts.byToken('tok-1')).toEqual({ id: 'p-02998aee1d', name: 'Robin', classId: 'warrior', regionId: 'region-0', recovery: 'KPM4-R7QX-2HJD' });
    expect(accounts.byRecovery('kpm4 r7qx 2hjd')?.id).toBe('p-02998aee1d');
    // A new account made here lives beside the imported one.
    accounts.create({ name: 'Sam', classId: 'mage', regionId: 'region-0' });
    expect(accounts.names()).toEqual(['Robin', 'Sam']);
  });

  it('reads codes the same however they are typed', () => {
    expect(plainCode(' kpm4-r7qx 2hjd ')).toBe('KPM4R7QX2HJD');
    expect(showCode('KPM4R7QX2HJD')).toBe('KPM4-R7QX-2HJD');
  });
});
