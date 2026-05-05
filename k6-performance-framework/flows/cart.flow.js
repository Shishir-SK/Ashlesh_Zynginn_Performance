// Cart Flow - Shopping cart operations
// Simulates add-to-cart, update, checkout journey

import { httpClient } from '../core/httpClient.js';
import { recordMetrics, cartCheckoutRate, cartAddRate } from '../core/metrics.js';
import { generateCartItem, generateCartEdit } from '../data/generators.js';
import { randomInt, sleep, group, check } from 'k6';

// VU-level cart state
const vuCartState = {
  items: [],
  isEmpty: true
};

/**
 * Execute cart flow
 * @param {object} authData - authentication tokens
 */
export function cartFlow(authData) {
  group('Cart Flow', () => {
    getCart(authData);
    addItemToCart(authData);
    getCartItems(authData);
    maybeUpdateCartItem(authData);
    maybeDecrementCartItem(authData);
    maybeDeleteCartItem(authData);
    maybeClearCart(authData);
    maybeCheckout(authData);
    getCartWithDates(authData);
    maybeApplyCreditToCart(authData);
  });
}

/**
 * Get cart details
 */
function getCart(authData) {
  // Use correct cart endpoint from API documentation
  const response = httpClient.get(
    '/cart/items',
    authData,
    'user',
    { tags: { name: 'GetCart', flow: 'cart', criticality: 'medium' } }
  );
  
  // Handle null response
  if (!response) {
    console.log('Warning: getCart received null response');
    return;
  }
  
  check(response, {
    'cart retrieved': (r) => r && (r.status === 200 || r.status === 404),
    'get cart response time OK': (r) => r && r.timings && r.timings.duration < 800
  });
  
  if (response && response.timings) {
    recordMetrics(response, 'cart', 800);
  }
  
  // Only sleep if we have a valid response
  if (response) {
    sleep(randomInt(1, 2));
  }
}

/**
 * Get cart with specific dates
 */
function getCartWithDates(authData) {
  if (Math.random() > 0.5) return;
  
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + randomInt(1, 7));
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + randomInt(1, 3));
  
  const response = httpClient.get(
    `/cart/items?checkIn=${checkIn.toISOString().split('T')[0]}&checkOut=${checkOut.toISOString().split('T')[0]}&applyCredit=false`,
    authData,
    'user',
    { tags: { name: 'GetCartWithDates', flow: 'cart', criticality: 'medium' } }
  );
  
  check(response, {
    'cart with dates retrieved': (r) => r.status === 200 || r.status === 404,
    'cart with dates time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'cart', 800);
}

/**
 * Decrement cart item
 */
function maybeDecrementCartItem(authData) {
  if (vuCartState.items.length === 0 || Math.random() > 0.3) return;
  
  const item = randomItem(vuCartState.items);
  
  const response = httpClient.delete(
    `/cart/items/${item.id}/decrement`,
    authData,
    'user',
    { tags: { name: 'DecrementCartItem', flow: 'cart', criticality: 'medium' } }
  );
  
  check(response, {
    'cart item decremented': (r) => r.status === 200,
    'decrement response time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'cart', 800);
}

/**
 * Delete cart item
 */
function maybeDeleteCartItem(authData) {
  if (vuCartState.items.length === 0 || Math.random() > 0.4) return;
  
  const item = randomItem(vuCartState.items);
  
  const response = httpClient.delete(
    `/cart/items/${item.id}`,
    authData,
    'user',
    { tags: { name: 'DeleteCartItem', flow: 'cart', criticality: 'medium' } }
  );
  
  check(response, {
    'cart item deleted': (r) => r.status === 200,
    'delete response time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'cart', 800);
}

/**
 * Apply credit to cart
 */
function maybeApplyCreditToCart(authData) {
  if (vuCartState.items.length === 0 || Math.random() > 0.3) return;
  
  const response = httpClient.get(
    '/cart/items?applyCredit=true',
    authData,
    'user',
    { tags: { name: 'ApplyCreditToCart', flow: 'cart', criticality: 'low' } }
  );
  
  check(response, {
    'credit applied to cart': (r) => r.status === 200 || r.status === 404,
    'apply credit time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'cart', 800);
}
function addItemToCart(authData) {
  const cartData = generateCartItem();
  
  const response = httpClient.post(
    '/cart/items',
    cartData,
    authData,
    'user',
    { tags: { name: 'AddToCart', flow: 'cart', criticality: 'high' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 201;
  
  check(response, {
    'item added to cart': (r) => isSuccess,
    'add to cart response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'cart', 1000);
  cartAddRate.add(isSuccess);
  
  if (isSuccess) {
    try {
      const body = response.json();
      if (body.cartItemId) {
        vuCartState.items.push(body.cartItemId);
        vuCartState.isEmpty = false;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  sleep(randomInt(1, 3));
}

/**
 * Get cart items
 */
function getCartItems(authData) {
  const response = httpClient.get(
    '/cart/items',
    authData,
    'user',
    { tags: { name: 'GetCartItems', flow: 'cart', criticality: 'medium' } }
  );
  
  check(response, {
    'cart items retrieved': (r) => r.status === 200,
    'get cart response time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'cart', 800);
  sleep(randomInt(1, 2));
}

/**
 * Update cart item (occasionally)
 */
function maybeUpdateCartItem(authData) {
  if (vuCartState.items.length === 0 || Math.random() > 0.5) {
    return;
  }
  
  const cartItemId = vuCartState.items[randomInt(0, vuCartState.items.length - 1)];
  const updateData = generateCartEdit();
  
  const response = httpClient.put(
    `/cart/items/${cartItemId}`,
    updateData,
    authData,
    'user',
    { tags: { name: 'UpdateCartItem', flow: 'cart', criticality: 'medium' } }
  );
  
  check(response, {
    'cart item updated': (r) => r.status === 200,
    'update cart response time OK': (r) => r.timings.duration < 600
  });
  
  recordMetrics(response, 'cart', 600);
  sleep(randomInt(1, 2));
}

/**
 * Clear cart (occasionally)
 */
function maybeClearCart(authData) {
  if (vuCartState.isEmpty || Math.random() > 0.1) {
    return;
  }
  
  const response = httpClient.delete(
    '/cart',
    authData,
    'user',
    { tags: { name: 'ClearCart', flow: 'cart', criticality: 'low' } }
  );
  
  check(response, {
    'cart cleared': (r) => r.status === 200 || r.status === 204,
    'clear cart response time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'cart', 800);
  
  if (response.status === 200 || response.status === 204) {
    vuCartState.items = [];
    vuCartState.isEmpty = true;
  }
  
  sleep(randomInt(1, 2));
}

/**
 * Checkout (occasionally, only if cart has items)
 */
function maybeCheckout(authData) {
  if (vuCartState.isEmpty || Math.random() > 0.3) {
    return;
  }
  
  const response = httpClient.post(
    '/cart/checkout',
    null,
    authData,
    'user',
    { tags: { name: 'CartCheckout', flow: 'cart', criticality: 'critical' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 201;
  
  check(response, {
    'checkout initiated': (r) => isSuccess,
    'checkout response time OK': (r) => r.timings.duration < 3000
  });
  
  recordMetrics(response, 'cart', 3000);
  cartCheckoutRate.add(isSuccess);
  
  if (isSuccess) {
    vuCartState.items = [];
    vuCartState.isEmpty = true;
  }
  
  sleep(randomInt(2, 5));
}
