import React from 'react';
import { StyleSheet, Switch, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../../fonts';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type SwitchRowProps = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon?: IoniconName;
    description?: string;
    disabled?: boolean;
};

const SwitchRow = ({ label, value, onValueChange, icon, description, disabled = false }: SwitchRowProps) => (
    <TouchableOpacity
        style={[styles.row, disabled && styles.rowDisabled]}
        onPress={() => onValueChange(!value)}
        activeOpacity={0.6}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
    >
        {icon ? (
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={20} color="#1F2937" />
            </View>
        ) : null}

        <View style={styles.texts}>
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
            {description ? (
                <Text style={styles.description}>{description}</Text>
            ) : null}
        </View>

        <Switch
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            trackColor={{ false: '#E5E7EB', true: '#00B763' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
        />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    rowDisabled: {
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
        color: '#1F2937',
    },
    description: {
        marginTop: 2,
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: '#6B7280',
    },
});

export default SwitchRow;