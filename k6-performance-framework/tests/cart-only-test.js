// CART-ONLY PERFORMANCE TEST
// Isolates cart flow performance issues without mixing with other flows

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from '../../lib/enhanced-config.js';
import { 
  random, 
  dataGenerator, 
  validator, 
  urlHelper,
  thinkTime 
} from '../../lib/test-helpers.js';

// Custom metrics for cart flow
export let cartViewRate = new Rate('cart_view_success');
export let cartAddRate = new Rate('cart_add_success');
export let cartUpdateRate = new Rate('cart_update_success');
export let cartCheckoutRate = new Rate('cart_checkout_success');
export let cartResponseTime = new Trend('cart_response_time');
export let cartErrorRate = new Rate('cart_errors');

// Per-endpoint metrics
export let viewApiTime = new Trend('cart_view_api_time');
export let addApiTime = new Trend('cart_add_api_time');
export let updateApiTime = new Trend('cart_update_api_time');
export let checkoutApiTime = new Trend('cart_checkout_api_time');

// Test configuration - Cart focused only
export let options = {
  stages: [
    { duration: '2m', target: 6 },    // Warm up
    { duration: '5m', target: 15 },   // Main load
    { duration: '3m', target: 25 },   // Peak load
    { duration: '1m', target: 0 },    // Cool down
  ],
  discardResponseBodies: false,
  httpDebug: 'none',
  thresholds: {
    // Cart-specific thresholds
    'cart_response_time': ['p(95)<1200', 'p(99)<2000'],
    'cart_view_success': ['rate>0.95'],
    'cart_add_success': ['rate>0.90'],
    'cart_update_success': ['rate>0.90'],
    'cart_checkout_success': ['rate>0.85'],
    'cart_errors': ['rate<0.05'],
    // Standard k6 thresholds
    'http_req_duration': ['p(95)<1500', 'p(99)<2500'],
    'http_req_failed': ['rate<0.05'],
    'http_reqs': ['count>60'],
    // Per-endpoint thresholds
    'cart_view_api_time': ['p(95)<800'],
    'cart_add_api_time': ['p(95)<1500'],
    'cart_update_api_time': ['p(95)<1200'],
    'cart_checkout_api_time': ['p(95)<2000'],
  },
};

// Per-VU state
let vuState = {
  cartItems: [],
  lastCartData: null,
  sessionStartTime: null
};

// Safe request wrapper
function safeRequest(requestFn, maxRetries = 1, errorType = 'unknown') {
  let response = requestFn();
  let attempt = 0;
  
  while (response.status >= 500 && attempt < maxRetries) {
    attempt++;
    if (__VU === 1) console.warn(`Retry ${attempt} for ${response.status} response (${errorType})`);
    sleep(1);
    response = requestFn();
  }
  
  if (response.status >= 400) {
    response.tags = response.tags || {};
    response.tags.error_type = response.status >= 500 ? '5xx' : '4xx';
  }
  
  return response;
}

// Safe JSON parsing
function safeJsonParse(response) {
  try {
    return response.body ? JSON.parse(response.body) : null;
  } catch (error) {
    if (__VU === 1) console.warn(`JSON parse error: ${error.message}`);
    return null;
  }
}

// Initialize test
export function setup() {
  console.log('Starting Cart-Only Performance Test...');
  console.log(`Target API: ${config.BASE_URL}`);
  console.log('Focus: Cart flow performance isolation');
  
  return {
    testStartTime: new Date().toISOString(),
    orgId: config.ORG_ID
  };
}

// Main test function - cart operations only
export default function(data) {
  if (!vuState.sessionStartTime) {
    vuState.sessionStartTime = new Date().toISOString();
  }
  
  group('Cart Flow Test', function () {
    getCart();
    addItemToCart();
    getCartItems();
    maybeUpdateCartItem();
    maybeClearCart();
    maybeCheckout();
  });
  
  // Realistic cart think time
  thinkTime(2, 4);
}

// Get cart details
function getCart() {
  group('Get Cart', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/cart`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetCart_API', operation: 'get_cart' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_cart');
    
    // Use k6 native timing
    viewApiTime.add(response.timings.duration);
    cartResponseTime.add(response.timings.duration);
    
    const body = safeJsonParse(response);
    const success = check(response, {
      'cart retrieved': (r) => r.status >= 200 && r.status < 300,
      'cart response time < 800ms': (r) => r.timings.duration < 800,
      'cart has valid response': (r) => body !== null
    }, { name: 'GetCart_API' });
    
    cartViewRate.add(success);
    cartErrorRate.add(!success);
    
    if (success && body) {
      vuState.lastCartData = body;
    }
    
    sleep(random.intBetween(1, 2));
  });
}

// Add item to cart
function addItemToCart() {
  group('Add Item to Cart', function () {
    const cartData = dataGenerator.cartItem();
    
    const requestFn = () => http.post(`${config.BASE_URL}/cart/items`, cartData, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'AddItemToCart_API', operation: 'add_item' }
    });
    
    const response = safeRequest(requestFn, 1, 'add_item');
    
    // Use k6 native timing
    addApiTime.add(response.timings.duration);
    cartResponseTime.add(response.timings.duration);
    
    const body = safeJsonParse(response);
    const success = check(response, {
      'item added to cart': (r) => r.status >= 200 && r.status < 300,
      'add to cart response time < 1500ms': (r) => r.timings.duration < 1500,
      'cart item has valid response': (r) => body !== null,
      'cart item has ID': (r) => body && (body.id || body.itemId)
    }, { name: 'AddItemToCart_API' });
    
    cartAddRate.add(success);
    cartErrorRate.add(!success);
    
    if (success && body) {
      vuState.cartItems.push({
        id: body.id || body.itemId,
        productId: body.productId || cartData.productId,
        quantity: body.quantity || cartData.quantity,
        price: body.price || cartData.price
      });
    }
    
    sleep(random.intBetween(1, 3));
  });
}

// Get cart items
function getCartItems() {
  group('Get Cart Items', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/cart/items`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetCartItems_API', operation: 'get_cart_items' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_cart_items');
    
    // Use k6 native timing
    viewApiTime.add(response.timings.duration);
    cartResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'cart items retrieved': (r) => r.status >= 200 && r.status < 300,
      'cart items response time < 800ms': (r) => r.timings.duration < 800
    }, { name: 'GetCartItems_API' });
    
    cartViewRate.add(success);
    cartErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Maybe update cart item
function maybeUpdateCartItem() {
  if (vuState.cartItems.length === 0) return;
  
  if (random.intBetween(1, 10) <= 4) { // 40% chance
    group('Update Cart Item', function () {
      const cartItem = vuState.cartItems[0];
      const updateData = dataGenerator.cartEdit();
      
      const requestFn = () => http.put(`${config.BASE_URL}/cart/items/${cartItem.id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'UpdateCartItem_API', operation: 'update_item' }
      });
      
      const response = safeRequest(requestFn, 1, 'update_item');
      
      // Use k6 native timing
      updateApiTime.add(response.timings.duration);
      cartResponseTime.add(response.timings.duration);
      
      const success = check(response, {
        'cart item updated': (r) => r.status >= 200 && r.status < 300,
        'update cart item response time < 1200ms': (r) => r.timings.duration < 1200
      }, { name: 'UpdateCartItem_API' });
      
      cartUpdateRate.add(success);
      cartErrorRate.add(!success);
      
      if (success) {
        cartItem.quantity = updateData.quantity;
      }
      
      sleep(random.intBetween(1, 2));
    });
  }
}

// Maybe clear cart
function maybeClearCart() {
  if (random.intBetween(1, 10) <= 2) { // 20% chance
    group('Clear Cart', function () {
      const requestFn = () => http.delete(`${config.BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'ClearCart_API', operation: 'clear_cart' }
      });
      
      const response = safeRequest(requestFn, 1, 'clear_cart');
      
      const success = check(response, {
        'cart cleared': (r) => r.status >= 200 && r.status < 300,
        'clear cart response time < 1000ms': (r) => r.timings.duration < 1000
      }, { name: 'ClearCart_API' });
      
      cartErrorRate.add(!success);
      
      if (success) {
        vuState.cartItems = [];
        vuState.lastCartData = null;
      }
      
      sleep(random.intBetween(1, 2));
    });
  }
}

// Maybe checkout cart
function maybeCheckoutCart() {
  if (vuState.cartItems.length === 0) return;
  
  if (random.intBetween(1, 10) <= 3) { // 30% chance
    group('Checkout Cart', function () {
      const checkoutData = {
        paymentMethod: 'credit_card',
        shippingAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        billingAddress: 'same_as_shipping'
      };
      
      const requestFn = () => http.post(`${config.BASE_URL}/cart/checkout`, checkoutData, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'CheckoutCart_API', operation: 'checkout_cart' }
      });
      
      const response = safeRequest(requestFn, 1, 'checkout_cart');
      
      // Use k6 native timing
      checkoutApiTime.add(response.timings.duration);
      cartResponseTime.add(response.timings.duration);
      
      const body = safeJsonParse(response);
      const success = check(response, {
        'cart checked out': (r) => r.status >= 200 && r.status < 300,
        'checkout response time < 2000ms': (r) => r.timings.duration < 2000,
        'checkout has valid response': (r) => body !== null,
        'checkout has order ID': (r) => body && (body.orderId || body.id)
      }, { name: 'CheckoutCart_API' });
      
      cartCheckoutRate.add(success);
      cartErrorRate.add(!success);
      
      if (success) {
        // Clear cart after successful checkout
        vuState.cartItems = [];
        vuState.lastCartData = null;
      }
      
      sleep(random.intBetween(2, 4));
    });
  }
}

// Cleanup function
export function teardown(data) {
  console.log('Cart-only test completed.');
  console.log(`Test started at: ${data.testStartTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log(`Cart items processed: ${vuState.cartItems.length}`);
}
