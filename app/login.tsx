import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/design';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useAuth();
  const router = useRouter();

  // If user is already logged in, redirect
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.replace('/(admin)');
      else if (user.role === 'teacher') router.replace('/(teacher)');
      else router.replace('/(student)');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password.trim());
      // Navigation is handled by useEffect above
    } catch (e: any) {
      setError(e?.message ?? 'Identifiant ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header gradient area */}
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Ionicons name="school" size={52} color={colors.white} />
          </View>
          <Text style={styles.schoolName}>Lycée Jean Piaget</Text>
          <Text style={styles.headerSubtitle}>Système de Gestion Scolaire</Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Connexion</Text>
          <Text style={styles.formSubtitle}>Entrez vos identifiants pour accéder à votre espace</Text>

          <View style={styles.formFields}>
            <Input
              label="Email ou Matricule"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="ex: ADM001 ou email@piaget.edu"
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Votre mot de passe"
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
              secureTextEntry
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              variant="primary"
              fullWidth
              onPress={handleLogin}
              loading={isSubmitting}
            >
              Se connecter
            </Button>
          </View>
        </View>

        {/* Test accounts info */}
        <View style={styles.testCard}>
          <View style={styles.testHeader}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.testTitle}>Comptes de démonstration</Text>
          </View>
          <View style={styles.testRow}>
            <View style={[styles.roleDot, { backgroundColor: colors.success }]} />
            <Text style={styles.testLabel}>Admin:</Text>
            <Text style={styles.testValue}>ADM001 / admin123</Text>
          </View>
          <View style={styles.testRow}>
            <View style={[styles.roleDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.testLabel}>Prof:</Text>
            <Text style={styles.testValue}>PRF001 / prof123</Text>
          </View>
          <View style={styles.testRow}>
            <View style={[styles.roleDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.testLabel}>Élève:</Text>
            <Text style={styles.testValue}>ETU001 / etu123</Text>
          </View>

          <View style={styles.quickLoginRow}>
            {[
              { label: 'Admin', id: 'ADM001', pwd: 'admin123', color: colors.success },
              { label: 'Prof', id: 'PRF001', pwd: 'prof123', color: colors.primary },
              { label: 'Élève', id: 'ETU001', pwd: 'etu123', color: colors.warning },
            ].map((acc) => (
              <TouchableOpacity
                key={acc.label}
                style={[styles.quickBtn, { borderColor: acc.color }]}
                onPress={() => {
                  setIdentifier(acc.id);
                  setPassword(acc.pwd);
                }}
              >
                <Text style={[styles.quickBtnText, { color: acc.color }]}>{acc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  schoolName: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xxl,
    marginHorizontal: spacing.md,
    marginTop: -24,
    padding: spacing.lg,
    ...shadows.md,
  },
  formTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  formFields: {
    gap: spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorTint,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  testCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  testTitle: {
    ...typography.captionBold,
    color: colors.primaryDark,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  testLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 40,
  },
  testValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600' as const,
  },
  quickLoginRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  quickBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  quickBtnText: {
    ...typography.captionBold,
  },
});
