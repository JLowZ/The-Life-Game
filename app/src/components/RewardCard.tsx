import { StyleSheet, Text, View } from 'react-native';

import { border, colors, spacing } from '@/config/theme';
import type { RealReward } from '@/domain/types';

import { PixelButton } from './PixelButton';

interface RewardCardProps {
  reward: RealReward;
  /** Hojas que faltan para canjearla (0 = alcanza). */
  missing: number;
  /** Si no se puede canjear por otra razón (0 HP), explica por qué. */
  disabledReason?: string;
  confirming: boolean;
  busy: boolean;
  onAskRedeem: () => void;
  onConfirmRedeem: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

/**
 * Recompensa real (RN-SHOP-02, RN-SHOP-03): nombre, costo y botón Canjear con
 * confirmación. Si no alcanza el saldo, dice cuántas Hojas faltan.
 */
export function RewardCard(props: RewardCardProps) {
  const { reward, missing, disabledReason, confirming, busy } = props;
  const blocked = Boolean(disabledReason) || missing > 0;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{reward.name}</Text>
        <Text style={styles.cost}>{reward.costMateLeaves} Hojas</Text>
      </View>

      {confirming ? (
        <>
          <Text style={styles.question}>
            ¿Canjear «{reward.name}» por {reward.costMateLeaves} Hojas de mate?
          </Text>
          <View style={styles.actions}>
            <View style={styles.flex}>
              <PixelButton label="Canjear" onPress={props.onConfirmRedeem} loading={busy} />
            </View>
            <View style={styles.flex}>
              <PixelButton label="Cancelar" variant="secondary" onPress={props.onCancel} disabled={busy} />
            </View>
          </View>
        </>
      ) : (
        <>
          {disabledReason ? <Text style={styles.reason}>{disabledReason}</Text> : null}
          {!disabledReason && missing > 0 ? <Text style={styles.reason}>Te faltan {missing} Hojas de mate.</Text> : null}
          <View style={styles.actions}>
            <View style={styles.flex}>
              <PixelButton
                label="Canjear"
                onPress={props.onAskRedeem}
                disabled={blocked}
                accessibilityHint={`Gasta ${reward.costMateLeaves} Hojas de mate en ${reward.name}`}
              />
            </View>
            <PixelButton label="Eliminar" variant="link" onPress={props.onDelete} accessibilityHint={`Quita ${reward.name} de la Tienda`} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
    borderWidth: border.width,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, color: colors.navy, fontSize: 17, fontWeight: 'bold' },
  cost: { color: colors.leaf, fontSize: 15, fontWeight: 'bold' },
  question: { color: colors.text, fontSize: 15 },
  reason: { color: colors.gourd, fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
