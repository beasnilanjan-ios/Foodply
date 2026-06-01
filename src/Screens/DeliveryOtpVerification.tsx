import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
import { DeliveryGlobalStyles } from '../assets/Styles/GlobalStyles';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';


const DeliveryOtpVerification = ({ route,
  navigation, }: any) => {
     const {
        orderDetail,
      }: {
        orderDetail: DeliveryOrderDetails;
      } = route.params;

      const [otp, setOtp] = useState(['', '', '', '']);
      const inputRefs = useRef<Array<TextInput | null>>([]);
      const [timer, setTimer] = useState(60);
      const [canResend, setCanResend] = useState(false);

     useEffect(() => {
        let interval: NodeJS.Timeout;

        if (timer > 0) {
          interval = setInterval(() => {
            setTimer(prev => prev - 1);
          }, 1000);
        } else {
          setCanResend(true);
        }

        return () => {
          if (interval) {
            clearInterval(interval);
          }
        };
      }, [timer]);

   const handleOtpChange = (text: string, index: number) => {
      const value = text.replace(/[^0-9]/g, '');

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input
      if (value !== '' && index < inputRefs.current.length - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 100);
      }
    };

    const handleKeyPress = (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace') {
        if (otp[index] === '' && index > 0) {
          const previousIndex = index - 1;

          setTimeout(() => {
            inputRefs.current[previousIndex]?.focus();
          }, 100);
        }
      }
    };
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;

      return `${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    };

    const handleResendOtp = () => {
          if (!canResend) {
            return;
          }

      // Call Resend OTP API here

      setTimer(60);
      setCanResend(false);
    };
    
  return (
     <View style={styles.container}>
      <GlobalTopBarDelivery navigation={navigation}
        notificationClick={() => {}}
        text="OTP Verification"
        subtitleText={`#${orderDetail?.order.orderNumber}`}
        isBackVisible={true}
        isOnlineVisible={false}
      />
       <View style={styles.overlay}>
        <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
              paddingBottom: 40,
            }}>
              {/* Customer Information */}
              <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                      Customer Information
                  </Text>
          
                  <View style={styles.customerRow}>
                  <View style={styles.customerLeft}>
                    <Image
                      source={require('../assets/images/customer_image.png')}
                      style={styles.profileImage}
                    />
          
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerName}>
                        {orderDetail?.customer.name}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'center', marginRight: 10, marginTop: 4 }}>
                        <Image style= {[DeliveryGlobalStyles.icon]} source={require('../assets/images/call.png')} />
                        <Text style={styles.smallText}> {orderDetail?.customer.phone}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'flex-start', marginRight: 10, marginTop: 4 }}>
                        <Image style= {[DeliveryGlobalStyles.icon, {marginTop: 2}]} source={require('../assets/images/location.png')} />
                        <Text style={styles.smallText}> {orderDetail?.customer.address.address}</Text>
                      </View>
                    </View>
                  </View>
          
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.iconButton}>
                      <Image style= {[DeliveryGlobalStyles.iconMedium]} source={require('../assets/images/call.png')} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              {/* Put OTP verification content here */}
              {/* Order Summary Strip */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Image
                    source={require('../assets/images/shopping_bag.png')}
                    style={DeliveryGlobalStyles.iconMediumTheme}
                  />
                  <Text style={styles.summaryTitle}>{orderDetail.items.length} Items</Text>
                  <Text style={styles.summaryValue}>{orderDetail.items.reduce((acc, item) => acc + item.quantity, 0)} Qty</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <Image
                    source={require('../assets/images/wallet.png')}
                    style={DeliveryGlobalStyles.iconMediumTheme}
                  />
                  <Text style={styles.summaryTitle}>Order Amount</Text>
                  <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                    ₹{orderDetail.billing.finalAmount.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <Image
                    source={require('../assets/images/payment_status.png')}
                    style={DeliveryGlobalStyles.iconMediumTheme}
                  />
                  <Text style={styles.summaryTitle}>Payment Method</Text>

                  <View style={styles.codBadge}>
                    <Text style={styles.codText}>{orderDetail.billing.paymentStatus}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <Image
                    source={require('../assets/images/clock.png')}
                    style={DeliveryGlobalStyles.iconMediumTheme}
                  />
                  <Text style={styles.summaryTitle}>Estimated Time</Text>
                  <Text style={styles.summaryValueRegular}>{orderDetail.delivery.estimatedDeliveryWindow}</Text>
                </View>
              </View>

              {/* OTP Section */}
              <View style={styles.otpContainer}>
                <View style={styles.otpIconContainer}>
                  <Image
                    source={require('../assets/images/otp_verification.png')}
                    style={styles.otpIcon}
                  />
                </View>

                <Text style={styles.otpTitle}>
                  Enter OTP to Confirm Delivery
                </Text>

                <Text style={styles.otpSubtitle}>
                  Please Enter The 4-Digit OTP Sent To The Customer
                </Text>

                <Text style={styles.otpSubtitle}>
                  To Complete The Delivery.
                </Text>

                {/* OTP Boxes */}
               <View style={styles.otpRow}>
                  {otp.map((value, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        !(index === 0 || otp[index - 1] !== '') && {
                          backgroundColor: '#EFEFEF',
                          borderColor: '#E0E0E0',
                        },
                      ]}
                      value={value}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      editable={
                          index === 0
                            ? otp[1] === ''
                            : index === 1
                            ? otp[2] === '' && otp[0] !== ''
                            : index === 2
                            ? otp[3] === '' && otp[1] !== ''
                            : otp[2] !== ''
                        }
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      selectTextOnFocus
                    />
                  ))}
                </View>
                {/* Info Message */}
                <View style={styles.infoCard}>
                  <Image
                    source={require('../assets/images/info.png')}
                    style={DeliveryGlobalStyles.icon}
                  />

                  <Text style={styles.infoText}>
                    OTP Has Been Sent To Customer's Registered Mobile Number.
                  </Text>
                </View>
                <Text style={styles.resendTitle}>
                  Didn't Receive The OTP?
                </Text>

                {canResend ? (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text
                      style={[
                        styles.resendText,
                        {
                          color: Colors.primary,
                          fontFamily: FontFamily.medium,
                        },
                      ]}
                    >
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resendText}>
                    Resend OTP In{' '}
                    <Text style={{ color: Colors.primary }}>
                      {formatTime(timer)}
                    </Text>
                  </Text>
                )}

                <TouchableOpacity style={styles.verifyButton}>
                  <Text style={styles.verifyButtonText}>
                    Verify & Complete Delivery
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
      </View>
    </View>
    );
}

export default DeliveryOtpVerification;

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

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    },

    cardTitle: {
    fontSize: 20,
    color: Colors.textColor,
    marginBottom: 14,
    fontFamily: FontFamily.medium,
    },
   actionButtons: {
        justifyContent: 'space-between',
        marginLeft: 10,
        alignItems: 'center',
        flexShrink: 0,
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
        fontSize: 16,
        color: Colors.textColor,
        fontFamily: FontFamily.medium,
    },
    smallText: {
        fontSize: 12,
        color: Colors.textBrown,
        fontFamily: FontFamily.regular,
        flexShrink: 1,
}, 
summaryCard: {
  marginTop: 16,
  backgroundColor: '#fff',
  borderRadius: 20,
  flexDirection: 'row',
  paddingVertical: 16,
},

summaryItem: {
  flex: 1,
  alignItems: 'center',
  paddingHorizontal: 4,
},

summaryDivider: {
  width: 1,
  backgroundColor: '#EAEAEA',
},

summaryTitle: {
  fontSize: 11,
  marginTop: 6,
  color: Colors.textColor,
  fontFamily: FontFamily.regular,
  textAlign: 'center',
},

summaryValue: {
  fontSize: 12,
  marginTop: 4,
  color: Colors.textBrown,
  fontFamily: FontFamily.bold,
  textAlign: 'center',
},

summaryValueRegular: {
  fontSize: 12,
  marginTop: 4,
  color: Colors.textBrown,
  fontFamily: FontFamily.regular,
  textAlign: 'center',
},

otpContainer: {
  marginTop: 20,
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 20,
  alignItems: 'center',
},

otpIconContainer: {
  width: 60,
  height: 60,
  borderRadius: 30,
  justifyContent: 'center',
  alignItems: 'center',
},

otpIcon: {
  width: 42,
  height: 42,
  resizeMode: 'contain',
  tintColor: Colors.primary,
},

otpTitle: {
  marginTop: 8,
  fontSize: 24,
  color: Colors.textColor,
  fontFamily: FontFamily.medium,
  textAlign: 'center',
},

otpSubtitle: {
  fontSize: 13,
  color: Colors.textBrown,
  fontFamily: FontFamily.regular,
  textAlign: 'center',
},

otpRow: {
  flexDirection: 'row',
  marginTop: 24,
  marginBottom: 20,
},

otpBox: {
  width: 50,
  height: 50,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#D9D9D9',
  marginHorizontal: 6,
  backgroundColor: '#FAFAFA',
  fontFamily: FontFamily.regular,
  fontSize: 18,
},

infoCard: {
  width: '100%',
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor:Colors.lightOrange,
  borderRadius: 12,
  padding: 12,
},

infoText: {
  flex: 1,
  marginLeft: 8,
  fontSize: 12,
  color: Colors.textBrown,
  fontFamily: FontFamily.regular,
},

resendTitle: {
  marginTop: 16,
  fontSize: 13,
  color: Colors.textColor,
  fontFamily: FontFamily.medium,
},

resendText: {
  marginTop: 4,
  fontSize: 13,
  color: Colors.textBrown,
  fontFamily: FontFamily.regular,
},

verifyButton: {
  marginTop: 22,
  width: '100%',
  height: 52,
  backgroundColor: Colors.primary,
  borderRadius: 26,
  justifyContent: 'center',
  alignItems: 'center',
},

verifyButtonText: {
  color: '#fff',
  fontSize: 16,
  fontFamily: FontFamily.medium,
},

codBadge: {
  marginTop: 4,
  backgroundColor: '#FFF2D8',
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 3,
},

codText: {
  color: Colors.primary,
  fontSize: 11,
  fontFamily: FontFamily.medium,
},
});