import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { TextInput, Text, Switch, Chip, RadioButton } from 'react-native-paper';
import { useForm, Controller, Control, FieldValues } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  FadeInDown, 
  FadeInUp,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNutritionProfile } from '@/hooks/useNutrition';
import { NutritionProfile } from '@/types/nutrition';
import { router } from 'expo-router';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import useAuthStore from '@/store/useAuthStore';
import { useAuth } from '@/hooks/useAuthentication';

const { width } = Dimensions.get('window');

const dietaryRestrictionOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Kosher', 'Halal', 'Keto', 'Paleo'
];

const commonAllergies = [
  'Milk', 'Eggs', 'Fish', 'Shellfish',
  'Tree Nuts', 'Peanuts', 'Wheat', 'Soy'
];

interface CustomInputProps {
  label: string;
  error?: boolean;
  [key: string]: any;
}

const CustomInput: React.FC<CustomInputProps> = ({ label, error, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      mode="outlined"
      outlineColor="#f5f5f5"
      activeOutlineColor="#000"
      style={styles.input}
      error={error}
      {...props}
    />
  </View>
);

interface CustomSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ label, value, onValueChange }) => (
  <View style={styles.switchContainer}>
    <Text style={styles.switchLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      color="#000"
    />
  </View>
);

interface FormData {
  age: string;
  height: string;
  weight: string;
  gender: string;
  dietaryRestrictions: boolean;
  selectedRestrictions: string[];
  allergies: boolean;
  selectedAllergies: string[];
  otherAllergies: string;
  activityLevel: string;
  goal: string;
}

export {
  FormData as UserDetailsData
}

export default function NutritionProfileForm() {
  const {updateNutritionProfile} = useNutritionProfile()
  const [loading, setLoading] = useState(false)
  const {logout} = useAuth()
  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      age: '',
      height: '',
      weight: '',
      gender: '',
      dietaryRestrictions: false,
      selectedRestrictions: [],
      allergies: false,
      selectedAllergies: [],
      otherAllergies: '',
      activityLevel: '',
      goal: ''
    }
  });

  const hasDietaryRestrictions = watch('dietaryRestrictions');
  const hasAllergies = watch('allergies');
  const {response} = useAuthStore()

  const onSubmit = async(data: FormData) => {
    try{
      setLoading(true)
    const userId = response?.user.id
    if(!userId){
      return
    }
    const formattedData:NutritionProfile = {
      userId:userId,
      age:parseInt(data.age),
      height:parseInt(data.height),
      weight:parseInt(data.weight),
      gender:data.gender,
      dietary_restrictions:data.dietaryRestrictions,
      selected_restrictions:data.selectedRestrictions,
      allergies:data.allergies,
      selected_allergies:data.selectedAllergies,
      other_allergies:data.otherAllergies,
      activity_level:data.activityLevel,
      goal:data.goal
    }
    await updateNutritionProfile(formattedData)
    router.replace("/food")
  }
  catch(err){
    Alert.alert("Creation Error", "Cannot create profile of the user.")
  }
  finally{
    setLoading(false)
  }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeInDown.duration(1000).springify()}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>Nutrition Profile</Text>
          <Text style={styles.subtitle}>Let's customize your experience</Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.duration(1000).delay(400).springify()}
          style={styles.formContainer}
        >
          <Controller
            control={control}
            rules={{ required: 'Age is required' }}
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Age"
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
                error={!!errors.age}
                placeholder="Enter your age"
              />
            )}
            name="age"
          />

          <Controller
            control={control}
            rules={{ required: 'Height is required' }}
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Height (cm)"
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
                error={!!errors.height}
                placeholder="Enter your height"
              />
            )}
            name="height"
          />

          <Controller
            control={control}
            rules={{ required: 'Weight is required' }}
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Weight (kg)"
                onChangeText={onChange}
                value={value}
                keyboardType="numeric"
                error={!!errors.weight}
                placeholder="Enter your weight"
              />
            )}
            name="weight"
          />

          <Controller
            control={control}
            rules={{ required: 'Gender is required' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender</Text>
                <RadioButton.Group onValueChange={onChange} value={value}>
                  <View style={styles.radioGroup}>
                    <View style={styles.radioButton}>
                      <RadioButton value="male" />
                      <Text>Male</Text>
                    </View>
                    <View style={styles.radioButton}>
                      <RadioButton value="female" />
                      <Text>Female</Text>
                    </View>
                  </View>
                </RadioButton.Group>
              </View>
            )}
            name="gender"
          />

          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSwitch
                label="Do you have any dietary restrictions?"
                value={value}
                onValueChange={onChange}
              />
            )}
            name="dietaryRestrictions"
          />

          {hasDietaryRestrictions && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.optionsContainer}>
              <Text style={styles.optionsLabel}>Select your dietary restrictions:</Text>
              <Controller
                control={control}
                name="selectedRestrictions"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.chipGroup}>
                    {dietaryRestrictionOptions.map((restriction) => (
                      <Chip
                        key={restriction}
                        selected={value.includes(restriction)}
                        onPress={() => {
                          const newValue = value.includes(restriction)
                            ? value.filter(v => v !== restriction)
                            : [...value, restriction];
                          onChange(newValue);
                        }}
                        style={styles.chip}
                        selectedColor="#fff"
                        showSelectedOverlay
                        textStyle={styles.chipText}
                      >
                        {restriction}
                      </Chip>
                    ))}
                  </View>
                )}
              />
            </Animated.View>
          )}

          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <CustomSwitch
                label="Do you have any food allergies?"
                value={value}
                onValueChange={onChange}
              />
            )}
            name="allergies"
          />

          {hasAllergies && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.optionsContainer}>
              <Text style={styles.optionsLabel}>Select your allergies:</Text>
              <Controller
                control={control}
                name="selectedAllergies"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.chipGroup}>
                    {commonAllergies.map((allergy) => (
                      <Chip
                        key={allergy}
                        selected={value.includes(allergy)}
                        onPress={() => {
                          const newValue = value.includes(allergy)
                            ? value.filter(v => v !== allergy)
                            : [...value, allergy];
                          onChange(newValue);
                        }}
                        style={styles.chip}
                        selectedColor="#fff"
                        showSelectedOverlay
                        textStyle={styles.chipText}
                      >
                        {allergy}
                      </Chip>
                    ))}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="otherAllergies"
                render={({ field: { onChange, value } }) => (
                  <CustomInput
                    label="Other allergies"
                    onChangeText={onChange}
                    value={value}
                    placeholder="Enter any other allergies"
                  />
                )}
              />
            </Animated.View>
          )}

          <Controller
            control={control}
            rules={{ required: 'Activity level is required' }}
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Activity Level"
                onChangeText={onChange}
                value={value}
                error={!!errors.activityLevel}
                placeholder="Describe your activity level"
              />
            )}
            name="activityLevel"
          />

          <Controller
            control={control}
            rules={{ required: 'Goal is required' }}
            render={({ field: { onChange, value } }) => (
              <CustomInput
                label="Goal"
                onChangeText={onChange}
                value={value}
                error={!!errors.goal}
                placeholder="Describe your ultimate goal"
              />
            )}
            name="goal"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={logout}>
            <Text style={styles.submitButtonText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      {loading && <LoadingOverlay
        message='Creating Profile...'
      />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
    marginRight: 10,
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
    fontWeight: '600',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginHorizontal: -4,
  },
  chip: {
    margin: 4,
    backgroundColor: '#f5f5f5',
  },
  chipText: {
    color: '#1a1a1a',
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

