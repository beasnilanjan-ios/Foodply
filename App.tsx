import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/Screens/SplashScreen';
import Banner from './src/Screens/Banner';
import Login from './src/Screens/Login';
import MainScreen from './src/GlobalContainer/MainScreen';
import Orders from './src/Screens/Orders';
import OrderDetails from './src/Screens/OrderDetails';
import DrawerScreenContainer from './src/GlobalContainer/DrawerScreenContainer';
import ViewAll from './src/Screens/ViewAll';
import GlobalLoginAuth from './src/GlobalContainer/GlobalLoginAuth'; // ✅ ADD THIS
import { RestaurantMenuItemModel } from './src/Models/RestaurantMenuModel';
import DeliveryDashboard from './src/Screens/DeliveryDashboard';
import DeliveryOrders from './src/Screens/DeliveryOrder';
import DeliveryProfile from './src/Screens/DeliveryProfile';
import DeliveryOrderDetail from './src/Screens/DeliveryOrderDetail';
import { DeliveryOrderDetails } from './src/Models/DeliveryOrderDetails/DeliveryOrderDetails';
import DeliveryStart from './src/Screens/DeliveryStart';
import MenuDetails from './src/Screens/MenuDetails';
import Cart from './src/Screens/Cart';
import Address from './src/Screens/DeliveryAddress'; 
import OrderConfirmed from './src/Screens/OrderConfirmed'; 
import DeliveryOtpVerification from './src/Screens/DeliveryOtpVerification';
import Favorites from './src/Screens/Favorites'; // adjust path if needed
import SearchScreen, { SearchScope } from './src/Screens/SearchScreen';
import Trackorder from './src/Screens/Trackorder';
import DeliveryAddressList from './src/Screens/DeliveryAddressList';
import MyProfile from './src/Screens/MyProfile';
import Registration from './src/Screens/Registration';
import ForgotPassword from './src/Screens/ForgotPassword';

export type RootStackParamList = {
  Splash: undefined;
  Banner: undefined;
  Login: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
  DeliveryAddressList: undefined
  Dashboard: { fromTab?: boolean } | undefined;
  Orders: { fromTab?: boolean } | undefined;
  OrderDetails: { orderId: number; isReOrder?: boolean };
  Favorites: { fromTab?: boolean } | undefined;
  Search: {
    scope: SearchScope;
    restaurantId?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    menuItems?: RestaurantMenuItemModel[];
  };
  MyProfile: undefined;
  ViewAll:
    | {
        bestSellerItems?: RestaurantMenuItemModel[];
        restaurantId?: number | null;
        latitude?: number | null;
        longitude?: number | null;
      }
    | undefined;
  Trackorder: { orderId?: number; fromTab?: boolean } | undefined;
  MenuDetails:
    | {
        item?: RestaurantMenuItemModel;
        restaurantId?: number | null;
        latitude?: number | null;
        longitude?: number | null;
      }
    | undefined;
  Cart: undefined; // ✅ ADD THIS
  Address: undefined; // ✅ ADD THIS
  OrderConfirmed: { orderId?: number } | undefined;
  DeliveryDashboard: undefined;
  DeliveryOrders: undefined;
  DeliveryProfile: undefined;
  DeliveryOrderDetail: { orderId: string; from: string } | undefined;
  DeliveryStart: { orderDetail: DeliveryOrderDetails } | undefined;
  DeliveryOtpVerification: { orderDetail: DeliveryOrderDetails, otp: string } | undefined; // ✅ ADD THIS
};

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  // ✅ CHECK TOKEN ON APP START
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await GlobalLoginAuth.loadAuthData();
        console.log('role', GlobalLoginAuth.user?.role);
        if (GlobalLoginAuth.accessToken) {
          if (GlobalLoginAuth.user?.role === 'customer') {    
          setInitialRoute('Dashboard'); // ✅ go directly to dashboard
          } else if (GlobalLoginAuth.user?.role === 'delivery_boy') {
            setInitialRoute('DeliveryDashboard'); // ✅ go directly to delivery dashboard 
          } else {
            setInitialRoute('Banner'); // ✅ normal flow for logout users or other roles
          }
        } else {
          setInitialRoute('Banner'); // ✅ normal flow
         // setInitialRoute('Dashboard');
        }
      } catch (error) {
        console.log('Auth check error:', error);
        setInitialRoute('Banner');
      }
    };

    checkAuth();
  }, []);

  // ✅ SHOW LOADER UNTIL DECIDED
  if (!initialRoute) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute} // ✅ DYNAMIC ROUTE
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />

          <Stack.Screen
            name="Banner"
            component={Banner}
            options={{ animation: 'none' }}
          />

          <Stack.Screen name="Login" component={Login} />

          <Stack.Screen name="Registration" component={Registration} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

          <Stack.Screen
            name="Dashboard"
            component={MainScreen}
            options={({ route }) => ({
              animation: route.params?.fromTab ? 'none' : 'default',
            })}
          />

          <Stack.Screen
            name="Orders"
            options={({ route }) => ({
              animation: route.params?.fromTab ? 'none' : 'default',
            })}
          >
            {props => (
              <DrawerScreenContainer navigation={props.navigation}>
                {drawerNavigation => (
                  <Orders
                    navigation={drawerNavigation}
                    onMenuPress={() => drawerNavigation.openDrawer?.()}
                  />
                )}
              </DrawerScreenContainer>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetails}
            options={{ animation: 'none' }}
          />
          <Stack.Screen
            name="ViewAll"
            component={ViewAll}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="Trackorder"
            component={Trackorder}
            options={{ animation: 'none' }}
           
          />

          <Stack.Screen
            name="MenuDetails"
            component={MenuDetails}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="DeliveryOrders"
            component={DeliveryOrders}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="Cart"
            component={Cart}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="Address"
            component={Address}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="DeliveryAddressList"
            component={DeliveryAddressList}
            options={{ animation: 'none' }}
          />
          
          <Stack.Screen
            name="OrderConfirmed"
            component={OrderConfirmed}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="DeliveryDashboard"
            component={DeliveryDashboard}
            options={{ animation: 'none' }}
          />
          <Stack.Screen
            name="DeliveryProfile"
            component={DeliveryProfile}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="MyProfile"
            component={MyProfile}
            options={{ animation: 'none' }}
          />
          <Stack.Screen
            name="DeliveryOrderDetail"
            component={DeliveryOrderDetail}
            options={{ animation: 'none' }}
           
          />
          <Stack.Screen
            name="DeliveryStart"
            component={DeliveryStart}
            options={{ animation: 'none' }}
          />
          <Stack.Screen
            name="DeliveryOtpVerification"
            component={DeliveryOtpVerification}
            options={{ animation: 'none' }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ animation: 'none' }}
          />
          <Stack.Screen
            name="Favorites"
            options={{ animation: 'none' }}
          >
            {props => (
              <DrawerScreenContainer navigation={props.navigation}>
                {drawerNavigation => (
                  <Favorites navigation={drawerNavigation} />
                )}
              </DrawerScreenContainer>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
// new change
export default App;