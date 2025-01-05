import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  withTiming,
  FadeIn,
  useSharedValue,
  useAnimatedStyle
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CircularProgressProps = {
  value: number;
  maxValue: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  unit: string;
};

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value, 
  maxValue, 
  size, 
  strokeWidth, 
  color,
  label,
  unit
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const progress = useSharedValue(0);
  const displayValue = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(value, maxValue) / maxValue, { duration: 1500 });
    displayValue.value = withTiming(Math.min(value, maxValue), { duration: 1500 });
  }, [value, maxValue]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * progress.value);
    return { strokeDashoffset };
  });

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: progress.value > 0 ? 1 : 0,
  }));

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.svgContainer}>
        <Svg width={size} height={size} fill="white">
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
          
          {/* Progress Circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
            animatedProps={animatedProps}
          />
        </Svg>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Animated.Text style={[styles.value, animatedTextStyle]}>
        {displayValue.value.toFixed(1)}{unit} ({(progress.value * 100).toFixed(0)}%)
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  svgContainer: {
    transform: [{ rotate: '-90deg' }],
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

