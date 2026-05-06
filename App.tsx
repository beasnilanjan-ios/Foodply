import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/Screens/SplashScreen';
import Banner from './src/Screens/Banner';
import Login from './src/Screens/Login';
import Dashboard from './src/Screens/Dashboard';
import Orders from './src/Screens/Orders';


export type RootStackParamList = {
  Splash: undefined;
  Banner: undefined;
  Login: undefined;
  Dashboard: undefined;
  Orders: undefined;
};

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen
            name="Banner"
            component={Banner}
            options={{ animation: 'none' }}
          />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Dashboard" component={Dashboard}  options={({ route }) => ({
    animation: route.params?.fromTab ? 'none' : 'default',
  })} />
          <Stack.Screen name="Orders" component={Orders}  options={({ route }) => ({
    animation: route.params?.fromTab ? 'none' : 'default',
  })} />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;