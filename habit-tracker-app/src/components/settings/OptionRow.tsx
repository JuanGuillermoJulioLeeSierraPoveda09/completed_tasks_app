import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../../fonts';
import { useTheme } from '../../theme/useTheme';
import type { ThemeColors } from '../../theme/colors';

type OptionRowProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
    description?: string;
};

const OptionRow = ({ label, selected, onPress, description }: OptionRowProps) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={0.6}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
        >
            <View style={styles.texts}>
                <Text style={[styles.label, selected && styles.labelSelected]}>
                    {label}
                </Text>
                {description ? (
                    <Text style={styles.description} numberOfLines={1}>
                        {description}
                    </Text>
                ) : null}
            </View>

            <View style={styles.checkBox}>
                {selected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
            </View>
        </TouchableOpacity>
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
        texts: {
            flex: 1,
        },
        label: {
            fontSize: 16,
            fontFamily: FONTS.medium,
            color: colors.text,
        },
        labelSelected: {
            fontFamily: FONTS.semiBold,
        },
        description: {
            marginTop: 2,
            fontSize: 13,
            fontFamily: FONTS.regular,
            color: colors.textSecondary,
        },
        checkBox: {
            width: 24,
            alignItems: 'center',
        },
    });

export default OptionRow;