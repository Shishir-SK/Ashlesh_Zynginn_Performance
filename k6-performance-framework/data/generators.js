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
  
  // Generate proper UUIDs for hotelId and branchId
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  return {
    hotelId: generateUUID(),
    branchId: generateUUID(),
    checkIn: checkIn.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
    guests: [generateGuestDetails()],
    guestCount: randomInt(1, 4),
    roomCount: randomInt(1, 3),
    specialRequests: randomItem(['', 'Late checkout', 'Early checkin', 'Extra pillows']),
    // Required fields according to API documentation
    adults: randomInt(1, 4),
    children: randomInt(0, 2),
    roomsBooked: randomInt(1, 3),
    childrenAges: randomInt(0, 2) > 0 ? [randomInt(1, 17)] : [],
    addOns: [], // Empty array for addOns as it's required
    applyCredit: Math.random() > 0.5
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

/**
 * Generate payment request payload
 * @returns {object} payment request
 */
export function generatePaymentRequest() {
  return {
    amount: randomInt(100, 5000) * 100, // Convert to cents
    currency: randomItem(['USD', 'EUR', 'GBP', 'INR']),
    paymentMethod: randomItem(['credit_card', 'debit_card', 'upi', 'wallet']),
    paymentType: randomItem(['booking_payment', 'deposit', 'full_payment']),
    description: `Payment for booking ${randomString(8).toUpperCase()}`,
    metadata: {
      source: 'web',
      userAgent: 'k6-test',
      sessionId: randomString(16)
    },
    cardDetails: {
      number: '4111111111111111', // Test card number
      expiryMonth: randomInt(1, 12).toString().padStart(2, '0'),
      expiryYear: (new Date().getFullYear() + randomInt(1, 5)).toString(),
      cvv: randomInt(100, 999).toString()
    }
  };
}

/**
 * Generate billing request payload
 * @returns {object} billing request
 */
export function generateBillingRequest() {
  return {
    invoiceType: randomItem(['booking', 'service', 'amenity', 'penalty']),
    dueDate: new Date(Date.now() + randomInt(7, 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [
      {
        description: randomItem(['Room charges', 'Service fees', 'Amenities', 'Late checkout']),
        quantity: randomInt(1, 5),
        unitPrice: randomInt(50, 500) * 100,
        taxRate: randomInt(5, 25)
      }
    ],
    customerInfo: {
      name: `${randomString(5)} Customer`,
      email: `billing.${randomString(6)}@test.com`,
      phone: `+1${randomInt(1000000000, 9999999999)}`
    },
    notes: randomItem(['', 'Urgent payment required', 'Payment due soon', 'Standard billing']),
    metadata: {
      generatedBy: 'system',
      template: 'standard'
    }
  };
}

/**
 * Generate subscription request payload
 * @returns {object} subscription request
 */
export function generateSubscriptionRequest() {
  return {
    planType: randomItem(['basic', 'premium', 'enterprise']),
    billingCycle: randomItem(['monthly', 'yearly']),
    features: randomItem([
      ['room_booking', 'cancellation'],
      ['room_booking', 'cancellation', 'priority_support'],
      ['room_booking', 'cancellation', 'priority_support', 'analytics']
    ]),
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: randomItem([true, false]),
    metadata: {
      source: 'web_signup',
      campaign: randomItem(['spring_sale', 'new_user', 'upgrade_offer'])
    }
  };
}

/**
 * Generate test data for various operations
 * @returns {object} test data generators
 */
export function generateTestData() {
  return {
    searchParameters: () => ({
      location: randomItem(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']),
      checkin: '2024-04-01',
      checkout: '2024-04-03',
      guests: randomInt(1, 4)
    }),
    
    bookingData: () => ({
      hotelId: randomInt(1, 10),
      checkIn: '2024-04-01',
      checkOut: '2024-04-03',
      guests: randomInt(1, 4),
      rooms: randomInt(1, 2),
      guestDetails: generateGuestDetails()
    }),
    
    cartItem: () => ({
      roomId: randomInt(1, 20),
      quantity: 1,
      checkIn: '2024-04-01',
      checkOut: '2024-04-03'
    })
  };
}

/**
 * Generate webhook data for payment processing
 * @returns {object} webhook payload
 */
export function generateWebhookData() {
  const eventTypes = ['payment.success', 'payment.failed', 'payment.pending', 'refund.processed', 'refund.failed'];
  
  return {
    eventId: `EVT-${randomString(12).toUpperCase()}`,
    eventType: randomItem(eventTypes),
    timestamp: new Date().toISOString(),
    data: {
      paymentId: `PAY-${randomString(10).toUpperCase()}`,
      amount: randomInt(100, 5000),
      currency: 'USD',
      status: randomItem(['success', 'failed', 'pending']),
      metadata: {
        source: 'k6-test',
        testRun: Date.now()
      }
    },
    signature: `sig_${randomString(32)}`
  };
}
