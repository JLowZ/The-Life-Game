import { sumLedgers } from '@/database/repositories/ledgerRepository';
import { getPlayerProfile } from '@/database/repositories/playerProfilesRepository';
import { decideRedeem, leavesMissing, validateReward } from '@/domain/shop';

import { registerUser } from './authService';
import { acceptMission, completeMission } from './missionService';
import { createReward, deleteReward, loadShop, redeemReward } from './shopService';
import { createTestDeps } from './testing/createTestDeps';

const FRIDAY_10AM = new Date(2026, 10, 27, 10, 0, 0);
const MISSION = { categoryId: 'EXERCISE', description: 'Caminar', targetQuantity: 20, unit: 'minutos' };

type Deps = Awaited<ReturnType<typeof createTestDeps>>;

/** Usuario con `missions` × 20 Hojas (cada misión secundaria da 20 Hojas y 20 XP). */
async function setup(missions: number) {
  const deps = await createTestDeps();
  deps.clock.set(FRIDAY_10AM);
  const result = await registerUser(
    deps,
    { username: 'Ana_92', email: 'ana@example.com', password: 'secreto1', privacyAccepted: true },
    { purpose: 'Ser constante', goals: [{ text: 'Leer', categoryId: 'READING' }] },
  );
  if (!result.ok) throw new Error('registro fallido');
  const userId = result.user.id;
  for (let i = 0; i < missions; i += 1) {
    const accepted = await acceptMission(deps, userId, MISSION);
    if (!accepted.ok) throw new Error('misión');
    await completeMission(deps, userId, accepted.missionId);
  }
  return { deps, userId };
}

async function createOrFail(deps: Deps, userId: string, name: string, cost: number): Promise<string> {
  const created = await createReward(deps, userId, { name, cost });
  if (!created.ok) throw new Error(JSON.stringify(created.errors));
  return created.rewardId;
}

async function profile(deps: Deps, userId: string) {
  return getPlayerProfile(deps.db, userId);
}

describe('validar recompensas reales (RN-SHOP-02, C-30, ESC-29)', () => {
  it('ESC-29: 15 y 19 Hojas se rechazan; 20 (el mínimo) se acepta; sin nombre se rechaza', () => {
    expect(validateReward({ name: 'Ver una película', cost: 15 })).toMatchObject({ ok: false, errors: { cost: expect.any(String) } });
    expect(validateReward({ name: 'Ver una película', cost: 19 }).ok).toBe(false);
    expect(validateReward({ name: '  Ver una película  ', cost: 20 })).toEqual({
      ok: true,
      value: { name: 'Ver una película', cost: 20 },
    });
    expect(validateReward({ name: '   ', cost: 50 })).toMatchObject({ ok: false, errors: { name: expect.any(String) } });
    expect(validateReward({ name: 'Algo', cost: 20.5 }).ok).toBe(false);
  });

  it('decideRedeem: saldo exacto alcanza; uno menos no; a 0 HP se bloquea', () => {
    const reward = { id: 'r', userId: 'u', name: 'Helado', costMateLeaves: 40 };
    expect(decideRedeem({ reward, redemptionId: 'x', mateLeavesBalance: 40, hpHalfUnits: 20 })).toEqual({
      ok: true,
      effects: { leavesDelta: -40, idempotencyKey: 'redeem:x' },
    });
    expect(decideRedeem({ reward, redemptionId: 'x', mateLeavesBalance: 39, hpHalfUnits: 20 })).toEqual({
      ok: false,
      error: 'INSUFFICIENT_BALANCE',
    });
    expect(decideRedeem({ reward, redemptionId: 'x', mateLeavesBalance: 100, hpHalfUnits: 0 })).toEqual({ ok: false, error: 'ZERO_HP' });
    expect(leavesMissing(50, 40)).toBe(10);
    expect(leavesMissing(20, 40)).toBe(0);
  });
});

describe('crear, canjear y eliminar (RN-SHOP-02, RN-SHOP-03, ESC-17)', () => {
  it('ESC-29 en el servicio: una recompensa de 15 Hojas no se guarda', async () => {
    const { deps, userId } = await setup(0);
    expect((await createReward(deps, userId, { name: 'Café', cost: 15 })).ok).toBe(false);
    expect((await loadShop(deps, userId)).rewards).toHaveLength(0);
  });

  it('ESC-17: canjear 50 Hojas con un saldo de 40 se rechaza, sin transacción', async () => {
    const { deps, userId } = await setup(2); // 40 Hojas
    const rewardId = await createOrFail(deps, userId, 'Videojuego', 50);
    expect(await redeemReward(deps, userId, rewardId, deps.crypto.randomUUID())).toEqual({
      ok: false,
      error: expect.stringContaining('suficientes'),
    });
    expect((await profile(deps, userId))?.mateLeavesBalance).toBe(40);
    expect((await loadShop(deps, userId)).recent).toHaveLength(0);
  });

  it('canjes ilimitados; la misma operación dos veces cobra una sola vez; XP y HP no cambian', async () => {
    const { deps, userId } = await setup(3); // 60 Hojas, 60 XP
    const rewardId = await createOrFail(deps, userId, 'Helado', 20);

    const first = deps.crypto.randomUUID();
    expect(await redeemReward(deps, userId, rewardId, first)).toEqual({ ok: true });
    expect(await redeemReward(deps, userId, rewardId, first)).toEqual({ ok: true }); // doble toque
    expect((await profile(deps, userId))?.mateLeavesBalance).toBe(40);

    await redeemReward(deps, userId, rewardId, deps.crypto.randomUUID());
    await redeemReward(deps, userId, rewardId, deps.crypto.randomUUID());
    // Saldo exacto: 60 − 3 × 20 = 0. Un cuarto canje ya no alcanza (INT-05).
    expect(await profile(deps, userId)).toMatchObject({ mateLeavesBalance: 0, xpTotal: 60, hpHalfUnits: 20 });
    expect((await redeemReward(deps, userId, rewardId, deps.crypto.randomUUID())).ok).toBe(false);

    const shop = await loadShop(deps, userId);
    expect(shop.recent.map((r) => [r.nameSnapshot, r.costSnapshot])).toEqual([
      ['Helado', 20],
      ['Helado', 20],
      ['Helado', 20],
    ]);
    // INT-14: el saldo guardado coincide con la suma de los movimientos.
    expect(await sumLedgers(deps.db, userId)).toEqual({ leaves: 0, xp: 60 });
  });

  it('a 0 HP no se canjea (RN-NAV-04, INT-17), pero sí se puede crear una recompensa', async () => {
    const { deps, userId } = await setup(1);
    await deps.db.runAsync('UPDATE player_profiles SET hp_half_units = 0 WHERE user_id = ?', [userId]);
    const rewardId = await createOrFail(deps, userId, 'Helado', 20);
    expect(await redeemReward(deps, userId, rewardId, deps.crypto.randomUUID())).toEqual({
      ok: false,
      error: expect.stringContaining('Sin vidas'),
    });
    expect((await profile(deps, userId))?.mateLeavesBalance).toBe(20);
  });

  it('eliminar archiva la recompensa: desaparece de la Tienda y sus canjes se conservan', async () => {
    const { deps, userId } = await setup(1);
    const rewardId = await createOrFail(deps, userId, 'Helado', 20);
    await redeemReward(deps, userId, rewardId, deps.crypto.randomUUID());
    expect(await deleteReward(deps, userId, rewardId)).toBe(true);
    expect(await deleteReward(deps, userId, rewardId)).toBe(false);
    const shop = await loadShop(deps, userId);
    expect(shop.rewards).toHaveLength(0);
    expect(shop.recent).toHaveLength(1);
    expect((await redeemReward(deps, userId, rewardId, deps.crypto.randomUUID())).ok).toBe(false);
  });
});
