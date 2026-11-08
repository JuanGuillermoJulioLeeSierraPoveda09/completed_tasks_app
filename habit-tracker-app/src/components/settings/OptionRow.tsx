import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../../fonts';

type OptionRowProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
    description?: string;
};

const OptionRow = ({ label, selected, onPress, description }: OptionRowProps) => (
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
            {selected ? <Ionicons name="checkmark" size={20} color="#00B763" /> : null}
        </View>
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
    texts: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: '#1F2937',
    },
    labelSelected: {
        fontFamily: FONTS.semiBold,
    },
    description: {
        marginTop: 2,
        fontSize: 13,
        fontFamily: FONTS.regular,
        color: '#6B7280',
    },
    checkBox: {
        width: 24,
        alignItems: 'center',
    },
});

export default OptionRow;