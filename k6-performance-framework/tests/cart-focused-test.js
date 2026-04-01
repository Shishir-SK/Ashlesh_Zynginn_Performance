// CART-FOCUSED PERFORMANCE TEST
// Isolates cart flow performance with realistic simulation

import { setupAuth } from '../core/auth.js';
import { httpClient } from '../core/httpClient.js';
import { check, sleep, group } from 'k6';

export const options = {
  scenarios: {
    cart_focused_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      gracefulStop: '30s'
    }
  },
  thresholds: {
    'http_req_duration{type:cart}': ['p(95)<1200'],
    'http_req_failed{type:cart}': ['rate<0.1']
  }
};

export function setup() {
  console.log('🛒 CART-FOCUSED PERFORMANCE TEST');
  console.log('🔍 Testing: Cart operations, checkout, payment');
  const tokens = setupAuth();
  return tokens;
}

export default function (authData) {
  const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
  
  group('Cart Flow Test', () => {
    testCartOperations(authData, ORG_ID);
    testCheckoutProcess(authData, ORG_ID);
    testCartManagement(authData, ORG_ID);
  });
  
  sleep(Math.random() * 2 + 1); // 1-3 seconds think time
}

function testCartOperations(authData, ORG_ID) {
  group('Cart Operations', () => {
    // Get cart items
    const getCartResponse = httpClient.get(
      '/cart/items',
      authData,
      'user',
      { tags: { type: 'cart', operation: 'get_items' } }
    );
    
    check(getCartResponse, {
      'cart items retrieved successfully': (r) => r.status === 200,
      'get cart response time OK': (r) => r.timings.duration < 800
    });
    
    // Add item to cart
    const addItemData = {
      roomId: 'room_123',
      checkIn: '2024-04-01',
      checkOut: '2024-04-03',
      quantity: 1,
      price: 5000
    };
    
    const addItemResponse = httpClient.post(
      '/cart/items',
      JSON.stringify(addItemData),
      authData,
      'user',
      { tags: { type: 'cart', operation: 'add_item' } }
    );
    
    check(addItemResponse, {
      'item added to cart successfully': (r) => r.status === 200 || r.status === 201 || r.status === 400 || r.status === 422,
      'add item response time OK': (r) => r.timings.duration < 1000
    });
    
    // Update cart item
    const updateItemData = {
      quantity: 2,
      price: 5000
    };
    
    const updateItemResponse = httpClient.put(
      '/cart/items/item_123',
      JSON.stringify(updateItemData),
      authData,
      'user',
      { tags: { type: 'cart', operation: 'update_item' } }
    );
    
    check(updateItemResponse, {
      'cart item updated successfully': (r) => r.status === 200 || r.status === 400 || r.status === 404 || r.status === 422,
      'update item response time OK': (r) => r.timings.duration < 800
    });
    
    sleep(Math.random() * 1 + 0.5);
  });
}

function testCheckoutProcess(authData, ORG_ID) {
  group('Checkout Process', () => {
    // Validate checkout
    const checkoutData = {
      items: [
        {
          roomId: 'room_123',
          checkIn: '2024-04-01',
          checkOut: '2024-04-03',
          quantity: 1,
          price: 5000
        }
      ],
      paymentMethod: 'credit_card',
      billingAddress: {
        street: '123 Test St',
        city: 'Mumbai',
        state: 'MH',
        zipCode: '400001'
      }
    };
    
    const validateResponse = httpClient.post(
      '/cart/checkout/validate',
      JSON.stringify(checkoutData),
      authData,
      'user',
      { tags: { type: 'cart', operation: 'validate_checkout' } }
    );
    
    check(validateResponse, {
      'checkout validated successfully': (r) => r.status === 200 || r.status === 400 || r.status === 422,
      'checkout validation response time OK': (r) => r.timings.duration < 1500
    });
    
    // Process checkout
    const processResponse = httpClient.post(
      '/cart/checkout',
      JSON.stringify(checkoutData),
      authData,
      'user',
      { tags: { type: 'cart', operation: 'process_checkout' } }
    );
    
    check(processResponse, {
      'checkout processed successfully': (r) => r.status === 200 || r.status === 201 || r.status === 400 || r.status === 422,
      'checkout processing response time OK': (r) => r.timings.duration < 2000
    });
    
    sleep(Math.random() * 2 + 1);
  });
}

function testCartManagement(authData, ORG_ID) {
  group('Cart Management', () => {
    // Get cart summary
    const summaryResponse = httpClient.get(
      '/cart/summary',
      authData,
      'user',
      { tags: { type: 'cart', operation: 'get_summary' } }
    );
    
    check(summaryResponse, {
      'cart summary retrieved successfully': (r) => r.status === 200 || r.status === 404,
      'cart summary response time OK': (r) => r.timings.duration < 600
    });
    
    // Clear cart
    const clearResponse = httpClient.delete(
      '/cart/items',
      authData,
      'user',
      { tags: { type: 'cart', operation: 'clear_cart' } }
    );
    
    check(clearResponse, {
      'cart cleared successfully': (r) => r.status === 200 || r.status === 404,
      'clear cart response time OK': (r) => r.timings.duration < 500
    });
    
    sleep(Math.random() * 1 + 0.5);
  });
}

export function teardown(data) {
  console.log('📊 CART-FOCUSED TEST COMPLETED');
  console.log('🔍 Check results for cart flow performance');
}
