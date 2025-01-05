import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressBar } from '@/components/ProgressBar';
import { router, useLocalSearchParams } from 'expo-router';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNutritionProfile } from '@/hooks/useNutrition';
import useMealStore from '@/store/useMealStorage';
import { FoodData } from '@/types/food';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NutritionItemProps = {
    label: string;           
    value: number | string;  
    unit: string;            
    color: string;           
    icon: any;               
    percentage: number;      
  };

export default function FoodDetailScreen() {
  const mealStore = useMealStore()
  const scrollY = useSharedValue(0);
  const headerHeight = 300;
  const {shouldIEat} = useNutritionProfile()
  const {foodData} = useLocalSearchParams()
  const food_data: FoodData = JSON.parse(foodData as string)
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, headerHeight],
      [headerHeight, 80],
      Extrapolation.CLAMP
    ),
  }));

  
  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, headerHeight / 2],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, headerHeight],
          [1, 0.5],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [headerHeight / 2, headerHeight],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [headerHeight / 2, headerHeight],
          [20, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const nutritionValues = [
    { label: 'Calories', value: food_data.nutritionalContent.calories, unit: 'kcal', color: '#FF6B6B', icon: 'flame', percentage: 26 },
    { label: 'Protein', value: food_data.nutritionalContent.protein, unit: 'g', color: '#4ECDC4', icon: 'barbell', percentage: 68 },
    { label: 'Carbs', value: food_data.nutritionalContent.carbs, unit: 'g', color: '#45B7D1', icon: 'fast-food', percentage: 5 },
    { label: 'Fat', value: food_data.nutritionalContent.fat, unit: 'g', color: '#FFA07A', icon: 'water', percentage: 32 },
  ];

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if(!food_data || !food_data.isFood){
      router.back()
    }
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const shouldIEatCallback = async()=>{
    const data = await AsyncStorage.getItem("nutrition_profile_data")
    await shouldIEat.mutateAsync({
      nutritionProfile:data as any,
      foodInfo:{
        name:food_data.name,
        nutritionalContent:food_data.nutritionalContent,
        quantity:food_data.quantity
      }
    })
    
  }

  useEffect(()=>{
    shouldIEatCallback()
  },[])

  return (
      <View style={styles.container}>
        <Animated.View style={[styles.header, headerStyle]}>
          <AnimatedLinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.Image
            source={{ uri: food_data.imageUrl }}
            style={[styles.image, imageStyle]}
          />
          <View style={styles.headerContent}>
            <Pressable onPress={()=>{
              router.back()
            }} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <Animated.Text style={[styles.headerTitle, titleStyle]}>{food_data.name}</Animated.Text>
          </View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{food_data.name}</Text>
            <View style={styles.quantityContainer}>
              <Ionicons name="restaurant" size={18} color="#666" />
              <Text style={styles.quantity}>{food_data.quantity}</Text>
            </View>

            <View style={styles.nutritionContainer}>
              {nutritionValues.map((item, index) => (
                <NutritionItem key={index} {...item} />
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="information-circle" size={24} color="#333" />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.description}>
                {food_data.description}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="nutrition" size={24} color="#333" />
                <Text style={styles.sectionTitle}>Should I eat?</Text>
              </View>
              <Text style={styles.adviceText}>
                {shouldIEat.data?.data.suggestions}
              </Text>
            </View>

            <Pressable onPress={()=>{
              mealStore.addMeal(
                {
                  id:Math.random().toString(36),
                  name:food_data.name,
                  calories:food_data.nutritionalContent.calories,
                  protein:food_data.nutritionalContent.protein,
                  fat:food_data.nutritionalContent.fat,
                  carbs:food_data.nutritionalContent.carbs,
                  serving:food_data.quantity,
                  tracked:true
                }
              )
              router.back()
            }} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add to My Meals</Text>
            </Pressable>
          </View>
        </Animated.ScrollView>
      </View>
  );
}

const NutritionItem:React.FC<NutritionItemProps>=({ label, value, unit, color, icon, percentage })=> {
  return (
    <View style={styles.nutritionItem}>
      <View style={styles.nutritionHeader}>
        <View style={styles.nutritionIconContainer}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.nutritionLabel}>{label}</Text>
        <Text style={styles.nutritionValue}>{value}<Text style={styles.nutritionUnit}>{unit}</Text></Text>
      </View>
      <ProgressBar progress={percentage} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 44,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop:12
  },
  contentContainer: {
    paddingTop: 300,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantity: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
  },
  nutritionContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  nutritionItem: {
    marginBottom: 16,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  adviceText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

