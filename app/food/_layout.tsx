import { Stack } from "expo-router";

export default function Food(){
    return <Stack screenOptions={{
        headerShown:false
    }}>
        <Stack.Screen name="index"/>
        <Stack.Screen name="info"/>
        <Stack.Screen name="search"/>
        <Stack.Screen name="scan" options={{
            animation:"slide_from_bottom"
        }}/>

    </Stack>
}