import React, { ReactNode, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import CustomDrawer from './CustomDrawer';
import GlobalStyles from '../assets/Styles/GlobalStyles';

type DrawerScreenContainerProps = {
  navigation: any;
  children: (navigation: any) => ReactNode;
};

export default function DrawerScreenContainer({
  navigation,
  children,
}: DrawerScreenContainerProps) {
  const [open, setOpen] = useState(false);
  const drawerNavigation = useMemo(
    () => ({
      ...navigation,
      openDrawer: () => setOpen(true),
    }),
    [navigation],
  );
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
    <View style={styles.container}>
      {children(drawerNavigation)}

      <View style={styles.swipeEdge} {...swipeResponder.panHandlers} />

      {open && (
        <View style={styles.drawerLayer}>
          <Pressable
            style={GlobalStyles.backdropDim}
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

  swipeEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 35,
    zIndex: 10,
  },
});
