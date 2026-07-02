export default class GlobalApi {
  //static baseUrl = 'http://192.168.1.18:7001/';
  // Fallback for public IP: 'http://182.73.216.93:7001/' (ensure server is accessible)
  static socket_url = 'http://182.73.216.93:7005/delivery-tracking'; //Production
  //static socket_url = 'http://192.168.1.18:7005/delivery-tracking'; //Local
  // static baseUrl = 'http://192.168.1.18:7001/'; // local
  static baseUrl = 'http://182.73.216.93:7001/'; // production
  static locationIqAccessToken = 'pk.dc24ecf6df9ec0756f27b8d2a478cd72';
}
