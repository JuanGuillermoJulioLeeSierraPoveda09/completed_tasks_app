import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from'../../../fonts';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type SettingsRowProps = {
    label: string;
    onPress: () => void;
    icon?: IoniconName;
    value?: string;
    disabled?: boolean;
};

const SettingsRow = ({ label, onPress, icon, value, disabled = false }: SettingsRowProps) => (
    <TouchableOpacity 
        style={[styles.row, disabled && styles.rowDisabled]} 
        onPress={onPress} 
        activeOpacity={0.6}
        disabled={disabled}
        accessibilityRole='button'
        accessibilityState={{ disabled }}
    >
        {icon ? (
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={20} color="#1F2937" />
            </View>
        ) : null}
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {value ? <Text style={styles.value} numberOfLines={1}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
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
        color: '#1F2937',
    },
    value: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: '#6B7280',
    },
});

export default SettingsRow;