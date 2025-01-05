import { Stack } from "expo-router";

export default function Food(){
    return <Stack screenOptions={{
        headerShown:false
    }}>
        <Stack.Screen name="index"/>
        <Stack.Screen name="details"/>
    </Stack>
}