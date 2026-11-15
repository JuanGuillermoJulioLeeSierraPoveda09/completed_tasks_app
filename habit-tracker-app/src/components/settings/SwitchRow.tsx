import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedSwitch from '../AnimatedSwitch';
import { FONTS } from '../../../fonts';
import { useTheme } from '../../theme/useTheme';
import type { ThemeColors } from '../../theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type SwitchRowProps = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon?: IoniconName;
    description?: string;
    disabled?: boolean;
};

const SwitchRow = ({ label, value, onValueChange, icon, description, disabled = false }: SwitchRowProps) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => onValueChange(!value)}
            disabled={disabled}
            accessibilityRole="switch"
            accessibilityState={{ checked: value, disabled }}
        >
            {icon ? (
                <View style={[styles.iconBox, disabled && styles.contentDisabled]}>
                    <Ionicons name={icon} size={20} color={colors.text} />
                </View>
            ) : null}

            <View style={[styles.texts, disabled && styles.contentDisabled]}>
                <Text style={styles.label} numberOfLines={1}>{label}</Text>
                {description ? (
                    <Text style={styles.description}>{description}</Text>
                ) : null}
            </View>

            <AnimatedSwitch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                activeColor={colors.primary}
                inactiveColor={colors.inactive}
            />
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
            paddingVertical: 10,
        },
        rowPressed: {
            opacity: 0.6,
        },
        contentDisabled: {
            opacity: 0.4,
        },
        iconBox: {
            width: 28,
            alignItems: 'center',
        },
        texts: {
            flex: 1,
        },
        label: {
            fontSize: 16,
            fontFamily: FONTS.medium,
            color: colors.text,
        },
        description: {
            marginTop: 2,
            fontSize: 13,
            fontFamily: FONTS.regular,
            color: colors.textSecondary,
        },
    });

export default SwitchRow;