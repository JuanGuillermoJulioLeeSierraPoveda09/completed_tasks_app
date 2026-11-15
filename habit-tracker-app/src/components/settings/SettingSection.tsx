import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../../../fonts';
import { useTheme } from '../../theme/useTheme';
import type { ThemeColors } from '../../theme/colors';

type SettingsSectionProps = {
    title: string;
    children: React.ReactNode;
    dividerInset?: number;
};

const SettingsSection = ({ title, children, dividerInset = 56 }: SettingsSectionProps) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const rows = React.Children.toArray(children);

    return (
        <View style={styles.section}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.card}>
                {rows.map((row, index) => (
                    <React.Fragment key={index}>
                        {index > 0 ? <View style={[styles.divider, { marginLeft: dividerInset }]} /> : null}
                        {row}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
};

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        section: {
            marginBottom: 24,
        },
        title: {
            fontSize: 12,
            fontFamily: FONTS.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginLeft: 16,
            marginBottom: 8,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            overflow: 'hidden',
        },
        divider: {
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
        },
    });

export default SettingsSection;