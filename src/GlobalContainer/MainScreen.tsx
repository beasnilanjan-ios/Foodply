import React, { useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import Dashboard from '../Screens/Dashboard';
import CustomDrawer from './CustomDrawer';

export default function MainScreen({ navigation }: any) {
  const [open, setOpen] = useState(false);
  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !open &&
          gestureState.x0 <= 35 &&
          gestureState.dx > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 45 || gestureState.vx > 0.35) {
            setOpen(true);
          }
        },
      }),
    [open],
  );

  return (
    <View style={styles.container} {...swipeResponder.panHandlers}>
      <Dashboard
        navigation={navigation}
        openDrawer={() => setOpen(true)}
      />

      {open && (
        <View style={styles.drawerLayer}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
          <View style={styles.drawer}>
            <CustomDrawer
              navigation={navigation}
              closeDrawer={() => setOpen(false)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  drawerLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  drawer: {
    width: 300,
    height: '100%',
  },
});
