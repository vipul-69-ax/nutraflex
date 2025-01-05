import React, {  } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Coffee, ForkKnife } from 'lucide-react-native';
import { Meal } from '@/store/useMealStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -75;

interface MealItemProps {
  item: Meal;
  onTrack: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
}

export const MealItem: React.FC<MealItemProps> = ({ item, onTrack, onRemove }) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(70);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.min(0, Math.max(-SCREEN_WIDTH, event.translationX));
    })
    .onEnd((event) => {
      const shouldBeDismissed = translateX.value < SWIPE_THRESHOLD;
      if (shouldBeDismissed) {
        translateX.value = withSpring(-SCREEN_WIDTH);
        itemHeight.value = withSpring(0);
        opacity.value = withSpring(0, {}, (finished) => {
          if (finished) {
            runOnJS(onRemove)(item);
          }
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    opacity: opacity.value,
    marginBottom: itemHeight.value === 0 ? 0 : 10,
  }));

  const rIconContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-75, 0],
      [1, 0]
    );
    return { opacity };
  });

  return (
    <Animated.View style={[styles.mealItem, rContainerStyle]}>
      <View style={styles.deleteIconContainer}>
        <Animated.View style={rIconContainerStyle}>
          <AntDesign name="delete" size={24} color="white" />
        </Animated.View>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.mealItemContent, rStyle]}>
          <View style={styles.mealItemIcon}>
            <Coffee size={24} color="#1db954" />
          </View>
          <View style={styles.mealItemInfo}>
            <Text style={styles.mealItemName}>{item.name}</Text>
            <Text style={styles.mealItemMacros}>
              {item.calories} cal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
            </Text>
          </View>
          <TouchableOpacity style={styles.trackButton} onPress={() => {
            if(!item.tracked){
              onTrack(item);
            }
          }}>
            {item.tracked ? 
              <ForkKnife size={16} color="white" /> : 
              <AntDesign name="plus" size={16} color="white" />
            }
          </TouchableOpacity>
        </Animated.View>
          </GestureDetector>
    </Animated.View>
  );
};

interface MealSectionProps {
  title: string;
  items: Meal[];
  onTrack: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
}

export const MealSection: React.FC<MealSectionProps> = ({ title, items, onTrack, onRemove }) => {
  return (
    <View style={styles.mealContainer}>
      <Text style={styles.mealTitle}>{title}</Text>
      {items.map((item) => (
        <MealItem key={item.id} item={item} onTrack={onTrack} onRemove={onRemove} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    iconContainer: {
      flexDirection: 'row',
    },
    iconButton: {
      marginRight: 15,
    },
    titleContainer: {
      flex: 1,
      alignItems: 'flex-end',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#2d3436',
    },
    subtitle: {
      fontSize: 14,
      color: '#636e72',
      fontWeight: '500',
    },
    macroContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: 20,
      marginHorizontal: 20,
      marginTop: 10,
      borderRadius: 15,
      shadowColor: '#000',
      gap: 10,
      alignSelf: "center",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    mealsContainer: {
      padding: 20,
    },
    mealContainer: {
      marginBottom: 20,
    },
    mealTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 10,
      color: '#2d3436',
    },
    mealItem: {
      marginBottom: 10,
      borderRadius: 12,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      overflow: 'hidden',
    },
    mealItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      backgroundColor: 'white',
    },
    mealItemIcon: {
      marginRight: 15,
      backgroundColor: 'rgba(77, 208, 225, 0.1)',
      borderRadius: 8,
      padding: 8,
    },
    mealItemInfo: {
      flex: 1,
    },
    mealItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#2d3436',
      marginBottom: 4,
    },
    mealItemMacros: {
      fontSize: 12,
      color: '#636e72',
    },
    trackButton: {
      backgroundColor: '#1db954',
      borderRadius: 20,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteIconContainer: {
      position: 'absolute',
      right: 0,
      height: '100%',
      width: 75,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: 20,
      backgroundColor: 'red',
    },
  });
  
  