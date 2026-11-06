import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../../../fonts';

type SettingsSectionProps = {
    title: string;
    children: React.ReactNode;
};

const SettingsSection = ({ title, children }: SettingsSectionProps) => {
    const rows = React.Children.toArray(children);

    return (
        <View style={styles.section}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.card}>
                {rows.map((row, index) => (
                    <React.Fragment key={index}>
                        {index > 0 ? <View style={styles.divider} /> : null}
                        {row}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    title: {
        fontSize: 12,
        fontFamily: FONTS.bold,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginLeft: 16,
        marginBottom: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E7EB',
        marginLeft: 56,
    },
});

export default SettingsSection;