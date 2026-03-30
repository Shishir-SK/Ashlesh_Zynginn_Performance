// Data Generators for k6 Framework
// Dynamic, realistic test data generation

import { randomString, randomInt, randomDate, randomItem } from '../utils/helpers.js';

/**
 * Generate unique booking reference
 * @returns {string} unique reference ID
 */
export function generateBookingRef() {
  return `BK-${randomString(8).toUpperCase()}-${Date.now()}`;
}

/**
 * Generate guest details
 * @returns {object} guest information
 */
export function generateGuestDetails() {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'James', 'Mary'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  
  return {
    firstName: randomItem(firstNames),
    lastName: randomItem(lastNames),
    email: `${randomString(8)}@test.com`,
    phone: `+1${randomInt(1000000000, 9999999999)}`,
    age: randomInt(18, 70)
  };
}

/**
 * Generate booking request payload
 * @returns {object} booking request
 */
export function generateBookingRequest() {
  const checkIn = randomDate(1, 30);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + randomInt(1, 7));
  
  return {
    hotelId: randomInt(1, 15),
    branchId: randomInt(1, 10),
    checkInDate: checkIn.toISOString().split('T')[0],
    checkOutDate: checkOut.toISOString().split('T')[0],
    guests: [generateGuestDetails()],
    guestCount: randomInt(1, 4),
    roomCount: randomInt(1, 3),
    specialRequests: randomItem(['', 'Late checkout', 'Early checkin', 'Extra pillows'])
  };
}

/**
 * Generate cart item
 * @returns {object} cart item
 */
export function generateCartItem() {
  return {
    hotelId: randomInt(1, 15),
    roomType: randomItem(['DELUXE', 'PREMIUM', 'STANDARD', 'SUITE']),
    quantity: randomInt(1, 3),
    checkInDate: randomDate(1, 30).toISOString().split('T')[0],
    checkOutDate: randomDate(31, 37).toISOString().split('T')[0]
  };
}

/**
 * Generate cart edit payload
 * @returns {object} cart update
 */
export function generateCartEdit() {
  return {
    quantity: randomInt(1, 5),
    specialRequests: randomItem(['', 'King bed', 'Twin beds', 'Sea view'])
  };
}

/**
 * Generate booking modification
 * @returns {object} modification request
 */
export function generateBookingModification() {
  return {
    checkInDate: randomDate(1, 30).toISOString().split('T')[0],
    guestCount: randomInt(1, 6),
    roomCount: randomInt(1, 4)
  };
}

/**
 * Generate cancellation request
 * @returns {object} cancellation
 */
export function generateCancellationRequest() {
  return {
    reason: randomItem(['Change of plans', 'Found better option', 'Emergency', 'Other']),
    requestedRefund: true
  };
}

/**
 * Generate check-in payload
 * @returns {object} check-in data
 */
export function generateCheckinData() {
  return {
    actualCheckInTime: new Date().toISOString(),
    notes: 'Guest arrived'
  };
}

/**
 * Generate check-out payload
 * @returns {object} check-out data
 */
export function generateCheckoutData() {
  return {
    actualCheckOutTime: new Date().toISOString(),
    roomCondition: randomItem(['Good', 'Excellent', 'Needs cleaning'])
  };
}

/**
 * Generate refund request
 * @returns {object} refund data
 */
export function generateRefundRequest() {
  return {
    amount: randomInt(100, 5000),
    reason: randomItem(['Cancellation', 'Complaint', 'Overcharge']),
    method: randomItem(['original', 'credit_note'])
  };
}

/**
 * Generate add-on request
 * @returns {object} add-on data
 */
export function generateAddOnRequest() {
  return {
    name: randomItem(['Breakfast', 'Airport Transfer', 'Spa Package', 'Late Checkout']),
    price: randomInt(10, 200),
    description: 'Test add-on'
  };
}

/**
 * Generate amenity request
 * @returns {object} amenity data
 */
export function generateAmenityRequest() {
  return {
    name: randomItem(['WiFi', 'Pool', 'Gym', 'Parking', 'Restaurant']),
    icon: 'wifi',
    description: 'Test amenity'
  };
}

/**
 * Generate branch creation request
 * @returns {object} branch data
 */
export function generateBranchRequest() {
  return {
    name: `Branch ${randomString(5)}`,
    address: `${randomInt(1, 999)} Test Street`,
    city: randomItem(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune']),
    state: 'Test State',
    phone: `+91${randomInt(1000000000, 9999999999)}`
  };
}

/**
 * Generate staff invitation
 * @returns {object} staff data
 */
export function generateStaffInvitation() {
  return {
    email: `staff.${randomString(6)}@test.com`,
    firstName: randomItem(['John', 'Jane', 'Mike', 'Sarah']),
    lastName: randomItem(['Smith', 'Doe', 'Johnson']),
    role: randomItem(['receptionist', 'manager', 'admin'])
  };
}
