import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import GlobalBottomBarDelivery from '../GlobalContainer/GlobalBottomBarDelivery';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import { DeliveryGlobalStyles } from '../assets/Styles/GlobalStyles';
import { DeliveryProfileData } from '../Models/DeliveryBoyProfile/DeliveryProfileData';
import GlobalApi from '../GlobalContainer/GlobalApi';
import { DeliveryProfileResponse } from '../Models/DeliveryBoyProfile/DeliveryProfileResponse';


const DeliveryProfile = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] =
      useState<DeliveryProfileData | null>(null);

  useEffect(() => {
      getProfileDetails();
  },[]);

   const getProfileDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching profile data with token:', GlobalLoginAuth.refreshToken);
        const response = await fetch(
          `${GlobalApi.baseUrl}api/deliveries/me/profile`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
            },
          }
        );
  
        const result = await response.json();
        const profileResponse = result as DeliveryProfileResponse; // ✅ Type assertion to ensure it matches our model
  
        console.log('Profile Response:', result);
  
        if (!response.ok) {
          Alert.alert('FoodyPly', result.message || 'Failed to load profile');
          return;
        }
  
        setProfileData(profileResponse.data);

  
      } catch (error) {
        console.log(error);
        Alert.alert('FoodyPly', 'Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };

  return (
     <View style={styles.container}>
      <GlobalTopBarDelivery
        navigation={navigation}
        notificationClick={() => {}}
        text={'My Profile'}
        subtitleText={'Delivery Partner'}
        isBackVisible={false}
        isOnlineVisible={true}
      />

      <View style={styles.overlay}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}> 
                {/* Customer Information */}
                <View style={styles.card}>
                    <View style={styles.customerRow}>
                    <View style={styles.customerLeft}>
                        <Image
                          source={
                            profileData?.profile?.profileImageUrl
                              ? { uri: profileData.profile.profileImageUrl }
                              : require('../assets/images/customer_image.png')
                          }
                          style={styles.profileImage}
                        />

                        <View style={styles.customerInfo}>

                        <View style={styles.customerRow}>
                            <Text style={styles.customerName}>
                                {profileData?.personalDetails?.fullName}
                            </Text>
                            <View style = {styles.actionButtons}>
                              <Image style= {[styles.verifiedIcon]} source={require('../assets/images/verified.png')} />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'center', marginRight: 10 }}>
                            <Image style= {[DeliveryGlobalStyles.icon]} source={require('../assets/images/call.png')} />
                            <Text style={styles.smallText}> {profileData?.personalDetails?.phone}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'flex-start', marginRight: 10, marginTop: 4 }}>
                            <Image style= {[DeliveryGlobalStyles.icon, {marginTop: 2}]} source={require('../assets/images/location.png')} />
                            <Text style={styles.smallText}> {profileData?.profile?.address}</Text>
                        </View>
                        </View>
                    </View>
                    </View>
                </View>

                {/* Top Stats Card */}
                <View style={styles.statsMainCard}>

                  <View style={styles.statItem}>
                    <View style={styles.iconCircle}>
                      <Image
                        style={styles.icon}
                        source={require('../assets/images/order_list.png')}
                      />
                    </View>

                    <Text style={styles.statCount}>
                      {profileData?.stats?.totalOrders || 0}
                    </Text>

                    <Text style={styles.statTitle}>Total Orders</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statItem}>
                    <View style={styles.iconCircle}>
                      <Image
                        style={[styles.icon, { width: 40, height: 35 }]}
                        source={require('../assets/images/scooter.png')}
                      />
                    </View>

                    <Text style={styles.statCount}>
                      4.9
                    </Text>

                    <Text style={styles.statTitle}>Rating</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statItem}>
                    <View style={styles.iconCircle}>
                      <Image
                        style={[styles.icon, { width: 35, height: 35 }]}
                        source={require('../assets/images/tick.png')}
                      />
                    </View>

                    <Text style={styles.statCount}>
                      {profileData?.stats?.completedOrders || 0}
                    </Text>

                    <Text style={styles.statTitle}>Completed</Text>
                  </View>

                </View> 

                {/* Personal Details */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Full Name</Text>
                    <Text style={styles.value}>
                      {profileData?.personalDetails?.fullName || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Date Of Birth</Text>
                    <Text style={styles.value}>
                      {profileData?.personalDetails?.dateOfBirth || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>
                      {profileData?.personalDetails?.email || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone Number</Text>
                    <Text style={styles.value}>
                      {profileData?.personalDetails?.phone || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Gender</Text>
                    <Text style={styles.value}>
                      {profileData?.personalDetails?.gender || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Emergency Contact</Text>
                    <Text style={styles.value}>
                      {profileData?.personalDetails?.emergencyContact || '-'}
                    </Text>
                  </View>
                </View>

                {/* Vehicle Information */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Vehicle Information</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Vehicle Type</Text>
                    <Text style={styles.value}>
                      {profileData?.vehicle?.vehicleType || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Vehicle Number</Text>
                    <Text style={styles.value}>
                      {profileData?.vehicle?.vehicleNumber || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Brand</Text>
                    <Text style={styles.value}>
                      {profileData?.vehicle?.brand || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Color</Text>
                    <Text style={styles.value}>
                      {profileData?.vehicle?.color || '-'}
                    </Text>
                  </View>
                </View>             
        </ScrollView>
      </View>
        <View style={styles.bottomContainer}>
            <GlobalBottomBarDelivery
              navigation={navigation}
              activeTab="DeliveryProfile"
            />
          </View>
          <GlobalLoader visible={loading} />
    </View>
    );
}

export default DeliveryProfile;

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingTop: 100,
  },

  overlay: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 18,
    marginTop: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignSelf: 'center',
  },

   card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    },

    cardTitle: {
    fontSize: 20,
    color: Colors.textColor,
    marginBottom: 14,
    fontFamily: FontFamily.medium,
    },

    customerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },

    customerLeft: {
        flexDirection: 'row',
        flex: 1,
        minWidth: 0,
    },

    customerInfo: {
        flex: 1,
        minWidth: 0,
        marginLeft: 12,
    },

    profileImage: {
        width: 56,
        height: 56,
        borderRadius: 14,
    },

    customerName: {
        fontSize: 20,
        color: Colors.textColor,
        fontFamily: FontFamily.medium,
    },
 
    smallText: {
        fontSize: 12,
        color: Colors.textBrown,
        fontFamily: FontFamily.regular,
        flexShrink: 1,
    },
     actionButtons: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.lightBackground,
        borderRadius: 100,
        paddingHorizontal: 10,
        height: 35,
    },

    iconButton: {
        width:30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.greenLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    verifiedIcon: {
      width: 66,
      height: 11,
      justifyContent: 'center',
      alignItems: 'center',
  },
   statsMainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },

  divider: {
    width: 2,
    height: 90,
    backgroundColor: Colors.deviderColor,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  icon: {
    height: 42,
    width: 30,
    tintColor: Colors.primary,
    padding: 4,
  },

  statCount: {
    fontSize: 30,
    color: Colors.black,
    fontFamily: FontFamily.bold,
  },

  statTitle: {
    fontSize: 15,
    color: Colors.textBrown,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },
infoCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
},

cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

sectionTitle: {
  fontSize: 18,
  fontFamily: FontFamily.medium,
  color: Colors.black,
},

editText: {
  fontSize: 14,
  color: Colors.primary,
  fontFamily: FontFamily.medium,
},

infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
},

label: {
  flex: 1,
  fontSize: 14,
  color: Colors.textBrown,
  fontFamily: FontFamily.regular,
},

value: {
  flex: 1,
  textAlign: 'right',
  fontSize: 14,
  color: Colors.black,
  fontFamily: FontFamily.medium,
},
  });