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
    addItemToCart(authData);
    getCartItems(authData);
    maybeUpdateCartItem(authData);
    maybeClearCart(authData);
    maybeCheckout(authData);
  });
}

/**
 * Add item to cart
 */
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
