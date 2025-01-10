import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Keyboard } from 'react-native';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {
  Canvas,
  Group,
  Paint,
  Path,
  Skia,
  BlurMask,
} from "@shopify/react-native-skia";
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useFileUpload } from '@/hooks/useFileUpload';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { router, Stack } from 'expo-router';
import { useDetectFood, useDetectFoodFromText } from '@/hooks/useFood';
import FoodSearchBottomSheet, {FoodSearchBottomSheetRef} from '@/components/FoodSearchSheet';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';


export default function FoodScanner() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [photo, setPhoto] = useState<string>()
  const cameraRef = useRef<CameraView>(null);
  const { uploadFile, isUploading, uploadProgress, error } = useFileUpload();
  const detectFood = useDetectFood();
  const bottomSheetRef = useRef<FoodSearchBottomSheetRef>(null);
  const detectFoodFromText = useDetectFoodFromText()

  const handleOpenBottomSheet = () => {
    bottomSheetRef.current?.open();
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();

    Keyboard.dismiss()
  };

  const handleTextSearch = async(foodName: string, foodQuantity: string) => {
    handleCloseBottomSheet()
    Keyboard.dismiss()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    await detectFoodFromText.mutateAsync({
      name:foodName,
      quantity:foodQuantity
    })
    // Implement your search logic here
  };


  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Upload Error', error.message);
    }
  }, [error]);

  useEffect(() => {
    if (detectFood.isSuccess) {
      // Store the detection result in a global state or context
      // For example, you could use React Context or a state management library like Redux
      // For simplicity, we'll use React Navigation to pass the data to the next screen
      router.replace({
        pathname: "/food/info",
        params: { foodData: JSON.stringify({...detectFood.data, imageUrl:photo}) }
      });
    } else if (detectFood.isError) {
      Alert.alert('Error', 'Failed to detect food. Please try again.');
    }
  }, [detectFood.isSuccess, detectFood.isError, detectFood.data]);

  useEffect(() => {
    if (detectFoodFromText.isSuccess) {
      // Store the detection result in a global state or context
      // For example, you could use React Context or a state management library like Redux
      // For simplicity, we'll use React Navigation to pass the data to the next screen
      router.replace({
        pathname: "/food/info",
        params: { foodData: JSON.stringify({...detectFoodFromText.data, imageUrl:"https://static.vecteezy.com/system/resources/previews/000/223/249/non_2x/ketogenic-diet-food-vector.jpg"}) }
      });
    } else if (detectFood.isError) {
      Alert.alert('Error', 'Failed to detect food. Please try again.');
    }
  }, [detectFoodFromText.isSuccess, detectFoodFromText.isError, detectFoodFromText.data]);

  const loadSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/shutter.mp3')
    );
    setSound(sound);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Frame dimensions
  const frameWidth = 280;
  const frameHeight = 280;
  const cornerRadius = 24;
  const strokeWidth = 10;
  const emphasizedCornerLength = 40;

  // Create the frame path
  const createFramePath = () => {
    const path = Skia.Path.Make();
    
    // Helper function to create a rounded corner
    const addCorner = (x: number, y: number, startAngle: number, sweepAngle: number) => {
      path.addArc(
        { x: x - cornerRadius, y: y - cornerRadius, width: cornerRadius * 2, height: cornerRadius * 2 },
        startAngle,
        sweepAngle
      );
    };

    // Top left corner
    path.moveTo(cornerRadius, 0);
    path.lineTo(emphasizedCornerLength, 0);
    path.moveTo(0, cornerRadius);
    path.lineTo(0, emphasizedCornerLength);
    addCorner(cornerRadius, cornerRadius, 180, 90);

    // Top right corner
    path.moveTo(frameWidth - emphasizedCornerLength, 0);
    path.lineTo(frameWidth - cornerRadius, 0);
    path.moveTo(frameWidth, cornerRadius);
    path.lineTo(frameWidth, emphasizedCornerLength);
    addCorner(frameWidth - cornerRadius, cornerRadius, 270, 90);

    // Bottom right corner
    path.moveTo(frameWidth, frameHeight - emphasizedCornerLength);
    path.lineTo(frameWidth, frameHeight - cornerRadius);
    path.moveTo(frameWidth - emphasizedCornerLength, frameHeight);
    path.lineTo(frameWidth - cornerRadius, frameHeight);
    addCorner(frameWidth - cornerRadius, frameHeight - cornerRadius, 0, 90);

    // Bottom left corner
    path.moveTo(emphasizedCornerLength, frameHeight);
    path.lineTo(cornerRadius, frameHeight);
    path.moveTo(0, frameHeight - emphasizedCornerLength);
    path.lineTo(0, frameHeight - cornerRadius);
    addCorner(cornerRadius, frameHeight - cornerRadius, 90, 90);

    return path;
  };

  const captureImage = async () => {
    if (cameraRef.current) {
      try {
        if (sound) {
          await sound.stopAsync();
          await sound.setPositionAsync(0);
          await sound.playAsync();
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
        const photo = await cameraRef.current.takePictureAsync({ shutterSound: false, quality: 0.2 });
        if (photo?.uri) {
          try {
            const result = await uploadFile(photo.uri);
            const downloadUrl = result.downloadUrl
            if (downloadUrl) {
              await detectFood.mutateAsync(downloadUrl);
              setPhoto(downloadUrl)
            }
          } catch (error) {
            console.error('Failed to upload image:', error);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
          }
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const uploadResult = await uploadFile(result.assets[0].uri);
        if (uploadResult?.downloadUrl) {
          await detectFood.mutateAsync(uploadResult.downloadUrl);
          setPhoto(uploadResult.downloadUrl)
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
      }
    } else {
    }
  };

  return (
    <BottomSheetModalProvider>
    <View style={styles.container}>
      <FoodSearchBottomSheet
            ref={bottomSheetRef}
            onSearch={handleTextSearch}
            onClose={handleCloseBottomSheet}
          />
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Nutraflex</Text>
          <Ionicons
            name='search'
            onPress={handleOpenBottomSheet}
            size={24}
            color={"white"}
          />
        </View>
        
        <View style={styles.overlay}>
          <Canvas style={styles.canvas}>
            <Group>
              <Paint>
                <BlurMask blur={2} style="solid" />
              </Paint>
              {/* Main frame */}
              <Path
                path={createFramePath()}
                strokeWidth={strokeWidth}
                style="stroke"
                color="white"
              />
            </Group>
          </Canvas>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.iconButton} onPress={openImageLibrary} disabled={isUploading || detectFood.isPending}>
            <Ionicons name="images-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={captureImage} disabled={isUploading || detectFood.isPending}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
              router.back()
            }}
            disabled={isUploading || detectFood.isPending}
          >
            <Entypo name="cross" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {(isUploading || detectFood.isPending || detectFoodFromText.isPending) && (
          <LoadingOverlay message={isUploading ? "Uploading..." : "Detecting food..."} />
        )}
      </CameraView>
    </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: 280,
    height: 280,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
});

