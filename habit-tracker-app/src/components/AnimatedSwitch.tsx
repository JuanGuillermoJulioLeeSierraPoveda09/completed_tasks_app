import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';

type AnimatedSwitchProps = {
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
    activeColor?: string;
    inactiveColor?: string;
};

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 26;
const PADDING = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;
const DURATION = 200;
const THUMB_COLOR = '#FFFFFF';

const AnimatedSwitch = ({
    value,
    onValueChange,
    disabled = false,
    activeColor,
    inactiveColor,
}: AnimatedSwitchProps) => {
    const { colors } = useTheme();
    const trackOnColor = activeColor ?? colors.primary;
    const trackOffColor = inactiveColor ?? colors.inactive;
    const progress = useSharedValue(value ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(value ? 1 : 0, { duration: DURATION });
    }, [value]);

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(progress.value, [0, 1], [trackOffColor, trackOnColor]),
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: progress.value * THUMB_TRAVEL }],
    }));

    return (
        <Pressable
            onPress={() => onValueChange(!value)}
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="switch"
            accessibilityState={{ checked: value, disabled }}
        >
            <Animated.View style={[styles.track, trackStyle]}>
                <Animated.View style={[styles.thumb, thumbStyle]} />
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    track: {
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        padding: PADDING,
        justifyContent: 'center',
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: THUMB_COLOR,
        shadowColor: '#000000',
        shadowOpacity: 0.15,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
});

export default AnimatedSwitch;