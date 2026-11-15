import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../../fonts';
import { useTheme } from '../../theme/useTheme';
import type { ThemeColors } from '../../theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type SettingsRowProps = {
    label: string;
    onPress: () => void;
    icon?: IoniconName;
    value?: string;
    disabled?: boolean;
};

const SettingsRow = ({ label, onPress, icon, value, disabled = false }: SettingsRowProps) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed, disabled && styles.rowDisabled]}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            {icon ? (
                <View style={styles.iconBox}>
                    <Ionicons name={icon} size={20} color={colors.text} />
                </View>
            ) : null}
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
            {value ? <Text style={styles.value} numberOfLines={1}>{value}</Text> : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
    );
};

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
        rowPressed: {
            opacity: 0.6,
        },
        rowDisabled: {
            opacity: 0.4,
        },
        iconBox: {
            width: 28,
            alignItems: 'center',
        },
        label: {
            flex: 1,
            fontSize: 16,
            fontFamily: FONTS.medium,
            color: colors.text,
        },
        value: {
            fontSize: 14,
            fontFamily: FONTS.regular,
            color: colors.textSecondary,
        },
    });

export default SettingsRow;