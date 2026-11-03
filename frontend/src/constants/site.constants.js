/**
 * Suggestions for the site form's Discom field. Only suggestions: any other
 * name can be typed in, so a missing discom never blocks anyone.
 */
export const DISCOM_SUGGESTIONS = [
  'MSEDCL',
  'Adani Electricity Mumbai',
  'Tata Power',
  'BEST',
  'Torrent Power',
  'BESCOM',
  'TNPDCL (TANGEDCO)',
  'BSES Rajdhani',
  'BSES Yamuna',
  'Tata Power-DDL',
  'TGSPDCL',
  'APSPDCL',
  'UGVCL',
  'DGVCL',
  'MGVCL',
  'PGVCL',
  'CESC',
  'WBSEDCL',
  'PSPCL',
  'UHBVN',
  'DHBVN',
  'JVVNL',
  'UPPCL',
  'KSEB',
];

/** The site form's State options — the same list the API accepts (backend/constants/states.js). */
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

/**
 * Suggestions for Consumer category. Tariff categories differ by DISCOM, so
 * any other name can be typed in; categories already in use are offered too.
 */
export const CATEGORY_SUGGESTIONS = [
  'HT Industrial',
  'HT Commercial',
  'HT Public Services',
  'LT Industrial',
  'LT Commercial',
  'LT Residential',
  'LT Public Services',
  'LT Agricultural',
];
