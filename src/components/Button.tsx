import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, View, PressableProps, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { useData } from '../context/DataContext';
import { getThemeColors } from '../utils/theme';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'solid' | 'outline';
    size?: 'small' | 'medium' | 'large';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = forwardRef<View, ButtonProps>(({
    title,
    variant = 'solid',
    size = 'medium',
    leftIcon,
    rightIcon,
    style,
    ...props
}, ref) => {
    const { settings } = useData();
    const colors = getThemeColors(settings?.theme || 'light');

    const getSizeStyle = () => {
        switch (size) {
            case 'small':
                return styles.small;
            case 'large':
                return styles.large;
            default:
                return styles.medium;
        }
    };

    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.primary,
                };
            default:
                return {
                    backgroundColor: colors.primary,
                };
        }
    };

    const getTextColor = () => {
        return variant === 'outline' ? colors.primary : '#FFFFFF';
    };

    return (
        <Pressable
            ref={ref}
            style={({ pressed }) => [
                styles.button,
                getSizeStyle(),
                getVariantStyle(),
                { opacity: pressed ? 0.8 : 1 },
                style,
            ] as StyleProp<ViewStyle>}
            {...props}
        >
            <View style={styles.content}>
                {leftIcon}
                <Text 
                    variant="button" 
                    style={[
                        styles.title,
                        leftIcon ? styles.titleWithLeftIcon : null,
                        rightIcon ? styles.titleWithRightIcon : null,
                        { color: getTextColor() }
                    ]}
                >
                    {title}
                </Text>
                {rightIcon}
            </View>
        </Pressable>
    );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    small: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    medium: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    large: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    title: {
        textAlign: 'center',
    },
    titleWithLeftIcon: {
        marginLeft: 8,
    },
    titleWithRightIcon: {
        marginRight: 8,
    },
});

export { Button }; 