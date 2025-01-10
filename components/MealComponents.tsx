import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { Ionicons as Icon } from '@expo/vector-icons';
import { Meal } from '@/store/useMealStore';

const SWIPE_THRESHOLD = -75;

interface MealItemProps {
  item: Meal;
  title: string;
  onTrack: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
}

const SCREEN_WIDTH = Dimensions.get("screen").width

const MealItem: React.FC<MealItemProps> = ({ item, onTrack, onRemove, title }) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(80);
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

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'snack':
        return 'cafe-outline';
      case 'dinner':
        return 'moon-outline';
      default:
        return 'nutrition-outline';
    }
  };

  return (
    <Animated.View style={[styles.mealItem, rContainerStyle]}>
      <View style={styles.deleteIconContainer}>
        <Animated.View style={rIconContainerStyle}>
          <Icon name="trash-outline" size={24} color="white" />
        </Animated.View>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.mealItemContent, rStyle]}>
          <View style={styles.mealItemIcon}>
            <Icon name={getMealIcon(title)} size={24} color="#1db954" />
          </View>
          <View style={styles.mealItemInfo}>
            <Text style={styles.mealItemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.mealItemMacros}>
              {item.calories} cal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.trackButton, item.tracked && styles.trackedButton]} 
            onPress={() => {
              if(!item.tracked){
                onTrack(item);
              }
            }}
          >
            <Icon 
              name={item.tracked ? "checkmark-outline" : "add-outline"} 
              size={20} 
              color="white" 
            />
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

const MealSection: React.FC<MealSectionProps> = ({ title, items, onTrack, onRemove }) => {
  return (
    <View style={styles.mealContainer}>
      <Text style={styles.mealTitle}>{title}</Text>
      <ScrollView style={styles.mealItemsContainer}>
        {items.map((item) => (
          <MealItem key={item.id} title={title} item={item} onTrack={onTrack} onRemove={onRemove} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mealContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#2d3436',
    textTransform: 'capitalize',
  },
  mealItemsContainer: {
    maxHeight: 300,
  },
  mealItem: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
    overflow: 'hidden',
  },
  mealItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    minHeight: 80,
  },
  mealItemIcon: {
    marginRight: 15,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: 12,
    padding: 10,
  },
  mealItemInfo: {
    flex: 1,
    marginRight: 10,
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
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackedButton: {
    backgroundColor: '#4cd3c2',
  },
  deleteIconContainer: {
    position: 'absolute',
    right: 0,
    height: '100%',
    width: 75,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    backgroundColor: '#ff6b6b',
  },
});

export { MealItem, MealSection };

