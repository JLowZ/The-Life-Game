import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PixelButton } from '@/components/PixelButton';
import { PixelTextInput } from '@/components/PixelTextInput';
import { RewardCard } from '@/components/RewardCard';
import { MIN_REAL_REWARD_COST, REWARD_NAME_MAX_LENGTH } from '@/config/game';
import { border, colors, spacing } from '@/config/theme';
import { formatGameDateShort } from '@/content/habitTexts';
import { getGameDate } from '@/domain/gameDay';
import { isZeroHp } from '@/domain/hp';
import { leavesMissing, SHOP_ERROR_MESSAGES, type RewardField } from '@/domain/shop';
import { createReward, deleteReward, loadShop, redeemReward, refreshAfterRedeem, type ShopData } from '@/services/shopService';
import { useAppDeps } from '@/services/useAppDeps';
import { usePlayerStore } from '@/state/usePlayerStore';
import { useSessionStore } from '@/state/useSessionStore';

/**
 * Tienda (RN-SHOP-01..03): en la Entrega 1, solo recompensas de la vida real
 * que crea el usuario (costo ≥ 20 Hojas) y canjea sin límite. Canjear se
 * bloquea a 0 HP (RN-NAV-04). Los cosméticos llegan después (C-20).
 */
export function ShopScreen() {
  const deps = useAppDeps();
  const userId = useSessionStore((s) => s.user?.id);
  const balance = usePlayerStore((s) => s.profile?.mateLeavesBalance ?? 0);
  const hpHalfUnits = usePlayerStore((s) => s.profile?.hpHalfUnits);

  const [shop, setShop] = useState<ShopData>({ rewards: [], recent: [] });
  const [name, setName] = useState('');
  const [costText, setCostText] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RewardField, string>>>({});
  const [creating, setCreating] = useState(false);
  /** Recompensa en confirmación y el id de esa operación (reutilizado si se toca dos veces). */
  const [pending, setPending] = useState<{ rewardId: string; operationId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      setShop(await loadShop(deps, userId));
      await refreshAfterRedeem(deps, userId);
    } catch {
      setError('No se pudo cargar la Tienda.');
    }
  }, [deps, userId]);

  useFocusEffect(
    useCallback(() => {
      reload().catch(() => undefined);
    }, [reload]),
  );

  if (!userId) return null;
  const currentUserId = userId;

  async function handleCreate() {
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const result = await createReward(deps, currentUserId, { name, cost: Number(costText || 'NaN') });
      if (!result.ok) {
        setFieldErrors(result.errors);
        return;
      }
      setFieldErrors({});
      setName('');
      setCostText('');
      await reload();
    } catch {
      setError('No se pudo guardar la recompensa.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRedeem() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const reward = shop.rewards.find((r) => r.id === pending.rewardId);
      const result = await redeemReward(deps, currentUserId, pending.rewardId, pending.operationId);
      if (result.ok) setNotice(`¡Disfruta: ${reward?.name ?? 'tu recompensa'}! −${reward?.costMateLeaves ?? 0} Hojas de mate`);
      else setError(result.error);
      setPending(null);
      await reload();
    } catch {
      setError('No se pudo canjear. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(rewardId: string) {
    setError(null);
    setNotice(null);
    try {
      await deleteReward(deps, currentUserId, rewardId);
      await reload();
    } catch {
      setError('No se pudo eliminar la recompensa.');
    }
  }

  const zeroHpReason = hpHalfUnits !== undefined && isZeroHp(hpHalfUnits) ? SHOP_ERROR_MESSAGES.ZERO_HP : undefined;
  const today = getGameDate(deps.now());

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        Tienda
      </Text>
      <Text style={styles.subtitle}>Tienes {balance} Hojas de mate. Date un gusto por tu constancia.</Text>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section} accessibilityRole="header">
        Recompensas de la vida real
      </Text>
      {shop.rewards.length === 0 ? (
        <Text style={styles.empty}>Aún no tienes recompensas. Crea la primera abajo: algo que te haga ilusión.</Text>
      ) : (
        shop.rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            missing={leavesMissing(reward.costMateLeaves, balance)}
            disabledReason={zeroHpReason}
            confirming={pending?.rewardId === reward.id}
            busy={busy}
            onAskRedeem={() => {
              setNotice(null);
              setPending({ rewardId: reward.id, operationId: deps.crypto.randomUUID() });
            }}
            onConfirmRedeem={handleRedeem}
            onCancel={() => setPending(null)}
            onDelete={() => handleDelete(reward.id)}
          />
        ))
      )}

      <View style={styles.form}>
        <Text style={styles.formTitle}>Nueva recompensa</Text>
        <PixelTextInput
          label="¿Qué te vas a regalar?"
          placeholder="Ver una película, un helado…"
          value={name}
          onChangeText={setName}
          error={fieldErrors.name}
          maxLength={REWARD_NAME_MAX_LENGTH}
        />
        <PixelTextInput
          label={`Costo en Hojas de mate (mínimo ${MIN_REAL_REWARD_COST})`}
          value={costText}
          onChangeText={(text) => setCostText(text.replace(/[^0-9]/g, ''))}
          error={fieldErrors.cost}
          keyboardType="number-pad"
        />
        <PixelButton label="Crear recompensa" onPress={handleCreate} loading={creating} />
      </View>

      {shop.recent.length > 0 ? (
        <View style={styles.history}>
          <Text style={styles.section} accessibilityRole="header">
            Últimos canjes
          </Text>
          {shop.recent.map((r) => {
            const date = getGameDate(new Date(r.redeemedAt));
            return (
              <Text key={r.id} style={styles.historyItem}>
                {date === today ? 'Hoy' : formatGameDateShort(date)} · {r.nameSnapshot} · −{r.costSnapshot} Hojas
              </Text>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.soon}>Cosméticos para tu avatar: próximamente.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { color: colors.navy, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  section: { color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  notice: { color: colors.leaf, fontSize: 15, fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 14, fontWeight: 'bold' },
  empty: { color: colors.textMuted, fontSize: 14 },
  form: {
    backgroundColor: colors.cream,
    borderColor: colors.gold,
    borderWidth: border.width,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formTitle: { color: colors.navy, fontSize: 16, fontWeight: 'bold' },
  history: { gap: spacing.xs },
  historyItem: { color: colors.text, fontSize: 14 },
  soon: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
});
